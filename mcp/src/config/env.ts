import dotenv from "dotenv";
dotenv.config();

// ---------------------------
// Environment validation
// ---------------------------
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// ---------------------------
// Export validated environment variables
// ---------------------------
export const PORT = getRequiredEnv('PORT');
export const NODE_ENV = getOptionalEnv('NODE_ENV', 'development');
export const BACKEND_PORT = getRequiredEnv('BACKEND_PORT');
export const BACKEND_URL = getRequiredEnv('BACKEND_URL');
export const GEMINI_API_KEY = getRequiredEnv('GEMINI_API_KEY');
export const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 5);
export const MODEL = getRequiredEnv('MODEL');
export const MONGODB_URI = getRequiredEnv('MONGODB_URI');


