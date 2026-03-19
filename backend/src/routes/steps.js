const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { validateStep } = require('../middleware/validation');

// GET /steps/:id → get step details
router.get('/steps/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM steps WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Step not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /workflows/:workflow_id/steps → add step
router.post('/workflows/:workflow_id/steps', validateStep, async (req, res) => {
    const { workflow_id } = req.params;
    const { name, step_type, step_order, metadata } = req.body;
    const id = uuidv4();
    try {
        const result = await db.query(
            'INSERT INTO steps (id, workflow_id, name, step_type, step_order, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, workflow_id, name, step_type, step_order, metadata]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /workflows/:workflow_id/steps → list steps
router.get('/workflows/:workflow_id/steps', async (req, res) => {
    const { workflow_id } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM steps WHERE workflow_id = $1 ORDER BY step_order',
            [workflow_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /steps/:id → update step
router.put('/steps/:id', validateStep, async (req, res) => {
    const { id } = req.params;
    const { name, step_type, step_order, metadata } = req.body;
    try {
        const result = await db.query(
            'UPDATE steps SET name = COALESCE($1, name), step_type = COALESCE($2, step_type), step_order = COALESCE($3, step_order), metadata = COALESCE($4, metadata), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, step_type, step_order, metadata, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Step not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /steps/:id → delete step
router.delete('/steps/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM steps WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Step not found' });
        }
        res.json({ message: 'Step deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
