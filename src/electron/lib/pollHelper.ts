// pollHelper.ts
// Polling and logging utilities for CDS and sink power values.
// Handles periodic measurement polling, CSV logging, and provides last-read values for power, voltage, and current.

import { read_P_real, measuredVoltageL1, measuredCurrentL1 } from './cdsHelper';
import { getSinkPowerValue } from './scpiHelper';
import { logging } from './logging';
import { setOutput, setCurrentSetPoint } from './scpiHelper';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import { storagePath } from './globalpaths';

// Globals for polling state and last values
const functionGlobals = {
    intervalActive: false,
    powerValue: 0,
    voltageValue: 0,
    currentValue: 0,
    reset: true
};
let sinkPowerInterval: NodeJS.Timeout | null = null;
let lastSinkPReal: any = null;
let adapter: CdsTcpClient | undefined;

// CSV Logging Variables
let csvLoggingEnabled = false;
let csvFilePath = '';

/**
 * Initializes CSV logging by creating a new file with a timestamped name and header row.
 */
function initializeCsvLogging() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    csvFilePath = join(storagePath, `messwerte_${timestamp}.csv`);
    // Write CSV header
    const header = 'Timestamp,CDS_Power_W,CDS_Voltage_V,CDS_Current_A,Sink_Power_W,Sink_Success\n';
    writeFileSync(csvFilePath, header, 'utf8');
    logging('CSV logging initialized:', csvFilePath);
}

/**
 * Appends a measurement row to the CSV file if logging is enabled.
 */
function logMeasurementToCsv() {
    if (!csvLoggingEnabled || !csvFilePath) return;
    try {
        const timestamp = new Date().toISOString();
        const sinkPower = lastSinkPReal?.successful ? lastSinkPReal.msg : '';
        const sinkSuccess = lastSinkPReal?.successful ? 'true' : 'false';
        const csvLine = `${timestamp},${functionGlobals.powerValue},${functionGlobals.voltageValue},${functionGlobals.currentValue},${sinkPower},${sinkSuccess}\n`;
        appendFileSync(csvFilePath, csvLine, 'utf8');
    } catch (error) {
        console.error('Error writing to CSV:', error);
    }
}

/**
 * Starts CSV logging and creates a new file if not already active.
 * @returns Success status and file path
 */
export function startCsvLogging() {
    if (!csvLoggingEnabled) {
        csvLoggingEnabled = true;
        initializeCsvLogging();
        return { success: true, filePath: csvFilePath };
    }
    return { success: false, message: 'CSV logging already active' };
}

/**
 * Stops CSV logging and clears file path.
 * @returns Success status and last file path
 */
export function stopCsvLogging() {
    csvLoggingEnabled = false;
    const filePath = csvFilePath;
    csvFilePath = '';
    logging('CSV logging stopped');
    return { success: true, filePath: filePath };
}

/**
 * Returns current CSV logging status and file info.
 */
export function getCsvLoggingStatus() {
    return {
        enabled: csvLoggingEnabled,
        filePath: csvFilePath,
        fileExists: csvFilePath ? existsSync(csvFilePath) : false
    };
}

// CDS Power Polling
// (Commented out legacy polling functions for reference)
/*
export async function startPowerPollingCDS(ip: string, intervalMs = 1000) {
    // ...existing code...
}
export function stopPowerPollingCDS() {
    // ...existing code...
}
*/

/**
 * Returns last polled CDS power value (Watt).
 */
export async function getLastPowerCDS() {
    return functionGlobals.powerValue;
}

/**
 * Starts periodic polling of sink power value using SCPI.
 * Updates lastSinkPReal with latest result.
 * @param ip IP address of sink
 * @param intervalMs Polling interval in ms
 * @param timeoutMs Timeout for polling (unused)
 */
export function startSinkPowerPolling(ip: string, intervalMs = 1000, timeoutMs = 3000) {
    let SinkPowerValue = { successful: false, msg: '' };
    if (sinkPowerInterval) return; // Already active
    sinkPowerInterval = setInterval(async () => {
        try {
            const result = await getSinkPowerValue({ HostIp: ip });
            SinkPowerValue = result !== undefined ? result : { successful: false, msg: '' };
            SinkPowerValue.successful = true;
            lastSinkPReal = SinkPowerValue;
            return SinkPowerValue;
        } catch (err) {
            lastSinkPReal = SinkPowerValue;
        }
    }, intervalMs);
}

/**
 * Stops sink power polling interval.
 */
export function stopSinkPowerPolling() {
    if (sinkPowerInterval) {
        clearInterval(sinkPowerInterval);
        sinkPowerInterval = null;
    }
}

/**
 * Returns last polled sink power value.
 */
export function getLastSinkPowerValue() {
    return lastSinkPReal;
}

import { CdsTcpClient } from '@compact-charger/e2e-automation-controller';
// Voltage Polling Functions (legacy, commented out)
/*
export async function startVoltagePollingCDS(ip: string, intervalMs = 1000) {
    // ...existing code...
}
*/

/**
 * Starts periodic polling of CDS for voltage, power, and current values.
 * Updates global values and logs to CSV if enabled.
 * @param ip IP address of CDS
 * @param intervalMs Polling interval in ms
 */
export async function startPollingCDS(ip: string, intervalMs = 1000) {
    try {
        // Stop any existing polling first
        if (functionGlobals.intervalActive) {
            stopPollingCDS();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (adapter === undefined) {
            logging('Starting Global Status for CDS Adapter');
            adapter = new CdsTcpClient({ ip: ip, port: 51001 });
            adapter.startGlobalStatus();
            functionGlobals.intervalActive = true;
        }
        // Poll voltage
        const resultV = await measuredVoltageL1({ adapter: adapter, ip: ip });
        const voltage = Math.round(resultV);
        logging('CDS Voltage L1:', voltage, 'V');
        functionGlobals.voltageValue = voltage;
        // Poll power
        const resultP = await read_P_real({ adapter: adapter, ip: ip });
        const power = Math.round(resultP);
        logging('CDS Power:', power, 'W');
        if (power > 0) functionGlobals.powerValue = power;
        // Poll current
        const resultC = await measuredCurrentL1({ adapter: adapter, ip: ip });
        const current = Math.round(resultC);
        logging('CDS Current L1:', current, 'A');
        functionGlobals.currentValue = current;
        // Log to CSV if enabled
        logMeasurementToCsv();
    } catch (err) {
        console.error('Error in cdsPolling:', err);
    } finally {
        if (functionGlobals.intervalActive) {
            setTimeout(() => { startPollingCDS(ip, intervalMs); }, intervalMs);
        }
    }
}

/**
 * Stops CDS polling and disconnects adapter.
 */
export function stopPollingCDS() {
    try {
        functionGlobals.intervalActive = false;
        if (adapter) {
            logging('Stopping Global Status for CDS Adapter');
            try {
                adapter.stopGlobalStatus();
            } catch (e) {
                console.error('Error stopping global status:', e);
            }
            try {
                adapter.disconnect();
            } catch (e) {
                console.error('Error disconnecting adapter:', e);
            }
            adapter = undefined; // Clear reference
        }
    } catch (error) {
        console.error('Error in stopPollingCDS:', error);
    }
}

/*
export function stopVoltagePollingCDS() {
    // ...existing code...
}
*/

/**
 * Returns last polled CDS voltage value (Volt).
 */
export function getLastVoltageCDS() {
    return functionGlobals.voltageValue;
}

/**
 * Returns last polled CDS current value (Ampere).
 */
export function getLastCurrentCDS() {
    return functionGlobals.currentValue;
}