#!/usr/bin/env tsx

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Regexec development servers...\n');

// Start Next.js frontend
console.log('📱 Starting Next.js frontend on http://localhost:3000');
const nextjs: ChildProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start Socket.io backend
console.log('🔌 Starting Socket.io backend on http://localhost:3001');
const socketServer: ChildProcess = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
const cleanup = (): void => {
  console.log('\n🛑 Shutting down development servers...');
  nextjs.kill('SIGINT');
  socketServer.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle errors
nextjs.on('error', (err: Error) => {
  console.error('❌ Next.js error:', err);
});

socketServer.on('error', (err: Error) => {
  console.error('❌ Socket server error:', err);
});

// Handle process exits
nextjs.on('exit', (code: number | null) => {
  if (code !== 0) {
    console.error(`❌ Next.js process exited with code ${code}`);
  }
});

socketServer.on('exit', (code: number | null) => {
  if (code !== 0) {
    console.error(`❌ Socket server process exited with code ${code}`);
  }
});

console.log('\n✅ Both servers started! Press Ctrl+C to stop both.');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔌 Backend: http://localhost:3001');
console.log('📊 Health check: http://localhost:3001/health\n');