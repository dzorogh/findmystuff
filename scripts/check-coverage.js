#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 70;
const COVERAGE_FILE = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error('❌ Coverage file not found! Run tests with coverage first.');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
const total = coverage.total;

const metrics = {
  branches: total.branches.pct,
  functions: total.functions.pct,
  lines: total.lines.pct,
  statements: total.statements.pct,
};

let failed = false;

console.log('\n📊 Coverage Report:');
console.log('='.repeat(50));

Object.keys(metrics).forEach((key) => {
  const pct = metrics[key];
  const threshold = COVERAGE_THRESHOLD;
  const status = pct >= threshold ? '✅' : '❌';
  
  console.log(`${status} ${key.padEnd(12)}: ${pct.toFixed(2)}% (threshold: ${threshold}%)`);
  
  if (pct < threshold) {
    failed = true;
  }
});

console.log('='.repeat(50));

if (failed) {
  console.error('\n❌ Coverage threshold not met!');
  console.error(`   Required: ${COVERAGE_THRESHOLD}% for all metrics\n`);
  process.exit(1);
} else {
  console.log('\n✅ All coverage thresholds met!');
  console.log(`   Coverage: ${metrics.lines.toFixed(2)}% lines, ${metrics.functions.toFixed(2)}% functions\n`);
  process.exit(0);
}
