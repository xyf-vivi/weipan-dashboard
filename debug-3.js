/**
 * Try different questions for IQR/percentiles
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

const questions = [
  '全A股涨跌幅75分位数',
  '全A股涨跌幅25分位数',
  '全A股当日涨跌幅80分位数',
  '全A股当日涨跌幅20分位数',
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
