const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const { evaluateRules } = require('./ruleEngine');
const { sendNotificationEmail, sendApprovalEmail } = require('../utils/emailService');
const axios = require('axios');

const MAX_ITERATIONS = 50;

/**
 * Starts a new workflow execution
 */
async function startExecution(workflowId, inputData, triggeredBy) {
    try {
        // 1. Get workflow details
        const workflowResult = await db.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
        if (workflowResult.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found`);
        }
        const workflow = workflowResult.rows[0];
        
        // 1.5. Validate Input Schema if present
        if (workflow.input_schema && workflow.input_schema.properties) {
            for (const prop of workflow.input_schema.properties) {
                if (prop.required && (inputData[prop.name] === undefined || inputData[prop.name] === null)) {
                    const error = new Error(`Missing required input field: ${prop.name}`);
                    error.status = 400; // Tag with status for the route to catch
                    throw error;
                }
            }
        }

        // 2. Create execution record
        const executionId = uuidv4();
        const result = await db.query(
            'INSERT INTO executions (id, workflow_id, workflow_version, status, data, current_step_id, triggered_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [executionId, workflowId, workflow.version, 'in_progress', inputData, workflow.start_step_id, triggeredBy]
        );

        console.log(`[EXECUTION] [START] ID: ${executionId} | Workflow: ${workflowId} | Triggered By: ${triggeredBy}`);

        // 3. Begin step execution
        if (workflow.start_step_id) {
            // Run asynchronously to not block the request
            processWorkflow(executionId, workflow.start_step_id, inputData)
                .catch(err => console.error(`Error in background process for ${executionId}:`, err));
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error starting execution:', error);
        throw error;
    }
}

/**
 * Internal function to iterate through workflow steps
 */
async function processWorkflow(executionId, stepId, inputData) {
    let currentStepId = stepId;
    let iterations = 0;

    try {
        while (currentStepId && iterations < MAX_ITERATIONS) {
            const executionResult = await db.query('SELECT status FROM executions WHERE id = $1', [executionId]);
            if (executionResult.rows[0].status === 'canceled') {
                console.log(`Execution ${executionId} has been canceled.`);
                return;
            }

            const nextStepId = await executeStep(executionId, currentStepId, inputData);
            
            if (nextStepId === 'paused') {
                return;
            }

            if (!nextStepId) break;
            
            currentStepId = nextStepId;
            iterations++;
        }

        if (iterations >= MAX_ITERATIONS) {
            await updateExecutionStatus(executionId, 'failed', 'Max iterations reached (potential infinite loop)');
        } else {
            await updateExecutionStatus(executionId, 'completed');
        }
    } catch (err) {
        console.error(`Process crash for execution ${executionId}:`, err);
        await updateExecutionStatus(executionId, 'failed', `Critical error: ${err.message}`);
    }
}

/**
 * Executes a single step and determines the next step
 */
async function executeStep(executionId, stepId, inputData) {
    const startedAt = new Date();
    let status = 'completed';
    let nextStepId = null;
    let logEntry = {};

    try {
        // 1. Get step details and rules
        const stepResult = await db.query('SELECT * FROM steps WHERE id = $1', [stepId]);
        if (stepResult.rows.length === 0) throw new Error(`Step ${stepId} not found`);
        const step = stepResult.rows[0];

        if (step.step_type === 'approval') {
            status = 'pending_approval';
            await updateExecutionStatus(executionId, 'in_progress', null, stepId);
            console.log(`[EXECUTION] [PENDING] Step: ${step.name} (${stepId}) awaiting human signal.`);
            const appEndedAt = new Date();
            logEntry = {
                step_id: stepId,
                step_name: step.name,
                step_type: step.step_type,
                evaluated_rules: [],
                selected_next_step: null,
                status: status,
                approver_id: null,
                started_at: startedAt.toISOString(),
                ended_at: appEndedAt.toISOString(),
            };
            await db.query(
                'UPDATE executions SET logs = logs || ARRAY[$1::jsonb], current_step_id = $2 WHERE id = $3',
                [JSON.stringify(logEntry), stepId, executionId]
            );
            // 2b. Role-based notification - Send to all relevant signatory roles
            const requiredRole = step.metadata?.required_role || 'manager';
            const approverRoles = ['admin', 'ceo', 'manager', requiredRole];
            const usersRes = await db.query(
                'SELECT DISTINCT email FROM users WHERE role = ANY($1)', 
                [approverRoles]
            );
            const emails = usersRes.rows.map(u => u.email);
            
            if (emails.length > 0) {
                const wfRes = await db.query('SELECT name FROM workflows WHERE id = $1', [step.workflow_id]);
                const workflowName = wfRes.rows[0]?.name || 'Workflow';
                for (const email of emails) {
                    await sendApprovalEmail(email, step.name, workflowName, inputData, executionId);
                }
                console.log(`[EXECUTION] [NOTIFY] Approval requested from: ${emails.join(', ')}`);
            }
            return 'paused';
        }

        const rulesResult = await db.query('SELECT * FROM rules WHERE step_id = $1 ORDER BY priority', [stepId]);
        const rules = rulesResult.rows;

        // 2. Process step logic based on type
        switch (step.step_type) {
            case 'notification':
                const email = step.metadata?.notification_email;
                if (email) {
                    // Fetch workflow name for the email template
                    const wfRes = await db.query('SELECT name FROM workflows WHERE id = $1', [step.workflow_id]);
                    const workflowName = wfRes.rows[0]?.name || 'Workflow';
                    
                    const emailSent = await sendNotificationEmail(email, `🔔 Notification: ${step.name}`, step.name, workflowName, inputData);
                    console.log(`[EXECUTION] [NOTIFY] ${emailSent ? 'SUCCESS' : 'FAILED'}: ${step.name} -> ${email}`);
                    
                    // Add email status to log entry
                    status = emailSent ? 'completed' : 'notification_failed';
                } else {
                    console.log(`NOTIFICATION SKIPPED: No email in metadata for ${step.name}`);
                }
                break;
            case 'task':
                console.log(`TASK EXECUTED: ${step.name}`);
                break;
            case 'webhook':
                const { url, method = 'POST', headers = {}, body = null } = step.metadata || {};
                if (url) {
                    try {
                        console.log(`[EXECUTION] [WEBHOOK] INITIATED: ${method} ${url}`);
                        const response = await axios({
                            method,
                            url,
                            headers: {
                                'Content-Type': 'application/json',
                                ...headers
                            },
                            data: body || inputData,
                            timeout: 10000
                        });
                        console.log(`[EXECUTION] [WEBHOOK] SUCCESS: ${step.name} (Status: ${response.status})`);
                        status = 'completed';
                        logEntry.webhook_response = {
                            status: response.status,
                            data: response.data
                        };
                    } catch (webhookError) {
                        console.error(`WEBHOOK FAILED: ${step.name}`, webhookError.message);
                        status = 'webhook_failed';
                        logEntry.error = `Webhook call failed: ${webhookError.message}`;
                        if (webhookError.response) {
                            logEntry.webhook_response = {
                                status: webhookError.response.status,
                                data: webhookError.response.data
                            };
                        }
                    }
                } else {
                    console.log(`WEBHOOK SKIPPED: No URL in metadata for ${step.name}`);
                }
                break;
            default:
                throw new Error(`Unknown step type: ${step.step_type}`);
        }

        // 3. Determine next step using Rule Engine
        // Enrich context with step results for dynamic decision making
        const context = { 
            ...inputData, 
            last_step_status: status,
            webhook_status: logEntry.webhook_response?.status || null,
            webhook_data: logEntry.webhook_response?.data || null
        };
        const evalResult = await evaluateRules(rules, context);
        nextStepId = evalResult.nextStepId;
        const evaluatedRules = evalResult.evaluatedRules;

        console.log(`[EXECUTION] [RULE] Step: ${step.name} | Result: ${nextStepId || 'END'} | Matched: ${evaluatedRules.find(r => r.result)?.rule || 'NONE'}`);

        const endedAt = new Date();

        // 4. Create log entry
        logEntry = {
            step_id: stepId,
            step_name: step.name,
            step_type: step.step_type,
            evaluated_rules: evaluatedRules,
            selected_next_step: nextStepId,
            status: status,
            approver_id: null,
            webhook_response: logEntry.webhook_response || null,
            started_at: startedAt.toISOString(),
            ended_at: endedAt.toISOString(),
        };

        // 5. Update execution record - Use array concatenation for better stability
        await db.query(
            'UPDATE executions SET logs = logs || ARRAY[$1::jsonb], current_step_id = $2 WHERE id = $3',
            [JSON.stringify(logEntry), nextStepId, executionId]
        );

        return nextStepId;
    } catch (error) {
        console.error(`Error executing step ${stepId}:`, error);
        const endedAt = new Date();
        logEntry = {
            step_id: stepId,
            error: error.message,
            status: 'failed',
            started_at: startedAt.toISOString(),
            ended_at: endedAt.toISOString(),
        };
        await db.query(
            'UPDATE executions SET status = $1, logs = logs || ARRAY[$2::jsonb] WHERE id = $3',
            ['failed', JSON.stringify(logEntry), executionId]
        );
        return null;
    }
}

/**
 * Retries a failed execution at the current step
 */
async function retryStep(executionId) {
    try {
        const result = await db.query('SELECT * FROM executions WHERE id = $1', [executionId]);
        if (result.rows.length === 0) throw new Error('Execution not found');
        const execution = result.rows[0];

        if (execution.status !== 'failed') throw new Error('Can only retry failed executions');

        await db.query(
            'UPDATE executions SET status = $1, retries = retries + 1 WHERE id = $2',
            ['in_progress', executionId]
        );

        processWorkflow(executionId, execution.current_step_id, execution.data)
            .catch(err => console.error(`Error in retry process for ${executionId}:`, err));
            
        return { message: 'Retry initiated' };
    } catch (error) {
        console.error('Error retrying step:', error);
        throw error;
    }
}

/**
 * Cancels an ongoing execution
 */
async function cancelExecution(executionId) {
    await updateExecutionStatus(executionId, 'canceled');
    return { message: 'Execution canceled' };
}

/**
 * Helper to update execution status
 */
async function updateExecutionStatus(executionId, status, errorMsg = null, currentStepId = null) {
    const fields = ['status = $1'];
    const params = [status];
    let counter = 2;

    if (errorMsg) {
        fields.push(`logs = logs || ARRAY[$${counter}::jsonb]`);
        params.push(JSON.stringify({ error: errorMsg, timestamp: new Date().toISOString() }));
        counter++;
    }
    
    if (currentStepId) {
        fields.push(`current_step_id = $${counter}`);
        params.push(currentStepId);
        counter++;
    }

    const query = `UPDATE executions SET ${fields.join(', ')} WHERE id = $${counter}`;
    params.push(executionId);
    
    await db.query(query, params);
}

async function approveStep(executionId, approved, userId) {
    try {
        const result = await db.query('SELECT * FROM executions WHERE id = $1', [executionId]);
        if (result.rows.length === 0) throw new Error('Execution not found');
        const execution = result.rows[0];

        if (execution.status !== 'in_progress') throw new Error('Execution is not in progress');
        
        const stepId = execution.current_step_id;
        if (!stepId) throw new Error('No current step to approve');

        const stepResult = await db.query('SELECT * FROM steps WHERE id = $1', [stepId]);
        const step = stepResult.rows[0];
        
        if (step.step_type !== 'approval') throw new Error('Current step is not an approval step');

        let nextStepId = null;
        let evaluatedRules = [];
        let logStatus = approved ? 'completed' : 'failed';
        let executionStatus = approved ? 'in_progress' : 'failed';

        if (approved) {
            const rulesResultData = await db.query('SELECT * FROM rules WHERE step_id = $1 ORDER BY priority', [stepId]);
            const rules = rulesResultData.rows;
            const evalResult = await evaluateRules(rules, execution.data);
            nextStepId = evalResult.nextStepId;
            evaluatedRules = evalResult.evaluatedRules;
        }

        const endedAt = new Date();
        const logEntry = {
            step_id: stepId,
            step_name: step.name,
            step_type: step.step_type,
            evaluated_rules: evaluatedRules,
            selected_next_step: nextStepId,
            status: logStatus,
            approver_id: userId,
            started_at: endedAt.toISOString(),
            ended_at: endedAt.toISOString(),
        };

        await db.query(
            'UPDATE executions SET status = $1, logs = logs || ARRAY[$2::jsonb], current_step_id = $3 WHERE id = $4',
            [executionStatus, JSON.stringify(logEntry), nextStepId, executionId]
        );

        if (approved && nextStepId) {
            processWorkflow(executionId, nextStepId, execution.data)
                .catch(err => console.error(`Error in background process for ${executionId}:`, err));
            return { message: 'Step approved, continuing' };
        } else if (approved && !nextStepId) {
            await updateExecutionStatus(executionId, 'completed');
            return { message: 'Step approved, workflow completed' };
        } else {
            return { message: 'Step rejected, execution failed' };
        }
    } catch (error) {
        console.error('Error approving step:', error);
        throw error;
    }
}

module.exports = {
    startExecution,
    executeStep,
    retryStep,
    cancelExecution,
    approveStep
};
