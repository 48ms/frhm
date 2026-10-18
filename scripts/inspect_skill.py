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

res = run_query("SELECT path, length(content) as len FROM skill_files WHERE skill_id = 'brand-profile'")
print("Files for brand-profile:")
print(json.dumps(res, indent=2))

skills_check = run_query("SELECT id, name, category, allowed_tools FROM skills WHERE id IN ('voice-builder', 'content-pillars', 'trend-jacking', 'batch-content-plan', 'hook-writer', 'carousel-writer', 'reels-script', 'tiktok-script')")
print("\nCore Skills in DB:")
print(json.dumps(skills_check, indent=2))
