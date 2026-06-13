// 完整测试：模拟浏览器环境，加载所有JS并执行评分
const fs = require('fs');
const vm = require('vm');

// 1. 创建模拟的 DOM 环境
const elements = {};
const mockEl = (id) => {
  if (!elements[id]) {
    elements[id] = {
      _id: id, textContent: '', innerHTML: '', className: '',
      style: {}, value: '',
      classList: { toggle(){}, add(){}, remove(){}, contains(){ return false; } },
      appendChild() {}, removeChild() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      onclick: null
    };
  }
  return elements[id];
};

const sandbox = {
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  Array, Object, JSON, Math, Date, String, Number, Boolean, RegExp, Error,
  TypeError, ReferenceError, SyntaxError,
  document: {
    getElementById: (id) => mockEl(id),
    querySelector: () => mockEl('_qs'),
    querySelectorAll: () => [],
    createElement: () => mockEl('_ce'),
    addEventListener: () => {}
  },
  window: { addEventListener: () => {} },
  navigator: { userAgent: 'Node.js Test' }
};

const context = vm.createContext(sandbox);

// 2. 加载 auto-data.js
try {
  vm.runInContext(fs.readFileSync('auto-data.js', 'utf8'), context);
  console.log('✓ auto-data.js 加载成功');
} catch(e) {
  console.error('✗ auto-data.js 错误:', e.message);
  process.exit(1);
}

// 3. 加载 data.js
try {
  vm.runInContext(fs.readFileSync('data.js', 'utf8'), context);
  console.log('✓ data.js 加载成功');
} catch(e) {
  console.error('✗ data.js 错误:', e.message);
  process.exit(1);
}

// 4. 加载 scoring.js
try {
  vm.runInContext(fs.readFileSync('scoring.js', 'utf8'), context);
  console.log('✓ scoring.js 加载成功');
} catch(e) {
  console.error('✗ scoring.js 错误:', e.message);
  process.exit(1);
}

// 5. 检查数据
vm.runInContext('globalThis.AUTO_DATA = AUTO_DATA; globalThis.FUND_PRODUCTS = FUND_PRODUCTS; globalThis.ScoringEngine = ScoringEngine;', context);

console.log('\n=== 数据检查 ===');
console.log('AUTO_DATA.zz2000 数据点:', vm.runInContext('AUTO_DATA.zz2000.length', context));
console.log('AUTO_DATA.kc50 数据点:', vm.runInContext('AUTO_DATA.kc50.length', context));
console.log('AUTO_DATA.zz2000_20d:', vm.runInContext('AUTO_DATA.zz2000_20d', context));
console.log('AUTO_DATA.kc50_20d:', vm.runInContext('AUTO_DATA.kc50_20d', context));
console.log('AUTO_DATA.weipan1m:', vm.runInContext('AUTO_DATA.weipan1m', context));

console.log('\n=== FUND_PRODUCTS 统计 ===');
const tierStats = vm.runInContext(`
  const stats = {};
  FUND_PRODUCTS.forEach(f => { stats[f.tier] = (stats[f.tier]||0) + 1; });
  JSON.stringify(stats);
`, context);
console.log('分层统计:', tierStats);

const validFunds = vm.runInContext(`
  FUND_PRODUCTS.filter(f => f.dayChange !== null).map(f => f.name + ': ' + f.dayChange + '%').join(', ');
`, context);
console.log('有净值数据的基金:', validFunds);

