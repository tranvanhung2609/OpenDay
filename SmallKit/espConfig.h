extern "C"
{
  void app_loop();
}

#ifdef DEBUG
#define dprint(...) Serial.print(__VA_ARGS__)
#define dprintln(...) Serial.println(__VA_ARGS__)
#else
#define dprint(...)
#define dprintln(...)
#endif

#ifdef ESP32
#include <WiFi.h>
#include <WebServer.h>
WebServer webServer(80);
#else
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
ESP8266WebServer webServer(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;
#endif

#include "configForm.h"
#include <EEPROM.h>
#define EEPROM_CONFIG_START 0 // Starting address to store config
#include <Ticker.h>
Ticker blinker;
#define btSetup 0   // 0
#define ledSignal 2 // 2
volatile bool btSetupPressed = false;
volatile uint32_t btSetupPressTime = -1;
volatile uint32_t blinkTime = millis();
#define btSetupHoldTime 10000
#define WIFI_NET_CONNECT_TIMEOUT 50000
#define WIFI_MAX_RETRIES 500

static int connectNetRetries = WIFI_MAX_RETRIES;

// Hàm tạo tên thiết bị ngẫu nhiên
String generateRandomDeviceName()
{
// Sử dụng chip ID để tạo số ngẫu nhiên
#ifdef ESP32
  uint32_t chipId = ESP.getEfuseMac() >> 32; // ESP32 sử dụng getEfuseMac()
#else
  uint32_t chipId = ESP.getChipId(); // ESP8266 sử dụng getChipId()
#endif

  uint16_t randomNum = (chipId >> 16) ^ (chipId & 0xFFFF);

  // Tạo tên với format: "Device_XXXX" (XXXX là số hex 4 chữ số)
  String deviceName = "NODE_";
  if (randomNum < 0x1000)
  {
    deviceName += "0";
  }
  deviceName += String(randomNum, HEX);
  deviceName.toUpperCase();

  return deviceName;
}

// Hàm tạo tên AP ngẫu nhiên
String generateRandomAPName()
{
// Sử dụng chip ID để tạo số ngẫu nhiên
#ifdef ESP32
  uint32_t chipId = ESP.getEfuseMac() >> 32; // ESP32 sử dụng getEfuseMac()
#else
  uint32_t chipId = ESP.getChipId(); // ESP8266 sử dụng getChipId()
#endif

  uint16_t randomNum = (chipId >> 16) ^ (chipId & 0xFFFF);

  // Tạo tên với format: "Gateway_XXXX" (XXXX là số hex 4 chữ số)
  String apName = "OpenDay";
  // if (randomNum < 0x1000)
  // {
  //   apName += "0";
  // }
  // apName += String(randomNum, HEX);
  // apName.toUpperCase();

  return apName;
}

struct ConfigStore
{
  uint8_t flags;
  char device_name[32];
  char ssid_sta[34];
  char pass_sta[64];
} __attribute__((packed));
ConfigStore configStore;

// Template function để copy string
template <typename T, int size>
void copyString(const String &s, T (&arr)[size])
{
  s.toCharArray(arr, size);
}

// Tạo config mặc định với tên ngẫu nhiên
ConfigStore getDefaultConfig()
{
  ConfigStore defaultConfig;
  defaultConfig.flags = 0x00;

  // Tạo tên thiết bị ngẫu nhiên
  String randomDeviceName = generateRandomDeviceName();
  copyString(randomDeviceName, defaultConfig.device_name);

  defaultConfig.ssid_sta[0] = '\0';
  defaultConfig.pass_sta[0] = '\0';

  return defaultConfig;
}

void restartMCU()
{
  ESP.restart();
  delay(10000);
  while (1)
  {
  };
}

enum State
{
  MODE_WAIT_CONFIG,
  MODE_CONFIGURING,
  MODE_CONNECTING_NET,
  MODE_RUNNING,
  MODE_SWITCH_TO_STA,
  MODE_RESET_CONFIG,
  MODE_ERROR,

  MODE_MAX_VALUE
};
const char *StateStr[MODE_MAX_VALUE + 1] = {
    "WAIT_CONFIG",
    "CONFIGURING",
    "CONNECTING_NET",
    "RUNNING",
    "SWITCH_TO_STA",
    "RESET_CONFIG",
    "ERROR",

    "INIT"};
namespace espState
{
  volatile State state = MODE_MAX_VALUE;

  State get()
  {
    return state;
  }
  bool is(State m)
  {
    return (state == m);
  }
  void set(State m);
};
inline void espState::set(State m)
{
  if (state != m && m < MODE_MAX_VALUE)
  {
    dprintln(String(StateStr[state]) + " => " + StateStr[m]);
    state = m;
  }
}

bool configSave()
{
  EEPROM.put(EEPROM_CONFIG_START, configStore);
#ifdef ESP32
  EEPROM.commit();
#else
  EEPROM.commit();
#endif
  dprintln("Configuration stored to flash");
  return true;
}

void configLoad()
{
  dprintln("Load Configuration stored");
  memset(&configStore, 0, sizeof(configStore));
  EEPROM.get(EEPROM_CONFIG_START, configStore);
  dprintln("Flags: " + String(configStore.flags));
  dprintln("Device Name: " + String(configStore.device_name));
  dprintln("WiFi SSID: " + String(configStore.ssid_sta));
  dprintln("Password: " + String(configStore.pass_sta));
}

bool configInit()
{
  EEPROM.begin(sizeof(ConfigStore) + EEPROM_CONFIG_START);
  dprintln("EEPROM config size: " + String(sizeof(ConfigStore)));
  configLoad();
  return true;
}

void blinkLed(uint32_t t)
{
  if (millis() - blinkTime > t)
  {
    digitalWrite(ledSignal, !digitalRead(ledSignal));
    blinkTime = millis();
  }
}

void ledSignalControl()
{
  State currState = espState::get();
  if (btSetupPressed && (millis() - btSetupPressTime) > btSetupHoldTime)
  {
    digitalWrite(ledSignal, !digitalRead(ledSignal));
  }
  else if (btSetupPressed)
  {
    blinkLed(1000);
  }
  else if (currState == MODE_WAIT_CONFIG)
  {
    blinkLed(200);
  }
  else if (currState == MODE_CONNECTING_NET)
  {
    blinkLed(500);
  }
  else if (currState == MODE_RUNNING)
  {
    blinkLed(5000);
  }
}

void enterResetConfig()
{
  dprintln("ESP is reset to default!");
  configStore = getDefaultConfig();
  configSave();
  espState::set(MODE_WAIT_CONFIG);
}

ICACHE_RAM_ATTR void btSetupChange()
{
  bool btState = !digitalRead(btSetup);
  if (btState && !btSetupPressed)
  {
    btSetupPressTime = millis();
    btSetupPressed = true;
    dprintln("Hold the button for 10 seconds to reset default...");
    digitalWrite(ledSignal, HIGH);
  }
  else if (!btState && btSetupPressed)
  {
    digitalWrite(ledSignal, LOW);
    btSetupPressed = false;
    uint32_t btHoldTime = millis() - btSetupPressTime;
    if (btHoldTime >= btSetupHoldTime)
    {
      espState::set(MODE_RESET_CONFIG);
    }
    btSetupPressTime = -1;
  }
}

void enterConfigMode()
{
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_AP);

  // Tạo tên AP ngẫu nhiên
  String ssid_ap = generateRandomAPName();
  WiFi.softAP(ssid_ap.c_str(), "12345678"); // Mật khẩu cho AP là "12345678"
  delay(500);                               // Chờ để AP hoạt động

  // In thông tin SSID và IP của AP
  dprintln("AP SSID: " + ssid_ap);
  dprintln("AP IP: " + WiFi.softAPIP().toString());

#ifdef ESP8266
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
#endif

  webServer.on("/", []()
               { webServer.send(200, "text/html", configForm); });

  // Endpoint để lấy thông tin thiết bị hiện tại
  webServer.on("/deviceinfo.json", []()
               {
    String deviceInfo = "{\"device_name\":\"" + String(configStore.device_name) + "\",\"gateway_ip\":\"" + WiFi.softAPIP().toString() + "\"}";
    webServer.send(200, "application/json", deviceInfo); });
  webServer.on("/wifiscan.json", []()
               {
    dprintln("Scanning networks...");
    int wifi_nets = WiFi.scanNetworks(true, true);
    const uint32_t t = millis();
    while (wifi_nets < 0 && millis() - t < 20000) {
      delay(20);
      wifi_nets = WiFi.scanComplete();
    }
    dprintln(String("Found networks: ") + wifi_nets);
    if (wifi_nets > 0) {
      String ssidList = "[\"";
      for (int i = 0; i < wifi_nets; ++i) {
        ssidList += WiFi.SSID(i) + "\"";
        if (i < (wifi_nets - 1)) {
          ssidList += ",\"";
        }
      }
      ssidList += "]";
      webServer.send(200, "application/json", ssidList);
    } else {
      webServer.send(200, "application/json", "[]");
    } });
  webServer.on("/configsave", []()
               {
    dprintln("Applying configuration...");
    String deviceName = webServer.arg("device_name");
    String ssid = webServer.arg("ssid_sta");
    String pass = webServer.arg("pass_sta");
    String content;
    
    // Trim khoảng trắng đầu và cuối
    deviceName.trim();
    ssid.trim();
    pass.trim();
    
    // Normalize device name: thay thế nhiều khoảng trắng liên tiếp bằng một khoảng trắng
    while (deviceName.indexOf("  ") != -1) {
      deviceName.replace("  ", " ");
    }
    
    // Kiểm tra đầy đủ thông tin
    if (deviceName.length() > 0 && ssid.length() > 0 && pass.length() > 0) {
      configStore.flags = 0x01;
      copyString(deviceName, configStore.device_name);
      copyString(ssid, configStore.ssid_sta);
      copyString(pass, configStore.pass_sta);
      configSave();
      content = "Configuration saved successfully! Device will restart in 3 seconds.";
      dprintln("Configuration saved: " + deviceName + " -> " + ssid);
    } else {
      dprintln("Configuration invalid - missing required fields");
      dprintln("Device Name: '" + deviceName + "' (length: " + deviceName.length() + ")");
      dprintln("SSID: '" + ssid + "' (length: " + ssid.length() + ")");
      dprintln("Password: '" + pass + "' (length: " + pass.length() + ")");
      content = "Error: All fields are required (Device Name, WiFi SSID, and Password)";
    }
    webServer.send(200, "application/json", content);
    
    // Chỉ chuyển sang chế độ STA nếu cấu hình hợp lệ
    if (deviceName.length() > 0 && ssid.length() > 0 && pass.length() > 0) {
      connectNetRetries = 1;
      espState::set(MODE_SWITCH_TO_STA);
    } });
  webServer.on("/reboot", []()
               { restartMCU(); });
  webServer.onNotFound([]()
                       {
    // Kiểm tra nếu request không phải là API endpoint
    String uri = webServer.uri();
    if (!uri.startsWith("/wifiscan.json") && !uri.startsWith("/configsave") && !uri.startsWith("/reboot") && !uri.startsWith("/deviceinfo.json")) {
      // Redirect về trang chính
      webServer.sendHeader("Location", "/", true);
      webServer.send(302, "text/plain", "");
    } else {
      webServer.send(404, "text/plain", "Not Found");
    } });
  webServer.begin();

  while (espState::is(MODE_WAIT_CONFIG) || espState::is(MODE_CONFIGURING))
  {
    app_loop();
    delay(10);
    webServer.handleClient();
#ifdef ESP8266
    dnsServer.processNextRequest();
#endif
    if (espState::is(MODE_CONFIGURING) && WiFi.softAPgetStationNum() == 0)
    {
      espState::set(MODE_WAIT_CONFIG);
    }
  }
  webServer.stop();
}

