import { spawnSync } from 'child_process';

const funds = [
  ['诺安多策略A','320016.OF'],
  ['金元顺安元启','004685.OF'],
  ['万家精选A','519185.OF'],
  ['新华策略精选A','001040.OF'],
  ['国金量化多因子A','006638.OF'],
  ['国金量化精选A','008718.OF'],
  ['大成动态量化A','003147.OF'],
  ['中信保诚景气优选A','009853.OF'],
  ['中信保诚多策略A','016155.OF'],
  ['富荣价值精选A','009042.OF'],
  ['建信灵活配置A','000270.OF'],
  ['华夏新锦绣A','002871.OF'],
];

const CLI = 'C:/Users/xyf31/.workbuddy/skills/wind-mcp-skill/scripts/cli.mjs';

for (const [name, code] of funds) {
  const param = JSON.stringify({ windcode: code, begin_date: '20260501', end_date: '20260612' });
  const result = spawnSync('node', [CLI, 'call', 'fund_data', 'get_fund_kline', param], {
    encoding: 'utf8',
    timeout: 30000,
    cwd: 'C:/Users/xyf31/.workbuddy/skills/wind-mcp-skill'
  });
  const out = (result.stdout || '') + (result.stderr || '');
  try {
    const json = JSON.parse(out);
    if (json.content && json.content[0] && json.content[0].text) {
      const data = JSON.parse(json.content[0].text);
      if (data.data && data.data.rows) {
        const rows = data.data.rows;
        const len = rows.length;
        if (len < 2) { console.log(name + '|:no data'); continue; }
        const nav = parseFloat(rows[len-1][1]);
        const d1 = len>=2 ? (nav-parseFloat(rows[len-2][1]))/parseFloat(rows[len-2][1])*100 : 0;
        const w1 = len>=5 ? (nav-parseFloat(rows[len-5][1]))/parseFloat(rows[len-5][1])*100 : 0;
        const m1 = len>=20 ? (nav-parseFloat(rows[len-20][1]))/parseFloat(rows[len-20][1])*100 : 0;
        let ytd = 0;
        for (let i=0; i<len; i++) {
          if (rows[i][9] >= '20260101') { ytd = (nav-parseFloat(rows[i][1]))/parseFloat(rows[i][1])*100; break; }
        }
        console.log([name, code.replace('.OF',''), nav.toFixed(4), d1.toFixed(2), w1.toFixed(2), m1.toFixed(2), ytd.toFixed(2)].join('|'));
      } else { console.log(name + '|:no rows'); }
    } else { console.log(name + '|:parse error'); }
  } catch(e) { console.log(name + '|:' + e.message); }
}
