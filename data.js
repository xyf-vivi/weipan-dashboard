/**
 * 微盘量化基金配置检查页 - 数据指标定义
 * 按新PRD定稿：指标分层 + 数据类型标注
 */

const DataSource = {
  // 指数代码映射
  INDEX_CODES: {
    'hs300': { code: '000300', setcode: '1', name: '沪深300' },
    'zz1000': { code: '000852', setcode: '1', name: '中证1000' },
    'zz2000': { code: '932000', setcode: '1', name: '中证2000' },
    'gz2000': { code: '399303', setcode: '0', name: '国证2000' },
    'gz1000': { code: '399311', setcode: '0', name: '国证1000' },
    'kc50': { code: '000688', setcode: '1', name: '科创50' },
    'cyb': { code: '399006', setcode: '0', name: '创业板指' },
    'mao': { code: '850082', setcode: '1', name: '茅指数' }
  },

  // 申万行业代码映射（TMT四大行业）
  INDUSTRY_CODES: {
    'electronics': { code: '801080', setcode: '1', name: '申万电子' },
    'telecom': { code: '801770', setcode: '1', name: '申万通信' },
    'computer': { code: '801750', setcode: '1', name: '申万计算机' },
    'media': { code: '801760', setcode: '1', name: '申万传媒' },
  },

  // 全A指数
  ALL_A: { code: '000005', setcode: '1', name: '上证全A' },

  // ============ 指标分层定义 ============
  // 按新PRD定稿，所有指标必须标注数据类型

  /**
   * 前台必须展示的指标
   */
  FRONT_DISPLAY: [
    { key: 'current_status', label: '当前状态', dataType: 'manual', desc: '观察区/试探区/信号较强/回避区' },
    { key: 'signal_score', label: '信号评分', dataType: 'auto', desc: '0-100分' },
    { key: 'hard_risk_status', label: '硬风控状态', dataType: 'manual', desc: '触发/观察/未见明显触发项' },
    { key: 'style_signal', label: '风格是否站回微盘', dataType: 'auto', desc: '未完全确认/已确认' },
    { key: 'fund_signal', label: '资金和拥挤是否健康', dataType: 'estimate', desc: '偏黄/健康/过热' },
    { key: 'quant_signal', label: '市场是否适合量化赚钱', dataType: 'auto', desc: '部分改善/友好/不友好' },
    { key: 'product_signal', label: '产品端是否开始确认', dataType: 'auto', desc: '仍在修复/开始确认' },
    { key: 'add_signal_count', label: '确认信号完成度', dataType: 'auto', desc: '满足几项' },
    { key: 'tomorrow_focus', label: '明天重点看什么', dataType: 'manual', desc: '观察清单' }
  ],

  /**
   * 后台评分模型使用的指标
   */
  BACKEND_SCORING: [
    // 硬风控
    { key: 'volatility_crowding', label: '波动率拥挤度', dataType: 'wait', desc: '待接入' },
    { key: 'rate_constraint', label: '10年国债风控口径', dataType: 'lowfreq', desc: '低频观察' },
    { key: 'liquidity_trample', label: '流动性踩踏', dataType: 'auto', desc: '跌停家数' },
    { key: 'product_homogenization', label: '持仓重叠度', dataType: 'lowfreq', desc: '低频观察' },

    // 风格方向
    { key: 'zz2000_vs_kc50', label: '中证2000/科创50', dataType: 'auto', desc: '指数K线' },
    { key: 'wp_vs_mao', label: '微盘/茅指数相对净值', dataType: 'estimate', desc: '估算代理' },
    { key: 'wp_ma243', label: '243日均线', dataType: 'auto', desc: '指数K线' },
    { key: 'wp_slope20', label: '20日斜率', dataType: 'auto', desc: '指数K线' },

    // 拥挤与流动性
    { key: 'wp_volume_ratio', label: '微盘成交额占比', dataType: 'auto', desc: '万得微盘指数成交额/全A成交额' },
    { key: 'small_volume_ratio', label: '小票成交占比', dataType: 'auto', desc: '中证2000+国证2000成交占比' },
    { key: 'turnover_pct', label: '换手率分位', dataType: 'estimate', desc: '估算代理' },
    { key: 'rel_turnover', label: '相对换手率', dataType: 'estimate', desc: '估算代理' },
    { key: 'avg_volume', label: '日均成交额', dataType: 'auto', desc: '近20日均值' },

    // 量化友好度
    { key: 'up_ratio', label: '上涨家数占比', dataType: 'auto', desc: '自动更新' },
    { key: 'allA_median', label: '全A中位数涨跌幅', dataType: 'auto', desc: '自动更新' },
    { key: 'market_concentration', label: '市场集中度', dataType: 'estimate', desc: '估算代理' },
    { key: 'volume_concentration', label: '成交集中度', dataType: 'estimate', desc: '估算代理' },
    { key: 'cross_section', label: '横截面分化度代理', dataType: 'estimate', desc: '估算代理' },

    // 产品验证
    { key: 'fund_nav_1d', label: '观察池基金近1日收益', dataType: 'auto', desc: '基金净值' },
    { key: 'fund_nav_1w', label: '观察池基金近1周收益', dataType: 'auto', desc: '基金净值' },
    { key: 'fund_nav_1m', label: '观察池基金近1月收益', dataType: 'auto', desc: '基金净值' },
    { key: 'fund_rel_zz2000', label: '相对中证2000超额', dataType: 'auto', desc: '基金净值vs指数' },
    { key: 'fund_cont_days', label: '连续修复天数', dataType: 'auto', desc: '基金净值' }
  ],

  /**
   * 折叠说明区展示的指标
   */
  FOLD_EXPLANATION: [
    { key: 'volatility_crowding_detail', label: '波动率拥挤度口径', dataType: 'wait', desc: '待接入' },
    { key: 'rate_detail', label: '10年国债风控口径', dataType: 'lowfreq', desc: '低频观察' },
    { key: 'm1_ma6', label: 'M1六个月均线', dataType: 'lowfreq', desc: '宏观数据，低频' },
    { key: 'pb_pct', label: 'PB分位', dataType: 'lowfreq', desc: '估值数据，低频' },
    { key: 'wp_pb_ratio', label: '微盘/小盘估值比', dataType: 'estimate', desc: '估算代理' },
    { key: 'ic_factor', label: '量价因子IC', dataType: 'lowfreq', desc: '因子数据，低频' },
    { key: 'volume_diff', label: '成交分化度B', dataType: 'estimate', desc: '估算代理' },
    { key: 'holdings_overlap', label: '持仓重叠度', dataType: 'lowfreq', desc: '基金季报，低频' },
    { key: 'fund_size_total', label: '基金规模合计', dataType: 'lowfreq', desc: '基金季报，低频' },
    { key: 'gamma_decay', label: 'γ收益衰减', dataType: 'lowfreq', desc: '模型估算，低频' },
    { key: 'nav_index_diff', label: '净值/指数分化度', dataType: 'estimate', desc: '估算代理' }
  ],

  /**
   * 暂不进入日频主评分的指标
   */
  NOT_DAILY: [
    'holdings_overlap',
    'fund_size_total',
    'gamma_decay',
    'nav_index_diff',
    'ic_factor',
    'm1_ma6'
  ],

  // ============ 手动数据字段定义（含数据类型） ============
  MANUAL_FIELDS: [
    // 硬风控（部分待接入）
    { key: 'hard_risk_volatility', label: '波动率拥挤度', placeholder: '待接入', step: '0.01', dataType: 'wait', layer: 'hard_risk' },
    { key: 'hard_risk_rate', label: '利率约束', placeholder: '观察', step: '0.01', dataType: 'lowfreq', layer: 'hard_risk' },
    { key: 'hard_risk_liquidity', label: '流动性踩踏', placeholder: '未见明显触发', step: '1', dataType: 'auto', layer: 'hard_risk' },
    { key: 'hard_risk_homogenization', label: '产品同质化', placeholder: '低频观察', step: '0.01', dataType: 'lowfreq', layer: 'hard_risk' },

    // 风格方向
    { key: 'zz2000_20d_change', label: '中证2000近20日涨跌幅(%)', placeholder: '如-3.5', step: '0.01', dataType: 'auto', layer: 'style' },
    { key: 'kc50_20d_change', label: '科创50近20日涨跌幅(%)', placeholder: '如8.2', step: '0.01', dataType: 'auto', layer: 'style' },
    { key: 'wp_mao_rel', label: '微盘/茅指数相对净值', placeholder: '待接入', step: '0.01', dataType: 'wait', layer: 'style' },
    { key: 'wp_ma243_pos', label: '243日均线位置', placeholder: '待接入', step: '0.01', dataType: 'wait', layer: 'style' },
    { key: 'wp_slope20', label: '微盘20日斜率', placeholder: '待接入', step: '0.01', dataType: 'wait', layer: 'style' },

    // 拥挤与流动性
    { key: 'wp_volume_ratio', label: '微盘成交额占比(%)', placeholder: '如0.73', step: '0.01', dataType: 'auto', layer: 'crowding' },
    { key: 'small_volume_ratio', label: '小票成交占比(%)', placeholder: '如15.36', step: '0.01', dataType: 'auto', layer: 'crowding' },
    { key: 'turnover_pct', label: '换手率分位', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'crowding' },
    { key: 'rel_turnover', label: '相对换手率', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'crowding' },
    { key: 'wp_avg_volume', label: '微盘日均成交额(亿)', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'crowding' },

    // 量化友好度
    { key: 'up_ratio', label: '上涨家数占比(%)', placeholder: '如55', step: '0.01', dataType: 'auto', layer: 'friendly' },
    { key: 'allA_median_chg', label: '全A中位数涨跌幅(%)', placeholder: '如0.3', step: '0.01', dataType: 'auto', layer: 'friendly' },
    { key: 'market_concentration', label: '市场集中度', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'friendly' },
    { key: 'volume_concentration', label: '成交集中度', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'friendly' },
    { key: 'cross_section_diff', label: '横截面分化度代理', placeholder: '估算', step: '0.01', dataType: 'estimate', layer: 'friendly' },

    // 产品验证
    { key: 'fund_avg_1d', label: '观察池基金平均近1日收益(%)', placeholder: '如0.5', step: '0.01', dataType: 'auto', layer: 'product' },
    { key: 'fund_avg_1w', label: '观察池基金平均近1周收益(%)', placeholder: '如-1.2', step: '0.01', dataType: 'auto', layer: 'product' },
    { key: 'fund_avg_1m', label: '观察池基金平均近1月收益(%)', placeholder: '如-5.8', step: '0.01', dataType: 'auto', layer: 'product' },
    { key: 'fund_rel_zz2000', label: '观察池基金相对中证2000超额(%)', placeholder: '如-2.3', step: '0.01', dataType: 'auto', layer: 'product' },
    { key: 'fund_cont_days', label: '观察池基金连续修复天数', placeholder: '如2', step: '1', dataType: 'auto', layer: 'product' }
  ],

  /**
   * 数据类型说明
   */
  DATA_TYPE_EXPLAIN: {
    'auto': '自动更新：从Wind/天天基金自动获取',
    'estimate': '估算代理：用相关指标估算，仅供参考',
    'manual': '手动维护：需要人工判断或输入',
    'lowfreq': '低频观察：更新频率低，适合趋势判断',
    'wait': '待接入：数据接口准备中'
  },

  /**
   * 保存手动数据到localStorage
   */
  saveManualData(data) {
    const toSave = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('weipan_manual_data', JSON.stringify(toSave));
  },

  /**
   * 读取手动数据
   */
  loadManualData() {
    const raw = localStorage.getItem('weipan_manual_data');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  },

  /**
   * 获取指标的数据类型标签HTML
   */
  getDataTypeTag(dataType) {
    const cls = {
      'auto': 'tag-green',
      'estimate': 'tag-yellow',
      'manual': 'tag-blue',
      'lowfreq': 'tag-gray',
      'wait': 'tag-gray'
    };
    const label = {
      'auto': '自动更新',
      'estimate': '估算代理',
      'manual': '手动维护',
      'lowfreq': '低频观察',
      'wait': '待接入'
    };
    const c = cls[dataType] || 'tag-gray';
    const l = label[dataType] || dataType;
    return `<span class="data-type-tag ${c}">${l}</span>`;
  }
};
