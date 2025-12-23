document.addEventListener('DOMContentLoaded', () => {
    const calculatorBtn = document.getElementById('calculator-btn');
    const calculatorModal = document.getElementById('calculator-modal');
    const closeCalculator = document.getElementById('close-calculator');
    const calcDisplay = document.getElementById('calc-display');
    const calcKeys = document.getElementById('calc-keys');

    if (!calculatorModal || !calcDisplay || !calcKeys) return;

    // State
    let expr = '';
    let lastAns = 0;
    let isDeg = true; // degree mode by default

    // Build keypad dynamically (scientific)
    const rows = [
        [
            { label: isDeg ? 'DEG' : 'RAD', key: 'TOGGLE', cls: 'key-op' },
            { label: 'AC', key: 'AC', cls: 'key-ac' },
            { label: 'DEL', key: 'DEL', cls: 'key-del' },
            { label: '%', key: '%', cls: 'key-op' }
        ],
        [
            { label: 'sin', key: 'sin(' },
            { label: 'cos', key: 'cos(' },
            { label: 'tan', key: 'tan(' },
            { label: '√', key: 'sqrt(' }
        ],
        [
            { label: 'ln', key: 'ln(' },
            { label: 'log', key: 'log(' },
            { label: 'x²', key: '^2' },
            { label: 'xʸ', key: '^' }
        ],
        [
            { label: '(', key: '(' },
            { label: ')', key: ')' },
            { label: 'π', key: 'π' },
            { label: 'e', key: 'ℯ' }
        ],
        [
            { label: '7', key: '7' },
            { label: '8', key: '8' },
            { label: '9', key: '9' },
            { label: '÷', key: '÷', cls: 'key-op' }
        ],
        [
            { label: '4', key: '4' },
            { label: '5', key: '5' },
            { label: '6', key: '6' },
            { label: '×', key: '×', cls: 'key-op' }
        ],
        [
            { label: '1', key: '1' },
            { label: '2', key: '2' },
            { label: '3', key: '3' },
            { label: '-', key: '-', cls: 'key-op' }
        ],
        [
            { label: '0', key: '0' },
            { label: '.', key: '.' },
            { label: '!', key: '!' },
            { label: '+', key: '+', cls: 'key-op' }
        ],
        [
            { label: 'Ans', key: 'Ans' },
            { label: '⅟ₓ', key: 'inv(' },
            { label: '=', key: '=', cls: 'key-eq' },
            { label: '❑', key: 'COPY', cls: 'key-copy' }
        ]
    ];

    function renderKeys() {
        calcKeys.innerHTML = '';
        rows.forEach(row => {
            row.forEach(btn => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'calc-key' + (btn.cls ? ' ' + btn.cls : '');
                el.textContent = btn.label;
                el.setAttribute('data-key', btn.key);
                calcKeys.appendChild(el);
            });
        });
    }

    function setMode(deg) {
        isDeg = deg;
        // Update toggle label
        const firstBtn = calcKeys.querySelector('[data-key="TOGGLE"]');
        if (firstBtn) firstBtn.textContent = isDeg ? 'DEG' : 'RAD';
    }

    function show() {
        calculatorModal.classList.add('show');
        updateDisplay();
    }

    function hide() {
        calculatorModal.classList.remove('show');
    }

    function updateDisplay(text) {
        if (typeof text === 'string') {
            calcDisplay.textContent = text;
            return;
        }
        calcDisplay.textContent = expr || '0';
    }

    // Sanitized evaluate
    function evaluateExpression(input) {
        try {
            let s = String(input || '').trim();
            if (!s) return '';

            // Friendly symbols
            s = s.replace(/×/g, '*').replace(/÷/g, '/');

            // Power
            s = s.replace(/\^/g, '**');

            // Percent: convert trailing n% -> (n/100)
            s = s.replace(/([0-9.)]+)%/g, '($1/100)');

            // Constants
            s = s.replace(/π/g, 'Math.PI');
            s = s.replace(/ℯ/g, 'Math.E');
            s = s.replace(/\bAns\b/g, String(lastAns));

            // Factorial: x! => fact(x)
            s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, 'fact($1)');

            // Functions mapping
            // inv(a) => 1/(a)
            s = s.replace(/inv\(/g, '(1/(');

            // sin,cos,tan (deg/rad aware through fns)
            s = s.replace(/\bsin\(/g, 'fns.sin(')
                .replace(/\bcos\(/g, 'fns.cos(')
                .replace(/\btan\(/g, 'fns.tan(')
                .replace(/\basin\(/g, 'fns.asin(')
                .replace(/\bacos\(/g, 'fns.acos(')
                .replace(/\batan\(/g, 'fns.atan(');

            // ln, log, sqrt
            s = s.replace(/\bln\(/g, 'Math.log(')
                .replace(/\blog\(/g, 'Math.log10(')
                .replace(/\bsqrt\(/g, 'Math.sqrt(')
                .replace(/\babs\(/g, 'Math.abs(');

            // Allow only safe characters/tokens after replacements
            // Note: We allow letters for Math/fns and exponent E in numbers
            const safe = /^[0-9eE+\-*/%.()\s]*|(Math\.[a-zA-Z]+)|(fns\.[a-zA-Z]+)|(fact\(|\))$/;
            // Basic quick check for obviously unsafe characters
            if (/[^0-9a-zA-Z+\-*/%().,\s]/.test(s)) {
                // Allow asterisks for exponent already mapped; commas only inside function calls
            }

            const fns = buildFns(isDeg);
            const fact = factorial;
            // eslint-disable-next-line no-new-func
            const fn = Function('Math', 'fns', 'fact', `"use strict"; return (${s});`);
            const out = fn(Math, fns, fact);
            if (typeof out !== 'number' || !isFinite(out)) return 'Error';
            return formatNumber(out);
        } catch (e) {
            return 'Error';
        }
    }

    function formatNumber(n) {
        // Keep reasonable precision for display
        if (!isFinite(n)) return 'Error';
        const abs = Math.abs(n);
        if ((abs !== 0 && (abs >= 1e9 || abs < 1e-6))) return n.toExponential(8);
        const s = n.toPrecision(12);
        // Trim trailing zeros
        return String(parseFloat(s));
    }

    function factorial(x) {
        // Only allow integers >=0 and <= 170 (to avoid Infinity)
        const n = Number(x);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170) return NaN;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    function buildFns(isDegMode) {
        const toRad = (a) => isDegMode ? (a * Math.PI / 180) : a;
        const fromRad = (a) => isDegMode ? (a * 180 / Math.PI) : a;
        return {
            sin: (a) => Math.sin(toRad(a)),
            cos: (a) => Math.cos(toRad(a)),
            tan: (a) => Math.tan(toRad(a)),
            asin: (a) => fromRad(Math.asin(a)),
            acos: (a) => fromRad(Math.acos(a)),
            atan: (a) => fromRad(Math.atan(a))
        };
    }

    function appendKey(key) {
        switch (key) {
            case 'AC':
                expr = '';
                updateDisplay();
                break;
            case 'DEL':
                expr = expr.slice(0, -1);
                updateDisplay();
                break;
            case '=':
                const res = evaluateExpression(expr);
                updateDisplay(res);
                if (res !== 'Error' && res !== '') {
                    lastAns = Number(res);
                    expr = res;
                }
                break;
            case 'TOGGLE':
                setMode(!isDeg);
                break;
            case 'COPY':
                const currentDisplay = calcDisplay.textContent;
                if (currentDisplay && currentDisplay !== '0' && currentDisplay !== 'Error') {
                    navigator.clipboard.writeText(currentDisplay).then(() => {
                        // Visual feedback
                        const originalText = calcDisplay.textContent;
                        updateDisplay('Copied!');
                        setTimeout(() => updateDisplay(originalText), 800);
                    }).catch(() => {
                        updateDisplay('Copy failed');
                        setTimeout(() => updateDisplay(currentDisplay), 1000);
                    });
                }
                break;
            case '^2':
                expr += '**2';
                updateDisplay();
                break;
            default:
                expr += key;
                updateDisplay();
                break;
        }
    }

    // Build and attach listeners
    renderKeys();
    setMode(isDeg);

    calcKeys.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-key]');
        if (!b) return;
        const key = b.getAttribute('data-key');
        appendKey(key);
    });

    if (calculatorBtn) calculatorBtn.addEventListener('click', show);
    if (closeCalculator) closeCalculator.addEventListener('click', hide);
    calculatorModal.addEventListener('click', (e) => { if (e.target === calculatorModal) hide(); });

    // Keyboard support (only when modal is open)
    document.addEventListener('keydown', (e) => {
        if (!calculatorModal.classList.contains('show')) return;

        // Close on Escape
        if (e.key === 'Escape') {
            e.preventDefault();
            hide();
            return;
        }

        // Enter: evaluate
        if (e.key === 'Enter') {
            e.preventDefault();
            appendKey('=');
            return;
        }

        // Backspace: DEL, Delete: AC
        if (e.key === 'Backspace') {
            e.preventDefault();
            appendKey('DEL');
            return;
        }
        if (e.key === 'Delete') {
            e.preventDefault();
            appendKey('AC');
            return;
        }

        // Numeric and common operators
        const map = {
            '*': '×',
            '/': '÷',
            '+': '+',
            '-': '-',
            '^': '^',
            '(': '(',
            ')': ')',
            '.': '.',
            '%': '%',
            '!': '!',
        };

        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            appendKey(e.key);
            return;
        }

        if (map[e.key]) {
            e.preventDefault();
            appendKey(map[e.key]);
            return;
        }

        // Optional quick function shortcuts
        const fkeys = { s: 'sin(', c: 'cos(', t: 'tan(', l: 'ln(' };
        const k = e.key.toLowerCase();
        if (fkeys[k]) {
            e.preventDefault();
            appendKey(fkeys[k]);
        }
    });
});
