// ========================================
// 微盘策略风格回流看板 - 自动数据
// 数据来源：Wind金融数据服务
// 更新时间：2026-06-12 收盘
// ========================================

const AUTO_DATA = {
  // 更新时间戳
  updateTime: "2026-06-12 15:30",

  // === 万得微盘股指数 (868008.WI) 日K线 ===
  // 字段: date, open, close, high, low, turnover(成交额/元), volume(成交股数), turnoverRate(换手率%)
  weipan: [
    {date:"2026-05-06", open:627602.76, close:628257.43, high:630815.59, low:624039.54, turnover:41784397700, volume:3967534000, turnoverRate:4.56},
    {date:"2026-05-07", open:627840.80, close:631215.86, high:635206.54, low:627840.80, turnover:36236608700, volume:3423959600, turnoverRate:3.94},
    {date:"2026-05-08", open:631362.42, close:639510.75, high:639581.37, low:630737.31, turnover:34511041900, volume:3144826700, turnoverRate:3.62},
    {date:"2026-05-11", open:642040.93, close:645222.30, high:646033.22, low:638503.63, turnover:34708157700, volume:3032568800, turnoverRate:3.65},
    {date:"2026-05-12", open:644904.87, close:634550.83, high:646040.03, low:632471.85, turnover:31137189900, volume:2767434600, turnoverRate:3.33},
    {date:"2026-05-13", open:635618.50, close:636074.67, high:639641.37, low:632791.27, turnover:31782520600, volume:2769364600, turnoverRate:3.33},
    {date:"2026-05-14", open:637941.16, close:632126.05, high:639943.31, low:630155.18, turnover:31554462100, volume:2751704500, turnoverRate:3.31},
    {date:"2026-05-15", open:632606.19, close:627993.87, high:636582.98, low:623522.70, turnover:32347920100, volume:2834557400, turnoverRate:3.41},
    {date:"2026-05-18", open:628462.38, close:634467.03, high:634947.59, low:623198.64, turnover:32098537900, volume:2785585300, turnoverRate:3.35},
    {date:"2026-05-19", open:635642.69, close:636799.02, high:641595.60, low:628741.94, turnover:30280071300, volume:2540066300, turnoverRate:3.05},
    {date:"2026-05-20", open:636430.26, close:630522.70, high:636430.26, low:625332.17, turnover:28570711100, volume:2448842200, turnoverRate:2.94},
    {date:"2026-05-21", open:631907.60, close:607762.65, high:637492.29, low:606285.39, turnover:36456373800, volume:3239299800, turnoverRate:3.89},
    {date:"2026-05-22", open:611034.23, close:621161.08, high:624525.45, low:603787.76, turnover:30480742800, volume:2781574600, turnoverRate:3.34},
    {date:"2026-05-25", open:622796.65, close:611766.88, high:628339.98, low:604991.30, turnover:33985343300, volume:3038604800, turnoverRate:3.65},
    {date:"2026-05-26", open:610655.00, close:597421.70, high:610706.37, low:591127.18, turnover:31953938800, volume:2921609400, turnoverRate:3.51},
    {date:"2026-05-27", open:596488.66, close:581495.40, high:596661.72, low:575139.20, turnover:30163316700, volume:2839217900, turnoverRate:3.41},
    {date:"2026-05-28", open:580052.90, close:583931.34, high:588643.41, low:570169.25, turnover:27754033600, volume:2652412800, turnoverRate:3.18},
    {date:"2026-05-29", open:584567.21, close:567678.92, high:588473.54, low:563957.63, turnover:30603540200, volume:3011854200, turnoverRate:3.61},
    {date:"2026-06-01", open:565495.77, close:585189.20, high:589666.30, low:563107.98, turnover:31772954700, volume:3165716300, turnoverRate:3.79},
    {date:"2026-06-02", open:586074.17, close:570541.34, high:586982.90, low:566236.73, turnover:29654482500, volume:2955608700, turnoverRate:3.54},
    {date:"2026-06-03", open:570672.58, close:563966.62, high:570888.44, low:559125.38, turnover:26525993400, volume:2632232200, turnoverRate:3.15},
    {date:"2026-06-04", open:561191.20, close:554393.39, high:565316.38, low:550073.49, turnover:24969497900, volume:2497591500, turnoverRate:2.99},
    {date:"2026-06-05", open:554206.80, close:563683.53, high:570942.56, low:546341.05, turnover:28886762100, volume:2827582500, turnoverRate:3.39},
    {date:"2026-06-08", open:551897.47, close:548575.81, high:566247.18, low:540057.88, turnover:29378263400, volume:2857113900, turnoverRate:3.42},
    {date:"2026-06-09", open:552580.48, close:552903.83, high:558085.50, low:545202.38, turnover:26214854300, volume:2488995200, turnoverRate:2.98},
    {date:"2026-06-10", open:549714.34, close:547807.36, high:554127.84, low:537115.81, turnover:26002520600, volume:2493816500, turnoverRate:2.98},
    {date:"2026-06-11", open:543781.48, close:539763.86, high:547045.41, low:531003.76, turnover:24198054900, volume:2323590900, turnoverRate:2.78},
    {date:"2026-06-12", open:544454.85, close:544778.23, high:550479.69, low:535745.52, turnover:26089752300, volume:2580745200, turnoverRate:3.08}
  ],

  // === 沪深300 (000300.SH) 日K线 ===
  hs300: [
    {date:"2026-05-06", open:4857.65, close:4877.09, high:4892.80, low:4834.28, turnover:881744311600},
    {date:"2026-05-07", open:4895.80, close:4900.51, high:4901.86, low:4866.87, turnover:787236200000},
    {date:"2026-05-08", open:4871.12, close:4871.91, high:4887.21, low:4849.99, turnover:716546104100},
    {date:"2026-05-11", open:4902.28, close:4951.84, high:4960.40, low:4889.57, turnover:904479321900},
    {date:"2026-05-12", open:4965.02, close:4948.05, high:4971.30, low:4926.79, turnover:819351442600},
    {date:"2026-05-13", open:4919.42, close:4998.34, high:5001.12, low:4919.42, turnover:823173197900},
    {date:"2026-05-14", open:5027.64, close:4914.60, high:5030.52, low:4913.60, turnover:857446326200},
    {date:"2026-05-15", open:4911.62, close:4859.59, high:4935.62, low:4832.69, turnover:887687426900},
    {date:"2026-05-18", open:4836.33, close:4833.52, high:4868.60, low:4806.15, turnover:733452822600},
    {date:"2026-05-19", open:4818.71, close:4852.88, high:4854.52, low:4773.53, turnover:712401049900},
    {date:"2026-05-20", open:4829.61, close:4850.70, high:4866.21, low:4825.64, turnover:729653332800},
    {date:"2026-05-21", open:4886.24, close:4783.10, high:4937.93, low:4780.71, turnover:891936347900},
    {date:"2026-05-22", open:4818.84, close:4845.10, high:4851.35, low:4785.35, turnover:771823300800},
    {date:"2026-05-25", open:4873.20, close:4921.60, high:4922.44, low:4857.13, turnover:861179421800},
    {date:"2026-05-26", open:4900.12, close:4947.85, high:4952.74, low:4892.68, turnover:899094487800},
    {date:"2026-05-27", open:4940.95, close:4908.17, high:4974.21, low:4891.34, turnover:909011906900},
    {date:"2026-05-28", open:4889.27, close:4914.21, high:4922.33, low:4843.23, turnover:819897918900},
    {date:"2026-05-29", open:4937.51, close:4892.12, high:4954.07, low:4878.79, turnover:942236490000},
    {date:"2026-06-01", open:4897.90, close:4844.26, high:4918.79, low:4836.69, turnover:823984849000},
    {date:"2026-06-02", open:4860.61, close:4914.56, high:4930.28, low:4832.00, turnover:806751344300},
    {date:"2026-06-03", open:4921.34, close:4938.81, high:4991.85, low:4904.90, turnover:906047729400},
    {date:"2026-06-04", open:4897.32, close:4904.75, high:4938.78, low:4889.75, turnover:736143410000},
    {date:"2026-06-05", open:4886.96, close:4816.92, high:4924.34, low:4798.91, turnover:839863796300},
    {date:"2026-06-08", open:4703.77, close:4713.64, high:4779.86, low:4677.57, turnover:761046395100},
    {date:"2026-06-09", open:4743.45, close:4801.81, high:4802.50, low:4715.39, turnover:713286998800},
    {date:"2026-06-10", open:4753.12, close:4748.59, high:4786.52, low:4718.99, turnover:694628416000},
    {date:"2026-06-11", open:4730.07, close:4722.41, high:4766.17, low:4685.50, turnover:653931756200},
    {date:"2026-06-12", open:4784.64, close:4777.32, high:4809.86, low:4757.56, turnover:871477325200}
  ],

  // === 中证2000 (932000.CSI) 日K线（Wind MCP数据） ===
  // 注意：中证2000代码为 932000.CSI，不是 000905.SH（那是中证500）
  // 中证2000是小票环境代理指标，不等于万得微盘指数
  zz2000: [
    {date:"2026-05-06", open:8441.34, close:8588.44, high:8621.35, low:8441.34, turnover:635607537700, volume:27464745200, changeRate:2.441},
    {date:"2026-05-07", open:8637.84, close:8696.8, high:8700.34, low:8598.71, turnover:620440650700, volume:27099417900, changeRate:2.4086},
    {date:"2026-05-08", open:8638.84, close:8694.17, high:8706.33, low:8616.22, turnover:609002654300, volume:27114353500, changeRate:2.4098},
    {date:"2026-05-11", open:8771.18, close:8839.74, high:8863.77, low:8716.45, turnover:709124529100, volume:28833019600, changeRate:2.5577},
    {date:"2026-05-12", open:8856.18, close:8785.98, high:8856.18, low:8736.42, turnover:633557984200, volume:26987096800, changeRate:2.3939},
    {date:"2026-05-13", open:8730.91, close:8918.24, high:8925.88, low:8730.91, turnover:637052785900, volume:25409688800, changeRate:2.254},
    {date:"2026-05-14", open:8952.95, close:8670.16, high:8956.66, low:8670.16, turnover:658225134800, volume:28950256600, changeRate:2.5681},
    {date:"2026-05-15", open:8676.62, close:8536.34, high:8717.09, low:8473.04, turnover:643023956600, volume:27096176200, changeRate:2.4037},
    {date:"2026-05-18", open:8493.02, close:8554.24, high:8606.41, low:8472.42, turnover:559260917300, volume:23109341700, changeRate:2.05},
    {date:"2026-05-19", open:8524.15, close:8627.95, high:8633.06, low:8416.52, turnover:571306974400, volume:24386882000, changeRate:2.163},
    {date:"2026-05-20", open:8581.39, close:8656.31, high:8681.72, low:8552.43, turnover:574479528700, volume:23041869700, changeRate:2.0433},
    {date:"2026-05-21", open:8703.17, close:8419.84, high:8790.38, low:8406.29, turnover:687607693400, volume:27948915800, changeRate:2.4785},
    {date:"2026-05-22", open:8473.61, close:8576.94, high:8591.15, low:8414.94, turnover:556432683500, volume:22161039100, changeRate:1.9652},
    {date:"2026-05-25", open:8631.21, close:8703.89, high:8705.2, low:8543.89, turnover:629332990000, volume:23505289000, changeRate:2.0844},
    {date:"2026-05-26", open:8665.44, close:8658.62, high:8673.21, low:8529.67, turnover:647239450000, volume:24710784400, changeRate:2.1904},
    {date:"2026-05-27", open:8659.22, close:8530.98, high:8722.58, low:8491.32, turnover:676927953500, volume:25911673400, changeRate:2.2968},
    {date:"2026-05-28", open:8503.67, close:8563.22, high:8596.45, low:8424.45, turnover:596276737100, volume:24224000600, changeRate:2.1472},
    {date:"2026-05-29", open:8589.82, close:8359.56, high:8597.98, low:8296.24, turnover:661406695200, volume:28119061600, changeRate:2.492},
    {date:"2026-06-01", open:8358.49, close:8274.21, high:8442.53, low:8259.6, turnover:584223622400, volume:25817502700, changeRate:2.2872},
    {date:"2026-06-02", open:8290.83, close:8321.43, high:8378.43, low:8142.51, turnover:548050911600, volume:23958969600, changeRate:2.1224},
    {date:"2026-06-03", open:8317, close:8362.16, high:8462.67, low:8294.29, turnover:608167868400, volume:25357653100, changeRate:2.2462},
    {date:"2026-06-04", open:8279.86, close:8356.74, high:8391.05, low:8279.86, turnover:570131396500, volume:23082197600, changeRate:2.0442},
    {date:"2026-06-05", open:8317.64, close:8251.14, high:8399.41, low:8218.14, turnover:612246476400, volume:24708934700, changeRate:2.1872},
    {date:"2026-06-08", open:7978.66, close:7963.45, high:8142.34, low:7889.4, turnover:562548949600, volume:24479319800, changeRate:2.1668},
    {date:"2026-06-09", open:8059.34, close:8176.18, high:8181.13, low:7965.49, turnover:506484788500, volume:20929297800, changeRate:1.8519},
    {date:"2026-06-10", open:8094.14, close:8063.86, high:8148.26, low:7973.55, turnover:509158413500, volume:21091009800, changeRate:1.8658},
    {date:"2026-06-11", open:8025.61, close:8035.78, high:8091.68, low:7965.02, turnover:512698921000, volume:19685777600, changeRate:1.7415},
    {date:"2026-06-12", open:8189.21, close:8106.2, high:8258.91, low:8098.78, turnover:668679920700, volume:26624408000, changeRate:2.6124}
  ],

  // === 科创50 (000688.SH) 日K线（Wind MCP数据） ===
  kc50: [
    {date:"2026-05-06", open:1634.31, close:1656.95, high:1715.08, low:1631.65, turnover:202263525000, volume:1830104800, changeRate:2.7798},
    {date:"2026-05-07", open:1663.16, close:1678.89, high:1682.22, low:1646.94, turnover:147148539100, volume:1393006300, changeRate:2.1158},
    {date:"2026-05-08", open:1653.31, close:1640.46, high:1655.57, low:1625.61, turnover:134384676000, volume:1500507400, changeRate:2.272},
    {date:"2026-05-11", open:1687.64, close:1716.69, high:1727.3, low:1669.73, turnover:183091745800, volume:1829405800, changeRate:2.7108},
    {date:"2026-05-12", open:1708.21, close:1723.78, high:1747.17, low:1687.96, turnover:163162220200, volume:1692708900, changeRate:2.5082},
    {date:"2026-05-13", open:1684.37, close:1770.15, high:1771.49, low:1677.54, turnover:158688703200, volume:1777324700, changeRate:2.6336},
    {date:"2026-05-14", open:1792.34, close:1725.09, high:1800.61, low:1723.7, turnover:170925244400, volume:2107102300, changeRate:3.1222},
    {date:"2026-05-15", open:1724.36, close:1696.26, high:1769.8, low:1669.99, turnover:191146069900, volume:2160121400, changeRate:3.2008},
    {date:"2026-05-18", open:1690.38, close:1709.96, high:1748.1, low:1684.9, turnover:152427297000, volume:1591395600, changeRate:2.358},
    {date:"2026-05-19", open:1697.4, close:1775.13, high:1776.26, low:1670.36, turnover:169324578800, volume:1710436800, changeRate:2.5317},
    {date:"2026-05-20", open:1764.21, close:1832.02, high:1835.22, low:1764.21, turnover:190386612600, volume:1845254200, changeRate:2.7312},
    {date:"2026-05-21", open:1866.29, close:1764.17, high:1892.6, low:1759.94, turnover:216374427900, volume:2127403800, changeRate:3.1488},
    {date:"2026-05-22", open:1790.74, close:1790.77, high:1797.65, low:1747.14, turnover:162025307200, volume:1760391900, changeRate:2.6056},
    {date:"2026-05-25", open:1791.67, close:1896.04, high:1899.97, low:1774.19, turnover:221953931400, volume:2149793700, changeRate:3.182},
    {date:"2026-05-26", open:1877.39, close:1867.71, high:1880.65, low:1824.32, turnover:193152885200, volume:1940888500, changeRate:2.8727},
    {date:"2026-05-27", open:1875.42, close:1815.45, high:1901.97, low:1809.7, turnover:192835609700, volume:2160969900, changeRate:3.1985},
    {date:"2026-05-28", open:1805.11, close:1844.25, high:1854.52, low:1796.04, turnover:177051079000, volume:2154008000, changeRate:3.1882},
    {date:"2026-05-29", open:1850.27, close:1751.32, high:1855.26, low:1727.62, turnover:182139564400, volume:2343137400, changeRate:3.4524},
    {date:"2026-06-01", open:1751.23, close:1663.69, high:1753.02, low:1662.82, turnover:149900665000, volume:1694183400, changeRate:2.4962},
    {date:"2026-06-02", open:1676.31, close:1690.56, high:1710.98, low:1641.17, turnover:133709243800, volume:1557622000, changeRate:2.295},
    {date:"2026-06-03", open:1697.66, close:1726.18, high:1776.2, low:1697.36, turnover:166311010800, volume:1682555400, changeRate:2.479},
    {date:"2026-06-04", open:1700.31, close:1738.06, high:1759.98, low:1697.22, turnover:132618434500, volume:1496770100, changeRate:2.2053},
    {date:"2026-06-05", open:1706.53, close:1668.33, high:1735.08, low:1659.48, turnover:136854203800, volume:1683570900, changeRate:2.4804},
    {date:"2026-06-08", open:1587.97, close:1596.57, high:1634.03, low:1578.18, turnover:119405019900, volume:1570749900, changeRate:2.3142},
    {date:"2026-06-09", open:1630.23, close:1663.11, high:1666.48, low:1607.58, turnover:112366426700, volume:1409895800, changeRate:2.0093},
    {date:"2026-06-10", open:1662.85, close:1652.22, high:1722.33, low:1632.33, turnover:139088834500, volume:1591172500, changeRate:2.2631},
    {date:"2026-06-11", open:1644.6, close:1662.44, high:1676.53, low:1631.94, turnover:117155580100, volume:1422069400, changeRate:2.0225},
    {date:"2026-06-12", open:1726.01, close:1663.22, high:1730.89, low:1656.85, turnover:175820241100, volume:2101856700, changeRate:2.9894}
  ],

  // === 指数实时快照 (2026-06-12收盘) ===
  quotes: {
    "868008.WI": {name:"万得微盘股指数", close:544778.23, change:0.93, turnover:26089752300, upCount:314, downCount:77},
    "000300.SH": {name:"沪深300", close:4777.32, change:1.16, turnover:871477325200, upCount:232, downCount:63},
    "000852.SH": {name:"中证1000", close:8202.80, change:0.53, turnover:717319013000, upCount:724, downCount:262},
    "000688.SH": {name:"科创50", close:1663.22, change:0.05, turnover:175820241100, upCount:367, downCount:236},
    "399006.SZ": {name:"创业板指", close:3830.35, change:0.50, turnover:805740233100, upCount:894, downCount:432},
    "000001.SH": {name:"上证指数", close:4031.51, change:1.12, turnover:1537401519400},
    "399106.SZ": {name:"深证综指", close:null, change:null, turnover:1677548225900}
  },

  // === TMT行业成交额 (2026-06-12, 单位:亿元) ===
  tmt: {
    electronics: {name:"电子(申万)", code:"801080.SI", turnover:9476.81},
    telecom: {name:"通信(申万)", code:"801770.SI", turnover:2558.86},
    computer: {name:"计算机(申万)", code:"801750.SI", turnover:1305.02},
    media: {name:"传媒(申万)", code:"801760.SI", turnover:535.91},
    total: 13876.60 // 四行业合计
  },

  // === 融资余额 (近30天, 单位:万亿) ===
  marginBalance: [
    {date:"2026-05-06", sh:1.3935, sz:1.3347, total:2.7282},
    {date:"2026-05-07", sh:1.4092, sz:1.3485, total:2.7577},
    {date:"2026-05-08", sh:1.4167, sz:1.3568, total:2.7735},
    {date:"2026-05-11", sh:1.4326, sz:1.3715, total:2.8041},
    {date:"2026-05-12", sh:1.4408, sz:1.3802, total:2.8210},
    {date:"2026-05-13", sh:1.4524, sz:1.3915, total:2.8439},
    {date:"2026-05-14", sh:1.4562, sz:1.3968, total:2.8530},
    {date:"2026-05-15", sh:1.4523, sz:1.3949, total:2.8472},
    {date:"2026-05-18", sh:1.4623, sz:1.4006, total:2.8629},
    {date:"2026-05-19", sh:1.4653, sz:1.4028, total:2.8681},
    {date:"2026-05-20", sh:1.4703, sz:1.4043, total:2.8746},
    {date:"2026-05-21", sh:1.4675, sz:1.3988, total:2.8663},
    {date:"2026-05-22", sh:1.4688, sz:1.4005, total:2.8693},
    {date:"2026-05-25", sh:1.4809, sz:1.4137, total:2.8946},
    {date:"2026-05-26", sh:1.4847, sz:1.4172, total:2.9019},
    {date:"2026-05-27", sh:1.4860, sz:1.4199, total:2.9059},
    {date:"2026-05-28", sh:1.4896, sz:1.4220, total:2.9116},
    {date:"2026-05-29", sh:1.4722, sz:1.4099, total:2.8821},
    {date:"2026-06-01", sh:1.4682, sz:1.4063, total:2.8745},
    {date:"2026-06-02", sh:1.4690, sz:1.4068, total:2.8758},
    {date:"2026-06-03", sh:1.4742, sz:1.4101, total:2.8843},
    {date:"2026-06-04", sh:1.4767, sz:1.4141, total:2.8908},
    {date:"2026-06-05", sh:1.4654, sz:1.4114, total:2.8768},
    {date:"2026-06-08", sh:1.4537, sz:1.3998, total:2.8535},
    {date:"2026-06-09", sh:1.4522, sz:1.4049, total:2.8571},
    {date:"2026-06-10", sh:1.4479, sz:1.4012, total:2.8491},
    {date:"2026-06-11", sh:1.4482, sz:1.3956, total:2.8438},
    {date:"2026-06-12", sh:1.4489, sz:null, total:null}
  ]
};