void enterSwitchToSTA()
{
  espState::set(MODE_SWITCH_TO_STA);
  dprintln("Switching to STA...");
  delay(1000);
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_STA);
  espState::set(MODE_CONNECTING_NET);
}

void enterConnectNet()
{
  espState::set(MODE_CONNECTING_NET);
  dprintln(String("Connecting to WiFi: ") + configStore.ssid_sta);
  WiFi.mode(WIFI_STA);

  if (!WiFi.begin(configStore.ssid_sta, configStore.pass_sta))
  {
    espState::set(MODE_ERROR);
    return;
  }
  int n = 0;
  unsigned long timeoutMs = millis() + WIFI_NET_CONNECT_TIMEOUT;
  while ((timeoutMs > millis()) && (WiFi.status() != WL_CONNECTED))
  {
    app_loop();
    delay(10);
    dprint(".");
    n++;
    if (n == 40)
    {
      dprintln();
      n = 0;
    }
    if (!espState::is(MODE_CONNECTING_NET))
    {
      WiFi.disconnect();
      return;
    }
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    dprintln("\nConnected to WiFi, IP: " + WiFi.localIP().toString());
    espState::set(MODE_RUNNING);
    connectNetRetries = WIFI_MAX_RETRIES;
  }
  else if (--connectNetRetries <= 0)
  {
    dprintln();
    espState::set(MODE_ERROR);
  }
}

