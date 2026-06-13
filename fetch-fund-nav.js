// 批量获取观察池基金净值数据（Wind MCP）
const fs = require('fs');
const { execSync } = require('child_process');

// 观察池基金列表（Wind代码）
const funds = [
  { name: '诺安多策略A', code: '320016.OF' },
  { name: '中信保诚景气优选A', code: '009853.OF' },
  { name: '中信保诚多策略A', code: '016155.OF' },
  { name: '国金量化多因子A', code: '006638.OF' },
  { name: '国金量化精选A', code: '008718.OF' },
  { name: '大成动态量化A', code: '003147.OF' },
  { name: '富荣价值精选A', code: '009042.OF' },
  { name: '金元顺安元启', code: '004685.OF' },
  { name: '建信灵活配置A', code: '000270.OF' },
  { name: '华夏新锦绣A', code: '002871.OF' },
  { name: '万家精选A', code: '519185.OF' },
  { name: '新华策略精选A', code: '001040.OF' }
];

const cli = 'C:/Users/xyf31/.workbuddy/skills/wind-mcp-skill/scripts/cli.mjs';
const results = [];

for (const fund of funds) {
  console.log(`\n正在获取 ${fund.name} (${fund.code})...`);
  try {
    const param = JSON.stringify({
      windcode: fund.code,
      begin_date: '20260501',
      end_date: '20260612'
    });
    const cmd = `node "${cli}" call fund_data get_fund_kline '${param}'`;
    const out = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    const json = JSON.parse(out);
    if (json.content && json.content[0] && json.content[0].text) {
      const data = JSON.parse(json.content[0].text);
      if (data.data && data.data.rows) {
        const rows = data.data.rows;
        const latest = rows[rows.length - 1];
        const nav = parseFloat(latest[1]); // MATCH字段是净值
        
        // 计算近1日/1周/1月/今年以来收益
        const len = rows.length;
        const day1 = len >= 2 ? (nav - parseFloat(rows[len-2][1])) / parseFloat(rows[len-2][1]) * 100 : 0;
        const week1 = len >= 5 ? (nav - parseFloat(rows[len-5][1])) / parseFloat(rows[len-5][1]) * 100 : 0;
        const month1 = len >= 20 ? (nav - parseFloat(rows[len-20][1])) / parseFloat(rows[len-20][1]) * 100 : 0;
        
        // 今年以来（从2026-01-01开始）
        const ytdRow = rows.find(r => r[9] >= '20260101');
        const ytd = ytdRow ? (nav - parseFloat(ytdRow[1])) / parseFloat(ytdRow[1]) * 100 : 0;
        
        results.push({
          name: fund.name,
          code: fund.code.replace('.OF', ''),
          nav: nav.toFixed(4),
          day1: day1.toFixed(2),
          week1: week1.toFixed(2),
          month1: month1.toFixed(2),
          ytd: ytd.toFixed(2)
        });
        console.log(`  成功：净值=${nav}, 近1月=${(month1 >= 0 ? '+' : '') + month1.toFixed(2)}%`);
      }
    }
  } catch (e) {
    console.log(`  失败：${e.message}`);
    results.push({ name: fund.name, code: fund.code.replace('.OF', ''), error: true });
  }
}

// 输出结果
console.log('\n\n=== 基金净值数据汇总 ===');
console.log(JSON.stringify(results, null, 2));

// 生成FUND_PRODUCTS更新代码
let jsCode = '\n// 从Wind MCP更新的基金数据（' + new Date().toISOString().slice(0,10) + '）\n';
jsCode += 'if (typeof FUND_PRODUCTS !== "undefined") {\n';
for (const r of results) {
  if (r.error) continue;
  jsCode += `  // ${r.name} (${r.code})\n`;
  jsCode += `  { let f = FUND_PRODUCTS.find(f => f.code === '${r.code}'); if (f) { f.dayChange = ${r.day1}; f.week1 = ${r.week1}; f.month1 = ${r.month1}; f.ytd = ${r.ytd}; } }\n`;
}
jsCode += '}\n';
console.log('\n=== 更新代码 ===');
console.log(jsCode);
