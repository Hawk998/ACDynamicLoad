// scpiHelper.ts
// Helper functions for communicating with SCPI devices via TCP sockets.
// Provides utilities for setting modes, output, current, and reading power values.

import * as net from 'net';
import { logging } from './logging';
const Port = 5025; // SCPI Port, default is 5025

/**
 * Creates a TCP client and connects to the specified SCPI device.
 * Sends '*IDN?' to retrieve device identification.
 * @param host IP address or hostname of SCPI device
 * @returns Promise resolving with connected net.Socket
 */
function createClient(host: string): Promise<net.Socket> {
    const client = new net.Socket();
    return new Promise((resolve, reject) => {
        client.connect(Port, host, async () => {
            //logging(`Connected to SCPI device at ${host}:${Port}`);
            try {
                // Send the '*IDN?' command and wait for the response
                const idnResponse = await sendCommand(client, '*IDN?');
                logging('Device Name:', idnResponse.msg); // Log the device identification
            } catch (err) {
                console.error('Failed to retrieve device ID:', err);
                client.end(); // Close the connection if the command fails
                return reject(new Error('Failed to retrieve device ID'));
            }
            resolve(client); // Resolve the connected client
        });
        client.once('error', (err) => {
            console.error(`Connection error to ${host}:${Port} - ${err}`);
            reject(err);
        });
        // Log when the connection is closed
        client.once('close', () => {
            //logging(`Connection to ${host}:${Port} closed`);
        });
    });
}

/**
 * Sends an SCPI command to the device and waits for response.
 * @param client Connected net.Socket
 * @param command SCPI command string
 * @returns Promise resolving with { successful, msg } object
 */
async function sendCommand(client: net.Socket, command: string) {
    return new Promise<{ successful: boolean, msg: string }>((resolve, reject) => {
        const result = { successful: false, msg: '' };
        try {
            const timeout = setTimeout(() => {
                result.successful = true
                result.msg = 'no data recieved';
                resolve(result)
            }, 1000)
            client.once('data', (data) => {
                clearTimeout(timeout);
                //logging('Received data:', data);
                result.successful = true;
                result.msg = data.toString().trim();
                logging('sendCommand:resolve:', result)
                resolve(result);
            });
            client.once('error', (err: TypeError) => {
                reject(err);
            });
            client.write(command + '\n');

        } catch (error) {
            reject(error);
        }
    });
}

// -------- Set Functions -------
/**
 * Sets device to Voltage Priority Mode (Constant Voltage Mode).
 * Configures voltage and current limits.
 * @param args HostIp, OutputVoltageLimitCV, OutputCurrentLimitCV
 */
export async function setVoltagePriorityMode(args: { HostIp: string, OutputVoltageLimitCV: number, OutputCurrentLimitCV: number }) {
    let client: net.Socket | null = null;
    const maxCurrent = Math.abs(args.OutputCurrentLimitCV);
    const minCurrent = -Math.abs(args.OutputCurrentLimitCV);
    try {
        logging('setVoltagePriorityMode:HostIp:', args.HostIp);
        client = await createClient(args.HostIp);
        logging(`Sink ${args.HostIp} is set to Voltage Priority Mode`);
        const foo = await sendCommand(client, 'SOUR:FUNC VOLT'); // Set function to voltage priority mode
        logging('Foo:', foo);
        await sendCommand(client, `SOUR:CURR:LIM:POS:IMM:AMPL ${maxCurrent}`); // set max current
        await sendCommand(client, `SOUR:CURR:LIM:NEG:IMM:AMPL ${minCurrent}`); // set min current
        logging('Output current limit was set to ' + args.OutputCurrentLimitCV + ' A');
        await sendCommand(client, `SOUR:VOLT:LEV:IMM:AMPL ${args.OutputVoltageLimitCV}`); // set voltage limit in voltage priority mode
        logging('Output voltage limit was set to ' + args.OutputVoltageLimitCV + ' V');
    } catch (err) {
        console.error('setVoltagePriorityMode:error:', err);
        throw err;
    } finally {
        if (client !== null) client.end();
        logging('close scpi connection.');
    }
}

/**
 * Sets device to Current Priority Mode (Constant Current Mode).
 * Configures current and voltage limits.
 * @param args HostIp, OutputCurrentLimitCC, OutputVoltageLimitCC
 */
