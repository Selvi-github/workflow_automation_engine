const express = require('express');
const router = express.Router();
const db = require('../models/db');
const executionEngine = require('../engine/executionEngine');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /workflows/:workflow_id/execute → start execution
router.post('/workflows/:workflow_id/execute', async (req, res) => {
    const { workflow_id } = req.params;
    const { data, triggered_by } = req.body;
    try {
        const execution = await executionEngine.startExecution(workflow_id, data, triggered_by);
        res.status(201).json(execution);
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || 'Unknown Execution Error', stack: err.stack });
    }
});

// GET /executions/pending-approvals → get executions waiting for current user's role
router.get('/executions/pending-approvals', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role;
        
        // Find executions that are in_progress and have a current_step
        const result = await db.query(
            `SELECT e.*, w.name as workflow_name, s.name as step_name, s.metadata as step_metadata
             FROM executions e
             JOIN workflows w ON e.workflow_id = w.id
             JOIN steps s ON e.current_step_id = s.id
             WHERE e.status = 'in_progress' AND s.step_type = 'approval'
             ORDER BY e.started_at DESC`
        );

        // Filter by role (unless admin)
        const pending = result.rows.filter(ex => {
            if (userRole === 'admin') return true;
            const requiredRole = ex.step_metadata?.required_role || 'manager';
            return userRole === requiredRole;
        });

        res.json(pending);
    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /executions/:id/approve → approve or reject a step
router.post('/executions/:id/approve', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;
    const user = req.user;

    try {
        // 1. Get current execution and step info
        const exResult = await db.query(
            'SELECT e.*, s.metadata as step_metadata FROM executions e JOIN steps s ON e.current_step_id = s.id WHERE e.id = $1',
            [id]
        );
        
        if (exResult.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found or not at an approval step' });
        }
        
        const execution = exResult.rows[0];
        const requiredRole = execution.step_metadata?.required_role || 'manager';

        // 2. Access control
        if (user.role !== 'admin' && user.role !== requiredRole) {
            return res.status(403).json({ 
                error: `Access denied. This step requires ${requiredRole.toUpperCase()} approval.` 
            });
        }

        const result = await executionEngine.approveStep(id, approved, user.name);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
});

// GET /executions/:id → get execution status and full logs
router.get('/executions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM executions WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /executions/:id/cancel → cancel running execution
router.post('/executions/:id/cancel', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executionEngine.cancelExecution(id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
});

// POST /executions/:id/retry → retry failed step only
router.post('/executions/:id/retry', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await executionEngine.retryStep(id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
});

// GET /executions → list all executions with pagination
router.get('/executions', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const result = await db.query(
            `SELECT e.id, e.workflow_id, e.status, e.triggered_by, e.started_at, e.ended_at, w.name as workflow_name
             FROM executions e 
             LEFT JOIN workflows w ON e.workflow_id = w.id 
             ORDER BY e.started_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
