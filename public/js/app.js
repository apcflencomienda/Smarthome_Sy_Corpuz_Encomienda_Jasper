// Configuration
// Use relative URL so it works from any device (computer or phone)
const API_BASE_URL = '/api';

// State management
let deviceStates = {
    leds: {},
    motor: {}
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    fetchDeviceStatus();
    fetchActivityLogs();

    // Update status every 5 seconds
    setInterval(fetchDeviceStatus, 5000);
    // Update logs every 10 seconds
    setInterval(fetchActivityLogs, 10000);
});

// Initialize all event listeners
function initializeEventListeners() {
    // LED controls
    for (let i = 1; i <= 5; i++) {
        // Toggle buttons
        const onBtn = document.querySelector(`.btn-on[data-led="${i}"]`);
        const offBtn = document.querySelector(`.btn-off[data-led="${i}"]`);

        onBtn?.addEventListener('click', () => toggleLED(i, true));
        offBtn?.addEventListener('click', () => toggleLED(i, false));

        // Brightness slider
        const slider = document.querySelector(`.brightness-slider[data-led="${i}"]`);
        slider?.addEventListener('input', (e) => updateSliderValue(e.target));
        slider?.addEventListener('change', (e) => changeLEDBrightness(i, e.target.value));
    }

    // Motor controls
    const motorOnBtn = document.querySelector('.btn-on[data-motor="1"]');
    const motorOffBtn = document.querySelector('.btn-off[data-motor="1"]');
    const motorSlider = document.querySelector('.speed-slider[data-motor="1"]');

    motorOnBtn?.addEventListener('click', () => toggleMotor(true));
    motorOffBtn?.addEventListener('click', () => toggleMotor(false));
    motorSlider?.addEventListener('input', (e) => updateSliderValue(e.target));
    motorSlider?.addEventListener('change', (e) => changeMotorSpeed(e.target.value));
}

// Update slider value display
function updateSliderValue(slider) {
    const valueDisplay = slider.parentElement.querySelector('.slider-value');
    if (valueDisplay) {
        valueDisplay.textContent = slider.value;
    }
}

// Fetch current device status
async function fetchDeviceStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        const data = await response.json();

        if (data.success) {
            deviceStates = data.data;
            updateUI();
            updateConnectionStatus(true);
        }
    } catch (error) {
        console.error('Error fetching status:', error);
        updateConnectionStatus(false);
    }
}

// Update UI based on device states
function updateUI() {
    // Update LEDs
    for (let i = 1; i <= 5; i++) {
        const state = deviceStates.leds[i];
        if (state) {
            updateLEDUI(i, state.on, state.brightness);
        }
    }

    // Update Motor
    const motorState = deviceStates.motor;
    if (motorState) {
        updateMotorUI(motorState.on, motorState.speed);
    }
}

// Update LED UI elements
function updateLEDUI(ledId, isOn, brightness) {
    const statusIndicator = document.querySelector(`.status-indicator[data-led="${ledId}"]`);
    const onBtn = document.querySelector(`.btn-on[data-led="${ledId}"]`);
    const offBtn = document.querySelector(`.btn-off[data-led="${ledId}"]`);
    const slider = document.querySelector(`.brightness-slider[data-led="${ledId}"]`);
    const valueDisplay = slider?.parentElement.querySelector('.slider-value');

    // Update status indicator
    if (statusIndicator) {
        if (isOn) {
            statusIndicator.classList.add('active');
            statusIndicator.querySelector('.status-text').textContent = 'ON';
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.querySelector('.status-text').textContent = 'OFF';
        }
    }

    // Update buttons
    if (isOn) {
        onBtn?.classList.add('active');
        offBtn?.classList.remove('active');
    } else {
        offBtn?.classList.add('active');
        onBtn?.classList.remove('active');
    }

    // Update slider
    if (slider) {
        slider.value = brightness;
    }
    if (valueDisplay) {
        valueDisplay.textContent = brightness;
    }
}

