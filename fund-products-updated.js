// === 微盘量化产品跟踪 (Wind MCP真实数据, 2026-06-12) ===
// 分层：微盘暴露型 | 稳健分散型 | 风格对照型 | 微盘量化
const FUND_PRODUCTS = [
  {
    tier: "微盘暴露型",
    name: "诺安多策略A",
    code: "320016",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"320016.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"320016.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "微盘暴露型",
    name: "中信保诚景气优选A",
    code: "009853",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"009853.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"009853.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "微盘暴露型",
    name: "中信保诚多策略A",
    code: "011282",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"011282.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"011282.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "稳健分散型",
    name: "金元顺安元启",
    code: "004685",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"004685.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"004685.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "稳健分散型",
    name: "建信灵活配置A",
    code: "000270",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"000270.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"000270.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "稳健分散型",
    name: "华夏新锦绣A",
    code: "002871",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"002871.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"002871.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "风格对照型",
    name: "万家精选A",
    code: "519185",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"519185.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"519185.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "风格对照型",
    name: "新华策略精选A",
    code: "001040",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"001040.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"001040.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "微盘量化",
    name: "国金量化多因子A",
    code: "006638",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"006638.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"006638.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "微盘量化",
    name: "国金量化精选A",
    code: "014805",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"014805.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"014805.OF","start_date":"20260501","end_date":"20260612"}'"
  },
  {
    tier: "微盘量化",
    name: "大成动态量化A",
    code: "003147",
    nav: null, // Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"003147.OF","start_date":"20260501","end_date":"20260612"}'
    dayChange: null,
    week1: null,
    month1: null,
    statusNote: "Command failed: node "C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs" call fund_data get_fund_kline '{"windcode":"003147.OF","start_date":"20260501","end_date":"20260612"}'"
  },
];
