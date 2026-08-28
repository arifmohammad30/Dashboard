import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbUrl = `file:${path.resolve(__dirname, 'prisma/dev.db').replace(/\\/g, '/')}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }do  }
});

export default prisma;