// Update Motor UI elements
function updateMotorUI(isOn, speed) {
    const statusIndicator = document.querySelector('.status-indicator[data-motor="1"]');
    const onBtn = document.querySelector('.btn-on[data-motor="1"]');
    const offBtn = document.querySelector('.btn-off[data-motor="1"]');
    const slider = document.querySelector('.speed-slider[data-motor="1"]');
    const valueDisplay = slider?.parentElement.querySelector('.slider-value');

    // Update status indicator
    if (statusIndicator) {
        if (isOn) {
            statusIndicator.classList.add('active');
            statusIndicator.querySelector('.status-text').textContent = 'ON';
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.querySelector('.status-text').textContent = 'OFF';
        }
    }

    // Update buttons
    if (isOn) {
        onBtn?.classList.add('active');
        offBtn?.classList.remove('active');
    } else {
        offBtn?.classList.add('active');
        onBtn?.classList.remove('active');
    }

    // Update slider
    if (slider) {
        slider.value = speed;
    }
    if (valueDisplay) {
        valueDisplay.textContent = speed;
    }
}

// Toggle LED on/off
async function toggleLED(ledId, on) {
    try {
        const response = await fetch(`${API_BASE_URL}/led/${ledId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ on })
        });

        const data = await response.json();
        if (data.success) {
            deviceStates.leds[ledId] = data.state;
            updateLEDUI(ledId, data.state.on, data.state.brightness);
            fetchActivityLogs(); // Refresh logs
        }
    } catch (error) {
        console.error('Error toggling LED:', error);
    }
}

// Change LED brightness
async function changeLEDBrightness(ledId, brightness) {
    try {
        const response = await fetch(`${API_BASE_URL}/led/${ledId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ brightness: parseInt(brightness) })
        });

        const data = await response.json();
        if (data.success) {
            deviceStates.leds[ledId] = data.state;
            updateLEDUI(ledId, data.state.on, data.state.brightness);
            fetchActivityLogs(); // Refresh logs
        }
    } catch (error) {
        console.error('Error changing LED brightness:', error);
    }
}

// Toggle Motor on/off
async function toggleMotor(on) {
    try {
        const response = await fetch(`${API_BASE_URL}/motor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ on })
        });

        const data = await response.json();
        if (data.success) {
            deviceStates.motor = data.state;
            updateMotorUI(data.state.on, data.state.speed);
            fetchActivityLogs(); // Refresh logs
        }
    } catch (error) {
        console.error('Error toggling motor:', error);
    }
}

// Change Motor speed
async function changeMotorSpeed(speed) {
    try {
        const response = await fetch(`${API_BASE_URL}/motor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ speed: parseInt(speed) })
        });

        const data = await response.json();
        if (data.success) {
            deviceStates.motor = data.state;
            updateMotorUI(data.state.on, data.state.speed);
            fetchActivityLogs(); // Refresh logs
        }
    } catch (error) {
        console.error('Error changing motor speed:', error);
    }
}

// Fetch activity logs
async function fetchActivityLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs?limit=20`);
        const data = await response.json();

        if (data.success) {
            displayLogs(data.logs);
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

// Display logs in the UI
function displayLogs(logs) {
    const logContainer = document.getElementById('activityLog');

    if (!logs || logs.length === 0) {
        logContainer.innerHTML = '<p class="log-empty">No activity yet...</p>';
        return;
    }

    logContainer.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleString();
        const deviceName = log.device_type === 'led' ? `LED ${log.device_id}` : 'Motor';
        const action = log.action.toUpperCase();
        const value = log.value;

        return `
            <div class="log-entry">
                <strong>${deviceName}</strong> turned <strong>${action}</strong> 
                ${log.device_type === 'led' ? `(brightness: ${value})` : `(speed: ${value})`}
                <span class="log-time">${time}</span>
            </div>
        `;
    }).join('');
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = 'Connected';
            statusElement.classList.add('connected');
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.classList.remove('connected');
        }
    }
}
