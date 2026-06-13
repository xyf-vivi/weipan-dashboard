/**
 * 微盘量化基金配置检查页 - 评分引擎
 * 按新PRD定稿重构：硬风控闸门 + 五大评分模块
 */

const ScoringEngine = {
  // 硬风控指标（状态闸门，不是加权项）
  HARD_RISK: {
    // 波动率拥挤度
    volatility: {
      key: 'volatility_crowding',
      label: '波动拥挤',
      status: 'wait', // wait/ok/watch/trigger
      explain: '待接入'
    },
    // 利率约束
    rate: {
      key: 'rate_constraint',
      label: '利率约束',
      status: 'watch',
      explain: '观察'
    },
    // 流动性踩踏
    liquidity: {
      key: 'liquidity_trample',
      label: '流动性踩踏',
      status: 'ok',
      explain: '未见明显触发'
    },
    // 产品同质化
    homogenization: {
      key: 'product_homogenization',
      label: '产品同质化',
      status: 'wait',
      explain: '低频观察'
    }
  },

  // 评分规则（满分100）
  RULES: {
    // 硬风控（20分）- 但实际上是闸门，这里只做评估
    hardRisk: {
      weight: 20,
      evaluate(data) {
        // 硬风控不是简单加分，而是判断状态
        const risks = ScoringEngine.HARD_RISK;
        let triggerCount = 0;
        let watchCount = 0;
        
        // 从数据中读取硬风控状态
        if (data.hard_risk_volatility === 'trigger') triggerCount++;
        else if (data.hard_risk_volatility === 'watch') watchCount++;
        
        if (data.hard_risk_rate === 'trigger') triggerCount++;
        else if (data.hard_risk_rate === 'watch') watchCount++;
        
        if (data.hard_risk_liquidity === 'trigger') triggerCount++;
        else if (data.hard_risk_liquidity === 'watch') watchCount++;
        
        if (data.hard_risk_homogenization === 'trigger') triggerCount++;
        else if (data.hard_risk_homogenization === 'watch') watchCount++;
        
        // 返回：trigger/watch/ok
        if (triggerCount > 0) return { status: 'trigger', score: 0, max: 20 };
        if (watchCount > 0) return { status: 'watch', score: 12, max: 20 };
        return { status: 'ok', score: 20, max: 20 };
      }
    },

    // 风格方向（25分）
    styleDirection: {
      weight: 25,
      evaluate(data) {
        let score = 0;
        
        // 中证2000 vs 科创50 近20日相对强弱
        const zz2000_20d = data.zz2000_20d_change || 0;
        const kc50_20d = data.kc50_20d_change || 0;
        const rel20d = zz2000_20d - kc50_20d;
        
        // 微盘/茅指数相对净值（如果有）
        const wpMao_rel = data.wp_mao_rel || 0;
        
        // 243日均线位置
        const ma243_pos = data.wp_ma243_pos || 0;
        
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
      evaluate(data) {
        let score = 0;
        
        // 微盘成交额占比
        const wpVolRatio = data.wp_volume_ratio || 0;
        
        // 小票成交占比
        const smallVolRatio = data.small_volume_ratio || 0;
        
        // 换手率分位
        const turnoverPct = data.wp_turnover_pct || 0;
        
        // 相对换手率
        const relTurnover = data.wp_rel_turnover || 0;
        
        // 日均成交额
        const avgVol = data.wp_avg_volume || 0;
        
        // 评分逻辑
        if (wpVolRatio > 0) {
          if (wpVolRatio > 1.2) score += 8;
          else if (wpVolRatio > 0.8) score += 5;
          else score += 2;
        }
        
        if (smallVolRatio > 0) {
          if (smallVolRatio > 18) score += 7;
          else if (smallVolRatio > 15) score += 4;
          else score += 1;
        }
        
        // 换手率分位：适中最好
        if (turnoverPct > 0 && turnoverPct < 0.8) score += 5;
        else if (turnoverPct >= 0.8 && turnoverPct < 0.95) score += 2;
        
        return { score: Math.min(20, score), max: 20 };
      }
    },

    // 量化友好度（20分）
    quantFriendliness: {
      weight: 20,
      evaluate(data) {
        let score = 0;
        
        // 上涨家数占比
        const upRatio = data.up_ratio || 0;
        
        // 全A中位数涨跌幅
        const medianChg = data.allA_median_chg || 0;
        
        // 市场集中度
        const concentration = data.market_concentration || 0;
        
        // 成交集中度
        const volConcentration = data.volume_concentration || 0;
        
        // 横截面分化度代理
        const crossSection = data.cross_section_diff || 0;
        
        // 评分逻辑
        if (upRatio > 0.6) score += 8;
        else if (upRatio > 0.5) score += 5;
        else if (upRatio > 0.4) score += 2;
        
        if (medianChg > 0) score += 5;
        else if (medianChg > -0.5) score += 2;
        
        // 集中度低 = 友好
        if (concentration > 0 && concentration < 0.3) score += 7;
        else if (concentration >= 0.3 && concentration < 0.5) score += 3;
        
        return { score: Math.min(20, score), max: 20 };
      }
    },

    // 产品验证（15分）
    productVerification: {
      weight: 15,
      evaluate(data) {
        let score = 0;
        
        // 观察池基金近1日收益
        const fund1d = data.fund_avg_1d || 0;
        
        // 近1周收益
        const fund1w = data.fund_avg_1w || 0;
        
        // 近1月收益
        const fund1m = data.fund_avg_1m || 0;
        
        // 相对中证2000超额
        const relZZ2000 = data.fund_rel_zz2000 || 0;
        
        // 连续修复天数
        const contDays = data.fund_cont_days || 0;
        
        // 评分逻辑
        if (fund1d > 0) score += 3;
        if (fund1w > 0) score += 4;
        if (fund1m > -5) score += 3;
        
        if (relZZ2000 > 0) score += 3;
        
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
    
    // 如果硬风控观察，最高只能观察区
    let level = this.getLevel(total, hardRiskStatus);
    
    return { total, results, level, hardRiskStatus };
  },

  /**
   * 根据总分和硬风控状态判断等级
   */
  getLevel(score, hardRiskStatus) {
    // 硬风控触发 → 直接回避区
    if (hardRiskStatus === 'trigger') {
      return { label: '回避区', color: '#dc2626', emoji: '🔴', desc: '信号不足，风险未释放。不建议参与微盘量化基金。' };
    }
    
    // 硬风控观察 → 最高只能观察区
    if (hardRiskStatus === 'watch' && score > 65) {
      return { label: '观察区', color: '#ca8a04', emoji: '🟡', desc: '硬风控观察中，最高只能观察区。可以观察，不适合追涨或重仓。' };
    }
    
    // 正常判断
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
   * 获取硬风控状态描述
   */
  getHardRiskDesc(status) {
    const descs = {
      'trigger': '硬风控触发：直接回避区',
      'watch': '硬风控观察：最高只能观察区',
      'ok': '硬风控未见明显触发项：再根据分数判断'
    };
    return descs[status] || '未知';
  },

  /**
   * 获取指标状态灯
   */
  getTrafficLight(key, value) {
    const lights = {
      zz2000_vs_kc50: [
        { threshold: -3, light: 'red', label: '小盘明显跑输' },
        { threshold: 0, light: 'yellow', label: '小盘略弱' },
        { threshold: Infinity, light: 'green', label: '小盘跑赢' }
      ],
      small_vol_ratio: [
        { threshold: 12, light: 'red', label: '资金未回流' },
        { threshold: 15, light: 'yellow', label: '资金略回升' },
        { threshold: Infinity, light: 'green', label: '资金健康回流' }
      ],
      up_ratio: [
        { threshold: 0.4, light: 'red', label: '赚钱效应弱' },
        { threshold: 0.5, light: 'yellow', label: '赚钱效应改善' },
        { threshold: Infinity, light: 'green', label: '赚钱效应强' }
      ],
      fund_nav: [
        { threshold: -1, light: 'red', label: '基金净值未修复' },
        { threshold: 0, light: 'yellow', label: '基金净值企稳' },
        { threshold: Infinity, light: 'green', label: '基金净值跟随修复' }
      ]
    };
    
    const rules = lights[key];
    if (!rules || value === undefined || value === null) return { light: 'gray', label: '数据缺失' };
    const match = rules.find(r => value < r.threshold);
    return match || { light: 'green', label: '正常' };
  }
};
