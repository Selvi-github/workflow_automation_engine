const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } 
});

async function seed() {
    console.log('--- 🚀 SEEDING PRODUCTION DATABASE (DIRECT SQL) ---');
    try {
        // 1. Seed Users
        const salt = bcrypt.genSaltSync(10);
        const users = [
            { name: 'Admin User', email: 'admin@company.com', password: bcrypt.hashSync('Admin@123', salt), role: 'admin' },
            { name: 'John Manager', email: 'manager@company.com', password: bcrypt.hashSync('Manager@123', salt), role: 'manager' },
            { name: 'Sarah CEO', email: 'ceo@company.com', password: bcrypt.hashSync('CEO@123', salt), role: 'ceo' },
            { name: 'Tom Employee', email: 'employee@company.com', password: bcrypt.hashSync('Employee@123', salt), role: 'employee' }
        ];

        for (const u of users) {
            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password = $3, role = $4',
                [u.name, u.email, u.password, u.role]
            );
            console.log(`User seeded: ${u.email}`);
        }

        // 2. Create "Expense Approval" Workflow
        const wfId = uuidv4();
        const inputSchema = {
            properties: [
                { name: 'amount', type: 'number', required: true },
                { name: 'country', type: 'string', required: true },
                { name: 'priority', type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] }
            ]
        };
        await pool.query(
            'INSERT INTO workflows (id, name, input_schema) VALUES ($1, $2, $3)',
            [wfId, 'Expense Approval', JSON.stringify(inputSchema)]
        );
        console.log(`Workflow created: Expense Approval (${wfId})`);

        // 3. Create Steps
        const steps = [
            { id: uuidv4(), name: 'Manager Approval', step_type: 'approval', step_order: 1, metadata: { required_role: 'manager' } },
            { id: uuidv4(), name: 'CEO Approval', step_type: 'approval', step_order: 2, metadata: { required_role: 'ceo' } },
            { id: uuidv4(), name: 'Completed', step_type: 'task', step_order: 3 }
        ];

        for (const s of steps) {
            await pool.query(
                'INSERT INTO steps (id, workflow_id, name, step_type, step_order, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
                [s.id, wfId, s.name, s.step_type, s.step_order, JSON.stringify(s.metadata)]
            );
            console.log(`Step created: ${s.name}`);
        }

        // 4. Update workflow with start step
        await pool.query('UPDATE workflows SET start_step_id = $1 WHERE id = $2', [steps[0].id, wfId]);

        // 5. Create Rules
        const rules = [
            { step_id: steps[0].id, condition: "amount > 100", next_step_id: steps[1].id, priority: 1 },
            { step_id: steps[0].id, condition: "DEFAULT", next_step_id: steps[2].id, priority: 2 },
            { step_id: steps[1].id, condition: "DEFAULT", next_step_id: steps[2].id, priority: 1 }
        ];

        for (const r of rules) {
            await pool.query(
                'INSERT INTO rules (step_id, condition, next_step_id, priority) VALUES ($1, $2, $3, $4)',
                [r.step_id, r.condition, r.next_step_id, r.priority]
            );
        }
        console.log('Rules created.');

        console.log('\n🌟 PRODUCTION SEEDING COMPLETE!');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEED FAILED:', err.message);
        process.exit(1);
    }
}

seed();
