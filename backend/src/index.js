import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import { configureMicrosoftStrategy } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'finkan',
  ssl: false
});

console.log('Attempting to connect to PostgreSQL with config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    if (err.code === '28P01') {
      console.error('Authentication failed. Please check your database credentials.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Could not connect to PostgreSQL. Please check if the database is running.');
    }
  }
}

testConnection();


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'keyboard_cat'));
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: process.env.COOKIE_SECRET || 'keyboard_cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());
configureMicrosoftStrategy(pool);


app.use((req, res, next) => {
  req.db = pool;
  next();
});


import authRouter from './routes/auth.js';
app.use('/auth', authRouter);


app.use('/api', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});