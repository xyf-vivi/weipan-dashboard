// 脚本：解析Wind MCP返回的数据并更新auto-data.js
const fs = require('fs');
const path = require('path');

console.log('=== 开始解析Wind MCP数据 ===\n');

// 1. 解析中证2000数据
console.log('1. 解析中证2000数据...');
let zz2000Data;
try {
  const raw = fs.readFileSync('wind_zz2000.json', 'utf8');
  const windOutput = JSON.parse(raw);
  
  if (windOutput.content && windOutput.content[0] && windOutput.content[0].text) {
    const dataText = windOutput.content[0].text;
    const dataObj = JSON.parse(dataText);
    
    if (dataObj.data && dataObj.data.rows) {
      zz2000Data = dataObj.data.rows.map(row => {
        // 列顺序：TIME, OPEN, MATCH, HIGH, LOW, TURNOVER, VOLUME, CHANGERATE, AVPRICE, _DATE
        const dateStr = row[0]; // "2026-05-06T00:00:00.000+08:00"
        const date = dateStr.split('T')[0].replace(/-/g, '-'); // 转换为YYYY-MM-DD
        
        return {
          date: date,
          open: parseFloat(row[1]),
          close: parseFloat(row[2]), // MATCH = 收盘价
          high: parseFloat(row[3]),
          low: parseFloat(row[4]),
          turnover: parseFloat(row[5]),
          volume: parseFloat(row[6]),
          changeRate: parseFloat(row[7])
        };
      });
      
      console.log('  ✓ 解析成功，共', zz2000Data.length, '条记录');
      console.log('  ✓ 日期范围：', zz2000Data[0].date, '至', zz2000Data[zz2000Data.length-1].date);
    }
  }
} catch (e) {
  console.error('  ✗ 解析失败：', e.message);
}

// 2. 解析科创50数据
console.log('\n2. 解析科创50数据...');
let kc50Data;
try {
  // 先从Wind MCP获取科创50数据
  console.log('  提示：需要先获取科创50数据');
  console.log('  执行：cd "C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill" && node scripts\\cli.mjs call index_data get_index_kline \'{"windcode":"000688.SH","begin_date":"20260501","end_date":"20260612"}\' > wind_kc50.json');
} catch (e) {
  console.error('  ✗ 解析失败：', e.message);
}

// 3. 生成auto-data.js的更新代码
console.log('\n3. 生成auto-data.js更新代码...');
if (zz2000Data) {
  const code = `  // === 中证2000 (000905.SH) 日K线（Wind MCP数据） ===
  zz2000: [
${zz2000Data.map(d => `    {date:"${d.date}", open:${d.open}, close:${d.close}, high:${d.high}, low:${d.low}, turnover:${d.turnover}, volume:${d.volume}, changeRate:${d.changeRate}}`).join(',\n')}
  ],`;
  
  fs.writeFileSync('zz2000_data.js.txt', code);
  console.log('  ✓ 已生成 zz2000_data.js.txt');
  console.log('  ✓ 请手动复制到 auto-data.js 中的 AUTO_DATA 对象');
}

console.log('\n=== 解析完成 ===');
console.log('下一步：');
console.log('1. 获取科创50数据：执行上述命令');
console.log('2. 手动将 zz2000_data.js.txt 中的代码复制到 auto-data.js');
console.log('3. 更新派生指标计算，使用真实的 zz2000 数据');
