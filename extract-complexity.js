const fs = require('fs');
const results = JSON.parse(fs.readFileSync('lint-results.json', 'utf8'));

const complexityIssues = [];

results.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.ruleId === 'sonarjs/cognitive-complexity') {
      complexityIssues.push({
        filePath: file.filePath,
        message: msg.message,
        line: msg.line,
        column: msg.column
      });
    }
  });
});

console.log(JSON.stringify(complexityIssues, null, 2));
