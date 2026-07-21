import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

// Values may also be supplied by the process manager. Never log credential
// values, account identifiers, or machine-specific environment paths here.
dotenv.config({ path: envPath });
