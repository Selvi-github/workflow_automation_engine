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

// --- SENIOR-LEVEL ASSET SERVING ---
// Serve static files from the built frontend directory
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api', stepRoutes); 
app.use('/api', ruleRoutes); 
app.use('/api', executionRoutes); 
app.use('/api/auth', authRoutes);

// --- SMART SPA CATCH-ALL ---
// Serve index.html for any request that isn't an API call.
// This handles the "blank screen on refresh" (SPA routing) perfectly.
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next(); // Pass to 404 handler for missing API routes
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// --- GLOBAL ERROR HANDLER ---
// Senior practice: Catch-all for any unhandled errors in the pipeline
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL API ERROR:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler for missing API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
