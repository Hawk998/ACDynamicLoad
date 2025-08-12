// cdsHelper.ts
// Helper functions for communicating with CDS (Compact Charger) via TCP.
// Provides utilities for reading EV/EVSE states, currents, voltages, and power values.

import { CdsTcpClient } from '@compact-charger/e2e-automation-controller';
import { logging } from './logging';

/**
 * Reads the CP (Control Pilot) state from the charger and translates it to a readable string.
 * @param args Object containing IP address of CDS
 * @returns CP state as string (A1, B1, B2, C1, C2, F, or Unknown)
 */
async function readCpState(args: { ip: string }) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 });
    adapter.startGlobalStatus();
    const cpState = await adapter.getValue(0x00, 0x14);
    logging('foo:checkCpState:cpState:', cpState);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    // Translate cpState result
    let result = 'Unknown';
    if (cpState[1] === 0x01) {
        result = 'A1';
    } else if (cpState[1] === 0x02) {
        result = 'B1';
    } else if (cpState[1] === 0x03) {
        result = 'B2';
    } else if (cpState[1] === 0x04) {
        result = 'C1';
    } else if (cpState[1] === 0x05) {
        result = 'C2';
    } else if (cpState[1] === 0x06) {
        result = 'F';
    }
    return result;
}

/**
 * Reads the maximum AC current allowed for the EV from CDS.
 * @param args Object containing IP address of CDS
 * @returns Maximum current (float)
 */
async function readEvMaxCurrentAc(args: { ip: string }) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 });
    adapter.startGlobalStatus();
    const maxCurrent = await adapter.getValue(0x01, 0x05);
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4]);
    logging('foo:readEvMaxCurrent:numb:', numb);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    return numb;
}

/**
 * Reads the actual charging current for the EV from CDS.
 * @param args Object containing IP address of CDS
 * @returns Charging current (float)
 */
async function readEvChargingCurrentAc(args: { ip: string }) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 });
    adapter.startGlobalStatus();
    const maxCurrent = await adapter.getValue(0x00, 0xe6);
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4]);
    logging('foo:readEvChargingCurrent:numb:', numb);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    return numb;
}

/**
 * Reads the maximum AC current allowed for the EVSE from CDS.
 * @param args Object containing IP address of CDS
 * @returns Maximum current (float)
 */
export async function readEvseMaxCurrentAc(args: { ip: string }) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 });
    adapter.startGlobalStatus();
    const maxCurrent = await adapter.getValue(0x02, 0xe5);
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4]);
    logging('foo:readEvseMaxCurrent:numb:', numb);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    return numb;
}

/**
 * Reads the duty cycle value for the EV from CDS.
 * @param args Object containing IP address of CDS
 * @returns Duty cycle (float)
 */
export async function readEvDuty(args: { ip: string }) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 });
    adapter.startGlobalStatus();
    const maxCurrent = await adapter.getValue(0x07, 0xd4);
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4]);
    logging('foo:readEvseDuty:numb:', numb);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    return numb;
}

/**
 * Reads the maximum current from the PP (Proximity Pilot) pin.
 * @param ip IP address of CDS
 * @returns Maximum current (float)
 */
async function readPPMaxCurrent(ip: string) {
    const adapter = new CdsTcpClient({ ip: ip, port: 51001 });
    adapter.socket.on('connect', () => {
        logging('foo:connected');
    });
    adapter.socket.on('error', (err) => {
        logging('foo:error:', err);
    });
    adapter.startGlobalStatus();
    const maxCurrent = await adapter.getValue(0x09, 0x03);
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4]);
    logging('foo:readPPmaxcurrent:numb:', numb);
    adapter.stopGlobalStatus();
    await adapter.disconnect();
    return numb;
}

/**
 * Reads the real power value (P_real) from CDS.
 * @param args Object containing adapter and IP address
 * @returns Real power (float)
 */
export async function read_P_real(args: { adapter: CdsTcpClient, ip: string }) {
    const P_real = await args.adapter.getValue(0x08, 0x43);
    const numb = args.adapter.hexFloatToNumber(P_real[1], P_real[2], P_real[3], P_real[4]);
    return numb
}

/**
 * Reads the measured voltage on L1 from CDS.
 * @param args Object containing adapter and IP address
 * @returns Voltage L1 (float)
 */
export async function measuredVoltageL1(args: { adapter: CdsTcpClient, ip: string }) {
    const voltageL1 = await args.adapter.getValue(0x08, 0x66)
    const numb = args.adapter.hexFloatToNumber(voltageL1[1], voltageL1[2], voltageL1[3], voltageL1[4])
    return numb
}

/**
 * Reads the measured current on L1 from CDS.
 * @param args Object containing adapter and IP address
 * @returns Current L1 (float)
 */
export async function measuredCurrentL1(args: { adapter: CdsTcpClient, ip: string }) {
    const currentL1 = await args.adapter.getValue(0x08, 0x6C)
    const numb = args.adapter.hexFloatToNumber(currentL1[1], currentL1[2], currentL1[3], currentL1[4])
    return numb
}


