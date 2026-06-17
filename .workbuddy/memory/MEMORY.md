# 微盘量化看板 - 项目记忆

## 评分引擎结构
- scoring.js 是浏览器全局对象 `ScoringEngine`，无 module.exports
- 核心方法：`ScoringEngine.calculate(data)` 返回 `{total, gate, ...}`，`ScoringEngine.getLevel(score, gateStatus)` 返回 `{label, color, desc}`
- 四大模块：风格确认(30) + 资金与拥挤(25) + 市场广度(25) + 产品验证(20)
- Node.js 中验证评分时，需在 vm 中同时加载 auto-data.js 和 scoring.js

## 数据更新脚本 (update-daily.js)
- 基金K线查询窗口=14天（tenDaysAgoCompact），导致 month1(近20日) 始终为 null
- allAMedian 批量5日序列查询经常失败，用单日值兜底（⚠️非致命）
- 基金池6只已接入：320016/004685/519185/002692/006195/003147

## 基金观察池分组表 (2026-06-16 改版)
- 表头列：基金 | 近1日 | T-1日 | T-2日 | 近1周 | 近1月 | 结论
- T-1/T-2 字段：dayChangeT1, dayChangeT2（update-daily.js 中从 prev2/prev3 计算）
- 卡片右上角标注"净值数据日期 + 更新时间"
- 颜色：A股习惯 红=涨/绿=跌

## ⚠️ 关键规则：收盘前禁止运行数据更新
- A股收盘时间：北京时间 15:00
- update-daily.js 在 15:00 前运行会拉到盘中快照（非收盘数据），导致看板显示错误日期/价格
- **手动触发前必须检查当前时间**：只有 15:00 后才能运行
- 已犯错记录：2026-06-17 12:53（盘中）运行脚本，06-17盘中数据被推上线，用户发现后回退

## 自动化任务
- automation-1781496849510：工作日 21:00 执行盘后数据更新+部署（确保已收盘）
- 推送目标：https://xyf-vivi.github.io/weipan-dashboard/
