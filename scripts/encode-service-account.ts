import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.join(__dirname, './service-account.json');
const envVarName = 'FIREBASE_SERVICE_ACCOUNT_BASE64';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('service-account.json not found!');
  process.exit(1);
}

const json = fs.readFileSync(serviceAccountPath, 'utf8');
const base64 = Buffer.from(json).toString('base64');

console.log(`${envVarName}=${base64}`);