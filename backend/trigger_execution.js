const axios = require('axios');

const workflowId = 'a6ce2a8d-b950-480d-a033-c9eac35dec89';
const payload = {
    data: {
        amount: 1900,
        country: 'india',
        department: 'food',
        priority: 'Low'
    },
    triggered_by: 'Debug Script'
};

async function trigger() {
    try {
        const response = await axios.post(`http://localhost:5000/api/workflows/${workflowId}/execute`, payload);
        console.log('Execution triggered status:', response.status);
        console.log('Execution data:', response.data);
    } catch (error) {
        console.error('Trigger failed:', error.response ? error.response.data : error.message);
    }
}

trigger();
