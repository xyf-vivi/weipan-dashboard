/**
 * Debug analytics_data response format
 */
const { execFileSync } = require('child_process');
const path = require('path');

const WIND_SKILL = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill';
const NODE = 'C:\\Users\\xyf31\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';

function callWind(tool, method, params) {
  const args = [path.join(WIND_SKILL, 'scripts', 'cli.mjs'), 'call', tool, method, JSON.stringify(params)];
  const out = execFileSync(NODE, args, { encoding: 'utf8', maxBuffer: 10*1024*1024, cwd: WIND_SKILL });
  const parsed = JSON.parse(out);
  return JSON.parse(parsed.content[0].text);
}

// Test 1: small cap ratio
console.log('=== Test 1: small cap ratio ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '自由流通市值后20%股票的成交额占全A成交额的比例'
  });
  console.log('top keys:', Object.keys(r));
  console.log('full structure (truncated):', JSON.stringify(r).substring(0, 500));
} catch(e) { console.log('ERROR:', e.message); }

// Test 2: median
console.log('\n=== Test 2: all A median ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股涨跌幅的中位数'
  });
  console.log('columns:', r.data.columns.map(c => c.name || c).join(','));
  console.log('row count:', r.data.rows.length);
  if (r.data.rows.length > 0) {
    console.log('row0:', r.data.rows[0]);
  }
} catch(e) { console.log('ERROR:', e.message); }

// Test 3: HHI
console.log('\n=== Test 3: HHI ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股成交额的赫芬达尔指数HHI'
  });
  console.log('columns:', r.data.columns.map(c => c.name || c).join(','));
  console.log('row count:', r.data.rows.length);
  if (r.data.rows.length > 0) {
    console.log('row0:', r.data.rows[0]);
  }
} catch(e) { console.log('ERROR:', e.message); }

// Test 4: check turnover rate format
console.log('\n=== Test 4: turnover rate from kline ===');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'v6-data-output.json'), 'utf8'));
console.log('weipan last20 turnoverRates:', data.weipan.last20TurnoverRates);
console.log('turnover obj:', JSON.stringify(data.turnover));
