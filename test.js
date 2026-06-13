// 测试脚本：验证评分引擎和数据分析
const fs = require('fs');

// 模拟浏览器环境
global.window = {};

// 加载auto-data.js
eval(fs.readFileSync('auto-data.js', 'utf8'));

// 加载scoring.js
eval(fs.readFileSync('scoring.js', 'utf8'));

// 检查全局变量
console.log('=== 全局变量检查 ===');
console.log('AUTO_DATA:', typeof AUTO_DATA);
console.log('FUND_PRODUCTS:', typeof FUND_PRODUCTS);
console.log('ScoringEngine:', typeof ScoringEngine);

// 检查AUTO_DATA中的关键字段
if (typeof AUTO_DATA !== 'undefined') {
  console.log('\n=== AUTO_DATA 关键字段 ===');
  console.log('weipanRatio:', AUTO_DATA.weipanRatio);
  console.log('weipan20d:', AUTO_DATA.weipan20d);
  console.log('weipan1m:', AUTO_DATA.weipan1m);
  console.log('up_ratio:', AUTO_DATA.up_ratio);
  console.log('fund_avg_1d:', AUTO_DATA.fund_avg_1d);
  console.log('fund_avg_1w:', AUTO_DATA.fund_avg_1w);
  console.log('fund_avg_1m:', AUTO_DATA.fund_avg_1m);
  console.log('fund_cont_days:', AUTO_DATA.fund_cont_days);
}

// 测试评分引擎
if (typeof ScoringEngine !== 'undefined') {
  console.log('\n=== 评分引擎测试 ===');
  
  // 准备测试数据
  const testData = {
    weipanRatio: AUTO_DATA.weipanRatio || 0,
    up_ratio: AUTO_DATA.up_ratio || 0.55,
    fund_avg_1d: AUTO_DATA.fund_avg_1d || 0,
    fund_avg_1w: AUTO_DATA.fund_avg_1w || 0,
    fund_avg_1m: AUTO_DATA.fund_avg_1m || 0,
    fund_cont_days: AUTO_DATA.fund_cont_days || 0,
    hard_risk_volatility: 'ok',
    hard_risk_rate: 'watch',
    hard_risk_liquidity: 'ok',
    hard_risk_homogenization: 'ok'
  };
  
  try {
    const result = ScoringEngine.calculate(testData);
    console.log('评分结果：', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('评分计算失败：', e.message);
  }
}

console.log('\n=== 测试完成 ===');
