const validateWorkflow = (req, res, next) => {
    const { name, input_schema } = req.body;
    
    if (req.method === 'POST' && !name) {
        return res.status(400).json({ error: 'Workflow name is required' });
    }

    if (input_schema && typeof input_schema !== 'object') {
        return res.status(400).json({ error: 'Input schema must be an object' });
    }

    if (input_schema && input_schema.properties && !Array.isArray(input_schema.properties)) {
        return res.status(400).json({ error: 'Input schema properties must be an array' });
    }

    next();
};

const validateStep = (req, res, next) => {
    const { name, step_type } = req.body;

    if (req.method === 'POST') {
        if (!name) return res.status(400).json({ error: 'Step name is required' });
        if (!step_type) return res.status(400).json({ error: 'Step type is required' });
        
        const validTypes = ['task', 'approval', 'notification', 'webhook'];
        if (!validTypes.includes(step_type)) {
            return res.status(400).json({ error: `Invalid step type. Must be one of: ${validTypes.join(', ')}` });
        }
    }

    next();
};

const validateRule = (req, res, next) => {
    const { condition, priority } = req.body;

    if (req.method === 'POST') {
        if (condition === undefined || condition === null) {
            return res.status(400).json({ error: 'Rule condition is required' });
        }
        if (priority !== undefined && typeof priority !== 'number') {
            return res.status(400).json({ error: 'Priority must be a number' });
        }
    }

    next();
};

module.exports = {
    validateWorkflow,
    validateStep,
    validateRule
};
