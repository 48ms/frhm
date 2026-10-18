import os
import json
import urllib.request
from pathlib import Path

def load_env(path):
    env = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = load_env('app/.env.local')
access_token = env.get('SUPABASE_ACCESS_TOKEN')
project_ref = env.get('SUPABASE_PROJECT_REF')

def run_query(sql):
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    req = urllib.request.Request(
        url,
        method="POST",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        data=json.dumps({"query": sql}).encode("utf-8")
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

# 1. Check client_files in DB
cf = run_query("SELECT client_id, path, length(content) as len, updated_at FROM client_files ORDER BY client_id, path")
print(f"Total client_files rows in DB: {len(cf)}")
for r in cf:
    print(f"  Client {r['client_id'][:8]}... | {r['path']} ({r['len']} bytes) | {r['updated_at']}")

# 2. Check skill_outputs in DB
so = run_query("SELECT id, client_id, skill_id, title, length(content) as len, status, created_at FROM skill_outputs ORDER BY created_at DESC LIMIT 10")
print(f"\nRecent skill_outputs in DB: {len(so)}")
for r in so:
    print(f"  {r['id'][:8]}... | Client: {r['client_id'][:8]}... | Skill: {r['skill_id']} | Title: {r['title']} | Status: {r['status']} | Created: {r['created_at']}")

# 3. Check clients in DB
clients = run_query("SELECT id, name, brand_profile FROM clients")
print(f"\nClients in DB: {len(clients)}")
for c in clients:
    bp = c.get('brand_profile') or {}
    print(f"  Client: {c['name']} ({c['id'][:8]}...)")
    print(f"    bp keys: {list(bp.keys()) if isinstance(bp, dict) else type(bp)}")
    if isinstance(bp, dict):
        for k in ['who', 'voice', 'audience', 'pov', 'proof', 'guardrails', 'pillars', 'identity', 'positioning', 'offers']:
            val = bp.get(k)
            if val:
                preview = str(val)[:40] + "..." if len(str(val)) > 40 else str(val)
                print(f"      {k}: {preview}")

# 4. Check skills count by category in DB
sc = run_query("SELECT category, count(*) as count FROM skills GROUP BY category ORDER BY count DESC")
print(f"\nSkills in DB by Category:")
for r in sc:
    print(f"  {r['category']}: {r['count']} skills")

# 5. Check writes_files
wf = run_query("SELECT id, reads_files, writes_files FROM skills WHERE writes_files IS NOT NULL AND jsonb_array_length(writes_files) > 0 LIMIT 20")
print(f"\nSkills with writes_files: {len(wf)}")
for r in wf:
    print(f"  {r['id']}: writes -> {r['writes_files']} | reads -> {r['reads_files']}")

logs = run_query("SELECT route, model, prompt_tokens, completion_tokens, latency_ms, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 5")
print(f"\nAI usage logs: {len(logs)}")
for r in logs:
    print(f"  - {r['route']} ({r['model']}): {r['prompt_tokens']} prompt, {r['completion_tokens']} comp | {r['created_at']}")

