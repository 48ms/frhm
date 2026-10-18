import os
import json
import urllib.request

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
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code, e.read().decode('utf-8'))
        raise

packs = run_query("SELECT p.id, p.name, p.tagline, count(ps.skill_id) as skill_count FROM skill_packs p LEFT JOIN pack_skills ps ON p.id = ps.pack_id GROUP BY p.id, p.name, p.tagline ORDER BY p.name")
print(f"Total packs in DB: {len(packs)}")
for p in packs:
    print(f"  {p['id']}: {p['name']} ({p['skill_count']} skills) — {p.get('tagline')}")

# Check total skills
skills = run_query("SELECT id, name, category, stage, allowed_tools, reads_files, writes_files FROM skills ORDER BY category, id")
print(f"\nTotal skills in DB: {len(skills)}")

# Check reads_files / writes_files
wf_count = sum(1 for s in skills if s.get('writes_files'))
rf_count = sum(1 for s in skills if s.get('reads_files'))
print(f"Skills with writes_files: {wf_count}")
print(f"Skills with reads_files: {rf_count}")

# Check columns of table client_files
cf_cols = run_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'client_files'")
print(f"\nclient_files schema:")
for c in cf_cols:
    print(f"  {c['column_name']} ({c['data_type']})")

# Check columns of table skill_outputs
so_cols = run_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'skill_outputs'")
print(f"\nskill_outputs schema:")
for c in so_cols:
    print(f"  {c['column_name']} ({c['data_type']})")
