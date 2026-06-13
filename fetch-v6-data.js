/**
 * v6 数据综合取数脚本
 * 从Wind和通达信获取全部第一批+第二批日频数据
 * 输出: v6-data-output.json
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WIND_SKILL = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill';
const NODE = 'C:\\Users\\xyf31\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';

function callWind(tool, method, params) {
  const args = [
    path.join(WIND_SKILL, 'scripts', 'cli.mjs'),
    'call', tool, method,
    JSON.stringify(params)
  ];
  const out = execFileSync(NODE, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    cwd: WIND_SKILL
  });
  const parsed = JSON.parse(out);
  const text = parsed.content[0].text;
  return JSON.parse(text);
}

// === 1. 取微盘251日K线 ===
console.log('[1/7] Fetching weipan 251-day kline...');
const wpKline = callWind('index_data', 'get_index_kline', {
  windcode: '868008.WI',
  begin_date: '20250601',
  end_date: '20260612',
  period: '10'  // daily
});
const wpRows = wpKline.data.rows;
const wpCols = wpKline.data.columns.map(c => c.name);
console.log('  weipan rows:', wpRows.length, 'cols:', wpCols.join(','));

// column indices
const ci = {};
wpCols.forEach((name, i) => ci[name] = i);

// extract close and turnoverRate arrays
const wpCloses = wpRows.map(r => parseFloat(r[ci.CLOSE || 2]));
const wpTurnoverRates = wpRows.map(r => parseFloat(r[ci.CHANGEHANDRATE || 7]) || 0);
const wpDates = wpRows.map(r => {
  const dt = r[ci.TRADEDATE || 9] || r[r.length - 1];
  return String(dt).substring(0, 10);
});

// === 2. 取科创50 251日K线 ===
console.log('[2/7] Fetching kc50 251-day kline...');
const kcKline = callWind('index_data', 'get_index_kline', {
  windcode: '000688.SH',
  begin_date: '20250601',
  end_date: '20260612',
  period: '10'
});
const kcRows = kcKline.data.rows;
const kcCols = kcKline.data.columns.map(c => c.name);
const kcCi = {};
kcCols.forEach((name, i) => kcCi[name] = i);
const kcCloses = kcRows.map(r => r[kcCi.CLOSE || 2]);
console.log('  kc50 rows:', kcRows.length);

// === 3. 取沪深300 251日K线 ===
console.log('[3/7] Fetching hs300 251-day kline...');
const hsKline = callWind('index_data', 'get_index_kline', {
  windcode: '000300.SH',
  begin_date: '20250601',
  end_date: '20260612',
  period: '10'
});
const hsRows = hsKline.data.rows;
const hsCols = hsKline.data.columns.map(c => c.name);
const hsCi = {};
hsCols.forEach((name, i) => hsCi[name] = i);
const hsCloses = hsRows.map(r => r[hsCi.CLOSE || 2]);
console.log('  hs300 rows:', hsRows.length);

// === 4. 计算相对净值和派生指标 ===
console.log('[4/7] Computing derived metrics...');

// 对齐日期：取三组K线都有数据的交易日
// 微盘和科创50对齐
const minLen = Math.min(wpCloses.length, kcCloses.length, hsCloses.length);
const wpAligned = wpCloses.slice(-minLen);
const kcAligned = kcCloses.slice(-minLen);
const hsAligned = hsCloses.slice(-minLen);

// 相对净值 R = 微盘/科创50 (归一化到100)
const relKc50 = wpAligned.map((w, i) => (w / kcAligned[i]) * 100);
// 相对净值 R = 微盘/沪深300 (归一化到100)
const relHs300 = wpAligned.map((w, i) => (w / hsAligned[i]) * 100);

// 243日均线 (MA243)
const ma243_kc50 = relKc50.length >= 243
  ? relKc50.slice(-243).reduce((s, v) => s + v, 0) / 243
  : null;
const ma243_hs300 = relHs300.length >= 243
  ? relHs300.slice(-243).reduce((s, v) => s + v, 0) / 243
  : null;

// 当前相对净值
const relKc50_now = relKc50[relKc50.length - 1];
const relHs300_now = relHs300[relHs300.length - 1];

// R_t / MA243 - 1
const relMa243Pos_kc50 = ma243_kc50 !== null ? (relKc50_now / ma243_kc50 - 1) : null;
const relMa243Pos_hs300 = ma243_hs300 !== null ? (relHs300_now / ma243_hs300 - 1) : null;

// 20日回归斜率 (基于相对净值)
function linearRegression(y) {
  const n = y.length;
  const x = Array.from({length: n}, (_, i) => i + 1);
  const xMean = x.reduce((s, v) => s + v, 0) / n;
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  // t-value: slope / SE(slope)
  const yHat = x.map(xi => slope * xi + (yMean - slope * xMean));
  const residuals = y.map((yi, i) => yi - yHat[i]);
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  const se2 = n > 2 ? sse / (n - 2) : 0;
  const seSlope = den === 0 ? 0 : Math.sqrt(se2 / den);
  const tValue = seSlope === 0 ? 0 : slope / seSlope;
  return { slope, tValue, r2: 1 - sse / (y.reduce((s, v) => s + (v - yMean) ** 2, 0) || 1) };
}

const relKc50_last20 = relKc50.slice(-20);
const relHs300_last20 = relHs300.slice(-20);
const regKc50 = linearRegression(relKc50_last20);
const regHs300 = linearRegression(relHs300_last20);

// 微盘换手率近一年(251条)分位
const sortedTR = [...wpTurnoverRates].sort((a, b) => a - b);
const lastTR = wpTurnoverRates[wpTurnoverRates.length - 1];
const trPct1y = sortedTR.filter(r => r <= lastTR).length / sortedTR.length;
// 近一年换手率中位数和当前值
const trMedian1y = sortedTR[Math.floor(sortedTR.length / 2)];

// === 5. 取基金净值K线（国金量化多因子 006195.OF）===
console.log('[5/7] Fetching fund kline for repair days...');
const fundKline = callWind('fund_data', 'get_fund_kline', {
  windcode: '006195.OF',
  begin_date: '20260501',
  end_date: '20260612',
  period: '10'
});
const fundRows = fundKline.data.rows;
const fundCols = fundKline.data.columns.map(c => c.name);
const fundCi = {};
fundCols.forEach((name, i) => fundCi[name] = i);
// MATCH or NAV
const matchIdx = fundCi.MATCH !== undefined ? fundCi.MATCH : fundCi.NAV !== undefined ? fundCi.NAV : 2;
const fundNavs = fundRows.map(r => r[matchIdx]).filter(v => v !== null && v !== undefined && v > 0);
console.log('  fund rows:', fundRows.length, 'valid navs:', fundNavs.length);

// 计算连续修复天数（连续正收益）
let repairDays = 0;
for (let i = fundNavs.length - 1; i > 0; i--) {
  if (fundNavs[i] > fundNavs[i - 1]) repairDays++;
  else break;
}

// === 6. 取analytics_data（小票成交占比、全A中位数、HHI、IQR）===
console.log('[6/7] Fetching analytics_data...');

// Helper: 从 analytics_data 返回中提取数值
// 结构是 r.data.data[0].rows[0] = [val1, val2, val3...]
// 对应 columns 顺序
function extractAnalytics(question) {
  try {
    const r = callWind('analytics_data', 'get_financial_data', { question });
    const step = r.data && r.data.data && r.data.data[0];
    if (!step || !step.rows || step.rows.length === 0) return null;
    const row = step.rows[0];
    const cols = step.columns;
    return { row, cols };
  } catch (e) {
    console.log('  analytics error for "' + question + '":', e.message);
    return null;
  }
}

// 小票成交占比
let smallCapRatio = null;
{
  const res = extractAnalytics('自由流通市值后20%股票的成交额占全A成交额的比例');
  if (res) {
    // columns: [成交额合计(亿元), 全A成交额(万亿元), 占比]
    const ratioIdx = res.cols.findIndex(c => c.name && c.name.includes('比例'));
    if (ratioIdx >= 0 && typeof res.row[ratioIdx] === 'number') {
      smallCapRatio = res.row[ratioIdx] * 100; // 0.0168 -> 1.68%
    }
  }
}
console.log('  smallCapRatio:', smallCapRatio);

// 全A中位数涨跌幅
let allAMedian = null;
{
  const res = extractAnalytics('全A股涨跌幅的中位数');
  if (res) {
    const medIdx = res.cols.findIndex(c => c.name && c.name.includes('中位数'));
    if (medIdx >= 0 && typeof res.row[medIdx] === 'number') {
      allAMedian = res.row[medIdx];
    }
  }
}
console.log('  allAMedian:', allAMedian);

// HHI
let hhi = null;
{
  const res = extractAnalytics('全A股成交额的赫芬达尔指数HHI');
  if (res) {
    const hhiIdx = res.cols.findIndex(c => c.name && (c.name.includes('HHI') || c.name.includes('赫芬达尔')));
    if (hhiIdx >= 0 && typeof res.row[hhiIdx] === 'number') {
      hhi = res.row[hhiIdx]; // 已经是百分比 0.1579(%)
    }
  }
}
console.log('  hhi:', hhi);

// 横截面分化度: IQR = P75 - P25
let p75 = null, p25 = null, iqr = null;
{
  // P75: 问 "75分位数" 返回1条
  try {
    const r75 = callWind('analytics_data', 'get_financial_data', { question: '全A股涨跌幅75分位数' });
    const step75 = r75.data && r75.data.data && r75.data.data[0];
    if (step75 && step75.rows && step75.rows.length > 0) {
      const chgIdx = step75.columns.findIndex(c => c.name && c.name.includes('涨跌幅'));
      if (chgIdx >= 0) p75 = step75.rows[0][chgIdx];
    }
  } catch(e) { console.log('  p75 error:', e.message); }

  // P25: 问 "第25百分位" 返回1条（可能返回100条需取首行或末行）
  try {
    const r25 = callWind('analytics_data', 'get_financial_data', { question: '全A股涨跌幅第25百分位' });
    const step25 = r25.data && r25.data.data && r25.data.data[0];
    if (step25 && step25.rows && step25.rows.length > 0) {
      const chgIdx = step25.columns.findIndex(c => c.name && c.name.includes('涨跌幅'));
      if (chgIdx >= 0) {
        // 如果返回多条，取中间那条（最接近P25的）
        if (step25.rows.length === 1) {
          p25 = step25.rows[0][chgIdx];
        } else {
          // 返回多条时按涨跌幅排序，P25应该在较低位置
          // 但更可靠的方式是直接取最后一行（最接近25分位的那只）
          p25 = step25.rows[step25.rows.length - 1][chgIdx];
        }
      }
    }
  } catch(e) { console.log('  p25 error:', e.message); }

  if (p75 !== null && p25 !== null) iqr = p75 - p25;
}
console.log('  p75:', p75, 'p25:', p25, 'iqr:', iqr);

// === 7. 汇总输出 ===
console.log('[7/7] Building output...');

const output = {
  meta: {
    fetchDate: new Date().toISOString(),
    dataDate: wpDates[wpDates.length - 1],
    note: 'Data fetched from Wind MCP + analytics_data'
  },

  // 相对净值指标
  relativeNav: {
    kc50: {
      current: relKc50_now,
      ma243: ma243_kc50,
      ma243Position: relMa243Pos_kc50, // R_t/MA243-1, 正=均线之上
      slope20: regKc50.slope,
      tValue20: regKc50.tValue,
      r2_20: regKc50.r2,
      aboveMA243: relMa243Pos_kc50 !== null && relMa243Pos_kc50 > 0,
      slopePositive: regKc50.slope > 0,
      last20Series: relKc50_last20
    },
    hs300: {
      current: relHs300_now,
      ma243: ma243_hs300,
      ma243Position: relMa243Pos_hs300,
      slope20: regHs300.slope,
      tValue20: regHs300.tValue,
      r2_20: regHs300.r2,
      aboveMA243: relMa243Pos_hs300 !== null && relMa243Pos_hs300 > 0,
      slopePositive: regHs300.slope > 0,
      last20Series: relHs300_last20
    }
  },

  // 换手率
  turnover: {
    current: parseFloat(lastTR),
    percentile1y: trPct1y, // 0-1
    median1y: parseFloat(trMedian1y),
    note: '近一年(251个交易日)分位'
  },

  // 基金连续修复天数
  fundRepair: {
    fundCode: '006195.OF',
    repairDays: repairDays,
    navSeries: fundNavs
  },

  // analytics_data
  analytics: {
    smallCapTurnoverRatio: smallCapRatio, // %
    allAMedianChg: allAMedian, // %
    hhi: hhi, // % (已经是百分比，如0.1579)
    iqr: iqr, // pct points
    p75: p75,
    p25: p25
  },

  // 微盘最后20日收盘价和换手率（保留用于其他计算）
  weipan: {
    last20Closes: wpCloses.slice(-20),
    last20TurnoverRates: wpTurnoverRates.slice(-20),
    lastDate: wpDates[wpDates.length - 1]
  }
};

const outputPath = path.join(__dirname, 'v6-data-output.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('\n=== OUTPUT ===');
console.log(JSON.stringify(output.meta, null, 2));
console.log('relativeNav.kc50:', JSON.stringify({
  current: output.relativeNav.kc50.current.toFixed(2),
  ma243: output.relativeNav.kc50.ma243 ? output.relativeNav.kc50.ma243.toFixed(2) : 'null',
  ma243Position: output.relativeNav.kc50.ma243Position ? (output.relativeNav.kc50.ma243Position * 100).toFixed(2) + '%' : 'null',
  slope20: output.relativeNav.kc50.slope20.toFixed(4),
  tValue20: output.relativeNav.kc50.tValue20.toFixed(3),
  aboveMA243: output.relativeNav.kc50.aboveMA243,
  slopePositive: output.relativeNav.kc50.slopePositive
}, null, 2));
console.log('turnover:', JSON.stringify({
  current: output.turnover.current.toFixed(2),
  percentile1y: (output.turnover.percentile1y * 100).toFixed(0) + '%',
  median1y: output.turnover.median1y.toFixed(2)
}, null, 2));
console.log('fundRepair.days:', output.fundRepair.repairDays);
console.log('analytics:', JSON.stringify(output.analytics, null, 2));
console.log('\nOutput saved to:', outputPath);
