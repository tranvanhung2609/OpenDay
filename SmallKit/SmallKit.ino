#define DEBUG

#include "espConfig.h"         // Thư viện cấu hình Wi-Fi và ESP
#include <LiquidCrystal_I2C.h> // Thư viện điều khiển LCD I2C
#include <PubSubClient.h>      // Thư viện MQTT
#include <ArduinoJson.h>       // Thư viện xử lý JSON
#include <DHT.h>
#include <Wire.h> // Thư viện giao tiếp I2C

//-------------------- CẤU HÌNH --------------------//

// Cấu hình MQTT Broker
const char *MQTT_SERVER = "14.225.255.177";
const char *MQTT_USERNAME = "admin";
const char *MQTT_PASSWORD = "admin";
const int MQTT_PORT = 1883;

// Khai báo thông tin thiết bị - sẽ được cập nhật từ cấu hình
String DEVICE_NAME = "";
String DEVICE_ID = "";
String MQTT_COMMAND_TOPIC = "";
const char *MQTT_DATA_TOPIC = "iot/data";

// Cấu hình LCD I2C (địa chỉ 0x27, kích thước 16x2)
// Nối dây LCD: SDA -> D2 (GPIO4), SCL -> D1 (GPIO5)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Khai báo MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

//-------------------- ĐỊNH NGHĨA GPIO --------------------//

// Cảm biến DHT - GPIO tương thích với cả ESP32 và ESP8266
#ifdef ESP32
#define DHTPIN 2 // ESP32: GPIO2
#else
#define DHTPIN 2 // ESP8266: GPIO2 (D4 trên NodeMCU)
#endif
#define DHTTYPE DHT11 // Sử dụng DHT11
DHT dht(DHTPIN, DHTTYPE);

// Cảm biến khí gas
#ifdef ESP32
#define GAS_SENSOR_PIN 36 // ESP32: GPIO36 (ADC1_CH0)
#else
#define GAS_SENSOR_PIN A0 // ESP8266: A0
#endif

// Điều khiển LED và Buzzer
#ifdef ESP32
#define LED_PIN 14    // ESP32: GPIO14
#define BUZZER_PIN 12 // ESP32: GPIO12
#else
#define LED_PIN 14    // ESP8266: GPIO14 (D5 trên NodeMCU)
#define BUZZER_PIN 12 // ESP8266: GPIO12 (D6 trên NodeMCU)
#endif

// Ngưỡng cảnh báo khí gas
const int GAS_THRESHOLD = 500; // Điều chỉnh giá trị ngưỡng theo yêu cầu
// Thời gian blink cho buzzer (ms)
const unsigned long BUZZER_INTERVAL = 500;

//-------------------- CẤU HÌNH TIMING --------------------//
const unsigned long DATA_UPDATE_INTERVAL = 5000; // Cập nhật dữ liệu mỗi 5 giây
const unsigned long DHT_READ_DELAY = 2000;       // Delay giữa các lần đọc DHT
const unsigned long MQTT_RETRY_DELAY = 5000;     // Delay giữa các lần retry MQTT
const int MQTT_MAX_RETRIES = 5;                  // Số lần retry tối đa

//-------------------- BIẾN TOÀN CỤC --------------------//
unsigned long lastDataUpdate = 0;
unsigned long lastDHTRead = 0;
unsigned long lastBuzzerToggle = 0;
bool buzzerState = false;
bool lastGasAlert = false;
bool mqttConnected = false;

// Cấu trúc dữ liệu cảm biến
struct SensorData
{
  float temperature = 0.0;
  float humidity = 0.0;
  int gasValue = 0;
  bool isValid = false;
  unsigned long lastUpdate = 0;
};

SensorData currentData;

// Pre-allocated JSON document để tránh tạo mới liên tục
StaticJsonDocument<512> jsonDoc;

//-------------------- HÀM TIỆN ÍCH --------------------//

// Hàm chuyển đổi device name thành device ID
String generateDeviceId(const String &deviceName)
{
  String deviceId = deviceName;
  deviceId.toLowerCase();

  // Thay thế dấu cách bằng dấu gạch dưới
  for (int i = 0; i < deviceId.length(); i++)
  {
    if (deviceId[i] == ' ')
    {
      deviceId[i] = '_';
    }
  }

  return deviceId;
}

// Hàm cập nhật thông tin thiết bị từ cấu hình
void updateDeviceInfo()
{
  // Kiểm tra nếu chưa có cấu hình device name, tạo tên ngẫu nhiên
  if (strlen(configStore.device_name) == 0)
  {
    String randomDeviceName = generateRandomDeviceName();
    copyString(randomDeviceName, configStore.device_name);
    configSave();
    Serial.print("Generated random device name: ");
    Serial.println(randomDeviceName);
  }

  DEVICE_NAME = String(configStore.device_name);
  DEVICE_ID = generateDeviceId(DEVICE_NAME);
  MQTT_COMMAND_TOPIC = "iot/command/" + DEVICE_ID;

  Serial.println("Device Info Updated:");
  Serial.print("Device Name: ");
  Serial.println(DEVICE_NAME);
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("MQTT Command Topic: ");
  Serial.println(MQTT_COMMAND_TOPIC);
}

