const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\BAO TRAN\\Desktop\\DoAN\\web-expense-management\\frontend\\app\\transactions\\page.tsx', 'utf-8');
const lines = content.split('\n');
const filteredAssignments = lines.map((l, i) => ({ line: i + 1, content: l.trim() })).filter(l => l.content.includes('filtered = '));
console.log(filteredAssignments);
