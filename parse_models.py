import json
import sys

try:
    data = json.load(sys.stdin)
    deepseek_models = [m['id'] for m in data['data'] if 'deepseek' in m['id'].lower()]
    print("\n".join(deepseek_models))
except Exception as e:
    print(f"Error: {e}")
