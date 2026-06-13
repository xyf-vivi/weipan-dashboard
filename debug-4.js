/**
 * Get specific percentile values - adjust to get single-row results
 */
const { execFileSync } = require('child_process');
const path = require('path');

const WIND_SKILL = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill';
const NODE = 'C:\\Users\\xyf31\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';

function callWind(tool, method, params) {
  const args = [path.join(WIND_SKILL, 'scripts', 'cli.mjs'), 'call', tool, method, JSON.stringify(params)];
  const out = execFileSync(NODE, args, { encoding: 'utf8', maxBuffer: 50*1024*1024, cwd: WIND_SKILL });
  const parsed = JSON.parse(out);
  return JSON.parse(parsed.content[0].text);
}

// P75 worked well (returned 1 row with value 2.56)
// P25 returned 100 rows starting from the lowest. We need to get the stock at rank ~25% position.
// Let me try different phrasings

const questions = [
  '全A股涨跌幅由高到低排名第25百分位的股票',
  '全A股涨跌幅中位数对应的股票',
];

for (const q of questions) {
  console.log('=== ' + q + ' ===');
  try {
    const r = callWind('analytics_data', 'get_financial_data', { question: q });
    const step = r.data.data[0];
    console.log('  cols:', step.columns.map(c => c.name).join(','));
    console.log('  rows[0]:', step.rows[0]);
    console.log('  total rows:', step.rows.length);
  } catch(e) { console.log('  ERROR:', e.message.substring(0, 100)); }
  console.log('');
}

// Key findings so far:
// P75 = 2.56%, P80 = 2.9412%
// P25 query returns the lowest 100 stocks, not the single P25 stock
// IQR = P75 - P25, we have P75 = 2.56, need P25

// The analytics approach returns a sorted table, and the API gives the stock at that rank.
// For P75 it correctly returned 1 stock.
// For P25 it returned 100 stocks starting from bottom.

// Alternative: use tdx_screener to sort all stocks by changeRate and pick percentile
// Or just compute P75 and P25 using two separate calls

// Actually let me try "涨跌幅第75百分位" vs "涨跌幅第25百分位"
const q2 = [
  '全A股涨跌幅第25百分位',
  '全A股涨跌幅第50百分位',
];

for (const q of q2) {
  console.log('=== ' + q + ' ===');
  try {
    const r = callWind('analytics_data', 'get_financial_data', { question: q });
    const step = r.data.data[0];
    console.log('  cols:', step.columns.map(c => c.name).join(','));
    console.log('  rows[0]:', step.rows[0]);
    console.log('  total rows:', step.rows.length);
  } catch(e) { console.log('  ERROR:', e.message.substring(0, 100)); }
  console.log('');
}
