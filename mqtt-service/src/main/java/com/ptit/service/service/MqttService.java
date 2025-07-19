package com.ptit.service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.service.entity.Device;
import com.ptit.service.entity.SensorData;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class MqttService extends BaseService {

    private static final Logger logger = LoggerFactory.getLogger(MqttService.class);

    @Autowired
    private MqttClient mqttClient;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private SensorDataService sensorDataService;
    @Autowired
    private NotificationService notificationService;

    @PostConstruct
    public void init() {
        try {
            logger.info("Initializing MQTT Service...");

            // Đảm bảo client đã kết nối
            if (!mqttClient.isConnected()) {
                logger.warn("MQTT client not connected, attempting to connect...");
                mqttClient.connect();
            }

            mqttClient.subscribe("iot/data", this::handleDeviceDataMessage);
            logger.info("Subscribed to topic: iot/data");

            // Subscribe nhận phản hồi lệnh
            mqttClient.subscribe("iot/command-response/#", this::handleCommandResponse);
            logger.info("Subscribed to topic: iot/command-response/#");

        } catch (MqttException e) {
            logger.error("Error subscribing to MQTT topic", e);
            // Thử kết nối lại sau 5 giây
            try {
                Thread.sleep(5000);
                init();
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                logger.error("Interrupted while retrying MQTT connection", ie);
            }
        }
    }

    private void handleDeviceDataMessage(String topic, MqttMessage message) {
        try {
            String payload = new String(message.getPayload());
            logger.debug("Payload: {}", payload);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(payload);

            String deviceId = jsonNode.path("id").asText("N/A");

            // Chỉ xử lý deviceId bắt đầu bằng "node_"
            if (!deviceId.startsWith("node_")) {
                logger.debug("Bỏ qua thiết bị không hợp lệ: {}", deviceId);
                return;
            }

            String deviceName = jsonNode.path("name").asText("N/A");
            String deviceWifi = jsonNode.path("w").asText("N/A");
            String deviceIp = jsonNode.path("i").asText("N/A");
            String deviceBroker = jsonNode.path("b").asText("N/A");
            String deviceTopic = jsonNode.path("t").asText("N/A");

            Device device = deviceService.findByDeviceId(deviceId);

            if (device == null) {
                device = new Device();
                device.setDeviceId(deviceId);
                device.setName(deviceName);
                device.setType("node");
                device.setLocation("IoT Lab");
                device.setWifi(deviceWifi);
                device.setIp(deviceIp);
                device = deviceService.save(device);
            }

            JsonNode sensorsNode = jsonNode.path("ss");
            float temperature = sensorsNode.path("temp").floatValue();
            float humidity = sensorsNode.path("hum").floatValue();
            float light = sensorsNode.path("lgt").floatValue();
            float gas = sensorsNode.path("gas").floatValue();

            SensorData sensorData = new SensorData();
            sensorData.setDevice(device);
            sensorData.setTemperature(temperature);
            sensorData.setHumidity(humidity);
            sensorData.setLight(light);
            sensorData.setGas(gas);

            JsonNode statusNode = jsonNode.path("stt");
            int led = statusNode.path("led").intValue();
            int fan = statusNode.path("fan").intValue();
            int alertLed = statusNode.path("alt").intValue();
            int buzzer = statusNode.path("bzr").intValue();
            int servo = statusNode.path("sv").intValue();

            sensorData.setLed(led);
            sensorData.setFan(fan);
            sensorData.setAlertLed(alertLed);
            sensorData.setBuzzer(buzzer);
            sensorData.setServo(servo);

            sensorData.setBroker(deviceBroker);
            sensorData.setTopic(deviceTopic);
            sensorData.setPayload(payload);

            sensorDataService.save(sensorData);

            notificationService.sendRealtimeUpdate("/topic/sensorData/" + device.getId(), sensorData);
            logger.debug("Sending data to /topic/sensorData/{}: {}", device.getId(), sensorData);
            System.out.printf("Published : %s\n", sensorData);
        } catch (Exception e) {
            logger.error("Error while processing message", e);
        }
    }

    // Xử lý phản hồi từ thiết bị
    private void handleCommandResponse(String topic, MqttMessage message) {
        try {
            String responsePayload = new String(message.getPayload());
            logger.info("Received command response: {}", responsePayload);

            // Lấy deviceId từ topic (iot/command-response/{deviceId})
            String[] topicParts = topic.split("/");
            if (topicParts.length >= 3) {
                String deviceId = topicParts[2];

                // Gửi dữ liệu phản hồi qua WebSocket
                notificationService.sendRealtimeUpdate("/topic/command-response/" + deviceId, responsePayload);
                logger.info("Sent command response to WebSocket for device: {}", deviceId);
            }
        } catch (Exception e) {
            logger.error("Error processing command response message", e);
        }
    }
}
