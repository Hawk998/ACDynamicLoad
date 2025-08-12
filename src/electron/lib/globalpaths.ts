// globalpaths.ts
// Defines global filesystem paths for configuration, storage, and logging for the AC Dynamic Load application.
// Uses OS-specific home directory and standard locations for app data.

import { join } from 'path';
import { homedir } from 'os';

// Application name used for directory structure
export const appName = 'ACDynamicLoad';

// Main storage path for application data (e.g., C:\Users\<user>\AppData\Local\ACDynamicLoad)
export const storagePath = join(homedir(), 'AppData', 'Local', appName);

// Path for configuration files (e.g., ...\ACDynamicLoad\config)
export const configStoragePath = join(storagePath, 'config');

// Path to main configuration JSON file (e.g., ...\ACDynamicLoad\config\config.json)
export const configFilePath = join(configStoragePath, 'config.json');

// Path for log files (e.g., ...\ACDynamicLoad\log)
export const logfilePath = join(storagePath, 'log');