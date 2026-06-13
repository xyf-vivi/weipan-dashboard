/**
 * Get IQR from tdx screener: sort by changeRate, get enough rows to compute P75-P25
 */
const { execFileSync } = require('child_process');

// Use the TDX MCP tool to get stocks sorted by change rate
// We need the raw screener data - let's use ToolSearch approach
// Actually we can call it via the CLI

// First, get all stocks sorted by changeRate ascending
// tdx_screener with message "按涨跌幅排序" should return sorted stocks
// We need ~5500 rows to compute P25/P75

// Alternative: Use the IQR from analytics_data differently
// The data returned has 5527 stocks with their change rates
// We can pull a sample and compute P25/P75

// Actually, analytics_data returned individual stocks sorted by change rate
// with 序号 (rank) and 最大序号 (total). We just need row at P25 and P75 rank.

// Let me try: ask for specific percentile stocks
const { execSync } = require('child_process');
const path = require('path');

const WIND_SKILL = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill';
const NODE = 'C:\\Users\\xyf31\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';

function callWind(tool, method, params) {
  const args = [path.join(WIND_SKILL, 'scripts', 'cli.mjs'), 'call', tool, method, JSON.stringify(params)];
  const out = execFileSync(NODE, args, { encoding: 'utf8', maxBuffer: 50*1024*1024, cwd: WIND_SKILL });
  const parsed = JSON.parse(out);
  return JSON.parse(parsed.content[0].text);
}

// The analytics_data returned 5527 stocks with change rates.
// The "涨跌幅序号" and "涨跌幅最大序号" tell us position.
// P25 = row where 序号/最大序号 ≈ 0.25
// P75 = row where 序号/最大序号 ≈ 0.75

// Let me try to get the full sorted list
console.log('=== Getting full sorted list for IQR ===');
try {
  const r = callWind('analytics_data', 'get_financial_data', {
    question: '全A股涨跌幅的四分位距IQR'
  });
  const step = r.data.data[0];
  console.log('total rows:', step.rows.length);
  const maxRank = step.rows[0][5]; // 涨跌幅最大序号 = 5527

  // Sort by 序号 (rank)
  const sorted = step.rows.sort((a, b) => a[4] - b[4]); // sort by 涨跌幅序号

  // P25 position: rank = 0.25 * maxRank
  const p25Idx = Math.floor(0.25 * maxRank) - 1;
  const p75Idx = Math.floor(0.75 * maxRank) - 1;
  const p25Val = sorted[p25Idx] ? sorted[p25Idx][2] : null;
  const p75Val = sorted[p75Idx] ? sorted[p75Idx][2] : null;

  console.log('maxRank:', maxRank);
  console.log('P25 (rank', Math.floor(0.25*maxRank), '):', p25Val, '%');
  console.log('P75 (rank', Math.floor(0.75*maxRank), '):', p75Val, '%');
  console.log('IQR (P75-P25):', p25Val !== null && p75Val !== null ? (p75Val - p25Val).toFixed(2) + 'pct' : 'null');

  // Also compute P80-P20 for comparison
  const p20Idx = Math.floor(0.20 * maxRank) - 1;
  const p80Idx = Math.floor(0.80 * maxRank) - 1;
  const p20Val = sorted[p20Idx] ? sorted[p20Idx][2] : null;
  const p80Val = sorted[p80Idx] ? sorted[p80Idx][2] : null;
  console.log('P20:', p20Val, '%, P80:', p80Val, '%, P80-P20:', p20Val !== null && p80Val !== null ? (p80Val - p20Val).toFixed(2) + 'pct' : 'null');

  // Also median
  const p50Idx = Math.floor(0.50 * maxRank) - 1;
  const p50Val = sorted[p50Idx] ? sorted[p50Idx][2] : null;
  console.log('P50 (median):', p50Val, '%');

} catch(e) { console.log('ERROR:', e.message); }