export async function setCurrentPriorityMode(args: { HostIp: string, OutputCurrentLimitCC: number, OutputVoltageLimitCC: number }) {
    let client: net.Socket | null = null;
    const minCurrent = Math.abs(args.OutputCurrentLimitCC);
    try {
        client = await createClient(args.HostIp);
        logging(`Sink ${args.HostIp} is set to Current Priority Mode`);
        await sendCommand(client, 'SOUR:FUNC CURR'); // Set function to current priority mode
        //await sendCommand(client, `SOUR:CURR:LEV:IMM:AMPL ${minCurrent}`); // set min current
        await sendCommand(client, `SOUR:CURR ${minCurrent}`);
        logging('Output current was set to ' + args.OutputCurrentLimitCC + ' A');
        await sendCommand(client, `SOUR:VOLT:LIM:POS:IMM:AMPL ${args.OutputVoltageLimitCC}`); // set voltage limit in current priority mode
    } catch (err) {
        console.error('setCurrentPriorityMode:error:', err);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

/**
 * Sets the current setpoint for the device.
 * @param args HostIp, CurrentSetPoint
 */
export async function setCurrentSetPoint(args: { HostIp: string, CurrentSetPoint: number }) {
    let client: net.Socket | null = null;
    try {
        client = await createClient(args.HostIp);
        logging(`Sink ${args.HostIp} got current setpoint ${args.CurrentSetPoint}`);
        await sendCommand(client, `SOUR:CURR ${args.CurrentSetPoint}`);
        logging('Output current was set to ' + args.CurrentSetPoint + ' A');
    } catch (err) {
        console.error('setCurrentSetPoint:error:', err);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

/**
 * Reads the output power value from the device (in Watts).
 * @param args HostIp
 * @returns Object with success status and power value
 */
export async function getSinkPowerValue(args: { HostIp: string}) {
    let client: net.Socket | null = null;
    let powerinW = {successful: false, msg: ''};
    try {
        client = await createClient(args.HostIp);
        powerinW = await sendCommand(client, `MEAS:POW?`);
        logging('Output power ' + powerinW.msg + ' W');
        powerinW.successful = true;
        return powerinW;
    } catch (err) {        
        console.error('getPowerValue:error:', err);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

/**
 * Sets the output state (ON/OFF) of the device.
 * @param args HostIp, OutputState (boolean)
 */
export async function setOutput(args: { HostIp: string, OutputState: boolean }) {
    let client: net.Socket | null = null;
    try {
        client = await createClient(args.HostIp);
        if (args.OutputState === true) {
            logging('Set Output ON');
            await sendCommand(client, 'OUTP ON');
        } else {
            logging('Set Output OFF');
            await sendCommand(client, 'OUTP OFF');
        }
        
    } catch (err) {
        console.error('setOutput:error:', err);
        throw err
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

/**
 * Calculates the current based on given power (kW) and voltage.
 * Uses quadratic loss adjustment for 2 kW modules.
 * @param args powerInkW, voltage
 * @returns Object with calculated current
 */
export function defineVoltageCurrent(args: { powerInkW: number, voltage: number }) {
    //Power Adjustment
    //const PowerWithLoss = 0.0069 * args.powerInkW ** 2 + 1 * args.powerInkW + 0.3884; //  10 kW 
    const PowerWithLoss =  0.0035 * args.powerInkW ** 2 + 0.9858 * args.powerInkW + 0.5878 //  20 kW 
    const AdjustedPowerinkW = 2 * args.powerInkW - PowerWithLoss;
    const current = parseFloat(((AdjustedPowerinkW * 1000) / args.voltage).toFixed(2))
    return { current }
}

/**
 * Sets the group mode of the SCPI device (Master, Slave, or None).
 *
 * This function connects to the specified SCPI device via TCP, sends the group mode command,
 * and logs the configuration. The available modes are:
 * - 'MAST': Master mode
 * - 'SLAV': Slave mode
 * - 'NONE': No group mode
 *
 * Example usage:
 *   await setGroupMode({ HostIp: '192.168.100.173', Group: 'MAST' });
 *
 * @param args Object containing:
 *   - HostIp: IP address of the SCPI device
 *   - Group: Desired group mode ('MAST', 'SLAV', 'NONE')
 * @throws Error if the connection or command fails
 */
export async function setGroupMode(args: { HostIp: string, Group: string }) {
    let client: net.Socket | null = null;
    try {
        client = await createClient(args.HostIp);
        await sendCommand(client, `INST:GRO:FUNC ${args.Group}`);  
        logging(`Sink ${args.HostIp} configured to Group Mode: ${args.Group}`);
    } catch (err) {
        console.error('setGroupMode:error:', err);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}


//setGroupMode({ HostIp: '192.168.100.162', Group: 'SLAV' }).then(()=>{console.log('res')})