/**
 * Debug HHI and IQR
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

console.log('=== HHI raw ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股成交额的赫芬达尔指数HHI'
  });
  const step = r.data.data[0];
  console.log('columns:', step.columns.map(c => c.name + '(' + (c.unit||'') + ')').join(', '));
  console.log('rows[0]:', step.rows[0]);
  // HHI 的实际值可能是第三列
  step.columns.forEach((col, i) => {
    console.log(`  col[${i}] "${col.name}" unit="${col.unit}" value=${step.rows[0][i]}`);
  });
} catch(e) { console.log('ERROR:', e.message); }

console.log('\n=== IQR raw ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股涨跌幅的四分位距IQR'
  });
  const step = r.data.data[0];
  console.log('columns:', step.columns.map(c => c.name + '(' + (c.unit||'') + ')').join(', '));
  step.columns.forEach((col, i) => {
    console.log(`  col[${i}] "${col.name}" unit="${col.unit}" value=${step.rows[0][i]}`);
  });
} catch(e) { console.log('ERROR:', e.message); }

// Also test "P80减P20" and "P75减P25"
console.log('\n=== P75-P25 ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股涨跌幅的75分位减去25分位'
  });
  const step = r.data.data[0];
  step.columns.forEach((col, i) => {
    console.log(`  col[${i}] "${col.name}" unit="${col.unit}" value=${step.rows[0][i]}`);
  });
} catch(e) { console.log('ERROR:', e.message); }
