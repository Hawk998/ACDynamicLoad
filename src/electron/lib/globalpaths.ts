import { join } from 'path';
import { homedir } from 'os';

export const appName = 'ACDynamicLoad'
export const storagePath= join(homedir(), 'AppData', 'Local', appName)
export const configStoragePath = join(storagePath, 'config');
export const configFilePath = join(configStoragePath, 'config.json');
export const logfilePath= join(storagePath,'log')