import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (port 5173 by default)
app.use(cors({
  origin: '*', // For development simplicity, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log incoming API calls
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Hospital Waste Management API', time: new Date().toISOString() });
});

// Root endpoint redirect
app.get('/', (req, res) => {
  res.send('Hospital Waste Management System API Service is running. Access via /api.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 Hospital Waste Backend API active on port ${PORT}`);
  console.log(`🚀 Ready to accept waste logs & AI classifications`);
  console.log(`====================================================`);
});