void enterError()
{
  espState::set(MODE_ERROR);

  unsigned long timeoutMs = millis() + 10000;
  while (timeoutMs > millis() || btSetupPressed)
  {
    delay(10);
    if (!espState::is(MODE_ERROR))
    {
      return;
    }
  }
  dprintln("Restarting after error.");
  delay(10);
  restartMCU();
}

class Config
{
public:
  void begin()
  {
    dprintln("\n----------------ESP Config--------------");

    pinMode(btSetup, INPUT_PULLUP);
    pinMode(ledSignal, OUTPUT);
    digitalWrite(ledSignal, LOW);

    blinker.attach_ms(100, ledSignalControl);
    attachInterrupt(btSetup, btSetupChange, CHANGE);

    configInit();

    if (configStore.flags == 0x01)
    {
      espState::set(MODE_CONNECTING_NET);
    }
    else
    {
      espState::set(MODE_WAIT_CONFIG);
    }
  }
  void run()
  {
    switch (espState::get())
    {
    case MODE_WAIT_CONFIG:
    case MODE_CONFIGURING:
      enterConfigMode();
      break;
    case MODE_CONNECTING_NET:
      enterConnectNet();
      break;
    case MODE_RUNNING:
      delay(100);
      break;
    case MODE_SWITCH_TO_STA:
      enterSwitchToSTA();
      break;
    case MODE_RESET_CONFIG:
      enterResetConfig();
      break;
    default:
      enterError();
      break;
    }
  }
  void restartMCU()
  {
    ESP.restart();
    delay(10000);
    while (1)
    {
    };
  }
} espConfig;
