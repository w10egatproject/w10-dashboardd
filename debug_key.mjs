
import { config } from 'dotenv';
config();

const rawKey = process.env.GOOGLE_PRIVATE_KEY;
const rawEmail = process.env.GOOGLE_CLIENT_EMAIL;
const sheetId = process.env.GOOGLE_SHEET_ID;

console.log('GOOGLE_PRIVATE_KEY length:', rawKey ? rawKey.length : 0);
console.log('GOOGLE_CLIENT_EMAIL:', rawEmail);
console.log('GOOGLE_SHEET_ID:', sheetId);
