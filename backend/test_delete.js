const axios = require('axios');

async function testDelete() {
    try {
        console.log("Fetching workflows...");
        const res = await axios.get('http://localhost:5000/api/workflows');
        const workflows = res.data;
        if (workflows.length === 0) {
            console.log("No workflows to delete.");
            return;
        }
        const workflowToDelete = workflows[0];
        console.log("Attempting to delete workflow:", workflowToDelete.id);
        
        try {
            const delRes = await axios.delete(`http://localhost:5000/api/workflows/${workflowToDelete.id}`);
            console.log("Delete success:", delRes.status, delRes.data);
        } catch (delErr) {
            console.error("Delete failed with status:", delErr.response ? delErr.response.status : delErr.message);
            console.error("Error data:", delErr.response ? delErr.response.data : '');
        }
    } catch (e) {
        console.error("Setup failed:", e.message);
    }
}

testDelete();
