import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const backend = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server', 'index.js');
const proc = spawn(process.execPath, [backend], { stdio: 'inherit' });

proc.on('exit', (code) => process.exit(code || 0));
process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));
