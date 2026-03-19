const { evaluateRules } = require('./src/engine/ruleEngine');

async function runTests() {
    const tests = [
        { name: 'Basic Equals', rules: [{ condition: 'amount == 100', next_step_id: 'step_2' }], data: { amount: 100 }, expected: 'step_2' },
        { name: 'Nested Parentheses', rules: [{ condition: '(status == "urgent" OR priority > 8) AND amount < 500', next_step_id: 'step_3' }], data: { status: 'urgent', priority: 5, amount: 100 }, expected: 'step_3' },
        { name: 'Operator Precedence', rules: [{ condition: 'status == "active" OR amount > 100 AND priority == "high"', next_step_id: 'step_4' }], data: { status: 'inactive', amount: 200, priority: 'high' }, expected: 'step_4' },
        { name: 'Case Insensitive contains', rules: [{ condition: 'name contains "GOOGLE"', next_step_id: 'step_5' }], data: { name: 'Welcome to google' }, expected: 'step_5' },
        { name: 'Case Insensitive startsWith', rules: [{ condition: 'category startsWith "FIN"', next_step_id: 'step_6' }], data: { category: 'finance_dept' }, expected: 'step_6' },
        { name: 'Complex Nesting', rules: [{ condition: '((a == 1 AND b == 2) OR (c == 3 AND d == 4))', next_step_id: 'step_7' }], data: { a: 0, b: 0, c: 3, d: 4 }, expected: 'step_7' },
        { name: 'No Match', rules: [{ condition: 'amount > 1000', next_step_id: 'step_8' }], data: { amount: 500 }, expected: null }
    ];

    const finalResults = [];
    for (const test of tests) {
        try {
            const result = await evaluateRules(test.rules, test.data);
            finalResults.push({
                name: test.name,
                expected: test.expected,
                actual: result.nextStepId,
                passed: result.nextStepId === test.expected
            });
        } catch (err) {
            finalResults.push({ name: test.name, error: err.message, passed: false });
        }
    }
    console.log(JSON.stringify(finalResults, null, 2));
}

runTests();
