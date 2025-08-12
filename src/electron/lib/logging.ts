import log from 'electron-log'
import { join } from 'path'
import {logfilePath} from'./globalpaths'
// catch errors
log.errorHandler.startCatching()

log.transports.file.resolvePathFn = () => join(logfilePath, `Log-File-${getCurrentDate()}.log`)
export function logging(...args: any[]) {
   log.info( ...args)
}

function getCurrentDate() {
    let date = new Date();
    return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2)
}
