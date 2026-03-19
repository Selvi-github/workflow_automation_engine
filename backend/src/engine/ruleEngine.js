/**
 * Super Senior Rule Engine for Workflow Engine
 * Robust recursive descent parser for logical expressions
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
    'contains': (fv, s) => String(fv).toLowerCase().includes(String(s).replace(/['"]/g, '').toLowerCase()),
    'startswith': (fv, p) => String(fv).toLowerCase().startsWith(String(p).replace(/['"]/g, '').toLowerCase()),
    'endswith': (fv, s) => String(fv).toLowerCase().endsWith(String(s).replace(/['"]/g, '').toLowerCase()),
    'exists': (fv) => fv !== undefined && fv !== null
};

/**
 * Tokenizer for logical expressions
 * Supports AND, OR, &&, ||, and common comparison operators
 */
function tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
        const char = str[i];
        if (/\s/.test(char)) { i++; continue; }
        if (char === '(' || char === ')' || char === ',') { tokens.push(char); i++; continue; }
        
        // Logical Operators
        if (str.startsWith('&&', i)) { tokens.push('&&'); i += 2; continue; }
        if (str.substring(i, i + 3).toUpperCase() === 'AND' && (/\s/.test(str[i+3]) || i+3 >= str.length)) { tokens.push('&&'); i += 3; continue; }
        if (str.startsWith('||', i)) { tokens.push('||'); i += 2; continue; }
        if (str.substring(i, i + 2).toUpperCase() === 'OR' && (/\s/.test(str[i+2]) || i+2 >= str.length)) { tokens.push('||'); i += 2; continue; }
        
        // Word-based Comparison Operators
        const opMatch = str.slice(i).match(/^(==|!=|>=|<=|>|<|contains|startsWith|endsWith)/i);
        if (opMatch) { 
            const op = opMatch[0];
            if (/^[a-z]/i.test(op)) {
                const nextChar = str[i + op.length];
                if (nextChar && !/\s|\(/.test(nextChar)) {
                    // Part of a longer field/word match fallthrough
                } else {
                    tokens.push(op.toLowerCase()); 
                    i += op.length; 
                    continue; 
                }
            } else {
                tokens.push(op); 
                i += op.length; 
                continue; 
            }
        }

        // Fields, Functions, and Literal Words
        const wordMatch = str.slice(i).match(/^([^()\s&&||,<>!=]+)/);
        if (wordMatch) {
            tokens.push(wordMatch[0].trim());
            i += wordMatch[0].length;
            continue;
        }
        i++;
    }
    return tokens;
}

/**
 * Recursive Descent Parser
 */
class Parser {
    constructor(tokens, data) {
        this.tokens = tokens;
        this.data = data;
        this.pos = 0;
    }

    peek() { return this.tokens[this.pos]; }
    eat() { return this.tokens[this.pos++]; }

    parseExpression() {
        let left = this.parseAnd();
        while (this.peek() === '||') {
            this.eat();
            const right = this.parseAnd();
            left = left || right;
        }
        return left;
    }

    parseAnd() {
        let left = this.parsePrimary();
        while (this.peek() === '&&') {
            this.eat();
            const right = this.parsePrimary();
            left = left && right;
        }
        return left;
    }

    parsePrimary() {
        const token = this.peek();
        if (token === '(') {
            this.eat();
            const result = this.parseExpression();
            if (this.eat() !== ')') throw new Error('Unbalanced parentheses');
            return result;
        }
        
        // Try function notation: func(field, value)
        if (this.tokens[this.pos+1] === '(') {
            const funcName = this.eat();
            this.eat(); // (
            const args = [];
            while (this.peek() !== ')' && this.pos < this.tokens.length) {
                args.push(this.eat());
                if (this.peek() === ',') this.eat();
            }
            this.eat(); // )
            
            if (functions[funcName]) {
                const fieldVal = this.data[args[0]];
                const searchVal = args[1];
                return functions[funcName](fieldVal, searchVal);
            }
            throw new Error(`Unknown function: ${funcName}`);
        }

        // Standard comparison or word operator: field op value
        const field = this.eat();
        const op = this.eat();
        let value = this.eat();

        // Handle word-based operators like "field contains value"
        if (functions[op]) {
            return functions[op](this.data[field], value);
        }

        if (!operators[op]) throw new Error(`Unknown operator: ${op} at token ${this.pos-1}`);
        
        const fieldVal = this.data[field];
        // Type conversion for literal values
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        else if (!isNaN(value) && value !== '') value = Number(value);
        else value = String(value).replace(/['"]/g, '');

        return operators[op](fieldVal, value);
    }
}

async function evaluateRules(rules, inputData) {
    const evaluatedRules = [];
    let nextStepId = null;

    for (const rule of rules) {
        const { condition, next_step_id } = rule;
        
        if (!condition || condition.toUpperCase() === 'DEFAULT') {
            evaluatedRules.push({ rule: 'DEFAULT', result: true });
            nextStepId = next_step_id;
            break;
        }

        try {
            const tokens = tokenize(condition);
            const parser = new Parser(tokens, inputData);
            const isMatch = parser.parseExpression();
            
            evaluatedRules.push({ rule: condition, result: isMatch });
            if (isMatch) {
                nextStepId = next_step_id;
                break;
            }
        } catch (error) {
            console.error(`Parser Error: ${error.message} for [${condition}]`);
            evaluatedRules.push({ rule: condition, result: false, error: error.message });
        }
    }

    return { nextStepId, evaluatedRules };
}

function validateCondition(condition) {
    if (!condition || condition.toUpperCase() === 'DEFAULT') return { valid: true };
    try {
        const tokens = tokenize(condition);
        if (tokens.length === 0) return { valid: false, error: 'Empty condition' };
        return { valid: true };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}

module.exports = { evaluateRules, validateCondition };
