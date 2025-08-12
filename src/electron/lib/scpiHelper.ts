
import { get } from 'http';
import * as net from 'net';
import { logging } from './logging';
const Port = 5025; // SCPI Port, default is 5025

/**
 * createClient
 * Creates a TCP client and connects to the specified SCPI device.
 *
 * @param host - The IP address or hostname of the SCPI device.
 * @returns A Promise that resolves with the connected TCP client (net.Socket).
 * @throws An error if the connection fails.
 *
 * The function establishes a connection to the SCPI device on the specified port.
 * After connecting, it attempts to send the '*IDN?' command to retrieve the device identification.
 * If successful, the device name is logged to the console.
 *
 * Example usage:
 * const client = await createClient('192.168.100.173');
 * logging('Client connected:', client);
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
                console.error('Failed to retrieve device ID:', err.message);
                client.end(); // Close the connection if the command fails
                return reject(new Error('Failed to retrieve device ID'));
            }
            resolve(client); // Resolve the connected client
        });
        client.once('error', (err) => {
            console.error(`Connection error to ${host}:${Port} - ${err.message}`);
            reject(err);
        });
        // Log when the connection is closed
        client.once('close', () => {
            //logging(`Connection to ${host}:${Port} closed`);
        });
    });
}

/**
 * sendCommand
 * Sends an SCPI command to the connected device and waits for a response.
 *
 * @param client - The TCP client socket connected to the SCPI device.
 * @param command - The SCPI command to be sent to the device.
 * @returns A Promise that resolves with an object containing the success status and the response message from the device.
 *          The object has the structure: { successful: boolean, msg: string }.
 * @throws An error if the command fails to send or if the device returns an error.
 *
 * Example usage:
 * const response = await sendCommand(client, 'MEAS:VOLT:DC?');
 * console.log(response.msg); // Logs the response from the device
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
                logging('Received data:', data);
                result.successful = true;
                result.msg = data.toString().trim();
                logging('sendCommand:resolve:', result)
                resolve(result);
            });
            client.once('error', (err: TypeError) => {
                reject(err.message);
            });
            client.write(command + '\n');

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * setVoltagePriorityMode 
 * Sets the device to Voltage Priority Mode (Constant Voltage Mode).
 *
 * @param HostIp - The IP address of the SCPI device.
 * @param OutputVoltageLimitCV - The voltage limit to be set in Voltage Priority Mode (in volts).
 * @param OutputCurrentLimitCV - The current limit to be set in Voltage Priority Mode (in amps).
 *
 * This function configures the device to operate in Voltage Priority Mode, where the voltage is regulated
 * while the current is limited to the specified maximum and minimum values. It sets the voltage and current
 * limits accordingly.
 *
 * Example usage:
 * await setVoltagePriorityMode('192.168.100.173', 12.5, 5.0);
 * // Sets the device to Voltage Priority Mode with a voltage limit of 12.5V and a current limit of ±5A.
 *
 * @throws An error if the connection fails or if the SCPI commands cannot be executed.
 */

// -------- Set Functions -------
// Voltage Priority Mode
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
        console.error('setVoltagePriorityMode:error:', err.message);
        throw err;
    } finally {
        if (client !== null) client.end();
        logging('close scpi connection.');
    }
}

// Current Priority Mode
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
        console.error('setCurrentPriorityMode:error:', err.message);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

export async function setCurrentSetPoint(args: { HostIp: string, CurrentSetPoint: number }) {
    let client: net.Socket | null = null;
    try {
        client = await createClient(args.HostIp);
        logging(`Sink ${args.HostIp} got current setpoint ${args.CurrentSetPoint}`);
        await sendCommand(client, `SOUR:CURR ${args.CurrentSetPoint}`);
        logging('Output current was set to ' + args.CurrentSetPoint + ' A');
    } catch (err) {
        console.error('setCurrentSetPoint:error:', err.message);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}
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
        console.error('getPowerValue:error:', err.message);
        throw err;
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

// Set Output ON/OFF
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
        console.error('setOutput:error:', err.message);
        throw err
    } finally {
        if (client) client.end();
        logging('close scpi connection.');
        
    }
}

// This function calculates the voltage and current based on the given power in watts.
export function defineVoltageCurrent(args: { powerInkW: number, voltage: number }) {
    //Power Adjustment
    //const PowerWithLoss = 0.0069 * args.powerInkW ** 2 + 1 * args.powerInkW + 0.3884; // für 10 kW Module
    const PowerWithLoss =  0.0035 * args.powerInkW ** 2 + 0.9858 * args.powerInkW + 0.5878 // für 2 kW Module
    const AdjustedPowerinkW = 2 * args.powerInkW - PowerWithLoss;
    const current = parseFloat(((AdjustedPowerinkW * 1000) / args.voltage).toFixed(2))
    return { current }
}
