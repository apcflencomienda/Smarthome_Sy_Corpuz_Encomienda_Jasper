/*
 * Arduino R4 WiFi - LED & Motor Control System
 * 
 * Hardware Setup:
 * - LED 1: Pin 3 (PWM)
 * - LED 2: Pin 5 (PWM)
 * - LED 3: Pin 6 (PWM)
 * - LED 4: Pin 9 (PWM)
 * - LED 5: Pin 10 (PWM)
 * - Motor Driver: L293D IC
 * - Motor PWM Enable: Pin 11 → L293D Pin 1 (1,2EN)
 * - Motor Direction 1: Pin 7 → L293D Pin 2 (1A)
 * - Motor Direction 2: Pin 8 → L293D Pin 7 (2A)
 * 
 * Features:
 * - WiFi connectivity
 * - HTTP server for receiving commands
 * - PWM control for LED brightness (0-255)
 * - PWM control for motor speed (0-255)
 */

#include <WiFiS3.h>

// WiFi credentials - UPDATE THESE!
const char* ssid = "ComLab314";
const char* password = "#Ramswifi";

// LED Pin definitions
const int LED_PINS[] = {3, 5, 6, 9, 10};
const int NUM_LEDS = 5;

// Motor Pin definitions (for L293D driver)
const int MOTOR_PWM_PIN = 11;  // Connects to L293D Pin 1 (1,2EN)
const int MOTOR_IN1_PIN = 7;   // Connects to L293D Pin 2 (1A)
const int MOTOR_IN2_PIN = 8;   // Connects to L293D Pin 7 (2A)

// Device states
int ledBrightness[5] = {0, 0, 0, 0, 0};
int motorSpeed = 0;
bool motorOn = false;

// WiFi server on port 80
WiFiServer server(80);

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  delay(1000);
  
  Serial.println("Arduino R4 WiFi - LED & Motor Control");
  Serial.println("====================================");
  
  // Initialize LED pins
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    analogWrite(LED_PINS[i], 0);
  }
  Serial.println("✓ LEDs initialized");
  
  // Initialize motor pins
  pinMode(MOTOR_PWM_PIN, OUTPUT);
  pinMode(MOTOR_IN1_PIN, OUTPUT);
  pinMode(MOTOR_IN2_PIN, OUTPUT);
  digitalWrite(MOTOR_IN1_PIN, LOW);
  digitalWrite(MOTOR_IN2_PIN, LOW);
  analogWrite(MOTOR_PWM_PIN, 0);
  Serial.println("✓ Motor initialized");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Start HTTP server
  server.begin();
  Serial.println("✓ HTTP server started");
  Serial.println("====================================");
  Serial.print("Arduino IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("====================================");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectToWiFi();
  }
  
  // Listen for incoming clients
  WiFiClient client = server.available();
  
  if (client) {
    Serial.println("\n[New Client Connected]");
    String request = "";
    
    // Read the request
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        request += c;
        
        // Check if request is complete
        if (request.endsWith("\r\n\r\n")) {
          break;
        }
      }
    }
    
    Serial.println("Request: " + request.substring(0, request.indexOf('\n')));
    
    // Process the request
    processRequest(request, client);
    
    // Close connection
    delay(10);
    client.stop();
    Serial.println("[Client Disconnected]");
  }
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi connection failed!");
  }
}

void processRequest(String request, WiFiClient &client) {
  // Parse HTTP method and path
  int methodEnd = request.indexOf(' ');
  int pathEnd = request.indexOf(' ', methodEnd + 1);
  String method = request.substring(0, methodEnd);
  String path = request.substring(methodEnd + 1, pathEnd);
  
  // Handle different endpoints
  if (path.startsWith("/led/")) {
    handleLEDControl(path, client);
  } else if (path.startsWith("/motor")) {
    handleMotorControl(path, client);
  } else if (path == "/status") {
    handleStatus(client);
  } else {
    sendResponse(client, 404, "text/plain", "Not Found");
  }
}

void handleLEDControl(String path, WiFiClient &client) {
  // Extract LED ID and brightness from path
  // Format: /led/1?brightness=128
  int ledIdStart = path.indexOf("/led/") + 5;
  int ledIdEnd = path.indexOf('?', ledIdStart);
  if (ledIdEnd == -1) ledIdEnd = path.length();
  
  int ledId = path.substring(ledIdStart, ledIdEnd).toInt();
  
  // Validate LED ID
  if (ledId < 1 || ledId > NUM_LEDS) {
    sendResponse(client, 400, "text/plain", "Invalid LED ID");
    return;
  }
  
  // Extract brightness parameter
  int brightness = 0;
  int brightnessParam = path.indexOf("brightness=");
  if (brightnessParam != -1) {
    brightness = path.substring(brightnessParam + 11).toInt();
    brightness = constrain(brightness, 0, 255);
  }
  
  // Set LED brightness
  int ledIndex = ledId - 1;
  ledBrightness[ledIndex] = brightness;
  analogWrite(LED_PINS[ledIndex], brightness);
  
  Serial.print("LED ");
  Serial.print(ledId);
  Serial.print(" set to brightness: ");
  Serial.println(brightness);
  
  // Send response
  String response = "{\"success\":true,\"led\":" + String(ledId) + ",\"brightness\":" + String(brightness) + "}";
  sendResponse(client, 200, "application/json", response);
}

void handleMotorControl(String path, WiFiClient &client) {
  // Extract speed from path
  // Format: /motor?speed=200
  int speed = 0;
  int speedParam = path.indexOf("speed=");
  if (speedParam != -1) {
    speed = path.substring(speedParam + 6).toInt();
    speed = constrain(speed, 0, 255);
  }
  
  // Set motor speed and direction
  motorSpeed = speed;
  motorOn = (speed > 0);
  
  if (motorOn) {
    digitalWrite(MOTOR_IN1_PIN, HIGH);
    digitalWrite(MOTOR_IN2_PIN, LOW);
    analogWrite(MOTOR_PWM_PIN, speed);
  } else {
    digitalWrite(MOTOR_IN1_PIN, LOW);
    digitalWrite(MOTOR_IN2_PIN, LOW);
    analogWrite(MOTOR_PWM_PIN, 0);
  }
  
  Serial.print("Motor set to speed: ");
  Serial.println(speed);
  
  // Send response
  String response = "{\"success\":true,\"speed\":" + String(speed) + ",\"on\":" + (motorOn ? "true" : "false") + "}";
  sendResponse(client, 200, "application/json", response);
}

void handleStatus(WiFiClient &client) {
  // Build JSON status response
  String json = "{";
  json += "\"leds\":{";
  for (int i = 0; i < NUM_LEDS; i++) {
    json += "\"" + String(i + 1) + "\":{";
    json += "\"on\":" + String(ledBrightness[i] > 0 ? "true" : "false") + ",";
    json += "\"brightness\":" + String(ledBrightness[i]);
    json += "}";
    if (i < NUM_LEDS - 1) json += ",";
  }
  json += "},";
  json += "\"motor\":{";
  json += "\"on\":" + String(motorOn ? "true" : "false") + ",";
  json += "\"speed\":" + String(motorSpeed);
  json += "}";
  json += "}";
  
  sendResponse(client, 200, "application/json", json);
}

void sendResponse(WiFiClient &client, int statusCode, String contentType, String body) {
  // Send HTTP headers
  client.println("HTTP/1.1 " + String(statusCode) + " OK");
  client.println("Content-Type: " + contentType);
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  
  // Send body
  client.println(body);
}
