# Arduino LED & Motor Control System

A complete IoT control system using **Arduino R4 WiFi** to control 5 LEDs and a DC motor through a modern web-based interface.

## 🎯 Features

- **5 LED Control** - Individual on/off and brightness control (PWM 0-255)
- **DC Motor Control** - On/off and speed control (PWM 0-255)
- **Real-time Web UI** - Modern dark mode interface with glassmorphism design
- **Activity Logging** - All commands logged to database with timestamps
- **RESTful API** - Clean API for device control and monitoring

## 🛠️ Hardware Components

- Arduino R4 WiFi board
- 5 LEDs with 220Ω resistors
- DC motor
- **L293D motor driver IC**
- Breadboard and jumper wires
- External power supply (6-36V for motor, optional)

## 📌 Pin Configuration

### LEDs
- **LED 1**: Pin 3 (PWM)
- **LED 2**: Pin 5 (PWM)
- **LED 3**: Pin 6 (PWM)
- **LED 4**: Pin 9 (PWM)
- **LED 5**: Pin 10 (PWM)

### Motor
- **PWM Control**: Pin 11
- **Direction IN1**: Pin 7
- **Direction IN2**: Pin 8

## 🔌 Wiring Diagram

### LED Wiring
```
Arduino Pin 3 → LED 1 Anode → 220Ω Resistor → GND
Arduino Pin 5 → LED 2 Anode → 220Ω Resistor → GND
Arduino Pin 6 → LED 3 Anode → 220Ω Resistor → GND
Arduino Pin 9 → LED 4 Anode → 220Ω Resistor → GND
Arduino Pin 10 → LED 5 Anode → 220Ω Resistor → GND
```

### Motor Driver (L293D) Wiring

The L293D is a 16-pin IC. Here's the wiring for one motor:

```
Arduino → L293D IC
Pin 11 (PWM)    → Pin 1 (1,2EN - Enable for Motor 1)
Pin 7           → Pin 2 (1A - Input 1)
Pin 8           → Pin 7 (2A - Input 2)
5V              → Pin 16 (VCC1 - Logic Power)
GND             → Pins 4, 5, 12, 13 (Ground)

L293D → Motor
Pin 3 (1Y)      → DC Motor Terminal 1
Pin 6 (2Y)      → DC Motor Terminal 2

Power Supply (Optional - for higher voltage motors)
6-36V (+)       → Pin 8 (VCC2 - Motor Power)
GND (-)         → Pins 4, 5, 12, 13 (Common Ground with Arduino)

Note: For low-power motors, you can connect Pin 8 (VCC2) to Arduino 5V instead of external supply.
```

> [!WARNING]
> **Important**: Always connect all GND pins (4, 5, 12, 13) to common ground. For motors requiring more than 5V or high current, use an external power supply connected to Pin 8 (VCC2).

## 🚀 Installation & Setup

### Step 1: Database Setup

1. **Start XAMPP** and enable MySQL service
2. Open **phpMyAdmin** at http://localhost/phpmyadmin
3. Import the database schema:
   - Click "Import" tab
   - Select `database/schema.sql`
   - Click "Go"
4. Verify tables are created: `device_states` and `control_logs`

### Step 2: Backend Setup

1. **Install Node.js dependencies**:
   ```bash
   cd C:\Users\Ced\Documents\GitHub\Smarthome_Sy_Corpuz_Encomienda_Jasper
   npm install
   ```

2. **Configure environment** (optional):
   - Edit `.env` file if needed
   - Default database: `localhost`, user: `root`, no password

3. **Start the backend server**:
   ```bash
   node server.js
   ```
   
   You should see:
   ```
   ✓ Database connected successfully
   ✓ Server running on http://localhost:3000
   ```

### Step 3: Arduino Setup

1. **Open Arduino IDE**
2. Open `arduino/led_motor_control/led_motor_control.ino`
3. **Update WiFi credentials** (lines 20-21):
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

4. **Install WiFiS3 library** (if not installed):
   - Tools → Manage Libraries
   - Search for "WiFiS3"
   - Install

5. **Select board**:
   - Tools → Board → Arduino UNO R4 WiFi

6. **Upload the sketch** to Arduino R4

