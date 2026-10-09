import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌿 Starting Virtual Herbal Garden – AYUSH & Vastu Planner...');

// Start Server
const server = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

// Start Client
const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});
