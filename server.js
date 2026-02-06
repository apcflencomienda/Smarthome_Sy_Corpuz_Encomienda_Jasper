const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'arduino_control'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('✓ Database connected successfully');
});

// Store for current device states (in-memory cache)
let deviceStates = {
    leds: {
        1: { on: false, brightness: 0 },
        2: { on: false, brightness: 0 },
        3: { on: false, brightness: 0 },
        4: { on: false, brightness: 0 },
        5: { on: false, brightness: 0 }
    },
    motor: { on: false, speed: 0 }
};

// Helper function to log commands
function logCommand(deviceType, deviceId, action, value) {
    const query = 'INSERT INTO control_logs (device_type, device_id, action, value) VALUES (?, ?, ?, ?)';
    db.query(query, [deviceType, deviceId, action, value], (err) => {
        if (err) console.error('Log error:', err);
    });
}

// Helper function to update device state in database
function updateDeviceState(deviceType, deviceId, isOn, value) {
    const query = 'UPDATE device_states SET is_on = ?, value = ? WHERE device_type = ? AND device_id = ?';
    db.query(query, [isOn, value, deviceType, deviceId], (err) => {
        if (err) console.error('Update error:', err);
    });
}

// Helper function to send commands to Arduino
function sendCommandToArduino(endpoint, callback) {
    const arduinoIP = process.env.ARDUINO_IP || '192.168.35.171';
    const url = `http://${arduinoIP}${endpoint}`;

    console.log(`Sending command to Arduino: ${url}`);

    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Arduino response: ${data}`);
            if (callback) callback(null, data);
        });
    }).on('error', (err) => {
        console.error(`Arduino communication error: ${err.message}`);
        if (callback) callback(err);
    });
}

// API Routes

// Get current status of all devices
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: deviceStates,
        timestamp: new Date().toISOString()
    });
});

// Control LED
app.post('/api/led/:id', (req, res) => {
    const ledId = parseInt(req.params.id);
    const { on, brightness } = req.body;

    if (ledId < 1 || ledId > 5) {
        return res.status(400).json({ success: false, message: 'Invalid LED ID. Must be 1-5.' });
    }

    // Update state
    if (on !== undefined) {
        deviceStates.leds[ledId].on = on;
    }
    if (brightness !== undefined) {
        const validBrightness = Math.max(0, Math.min(255, parseInt(brightness)));
        deviceStates.leds[ledId].brightness = validBrightness;
        if (validBrightness > 0) {
            deviceStates.leds[ledId].on = true;
        }
    }

    const currentState = deviceStates.leds[ledId];
    const finalBrightness = currentState.on ? currentState.brightness : 0;

    // Log command
    logCommand('led', ledId, currentState.on ? 'on' : 'off', finalBrightness);

    // Update database
    updateDeviceState('led', ledId, currentState.on, finalBrightness);

    // Send command to Arduino
    const arduinoEndpoint = `/led/${ledId}?brightness=${finalBrightness}`;
    sendCommandToArduino(arduinoEndpoint, (err) => {
        if (err) {
            console.error('Failed to communicate with Arduino');
        }
    });

    res.json({
        success: true,
        led: ledId,
        state: currentState,
        message: `LED ${ledId} ${currentState.on ? 'ON' : 'OFF'} at brightness ${finalBrightness}`
    });
});

// Control Motor
app.post('/api/motor', (req, res) => {
    const { on, speed } = req.body;

    // Update state
    if (on !== undefined) {
        deviceStates.motor.on = on;
    }
    if (speed !== undefined) {
        const validSpeed = Math.max(0, Math.min(255, parseInt(speed)));
        deviceStates.motor.speed = validSpeed;
        if (validSpeed > 0) {
            deviceStates.motor.on = true;
        }
    }

    const currentState = deviceStates.motor;
    const finalSpeed = currentState.on ? currentState.speed : 0;

    // Log command
    logCommand('motor', 1, currentState.on ? 'on' : 'off', finalSpeed);

    // Update database
    updateDeviceState('motor', 1, currentState.on, finalSpeed);

    // Send command to Arduino
    const arduinoEndpoint = `/motor?speed=${finalSpeed}`;
    sendCommandToArduino(arduinoEndpoint, (err) => {
        if (err) {
            console.error('Failed to communicate with Arduino');
        }
    });

    res.json({
        success: true,
        state: currentState,
        message: `Motor ${currentState.on ? 'ON' : 'OFF'} at speed ${finalSpeed}`
    });
});

// Get command logs
app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const query = 'SELECT * FROM control_logs ORDER BY timestamp DESC LIMIT ?';

    db.query(query, [limit], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({
            success: true,
            logs: results
        });
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Control panel: http://localhost:${PORT}`);
});
