import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const DB_DIR = process.env.WISE_DB_DIR || resolve(__dirname, '../../data');
const DB_PATH = resolve(DB_DIR, 'wise.sqlite3');

let dbInstance: Database | null = null;
let sqlJs: any = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!sqlJs) {
    sqlJs = await initSqlJs({
      locateFile: () => resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm')
    });
  }

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  let db: Database;
  if (existsSync(DB_PATH)) {
    const filebuffer = readFileSync(DB_PATH);
    db = new sqlJs.Database(new Uint8Array(filebuffer));
  } else {
    db = new sqlJs.Database();
  }

  db.exec('PRAGMA foreign_keys = ON;');

  dbInstance = db;
  return db;
}

export function getDatabaseSync(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call getDatabase() first.');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    const data = dbInstance.export();
    writeFileSync(DB_PATH, Buffer.from(data));
    dbInstance.close();
    dbInstance = null;
  }
}

export function saveDatabase(): void {
  if (dbInstance) {
    const data = dbInstance.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  }
}