// 测试脚本：验证 auto-data.js 数据加载
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  console,
  setTimeout,
  Array,
  Object,
  JSON,
  Math,
  Date,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  document: {
    getElementById: () => ({ textContent: '', innerHTML: '', style: {}, classList: { toggle: ()=>{} } }),
    querySelector: () => null
  }
};

const context = vm.createContext(sandbox);
const code = fs.readFileSync('auto-data.js', 'utf8');
vm.runInContext(code, context);

// 在全局上下文中查找变量
console.log('=== 数据验证 ===');
console.log('AUTO_DATA.weipanRatio:', sandbox.global ? '在global中' : '未找到');

// 直接检查文件内容
const fileContent = fs.readFileSync('auto-data.js', 'utf8');
console.log('包含 zz2000 数组:', fileContent.includes('zz2000:'));
console.log('包含 kc50 数组:', fileContent.includes('kc50:'));
console.log('包含 FUND_PRODUCTS:', fileContent.includes('FUND_PRODUCTS'));
console.log('FUND_PRODUCTS 行数:', (fileContent.match(/tier:/g) || []).length);

// 检查 FUND_PRODUCTS 分层
const tiers = fileContent.match(/tier:\s*"([^"]+)"/g);
console.log('\n=== 基金分层 ===');
if (tiers) {
  const tierCount = {};
  tiers.forEach(t => {
    const name = t.match(/"([^"]+)"/)[1];
    tierCount[name] = (tierCount[name] || 0) + 1;
  });
  Object.entries(tierCount).forEach(([k, v]) => console.log(`  ${k}: ${v}只`));
}

console.log('\n=== 真实数据标识 ===');
console.log('诺安多策略 dayChange:', fileContent.includes('dayChange: -2.84'));
console.log('金元顺安元启 dayChange:', fileContent.includes('dayChange: -3.65'));
console.log('万家精选 dayChange:', fileContent.includes('dayChange: -3.16'));
console.log('新华策略 dayChange:', fileContent.includes('dayChange: -2.66'));
console.log('国金量化多因子 dayChange:', fileContent.includes('dayChange: -2.49'));
console.log('大成动态量化 dayChange:', fileContent.includes('dayChange: -2.59'));
