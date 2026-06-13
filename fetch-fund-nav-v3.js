// 批量获取观察池基金净值数据（Wind MCP）
// 用法：node fetch-fund-nav-v3.js

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

const CLI = 'C:/Users/xyf31/.workbuddy/skills/wind-mcp-skill/scripts/cli.mjs';

console.log('=== 开始批量获取基金净值数据 ===\n');

for (const fund of funds) {
  console.log('正在获取 ' + fund.name + ' (' + fund.code + ')...');
  
  try {
    const param = JSON.stringify({
      windcode: fund.code,
      begin_date: '20260501',
      end_date: '20260612'
    });
    
    const cmd = 'node "' + CLI + '" call fund_data get_fund_kline \'' + param + '\'';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    
    // 解析输出
    const json = JSON.parse(out);
    if (json.content && json.content[0] && json.content[0].text) {
      const data = JSON.parse(json.content[0].text);
      
      if (data.data && data.data.rows) {
        const rows = data.data.rows;
        const len = rows.length;
        
        if (len > 0) {
          const latest = rows[len - 1];
          const nav = parseFloat(latest[1]); // MATCH字段是净值
          
          // 计算收益
          const day1 = len >= 2 ? (nav - parseFloat(rows[len-2][1])) / parseFloat(rows[len-2][1]) * 100 : 0;
          const week1 = len >= 5 ? (nav - parseFloat(rows[len-5][1])) / parseFloat(rows[len-5][1]) * 100 : 0;
          const month1 = len >= 20 ? (nav - parseFloat(rows[len-20][1])) / parseFloat(rows[len-20][1]) * 100 : 0;
          
          console.log('  成功：净值=' + nav.toFixed(4) + ', 近1月=' + (month1 >= 0 ? '+' : '') + month1.toFixed(2) + '%');
        }
      }
    }
  } catch (e) {
    console.log('  失败：' + e.message);
  }
}

console.log('\n=== 完成 ===');
