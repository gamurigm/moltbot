import json
import os

def search():
    path = r'C:\Users\gamur\.openclaw\agents\main\sessions\db91ad8e-6866-4a12-bb97-6b1b88bf24d9.jsonl'
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
        
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in reversed(lines):
        try:
            d = json.loads(line)
            if 'model' in d:
                print(f"Found Model: {d['model']} (type: {d.get('type')})")
                return
            if 'meta' in d and 'model' in d['meta']:
                print(f"Found Model in meta: {d['meta']['model']} (type: {d.get('type')})")
                return
        except:
            continue
    print("Model not found in session history.")

if __name__ == "__main__":
    search()
