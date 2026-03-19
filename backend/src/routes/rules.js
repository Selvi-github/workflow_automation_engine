const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// POST /steps/:step_id/rules → add rule
router.post('/steps/:step_id/rules', async (req, res) => {
    const { step_id } = req.params;
    const { condition, next_step_id, priority } = req.body;
    const id = uuidv4();
    try {
        const result = await db.query(
            'INSERT INTO rules (id, step_id, condition, next_step_id, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, step_id, condition, next_step_id, priority]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /steps/:step_id/rules → list rules ordered by priority
router.get('/steps/:step_id/rules', async (req, res) => {
    const { step_id } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM rules WHERE step_id = $1 ORDER BY priority ASC',
            [step_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /rules/:id → update rule
router.put('/rules/:id', async (req, res) => {
    const { id } = req.params;
    const { condition, next_step_id, priority } = req.body;
    try {
        const result = await db.query(
            'UPDATE rules SET condition = COALESCE($1, condition), next_step_id = COALESCE($2, next_step_id), priority = COALESCE($3, priority), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [condition, next_step_id, priority, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /rules/:id → delete rule
router.delete('/rules/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM rules WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.json({ message: 'Rule deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
