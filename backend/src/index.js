const express = require('express');
const cors = require('cors');
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

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api', stepRoutes); 
app.use('/api', ruleRoutes); 
app.use('/api', executionRoutes); 
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Workflow Engine API is running on port 5000');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
