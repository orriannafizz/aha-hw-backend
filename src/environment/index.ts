import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;
const SEND_GRID_API_KEY = process.env.SEND_GRID_API_KEY;

export {
  DATABASE_URL,
  NODE_ENV,
  FRONTEND_URL,
  BACKEND_URL,
  PORT,
  SEND_GRID_API_KEY,
};
