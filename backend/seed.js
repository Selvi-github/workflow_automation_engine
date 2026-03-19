const axios = require('axios');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
    try {
        console.log('--- Seeding Users ---');
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
            console.log(`User created/updated: ${u.email} (${u.role})`);
        }

        console.log('\n--- Seeding Expense Approval Workflow ---');

        // 1. Create Workflow 1
        const wf1Res = await axios.post(`${BASE_URL}/workflows`, {
            name: 'Expense Approval',
            input_schema: {
                properties: [
                    { name: 'amount', type: 'number', required: true },
                    { name: 'country', type: 'string', required: true },
                    { name: 'department', type: 'string', required: false },
                    { name: 'priority', type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] }
                ]
            }
        });
        const wf1Id = wf1Res.data.id;
        console.log(`Workflow 1 created: ${wf1Id}`);

        // 2. Create Steps for Workflow 1
        const wf1Steps = [
            { 
                name: 'Manager Approval', 
                step_type: 'approval', 
                step_order: 1,
                metadata: { required_role: 'manager' }
            },
            { 
                name: 'Finance Notification', 
                step_type: 'notification', 
                step_order: 2,
                metadata: { 
                    notification_email: 'manager@company.com',
                    notification_channel: "email",
                    template: "Finance team notified about expense approval"
                }
            },
            { 
                name: 'CEO Approval', 
                step_type: 'approval', 
                step_order: 3,
                metadata: { required_role: 'ceo' }
            },
            { name: 'Task Rejection', step_type: 'task', step_order: 4 },
            { name: 'Task Completion', step_type: 'task', step_order: 5 }
        ];

        const createdWf1Steps = {};
        for (const s of wf1Steps) {
            const res = await axios.post(`${BASE_URL}/workflows/${wf1Id}/steps`, s);
            createdWf1Steps[s.name] = res.data.id;
            console.log(`Step created: ${s.name} (${res.data.id})`);
        }

        // 3. Set Start Step
        await axios.put(`${BASE_URL}/workflows/${wf1Id}`, { start_step_id: createdWf1Steps['Manager Approval'] });
        console.log('Set Start Step to Manager Approval');

        // 4. Create Rules for Workflow 1
        const wf1Rules = [
            { stepId: createdWf1Steps['Manager Approval'], condition: "amount > 100 && country == 'US' && priority == 'High'", next_step_id: createdWf1Steps['Finance Notification'], priority: 1 },
            { stepId: createdWf1Steps['Manager Approval'], condition: "amount <= 100 || department == 'HR'", next_step_id: createdWf1Steps['CEO Approval'], priority: 2 },
            { stepId: createdWf1Steps['Manager Approval'], condition: "priority == 'Low' && country != 'US'", next_step_id: createdWf1Steps['Task Rejection'], priority: 3 },
            { stepId: createdWf1Steps['Manager Approval'], condition: "DEFAULT", next_step_id: createdWf1Steps['Task Rejection'], priority: 4 },
            
            { stepId: createdWf1Steps['Finance Notification'], condition: "DEFAULT", next_step_id: createdWf1Steps['CEO Approval'], priority: 1 },
            
            { stepId: createdWf1Steps['CEO Approval'], condition: "DEFAULT", next_step_id: createdWf1Steps['Task Completion'], priority: 1 },
            
            { stepId: createdWf1Steps['Task Rejection'], condition: "DEFAULT", next_step_id: null, priority: 1 },
            
            { stepId: createdWf1Steps['Task Completion'], condition: "DEFAULT", next_step_id: null, priority: 1 }
        ];

        for (const r of wf1Rules) {
            await axios.post(`${BASE_URL}/steps/${r.stepId}/rules`, { condition: r.condition, next_step_id: r.next_step_id, priority: r.priority });
        }
        console.log('Rules created for Expense Approval Workflow');

        console.log('\n--- Seeding Employee Onboarding Workflow ---');

        // 1. Create Workflow 2
        const wf2Res = await axios.post(`${BASE_URL}/workflows`, {
            name: 'Employee Onboarding',
            input_schema: {
                properties: [
                    { name: 'department', type: 'string', required: true },
                    { name: 'role', type: 'string', required: true },
                    { name: 'start_date', type: 'string', required: true }
                ]
            }
        });
        const wf2Id = wf2Res.data.id;
        console.log(`Workflow 2 created: ${wf2Id}`);

        // 2. Create Steps for Workflow 2
        const wf2Steps = [
            { 
                name: 'Send Welcome Email', 
                step_type: 'notification', 
                step_order: 1,
                metadata: {
                    notification_email: 'employee@company.com',
                    notification_channel: "email",
                    template: "New employee onboarding started"
                }
            },
            { name: 'IT Setup', step_type: 'task', step_order: 2 },
            { 
                name: 'Manager Introduction', 
                step_type: 'approval', 
                step_order: 3,
                metadata: { required_role: 'manager' }
            }
        ];

        const createdWf2Steps = {};
        for (const s of wf2Steps) {
            const res = await axios.post(`${BASE_URL}/workflows/${wf2Id}/steps`, s);
            createdWf2Steps[s.name] = res.data.id;
            console.log(`Step created: ${s.name} (${res.data.id})`);
        }

        // 3. Set Start Step
        await axios.put(`${BASE_URL}/workflows/${wf2Id}`, { start_step_id: createdWf2Steps['Send Welcome Email'] });
        console.log('Set Start Step to Send Welcome Email');

        // 4. Create Rules for Workflow 2
        const wf2Rules = [
            { stepId: createdWf2Steps['Send Welcome Email'], condition: "DEFAULT", next_step_id: createdWf2Steps['IT Setup'], priority: 1 },
            { stepId: createdWf2Steps['IT Setup'], condition: "DEFAULT", next_step_id: createdWf2Steps['Manager Introduction'], priority: 1 },
            { stepId: createdWf2Steps['Manager Introduction'], condition: "DEFAULT", next_step_id: null, priority: 1 }
        ];

        for (const r of wf2Rules) {
            await axios.post(`${BASE_URL}/steps/${r.stepId}/rules`, { condition: r.condition, next_step_id: r.next_step_id, priority: r.priority });
        }
        console.log('Rules created for Employee Onboarding Workflow');

        console.log('\nSeed successful!');
    } catch (err) {
        console.error('Seed failed:', err.response?.data || err.message);
    } finally {
        await pool.end();
    }
}

seed();
