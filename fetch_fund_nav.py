#!/usr/bin/env python3
# 批量获取观察池基金净值数据并计算收益
import subprocess, json, sys

CLI = r"C:\Users\xyf31\.workbuddy\skills\wind-mcp-skill\scripts\cli.mjs"
funds = [
    ("诺安多策略A", "320016.OF"),
    ("中信保诚景气优选A", "009853.OF"),
    ("中信保诚多策略A", "016155.OF"),
    ("国金量化多因子A", "006638.OF"),
    ("国金量化精选A", "008718.OF"),
    ("大成动态量化A", "003147.OF"),
    ("富荣价值精选A", "009042.OF"),
    ("金元顺安元启", "004685.OF"),
    ("建信灵活配置A", "000270.OF"),
    ("华夏新锦绣A", "002871.OF"),
    ("万家精选A", "519185.OF"),
    ("新华策略精选A", "001040.OF"),
]

results = []
for name, windcode in funds:
    param = json.dumps({"windcode": windcode, "begin_date": "20260501", "end_date": "20260612"})
    cmd = f'node "{CLI}" call fund_data get_fund_kline \'{param}\''
    try:
        out = subprocess.check_output(cmd, shell=True, timeout=30, stderr=subprocess.DEVNULL)
        d = json.loads(out)
        text = d["content"][0]["text"]
        data = json.loads(text)
        rows = data["data"]["rows"]
        if len(rows) < 2:
            results.append({"name": name, "code": windcode[:-3], "error": "no data"})
            continue
        nav = float(rows[-1][1])
        d1 = (nav - float(rows[-2][1])) / float(rows[-2][1]) * 100 if len(rows) >= 2 else 0
        w1 = (nav - float(rows[-5][1])) / float(rows[-5][1]) * 100 if len(rows) >= 5 else 0
        m1 = (nav - float(rows[-20][1])) / float(rows[-20][1]) * 100 if len(rows) >= 20 else 0
        # 今年以来：找2026-01-01之后的第一行
        ytd_row = None
        for r in rows:
            if r[9] >= "20260101":
                ytd_row = r
                break
        ytd = (nav - float(ytd_row[1])) / float(ytd_row[1]) * 100 if ytd_row else 0
        results.append({"name": name, "code": windcode[:-3], "nav": nav, "day1": round(d1,2), "week1": round(w1,2), "month1": round(m1,2), "ytd": round(ytd,2)})
        print(f"✓ {name}: 净值={nav:.4f}, 近1月={m1:+.2f}%, 今年={ytd:+.2f}%")
    except Exception as e:
        results.append({"name": name, "code": windcode[:-3], "error": str(e)})
        print(f"✗ {name}: {e}")

print("\n\n=== JSON结果 ===")
print(json.dumps(results, ensure_ascii=False, indent=2))