//-------------------- HÀM XỬ LÝ CẢM BIẾN --------------------//

// Hàm lấy dữ liệu từ cảm biến DHT với cache để tránh đọc quá nhanh
bool getDHTData(float &temperature, float &humidity)
{
  unsigned long currentTime = millis();

  // Chỉ đọc DHT sau mỗi 2 giây để tránh lỗi
  if (currentTime - lastDHTRead < DHT_READ_DELAY)
  {
    temperature = currentData.temperature;
    humidity = currentData.humidity;
    return currentData.isValid;
  }

  lastDHTRead = currentTime;

  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  // Kiểm tra nếu đọc không thành công
  if (isnan(temperature) || isnan(humidity))
  {
    Serial.println("Lỗi đọc dữ liệu từ DHT!");
    temperature = currentData.temperature; // Giữ giá trị cũ
    humidity = currentData.humidity;
    return false;
  }

  // Cập nhật cache
  currentData.temperature = temperature;
  currentData.humidity = humidity;
  currentData.isValid = true;
  currentData.lastUpdate = currentTime;

  return true;
}

// Hàm lấy dữ liệu cảm biến gas (giá trị analog) với smoothing
int getGasValue()
{
  static int lastGasValue = 0;
  int gasValue = analogRead(GAS_SENSOR_PIN);

  // Simple smoothing để giảm noise
  gasValue = (gasValue + lastGasValue) / 2;
  lastGasValue = gasValue;

  currentData.gasValue = gasValue;
  return gasValue;
}

// Hàm điều khiển LED
void setLed(bool state)
{
  digitalWrite(LED_PIN, state ? HIGH : LOW);
  Serial.print("Đèn LED đã ");
  Serial.println(state ? "bật" : "tắt");
}

//-------------------- HÀM CẢNH BÁO GAS --------------------//

// Hàm cảnh báo khi giá trị gas vượt ngưỡng
// Buzzer sẽ nháy theo chu kỳ BUZZER_INTERVAL
void handleGasAlert(int gasValue)
{
  bool gasAlert = (gasValue >= GAS_THRESHOLD);
  unsigned long currentTime = millis();

  if (gasAlert)
  {
    // Chỉ in thông báo khi trạng thái thay đổi
    if (!lastGasAlert)
    {
      Serial.println("Cảnh báo: Gas vượt ngưỡng, Buzzer nháy!");
      lastGasAlert = true;
    }

    // Nếu đã đủ thời gian blink, đảo trạng thái của buzzer
    if (currentTime - lastBuzzerToggle >= BUZZER_INTERVAL)
    {
      lastBuzzerToggle = currentTime;
      buzzerState = !buzzerState;
      digitalWrite(BUZZER_PIN, buzzerState ? HIGH : LOW);
    }
  }
  else
  {
    // Nếu giá trị gas bình thường thì tắt buzzer
    if (lastGasAlert)
    {
      Serial.println("Gas trở về mức bình thường");
      lastGasAlert = false;
    }
    digitalWrite(BUZZER_PIN, LOW);
    buzzerState = false;
  }
}

//-------------------- HÀM HIỂN THỊ --------------------//

// Hàm hiển thị dữ liệu lên LCD 16x2
// Dòng 1: Hiển thị tên thiết bị
// Dòng 2: Hiển thị nhiệt độ và độ ẩm
void displayDataOnLCD(float temperature, float humidity, int ledState)
{
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(DEVICE_NAME);

  lcd.setCursor(9, 0);
  lcd.print("Led:");
  lcd.print(ledState);

  lcd.setCursor(0, 1);
  lcd.print("T:");
  lcd.print(temperature, 1);
  lcd.print("C H:");
  lcd.print(humidity, 1);
  lcd.print("%");
}

//-------------------- HÀM GỬI DỮ LIỆU MQTT --------------------//

// Hàm gửi dữ liệu cảm biến lên MQTT Broker
// Gửi dữ liệu theo định dạng JSON mà backend mong đợi
void sendDataToMQTT(float temperature, float humidity, int gasValue, int ledState, int buzzerState)
{
  // Clear document trước khi sử dụng
  jsonDoc.clear();

  // Thông tin thiết bị
  jsonDoc["id"] = DEVICE_ID;                // deviceId
  jsonDoc["name"] = DEVICE_NAME;            // deviceName
  jsonDoc["w"] = WiFi.SSID();               // deviceWifi
  jsonDoc["i"] = WiFi.localIP().toString(); // deviceIp
  jsonDoc["b"] = MQTT_SERVER;               // deviceBroker
  jsonDoc["t"] = MQTT_COMMAND_TOPIC;        // deviceTopic

  // Dữ liệu cảm biến (ss = sensors)
  JsonObject sensors = jsonDoc.createNestedObject("ss");
  sensors["temp"] = temperature;    // temperature
  sensors["hum"] = humidity;        // humidity
  sensors["lgt"] = 0.0;             // light (giả sử chưa có cảm biến ánh sáng)
  sensors["gas"] = (float)gasValue; // gas

  // Trạng thái thiết bị (stt = status)
  JsonObject status = jsonDoc.createNestedObject("stt");
  status["led"] = ledState;    // led
  status["fan"] = 0;           // fan
  status["alt"] = 0;           // alertLed
  status["bzr"] = buzzerState; // buzzer
  status["sv"] = 0;            // servo

  String payload;
  serializeJson(jsonDoc, payload);

  if (client.publish(MQTT_DATA_TOPIC, payload.c_str()))
  {
    Serial.println("Data sent to MQTT successfully");
  }
  else
  {
    Serial.println("Failed to send data to MQTT");
  }

#ifdef DEBUG
  Serial.println("Data sent to MQTT:");
  Serial.println(payload);
#endif
}

