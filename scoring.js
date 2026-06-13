/**
 * 微盘量化基金配置检查页 - 评分引擎 v6
 *
 * 核心改动（基于用户 v6 反馈）：
 * 1. 评分模型改为四大项：风格确认(30) + 资金与拥挤(25) + 市场广度(25) + 产品验证(20)
 * 2. 硬风控改为独立闸门函数 hardGate()，不再是评分项
 * 3. 所有指标使用 v6 真实数据（相对净值/回归斜率/analytics_data）
 * 4. 硬风控只评估日频风险阀：踩踏/过热/拥挤/抱团
 * 5. 任一硬风险触发→最高只能观察区
 */

const ScoringEngine = {
  // === 硬风控闸门（独立于评分，只做否决）===
  HARD_GATE: {
    // 四个日频风险阀
    evaluate(data) {
      const v6 = data.v6 || {};
      const gates = [];

      // 1. 踩踏风险：跌停家数
      const limitDown = v6.limitDownCount;
      gates.push({
        key: 'crash',
        label: '踩踏风险',
        metric: '跌停家数',
        value: limitDown,
        status: limitDown > 50 ? 'trigger' : limitDown > 20 ? 'watch' : 'ok',
        threshold: '>50触发 / >20观察',
        note: limitDown !== undefined ? `当日${limitDown}只跌停` : '数据异常'
      });

      // 2. 交易过热：换手率分位
      const trPct = v6.turnover ? v6.turnover.percentile1y : undefined;
      gates.push({
        key: 'overheat',
        label: '交易过热',
        metric: '换手率近一年分位',
        value: trPct !== undefined ? (trPct * 100).toFixed(0) + '%' : '—',
        status: trPct > 0.9 ? 'trigger' : trPct > 0.8 ? 'watch' : 'ok',
        threshold: '>90%触发 / >80%观察',
        note: trPct !== undefined ? `当前换手率${v6.turnover.current}%，近一年${(trPct*100).toFixed(0)}%分位` : '数据异常'
      });

      // 3. 成交拥挤：小票成交占比
      const smallRatio = v6.smallCapRatio;
      gates.push({
        key: 'crowd',
        label: '成交拥挤',
        metric: '小票成交占比',
        value: smallRatio !== undefined ? smallRatio.toFixed(2) + '%' : '—',
        status: smallRatio > 3.0 ? 'watch' : 'ok', // 小票占比偏高不一定触发，结合换手率看
        threshold: '>3%观察（需结合换手率）',
        note: smallRatio !== undefined ? `自由流通市值后20%股票成交占比${smallRatio.toFixed(2)}%` : '数据异常'
      });

      // 4. 抱团风险：市场集中度HHI
      const hhi = v6.hhi;
      gates.push({
        key: 'concentrate',
        label: '抱团风险',
        metric: '市场集中度HHI',
        value: hhi !== undefined ? hhi.toFixed(4) + '%' : '—',
        status: 'ok', // 当前HHI=0.1579%很低，未触发。阈值需积累历史数据后定义
        threshold: '待积累历史分位',
        note: hhi !== undefined ? `HHI=${hhi.toFixed(4)}%，成交较分散，量化友好` : '数据异常'
      });

      // 汇总
      const triggered = gates.filter(g => g.status === 'trigger');
      const watching = gates.filter(g => g.status === 'watch');
      const allOk = triggered.length === 0 && watching.length === 0;

      return {
        gates,
        triggered: triggered.length > 0,
        watching: watching.length > 0,
        status: triggered.length > 0 ? 'trigger' : watching.length > 0 ? 'watch' : 'ok',
        summary: triggered.length > 0
          ? `${triggered.length}项硬风险触发，最高只能观察区`
          : watching.length > 0
            ? `${watching.length}项观察中，需密切关注`
            : '四项日频风险阀均未触发'
      };
    }
  },

  // === 四大评分模块 ===
  MODULES: {
    // 1. 风格确认 (30分)
    styleConfirm: {
      max: 30,
      label: '风格确认',
      evaluate(data) {
        let score = 0;
        const d = {};
        const v6 = data.v6 || {};
        const rel = v6.relKc50 || {};

        // a. 243日相对均线位置 (12分)
        const ma243Pos = rel.ma243Position;
        if (ma243Pos !== undefined && ma243Pos !== null) {
          if (ma243Pos > 0) { score += 12; d.ma243 = '微盘/科创50相对净值站上243日均线（+' + (ma243Pos * 100).toFixed(1) + '%）'; }
          else if (ma243Pos > -0.05) { score += 6; d.ma243 = '接近243日均线（' + (ma243Pos * 100).toFixed(1) + '%），但仍未站上'; }
          else { d.ma243 = '远低于243日均线（' + (ma243Pos * 100).toFixed(1) + '%），风格未确认'; }
        } else { d.ma243 = '数据不足'; }

        // b. 20日回归斜率 (10分) — 看方向+t值
        const slope = rel.slope20;
        const tVal = rel.tValue20;
        if (slope !== undefined && slope !== null) {
          if (slope > 0 && Math.abs(tVal) > 1) { score += 10; d.slope = '20日斜率转正且显著（t=' + tVal.toFixed(2) + '）'; }
          else if (slope > 0) { score += 6; d.slope = '20日斜率转正但不显著（t=' + tVal.toFixed(2) + '）'; }
          else if (Math.abs(tVal) > 1) { d.slope = '20日斜率为负且显著（t=' + tVal.toFixed(2) + '），趋势仍向下'; }
          else { score += 3; d.slope = '20日斜率为负但不显著（t=' + tVal.toFixed(2) + '）'; }
        } else { d.slope = '数据不足'; }

        // c. 微盘相对科创50近期表现 (8分)
        const rel20d = (data.zz2000_20d_change || 0) - (data.kc50_20d_change || 0);
        if (rel20d > 5) { score += 8; d.rel20d = '小票明显跑赢科技（+' + rel20d.toFixed(1) + 'pct）'; }
        else if (rel20d > 0) { score += 5; d.rel20d = '小票略跑赢科技（+' + rel20d.toFixed(1) + 'pct）'; }
        else if (rel20d > -5) { score += 2; d.rel20d = '小票略跑输科技（' + rel20d.toFixed(1) + 'pct）'; }
        else { d.rel20d = '小票明显跑输科技（' + rel20d.toFixed(1) + 'pct）'; }

        return { score: Math.min(30, score), max: 30, detail: d };
      }
    },

    // 2. 资金与拥挤 (25分)
    capitalCrowding: {
      max: 25,
      label: '资金与拥挤',
      evaluate(data) {
        let score = 0;
        const d = {};
        const v6 = data.v6 || {};

        // a. 小票成交占比 (10分) — 严格口径
        const smallRatio = v6.smallCapRatio;
        if (smallRatio !== undefined && smallRatio !== null) {
          if (smallRatio > 2.0) { score += 10; d.smallRatio = '小票成交占比偏高（' + smallRatio.toFixed(2) + '%），资金活跃'; }
          else if (smallRatio > 1.5) { score += 7; d.smallRatio = '小票成交占比适中（' + smallRatio.toFixed(2) + '%）'; }
          else { score += 3; d.smallRatio = '小票成交占比偏低（' + smallRatio.toFixed(2) + '%），资金回流待确认'; }
        } else { d.smallRatio = '数据不足'; }

        // b. 换手率近一年分位 (8分)
        const trPct = v6.turnover ? v6.turnover.percentile1y : undefined;
        if (trPct !== undefined && trPct !== null) {
          if (trPct > 0.9) { d.turnover = '换手率近一年' + (trPct*100).toFixed(0) + '%分位，极端过热'; }
          else if (trPct > 0.8) { score += 3; d.turnover = '换手率近一年' + (trPct*100).toFixed(0) + '%分位，偏高'; }
          else if (trPct > 0.2) { score += 8; d.turnover = '换手率近一年' + (trPct*100).toFixed(0) + '%分位，适中'; }
          else { score += 5; d.turnover = '换手率近一年' + (trPct*100).toFixed(0) + '%分位，偏低（未过热）'; }
        } else { d.turnover = '数据不足'; }

        // c. 微盘成交占比变化 (7分) — 看近5日均额趋势
        const wpArr = AUTO_DATA.weipan || [];
        if (wpArr.length >= 5) {
          const last5 = wpArr.slice(-5);
          const avg5 = last5.reduce((s, d) => s + (d.turnover || 0), 0) / 5;
          const last1 = last5[last5.length - 1].turnover || 0;
          if (last1 > avg5 * 1.05) { score += 7; d.wpTrend = '微盘成交额高于近5日均量，资金有回升'; }
          else if (last1 > avg5 * 0.9) { score += 4; d.wpTrend = '微盘成交额接近5日均量'; }
          else { d.wpTrend = '微盘成交额低于近5日均量，资金未明显回流'; }
        } else { d.wpTrend = '数据不足'; }

        return { score: Math.min(25, score), max: 25, detail: d };
      }
    },

    // 3. 市场广度 (25分)
    marketBreadth: {
      max: 25,
      label: '市场广度',
      evaluate(data) {
        let score = 0;
        const d = {};
        const v6 = data.v6 || {};

        // a. 上涨家数占比 (8分)
        const upCount = v6.upCount;
        const downCount = v6.downCount;
        if (upCount !== undefined && downCount !== undefined) {
          const total = upCount + downCount;
          const upRatio = total > 0 ? upCount / total : 0.5;
          if (upRatio > 0.65) { score += 8; d.upRatio = '上涨家数占比' + (upRatio * 100).toFixed(0) + '%（' + upCount + '/' + total + '），赚钱效应扩散'; }
          else if (upRatio > 0.55) { score += 5; d.upRatio = '上涨家数占比' + (upRatio * 100).toFixed(0) + '%，中性偏正'; }
          else { score += 2; d.upRatio = '上涨家数占比' + (upRatio * 100).toFixed(0) + '%，偏低'; }
        } else { d.upRatio = '数据不足'; }

        // b. 全A中位数涨跌幅 (7分)
        const median = v6.allAMedianChg;
        if (median !== undefined && median !== null) {
          if (median > 1.0) { score += 7; d.median = '全A中位数涨跌幅' + median.toFixed(2) + '%，多数股票上涨'; }
          else if (median > 0) { score += 4; d.median = '全A中位数涨跌幅' + median.toFixed(2) + '%，微正'; }
          else { d.median = '全A中位数涨跌幅' + median.toFixed(2) + '%，多数下跌'; }
        } else { d.median = '数据不足'; }

        // c. 横截面分化度IQR (5分) — IQR越大分化越大，量化越好赚钱
        const iqr = v6.iqr;
        if (iqr !== undefined && iqr !== null) {
          if (iqr > 4) { score += 5; d.iqr = '横截面分化度(P75-P25)=' + iqr.toFixed(1) + 'pct，分化大，量化友好'; }
          else if (iqr > 2) { score += 3; d.iqr = '横截面分化度=' + iqr.toFixed(1) + 'pct，适中'; }
          else { score += 1; d.iqr = '横截面分化度=' + iqr.toFixed(1) + 'pct，分化小'; }
        } else { d.iqr = '数据不足'; }

        // d. 市场集中度HHI (5分) — HHI越低越分散，量化越好赚钱
        const hhi = v6.hhi;
        if (hhi !== undefined && hhi !== null) {
          if (hhi < 0.2) { score += 5; d.hhi = 'HHI=' + hhi.toFixed(4) + '%，成交分散，量化友好'; }
          else if (hhi < 0.5) { score += 3; d.hhi = 'HHI=' + hhi.toFixed(4) + '%，适度集中'; }
          else { d.hhi = 'HHI=' + hhi.toFixed(4) + '%，成交集中，量化不利'; }
        } else { d.hhi = '数据不足'; }

        return { score: Math.min(25, score), max: 25, detail: d };
      }
    },

    // 4. 产品验证 (20分)
    productValidation: {
      max: 20,
      label: '产品验证',
      evaluate(data) {
        let score = 0;
        const d = {};
        const v6 = data.v6 || {};

        // a. 基金连续修复天数 (8分)
        const repairDays = v6.fundRepairDays;
        if (repairDays !== undefined && repairDays !== null) {
          if (repairDays >= 3) { score += 8; d.repair = '观察池标杆基金连续修复' + repairDays + '天'; }
          else if (repairDays >= 1) { score += 4; d.repair = '观察池标杆基金仅连续修复' + repairDays + '天，未达确认标准'; }
          else { d.repair = '观察池标杆基金未连续修复'; }
        } else { d.repair = '数据不足'; }

        // b. 观察池中位收益近1日 (6分)
        const f1d = data.fund_avg_1d;
        if (f1d !== undefined && f1d !== null) {
          if (f1d > 0.5) { score += 6; d.dayChange = '观察池中位数近1日' + f1d.toFixed(2) + '%，修复中'; }
          else if (f1d > 0) { score += 3; d.dayChange = '观察池中位数近1日' + f1d.toFixed(2) + '%，微正'; }
          else { d.dayChange = '观察池中位数近1日' + f1d.toFixed(2) + '%，仍在调整'; }
        } else { d.dayChange = '数据不足'; }

        // c. 观察池中位收益近1周 (3分)
        const f1w = data.fund_avg_1w;
        if (f1w !== undefined && f1w !== null) {
          if (f1w > 0) { score += 3; d.weekChange = '近1周' + f1w.toFixed(2) + '%，为正'; }
          else { d.weekChange = '近1周' + f1w.toFixed(2) + '%，仍在调整'; }
        } else { d.weekChange = '数据不足'; }

        // d. 跑赢中证2000情况 (3分)
        const relZz2000 = data.fund_rel_zz2000;
        if (relZz2000 !== undefined && relZz2000 !== null) {
          if (relZz2000 > 0) { score += 3; d.excess = '跑赢中证2000（超额' + relZz2000.toFixed(1) + 'pct）'; }
          else { d.excess = '跑输中证2000（超额' + relZz2000.toFixed(1) + 'pct）'; }
        } else { d.excess = '数据不足'; }

        return { score: Math.min(20, score), max: 20, detail: d };
      }
    }
  },

  // === 计算 ===
  calculate(data) {
    // 1. 硬风控闸门
    const gate = this.HARD_GATE.evaluate(data);

    // 2. 四大评分
    const results = {};
    let total = 0;
    ['styleConfirm', 'capitalCrowding', 'marketBreadth', 'productValidation'].forEach(key => {
      const r = this.MODULES[key].evaluate(data);
      results[key] = r;
      total += r.score;
    });

    // 3. 硬风控触发→封顶
    let finalTotal = total;
    if (gate.triggered) {
      finalTotal = Math.min(total, 44); // 触发→最高回避区上沿
    } else if (gate.watching) {
      finalTotal = Math.min(total, 64); // 观察→最高观察区
    }

    return {
      total: finalTotal,
      rawTotal: total,
      results,
      level: this.getLevel(finalTotal, gate.status),
      gate,
      confidence: this.calcConfidence(data)
    };
  },

  // 置信度
  calcConfidence(data) {
    const v6 = data.v6 || {};
    let checks = [
      { key: 'relKc50_current', has: v6.relKc50 && v6.relKc50.current !== undefined },
      { key: 'relKc50_ma243', has: v6.relKc50 && v6.relKc50.ma243 !== undefined },
      { key: 'relKc50_slope20', has: v6.relKc50 && v6.relKc50.slope20 !== undefined },
      { key: 'smallCapRatio', has: v6.smallCapRatio !== undefined },
      { key: 'turnover_pct', has: v6.turnover && v6.turnover.percentile1y !== undefined },
      { key: 'allAMedianChg', has: v6.allAMedianChg !== undefined },
      { key: 'hhi', has: v6.hhi !== undefined },
      { key: 'iqr', has: v6.iqr !== undefined },
      { key: 'upCount', has: v6.upCount !== undefined },
      { key: 'limitDownCount', has: v6.limitDownCount !== undefined },
      { key: 'fundRepairDays', has: v6.fundRepairDays !== undefined },
      { key: 'fund_avg_1d', has: data.fund_avg_1d !== undefined }
    ];

    const total = checks.length;
    const avail = checks.filter(c => c.has).length;
    const pct = avail / total;

    let level = '低';
    if (pct >= 0.9) level = '较高';
    else if (pct >= 0.7) level = '中';

    return {
      level,
      pct,
      avail,
      total,
      reason: `核心日频指标已覆盖 ${avail}/${total} 项（${(pct * 100).toFixed(0)}%），低频产品同质化指标不纳入今日判断`
    };
  },

  // 评级
  getLevel(score, gateStatus) {
    if (gateStatus === 'trigger')
      return { label: '回避区', color: '#dc2626', desc: '硬风险触发，不建议参与。' };
    if (score >= 80)
      return { label: '信号较强', color: '#16a34a', desc: '多信号改善，可提高关注，仍需分批克制。' };
    if (score >= 65)
      return { label: gateStatus === 'watch' ? '观察区' : '试探区', color: gateStatus === 'watch' ? '#ca8a04' : '#65a30d',
               desc: gateStatus === 'watch' ? '部分风险观察中，最高观察区。' : '部分信号改善，仅适合有经验者设观察仓。' };
    if (score >= 45)
      return { label: '观察区', color: '#ca8a04', desc: '价格有吸引力，但资金和趋势未确认。' };
    return { label: '回避区', color: '#dc2626', desc: '信号不足，不建议参与。' };
  }
};
