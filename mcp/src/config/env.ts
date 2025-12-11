import dotenv from "dotenv";
dotenv.config(); 

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const BACKEND_PORT= process.env.BACKEND_PORT;
export const BACKEND_URL = process.env.BACKEND_URL;
export const GEMINI_API_KEY= process.env.GEMINI_API_KEY;
export const MAX_HISTORY_MESSAGES= Number(process.env.MAX_HISTORY_MESSAGES ?? 5);
export const MODEL=process.env.MODEL!;

