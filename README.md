# AC Dynamic Load Controller

A professional electric vehicle charging system with dynamic power control, built with Electron, Svelte, and TypeScript.

## 🚀 Overview

The AC Dynamic Load Controller system enables precise control and monitoring of AC charging processes for electric vehicles. It provides advanced features like real-time visualization, intelligent power management, and robust system monitoring.

## ✨ Key Features

### 🔧 **Power Control**
- **Dynamic kW Adjustment**: Precise power regulation from 1-22 kW
- **Real-time Setpoint Control**: Immediate response to power adjustments
- **Intelligent Monitoring**: Robust CDS polling with retry mechanisms and timeout protection

### 📊 **Data Visualization**
- **Live Charts**: Real-time display of voltage, current, power, and setpoint with separate Y-axes
- **Multi-Axis Diagrams**: Professional visualization using Chart.js
- **Setpoint Tracking**: Visual comparison between target and actual power values
- **Sink Power Monitoring**: Integration of power sink measurements

### 🛡️ **Safety & Robustness**
- **Voltage Monitoring**: Automatic shutdown at low voltages
- **Timeout Protection**: API calls with configurable timeouts
- **Health Monitoring**: Continuous system supervision
- **Fallback Mechanisms**: Use of last valid values during failures

## 🏗️ Technical Architecture

### Frontend (Svelte 3.55.0)
```
src/svelte/
├── App.svelte                 # Main component
├── main.ts                    # Entry point
├── pages/
│   ├── LoadSession.svelte     # Main control interface
│   └── ConfigPage.svelte      # Configuration management
├── lib/
│   ├── chartConfig.ts         # Chart.js configuration
│   └── tab.ts                 # Tab management
└── components/                # UI components
```

### Backend (Electron 28.1.3)
```
src/electron/
├── index.ts                   # Main Electron process
└── lib/
    ├── scpiHelper.ts          # SCPI communication
    ├── cdsHelper.ts           # CDS integration
    ├── pollHelper.ts          # Polling system
    └── globalpaths.ts         # Path configuration
```

## 📋 System Requirements

- **Node.js**: ≥16.0.0
- **Electron**: 28.1.3
- **TypeScript**: 4.9.0
- **Operating System**: Windows 10/11 (primary), Linux, macOS

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone [repository-url]
cd acdynamicload
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Configuration
On first start, a `config.json` file is automatically created:
```json
{
  "voltagehostIP": "192.168.100.180",
  "currenthostIP": "192.168.100.182", 
  "voltageLimit": 692,
  "currentLimit": 32,
  "maxkWValue": 22,
  "cdsIP": "192.168.100.80"
}
```

### 4. Start Development
```bash
npm run start:dev
```

### 5. Production Build
```bash
npm run build
```

## 🎮 Operation

### Basic Functions
1. **Power Setpoint**: Slider for power adjustment (1-22 kW)
2. **Activate/Deactivate**: Output control with immediate setpoint application
3. **Live Monitoring**: Real-time monitoring in the values table

### Advanced Features
- **Live Monitoring**: Real-time supervision in the values table
- **Chart Analysis**: Historical data visualization
- **Robust Polling**: Automatic retry on connection errors
- **Configuration Management**: Integrated settings interface

## 📊 Data Display

### Real-time Values Table
- **CDS Power Value**: Actual power measurement from CDS
- **CDS Voltage L1**: Line voltage measurement
- **Sink Power Value**: Power sink measurement
- **Max Current (EVSE)**: Maximum current from duty cycle
- **Max Power (EVSE)**: Calculated maximum power limit

### Chart Data
- **Voltage**: Blue line with dedicated Y-axis
- **Current**: Red line with dedicated Y-axis  
- **Power**: Green line showing actual CDS power
- **Setpoint**: Target power value
- **Sink Power**: Power sink measurements

## 🛠️ Development

### Project Structure
- **Svelte**: Reactive UI components
- **TypeScript**: Type-safe development  
- **Electron**: Desktop application with IPC communication
- **Chart.js**: Professional data visualization
- **Rollup**: Build system and bundling

### Build Commands
```bash
npm run start:dev     # Development server
npm run build         # Production build
npm run electron      # Start Electron
```

## 🔧 Configuration

### Hardware Setup
- **Voltage Source**: Configurable IP address
- **Current Sink**: Separate IP configuration
- **CDS System**: Integrated monitoring
- **Network**: TCP/IP-based communication

### Software Parameters
- **Polling Intervals**: 2 seconds (CDS and Sink)
- **Timeout Values**: 3-5 seconds
- **Chart History**: Unlimited data points for continuous recording
- **Setpoint Update**: 100ms interval when active

## 🐛 Troubleshooting

### Common Issues

**CDS Connection Unstable:**
- Check network connection
- Verify IP configuration
- System uses automatic retry mechanisms

**Charts Show No Data:**
- Check CDS connection
- Review browser console for errors
- Verify configuration settings

**Configuration Errors:**
- Use integrated configuration interface
- Check network connectivity to devices
- Verify file integrity

## 📈 Performance

### Optimizations
- **Efficient Polling**: 2-second intervals for optimal performance
- **Memory Management**: Continuous chart data recording
- **Timeout Protection**: Prevents hanging requests
- **Error Handling**: Comprehensive error management

### Monitoring
- Console logging for all critical operations
- Real-time connection status
- Performance metrics in developer console

## 🔒 Security

- **Input Validation**: All user inputs are validated
- **Voltage Monitoring**: Automatic safety shutdown
- **Error Handling**: Comprehensive error management
- **Graceful Degradation**: System remains functional during partial failures

## 🏢 Hardware Integration

### Supported Devices
- **CDS (Charging Data System)**: Real-time power monitoring
- **SCPI-compatible Power Sources**: Voltage and current control
- **Power Sinks**: Load simulation and measurement
- **EVSE Controllers**: Duty cycle and current limit reading

### Communication Protocols
- **TCP/IP**: Primary communication protocol
- **SCPI**: Standard Commands for Programmable Instruments
- **Custom CDS Protocol**: Optimized for charging applications



**Version**: 1.0.0  
**Last Updated**: July 2025  
**Used Node Version**: 16.14.2
