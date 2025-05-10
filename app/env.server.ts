// A simple utility to ensure environment variables are loaded properly
// and to provide type-safe access to environment variables
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env variables
const result = config();

// Check if .env was loaded successfully
if (result.error || !process.env.MORESLEEP_BASIC_AUTH) {
  console.warn('Warning: .env file not loaded or missing required variables.');
  
  // Try to load from .env file directly if dotenv fails
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
            console.log(`Manually loaded environment variable: ${key}`);
          }
        }
      });
    } else {
      console.error('.env file not found in', process.cwd());
    }
  } catch (err) {
    console.error('Error manually loading .env file:', err);
  }
}

// Validate that required variables are present
if (!process.env.MORESLEEP_BASIC_AUTH) {
  console.error('MORESLEEP_BASIC_AUTH environment variable is missing or empty.');
}

// Export our environment variables with appropriate types
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  MORESLEEP_BASIC_AUTH: process.env.MORESLEEP_BASIC_AUTH || '',
  // Add other environment variables as needed
};

export default ENV; 