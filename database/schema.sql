CREATE DATABASE IF NOT EXISTS arduino_control;
USE arduino_control;

-- Table to store current device states
CREATE TABLE IF NOT EXISTS device_states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_type VARCHAR(20) NOT NULL,
    device_id INT NOT NULL,
    is_on BOOLEAN DEFAULT FALSE,
    value INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device (device_type, device_id)
);

-- Table to log all control commands
CREATE TABLE IF NOT EXISTS control_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_type VARCHAR(20) NOT NULL,
    device_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    value INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize LED states (5 LEDs)
INSERT INTO device_states (device_type, device_id, is_on, value) VALUES
    ('led', 1, FALSE, 0),
    ('led', 2, FALSE, 0),
    ('led', 3, FALSE, 0),
    ('led', 4, FALSE, 0),
    ('led', 5, FALSE, 0),
    ('motor', 1, FALSE, 0)
ON DUPLICATE KEY UPDATE device_type=device_type;
