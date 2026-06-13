/**
 * 微盘策略风格回流看板 - 数据注入脚本
 * 用法：在WorkBuddy对话中运行，通过tdx-connector拉取数据后注入到看板
 * 
 * 运行方式：
 * 1. 先打开 index.html 预览
 * 2. 在对话中让AI执行此脚本拉取数据并注入
 */

// 这个文件是AI注入数据时的参考脚本
// 实际数据拉取通过MCP tdx-connector完成

const KLINE_CONFIG = [
  { key: 'zz2000', code: '932000', setcode: '1', name: '中证2000' },
  { key: 'hs300', code: '000300', setcode: '1', name: '沪深300' },
  { key: 'zz1000', code: '000852', setcode: '1', name: '中证1000' },
  { key: 'kc50', code: '000688', setcode: '1', name: '科创50' },
  { key: 'cyb', code: '399006', setcode: '0', name: '创业板指' },
  { key: 'gz2000', code: '399303', setcode: '0', name: '国证2000' },
  // TMT行业
  { key: 'electronics', code: '801080', setcode: '1', name: '申万电子' },
  { key: 'telecom', code: '801770', setcode: '1', name: '申万通信' },
  { key: 'computer', code: '801750', setcode: '1', name: '申万计算机' },
  { key: 'media', code: '801760', setcode: '1', name: '申万传媒' },
  // 全A
  { key: 'allA', code: '000005', setcode: '1', name: '上证全A' },
];

// 导出配置供AI对话使用
if (typeof module !== 'undefined') module.exports = { KLINE_CONFIG };
