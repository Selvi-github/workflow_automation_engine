const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { validateWorkflow } = require('../middleware/validation');

// POST /workflows → create workflow
router.post('/', validateWorkflow, async (req, res) => {
    const { name, input_schema, start_step_id } = req.body;
    const id = uuidv4();
    try {
        const result = await db.query(
            'INSERT INTO workflows (id, name, input_schema, start_step_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, name, input_schema, start_step_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /workflows → list all with pagination and search
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let statusFilter = '';
    if (status === 'active') statusFilter = 'AND w.is_active = true';
    else if (status === 'inactive') statusFilter = 'AND w.is_active = false';

    try {
        const result = await db.query(
            `SELECT w.*, COUNT(s.id)::int as step_count 
             FROM workflows w 
             LEFT JOIN steps s ON w.id = s.workflow_id 
             WHERE w.name ILIKE $1 ${statusFilter}
             GROUP BY w.id 
             ORDER BY w.created_at DESC LIMIT $2 OFFSET $3`,
            [`%${search}%`, limit, offset]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /workflows/:id → get workflow with steps and rules
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const workflowResult = await db.query('SELECT * FROM workflows WHERE id = $1', [id]);
        if (workflowResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // 2. Get steps
        const stepsResult = await db.query(
            'SELECT * FROM steps WHERE workflow_id = $1 ORDER BY step_order',
            [id]
        );
        const steps = stepsResult.rows;

        // 3. Get rules for each step
        for (let step of steps) {
            const rulesResult = await db.query(
                'SELECT * FROM rules WHERE step_id = $1 ORDER BY priority',
                [step.id]
            );
            step.rules = rulesResult.rows;
        }

        res.json({
            ...workflowResult.rows[0],
            steps: steps
        });
    } catch (err) {
        console.error('Error fetching workflow:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /workflows/:id → update workflow (increment version)
router.put('/:id', validateWorkflow, async (req, res) => {
    const { id } = req.params;
    const { name, is_active, input_schema, start_step_id } = req.body;
    try {
        const result = await db.query(
            'UPDATE workflows SET name = COALESCE($1, name), is_active = COALESCE($2, is_active), input_schema = COALESCE($3, input_schema), start_step_id = COALESCE($4, start_step_id), version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, is_active, input_schema, start_step_id, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /workflows/:id → delete workflow
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');

        // Step 1: DELETE from rules WHERE step_id IN (SELECT id FROM steps WHERE workflow_id = $1)
        await db.query('DELETE FROM rules WHERE step_id IN (SELECT id FROM steps WHERE workflow_id = $1)', [id]);

        // Step 2: DELETE from executions WHERE workflow_id = $1
        await db.query('DELETE FROM executions WHERE workflow_id = $1', [id]);

        // Step 3: DELETE from steps WHERE workflow_id = $1
        await db.query('DELETE FROM steps WHERE workflow_id = $1', [id]);

        // Step 4: DELETE from workflows WHERE id = $1
        const result = await db.query('DELETE FROM workflows WHERE id = $1 RETURNING *', [id]);

        await db.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.status(200).json({ message: 'Workflow deleted successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error deleting workflow:', err);
        res.status(500).json({ error: 'Database error', detail: err.message });
    }
});

module.exports = router;
