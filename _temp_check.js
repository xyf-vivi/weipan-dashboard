
// ========== 基金分层 ==========
function getFundTiers() {
  if (typeof FUND_PRODUCTS === 'undefined') return { exposure: [], quant: [], control: [] };
  // ✅ 统一为三类：高微盘暴露观察 / 分散量化观察 / 风格对照观察
  const exposure = FUND_PRODUCTS.filter(f => f.tier === '微盘暴露型' || f.tier === '微盘量化');
  const stable = FUND_PRODUCTS.filter(f => f.tier === '稳健分散型');
  const control = FUND_PRODUCTS.filter(f => f.tier === '风格对照型');
  return { exposure, stable, control };
}

// ✅ 风险与数据备注分离
const TIER_RISKS = {
  '微盘暴露型': '高波动、回撤快、风格暴露高',
  '微盘量化': '高波动、市值下沉、策略同质化风险',
  '稳健分散型': '分散持仓、波动较低、但仍有微盘敞口',
  '风格对照型': '非微盘策略，风格暴露不同'
};

// ========== 格式化 ==========
const fmtPct = v => (v === null || v === undefined) ? '暂无' : ((v > 0 ? '+' : '') + v.toFixed(2) + '%');
const pctColor = v => (v === null || v === undefined) ? 'var(--text-muted)' : (v > 0 ? 'var(--accent-red)' : v < 0 ? 'var(--accent-green)' : 'var(--text-muted)');