// === 计算派生指标 ===
(function() {
  const d = AUTO_DATA;
  
  // 全A成交额 = 上证 + 深证 (元)
  d.totalTurnover = (d.quotes["000001.SH"].turnover || 0) + (d.quotes["399106.SZ"].turnover || 0);
  
  // TMT占比 = TMT成交额(亿) / 全A成交额(亿)
  // 全A成交额转亿元
  const totalTurnoverYi = d.totalTurnover / 100000000;
  d.tmtRatio = d.tmt.total / totalTurnoverYi;
  
  // 微盘成交占比 = 微盘成交额 / 全A成交额
  d.weipanRatio = d.quotes["868008.WI"].turnover / d.totalTurnover;
  
  // 微盘近5日/20日涨跌幅
  const wp = d.weipan;
  if (wp.length >= 5) {
    const last5 = wp.slice(-5);
    d.weipan5d = (last5[last5.length-1].close / last5[0].close - 1) * 100;
  }
  if (wp.length >= 20) {
    const last20 = wp.slice(-20);
    d.weipan20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  
  // 沪深300近5日/20日涨跌幅
  const hs = d.hs300;
  if (hs.length >= 5) {
    const last5 = hs.slice(-5);
    d.hs300_5d = (last5[last5.length-1].close / last5[0].close - 1) * 100;
  }
  if (hs.length >= 20) {
    const last20 = hs.slice(-20);
    d.hs300_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  
  // 中证2000近20日涨跌幅（Wind MCP真实数据）
  const zz = d.zz2000;
  if (zz && zz.length >= 20) {
    const last20 = zz.slice(-20);
    d.zz2000_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  
  // 科创50近20日涨跌幅（Wind MCP真实数据）
  const kc = d.kc50;
  if (kc && kc.length >= 20) {
    const last20 = kc.slice(-20);
    d.kc50_20d = (last20[last20.length-1].close / last20[0].close - 1) * 100;
  }
  
  // 微盘相对沪深300超额收益
  d.relativeExcess5d = d.weipan5d - d.hs300_5d;
  d.relativeExcess20d = d.weipan20d - d.hs300_20d;
  
  // 微盘扩散指数 (上涨家数/(上涨+下跌))
  const wpQuote = d.quotes["868008.WI"];
  d.weipanSpread = wpQuote.upCount / (wpQuote.upCount + wpQuote.downCount);
  
  // 微盘从高点回撤幅度
  let maxClose = 0;
  wp.forEach(item => { if (item.close > maxClose) maxClose = item.close; });
  d.weipanDrawdown = (wp[wp.length-1].close / maxClose - 1) * 100;
  
  // 微盘近1月涨跌幅（用于产品相对微盘对比）
  if (wp.length >= 20) {
    d.weipan1m = (wp[wp.length-1].close / wp[wp.length-20].close - 1) * 100;
  }
  
})();

// === 微盘量化产品跟踪 (Wind MCP真实数据, 2026-06-12) ===
// 分层：微盘暴露型 | 稳健分散型 | 风格对照型 | 微盘量化
const FUND_PRODUCTS = [
  // === 微盘暴露型 ===
  {
    tier: "微盘暴露型",
    name: "诺安多策略A",
    code: "320016",
    type: "混合型-偏股",
    navDate: "2026-06-12",
    nav: 2.3930,
    dayChange: -2.84,
    week1: -6.04,
    month1: -16.37,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "高暴露微盘",
    statusNote: "Wind MCP真实数据，近1月跌16.37%"
  },
  {
    tier: "微盘暴露型",
    name: "中信保诚景气优选A",
    code: "009853",
    type: "混合型-偏股",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  },
  {
    tier: "微盘暴露型",
    name: "中信保诚多策略A",
    code: "011282",
    type: "混合型-偏股",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  },
  // === 稳健分散型 ===
  {
    tier: "稳健分散型",
    name: "金元顺安元启",
    code: "004685",
    type: "混合型-灵活",
    navDate: "2026-06-12",
    nav: 4.9918,
    dayChange: -3.65,
    week1: -5.59,
    month1: -13.35,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "人肉量化天花板",
    statusNote: "Wind MCP真实数据，近1月跌13.35%"
  },
  {
    tier: "稳健分散型",
    name: "建信灵活配置A",
    code: "000270",
    type: "混合型-灵活",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  },
  {
    tier: "稳健分散型",
    name: "华夏新锦绣A",
    code: "002871",
    type: "混合型-灵活",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  },
  // === 风格对照型 ===
  {
    tier: "风格对照型",
    name: "万家精选A",
    code: "519185",
    type: "混合型-偏股",
    navDate: "2026-06-12",
    nav: 2.6141,
    dayChange: -3.16,
    week1: -4.99,
    month1: 0.68,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "黄海管理",
    statusNote: "Wind MCP真实数据，近1月涨0.68%"
  },
  {
    tier: "风格对照型",
    name: "新华策略精选A",
    code: "001040",
    type: "股票型",
    navDate: "2026-06-12",
    nav: 3.0290,
    dayChange: -2.66,
    week1: -4.17,
    month1: 6.37,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "科技成长风格",
    statusNote: "Wind MCP真实数据，近1月涨6.37%"
  },
  // === 微盘量化（原第一梯队）===
  {
    tier: "微盘量化",
    name: "国金量化多因子A",
    code: "006195",
    type: "股票型",
    navDate: "2026-06-12",
    nav: 1.7653,
    dayChange: -2.49,
    week1: -5.58,
    month1: -12.59,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "微盘量化标杆",
    statusNote: "Wind MCP真实数据，近1月跌12.59%"
  },
  {
    tier: "微盘量化",
    name: "国金量化精选A",
    code: "014805",
    type: "混合型-偏股",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  },
  {
    tier: "微盘量化",
    name: "大成动态量化A",
    code: "003147",
    type: "混合型-灵活",
    navDate: "2026-06-12",
    nav: 2.0630,
    dayChange: -2.59,
    week1: -4.66,
    month1: -10.80,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "市值下沉型",
    statusNote: "Wind MCP真实数据，近1月跌10.80%"
  },
  {
    tier: "微盘量化",
    name: "富荣价值精选A",
    code: "006109",
    type: "混合型-灵活",
    navDate: "2026-06-12",
    nav: null,
    dayChange: null,
    week1: null,
    month1: null,
    month3: null,
    month6: null,
    year1: null,
    ytd: null,
    scale: null,
    status: "待接入",
    statusNote: "数据待接入"
  }
];
