import sys, json, os, requests
sys.stdout.reconfigure(encoding='utf-8')

token_path = os.path.expanduser("~/.workbuddy/.neodata_token")
with open(token_path, 'r') as f:
    token = json.load(f)['token']

url = "https://ai.neodata.com.cn/api/v1/neodata/chat"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

queries = [
    "科技主题主动管理权益类基金近一年收益率排名前10",
    "科技成长风格主动权益基金规模和业绩排名",
]

for q in queries:
    payload = {"query": q, "stream": False}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        data = resp.json()
        if 'data' in data and 'data' in data['data']:
            inner = data['data']['data']
            if inner and len(inner) > 0 and 'rows' in inner[0]:
                rows = inner[0]['rows']
                print(f"\n=== Query: {q} ===")
                print(f"Found {len(rows)} rows")
                for r in rows[:15]:
                    print(json.dumps(r, ensure_ascii=False))
            else:
                print(f"\n=== Query: {q} ===")
                print(json.dumps(inner, ensure_ascii=False)[:2000])
        else:
            print(f"\n=== Query: {q} ===")
            print(json.dumps(data, ensure_ascii=False)[:2000])
    except Exception as e:
        print(f"Error for query '{q}': {e}")