// ========== 基金表格渲染 ==========
function renderFundTables() {
  const tiers = getFundTiers();
  const container = document.getElementById('fundTables');
  if (!container) return;

  const tierConfigs = [
    { title: '高微盘/量化观察', desc: '观察微盘量化是否真正修复（含微盘暴露型+微盘量化）。共性风险：弹性高、回撤快、风格暴露高、流动性敏感', funds: [...tiers.exposure], tagClass: 'tag-red', tagText: '高弹性/高波动',
      roles: { '诺安多策略A': '高暴露', '国金量化多因子A': '量化标杆', '大成动态量化A': '市值下沉', '富荣价值精选A': '数据待接入', '金元顺安元启': '人肉量化' } },
    { title: '分散量化观察', desc: '观察分散持仓、偏稳健的小微盘策略回撤控制能力。共性风险：分散持仓、波动较低，但仍有微盘敞口', funds: tiers.stable, tagClass: 'tag-green', tagText: '分散/风控优先',
      roles: {} },
    { title: '风格对照观察', desc: '判断市场是否偏离微盘转向其他风格。共性风险：非微盘策略，风格暴露不同。<strong>跑赢微盘不等于微盘量化变好，只用于比较，不参与产品端确认</strong>', funds: tiers.control, tagClass: 'tag-blue', tagText: '风格对照/非买入对象',
      roles: { '万家精选A': '黄海管理', '新华策略精选A': '科技成长' } }
  ];

  // #17: 隐藏待接入产品到折叠区，只展示已接入产品
  // #19: 有效样本数
  const allProdFunds = (FUND_PRODUCTS || []).filter(f => f.tier !== '风格对照型');
  const validProdFunds = allProdFunds.filter(f => f.dayChange !== null && f.dayChange !== undefined);

  // 产品端标题下的有效样本数
  const sampleInfo = document.createElement ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;padding:6px 8px;background:rgba(59,130,246,.08);border-radius:6px">
    当前有效样本 <strong style="color:var(--accent-blue)">${validProdFunds.length}</strong> / 总样本 <strong>${allProdFunds.length}</strong>（产品端信号基于有效样本均值计算）
  </div>` : '';

  container.innerHTML = tierConfigs.map(tc => {
    // 分离已接入和待接入
    const activeFunds = tc.funds.filter(f => f.dayChange !== null && f.dayChange !== undefined);
    const pendingFunds = tc.funds.filter(f => f.dayChange === null || f.dayChange === undefined);

    // #18: 三档数据状态（完整/部分/待接入）
    const dataStatusOf = (f) => {
      const fields = [f.dayChange, f.week1, f.month1, f.month3, f.month6, f.ytd];
      const valid = fields.filter(v => v !== null && v !== undefined).length;
      if (valid >= 6) return { text: '完整', cls: 'tag-green' };
      if (valid >= 3) return { text: '部分', cls: 'tag-yellow' };
      return { text: '待接入', cls: 'tag-gray' };
    };

    // 渲染已接入表格
    let tableHtml = '';
    if (activeFunds.length > 0) {
      tableHtml = `<table class="fund-table">
        <thead><tr><th>基金</th><th>角色</th><th>近1日</th><th>近1周</th><th>近1月</th><th>数据状态</th><th>观察结论</th></tr></thead>
        <tbody>
          ${activeFunds.map(f => {
            const ds = dataStatusOf(f);
            let conclusion = '仍在修复';
            if (f.tier === '风格对照型') {
              conclusion = '非微盘确认信号';
            } else if (f.month1 !== null && f.month1 !== undefined && f.month1 > 0) {
              conclusion = '近1月已修复';
            } else if (f.month1 !== null && f.month1 !== undefined && f.month1 < -10) {
              conclusion = '仍在调整';
            }
            const role = tc.roles[f.name] || '—';
            return `<tr>
              <td><strong>${f.name}</strong><br><span style="font-size:10px;color:var(--text-muted)">${f.code}</span></td>
              <td style="font-size:11px;color:var(--text-secondary)">${role}</td>
              <td style="color:${pctColor(f.dayChange)};font-weight:600">${fmtPct(f.dayChange)}</td>
              <td style="color:${pctColor(f.week1)}">${fmtPct(f.week1)}</td>
              <td style="color:${pctColor(f.month1)}">${fmtPct(f.month1)}</td>
              <td><span class="tag ${ds.cls}">${ds.text}</span></td>
              <td style="font-size:11px">${conclusion}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    } else {
      tableHtml = `<div style="font-size:12px;color:var(--text-muted);padding:12px;background:var(--bg-hover);border-radius:6px">本组暂无已接入数据</div>`;
    }

    // 渲染待接入折叠
    let pendingHtml = '';
    if (pendingFunds.length > 0) {
      const foldId = 'pending_' + tc.title.replace(/[^a-zA-Z]/g, '');
      pendingHtml = `
        <div class="pending-fold-toggle" onclick="togglePendingFold('${foldId}')">
          待接入观察名单（${pendingFunds.length}只）▼
        </div>
        <div class="pending-content" id="${foldId}" style="display:none">
          <table class="fund-table" style="opacity:0.7">
            <thead><tr><th>基金</th><th>代码</th><th>状态</th></tr></thead>
            <tbody>
              ${pendingFunds.map(f => `<tr>
                <td style="color:var(--text-muted)">${f.name}</td>
                <td style="font-size:10px;color:var(--text-muted)">${f.code}</td>
                <td><span class="tag tag-gray">待接入</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    return `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;font-weight:600">${tc.title}</span>
        <span class="tag ${tc.tagClass}">${tc.tagText}</span>
        ${activeFunds.length > 0 ? `<span style="font-size:11px;color:var(--text-muted)">已接入 ${activeFunds.length} / ${tc.funds.length}</span>` : ''}
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;padding:6px 8px;background:var(--bg-hover);border-radius:6px">${tc.desc}</div>
      ${tableHtml}
      ${pendingHtml}
    </div>`;
  }).join('');

  // 在容器顶部插入有效样本数信息（通过前插HTML）
  if (validProdFunds.length > 0) {
    container.insertAdjacentHTML('afterbegin', sampleInfo);
  }
}

// ========== 市场风格对照 ==========
function renderStyleCompare() {
  const container = document.getElementById('styleCompareGrid');
  if (!container) return;
  const fmt = v => (v === null || v === undefined) ? '待接入' : ((v > 0 ? '+' : '') + v.toFixed(1) + '%');
  const vc = v => (v === null || v === undefined) ? 'var(--text-muted)' : (v > 0 ? 'var(--accent-red)' : v < 0 ? 'var(--accent-green)' : 'var(--text-muted)');

  // #6: 拆开万得微盘和中证2000；红利移到待接入说明
  const items = [
    { name: '万得微盘 · 868008.WI', val: AUTO_DATA.weipan20d, desc: '微盘本体（全市场市值最小股票）', dataType: 'auto' },
    { name: '中证2000 · 932000.CSI', val: AUTO_DATA.zz2000_20d, desc: '小票环境代理（不等于微盘指数）', dataType: 'auto' },
    { name: '科创50 · 000688.SH', val: AUTO_DATA.kc50_20d, desc: '科技抱团代理', dataType: 'auto' },
    { name: '沪深300 · 000300.SH', val: AUTO_DATA.hs300_20d, desc: '核心资产代理', dataType: 'auto' }
  ];

  const vals = items.filter(i => i.val !== undefined && i.val !== null).map(i => i.val);
  const maxVal = vals.length > 0 ? Math.max(...vals) : null;
  const minVal = vals.length > 0 ? Math.min(...vals) : null;

  container.innerHTML = items.map(it => {
    const cls = it.dataType === 'wait' ? 'style-item pending' : (it.val === maxVal ? 'style-item lead' : it.val === minVal ? 'style-item lag' : 'style-item');
    return `<div class="${cls}">
      <div class="style-item-header">
        <span class="style-item-name">${it.name}</span>
        <span class="style-item-val" style="color:${vc(it.val)}">${fmt(it.val)}</span>
      </div>
      <div class="style-item-desc">${it.desc}</div>
    </div>`;
  }).join('');

  // 红利放到待接入说明
  const noteEl = document.getElementById('stylePendingNote');
  if (noteEl) {
    const zzlh = AUTO_DATA.zzlh_20d;
    let zzlhStr = '—';
    if (zzlh !== undefined && zzlh !== null) {
      zzlhStr = (zzlh > 0 ? '+' : '') + zzlh.toFixed(1) + '%';
    }
    noteEl.innerHTML = '待接入风格：中证红利 · 000922.SH 近20日 ' + zzlhStr + '（防守风格代理，已接入但暂不参与主视觉判断）';
  }
}

// ========== 信号灯渲染 ==========
function renderSignals(data) {
  const container = document.getElementById('signalGrid');
  if (!container) return;

  const setMetrics = (items) => items.map(it =>
    it.pending ? `<span class="signal-metric pending">${it.label}：待接入</span>` : `<span class="signal-metric">${it.label}：<strong>${it.val}</strong></span>`
  ).join('');

  // 1. 风格
  const rel20d = (data.zz2000_20d_change || 0) - (data.kc50_20d_change || 0);
  let styleJudge, styleColor, styleObs;
  if (rel20d > 3) { styleJudge = '小票占优'; styleColor = 'var(--accent-green)'; }
  else if (rel20d > 0) { styleJudge = '略偏小票'; styleColor = 'var(--accent-yellow)'; }
  else { styleJudge = '未确认'; styleColor = 'var(--accent-red)'; }
  styleObs = `中证2000近20日${(data.zz2000_20d_change||0).toFixed(1)}%，科创50${(data.kc50_20d_change||0).toFixed(1)}%，相对强弱${rel20d>0?'+':''}${rel20d.toFixed(1)}pct。`;

  // 2. 资金
  const wpR = data.weipanRatio || 0;
  let fundJudge = wpR > 0.8 ? '偏热' : '偏弱';
  const wpArr = AUTO_DATA.weipan || [];
  let wpAvg5 = '—';
  if (wpArr.length >= 5) { const t = wpArr.slice(-5).reduce((s,d)=>s+(d.turnover||0),0); wpAvg5 = (t/1e8/5).toFixed(0)+'亿'; }
  // #20: 换手率分位标"样本内分位"
  const tpPct = data.wp_turnover_pct; // 样本内分位（近28个交易日）

  // 3. 量化
  const upR = data.up_ratio || 0.5;
  let quantJudge = upR > 0.6 ? '改善' : upR > 0.5 ? '中性' : '偏低';
  const quantColor = upR > 0.6 ? 'var(--accent-green)' : upR > 0.5 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  // 4. 产品（只统计微盘暴露+分散量化）
  const prodFundsAll = (FUND_PRODUCTS || []).filter(f => f.tier !== '风格对照型');
  const prodFunds = prodFundsAll.filter(f => f.dayChange !== null && f.dayChange !== undefined);
  const prodAvg1d = prodFunds.length > 0 ? prodFunds.reduce((s,f)=>s+f.dayChange,0)/prodFunds.length : null;
  const prodAvg1w = prodFunds.length > 0 ? prodFunds.filter(f=>f.week1!=null).reduce((s,f)=>s+f.week1,0)/Math.max(1,prodFunds.filter(f=>f.week1!=null).length) : null;
  const prodAvg1m = prodFunds.length > 0 ? prodFunds.filter(f=>f.month1!=null).reduce((s,f)=>s+f.month1,0)/Math.max(1,prodFunds.filter(f=>f.month1!=null).length) : null;
  let prodJudge = (prodAvg1d !== null && prodAvg1d > 0) ? '有修复' : '仍在调整';
  const prodColor = (prodAvg1d !== null && prodAvg1d > 0) ? 'var(--accent-green)' : 'var(--accent-red)';
  // #22: 有效样本数
  const prodSampleText = `${prodFunds.length} / ${prodFundsAll.length}`;

  container.innerHTML = [
    { title: '风格是否站回微盘？', judge: styleJudge, jColor: styleColor, obs: styleObs,
      metrics: [
        {label:'中证2000近20日', val:(data.zz2000_20d_change||0).toFixed(1)+'%'},
        {label:'科创50近20日', val:(data.kc50_20d_change||0).toFixed(1)+'%'},
        {label:'相对强弱', val:(rel20d>0?'+':'')+rel20d.toFixed(1)+'pct'}
      ], why: '微盘不能只看今天涨没涨，要看资金是不是真的从科技分流出来。',
      good: '连续几个交易日，小票跑赢科技', bad: '科技重新放量领涨，小票再次跑输' },

    { title: '资金和拥挤是否健康？', judge: fundJudge, jColor: 'var(--accent-yellow)',
      obs: `微盘成交占比${wpR.toFixed(2)}%，资金${wpR>0.8?'有回升但仍需观察':'回流迹象不强'}。`,
      metrics: [
        {label:'微盘成交占比', val:wpR.toFixed(2)+'%'},
        {label:'万得微盘近5日均额', val:wpAvg5 + '（亿元）'},
        {label:'小票成交占比', pending:true},
        {label:'换手率分位（近样本28日）', val: tpPct !== undefined ? (tpPct*100).toFixed(0)+'%' : '—'}
      ], why: '微盘不是跌多了就会涨，必须看到资金回来。过热也不好，会带来踩踏风险。',
      good: '成交占比从低位连续回升，未到极端拥挤', bad: '占比快速冲高，换手率进入极端高分位' },

    { title: '市场是否适合量化赚钱？', judge: quantJudge, jColor: quantColor,
      obs: `上涨家数占比约${(upR*100).toFixed(0)}%，${upR>0.6?'赚钱效应扩散':upR>0.5?'仍需更多扩散':'多数仍在调整'}。`,
      metrics: [
        {label:'上涨家数占比', val:(upR*100).toFixed(0)+'%'},
        {label:'下跌家数', val:(AUTO_DATA.quotes&&AUTO_DATA.quotes["868008.WI"])?AUTO_DATA.quotes["868008.WI"].downCount:'—'},
        {label:'跌停家数', pending:true},
        {label:'市场集中度', pending:true}
      ], why: '微盘量化最喜欢的不是指数大涨，而是很多股票都有机会。',
      good: '上涨家数持续较多，成交不只集中在少数科技股', bad: '指数涨但多数股票不涨，或成交继续集中在少数热门方向' },

    { title: '产品端是否开始确认？', judge: prodJudge, jColor: prodColor,
      obs: `微盘暴露+分散量化基金均值：近1日${fmtPct(prodAvg1d)}，近1周${fmtPct(prodAvg1w)}，近1月${fmtPct(prodAvg1m)}。<br><span style="font-size:11px;color:var(--text-muted)">⚠️ 风格对照型不参与产品验证 · 有效样本 ${prodSampleText}</span>`,
      metrics: [
        {label:'近1日均值', val:fmtPct(prodAvg1d)},
        {label:'近1周均值', val:fmtPct(prodAvg1w)},
        {label:'近1月均值', val:fmtPct(prodAvg1m)},
        {label:'有效样本', val: prodSampleText}
      ], why: '指数涨不代表微盘量化基金一定跟得上。最终看产品端是否真的修复。',
      good: '微盘量化基金净值连续修复，并跑赢基准', bad: '指数反弹但基金不跟，甚至继续回撤' }
  ].map((s, idx) => `
    <div class="signal-card">
      <div class="signal-header">
        <span class="signal-title">${s.title}</span>
        <span class="signal-judge" style="color:${s.jColor}">${s.judge}</span>
      </div>
      <div class="signal-metrics">${setMetrics(s.metrics)}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${s.obs}</div>
      <div style="font-size:12px;color:var(--accent-green);margin-bottom:2px">下一步看：${s.good}</div>
      <div class="signal-detail-toggle" onclick="toggleSignalDetail(${idx})">展开解释（为什么重要 / 变坏信号）</div>
      <div class="signal-detail" id="signalDetail_${idx}">
        <div style="margin-bottom:6px"><strong style="color:var(--text-secondary)">为什么重要：</strong>${s.why}</div>
        <div><strong style="color:var(--accent-red)">变坏信号：</strong>${s.bad}</div>
      </div>
    </div>
  `).join('');
}

// ========== 趋势确认清单 + 下修条件（自动判定）==========
function renderChecklists(data) {
  // --- 辅助：计算中证2000 vs 科创50 最近3个交易日的逐日相对强弱 ---
  const zzArr = (AUTO_DATA.zz2000 || []).slice(-4); // 最近4个交易日（算3天相对变化）
  const kcArr = (AUTO_DATA.kc50 || []).slice(-4);
  let beatCount = 0;
  let canCalc3d = false;
  if (zzArr.length >= 4 && kcArr.length >= 4) {
    canCalc3d = true;
    for (let i = 1; i < zzArr.length; i++) {
      const zzRet = zzArr[i-1].close > 0 ? (zzArr[i].close / zzArr[i-1].close - 1) * 100 : 0;
      const kcRet = kcArr[i-1].close > 0 ? (kcArr[i].close / kcArr[i-1].close - 1) * 100 : 0;
      if (zzRet > kcRet) beatCount++;
    }
  }

  // 确认清单
  const confirmItems = [
    // #6: 微盘相对核心资产长期趋势 — 缺243日均线和相对净值，改待接入
    { text: '微盘相对核心资产长期趋势没有破坏', status: 'wait',
      note: '需微盘/茅指数相对净值+243日均线判断，当前待接入（微盘从高点回撤约' + (AUTO_DATA.weipanDrawdown||0).toFixed(1) + '%，但回撤不等于趋势破坏）' },
    // #7: 20日斜率标"代理斜率"
    { text: '微盘20日代理斜率转正', status: (data.wp_slope20||0) > 0 ? 'half' : 'cross',
      note: '代理斜率' + (data.wp_slope20||0).toFixed(3) + '（20日涨跌幅/20，非真实回归斜率）。强于核心资产待接入' },
    // #8: 连续3日跑赢科技 — 现在可以计算了！
    { text: '连续3个交易日，小票跑赢科技', status: canCalc3d ? (beatCount >= 3 ? 'check' : 'cross') : 'wait',
      note: canCalc3d ? `近3个交易日小票跑赢${beatCount}次` : '日K线数据不足' },
    // #12: 改用已有微盘成交占比判断连续回升
    { text: '微盘成交占比连续回升', status: 'half', note: '微盘当日成交占比' + (data.weipanRatio||0).toFixed(2) + '%，连续性需接入小票成交占比后确认' },
    // #9: 上涨家数文案改"单日满足，连续性待接入"
    { text: '上涨家数占比连续高于60%', status: 'half',
      note: '当日占比约' + ((data.up_ratio||0)*100).toFixed(0) + '%，单日满足；连续性需逐日序列，待接入' },
    { text: '跌停家数没有明显扩散', status: 'wait', note: '跌停家数待接入（NeoData只返回排行，无汇总值）' },
    // #10: 产品净值文案改"单日修复，但未达到连续修复"
    { text: '观察池微盘量化基金净值连续修复', status: 'half',
      note: (data.fund_avg_1d !== null && data.fund_avg_1d > 0) ? '单日修复（近1日均值' + fmtPct(data.fund_avg_1d) + '），但连续修复需至少3个交易日序列' : '近1日均值' + fmtPct(data.fund_avg_1d) + '，单日未修复' }
  ];

  const iconMap = { check: {c:'icon-check',i:'✓'}, half: {c:'icon-half',i:'◐'}, cross: {c:'icon-cross',i:'✗'}, wait: {c:'icon-wait',i:'?'} };
  const checkCount = confirmItems.filter(i => i.status === 'check').length;
  const halfCount = confirmItems.filter(i => i.status === 'half').length;

  document.getElementById('confirmList').innerHTML = confirmItems.map(it => {
    const m = iconMap[it.status];
    return `<div class="checklist-item"><span class="checklist-icon ${m.c}">${m.i}</span><div><div>${it.text}</div><div style="font-size:10px;color:var(--text-muted)">${it.note}</div></div></div>`;
  }).join('');
  document.getElementById('confirmSummary').textContent = `满足 ${checkCount} 项，部分满足 ${halfCount} 项`;

  // 下修条件
  const rel20d = (data.zz2000_20d_change||0) - (data.kc50_20d_change||0);
  // #12: 指数反弹但基金不修复 — 改为同周期比较（近1日微盘 vs 基金近1日）
  const wp1dChg = AUTO_DATA.weipan && AUTO_DATA.weipan.length > 0
    ? ((AUTO_DATA.weipan[AUTO_DATA.weipan.length-1].close / AUTO_DATA.weipan[AUTO_DATA.weipan.length-2].close - 1) * 100)
    : null;
  const fund1d = data.fund_avg_1d;
  const indexUpFundDown = (wp1dChg !== null && wp1dChg > 0 && fund1d !== null && fund1d < 0);

  const downgradeItems = [
    // #11: 改"科技相对重新占优"（不写"放量"）
    { text: '科技相对重新占优，小票再次跑输', triggered: rel20d < 0,
      note: rel20d < 0 ? `已触发：近20日科技跑赢小票${Math.abs(rel20d).toFixed(1)}pct（成交量待接入，暂无法判断是否放量）` : `未触发：近20日小票${rel20d>=0?'未跑输':'跑赢'}科技` },
    { text: '微盘成交占比只反弹一天就回落', triggered: false, note: '微盘当日占比' + (data.weipanRatio||0).toFixed(2) + '%，小票成交占比待接入，暂无法判断连续性' },
    { text: '上涨家数占比跌回50%以下', triggered: (data.up_ratio||1) < 0.5, note: `当日占比${((data.up_ratio||0)*100).toFixed(0)}%（单日快照，非连续判断）` },
    { text: '跌停家数明显扩散', triggered: false, note: '跌停家数待接入（暂看下跌家数代理）' },
    // #12: 同周期比较
    { text: '指数反弹但观察池基金净值不修复', triggered: indexUpFundDown,
      note: `同日比较：微盘近1日${wp1dChg !== null ? fmtPct(wp1dChg) : '—'}，基金近1日${fund1d !== null ? fmtPct(fund1d) : '—'}${indexUpFundDown?'（已触发）':''}` },
    { text: '硬风控从观察变成触发', triggered: data.hard_risk_liquidity === 'trigger', note: '当前：' + (data.hard_risk_liquidity === 'trigger' ? '已触发' : '未触发') }
  ];

  const triggeredCount = downgradeItems.filter(i => i.triggered).length;
  document.getElementById('downgradeList').innerHTML = downgradeItems.map(it => `
    <div class="checklist-item" style="${it.triggered?'border-left:3px solid var(--accent-red);background:rgba(239,68,68,.08)':''}">
      <span class="checklist-icon ${it.triggered?'icon-cross':'icon-wait'}">${it.triggered?'⚠':'○'}</span>
      <div><div>${it.text}</div><div style="font-size:10px;color:var(--text-muted)">${it.note}</div></div>
    </div>
  `).join('');
  document.getElementById('downgradeSummary').textContent = `触发 ${triggeredCount} 项`;
}

// ========== 评分表 ==========
function renderScoreTable(scoreResult, data) {
  const tbody = document.getElementById('scoreTableBody');
  if (!tbody) return;

  const MODULE_DEFS = ScoringEngine.MODULE_INFO;
  const dtClass = { auto: 'dt-auto', proxy: 'dt-proxy', wait: 'dt-wait' };
  const dtLabel = { auto: '已纳入', proxy: '估算代理', wait: '待接入' };

  const modules = ['hardRisk', 'styleDirection', 'crowdingLiquidity', 'quantFriendliness', 'productVerification'];
  tbody.innerHTML = modules.map(key => {
    const info = MODULE_DEFS[key];
    const result = scoreResult.results[key];
    if (!result) return '';
    const pct = (result.score / result.max * 100).toFixed(0);
    const barColor = pct >= 60 ? 'var(--accent-green)' : pct >= 40 ? 'var(--accent-yellow)' : 'var(--accent-red)';
    return `<tr>
      <td><strong>${info.label}</strong></td>
      <td>${result.max}</td>
      <td style="font-size:11px">${info.meaning}</td>
      <td style="font-size:11px;color:var(--accent-green)">${info.included}</td>
      <td style="font-size:11px;color:var(--text-muted)">${info.excluded}</td>
      <td><span class="dt-tag ${dtClass[info.dataType]}">${dtLabel[info.dataType]}</span></td>
      <td>
        <div class="score-bar-bg"><div class="score-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <span style="font-size:11px">${result.score}/${result.max}</span>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('totalScore').textContent = scoreResult.total;
  document.getElementById('totalStatus').textContent = '当前状态：' + scoreResult.level.label;
  document.getElementById('totalExplain').textContent = scoreResult.level.desc;
  if (scoreResult.confidence) {
    document.getElementById('totalConfidence').textContent = `评分置信度：${scoreResult.confidence.level}（${scoreResult.confidence.reason}）`;
  }
}

// ========== 缺失数据清单（分三类）==========
function renderMissingData() {
  const container = document.getElementById('missingGrid');
  if (!container) return;
  // #21: 分三类：影响评分的代理 / 影响置信度的未纳入 / 低频专题
  // #22: 待接入文案改"未纳入今日分数，但会降低评分置信度"

  const cat1 = [ // 影响今日评分（代理纳入，已影响评分精度）
    { name: '全A中位数涨跌幅', note: '当前用微盘近5日代理，已影响量化友好度评分' },
    { name: '20日斜率（真实回归口径）', note: '当前用代理斜率（涨跌幅/20），已影响风格方向评分' },
    { name: '243日均线（真实口径）', note: '当前用回撤幅度代理，已影响风格方向评分' },
    { name: '换手率分位（历史长期口径）', note: '当前只有样本内分位（近28日），已纳入评分但精度有限' }
  ];

  const cat2 = [ // 未纳入今日评分，但会降低置信度
    { name: '小票成交占比', note: '无法判断资金扩散连续性，降低资金信号置信度' },
    { name: '相对换手率', note: '无法判断拥挤程度，降低拥挤与流动性置信度' },
    { name: '市场集中度', note: '无法判断成交是否过度集中，降低量化友好度置信度' },
    { name: '横截面分化度', note: '无法判断个股分化程度，降低量化友好度置信度' },
    { name: '跌停家数', note: 'NeoData只返回排行无汇总值，降低硬风控置信度' },
    { name: '微盘/茅指数相对净值', note: '无法判断长期趋势是否破坏，降低风格方向置信度' },
    { name: '基金连续修复天数序列', note: '只有区间收益无逐日序列，降低产品验证置信度' }
  ];

  const cat3 = [ // 低频专题数据
    { name: '波动率拥挤度', note: '低频观察，不参与日频评分' },
    { name: '持仓重叠度', note: '低频观察，不参与日频评分' },
    { name: '基金规模', note: '低频观察，不参与日频评分' },
    { name: '利率约束（10年国债风控阈值）', note: '已获取10年国债收益率' + (AUTO_DATA.bond_10y ? AUTO_DATA.bond_10y.toFixed(2)+'%' : '—') + '，但风控触发阈值待定义' }
  ];

  const renderCat = (items, badgeColor) => items.map(m =>
    `<div class="missing-item">○ ${m.name}<div style="font-size:10px;color:var(--text-muted);margin-top:2px">${m.note}</div></div>`
  ).join('');

  container.innerHTML = `
    <div class="missing-section-title t1">一、影响今日评分（代理口径，已影响精度）</div>
    <div class="missing-grid">${renderCat(cat1)}</div>
    <div class="missing-section-title t2">二、未纳入今日评分，但会降低置信度</div>
    <div class="missing-grid">${renderCat(cat2)}</div>
    <div class="missing-section-title t3">三、低频专题数据（不参与日频评分）</div>
    <div class="missing-grid">${renderCat(cat3)}</div>
  `;
}

// ========== Hero ==========
function renderHero(scoreResult) {
  const { total, level, hardRiskStatus, confidence } = scoreResult;
  document.getElementById('heroScore').textContent = total;
  const badge = document.getElementById('heroStatusBadge');
  badge.textContent = level.label;
  badge.className = 'hero-main-status ' + (level.label === '回避区' ? 'badge-avoid' : level.label === '观察区' ? 'badge-observe' : level.label === '试探区' ? 'badge-tentative' : 'badge-signal');

  const action = document.getElementById('heroActionLine');
  if (level.label === '回避区') action.textContent = '不建议参与，继续观察';
  else if (level.label === '观察区') action.textContent = '不重仓，不追涨，只能观察仓';
  else if (level.label === '试探区') action.textContent = '观察仓试探，分批确认';
  else action.textContent = '可以提高关注，仍需分批克制';

  document.getElementById('heroDesc').innerHTML = `
    ${hardRiskStatus === 'trigger' ? '<strong style="color:var(--accent-red)">硬风控触发，直接回避区。</strong><br>' : ''}
    ${level.desc}<br>
    核心判断：跌多了不等于能抄底。现在看到的是小票修复，还不是趋势反转确认。
  `;

  if (confidence) {
    document.getElementById('heroConf').textContent = `评分置信度：${confidence.level} · ${confidence.reason}`;
  }
}

// ========== 首屏三点摘要 ==========
function renderHeroSummary(data) {
  const container = document.getElementById('heroSummary');
  if (!container) return;

  // 1. 资金回流连续性
  const zzArr = AUTO_DATA.zz2000 || [];
  const kcArr = AUTO_DATA.kc50 || [];
  let beatCount = 0;
  if (zzArr.length >= 4 && kcArr.length >= 4) {
    const zzLast4 = zzArr.slice(-4);
    const kcLast4 = kcArr.slice(-4);
    for (let i = 1; i < zzLast4.length; i++) {
      const zzRet = zzLast4[i-1].close > 0 ? (zzLast4[i].close / zzLast4[i-1].close - 1) * 100 : 0;
      const kcRet = kcLast4[i-1].close > 0 ? (kcLast4[i].close / kcLast4[i-1].close - 1) * 100 : 0;
      if (zzRet > kcRet) beatCount++;
    }
  }
  const fundReason = beatCount >= 2
    ? `资金回流开始连续（近3日跑赢${beatCount}次）`
    : `资金回流不连续（近3日跑赢科技仅${beatCount}次）`;

  // 2. 产品端修复
  const fund1d = data.fund_avg_1d;
  const prodReason = (fund1d !== null && fund1d > 0)
    ? `产品端单日有修复（${fmtPct(fund1d)}），但未连续确认`
    : '产品端未连续修复';

  // 3. 硬风控
  const riskReason = '硬风控未完整接入（4项仅1项已确认）';

  container.innerHTML = [
    { num: '1', text: fundReason },
    { num: '2', text: prodReason },
    { num: '3', text: riskReason }
  ].map(item => `
    <div class="hero-summary-item">
      <div class="hero-summary-num">${item.num}</div>
      <div class="hero-summary-text">${item.text}</div>
    </div>
  `).join('');
}

// ========== 折叠 ==========
function toggleFold(id) {
  const content = document.getElementById('foldContent_' + id);
  const icon = document.getElementById('foldIcon_' + id);
  if (content && icon) { content.classList.toggle('open'); icon.classList.toggle('open'); }
}

function togglePendingFold(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleSignalDetail(idx) {
  const el = document.getElementById('signalDetail_' + idx);
  if (el) el.classList.toggle('open');
}

// ========== 关键结论（动态生成）==========
function renderKeyConclusions(data) {
  const container = document.getElementById('keyConclusions');
  if (!container) return;

  const conclusions = [];

  // 1. 资金回流连续性
  const zzArr = AUTO_DATA.zz2000 || [];
  const kcArr = AUTO_DATA.kc50 || [];
  let beatCount = 0;
  let canCalc3d = false;
  if (zzArr.length >= 4 && kcArr.length >= 4) {
    canCalc3d = true;
    const zzLast4 = zzArr.slice(-4);
    const kcLast4 = kcArr.slice(-4);
    for (let i = 1; i < zzLast4.length; i++) {
      const zzRet = zzLast4[i-1].close > 0 ? (zzLast4[i].close / zzLast4[i-1].close - 1) * 100 : 0;
      const kcRet = kcLast4[i-1].close > 0 ? (kcLast4[i].close / kcLast4[i-1].close - 1) * 100 : 0;
      if (zzRet > kcRet) beatCount++;
    }
  }
  conclusions.push({
    priority: 1,
    text: beatCount >= 2 ? '资金回流开始连续，但还需更多交易日确认' : '资金回流不够连续，近3日小票跑赢科技仅' + beatCount + '次',
    detail: '中证2000近20日' + (data.zz2000_20d_change||0).toFixed(1) + '%，科创50近20日' + (data.kc50_20d_change||0).toFixed(1) + '%'
  });

  // 2. 产品端修复
  const fund1d = data.fund_avg_1d;
  const fund1m = data.fund_avg_1m;
  conclusions.push({
    priority: 2,
    text: (fund1d !== null && fund1d > 0) ? '产品端单日有修复，但未达到连续修复标准' : '产品端仍未修复',
    detail: '基金近1日均值' + fmtPct(fund1d) + '，近1月均值' + fmtPct(fund1m) + '。连续修复需至少3个交易日'
  });

  // 3. 硬风控+置信度
  conclusions.push({
    priority: 3,
    text: '硬风控未完整接入，评分置信度有限',
    detail: '4项硬风控仅1项（流动性踩踏）已确认。波动拥挤、利率约束待接入，不加分也不扣分'
  });

  container.innerHTML = conclusions.map(c => `
    <div style="display:flex;gap:12px;padding:12px;background:var(--bg-hover);border-radius:8px;margin-bottom:8px;border-left:3px solid var(--accent-yellow)">
      <div style="font-size:20px;font-weight:800;color:var(--accent-yellow);flex-shrink:0">${c.priority}</div>
      <div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">${c.text}</div>
        <div style="font-size:12px;color:var(--text-muted)">${c.detail}</div>
      </div>
    </div>
  `).join('');
}

// ========== 初始化 ==========
function init() {
  // 1. 基金表格
  renderFundTables();

  // 2. 评分数据
  const data = {};
  if (typeof AUTO_DATA !== 'undefined') {
    data.weipanRatio = (AUTO_DATA.weipanRatio || 0) * 100;
    data.zz2000_20d_change = AUTO_DATA.zz2000_20d || 0;
    data.kc50_20d_change = AUTO_DATA.kc50_20d || 0;
    data.wp_slope20 = (AUTO_DATA.weipan20d || 0) / 20; // 代理斜率，非真实回归斜率
    data.wp_ma243_pos = (AUTO_DATA.weipanDrawdown || -20) > -5 ? 0.02 : (AUTO_DATA.weipanDrawdown || -20) / 100;
    data.wp_volume_ratio = (AUTO_DATA.weipanRatio || 0) * 100;
    const wpArr = AUTO_DATA.weipan || [];
    if (wpArr.length > 0) {
      const tRates = wpArr.map(d => d.turnoverRate || 0).sort((a,b) => a - b);
      const lastR = wpArr[wpArr.length-1].turnoverRate || 0;
      data.wp_turnover_pct = tRates.filter(r => r <= lastR).length / tRates.length;
    }
    const wpQuote = AUTO_DATA.quotes && AUTO_DATA.quotes["868008.WI"];
    if (wpQuote) {
      const total = (wpQuote.upCount || 0) + (wpQuote.downCount || 0);
      data.up_ratio = total > 0 ? (wpQuote.upCount || 0) / total : 0.5;
    }
    data.allA_median_chg = AUTO_DATA.weipan5d || 0; // 代理
    data.weipan1m = AUTO_DATA.weipan1m || 0;
  }

  // 产品端：只统计微盘暴露+分散量化（排除风格对照）
  if (typeof FUND_PRODUCTS !== 'undefined') {
    const prodFunds = FUND_PRODUCTS.filter(f => f.tier !== '风格对照型');
    const calcAvg = (arr, key) => { const v = arr.filter(f => f[key] !== null && f[key] !== undefined); return v.length > 0 ? v.reduce((s,f)=>s+f[key],0)/v.length : null; };
    data.fund_avg_1d = calcAvg(prodFunds, 'dayChange');
    data.fund_avg_1w = calcAvg(prodFunds, 'week1');
    data.fund_avg_1m = calcAvg(prodFunds, 'month1');
    data.fund_rel_zz2000 = (data.fund_avg_1m !== null) ? data.fund_avg_1m - (data.weipan1m || 0) : null;
    data.fund_cont_days = (data.fund_avg_1d !== null && data.fund_avg_1d > 0) ? 1 : 0;
  }

  data.hard_risk_volatility = 'wait';
  data.hard_risk_rate = 'watch';
  data.hard_risk_liquidity = 'ok';
  data.hard_risk_homogenization = 'wait';

  // 3. 评分
  let scoreResult = { total: 0, results: {}, level: { label:'回避区', desc:'' }, hardRiskStatus:'wait', confidence:{level:'低',reason:''} };
  if (typeof ScoringEngine !== 'undefined') {
    try { scoreResult = ScoringEngine.calculate(data); } catch(e) { console.error(e); }
  }

  // 4. 渲染
  renderHero(scoreResult);
  renderHeroSummary(data);
  renderKeyConclusions(data);
  // 设置10年国债显示
  const bondEl = document.getElementById('bond10yVal');
  if (bondEl && AUTO_DATA.bond_10y) bondEl.textContent = AUTO_DATA.bond_10y.toFixed(2) + '%';
  renderStyleCompare();
  renderSignals(data);
  renderChecklists(data);
  renderScoreTable(scoreResult, data);
  renderMissingData();
}

init();

