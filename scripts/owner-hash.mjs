// Prints the SHA-256 owner hash of an email (lower-cased, trimmed). Usage: npm run owner:hash someone@example.com
import { createHash } from 'node:crypto';
const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email.includes('@')) { console.error('Usage: npm run owner:hash <email>'); process.exit(1); }
console.log(createHash('sha256').update(email).digest('hex'));
