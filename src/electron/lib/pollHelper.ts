import { read_P_real, measuredVoltageL1, measuredCurrentL1 } from './cdsHelper';
import { getSinkPowerValue } from './scpiHelper'; 
import {logging} from './logging'
import { setOutput ,setCurrentSetPoint} from './scpiHelper';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import { storagePath } from './globalpaths';

const functionGlobals={intervalActive:false,powerValue:0,voltageValue: 0,currentValue: 0,reset:true }
let sinkPowerInterval: NodeJS.Timeout | null = null;
let lastSinkPReal: any = null;
let adapter: CdsTcpClient | undefined;

// CSV Logging Variables
let csvLoggingEnabled = false;
let csvFilePath = '';

// CSV Logging Functions
function initializeCsvLogging() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    csvFilePath = join(storagePath, `messwerte_${timestamp}.csv`);
    
    // CSV Header schreiben
    const header = 'Timestamp,CDS_Power_W,CDS_Voltage_V,CDS_Current_A,Sink_Power_W,Sink_Success\n';
    writeFileSync(csvFilePath, header, 'utf8');
    
    logging('CSV logging initialized:', csvFilePath);
}

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

export function startCsvLogging() {
    if (!csvLoggingEnabled) {
        csvLoggingEnabled = true;
        initializeCsvLogging();
        return { success: true, filePath: csvFilePath };
    }
    return { success: false, message: 'CSV logging already active' };
}

export function stopCsvLogging() {
    csvLoggingEnabled = false;
    const filePath = csvFilePath;
    csvFilePath = '';
    logging('CSV logging stopped');
    return { success: true, filePath: filePath };
}

export function getCsvLoggingStatus() {
    return {
        enabled: csvLoggingEnabled,
        filePath: csvFilePath,
        fileExists: csvFilePath ? existsSync(csvFilePath) : false
    };
}
// CDS Power Polling
// Voltage Polling globals
/*
export async function startPowerPollingCDS(ip: string, intervalMs = 1000) {
        try {
        functionGlobals.powerIntervalActive = true
        const result = await read_P_real({ ip: ip });
        const power = Math.round(result)
        logging('CDS Power:', power, 'W');
        if(power>0)functionGlobals.powerValue = power       
        }  catch (err) {
            console.error('Error in startPowerPollingCDS:', err)
        } finally {       
        if(functionGlobals.powerIntervalActive) setTimeout(() => {startPowerPollingCDS(ip, intervalMs);})
        }
}
export function stopPowerPollingCDS() {
    functionGlobals.powerIntervalActive = false;
}
*/

export async function getLastPowerCDS() {
    return functionGlobals.powerValue;
}

export function startSinkPowerPolling(ip: string, intervalMs = 1000, timeoutMs = 3000) {
    let SinkPowerValue = { successful: false, msg: '' };
    if (sinkPowerInterval) return; // Schon aktiv
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


export function stopSinkPowerPolling() {
    if (sinkPowerInterval) {
        clearInterval(sinkPowerInterval);
        sinkPowerInterval = null;
    }
}

export function getLastSinkPowerValue() {
    return lastSinkPReal;
}

import { CdsTcpClient } from '@compact-charger/e2e-automation-controller';
// Voltage Polling Functions
/*
export async function startVoltagePollingCDS(ip: string, intervalMs = 1000) {
    try {
        if(adapter===undefined)adapter = new CdsTcpClient({ ip: ip, port: 51001 })
        voltageGlobals.voltageIntervalActive = true;
        const result = await measuredVoltageL1({ adapter: adapter, ip: ip });
        const voltage = Math.round(result);
        logging('CDS Voltage L1:', voltage, 'V');
        if (voltage > 0) voltageGlobals.voltageValue = voltage;
    } catch (err) {
        console.error('Error in startVoltagePollingCDS:', err);
    } finally {
        if (voltageGlobals.voltageIntervalActive) {
            setTimeout(() => { startVoltagePollingCDS(ip, intervalMs); }, intervalMs);
        }
    }
}*/

export async function startPollingCDS(ip: string, intervalMs = 1000) {
    try {
        // Stop any existing polling first
        if (functionGlobals.intervalActive) {
            stopPollingCDS();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if(adapter === undefined) {
            logging('Starting Global Status for CDS Adapter');
            adapter = new CdsTcpClient({ ip: ip, port: 51001 })
            adapter.startGlobalStatus();
            functionGlobals.intervalActive = true;
        }
        const resultV = await measuredVoltageL1({ adapter: adapter, ip: ip });
        const voltage = Math.round(resultV);
        logging('CDS Voltage L1:', voltage, 'V');
        functionGlobals.voltageValue = voltage;

        const resultP = await read_P_real({adapter: adapter, ip: ip });
        const power = Math.round(resultP);
        logging('CDS Power:', power, 'W');
        if(power>0)functionGlobals.powerValue = power

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
    voltageGlobals.voltageIntervalActive = false;
}*/

export function getLastVoltageCDS() {
    return functionGlobals.voltageValue;
}

export function getLastCurrentCDS() {
    return functionGlobals.currentValue;
}