/**
 * 微盘量化基金配置检查页 - 评分引擎 v3
 *
 * 核心改动：
 * 1. 硬风控待接入不默认给高分，数据不足降低置信度
 * 2. small_volume_ratio / market_concentration 无数据不纳入评分
 * 3. 产品端验证只统计"微盘暴露型"和"分散量化型"，排除风格对照
 * 4. 每个模块输出 dataType 和 detail 用于评分表展示
 */

const ScoringEngine = {
  // === 硬风控指标定义 ===
  HARD_RISK: {
    volatility: { label: '波动拥挤', dataType: 'wait',   defaultStatus: 'wait' },
    rate:       { label: '利率约束', dataType: 'lowfreq', defaultStatus: 'watch' },
    liquidity:  { label: '流动性踩踏', dataType: 'auto',  defaultStatus: 'ok' },
    homogenization: { label: '产品同质化', dataType: 'lowfreq', defaultStatus: 'wait' }
  },

  RULES: {
    // === 硬风控（权重：闸门）===
    hardRisk: {
      max: 20,
      evaluate(data) {
        let triggerCount = 0, watchCount = 0, okCount = 0, waitCount = 0;

        ['hard_risk_volatility', 'hard_risk_rate', 'hard_risk_liquidity', 'hard_risk_homogenization'].forEach(k => {
          const s = data[k];
          if (s === 'trigger') triggerCount++;
          else if (s === 'watch') watchCount++;
          else if (s === 'ok') okCount++;
          else waitCount++; // wait 或未设置
        });

        // 触发 → 直接回避区
        if (triggerCount > 0) return { status: 'trigger', score: 0, max: 20 };

        // 待接入项不给分；只给已确认ok的项加分
        // 每个ok项给5分（最多4项=20分），每个watch项给2分，wait项给0分
        let score = okCount * 5 + watchCount * 2;
        const status = watchCount > 0 ? 'watch' : (okCount > 0 ? 'ok' : 'wait');
        return { status, score: Math.min(20, score), max: 20, detail: { triggerCount, watchCount, okCount, waitCount } };
      }
    },

    // === 风格方向（25分）===
    styleDirection: {
      max: 25,
      evaluate(data) {
        let score = 0;
        const details = {};

        // 中证2000 vs 科创50 近20日相对强弱
        const zz = data.zz2000_20d_change;
        const kc = data.kc50_20d_change;
        if (zz !== undefined && kc !== undefined) {
          const rel = zz - kc;
          if (rel > 5) { score += 10; details.rel20d = '小票明显跑赢'; }
          else if (rel > 0) { score += 6; details.rel20d = '小票略跑赢'; }
          else if (rel > -5) { score += 3; details.rel20d = '小票略跑输'; }
          else { details.rel20d = '小票明显跑输'; }
        }

        // 20日斜率（代理）
        const slope = data.wp_slope20;
        if (slope !== undefined) {
          if (slope > 0) { score += 8; details.slope = '斜率为正'; }
          else if (slope > -0.5) { score += 4; details.slope = '斜率接近零'; }
          else { details.slope = '斜率为负'; }
        }

        // 243日均线位置（代理）
        const ma = data.wp_ma243_pos;
        if (ma !== undefined) {
          if (ma > 0) { score += 7; details.ma243 = '均线之上'; }
          else if (ma > -0.1) { score += 3; details.ma243 = '接近均线'; }
          else { details.ma243 = '远低于均线'; }
        }

        return { score: Math.min(25, score), max: 25, detail: details };
      }
    },

    // === 拥挤与流动性（20分）===
    crowdingLiquidity: {
      max: 20,
      evaluate(data) {
        let score = 0;
        const details = {};

        // 微盘成交占比（已接入）
        const wpRatio = data.wp_volume_ratio;
        if (wpRatio !== undefined && wpRatio !== null) {
          if (wpRatio > 1.2) { score += 8; details.wpRatio = '占比偏高(>1.2%)'; }
          else if (wpRatio > 0.8) { score += 5; details.wpRatio = '占比适中'; }
          else { score += 2; details.wpRatio = '占比偏低'; }
        } else {
          details.wpRatio = '待接入';
        }

        // 小票成交占比（无真实数据，不纳入）
        details.smallRatio = '待接入，不纳入今日评分';

        // 换手率分位（有数据时纳入）
        const tp = data.wp_turnover_pct;
        if (tp !== undefined && tp !== null) {
          if (tp > 0 && tp < 0.8) { score += 5; details.turnover = '分位适中'; }
          else if (tp >= 0.8 && tp < 0.95) { score += 2; details.turnover = '分位偏高'; }
          else { details.turnover = '分位极端'; }
        } else {
          details.turnover = '待接入';
        }

        return { score: Math.min(20, score), max: 20, detail: details };
      }
    },

    // === 量化友好度（20分）===
    quantFriendliness: {
      max: 20,
      evaluate(data) {
        let score = 0;
        const details = {};

        // 上涨家数占比（已接入）
        const upR = data.up_ratio;
        if (upR !== undefined && upR !== null) {
          if (upR > 0.6) { score += 8; details.upRatio = '占比>60%，赚钱效应扩散'; }
          else if (upR > 0.5) { score += 5; details.upRatio = '占比50-60%，中性'; }
          else { score += 2; details.upRatio = '占比<50%，偏低'; }
        } else {
          details.upRatio = '待接入';
        }

        // 全A中位数涨跌幅（代理）
        const med = data.allA_median_chg;
        if (med !== undefined && med !== null) {
          if (med > 0) { score += 5; details.median = '中位数为正'; }
          else if (med > -0.5) { score += 2; details.median = '中位数略负'; }
          else { details.median = '中位数为负'; }
        } else {
          details.median = '待接入';
        }

        // 市场集中度（无真实数据，不纳入）
        details.concentration = '待接入，不纳入今日评分';

        return { score: Math.min(20, score), max: 20, detail: details };
      }
    },

    // === 产品验证（15分）===
    // ⚠️ 只统计微盘暴露型 + 分散量化型，排除风格对照型
    productVerification: {
      max: 15,
      evaluate(data) {
        let score = 0;
        const details = {};

        const f1d = data.fund_avg_1d; // 只含微盘暴露+分散量化
        const f1w = data.fund_avg_1w;
        const f1m = data.fund_avg_1m;
        const rel = data.fund_rel_zz2000;

        if (f1d !== undefined && f1d !== null && f1d > 0) { score += 3; details.dayChange = '近1日为正'; }
        else if (f1d !== undefined && f1d !== null) { details.dayChange = '近1日为负'; }
        else { details.dayChange = '待接入'; }

        if (f1w !== undefined && f1w !== null && f1w > 0) { score += 4; details.weekChange = '近1周为正'; }
        else if (f1w !== undefined && f1w !== null) { details.weekChange = '近1周为负'; }
        else { details.weekChange = '待接入'; }

        if (f1m !== undefined && f1m !== null && f1m > -5) { score += 3; details.monthChange = '近1月跌幅<5%'; }
        else if (f1m !== undefined && f1m !== null) { details.monthChange = '近1月跌幅>5%'; }
        else { details.monthChange = '待接入'; }

        if (rel !== undefined && rel !== null && rel > 0) { score += 3; details.excess = '跑赢基准'; }
        else if (rel !== undefined && rel !== null) { details.excess = '跑输基准'; }
        else { details.excess = '待接入'; }

        details.note = '仅统计微盘暴露型+分散量化型，排除风格对照型';

        return { score: Math.min(15, score), max: 15, detail: details };
      }
    }
  },

  // 模块数据类型标签
  MODULE_INFO: {
    hardRisk: { label: '硬风控', dataType: 'wait', meaning: '有没有不能碰的风险',
      included: '流动性踩踏（已接入）', excluded: '波动拥挤、利率约束、产品同质化（待接入/低频观察，4项中仅1项已确认）' },
    styleDirection: { label: '风格方向', dataType: 'proxy', meaning: '微盘有没有重新占优',
      included: '中证2000 vs 科创50相对强弱（真实）、20日代理斜率、243日均线代理', excluded: '微盘/茅指数相对净值（待接入）、真实回归斜率（待接入）' },
    crowdingLiquidity: { label: '拥挤与流动性', dataType: 'proxy', meaning: '资金是否健康回流',
      included: '微盘成交占比（真实）、换手率分位（样本内28日，精度有限）', excluded: '小票成交占比（待接入）、相对换手率（待接入）' },
    quantFriendliness: { label: '量化友好度', dataType: 'proxy', meaning: '市场是否适合分散量化赚钱',
      included: '上涨家数占比（真实）、全A中位数（微盘近5日代理，精度有限）', excluded: '市场集中度、横截面分化度（待接入）' },
    productVerification: { label: '产品验证', dataType: 'auto', meaning: '基金净值是否确认',
      included: '微盘暴露型+分散量化型基金均值（真实，有效样本有限）', excluded: '风格对照型不参与产品验证评分' }
  },

  // 计算
  calculate(data) {
    const results = {};
    const hardRisk = this.RULES.hardRisk.evaluate(data);
    results.hardRisk = hardRisk;

    if (hardRisk.status === 'trigger') {
      return { total: 0, results, level: this.getLevel(0, 'trigger'), hardRiskStatus: 'trigger', confidence: this.calcConfidence(data) };
    }

    let total = hardRisk.score;
    ['styleDirection', 'crowdingLiquidity', 'quantFriendliness', 'productVerification'].forEach(key => {
      const r = this.RULES[key].evaluate(data);
      results[key] = r;
      total += r.score;
    });

    return {
      total,
      results,
      level: this.getLevel(total, hardRisk.status),
      hardRiskStatus: hardRisk.status,
      confidence: this.calcConfidence(data)
    };
  },

  // 评分置信度 — 区分真实数据和代理数据，硬风控未完整接入时降低置信度
  calcConfidence(data) {
    let realTotal = 0, realAvail = 0;
    let proxyTotal = 0, proxyAvail = 0;

    const realChecks = [
      { has: data.zz2000_20d_change !== undefined, weight: 15 },
      { has: data.kc50_20d_change !== undefined, weight: 10 },
      { has: data.wp_volume_ratio !== undefined, weight: 10 },
      { has: data.up_ratio !== undefined, weight: 15 },
      { has: data.fund_avg_1d !== undefined, weight: 15 },
      { has: data.hard_risk_liquidity !== undefined && data.hard_risk_liquidity !== 'wait', weight: 10 }
    ];
    realChecks.forEach(c => { realTotal += c.weight; if (c.has) realAvail += c.weight; });

    const proxyChecks = [
      { has: data.wp_turnover_pct !== undefined, weight: 10, label: '换手率分位（样本内）' },
      { has: data.allA_median_chg !== undefined, weight: 10, label: '全A中位数（代理）' }
    ];
    proxyChecks.forEach(c => { proxyTotal += c.weight; if (c.has) proxyAvail += c.weight; });

    // 硬风控完整度惩罚：4项中多少是wait
    let hardRiskWaitCount = 0;
    ['hard_risk_volatility', 'hard_risk_rate', 'hard_risk_homogenization'].forEach(k => {
      if (data[k] === 'wait' || data[k] === undefined) hardRiskWaitCount++;
    });

    const realPct = realTotal > 0 ? realAvail / realTotal : 0;
    const proxyPct = proxyTotal > 0 ? proxyAvail / proxyTotal : 0;

    // 硬风控不完整时降低置信度
    let adjustedPct = realPct;
    if (hardRiskWaitCount >= 2) adjustedPct = realPct * 0.75;

    let level = '低', reason = '';
    const hrNote = hardRiskWaitCount > 0 ? `，硬风控4项中${hardRiskWaitCount}项待接入` : '';
    if (adjustedPct >= 0.8) {
      level = '较高';
      reason = '真实数据覆盖率' + (realPct*100).toFixed(0) + '%，代理数据' + (proxyPct*100).toFixed(0) + '%' + hrNote;
    } else if (adjustedPct >= 0.5) {
      level = '中';
      reason = '真实数据覆盖率' + (realPct*100).toFixed(0) + '%（部分缺失），代理数据' + (proxyPct*100).toFixed(0) + '%' + hrNote;
    } else {
      level = '低';
      reason = '真实数据覆盖率仅' + (realPct*100).toFixed(0) + '%' + hrNote;
    }
    return { level, realPct, proxyPct, adjustedPct, reason };
  },

  getLevel(score, hardRiskStatus) {
    if (hardRiskStatus === 'trigger')
      return { label: '回避区', color: '#dc2626', desc: '硬风控触发，不建议参与。' };
    if (hardRiskStatus === 'watch' && score > 65)
      return { label: '观察区', color: '#ca8a04', desc: '硬风控观察中，最高只能观察区。' };
    if (score >= 80) return { label: '信号较强', color: '#16a34a', desc: '多信号改善，可提高关注，仍需分批克制。' };
    if (score >= 65) return { label: '试探区', color: '#65a30d', desc: '部分信号改善，仅适合有经验者设观察仓。' };
    if (score >= 45) return { label: '观察区', color: '#ca8a04', desc: '价格有吸引力，但资金和趋势未确认。' };
    return { label: '回避区', color: '#dc2626', desc: '信号不足，不建议参与。' };
  }
};