7. **Open Serial Monitor** (115200 baud):
   - Verify WiFi connection
   - Note the Arduino's IP address (e.g., `192.168.1.100`)

### Step 4: Hardware Assembly

1. Connect LEDs to pins 3, 5, 6, 9, 10 (each with 220Ω resistor to GND)
2. Wire L293D motor driver:
   - Pin 11 → L293D Pin 1 (1,2EN for PWM)
   - Pin 7 → L293D Pin 2 (1A)
   - Pin 8 → L293D Pin 7 (2A)
   - Arduino 5V → L293D Pin 16 (VCC1)
   - Connect motor to L293D Pins 3 (1Y) and 6 (2Y)
   - Connect all GND pins (4, 5, 12, 13) to common ground
   - **Optional**: Use external power supply (6-36V) to Pin 8 (VCC2) for higher voltage motors

## 🎮 Usage

### Access the Control Panel

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. You'll see the control panel with:
   - 5 LED control cards
   - Motor control card
   - Activity log

### Control LEDs

- **Toggle**: Click ON/OFF buttons
- **Brightness**: Use slider (0-255)
- Slider automatically turns LED on if brightness > 0

### Control Motor

- **Toggle**: Click ON/OFF buttons
- **Speed**: Use slider (0-255)
- Slider automatically turns motor on if speed > 0

### View Activity

- All commands are logged in the "Activity Log" section
- Logs show timestamp, device, action, and value
- Auto-refreshes every 10 seconds

## 🔧 API Endpoints

### Get Device Status
```
GET /api/status
```
Returns current state of all LEDs and motor.

### Control LED
```
POST /api/led/:id
Content-Type: application/json

{
  "on": true/false,
  "brightness": 0-255
}
```

### Control Motor
```
POST /api/motor
Content-Type: application/json

{
  "on": true/false,
  "speed": 0-255
}
```

### Get Command Logs
```
GET /api/logs?limit=20
```
Returns recent command history.

## 📁 Project Structure

```
Smarthome_Sy_Corpuz_Encomienda_Jasper/
├── arduino/
│   └── led_motor_control/
│       └── led_motor_control.ino    # Arduino firmware
├── database/
│   └── schema.sql                    # Database schema
├── public/
│   ├── index.html                    # Frontend UI
│   ├── css/
│   │   └── style.css                 # Styles
│   └── js/
│       └── app.js                    # Frontend logic
├── server.js                         # Backend API server
├── package.json                      # Dependencies
└── .env                             # Configuration
```

## 🐛 Troubleshooting

### Arduino won't connect to WiFi
- Check SSID and password are correct
- Ensure Arduino and computer are on same network
- Check router settings (some routers block device-to-device communication)

### Backend won't start
- Verify MySQL is running in XAMPP
- Check database credentials in `.env`
- Run `npm install` to ensure all dependencies are installed

### LEDs/Motor not responding
- Check wiring connections
- Verify Arduino is powered and running
- Check Serial Monitor for errors
- Ensure PWM pins are used correctly

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check browser console for errors
- Ensure no firewall is blocking connections

## 📊 Database Schema

### device_states
Stores current state of all devices.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| device_type | VARCHAR(20) | 'led' or 'motor' |
| device_id | INT | Device ID (1-5 for LEDs) |
| is_on | BOOLEAN | On/off state |
| value | INT | Brightness/speed (0-255) |
| last_updated | TIMESTAMP | Last update time |

### control_logs
Logs all control commands.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| device_type | VARCHAR(20) | 'led' or 'motor' |
| device_id | INT | Device ID |
| action | VARCHAR(50) | Action performed |
| value | INT | Value set |
| timestamp | TIMESTAMP | Command time |

## 🎨 UI Features

- **Modern Dark Mode** with vibrant gradients
- **Glassmorphism Design** with backdrop blur
- **Smooth Animations** on all interactions
- **Real-time Updates** every 5 seconds
- **Responsive Layout** works on mobile/tablet/desktop

## 📝 License

MIT License - Feel free to use and modify for your projects!

## 👨‍💻 Development

Built with:
- **Arduino C++** for firmware
- **Node.js & Express** for backend
- **Vanilla JavaScript** for frontend
- **MySQL** for database
- **Modern CSS** with custom properties

---

**Ready to control your LEDs and motor!** 🚀