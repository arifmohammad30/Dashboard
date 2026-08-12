import { exec, spawn } from 'child_process';
import path from 'path';

console.log('LAUNCHING PRISMA STUDIO WEB SERVER');

const studioPath = path.resolve('node_modules/prisma/build/index.js');

const studio = spawn(process.execPath, [studioPath, 'studio', '--schema', 'prisma/schema.prisma', '--port', '5555'], {
  stdio: 'inherit'
});

setTimeout(() => {
  console.log('Opening browser at http://localhost:5555');
  exec('start http://localhost:5555');
}, 2000);

studio.on('error', (err) => {
  console.error('Failed to start Prisma Studio:', err);
});

studio.on('close', (code) => {
  console.log(`Prisma Studio exited with code ${code}`);
});
