/**
 * 微盘策略风格回流看板 - 数据获取模块
 * 从通达信MCP获取自动数据，手动数据从localStorage读取
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

  /**
   * 手动数据字段定义
   */
  MANUAL_FIELDS: [
    { key: 'weipan_volume_ratio', label: '微盘成交占比(%)', placeholder: '如0.73', step: '0.01' },
    { key: 'largecap_volume_ratio', label: '大盘成交占比(%)', placeholder: '如54.50', step: '0.01' },
    { key: 'midcap_volume_ratio', label: '中盘成交占比(%)', placeholder: '如30.14', step: '0.01' },
    { key: 'smallcap_volume_ratio', label: '小盘成交占比(%)', placeholder: '如15.36', step: '0.01' },
    { key: 'tmt_volume_ratio', label: 'TMT成交占比(%)', placeholder: '如40.5（如有券商数据）', step: '0.01' },
    { key: 'barra_size_factor', label: 'Barra市值因子(%)', placeholder: '如1.66', step: '0.01' },
    { key: 'weipan_diffusion', label: '微盘扩散指数(%)', placeholder: '如35（上涨家数占比）', step: '0.01' },
    { key: 'fund_nav_change_1d', label: '关注基金近1日涨跌(%)', placeholder: '如0.5', step: '0.01' },
    { key: 'fund_nav_change_5d', label: '关注基金近5日涨跌(%)', placeholder: '如-2.3', step: '0.01' },
    { key: 'fund_nav_change_20d', label: '关注基金近20日涨跌(%)', placeholder: '如-8.1', step: '0.01' },
  ],

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
   * 保存历史快照（每次更新手动数据时自动存一份）
   */
  saveSnapshot(scoreData) {
    const key = 'weipan_snapshots';
    const snapshots = JSON.parse(localStorage.getItem(key) || '[]');
    const today = new Date().toISOString().slice(0, 10);
    // 如果今天已有快照，替换
    const idx = snapshots.findIndex(s => s.date === today);
    const snap = { date: today, ...scoreData, manualData: this.loadManualData() };
    if (idx >= 0) {
      snapshots[idx] = snap;
    } else {
      snapshots.push(snap);
    }
    // 只保留最近60天
    if (snapshots.length > 60) snapshots.splice(0, snapshots.length - 60);
    localStorage.setItem(key, JSON.stringify(snapshots));
  },

  /**
   * 加载历史快照
   */
  loadSnapshots() {
    return JSON.parse(localStorage.getItem('weipan_snapshots') || '[]');
  }
};
