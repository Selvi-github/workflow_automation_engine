/**
 * Custom Rule Engine for Workflow Engine
 * Safely evaluates conditions without using eval()
 */

const operators = {
    '==': (a, b) => a == b,
    '!=': (a, b) => a != b,
    '>': (a, b) => Number(a) > Number(b),
    '<': (a, b) => Number(a) < Number(b),
    '>=': (a, b) => Number(a) >= Number(b),
    '<=': (a, b) => Number(a) <= Number(b)
};

const functions = {
    'contains': (fieldValue, search) => String(fieldValue).includes(search.replace(/['"]/g, '')),
    'startsWith': (fieldValue, prefix) => String(fieldValue).startsWith(prefix.replace(/['"]/g, '')),
    'endsWith': (fieldValue, suffix) => String(fieldValue).endsWith(suffix.replace(/['"]/g, ''))
};

/**
 * Parses and evaluates a single predicate (e.g., "age > 18" or "contains(name, 'John')")
 */
function evaluatePredicate(predicate, inputData) {
    predicate = predicate.trim();

    // Check for functions: func(field, value)
    const funcMatch = predicate.match(/^(\w+)\s*\(([^,]+),\s*([^)]+)\)$/);
    if (funcMatch) {
        const [_, funcName, field, value] = funcMatch;
        if (functions[funcName]) {
            const fieldValue = inputData[field.trim()];
            return functions[funcName](fieldValue, value.trim());
        }
    }

    // Check for operators: field op value
    const opMatch = predicate.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (opMatch) {
        const [_, field, op, value] = opMatch;
        const fieldValue = inputData[field.trim()];
        let targetValue = value.trim();

        // Basic types handling
        if (targetValue === 'true') targetValue = true;
        else if (targetValue === 'false') targetValue = false;
        else if (targetValue === 'null') targetValue = null;
        else if (!isNaN(targetValue)) targetValue = Number(targetValue);
        else targetValue = targetValue.replace(/['"]/g, ''); // strip quotes

        return operators[op](fieldValue, targetValue);
    }

    return false;
}

/**
 * Handles logical AND and OR expressions
 */
function evaluateExpression(expression, inputData) {
    if (expression.toUpperCase() === 'DEFAULT') return true;

    // Handle OR (lower precedence)
    if (expression.includes('||')) {
        return expression.split('||').some(part => evaluateExpression(part, inputData));
    }

    // Handle AND
    if (expression.includes('&&')) {
        return expression.split('&&').every(part => evaluateExpression(part, inputData));
    }

    return evaluatePredicate(expression, inputData);
}

/**
 * Evaluates a list of rules against input data
 */
async function evaluateRules(rules, inputData) {
    console.log(`Evaluating ${rules.length} rules against inputData:`, inputData);
    const evaluatedRules = [];
    let nextStepId = null;

    for (const rule of rules) {
        const { condition, next_step_id, id } = rule;
        
        try {
            const isMatch = evaluateExpression(condition, inputData);
            console.log(`Rule ID: ${id || 'N/A'} | Condition: "${condition}" | Match: ${isMatch}`);
            
            evaluatedRules.push({ rule: condition, result: isMatch });

            if (isMatch) {
                nextStepId = next_step_id;
                break;
            }
        } catch (error) {
            console.error(`Error evaluating rule ${id}: ${error.message}`);
            evaluatedRules.push({ rule: condition, result: false, error: error.message });
        }
    }

    return { nextStepId, evaluatedRules };
}

/**
 * Validates condition syntax
 */
function validateCondition(condition) {
    if (!condition) return { valid: false, error: 'Condition is empty' };
    if (condition.toUpperCase() === 'DEFAULT') return { valid: true };

    try {
        // Basic check for balanced parentheses if functions are used
        if ((condition.match(/\(/g) || []).length !== (condition.match(/\)/g) || []).length) {
            return { valid: false, error: 'Unbalanced parentheses' };
        }
        
        // Check for supported operators/functions via regex
        // This is a simplified validation
        return { valid: true };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}

module.exports = {
    evaluateRules,
    validateCondition
};
