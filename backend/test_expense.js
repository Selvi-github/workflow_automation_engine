const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function test() {
    try {
        const { data: workflows } = await axios.get(`${BASE_URL}/workflows?search=Expense Approval&status=all`);
        const wf = workflows.find(w => w.name === 'Expense Approval');
        if (!wf) throw new Error('Expense Approval workflow not found!');
        console.log('Found workflow:', wf.name);

        const inputData = { amount: 250, country: 'US', priority: 'High' };
        let exRes = await axios.post(`${BASE_URL}/workflows/${wf.id}/execute`, { data: inputData, triggered_by: 'Automated Test' });
        const exId = exRes.data.id;
        console.log('Execution started:', exId, 'Initial Status:', exRes.data.status);

        await new Promise(r => setTimeout(r, 1000));
        let { data: exStatus } = await axios.get(`${BASE_URL}/executions/${exId}`);
        console.log('Current status:', exStatus.status);

        console.log('Approving step 1 (Manager)...');
        await axios.post(`${BASE_URL}/executions/${exId}/approve`, { approved: true, user_id: 'manager1' });

        await new Promise(r => setTimeout(r, 1000));
        let { data: exStatus2 } = await axios.get(`${BASE_URL}/executions/${exId}`);
        console.log('Status after manager:', exStatus2.status);

        // POLL for CEO Step transition (Email sending takes time)
        console.log('Waiting for CEO Approval step to become active...');
        let ceoStepActive = false;
        for (let j = 0; j < 10; j++) {
            const { data: currentEx } = await axios.get(`${BASE_URL}/executions/${exId}`);
            const { data: workflows } = await axios.get(`${BASE_URL}/workflows/${currentEx.workflow_id}`);
            const currentStep = workflows.steps.find(s => s.id === currentEx.current_step_id);
            if (currentStep && currentStep.name === 'CEO Approval') {
                ceoStepActive = true;
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!ceoStepActive) throw new Error('CEO Approval step never became active');

        console.log('Approving step 3 (CEO)...');
        await axios.post(`${BASE_URL}/executions/${exId}/approve`, { approved: true, user_id: 'ceo1' });

        for(let i=0; i<5; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const { data: check } = await axios.get(`${BASE_URL}/executions/${exId}`);
            console.log(`Poll ${i+1} status:`, check.status);
            if (['completed', 'failed'].includes(check.status)) {
                console.log('Test successful. Final status:', check.status);
                return;
            }
        }
        console.log('Test timed out');
    } catch(err) {
        console.error('Test failed:', err.response?.data || err.message);
    }
}
test();
