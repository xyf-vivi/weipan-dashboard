// 测试脚本：验证微盘量化基金配置检查页的JavaScript代码
const fs = require('fs');
const vm = require('vm');

console.log('=== 开始测试 ===\n');

// 创建一个模拟的浏览器环境
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Array: Array,
  Object: Object,
  JSON: JSON,
  Math: Math,
  Date: Date,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  Error: Error,
  TypeError: TypeError,
  ReferenceError: ReferenceError,
  SyntaxError: SyntaxError,
  
  // 模拟document对象
  document: {
    getElementById: function(id) {
      // console.log('  [mock] getElementById(' + id + ')');
      return {
        textContent: '',
        innerHTML: '',
        className: '',
        style: {},
        classList: {
          toggle: function() {},
          add: function() {},
          remove: function() {}
        }
      };
    },
    querySelector: function(sel) {
      return null;
    },
    querySelectorAll: function(sel) {
      return [];
    }
  },
  
  // 模拟window对象
  window: {},
  
  // 模拟navigator
  navigator: {
    userAgent: 'Node.js Test'
  }
};

// 将sandbox设置为全局上下文
const context = vm.createContext(sandbox);

// 修改：确保所有全局变量都定义在global对象上
context.global = context;

try {
  // 1. 加载auto-data.js
  console.log('1. 加载auto-data.js...');
  let code = fs.readFileSync('auto-data.js', 'utf8');
  
  // 修改代码，确保变量定义在全局上下文
  code = code.replace(/const AUTO_DATA/, 'var AUTO_DATA');
  code = code.replace(/const FUND_PRODUCTS/, 'var FUND_PRODUCTS');
  
  vm.runInContext(code, context);
  console.log('  ✓ auto-data.js 加载成功');
  
  // 检查AUTO_DATA - 直接在context中查找
  if (context.AUTO_DATA !== undefined) {
    console.log('  ✓ AUTO_DATA 已定义');
    console.log('    - weipanRatio:', context.AUTO_DATA.weipanRatio);
    console.log('    - weipan20d:', context.AUTO_DATA.weipan20d);
    console.log('    - weipan1m:', context.AUTO_DATA.weipan1m);
  } else {
    console.log('  ✗ AUTO_DATA 未定义');
  }
  
  // 检查FUND_PRODUCTS
  if (context.FUND_PRODUCTS !== undefined) {
    console.log('  ✓ FUND_PRODUCTS 已定义，共', context.FUND_PRODUCTS.length, '只基金');
  } else {
    console.log('  ✗ FUND_PRODUCTS 未定义');
  }
  
} catch (e) {
  console.error('  ✗ auto-data.js 加载失败：', e.message);
}

try {
  // 2. 加载data.js
  console.log('\n2. 加载data.js...');
  let code = fs.readFileSync('data.js', 'utf8');
  vm.runInContext(code, context);
  console.log('  ✓ data.js 加载成功');
} catch (e) {
  console.error('  ✗ data.js 加载失败：', e.message);
}

try {
  // 3. 加载scoring.js
  console.log('\n3. 加载scoring.js...');
  let code = fs.readFileSync('scoring.js', 'utf8');
  vm.runInContext(code, context);
  console.log('  ✓ scoring.js 加载成功');
  
  // 检查ScoringEngine
  if (sandbox.ScoringEngine) {
    console.log('  ✓ ScoringEngine 已定义');
    
    // 测试评分计算
    console.log('\n4. 测试评分计算...');
    const testData = {
      weipanRatio: (sandbox.AUTO_DATA && sandbox.AUTO_DATA.weipanRatio || 0) * 100,
      weipan20d: sandbox.AUTO_DATA && sandbox.AUTO_DATA.weipan20d || 0,
      weipan1m: sandbox.AUTO_DATA && sandbox.AUTO_DATA.weipan1m || 0,
      relativeExcess20d: sandbox.AUTO_DATA && sandbox.AUTO_DATA.relativeExcess20d || 0,
      weipanSpread: (sandbox.AUTO_DATA && sandbox.AUTO_DATA.weipanSpread || 0) * 100,
      weipanDrawdown: sandbox.AUTO_DATA && sandbox.AUTO_DATA.weipanDrawdown || 0,
      up_ratio: 55, // 默认55%
      fund_avg_1d: -1.5,
      fund_avg_1w: -5.2,
      fund_avg_1m: -8.7,
      fund_rel_zz2000: -2.1,
      fund_cont_days: 0,
      hard_risk_volatility: 'wait',
      hard_risk_rate: 'watch',
      hard_risk_liquidity: 'ok',
      hard_risk_homogenization: 'wait'
    };
    
    try {
      const result = sandbox.ScoringEngine.calculate(testData);
      console.log('  ✓ 评分计算成功');
      console.log('    - 总分：', result.total);
      console.log('    - 状态：', result.level.label);
      console.log('    - 硬风控状态：', result.hardRiskStatus);
      
      // 显示各模块评分
      console.log('    - 各模块评分：');
      for (const [key, value] of Object.entries(result.results)) {
        console.log('      · ' + key + ': ' + value.score + '/' + value.max);
      }
    } catch (e) {
      console.error('  ✗ 评分计算失败：', e.message);
    }
  } else {
    console.log('  ✗ ScoringEngine 未定义');
  }
  
} catch (e) {
  console.error('  ✗ scoring.js 加载失败：', e.message);
}

console.log('\n=== 测试完成 ===');
console.log('如果有错误，请检查上面的错误信息。');
