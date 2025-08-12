import { CdsTcpClient } from '@compact-charger/e2e-automation-controller';
import { logging } from './logging'

async function readCpState(args: {ip: string}) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 })
    adapter.startGlobalStatus()
    const cpState = await adapter.getValue(0x00, 0x14)
    logging('foo:checkCpState:cpState:', cpState)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    // translate cpState res
    let result = 'Unknown'
    if (cpState[1] === 0x01) {
        result = 'A1'
    } else if (cpState[1] === 0x02) {
        result = 'B1'
    } else if (cpState[1] === 0x03) {
        result = 'B2'
    } else if (cpState[1] === 0x04) {
        result = 'C1'
    } else if (cpState[1] === 0x05) {
        result = 'C2'
    } else if (cpState[1] === 0x06) {
        result = 'F'
    }
    return result
}

async function readEvMaxCurrentAc(args: {ip: string}) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 })
    adapter.startGlobalStatus()
    const maxCurrent = await adapter.getValue(0x01, 0x05)
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4])
    logging('foo:readEvMaxCurrent:numb:', numb)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    return numb
}

async function readEvChargingCurrentAc(args: {ip: string}) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 })
    adapter.startGlobalStatus()
    const maxCurrent = await adapter.getValue(0x00, 0xe6)
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4])
    logging('foo:readEvChargingCurrent:numb:', numb)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    return numb
}

export async function readEvseMaxCurrentAc(args: {ip: string}) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 })
    adapter.startGlobalStatus()
    const maxCurrent = await adapter.getValue(0x02, 0xe5)
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4])
    logging('foo:readEvseMaxCurrent:numb:', numb)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    return numb
}

export async function readEvDuty(args: {ip: string}) {
    const adapter = new CdsTcpClient({ ip: args.ip, port: 51001 })
    adapter.startGlobalStatus()
    const maxCurrent = await adapter.getValue(0x07, 0xd4)
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4])
    logging('foo:readEvseDuty:numb:', numb)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    return numb
}

async function readPPMaxCurrent(ip: string) {
    const adapter = new CdsTcpClient({ ip: ip, port: 51001 })
    adapter.socket.on('connect', () => {
        logging('foo:connected');
    });
    adapter.socket.on('error', (err) => {
        logging('foo:error:', err);
    });
    adapter.startGlobalStatus()
    const maxCurrent = await adapter.getValue(0x09, 0x03)
    const numb = adapter.hexFloatToNumber(maxCurrent[1], maxCurrent[2], maxCurrent[3], maxCurrent[4])
    logging('foo:readPPmaxcurrent:numb:', numb)
    adapter.stopGlobalStatus()
    await adapter.disconnect()
    return numb

}

export async function read_P_real (args: {adapter: CdsTcpClient, ip: string}) {
    const P_real = await args.adapter.getValue(0x08, 0x43)
    const numb = args.adapter.hexFloatToNumber(P_real[1], P_real[2], P_real[3], P_real[4])
    return numb
}


export async function measuredVoltageL1 (args: {adapter:CdsTcpClient,ip: string}) {
    const voltageL1 = await args.adapter.getValue(0x08, 0x66)
    const numb = args.adapter.hexFloatToNumber(voltageL1[1], voltageL1[2], voltageL1[3], voltageL1[4])
    return numb
}

export async function measuredCurrentL1 (args: {adapter:CdsTcpClient,ip: string}) {
    const currentL1 = await args.adapter.getValue(0x08, 0x6C)
    const numb = args.adapter.hexFloatToNumber(currentL1[1], currentL1[2], currentL1[3], currentL1[4])
    return numb
}


