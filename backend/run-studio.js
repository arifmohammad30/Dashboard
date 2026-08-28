import { exec, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'prisma/dev.db').replace(/\\/g, '/');
const dbUrl = `file:${dbPath}`;

process.env.DATABASE_URL = dbUrl;

console.log(`LAUNCHING PRISMA STUDIO WEB SERVER`);
console.log(`Database URL: ${dbUrl}`);

const studioPath = path.resolve('node_modules/prisma/build/index.js');

const env = { ...process.env, DATABASE_URL: dbUrl };

const studio = spawn(process.execPath, [studioPath, 'studio', '--schema', 'prisma/schema.prisma', '--port', '5555'], {
  stdio: 'inherit',
  env
});

setTimeout(() => {
  console.log('Opening browser at http://localhost:5555');
  exec('start http://localhost:5555');
}, 2500);

studio.on('error', (err) => {
  console.error('Failed to start Prisma Studio:', err);
});

studio.on('close', (code) => {
  console.log(`Prisma Studio exited with code ${code}`);
});
