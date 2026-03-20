const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const db = require('./models/db');

// Import routes
const workflowRoutes = require('./routes/workflows');
const stepRoutes = require('./routes/steps');
const ruleRoutes = require('./routes/rules');
const executionRoutes = require('./routes/executions');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5000', 'https://workflow-automation-engine-1.onrender.com'],
    credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api', stepRoutes); 
app.use('/api', ruleRoutes); 
app.use('/api', executionRoutes); 
app.use('/api/auth', authRoutes);

// The "catchall" handler for all other routes
app.get('*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
