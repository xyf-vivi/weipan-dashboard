/**
 * 微盘量化基金配置检查页 - 评分引擎
 * 按PRD定稿重构：硬风控闸门 + 五大评分模块
 *
 * 字段名规范（init() 必须按此命名传入 data）：
 *   wp_volume_ratio     万得微盘成交额占全A成交额，百分比形式（如 0.81 表示 0.81%）
 *   small_volume_ratio  小票成交占比，百分比形式（如 16 表示 16%）— 无真实数据时不设此字段
 *   weipan_spread       微盘上涨家数占比，小数（如 0.80 表示 80%）
 *   zz2000_20d_change   中证2000近20日涨跌幅，百分比形式
 *   kc50_20d_change     科创50近20日涨跌幅，百分比形式
 *   wp_slope20          微盘20日斜率，百分比形式（近似涨跌幅/20）
 *   wp_ma243_pos        微盘相对243日均线位置，小数
 *   wp_mao_rel          微盘/茅指数相对净值，百分比形式
 *   wp_turnover_pct     微盘换手率历史分位，0~1小数
 *   wp_rel_turnover     微盘相对均值的换手率倍数
 *   up_ratio            上涨家数占比，0~1小数
 *   allA_median_chg     全A中位数涨跌幅，百分比形式
 *   market_concentration 市场集中度，0~1小数（无真实数据时不设此字段）
 *   fund_avg_1d/1w/1m   观察池基金近1日/1周/1月平均收益，百分比形式
 *   fund_rel_zz2000     基金相对中证2000超额，百分比形式
 *   fund_cont_days      连续修复天数，整数
 *   hard_risk_*         硬风控状态：'ok' / 'watch' / 'trigger'
 *
 * 数据类型标注（用于评分拆解表展示）：
 *   auto    = 已纳入今日评分（自动更新真实数据）
 *   proxy   = 代理纳入（用近似指标估算，标注"估算代理"）
 *   wait    = 待接入，不纳入今日评分
 *   lowfreq = 低频观察，不参与日频评分
 */

