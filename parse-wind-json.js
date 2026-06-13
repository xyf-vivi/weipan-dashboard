// 脚本：解析Wind MCP返回的JSON文件并更新auto-data.js
const fs = require('fs');

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
        const date = dateStr.split('T')[0]; // 转换为YYYY-MM-DD
        
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
  console.error('  ✗ 解析中证2000数据失败：', e.message);
}

// 2. 解析科创50数据
console.log('\n2. 解析科创50数据...');
let kc50Data;
try {
  const raw = fs.readFileSync('wind_kc50.json', 'utf8');
  const windOutput = JSON.parse(raw);
  
  if (windOutput.content && windOutput.content[0] && windOutput.content[0].text) {
    const dataText = windOutput.content[0].text;
    const dataObj = JSON.parse(dataText);
    
    if (dataObj.data && dataObj.data.rows) {
      kc50Data = dataObj.data.rows.map(row => {
        const dateStr = row[0];
        const date = dateStr.split('T')[0];
        
        return {
          date: date,
          open: parseFloat(row[1]),
          close: parseFloat(row[2]),
          high: parseFloat(row[3]),
          low: parseFloat(row[4]),
          turnover: parseFloat(row[5]),
          volume: parseFloat(row[6]),
          changeRate: parseFloat(row[7])
        };
      });
      
      console.log('  ✓ 解析成功，共', kc50Data.length, '条记录');
      console.log('  ✓ 日期范围：', kc50Data[0].date, '至', kc50Data[kc50Data.length-1].date);
    }
  }
} catch (e) {
  console.error('  ✗ 解析科创50数据失败：', e.message);
}

// 3. 生成auto-data.js的更新代码
console.log('\n3. 生成auto-data.js更新代码...');
if (zz2000Data && kc50Data) {
  // 生成zz2000数组
  const zz2000Code = `  // === 中证2000 (000905.SH) 日K线（Wind MCP数据） ===
  zz2000: [
${zz2000Data.map(d => `    {date:"${d.date}", open:${d.open}, close:${d.close}, high:${d.high}, low:${d.low}, turnover:${d.turnover}, volume:${d.volume}, changeRate:${d.changeRate}}`).join(',\n')}
  ],`;
  
  // 生成kc50数组
  const kc50Code = `  // === 科创50 (000688.SH) 日K线（Wind MCP数据） ===
  kc50: [
${kc50Data.map(d => `    {date:"${d.date}", open:${d.open}, close:${d.close}, high:${d.high}, low:${d.low}, turnover:${d.turnover}, volume:${d.volume}, changeRate:${d.changeRate}}`).join(',\n')}
  ],`;
  
  // 保存到文件
  fs.writeFileSync('zz2000_data.txt', zz2000Code);
  fs.writeFileSync('kc50_data.txt', kc50Code);
  
  console.log('  ✓ 已生成 zz2000_data.txt');
  console.log('  ✓ 已生成 kc50_data.txt');
  console.log('\n4. 手动更新步骤：');
  console.log('  a) 打开 auto-data.js');
  console.log('  b) 在 AUTO_DATA 对象中添加 zz2000: [...] 和 kc50: [...]');
  console.log('  c) 从 zz2000_data.txt 和 kc50_data.txt 复制数据');
  console.log('  d) 更新派生指标计算，使用真实的 zz2000 和 kc50 数据');
} else {
  console.log('  ✗ 数据不完整，无法生成更新代码');
}

console.log('\n=== 解析完成 ===');
