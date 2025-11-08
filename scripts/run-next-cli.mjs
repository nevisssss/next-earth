import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [, , command, ...commandArgs] = process.argv;

if (!command) {
  console.error('Usage: node ./scripts/run-next-cli.mjs <command> [...args]');
  process.exit(1);
}

let nextCliPath;
try {
  nextCliPath = require.resolve('next/dist/bin/next');
} catch {
  console.error('Next.js CLI not found. Run `npm install` before executing Next.js commands.');
  process.exit(1);
}

const child = spawn(process.execPath, [nextCliPath, command, ...commandArgs], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to launch the Next.js CLI.', error);
  process.exit(1);
});