//-------------------- MQTT CALLBACK & RECONNECT --------------------//

void callback(char *topic, byte *payload, unsigned int length)
{
  // Chuyển payload thành chuỗi, đảm bảo kết thúc chuỗi
  char messageBuff[256];
  if (length >= sizeof(messageBuff))
  {
    length = sizeof(messageBuff) - 1;
  }
  memcpy(messageBuff, payload, length);
  messageBuff[length] = '\0';

  Serial.println("=== MQTT Callback ===");
  Serial.print("Topic: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  Serial.println(messageBuff);

  // Nếu nhận lệnh điều khiển LED từ topic command
  if (String(topic) == MQTT_COMMAND_TOPIC)
  {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, messageBuff);
    if (!error)
    {
      int newLed = doc["led"] | 0;
      setLed(newLed);
    }
    else
    {
      Serial.println("JSON không hợp lệ!");
    }
  }
}

void reconnectMQTT()
{
  int retryCount = 0;

  while (!client.connected() && retryCount < MQTT_MAX_RETRIES)
  {
    Serial.print("Kết nối lại MQTT...");
    if (client.connect(DEVICE_ID.c_str(), MQTT_USERNAME, MQTT_PASSWORD))
    {
      Serial.println("Connected.");
      // Đăng ký topic nhận lệnh
      if (client.subscribe(MQTT_COMMAND_TOPIC.c_str()))
      {
        Serial.println("Subscribed to command topic");
        mqttConnected = true;
      }
      else
      {
        Serial.println("Failed to subscribe");
        mqttConnected = false;
      }
      return;
    }
    else
    {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry sau 5 giây...");
      delay(MQTT_RETRY_DELAY);
      retryCount++;
    }
  }

  if (retryCount >= MQTT_MAX_RETRIES)
  {
    Serial.println("MQTT connection failed after max retries");
    mqttConnected = false;
  }
}

//-------------------- SETUP & LOOP --------------------//

void setup()
{
  Serial.begin(115200); // Khởi tạo Serial chính
  while (!Serial)
  {
    delay(10);
  }

  espConfig.begin(); // Bắt đầu cấu hình ESP

  // Cập nhật thông tin thiết bị từ cấu hình
  updateDeviceInfo();

  // Khởi tạo giao tiếp I2C cho LCD với chân SDA = D2, SCL = D1
  Wire.begin();

  // Khởi tạo LCD 16x2
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print(DEVICE_NAME);

  // Cấu hình các chân GPIO
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Khởi tạo cảm biến DHT
  dht.begin();

  // Cấu hình MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);

  Serial.println("System initialized.");
}

void loop()
{
  espConfig.run(); // Kiểm tra trạng thái Wi-Fi
  app_loop();      // Chạy vòng lặp chính của ứng dụng
  client.loop();   // Xử lý vòng lặp MQTT
}

void app_loop()
{
  if (!espState::is(MODE_RUNNING))
  {
    return;
  }

  // Xử lý kết nối MQTT
  if (!client.connected())
  {
    if (mqttConnected)
    {
      mqttConnected = false;
      Serial.println("MQTT connection lost");
    }
    reconnectMQTT();
    return;
  }

  unsigned long currentTime = millis();

  // Cập nhật dữ liệu theo chu kỳ
  if (currentTime - lastDataUpdate >= DATA_UPDATE_INTERVAL)
  {
    lastDataUpdate = currentTime;

    // Lấy dữ liệu từ cảm biến DHT
    float temperature, humidity;
    bool dhtValid = getDHTData(temperature, humidity);

    // Lấy dữ liệu cảm biến gas
    int gasValue = getGasValue();

    // Lấy trạng thái LED và Buzzer hiện tại
    int ledState = digitalRead(LED_PIN);
    int buzzerState = digitalRead(BUZZER_PIN);

    // Hiển thị dữ liệu lên LCD
    displayDataOnLCD(temperature, humidity, ledState);

    // Gửi dữ liệu cảm biến lên MQTT
    sendDataToMQTT(temperature, humidity, gasValue, ledState, buzzerState);
  }

  // Cảnh báo gas: nếu giá trị gas vượt ngưỡng, buzzer sẽ nháy
  int currentGas = getGasValue();
  handleGasAlert(currentGas);
}
