// index.ts
// Main Electron process for AC dynamic load management application.
// Handles window creation, IPC communication, configuration management, polling, and logging.

import { app, BrowserWindow, ipcMain } from "electron";
import { setVoltagePriorityMode, setCurrentPriorityMode, setOutput, defineVoltageCurrent, setCurrentSetPoint, getSinkPowerValue } from './lib/scpiHelper';
import { readEvseMaxCurrentAc, readEvDuty, measuredVoltageL1 } from './lib/cdsHelper';
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { stopPollingCDS, startPollingCDS, getLastPowerCDS, startSinkPowerPolling, stopSinkPowerPolling, getLastSinkPowerValue, getLastVoltageCDS, getLastCurrentCDS, startCsvLogging, stopCsvLogging, getCsvLoggingStatus } from './lib/pollHelper';
import { storagePath, configStoragePath, logfilePath, configFilePath } from "./lib/globalpaths";
import { logging } from "./lib/logging";

/**
 * Global data object for main window and paths
 */
const globalData: {
    mainWindow: BrowserWindow | undefined,
    mainWindowHeight: number,
    mainWindowWidth: number,
    storagePath: string
} = {
    mainWindow: undefined,
    mainWindowHeight: 800,
    mainWindowWidth: 1000,
    storagePath: storagePath
};

/**
 * App ready event: initializes storage, creates main window, loads UI, sets up resize handler
 */
app.on("ready", () => {
    logging('# start application #');
    init();
    globalData.mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        show: false,
        frame: false,
        width: globalData.mainWindowWidth,
        height: globalData.mainWindowHeight,
        minWidth: globalData.mainWindowWidth,
        minHeight: globalData.mainWindowHeight,
        icon: join(__dirname, '..', 'public', 'icon.png'),
        webPreferences: {
            preload: join(__dirname, 'lib', 'preload.js'),
        },
    });
    globalData.mainWindow.loadFile(join(__dirname, '..', 'public', 'index.html'));
    globalData.mainWindow.show();
    globalData.mainWindow.on('resize', () => {
        if (globalData.mainWindow != undefined) sendMessage('get:isAppMaximized', globalData.mainWindow.isMaximized());
    });
});

/**
 * Initializes storage directories and configuration file if missing
 */
function init() {
    if (!existsSync(storagePath)) mkdirSync(storagePath, { recursive: true });
    else logging('Storage path already exists:', storagePath);
    if (!existsSync(configStoragePath)) mkdirSync(configStoragePath, { recursive: true });
    else logging('Config storage path already exists:', configStoragePath);
    if (!existsSync(logfilePath)) mkdirSync(logfilePath, { recursive: true });
    else logging('Logfile path already exists:', logfilePath);
    if (existsSync(configStoragePath) && !existsSync(configFilePath)) mkConfigFile();
    else logging('Config file already exists:', configFilePath);
}

/**
 * App close event: exits process when all windows are closed
 */
app.on('window-all-closed', async () => {
    process.exit();
});

// IPC event handlers for frontend-backend communication
// Version info
ipcMain.on('get:version', async (event, args) => {
    try {
        sendMessage('get:version', app.getVersion());
    } catch (error) {
        logging('get:version:error:', error);
        sendMessage('get:version', '0.0.0');
    }
});

// Window state queries and actions
ipcMain.on('get:isAppMaximized', async (event, args) => {
    if (globalData.mainWindow != undefined) sendMessage('get:isAppMaximized', globalData.mainWindow.isMaximized());
});
ipcMain.on('set:maximizeApp', async (event, args) => {
    if (globalData.mainWindow != undefined) globalData.mainWindow.maximize();
});
ipcMain.on('set:minimizeApp', async (event, args) => {
    if (globalData.mainWindow != undefined) globalData.mainWindow.minimize();
});
ipcMain.on('set:compressApp', async (event, args) => {
    if (globalData.mainWindow != undefined) globalData.mainWindow.unmaximize();
});
ipcMain.on('set:closeApp', async (event, args) => {
    app.exit();
});