const ScoringEngine = {
  // 硬风控指标（状态闸门，不是加权项）
  HARD_RISK: {
    volatility: {
      label: '波动拥挤',
      status: 'wait',
      explain: '待接入',
      dataType: 'wait'
    },
    rate: {
      label: '利率约束',
      status: 'watch',
      explain: '观察',
      dataType: 'lowfreq'
    },
    liquidity: {
      label: '流动性踩踏',
      status: 'ok',
      explain: '未见明显触发',
      dataType: 'auto'
    },
    homogenization: {
      label: '产品同质化',
      status: 'wait',
      explain: '低频观察',
      dataType: 'lowfreq'
    }
  },

  // 各模块的数据类型标注（用于评分拆解表）
  MODULE_DATA_TYPES: {
    hardRisk: 'wait',
    styleDirection: 'auto',
    crowdingLiquidity: 'proxy',
    quantFriendliness: 'auto',
    productVerification: 'auto'
  },

  // 评分规则（满分100）
  RULES: {
    // 硬风控（20分）- 但实际上是闸门，这里只做评估
    hardRisk: {
      weight: 20,
      dataType: 'wait',
      evaluate(data) {
        let triggerCount = 0;
        let watchCount = 0;

        if (data.hard_risk_volatility === 'trigger') triggerCount++;
        else if (data.hard_risk_volatility === 'watch') watchCount++;

        if (data.hard_risk_rate === 'trigger') triggerCount++;
        else if (data.hard_risk_rate === 'watch') watchCount++;

        if (data.hard_risk_liquidity === 'trigger') triggerCount++;
        else if (data.hard_risk_liquidity === 'watch') watchCount++;

        if (data.hard_risk_homogenization === 'trigger') triggerCount++;
        else if (data.hard_risk_homogenization === 'watch') watchCount++;

        if (triggerCount > 0) return { status: 'trigger', score: 0, max: 20 };
        if (watchCount > 0) return { status: 'watch', score: 12, max: 20 };
        return { status: 'ok', score: 20, max: 20 };
      }
    },

    // 风格方向（25分）
    styleDirection: {
      weight: 25,
      dataType: 'auto',
      evaluate(data) {
        let score = 0;

        // 中证2000 vs 科创50 近20日相对强弱
        const zz2000_20d = data.zz2000_20d_change || 0;
        const kc50_20d = data.kc50_20d_change || 0;
        const rel20d = zz2000_20d - kc50_20d;

        // 243日均线位置（代理）
        const ma243_pos = data.wp_ma243_pos || -0.15;

        // 20日斜率
        const slope20 = data.wp_slope20 || 0;

        // 评分逻辑
        if (rel20d > 5) score += 10;
        else if (rel20d > 0) score += 6;
        else if (rel20d > -5) score += 3;

        if (slope20 > 0) score += 8;
        else if (slope20 > -0.5) score += 4;

        if (ma243_pos > 0) score += 7;
        else if (ma243_pos > -0.1) score += 3;

        return { score: Math.min(25, score), max: 25 };
      }
    },

    // 拥挤与流动性（20分）
    crowdingLiquidity: {
      weight: 20,
      dataType: 'proxy',
      evaluate(data) {
        let score = 0;

        // 微盘成交额占比（百分比形式，如 0.81 表示 0.81%）
        const wpVolRatio = data.wp_volume_ratio;

        // 小票成交占比（百分比形式，如 16 表示 16%）
        // 无真实数据时不纳入评分
        const smallVolRatio = data.small_volume_ratio;

        // 换手率分位
        const turnoverPct = data.wp_turnover_pct;

        // 微盘成交占比评分（最多8分）
        if (wpVolRatio !== undefined && wpVolRatio !== null) {
          if (wpVolRatio > 1.2) score += 8;
          else if (wpVolRatio > 0.8) score += 5;
          else score += 2;
        }

        // 小票成交占比评分（最多7分）— 只在有真实数据时纳入
        // 不能用微盘成交占比代替
        if (smallVolRatio !== undefined && smallVolRatio !== null) {
          if (smallVolRatio > 18) score += 7;
          else if (smallVolRatio > 15) score += 4;
          else score += 1;
        }

        // 换手率分位：适中最好（最多5分）
        if (turnoverPct !== undefined && turnoverPct !== null) {
          if (turnoverPct > 0 && turnoverPct < 0.8) score += 5;
          else if (turnoverPct >= 0.8 && turnoverPct < 0.95) score += 2;
        }

        return { score: Math.min(20, score), max: 20 };
      }
    },

    // 量化友好度（20分）
    quantFriendliness: {
      weight: 20,
      dataType: 'auto',
      evaluate(data) {
        let score = 0;

        // 上涨家数占比（0~1）
        const upRatio = data.up_ratio;

        // 全A中位数涨跌幅（百分比）
        const medianChg = data.allA_median_chg;

        // 市场集中度（0~1）— 无真实数据时不纳入
        const concentration = data.market_concentration;

        // 上涨家数占比（最多8分）
        if (upRatio !== undefined && upRatio !== null) {
          if (upRatio > 0.6) score += 8;
          else if (upRatio > 0.5) score += 5;
          else if (upRatio > 0.4) score += 2;
        }

        // 全A中位数涨跌幅（最多5分）
        if (medianChg !== undefined && medianChg !== null) {
          if (medianChg > 0) score += 5;
          else if (medianChg > -0.5) score += 2;
        }

        // 市场集中度（最多7分）— 只在有真实数据时纳入
        if (concentration !== undefined && concentration !== null) {
          if (concentration < 0.3) score += 7;
          else if (concentration < 0.5) score += 3;
        }

        return { score: Math.min(20, score), max: 20 };
      }
    },

    // 产品验证（15分）
    productVerification: {
      weight: 15,
      dataType: 'auto',
      evaluate(data) {
        let score = 0;

        const fund1d = data.fund_avg_1d;
        const fund1w = data.fund_avg_1w;
        const fund1m = data.fund_avg_1m;
        const relZZ2000 = data.fund_rel_zz2000;
        const contDays = data.fund_cont_days || 0;

        if (fund1d !== undefined && fund1d !== null && fund1d > 0) score += 3;
        if (fund1w !== undefined && fund1w !== null && fund1w > 0) score += 4;
        if (fund1m !== undefined && fund1m !== null && fund1m > -5) score += 3;

        if (relZZ2000 !== undefined && relZZ2000 !== null && relZZ2000 > 0) score += 3;

        if (contDays >= 3) score += 2;

        return { score: Math.min(15, score), max: 15 };
      }
    }
  },

  /**
   * 计算总分（带硬风控闸门）
   */
  calculate(data) {
    const results = {};
    let total = 0;
    let hardRiskStatus = 'ok';

    // 先评估硬风控
    const hardRisk = this.RULES.hardRisk.evaluate(data);
    results.hardRisk = hardRisk;
    hardRiskStatus = hardRisk.status;

    // 如果硬风控触发，直接返回回避区
    if (hardRiskStatus === 'trigger') {
      return {
        total: hardRisk.score,
        results,
        level: this.getLevel(0, 'trigger'),
        hardRiskStatus: 'trigger'
      };
    }

    // 计算其他模块
    const modules = ['styleDirection', 'crowdingLiquidity', 'quantFriendliness', 'productVerification'];
    for (const key of modules) {
      const rule = this.RULES[key];
      const result = rule.evaluate(data);
      results[key] = result;
      total += result.score;
    }

    // 加上硬风控分数
    total += hardRisk.score;

    let level = this.getLevel(total, hardRiskStatus);

    return { total, results, level, hardRiskStatus };
  },

  /**
   * 根据总分和硬风控状态判断等级
   */
  getLevel(score, hardRiskStatus) {
    if (hardRiskStatus === 'trigger') {
      return { label: '回避区', color: '#dc2626', emoji: '🔴', desc: '信号不足，风险未释放。不建议参与微盘量化基金。' };
    }

    if (hardRiskStatus === 'watch' && score > 65) {
      return { label: '观察区', color: '#ca8a04', emoji: '🟡', desc: '硬风控观察中，最高只能观察区。可以观察，不适合追涨或重仓。' };
    }

    if (score >= 80) {
      return { label: '信号较强', color: '#16a34a', emoji: '🟢', desc: '可以提高关注，但仍需分批、克制、控制风险。' };
    }
    if (score >= 65) {
      return { label: '试探区', color: '#65a30d', emoji: '🔵', desc: '部分信号开始改善，但仍未完全确认。仅适合有经验投资者设置观察仓。' };
    }
    if (score >= 45) {
      return { label: '观察区', color: '#ca8a04', emoji: '🟡', desc: '价格已有吸引力，但资金和趋势尚未确认。可以观察，不适合追涨或重仓。' };
    }
    return { label: '回避区', color: '#dc2626', emoji: '🔴', desc: '信号不足，风险未释放。不建议参与微盘量化基金。' };
  },

  /**
   * 数据类型标注（用于评分拆解表）
   */
  DATA_TYPE_LABELS: {
    auto: { label: '已纳入今日评分', color: '#22c55e' },
    proxy: { label: '估算代理', color: '#eab308' },
    wait: { label: '待接入，不纳入今日评分', color: '#64748b' },
    lowfreq: { label: '低频观察，不参与日频评分', color: '#64748b' }
  }
};
