// logging.ts
// Logging utility for Electron application using electron-log.
// Handles log file creation, error catching, and info logging.

import log from 'electron-log';
import { join } from 'path';
import { logfilePath } from './globalpaths';

// Start catching and logging errors automatically
log.errorHandler.startCatching();

// Configure log file path to use date-based filenames in the log directory
log.transports.file.resolvePathFn = () => join(logfilePath, `Log-File-${getCurrentDate()}.log`);

/**
 * Logs informational messages to the log file and console.
 * Accepts any number of arguments.
 * @param args Data to log
 */
export function logging(...args: any[]) {
    log.info(...args);
}

/**
 * Returns current date as a string in YYYY-MM-DD format.
 * Used for log file naming.
 */
function getCurrentDate() {
    let date = new Date();
    return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
}