// SCPI and CDS control handlers
ipcMain.handle('setVoltagePriorityMode', async (event, args) => {
    return await setVoltagePriorityMode(args);
});
ipcMain.handle('setCurrentPriorityMode', async (event, args) => {
    return await setCurrentPriorityMode(args);
});
ipcMain.handle('setOutput', async (event, args) => {
    if (getLastVoltageCDS() < 200) args.OutputState = false;
    return await setOutput(args);
});
ipcMain.handle('defineVoltageCurrent', async (event, args) => {
    return defineVoltageCurrent(args);
});
ipcMain.handle('setCurrentSetPoint', async (event, args) => {
    if (getLastVoltageCDS() < 200) args.current = 0;
    return await setCurrentSetPoint(args);
});
ipcMain.handle('getSinkPowerValue', async (event, args) => {
    return await getSinkPowerValue(args);
});

// Configuration file handlers
ipcMain.handle('getConfigFromFile', async () => {
    return getConfigData();
});
/**
 * Reads configuration data from config file
 * @returns Config object
 */
function getConfigData(): {
    voltagehostIP: string;
    currenthostIP: string;
    voltageLimit: number;
    currentLimit: number;
    maxkWValue: number;
    cdsIP: string;
} {
    const data = readFileSync(configFilePath, 'utf-8');
    return JSON.parse(data);
}

ipcMain.handle('saveConfiginConfigFile', async (_event, config) => {
    try {
        writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    } catch (err) {
        console.error('Error saving config:', err);
        return { success: false, error: err.message };
    }
});

// EVSE and measurement handlers
ipcMain.handle('readEvseMaxCurrentAc', async (event, args) => {
    return await readEvseMaxCurrentAc(args);
});
ipcMain.handle('readEvDuty', async (event, args) => {
    return await readEvDuty(args);
});
ipcMain.handle('measuredVoltageL1', async (event, args) => {
    return await measuredVoltageL1(args);
});

// CDS polling handlers
ipcMain.handle('startPollingCDS', async (event, args) => {
    const config = getConfigData();
    startPollingCDS(config.cdsIP, 400);
    return true;
});
ipcMain.handle('stopPollingCDS', async () => {
    stopPollingCDS();
    return true;
});
ipcMain.handle('getLastPowerValueCDS', async () => {
    return getLastPowerCDS();
});

// Sink power polling handlers
ipcMain.handle('startSinkPowerPolling', async (event, args) => {
    startSinkPowerPolling(args.ip, args.intervalMs, args.timeoutMs);
    return true;
});
ipcMain.handle('stopSinkPowerPolling', async () => {
    stopSinkPowerPolling();
    return true;
});
ipcMain.handle('getLastSinkPowerValue', async () => {
    return getLastSinkPowerValue();
});

// Voltage and current value handlers
ipcMain.handle('getLastVoltageValueCDS', async () => {
    return getLastVoltageCDS();
});
ipcMain.handle('getLastCurrentValueCDS', async () => {
    return getLastCurrentCDS();
});

// CSV Logging Handlers
ipcMain.handle('startCsvLogging', async () => {
    return startCsvLogging();
});
ipcMain.handle('stopCsvLogging', async () => {
    return stopCsvLogging();
});
ipcMain.handle('getCsvLoggingStatus', async () => {
    return getCsvLoggingStatus();
});

/**
 * Sends a message to the renderer process via IPC
 * @param msgKey Message key string
 * @param args Arguments to send
 */
function sendMessage(msgKey: string, ...args: any) {
    if (globalData.mainWindow != undefined) globalData.mainWindow.webContents.send(msgKey, ...args);
}

/**
 * Creates a default config file if missing
 */
function mkConfigFile() {
    if (!existsSync(configFilePath)) {
        const defaultConfig = {
            voltagehostIP: "192.168.100.180",
            currenthostIP: "192.168.100.182",
            voltageLimit: 692,
            currentLimit: 32,
            maxkWValue: 22,
            cdsIP: "192.168.100.80"
        };
        writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2), "utf-8");
    }
}