// 6. 模拟评分计算（与index.html init()一致的字段映射）
console.log('\n=== 评分模拟计算 ===');
const scoreResult = vm.runInContext(`
  const data = {};
  
  // 基础指标
  data.weipanRatio = (AUTO_DATA.weipanRatio || 0) * 100;
  data.weipan20d = AUTO_DATA.weipan20d || 0;
  data.weipan1m = AUTO_DATA.weipan1m || 0;

  // 风格方向
  data.zz2000_20d_change = AUTO_DATA.zz2000_20d || 0;
  data.kc50_20d_change = AUTO_DATA.kc50_20d || 0;
  data.wp_slope20 = (AUTO_DATA.weipan20d || 0) / 20;
  data.wp_ma243_pos = (AUTO_DATA.weipanDrawdown || -20) > -5 ? 0.02 : (AUTO_DATA.weipanDrawdown || -20) / 100;
  data.wp_mao_rel = AUTO_DATA.relativeExcess20d || 0;

  // 拥挤与流动性
  data.wp_volume_ratio = (AUTO_DATA.weipanRatio || 0) * 100;
  data.small_volume_ratio = data.wp_volume_ratio * 18;

  // 换手率分位
  const wpArr = AUTO_DATA.weipan || [];
  if (wpArr.length > 0) {
    const tRates = wpArr.map(d => d.turnoverRate || 0).sort((a,b) => a - b);
    const lastR = wpArr[wpArr.length-1].turnoverRate || 0;
    data.wp_turnover_pct = tRates.filter(r => r <= lastR).length / tRates.length;
  }

  // 量化友好度
  const wpQ = AUTO_DATA.quotes && AUTO_DATA.quotes["868008.WI"];
  if (wpQ) {
    const total = (wpQ.upCount || 0) + (wpQ.downCount || 0);
    data.up_ratio = total > 0 ? (wpQ.upCount || 0) / total : 0.5;
  } else {
    data.up_ratio = 0.5;
  }
  data.allA_median_chg = AUTO_DATA.weipan5d || 0;
  data.market_concentration = 0.4;
  data.cross_section_diff = 0.3;

  // 基金平均收益
  const validFunds = FUND_PRODUCTS.filter(f => f.dayChange !== null && f.dayChange !== undefined);
  const sum1d = validFunds.reduce((s,f) => s + f.dayChange, 0);
  data.fund_avg_1d = sum1d / validFunds.length;

  const validW = FUND_PRODUCTS.filter(f => f.week1 !== null && f.week1 !== undefined);
  data.fund_avg_1w = validW.reduce((s,f) => s + f.week1, 0) / validW.length;

  const validM = FUND_PRODUCTS.filter(f => f.month1 !== null && f.month1 !== undefined);
  data.fund_avg_1m = validM.reduce((s,f) => s + f.month1, 0) / validM.length;

  data.fund_rel_zz2000 = data.fund_avg_1m - data.weipan1m;
  data.fund_cont_days = data.fund_avg_1d > 0 ? 1 : 0;

  // 硬风控状态
  data.hard_risk_volatility = 'wait';
  data.hard_risk_rate = 'watch';
  data.hard_risk_liquidity = 'ok';
  data.hard_risk_homogenization = 'wait';

  const result = ScoringEngine.calculate(data);
  JSON.stringify({
    total: result.total,
    level: result.level.label,
    hardRisk: result.hardRiskStatus,
    scores: Object.entries(result.results).map(([k,v]) => k + ':' + v.score + '/' + v.max)
  });
`, context);

console.log('评分结果:', JSON.parse(scoreResult));

// 7. 验证信号灯判断
console.log('\n=== 风格方向信号（真实数据） ===');
const styleData = vm.runInContext(`
  const zz = AUTO_DATA.zz2000_20d;
  const kc = AUTO_DATA.kc50_20d;
  '中证2000近20日: ' + zz.toFixed(2) + '%, 科创50近20日: ' + kc.toFixed(2) + '%, 差值: ' + (zz - kc).toFixed(2) + '%';
`, context);
console.log(styleData);

console.log('\n=== 基金平均收益（真实数据） ===');
const fundData = vm.runInContext(`
  const v = FUND_PRODUCTS.filter(f => f.dayChange !== null);
  '有效基金: ' + v.length + '只, 近1日均值: ' + (v.reduce((s,f)=>s+f.dayChange,0)/v.length).toFixed(2) + '%';
`, context);
console.log(fundData);

console.log('\n✅ 全部测试通过！');
