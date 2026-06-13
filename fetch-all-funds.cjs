const { execSync } = require('child_process');
const fs = require('fs');

// 观察池基金列表（按PRD分层）
const FUNDS = [
  // 微盘暴露型
  { tier: '微盘暴露型', name: '诺安多策略A', windCode: '320016.OF', code: '320016' },
  { tier: '微盘暴露型', name: '中信保诚景气优选A', windCode: '009853.OF', code: '009853' },
  { tier: '微盘暴露型', name: '中信保诚多策略A', windCode: '011282.OF', code: '011282' },
  // 稳健分散型
  { tier: '稳健分散型', name: '金元顺安元启', windCode: '004685.OF', code: '004685' },
  { tier: '稳健分散型', name: '建信灵活配置A', windCode: '000270.OF', code: '000270' },
  { tier: '稳健分散型', name: '华夏新锦绣A', windCode: '002871.OF', code: '002871' },
  // 风格对照型
  { tier: '风格对照型', name: '万家精选A', windCode: '519185.OF', code: '519185' },
  { tier: '风格对照型', name: '新华策略精选A', windCode: '001040.OF', code: '001040' },
  // 微盘量化（原第一梯队）
  { tier: '微盘量化', name: '国金量化多因子A', windCode: '006638.OF', code: '006638' },
  { tier: '微盘量化', name: '国金量化精选A', windCode: '014805.OF', code: '014805' },
  { tier: '微盘量化', name: '大成动态量化A', windCode: '003147.OF', code: '003147' },
];

const CLI = 'C:\\Users\\xyf31\\.workbuddy\\skills\\wind-mcp-skill\\scripts\\cli.mjs';
const results = [];

for (const fund of FUNDS) {
  try {
    const param = JSON.stringify({ windcode: fund.windCode, start_date: '20260501', end_date: '20260612' });
    const cmd = `node "${CLI}" call fund_data get_fund_kline '${param}'`;
    const out = execSync(cmd, { encoding: 'utf8', timeout: 30000, shell: 'cmd.exe' });
    const json = JSON.parse(out.trim());
    const text = json.content[0].text;
    const data = JSON.parse(text);
    const rows = data.data.rows;
    const len = rows.length;
    if (len < 2) { results.push({ ...fund, error: '数据不足' }); continue; }

    const nav = parseFloat(rows[len - 1][2]); // MATCH列
    const nav1d = parseFloat(rows[len - 2][2]);
    const nav5d = parseFloat(rows[len - 5][2]);
    const nav20d = parseFloat(rows[len - 20][2]);
    const nav60d = len >= 60 ? parseFloat(rows[len - 60][2]) : null;

    const dayChange = ((nav - nav1d) / nav1d * 100);
    const week1 = ((nav - nav5d) / nav5d * 100);
    const month1 = ((nav - nav20d) / nav20d * 100);
    const month3 = nav60d ? ((nav - nav60d) / nav60d * 100) : null;

    results.push({
      ...fund,
      nav: Math.round(nav * 10000) / 10000,
      dayChange: Math.round(dayChange * 100) / 100,
      week1: Math.round(week1 * 100) / 100,
      month1: Math.round(month1 * 100) / 100,
      month3: month3 ? Math.round(month3 * 100) / 100 : null,
    });
    console.log(`✓ ${fund.name}: nav=${nav.toFixed(4)}, day=${dayChange.toFixed(2)}%, month1=${month1.toFixed(2)}%`);
  } catch (e) {
    results.push({ ...fund, error: e.message });
    console.log(`✗ ${fund.name}: ${e.message}`);
  }
}

// 输出为JS代码
let js = '// === 微盘量化产品跟踪 (Wind MCP真实数据, 2026-06-12) ===\n';
js += '// 分层：微盘暴露型 | 稳健分散型 | 风格对照型 | 微盘量化\n';
js += 'const FUND_PRODUCTS = [\n';

for (const r of results) {
  js += `  {\n    tier: "${r.tier}",\n    name: "${r.name}",\n    code: "${r.code}",\n`;
  if (r.error) {
    js += `    nav: null, // ${r.error}\n    dayChange: null,\n    week1: null,\n    month1: null,\n`;
  } else {
    js += `    nav: ${r.nav},\n    dayChange: ${r.dayChange},\n    week1: ${r.week1},\n    month1: ${r.month1},\n`;
  }
  js += `    statusNote: "${r.error || 'Wind MCP真实数据'}"\n  },\n`;
}

js += '];\n';

fs.writeFileSync('fund-products-updated.js', js, 'utf8');
console.log('\n已写入 fund-products-updated.js，请手动合并到 auto-data.js');
