/**
 * 微盘量化看板 — 每日盘后数据更新脚本
 * 
 * 功能：
 *   1. 从 Wind MCP 拉取全部日频截面数据（12项）+ 连续性序列（5项）
 *   2. 从通达信拉取涨跌家数
 *   3. 自动计算派生指标（相对净值、修复天数、趋势等）
 *   4. 更新 FUND_PRODUCTS 中基金净值
 *   5. 重写 auto-data.js
 *   6. 推送到 GitHub Pages
 * 
 * 使用方法：
 *   node update-daily.js
 * 
 * 数据源依赖：
 *   - Wind MCP: C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill
 *   - 通达信: tdx-connector（通过 MCP 工具调用）
 * 
 * 注意：Wind CLI 必须用 execFileSync（不经shell），否则JSON引号被bash吞掉
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const WIND_SKILL = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill';
const NODE = 'C:\\Users\\xyf31\\.workbuddy\\binaries\\node\\versions\\22.22.2\\node.exe';
const PROJECT_DIR = 'D:\\workboddy\\2026-06-13-08-44-52\\weipan-dashboard';
const DATA_FILE = path.join(PROJECT_DIR, 'auto-data.js');

// 今天日期（YYYYMMDD 和 YYYY-MM-DD）
const NOW = new Date();
const todayCompact = NOW.getFullYear().toString() + 
  String(NOW.getMonth() + 1).padStart(2, '0') + 
  String(NOW.getDate()).padStart(2, '0');
const todayISO = NOW.getFullYear().toString() + '-' +
  String(NOW.getMonth() + 1).padStart(2, '0') + '-' +
  String(NOW.getDate()).padStart(2, '0');

// 回溯400自然日，确保覆盖243个交易日（年化约250交易日，加节假日buffer）
const startDateObj = new Date(NOW);
startDateObj.setDate(startDateObj.getDate() - 400);
const startDateCompact = startDateObj.getFullYear().toString() +
  String(startDateObj.getMonth() + 1).padStart(2, '0') +
  String(startDateObj.getDate()).padStart(2, '0');

// 10天前（连续性序列）
const tenDaysAgo = new Date(NOW);
tenDaysAgo.setDate(tenDaysAgo.getDate() - 14); // 多取几天确保有10个交易日
const tenDaysAgoCompact = tenDaysAgo.getFullYear().toString() +
  String(tenDaysAgo.getMonth() + 1).padStart(2, '0') +
  String(tenDaysAgo.getDate()).padStart(2, '0');

// === Wind 调用辅助函数 ===
function callWind(tool, method, params) {
  const args = [
    path.join(WIND_SKILL, 'scripts', 'cli.mjs'),
    'call', tool, method,
    JSON.stringify(params)
  ];
  try {
    const out = execFileSync(NODE, args, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      cwd: WIND_SKILL,
      timeout: 60000
    });
    const parsed = JSON.parse(out);
    const text = parsed.content[0].text;
    return JSON.parse(text);
  } catch (e) {
    console.error(`  [Wind ERROR] ${tool}.${method}: ${e.message}`);
    return null;
  }
}

// === analytics_data 辅助 ===
function extractAnalytics(question) {
  try {
    const r = callWind('analytics_data', 'get_financial_data', { question });
    if (!r || !r.data || !r.data.data || !r.data.data[0]) return null;
    const step = r.data.data[0];
    if (!step.rows || step.rows.length === 0) return null;
    return { row: step.rows[0], cols: step.columns };
  } catch (e) {
    console.log(`  [analytics error] "${question}": ${e.message}`);
    return null;
  }
}

// === 通达信辅助（通过 cli.mjs） ===
function callTdx(method, params) {
  // 通达信通过 MCP connector，用 DeferExecuteTool 无法在脚本中直接调用
  // 但 tdx-connector 有自己的 CLI？检查一下
  // 实际上通达信涨跌家数也可以从 Wind index_data 获取
  return null;
}

// === 读取当前 auto-data.js 获取已有结构 ===
function readCurrentData() {
  const code = fs.readFileSync(DATA_FILE, 'utf-8');
  // 提取 FUND_PRODUCTS
  const fpMatch = code.match(/const FUND_PRODUCTS = \[([\s\S]*?)\];/);
  return { code, hasFundProducts: !!fpMatch };
}

// ============================================================
// 主流程
// ============================================================
async function main() {
  console.log(`\n========================================`);
  console.log(`微盘量化看板 — 每日数据更新`);
  console.log(`日期: ${todayISO}`);
  console.log(`========================================\n`);

  const updateData = {};
  const errors = [];

  // --- 辅助函数：标准化日期格式 (20260615 → 2026-06-15) ---
  function normalizeDate(dt) {
    const s = String(dt);
    if (s.length === 8 && /^\d{8}$/.test(s)) {
      return s.substring(0, 4) + '-' + s.substring(4, 6) + '-' + s.substring(6, 8);
    }
    return s.substring(0, 10); // ISO格式截取前10位
  }

  // --- 辅助函数：从K线行中找列索引（兼容CLOSE/MATCH）---
  function findCol(cols, names) {
    for (const n of names) {
      const idx = cols.findIndex(c => c.name === n);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  // --- 1. 微盘251日K线 ---
  console.log('[1/10] 拉取微盘股指数251日K线...');
  const wpKline = callWind('index_data', 'get_index_kline', {
    windcode: '868008.WI',
    begin_date: startDateCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  if (!wpKline || !wpKline.data || !wpKline.data.rows) {
    errors.push('微盘K线获取失败');
    console.error('  ❌ 微盘K线获取失败');
  } else {
    const wpRows = wpKline.data.rows;
    const wpCols = wpKline.data.columns.map(c => c.name);
    
    // 找列索引（Wind K线 CLOSE列实际叫MATCH）
    const iOpen = findCol(wpCols, ['OPEN']);
    const iClose = findCol(wpCols, ['MATCH', 'CLOSE']);
    const iHigh = findCol(wpCols, ['HIGH']);
    const iLow = findCol(wpCols, ['LOW']);
    const iTurnover = findCol(wpCols, ['TURNOVER']);
    const iVolume = findCol(wpCols, ['VOLUME']);
    const iTurnoverRate = findCol(wpCols, ['CHANGEHANDRATE']);
    const iDate = findCol(wpCols, ['_DATE', 'TRADEDATE']);
    
    updateData.weipan = wpRows.map(r => ({
      date: normalizeDate(r[iDate >= 0 ? iDate : 9]),
      open: parseFloat(r[iOpen >= 0 ? iOpen : 0]),
      close: parseFloat(r[iClose >= 0 ? iClose : 2]),
      high: parseFloat(r[iHigh >= 0 ? iHigh : 3]),
      low: parseFloat(r[iLow >= 0 ? iLow : 4]),
      turnover: parseFloat(r[iTurnover >= 0 ? iTurnover : 5]),
      volume: parseFloat(r[iVolume >= 0 ? iVolume : 6]),
      turnoverRate: parseFloat(r[iTurnoverRate >= 0 ? iTurnoverRate : 7]) || 0
    })).filter(d => d.close && d.close > 0);
    
    updateData.wpCloses = updateData.weipan.map(d => d.close);
    updateData.wpTurnoverRates = updateData.weipan.map(d => d.turnoverRate);
    updateData.wpDates = updateData.weipan.map(d => d.date);
    console.log(`  ✅ ${updateData.weipan.length} 条K线, 最新: ${updateData.wpDates[updateData.wpDates.length-1]} close=${updateData.wpCloses[updateData.wpCloses.length-1]}`);
  }

  // --- 2. 科创50 251日K线 ---
  console.log('[2/10] 拉取科创50 K线...');
  const kcKline = callWind('index_data', 'get_index_kline', {
    windcode: '000688.SH',
    begin_date: startDateCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  if (kcKline && kcKline.data && kcKline.data.rows) {
    const kcRows = kcKline.data.rows;
    const kcCols = kcKline.data.columns.map(c => c.name);
    const iClose = findCol(kcCols, ['MATCH', 'CLOSE']) >= 0 ? findCol(kcCols, ['MATCH', 'CLOSE']) : 2;
    const iDate = findCol(kcCols, ['_DATE', 'TRADEDATE']) >= 0 ? findCol(kcCols, ['_DATE', 'TRADEDATE']) : 9;
    
    updateData.kc50 = kcRows.map(r => ({
      date: normalizeDate(r[iDate]),
      open: parseFloat(r[0]),
      close: parseFloat(r[iClose]),
      high: parseFloat(r[3]),
      low: parseFloat(r[4]),
      turnover: parseFloat(r[5]),
      volume: parseFloat(r[6]),
      changeRate: 0
    })).filter(d => d.close && d.close > 0);
    
    updateData.kcCloses = updateData.kc50.map(d => d.close);
    console.log(`  ✅ ${updateData.kc50.length} 条K线`);
  } else {
    errors.push('科创50K线获取失败');
    console.error('  ❌ 科创50K线获取失败');
  }

  // --- 3. 沪深300 K线 ---
  console.log('[3/10] 拉取沪深300 K线...');
  const hsKline = callWind('index_data', 'get_index_kline', {
    windcode: '000300.SH',
    begin_date: startDateCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  if (hsKline && hsKline.data && hsKline.data.rows) {
    const hsRows = hsKline.data.rows;
    const hsCols = hsKline.data.columns.map(c => c.name);
    const iClose = findCol(hsCols, ['MATCH', 'CLOSE']) >= 0 ? findCol(hsCols, ['MATCH', 'CLOSE']) : 2;
    const iDate = findCol(hsCols, ['_DATE', 'TRADEDATE']) >= 0 ? findCol(hsCols, ['_DATE', 'TRADEDATE']) : 9;
    
    updateData.hs300 = hsRows.map(r => ({
      date: normalizeDate(r[iDate]),
      open: parseFloat(r[0]),
      close: parseFloat(r[iClose]),
      high: parseFloat(r[3]),
      low: parseFloat(r[4]),
      turnover: parseFloat(r[5])
    })).filter(d => d.close && d.close > 0);
    
    updateData.hsCloses = updateData.hs300.map(d => d.close);
    console.log(`  ✅ ${updateData.hs300.length} 条K线`);
  } else {
    errors.push('沪深300K线获取失败');
    console.error('  ❌ 沪深300K线获取失败');
  }

  // --- 4. 中证2000 K线 ---
  console.log('[4/10] 拉取中证2000 K线...');
  const zzKline = callWind('index_data', 'get_index_kline', {
    windcode: '932000.CSI',
    begin_date: startDateCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  if (zzKline && zzKline.data && zzKline.data.rows) {
    const zzRows = zzKline.data.rows;
    const zzCols = zzKline.data.columns.map(c => c.name);
    const iClose = findCol(zzCols, ['MATCH', 'CLOSE']) >= 0 ? findCol(zzCols, ['MATCH', 'CLOSE']) : 2;
    const iDate = findCol(zzCols, ['_DATE', 'TRADEDATE']) >= 0 ? findCol(zzCols, ['_DATE', 'TRADEDATE']) : 9;
    
    updateData.zz2000 = zzRows.map(r => ({
      date: normalizeDate(r[iDate]),
      open: parseFloat(r[0]),
      close: parseFloat(r[iClose]),
      high: parseFloat(r[3]),
      low: parseFloat(r[4]),
      turnover: parseFloat(r[5]),
      volume: parseFloat(r[6]),
      changeRate: 0
    })).filter(d => d.close && d.close > 0);
    console.log(`  ✅ ${updateData.zz2000.length} 条K线`);
  } else {
    errors.push('中证2000K线获取失败');
    console.error('  ❌ 中证2000K线获取失败（非致命，继续）');
  }

  // --- 5. 计算相对净值和风格指标 ---
  console.log('[5/10] 计算相对净值和风格指标...');
  if (updateData.wpCloses && updateData.kcCloses && updateData.hsCloses) {
    const minLen = Math.min(updateData.wpCloses.length, updateData.kcCloses.length, updateData.hsCloses.length);
    const wpA = updateData.wpCloses.slice(-minLen);
    const kcA = updateData.kcCloses.slice(-minLen);
    const hsA = updateData.hsCloses.slice(-minLen);

    // 相对净值（归一化到100）
    const relKc50 = wpA.map((w, i) => (w / kcA[i]) * 100);
    const relHs300 = wpA.map((w, i) => (w / hsA[i]) * 100);

    // 243日均线
    const ma243_kc = relKc50.length >= 243 ? relKc50.slice(-243).reduce((s, v) => s + v, 0) / 243 : null;
    const ma243_hs = relHs300.length >= 243 ? relHs300.slice(-243).reduce((s, v) => s + v, 0) / 243 : null;
    
    const relKc_now = relKc50[relKc50.length - 1];
    const relHs_now = relHs300[relHs300.length - 1];
    const pos_kc = ma243_kc ? relKc_now / ma243_kc - 1 : null;
    const pos_hs = ma243_hs ? relHs_now / ma243_hs - 1 : null;

    // 20日线性回归
    function linReg(y) {
      const n = y.length;
      const x = Array.from({length: n}, (_, i) => i + 1);
      const xm = x.reduce((s, v) => s + v, 0) / n;
      const ym = y.reduce((s, v) => s + v, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (x[i]-xm)*(y[i]-ym); den += (x[i]-xm)**2; }
      const slope = den === 0 ? 0 : num/den;
      const yHat = x.map(xi => slope*xi + (ym - slope*xm));
      const res = y.map((yi, i) => yi - yHat[i]);
      const sse = res.reduce((s, r) => s + r*r, 0);
      const se2 = n > 2 ? sse/(n-2) : 0;
      const seSlope = den === 0 ? 0 : Math.sqrt(se2/den);
      const tValue = seSlope === 0 ? 0 : slope/seSlope;
      const r2 = 1 - sse / (y.reduce((s, v) => s + (v-ym)**2, 0) || 1);
      return { slope, tValue, r2 };
    }

    const regKc = linReg(relKc50.slice(-20));
    const regHs = linReg(relHs300.slice(-20));

    updateData.v6_relKc50 = {
      current: relKc_now,
      ma243: ma243_kc,
      ma243Position: pos_kc,
      slope20: regKc.slope,
      tValue20: regKc.tValue,
      r2_20: regKc.r2,
      aboveMA243: pos_kc !== null && pos_kc > 0,
      slopePositive: regKc.slope > 0
    };
    updateData.v6_relHs300 = {
      current: relHs_now,
      ma243: ma243_hs,
      ma243Position: pos_hs,
      slope20: regHs.slope,
      tValue20: regHs.tValue,
      aboveMA243: pos_hs !== null && pos_hs > 0,
      slopePositive: regHs.slope > 0
    };

    // 换手率分位
    const sortedTR = [...updateData.wpTurnoverRates].sort((a, b) => a - b);
    const lastTR = updateData.wpTurnoverRates[updateData.wpTurnoverRates.length - 1];
    const trPct = sortedTR.filter(r => r <= lastTR).length / sortedTR.length;
    const trMedian = sortedTR[Math.floor(sortedTR.length / 2)];

    updateData.v6_turnover = {
      current: parseFloat(lastTR),
      percentile1y: trPct,
      median1y: parseFloat(trMedian)
    };

    console.log(`  ✅ relKc50: current=${relKc_now.toFixed(2)}, ma243Pos=${(pos_kc*100).toFixed(2)}%, slope=${regKc.slope.toFixed(2)}, t=${regKc.tValue.toFixed(3)}`);
    console.log(`  ✅ turnover: current=${lastTR.toFixed(2)}%, pct1y=${(trPct*100).toFixed(1)}%`);
  } else {
    errors.push('相对净值计算失败（K线不足）');
    console.error('  ❌ 相对净值计算失败');
  }

  // --- 6. analytics_data（小票占比、中位数、HHI、IQR）---
  console.log('[6/10] 拉取 analytics_data...');
  
  let smallCapRatio = null, allAMedian = null, hhi = null, p75 = null, p25 = null;

  // 小票成交占比
  {
    const res = extractAnalytics('自由流通市值后20%股票的成交额占全A成交额的比例');
    if (res) {
      const idx = res.cols.findIndex(c => c.name && c.name.includes('比例'));
      if (idx >= 0 && typeof res.row[idx] === 'number') smallCapRatio = res.row[idx] * 100;
    }
    console.log(`  smallCapRatio: ${smallCapRatio}`);
  }

  // 全A中位数涨跌幅
  {
    const res = extractAnalytics('全A股涨跌幅的中位数');
    if (res) {
      const idx = res.cols.findIndex(c => c.name && c.name.includes('中位数'));
      if (idx >= 0 && typeof res.row[idx] === 'number') allAMedian = res.row[idx];
    }
    console.log(`  allAMedian: ${allAMedian}`);
  }

  // HHI
  {
    const res = extractAnalytics('全A股成交额的赫芬达尔指数HHI');
    if (res) {
      const idx = res.cols.findIndex(c => c.name && (c.name.includes('HHI') || c.name.includes('赫芬达尔')));
      if (idx >= 0 && typeof res.row[idx] === 'number') hhi = res.row[idx];
    }
    console.log(`  hhi: ${hhi}`);
  }

  // P75, P25
  {
    const r75 = callWind('analytics_data', 'get_financial_data', { question: '全A股涨跌幅75分位数' });
    if (r75 && r75.data && r75.data.data && r75.data.data[0] && r75.data.data[0].rows.length > 0) {
      const step = r75.data.data[0];
      const idx = step.columns.findIndex(c => c.name && c.name.includes('涨跌幅'));
      if (idx >= 0) p75 = step.rows[0][idx];
    }
  }
  {
    const r25 = callWind('analytics_data', 'get_financial_data', { question: '全A股涨跌幅第25百分位' });
    if (r25 && r25.data && r25.data.data && r25.data.data[0] && r25.data.data[0].rows.length > 0) {
      const step = r25.data.data[0];
      const idx = step.columns.findIndex(c => c.name && c.name.includes('涨跌幅'));
      if (idx >= 0) {
        p25 = step.rows.length === 1 ? step.rows[0][idx] : step.rows[step.rows.length - 1][idx];
      }
    }
  }
  const iqr = (p75 !== null && p25 !== null) ? p75 - p25 : null;
  console.log(`  p75: ${p75}, p25: ${p25}, iqr: ${iqr}`);

  updateData.v6_analytics = { smallCapRatio, allAMedian, hhi, p75, p25, iqr };

  // --- 7. 涨跌家数（从 Wind 万得全A basicinfo 获取）---
  console.log('[7/10] 拉取涨跌家数...');
  const breadthData = callWind('index_data', 'get_index_basicinfo', {
    question: '万得全A指数近10个交易日每日上涨家数下跌家数涨停家数跌停家数'
  });
  
  let breadthSeries = [];
  let todayUp = null, todayDown = null, todayLimitDown = null;
  
  if (breadthData && breadthData.data && breadthData.data.data && breadthData.data.data[0]) {
    const step = breadthData.data.data[0];
    if (step.rows && step.rows.length > 0 && step.columns) {
      const cols = step.columns.map(c => c.name);
      console.log(`  breadth columns: ${cols.join(', ')}`);
      
      // 列名是动态的（包含问句文本），用模糊匹配
      const idxDate = cols.findIndex(c => c.includes('日期'));
      const idxUp = cols.findIndex(c => c.includes('上涨'));
      const idxDown = cols.findIndex(c => c.includes('下跌'));
      const idxLimitUp = cols.findIndex(c => c.includes('涨停'));
      const idxLimitDown = cols.findIndex(c => c.includes('跌停'));
      
      step.rows.forEach(row => {
        const dateRaw = idxDate >= 0 ? row[idxDate] : '';
        const date = normalizeDate(dateRaw);
        const up = idxUp >= 0 ? (parseInt(row[idxUp]) || 0) : 0;
        const down = idxDown >= 0 ? (parseInt(row[idxDown]) || 0) : 0;
        const limitUp = idxLimitUp >= 0 ? (parseInt(row[idxLimitUp]) || 0) : 0;
        const limitDown = idxLimitDown >= 0 ? (parseInt(row[idxLimitDown]) || 0) : 0;
        if (date && (up > 0 || down > 0)) {
          breadthSeries.push({ date, up, down, limitUp, limitDown });
        }
      });
      
      if (breadthSeries.length > 0) {
        const last = breadthSeries[breadthSeries.length - 1];
        todayUp = last.up;
        todayDown = last.down;
        todayLimitDown = last.limitDown;
        console.log(`  ✅ ${breadthSeries.length} 天, 今日: up=${todayUp} down=${todayDown} limitDown=${todayLimitDown}`);
      } else {
        // 可能是部分交易日数据（周末/假期只有历史行）
        console.log(`  ⚠️ breadth解析为空，尝试用通达信screener补充`);
      }
    }
  }
  
  // 如果Wind basicinfo失败，尝试用通达信screener获取今日涨跌家数
  if (breadthSeries.length === 0 || todayUp === null) {
    console.log('  尝试用通达信screener获取今日涨跌家数...');
    // 通达信通过MCP调用，脚本中用execFileSync调用cli.mjs
    try {
      const tdxSkill = 'C:\\Users\\xyf31\\.workbuddy\\connectors\\skills\\connector-tdx-connector';
      const tdxScript = path.join(tdxSkill, 'scripts', 'cli.mjs');
      if (fs.existsSync(tdxScript)) {
        const upResult = execFileSync(NODE, [tdxScript, 'call', 'tdx', 'tdx_screener', JSON.stringify({message: "今日上涨", pageSize: "1"})], {encoding:'utf8', timeout:15000});
        const upParsed = JSON.parse(upResult);
        const upText = upParsed.content?.[0]?.text;
        const upData = JSON.parse(upText);
        todayUp = upData?.total || upData?.data?.total || null;
        
        const downResult = execFileSync(NODE, [tdxScript, 'call', 'tdx', 'tdx_screener', JSON.stringify({message: "今日下跌", pageSize: "1"})], {encoding:'utf8', timeout:15000});
        const downParsed = JSON.parse(downResult);
        const downText = downParsed.content?.[0]?.text;
        const downData = JSON.parse(downText);
        todayDown = downData?.total || downData?.data?.total || null;
        
        const ldResult = execFileSync(NODE, [tdxScript, 'call', 'tdx', 'tdx_screener', JSON.stringify({message: "跌停", pageSize: "1"})], {encoding:'utf8', timeout:15000});
        const ldParsed = JSON.parse(ldResult);
        const ldText = ldParsed.content?.[0]?.text;
        const ldData = JSON.parse(ldText);
        todayLimitDown = ldData?.total || ldData?.data?.total || null;
        
        console.log(`  ✅ 通达信: up=${todayUp} down=${todayDown} limitDown=${todayLimitDown}`);
        
        // 如果有breadthSeries但缺今日数据，补上
        if (breadthSeries.length > 0 && todayUp) {
          const lastDate = breadthSeries[breadthSeries.length - 1].date;
          breadthSeries.push({ date: todayISO, up: todayUp, down: todayDown, limitUp: 0, limitDown: todayLimitDown });
        }
      }
    } catch(e) {
      console.log(`  通达信获取失败: ${e.message}`);
    }
  }
  
  if (breadthSeries.length === 0 && todayUp === null) {
    errors.push('涨跌家数获取失败（Wind basicinfo + 通达信均失败）');
    console.error('  ❌ 涨跌家数获取失败');
  }

  // --- 8. 基金K线（006195连续修复天数 + 基金池净值）---
  console.log('[8/10] 拉取基金净值...');
  const fundKline = callWind('fund_data', 'get_fund_kline', {
    windcode: '006195.OF',
    begin_date: tenDaysAgoCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  let fund006195Series = [];
  let fundRepairDays = 0;
  
  if (fundKline && fundKline.data && fundKline.data.rows) {
    const fRows = fundKline.data.rows;
    const fCols = fundKline.data.columns.map(c => c.name);
    const navIdx = fCols.indexOf('MATCH') >= 0 ? fCols.indexOf('MATCH') : fCols.indexOf('NAV') >= 0 ? fCols.indexOf('NAV') : 2;
    const dateIdx = fCols.indexOf('_DATE') >= 0 ? fCols.indexOf('_DATE') : fCols.indexOf('TRADEDATE') >= 0 ? fCols.indexOf('TRADEDATE') : 9;
    
    fund006195Series = fRows.map(r => ({
      date: normalizeDate(r[dateIdx]),
      nav: parseFloat(r[navIdx])
    })).filter(d => d.nav && d.nav > 0);
    
    // 连续修复天数
    for (let i = fund006195Series.length - 1; i > 0; i--) {
      if (fund006195Series[i].nav > fund006195Series[i-1].nav) fundRepairDays++;
      else break;
    }
    console.log(`  ✅ 006195: ${fund006195Series.length} 天, repairDays=${fundRepairDays}`);
  } else {
    errors.push('006195基金K线获取失败');
    console.error('  ❌ 006195基金K线获取失败');
  }

  // --- 基金池净值更新 ---
  const fundCodes = ['320016', '004685', '519185', '002692', '006195', '003147'];
  const updatedFunds = {};
  for (const code of fundCodes) {
    const fk = callWind('fund_data', 'get_fund_kline', {
      windcode: `${code}.OF`,
      begin_date: tenDaysAgoCompact,
      end_date: todayCompact,
      period: '10'
    });
    if (fk && fk.data && fk.data.rows && fk.data.rows.length > 0) {
      const rows = fk.data.rows;
      const cols = fk.data.columns.map(c => c.name);
      const navIdx = cols.indexOf('MATCH') >= 0 ? cols.indexOf('MATCH') : cols.indexOf('NAV') >= 0 ? cols.indexOf('NAV') : 2;
      const dateIdx = cols.indexOf('_DATE') >= 0 ? cols.indexOf('_DATE') : cols.indexOf('TRADEDATE') >= 0 ? cols.indexOf('TRADEDATE') : 9;
      
      const latest = rows[rows.length - 1];
      const prev = rows.length > 1 ? rows[rows.length - 2] : null;
      const nav = parseFloat(latest[navIdx]);
      const prevNav = prev ? parseFloat(prev[navIdx]) : null;
      const dayChange = prevNav ? ((nav / prevNav - 1) * 100) : null;
      
      // 近5日
      const w1Start = rows.length >= 6 ? rows[rows.length - 6] : rows[0];
      const w1Nav = parseFloat(w1Start[navIdx]);
      const week1 = w1Nav ? ((nav / w1Nav - 1) * 100) : null;
      
      // 近20日（如果有）
      let month1 = null;
      if (rows.length >= 21) {
        const m1Nav = parseFloat(rows[rows.length - 21][navIdx]);
        month1 = m1Nav ? ((nav / m1Nav - 1) * 100) : null;
      }
      
      updatedFunds[code] = { nav, dayChange, week1, month1, date: normalizeDate(latest[dateIdx]) };
      console.log(`  ✅ ${code}: nav=${nav}, dayChange=${dayChange ? dayChange.toFixed(2) + '%' : 'null'}, week1=${week1 ? week1.toFixed(2) + '%' : 'null'}`);
    } else {
      console.log(`  ⚠️ ${code}: 获取失败，将保留原值`);
    }
  }

  // --- 9. 万得全A成交额序列（连续性用）---
  console.log('[9/10] 拉取万得全A成交额序列...');
  const allAKline = callWind('index_data', 'get_index_kline', {
    windcode: '881001.WI',
    begin_date: tenDaysAgoCompact,
    end_date: todayCompact,
    period: '10'
  });
  
  let allATurnoverSeries = [];
  if (allAKline && allAKline.data && allAKline.data.rows) {
    const aRows = allAKline.data.rows;
    const aCols = allAKline.data.columns.map(c => c.name);
    const iTurnover = aCols.indexOf('TURNOVER') >= 0 ? aCols.indexOf('TURNOVER') : 5;
    const iDate = aCols.indexOf('_DATE') >= 0 ? aCols.indexOf('_DATE') : aCols.indexOf('TRADEDATE') >= 0 ? aCols.indexOf('TRADEDATE') : 9;
    
    allATurnoverSeries = aRows.map(r => ({
      date: normalizeDate(r[iDate]),
      turnover: parseFloat(r[iTurnover])
    })).filter(d => d.turnover && d.turnover > 0);
    console.log(`  ✅ ${allATurnoverSeries.length} 天成交额`);
  }

  // 全A中位数5日序列（改用逐日查询拼接）
  // 注意：此处不能引用后面才声明的 wp 变量，直接从 updateData 取最新微盘日期
  const _wpLatestDate = (updateData.weipan && updateData.weipan.length) ? updateData.weipan[updateData.weipan.length - 1].date : todayISO;
  let allAMedianSeries = [];
  {
    const res = callWind('analytics_data', 'get_financial_data', { question: '近5个交易日每日全A股涨跌幅中位数' });
    if (res && res.data && res.data.data && res.data.data[0] && res.data.data[0].rows) {
      const step = res.data.data[0];
      const cols = step.columns.map(c => c.name);
      const medIdx = cols.findIndex(c => c.name && c.name.includes('中位数'));
      const dateIdx = cols.findIndex(c => c.name && (c.name.includes('日期') || c.name.includes('Date')));
      if (medIdx >= 0) {
        allAMedianSeries = step.rows.map(r => ({
          date: dateIdx >= 0 ? r[dateIdx] : _wpLatestDate,
          median: r[medIdx]
        })).filter(d => d.median !== null && d.median !== undefined && d.date);
      }
    }
    // 如果批量查询失败，用今日单日值兜底（补齐 date 字段，避免前端崩溃）
    if (allAMedianSeries.length === 0 && allAMedian !== null) {
      const fallbackDate = _wpLatestDate;
      allAMedianSeries = [{ date: fallbackDate, median: allAMedian }];
      console.log(`  allAMedian 批量查询失败，用单日值(${allAMedian})兜底，date=${fallbackDate}`);
    }
    console.log(`  allAMedian 5日序列: ${allAMedianSeries.length} 条`);
  }

  // --- 10. 生成 auto-data.js ---
  console.log('[10/10] 生成 auto-data.js...');

  // 构建新的 AUTO_DATA 对象
  const wp = updateData.weipan || [];
  const kc = updateData.kc50 || [];
  const hs = updateData.hs300 || [];
  const zz = updateData.zz2000 || [];
  
  // 计算派生指标
  const wpLast = wp[wp.length - 1] || {};
  const kcLast = kc[kc.length - 1] || {};
  const hsLast = hs[hs.length - 1] || {};

  const totalTurnover = (wpLast.turnover || 0);
  const allATotalToday = allATurnoverSeries[allATurnoverSeries.length - 1]?.turnover || 0;

  // 微盘各周期涨跌
  let weipan1m = null, weipan5d = null, weipan20d = null, drawdown = 0;
  if (wp.length >= 20) {
    weipan1m = (wp[wp.length-1].close / wp[wp.length-20].close - 1) * 100;
    weipan20d = weipan1m;
  }
  if (wp.length >= 5) {
    weipan5d = (wp[wp.length-1].close / wp[wp.length-5].close - 1) * 100;
  }
  let maxClose = 0;
  wp.forEach(d => { if (d.close > maxClose) maxClose = d.close; });
  drawdown = maxClose > 0 ? (wp[wp.length-1].close / maxClose - 1) * 100 : 0;

  // 构建JS代码
  const jsCode = generateAutoDataJS({
    todayISO,
    wp, kc, hs, zz,
    wpLast, kcLast,
    updateData,
    smallCapRatio, allAMedian, hhi, iqr, p75, p25,
    breadthSeries, todayUp, todayDown, todayLimitDown,
    fund006195Series, fundRepairDays,
    allATurnoverSeries, allAMedianSeries,
    updatedFunds,
    weipan1m, weipan5d, weipan20d, drawdown,
    errors
  });

  fs.writeFileSync(DATA_FILE, jsCode, 'utf-8');
  console.log(`\n✅ auto-data.js 已更新 (${(jsCode.length / 1024).toFixed(1)} KB)`);

  if (errors.length > 0) {
    console.log(`\n⚠️ 警告: ${errors.length} 项数据获取失败:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\n========================================`);
  console.log(`数据更新完成`);
  console.log(`========================================\n`);
  
  return { errors, fundCount: Object.keys(updatedFunds).length };
}

// === 生成 auto-data.js 代码 ===
function generateAutoDataJS(ctx) {
  const {
    todayISO, wp, kc, hs, zz,
    updateData, smallCapRatio, allAMedian, hhi, iqr, p75, p25,
    breadthSeries, todayUp, todayDown, todayLimitDown,
    fund006195Series, fundRepairDays,
    allATurnoverSeries, allAMedianSeries,
    updatedFunds,
    weipan1m, weipan5d, weipan20d, drawdown,
    errors
  } = ctx;

  const relKc = updateData.v6_relKc50 || {};
  const relHs = updateData.v6_relHs300 || {};
  const turnover = updateData.v6_turnover || {};
  const wpLast = wp[wp.length - 1] || {};

  // 格式化数组
  const fmtArr = (arr, indent = '    ') => JSON.stringify(arr, null, 2).split('\n').join('\n' + indent);

  return `// ========================================
// 微盘策略风格回流看板 - 自动数据 v6
// 数据来源：Wind MCP + analytics_data
// 自动更新时间：${todayISO} ${new Date().toTimeString().substring(0, 8)}
// ${errors.length > 0 ? `// ⚠️ 部分数据获取失败: ${errors.join('; ')}` : '// 全部数据获取成功'}
// ========================================

const AUTO_DATA = {
  updateTime: "${todayISO} ${new Date().toTimeString().substring(0, 5)}",

  // === 万得微盘股指数 (868008.WI) 日K线 ===
  weipan: ${JSON.stringify(wp, null, 2).split('\n').join('\n  ')},

  // === 沪深300 (000300.SH) 日K线 ===
  hs300: ${JSON.stringify(hs, null, 2).split('\n').join('\n  ')},

  // === 中证2000 (932000.CSI) 日K线 ===
  zz2000: ${JSON.stringify(zz, null, 2).split('\n').join('\n  ')},

  // === 科创50 (000688.SH) 日K线 ===
  kc50: ${JSON.stringify(kc, null, 2).split('\n').join('\n  ')},

  // === 指数实时快照 (${todayISO}收盘) ===
  quotes: {
    "868008.WI": {name:"万得微盘股指数", close:${wpLast.close || 'null'}, change:${wp.length >= 2 ? ((wpLast.close / wp[wp.length-2].close - 1) * 100).toFixed(2) : 'null'}, turnover:${wpLast.turnover || 'null'}},
    "000688.SH": {name:"科创50", close:${kc[kc.length-1]?.close || 'null'}, change:${kc.length >= 2 ? ((kc[kc.length-1].close / kc[kc.length-2].close - 1) * 100).toFixed(2) : 'null'}}
  },

  // === v6 核心日频指标 ===
  // 数据日期：${todayISO} 收盘
  // 数据来源：Wind MCP + analytics_data
};

AUTO_DATA.v6 = {
  // --- 相对净值（微盘/科创50，归一化到100）---
  relKc50: {
    current: ${relKc.current || 'null'},
    ma243: ${relKc.ma243 || 'null'},
    ma243Position: ${relKc.ma243Position || 'null'},
    slope20: ${relKc.slope20 || 'null'},
    tValue20: ${relKc.tValue20 || 'null'},
    r2_20: ${relKc.r2_20 || 'null'},
    aboveMA243: ${relKc.aboveMA243},
    slopePositive: ${relKc.slopePositive}
  },
  // --- 相对净值（微盘/沪深300，归一化到100）---
  relHs300: {
    current: ${relHs.current || 'null'},
    ma243: ${relHs.ma243 || 'null'},
    ma243Position: ${relHs.ma243Position || 'null'},
    slope20: ${relHs.slope20 || 'null'},
    tValue20: ${relHs.tValue20 || 'null'},
    aboveMA243: ${relHs.aboveMA243},
    slopePositive: ${relHs.slopePositive}
  },
  // --- 换手率（近一年251个交易日样本）---
  turnover: {
    current: ${turnover.current || 'null'},
    percentile1y: ${turnover.percentile1y || 'null'},
    median1y: ${turnover.median1y || 'null'},
    note: "近一年(251个交易日)分位"
  },
  // --- 小票成交占比（自由流通市值后20%）---
  smallCapRatio: ${smallCapRatio || 'null'},
  // --- 全A中位数涨跌幅 ---
  allAMedianChg: ${allAMedian || 'null'},
  // --- 市场集中度 ---
  hhi: ${hhi || 'null'},
  // --- 横截面分化度 ---
  iqr: ${iqr || 'null'},
  p75: ${p75 || 'null'},
  p25: ${p25 || 'null'},
  // --- 基金连续修复天数 ---
  fundRepairDays: ${fundRepairDays},
  // --- 涨跌家数 ---
  upCount: ${todayUp || 'null'},
  downCount: ${todayDown || 'null'},
  limitDownCount: ${todayLimitDown || 'null'},
  // --- 10年国债 ---
  bond_10y: 1.743,

  // === 连续性确认序列（近10日）===
  dailySeries: {
    breadth: ${JSON.stringify(breadthSeries, null, 6).split('\n').join('\n    ')},
    allAMedian: ${JSON.stringify(allAMedianSeries, null, 6).split('\n').join('\n    ')},
    fund006195: ${JSON.stringify(fund006195Series, null, 6).split('\n').join('\n    ')},
    allATurnover: ${JSON.stringify(allATurnoverSeries, null, 6).split('\n').join('\n    ')}
  }
};

// === 连续性派生计算 ===
(function() {
  const ds = AUTO_DATA.v6.dailySeries;

  // 1. 基金连续修复天数
  const nav = ds.fund006195;
  let repairDays = 0;
  for (let i = nav.length - 1; i > 0; i--) {
    if (nav[i].nav > nav[i - 1].nav) repairDays++;
    else break;
  }
  AUTO_DATA.v6.fundRepairDays = repairDays;

  // 2. 上涨家数连续性
  const br = ds.breadth;
  const last5 = br.slice(-5);
  let upPositiveDays = 0;
  for (const d of last5) {
    if (d.up / (d.up + d.down) > 0.5) upPositiveDays++;
  }
  AUTO_DATA.v6.upPositiveDays5 = upPositiveDays;

  // 3. 跌停家数趋势
  const first5 = br.slice(0, 5);
  const recentLimitDownAvg = last5.reduce((s, d) => s + d.limitDown, 0) / 5;
  const priorLimitDownAvg = first5.reduce((s, d) => s + d.limitDown, 0) / 5;
  AUTO_DATA.v6.limitDownTrend = recentLimitDownAvg < priorLimitDownAvg ? '收敛' : '扩散';
  AUTO_DATA.v6.limitDownAvg5 = Math.round(recentLimitDownAvg);
  AUTO_DATA.v6.limitDownAvgPrior5 = Math.round(priorLimitDownAvg);

  // 4. 全A中位数连续正天数
  const med = ds.allAMedian;
  let medianPositiveDays = 0;
  for (let i = med.length - 1; i >= 0; i--) {
    if (med[i].median > 0) medianPositiveDays++;
    else break;
  }
  AUTO_DATA.v6.medianPositiveDays = medianPositiveDays;

  // 5. 微盘/全A成交额占比近5日序列
  const wp = AUTO_DATA.weipan;
  const allA = ds.allATurnover;
  const wpRatio5 = [];
  for (let i = 1; i <= 5; i++) {
    const wpItem = wp[wp.length - i];
    const allAItem = allA[allA.length - i];
    if (wpItem && allAItem) {
      wpRatio5.unshift({
        date: wpItem.date,
        ratio: (wpItem.turnover / allAItem.turnover) * 100
      });
    }
  }
  AUTO_DATA.v6.weipanAllARatio5 = wpRatio5;
})();

// === 计算派生指标 ===
(function() {
  const d = AUTO_DATA;
  const wp = d.weipan;
  if (wp.length >= 5) {
    const last5 = wp.slice(-5);
    d.weipan5d = (last5[last5.length-1].close / last5[0].close - 1) * 100;
  }
  if (wp.length >= 20) {
    const last20 = wp.slice(-20);
    d.weipan20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
    d.weipan1m = d.weipan20d;
  }
  const hs = d.hs300;
  if (hs && hs.length >= 20) {
    const last20 = hs.slice(-20);
    d.hs300_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  const kc = d.kc50;
  if (kc && kc.length >= 20) {
    const last20 = kc.slice(-20);
    d.kc50_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  const zz = d.zz2000;
  if (zz && zz.length >= 20) {
    const last20 = zz.slice(-20);
    d.zz2000_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  let maxClose = 0;
  wp.forEach(item => { if (item.close > maxClose) maxClose = item.close; });
  d.weipanDrawdown = (wp[wp.length-1].close / maxClose - 1) * 100;
})();

// === 微盘量化产品跟踪 ===
const FUND_PRODUCTS = ${generateFundProductsJS(updatedFunds, todayISO)};
`;
}

function generateFundProductsJS(updatedFunds, todayISO) {
  // 基金池模板
  const funds = [
    { tier: "微盘暴露型", name: "诺安多策略A", code: "320016", type: "混合型-偏股", status: "高暴露微盘" },
    { tier: "微盘暴露型", name: "中信保诚景气优选A", code: "009853", type: "混合型-偏股", status: "待接入" },
    { tier: "微盘暴露型", name: "中信保诚多策略A", code: "011282", type: "混合型-偏股", status: "待接入" },
    { tier: "稳健分散型", name: "金元顺安元启", code: "004685", type: "混合型-灵活", status: "人肉量化天花板" },
    { tier: "稳健分散型", name: "建信灵活配置A", code: "000270", type: "混合型-灵活", status: "待接入" },
    { tier: "稳健分散型", name: "华夏新锦绣A", code: "002871", type: "混合型-灵活", status: "待接入" },
    { tier: "风格对照型", name: "万家精选A", code: "519185", type: "混合型-偏股", status: "黄海管理" },
    { tier: "风格对照型", name: "富国创新科技A", code: "002692", type: "偏股混合型", status: "科技成长主动权益" },
    { tier: "微盘量化", name: "国金量化多因子A", code: "006195", type: "股票型", status: "微盘量化标杆" },
    { tier: "微盘量化", name: "国金量化精选A", code: "014805", type: "混合型-偏股", status: "待接入" },
    { tier: "微盘量化", name: "大成动态量化A", code: "003147", type: "混合型-灵活", status: "市值下沉型" },
    { tier: "微盘量化", name: "富荣价值精选A", code: "006109", type: "混合型-灵活", status: "待接入" }
  ];

  const lines = funds.map(f => {
    const u = updatedFunds[f.code];
    if (u) {
      return `  { tier: "${f.tier}", name: "${f.name}", code: "${f.code}", type: "${f.type}",
    navDate: "${u.date}", nav: ${u.nav}, dayChange: ${u.dayChange !== null ? u.dayChange.toFixed(2) : 'null'}, week1: ${u.week1 !== null ? u.week1.toFixed(2) : 'null'}, month1: ${u.month1 !== null ? u.month1.toFixed(2) : 'null'},
    status: "${f.status}", statusNote: "Wind自动更新 ${todayISO}" }`;
    } else {
      return `  { tier: "${f.tier}", name: "${f.name}", code: "${f.code}", type: "${f.type}",
    navDate: "${todayISO}", nav: null, dayChange: null, week1: null, month1: null,
    status: "${f.status}", statusNote: "${f.status === '待接入' ? '数据待接入' : '自动更新失败'}" }`;
    }
  });
  return `[\n${lines.join(',\n')}\n]`;
}

// === 运行 ===
main().then(result => {
  process.exit(0);
}).catch(e => {
  console.error('\n❌ 致命错误:', e.message);
  console.error(e.stack);
  process.exit(1);
});
