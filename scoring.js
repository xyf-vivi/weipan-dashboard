/**
 * 微盘策略风格回流看板 - 评分引擎
 */

const ScoringEngine = {
  // 评分规则
  RULES: {
    // 科技抱团降温（满分20分）
    techCooling: {
      weight: 20,
      evaluate(data) {
        // 用科技板块近期涨跌幅 vs 全A判断
        const tech5d = data.tech_5d_change || 0;
        const allA5d = data.allA_5d_change || 0;
        const tmtRatio = data.tmt_volume_ratio;

        let score = 0;
        // 科技5日涨幅低于全A → 降温信号
        if (tech5d < allA5d) score += 10;
        if (tech5d < 0) score += 5;
        // TMT成交占比手动数据
        if (tmtRatio) {
          if (tmtRatio < 35) score += 8;
          else if (tmtRatio < 40) score += 4;
          else if (tmtRatio > 45) score -= 3;
        }
        return Math.min(20, Math.max(0, score));
      }
    },

    // 微盘资金回流（满分25分）
    weipanFlow: {
      weight: 25,
      evaluate(data) {
        const wpRatio = data.weipan_volume_ratio;
        const largeRatio = data.largecap_volume_ratio;
        const zz2000_5d = data.zz2000_5d_change || 0;
        const hs300_5d = data.hs300_5d_change || 0;

        let score = 0;
        // 相对收益：中证2000 vs 沪深300
        const relReturn = zz2000_5d - hs300_5d;
        if (relReturn > 2) score += 10;
        else if (relReturn > 0) score += 5;
        else if (relReturn < -3) score -= 3;

        // 微盘成交占比
        if (wpRatio) {
          if (wpRatio > 1.5) score += 10;
          else if (wpRatio > 1.0) score += 5;
          else score += 2; // 低位有弹性潜力
        } else {
          score += 3; // 无数据给默认观察分
        }

        // 大盘虹吸缓解
        if (largeRatio) {
          if (largeRatio < 45) score += 8;
          else if (largeRatio < 50) score += 4;
          else if (largeRatio > 55) score -= 3;
        }

        return Math.min(25, Math.max(0, score));
      }
    },

    // 风格确认（满分20分）
    styleConfirm: {
      weight: 20,
      evaluate(data) {
        const zz2000_5d = data.zz2000_5d_change || 0;
        const hs300_5d = data.hs300_5d_change || 0;
        const zz2000_20d = data.zz2000_20d_change || 0;
        const hs300_20d = data.hs300_20d_change || 0;

        let score = 0;
        const rel5d = zz2000_5d - hs300_5d;
        const rel20d = zz2000_20d - hs300_20d;

        // 5日相对收益
        if (rel5d > 0) score += 6;
        else score += 1;
        // 20日相对收益
        if (rel20d > 0) score += 8;
        else if (rel20d > -3) score += 3;
        // 都为正 = 确认
        if (rel5d > 0 && rel20d > 0) score += 6;

        return Math.min(20, Math.max(0, score));
      }
    },

    // 扩散改善（满分15分）
    diffusion: {
      weight: 15,
      evaluate(data) {
        const diffusion = data.weipan_diffusion;
        const limitDown = data.limit_down_count;

        let score = 0;
        if (diffusion) {
          if (diffusion > 65) score += 10;
          else if (diffusion > 50) score += 7;
          else if (diffusion > 35) score += 3;
          else score += 0;
        } else {
          score += 3;
        }

        // 跌停少 = 风险缓和
        if (limitDown !== undefined) {
          if (limitDown <= 10) score += 5;
          else if (limitDown <= 30) score += 3;
          else score += 0;
        } else {
          score += 2;
        }

        return Math.min(15, Math.max(0, score));
      }
    },

    // 风险缓和（满分10分）
    riskEase: {
      weight: 10,
      evaluate(data) {
        let score = 5; // 默认中性
        const barraSize = data.barra_size_factor;

        if (barraSize) {
          if (barraSize > 0) score += 3; // 小盘因子正贡献
          else score -= 2;
        }
        // 财报窗口判断（简单用月份）
        const month = new Date().getMonth() + 1;
        if ([5, 6, 7, 9, 10, 11].includes(month)) score += 2; // 非财报高峰期
        if ([1, 4, 8].includes(month)) score -= 2; // 财报高峰期

        return Math.min(10, Math.max(0, score));
      }
    },

    // 产品验证（满分10分）
    fundValidate: {
      weight: 10,
      evaluate(data) {
        const nav1d = data.fund_nav_change_1d;
        const nav5d = data.fund_nav_change_5d;
        const nav20d = data.fund_nav_change_20d;

        let score = 3; // 默认观察分
        if (nav1d !== undefined && nav1d > 0) score += 2;
        if (nav5d !== undefined && nav5d > 0) score += 3;
        if (nav20d !== undefined && nav20d > 0) score += 2;

        return Math.min(10, Math.max(0, score));
      }
    }
  },

  /**
   * 计算总分
   */
  calculate(data) {
    const results = {};
    let total = 0;

    for (const [key, rule] of Object.entries(this.RULES)) {
      const score = rule.evaluate(data);
      results[key] = { score, max: rule.weight };
      total += score;
    }

    const level = this.getLevel(total);
    return { total, results, level };
  },

  /**
   * 根据总分判断状态
   */
  getLevel(score) {
    if (score >= 75) return { label: '友好区', color: '#16a34a', emoji: '🟢🟢', desc: '微盘风格回流较明确，可提高关注度' };
    if (score >= 60) return { label: '试探区', color: '#65a30d', emoji: '🟢', desc: '可小比例、分批观察' };
    if (score >= 40) return { label: '观察区', color: '#ca8a04', emoji: '🟡', desc: '可研究产品，不急着买' };
    return { label: '不适合', color: '#dc2626', emoji: '🔴', desc: '科技虹吸强，微盘弱，不介入' };
  },

  /**
   * 指标红黄绿灯判断
   */
  getTrafficLight(key, value) {
    const lights = {
      tmt_ratio: [
        { threshold: 35, light: 'green', label: '科技降温' },
        { threshold: 42, light: 'yellow', label: '科技仍强' },
        { threshold: Infinity, light: 'red', label: '科技极度拥挤' }
      ],
      weipan_ratio: [
        { threshold: 0.8, light: 'yellow', label: '拥挤度低，但资金未回流' },
        { threshold: 1.2, light: 'green', label: '资金开始试探' },
        { threshold: Infinity, light: 'green', label: '资金回流明显' }
      ],
      largecap_ratio: [
        { threshold: 45, light: 'green', label: '资金扩散' },
        { threshold: 50, light: 'yellow', label: '虹吸缓和' },
        { threshold: Infinity, light: 'red', label: '大盘虹吸强' }
      ],
      rel_5d: [
        { threshold: -3, light: 'red', label: '小盘明显跑输' },
        { threshold: 0, light: 'yellow', label: '小盘略弱' },
        { threshold: Infinity, light: 'green', label: '小盘跑赢' }
      ],
      rel_20d: [
        { threshold: -5, light: 'red', label: '月度风格不利' },
        { threshold: 0, light: 'yellow', label: '月度中性' },
        { threshold: Infinity, light: 'green', label: '月度风格确认' }
      ],
      diffusion: [
        { threshold: 35, light: 'red', label: '少数股票反弹' },
        { threshold: 50, light: 'yellow', label: '修复初期' },
        { threshold: Infinity, light: 'green', label: '扩散改善' }
      ],
      barra_size: [
        { threshold: -0.5, light: 'red', label: '小盘风格不利' },
        { threshold: 0, light: 'yellow', label: '小盘风格偏弱' },
        { threshold: Infinity, light: 'green', label: '小盘风格正贡献' }
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
