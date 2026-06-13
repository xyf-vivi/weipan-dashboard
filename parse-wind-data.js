// 脚本：将Wind MCP返回的数据转换为auto-data.js格式
const fs = require('fs');

// 1. 解析中证2000数据
const zz2000Raw = {"columns": [{"name": "TIME"}, {"name": "OPEN"}, {"name": "MATCH"}, {"name": "HIGH"}, {"name": "LOW"}, {"name": "TURNOVER"}, {"name": "VOLUME"}, {"name": "CHANGERATE"}, {"name": "AVPRICE"}], "rows": []};
// 实际数据需要从Wind MCP的输出中解析

// 2. 生成auto-data.js的更新部分
const output = `
  // === 中证2000 (000905.SH) 日K线（Wind MCP数据） ===
  zz2000: [
    // 格式：{date:"YYYY-MM-DD", open:number, close:number, high:number, low:number, turnover:number, volume:number, changeRate:number}
  ],

  // === 科创50 (000688.SH) 日K线（Wind MCP数据） ===
  kc50: [
    // 格式同上
  ],
`;

console.log('需要手动解析Wind MCP返回的数据并更新auto-data.js');
console.log('Wind MCP返回的数据格式：');
console.log('  - columns: 列定义');
console.log('  - rows: 数据行，每个行是一个数组');
console.log('  - 列顺序：TIME, OPEN, MATCH, HIGH, LOW, TURNOVER, VOLUME, CHANGERATE, AVPRICE, _DATE');

// 3. 提供手动更新的指导
console.log('\n=== 手动更新步骤 ===');
console.log('1. 从Wind MCP输出中复制data部分');
console.log('2. 解析JSON，提取rows');
console.log('3. 将rows转换为auto-data.js中的格式');
console.log('4. 更新auto-data.js，添加zz2000和kc50字段');
console.log('5. 更新派生指标计算，使用真实数据');

// 4. 尝试自动解析（如果提供输入文件）
const args = process.argv.slice(2);
if (args.length > 0) {
  const inputFile = args[0];
  console.log('\n=== 尝试自动解析文件：' + inputFile + ' ===');
  
  try {
    const raw = fs.readFileSync(inputFile, 'utf8');
    // 解析Wind MCP输出（需要提取JSON部分）
    const jsonMatch = raw.match(/\{"data":\{.*\}\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log('解析成功，共', data.data.rows.length, '条记录');
      
      // 转换为auto-data.js格式
      const formatted = data.data.rows.map(row => {
        const date = row[0].split('T')[0]; // 提取日期部分
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
      
      console.log('转换完成，前3条：');
      console.log(JSON.stringify(formatted.slice(0, 3), null, 2));
    }
  } catch (e) {
    console.error('解析失败：', e.message);
  }
}
