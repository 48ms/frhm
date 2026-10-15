import os, sys, json, urllib.request
from pathlib import Path
def load_env(path):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip('\"').strip('\'')

load_env('app/.env.local')
ACCESS_TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')
PROJECT_REF = os.environ.get('SUPABASE_PROJECT_REF')

def run_query(sql):
    req = urllib.request.Request(f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query', method='POST')
    req.add_header('Authorization', f'Bearer {ACCESS_TOKEN}')
    req.add_header('Content-Type', 'application/json')
    req.data = json.dumps({'query': sql}).encode('utf-8')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

# 1. Packs & skill counts
packs = run_query('''
    SELECT p.id, p.name, p.category, count(ps.skill_id) as skill_count 
    FROM skill_packs p 
    LEFT JOIN pack_skills ps ON p.id = ps.pack_id 
    GROUP BY p.id, p.name, p.category 
    ORDER BY p.category, p.name
''')
print('=== 17 SKILL PACKS ===')
for p in packs:
    print(f"- {p['id']} [{p['category']}]: {p['name']} ({p['skill_count']} skills)")

# 2. Skills by category
cat_skills = run_query('''
    SELECT category, count(*) as count 
    FROM skills 
    GROUP BY category 
    ORDER BY count DESC
''')
print('\n=== SKILLS BY CATEGORY ===')
for c in cat_skills:
    print(f"- {c['category']}: {c['count']} skills")

# 3. All skills with category and allowed_tools
all_skills = run_query('''
    SELECT id, name, category, allowed_tools, job
    FROM skills
    ORDER BY category, id
''')
print(f'\nTotal skills: {len(all_skills)}')

# Let's save all_skills to a json file for inspection
with open('app/dogfood-output/all_skills_dump.json', 'w', encoding='utf-8') as f:
    json.dump(all_skills, f, indent=2)

with_tools = [s for s in all_skills if s.get('allowed_tools')]
print(f'\nSkills with allowed_tools declared: {len(with_tools)} / {len(all_skills)}')
for s in with_tools:
    print(f"- {s['id']}: {s['allowed_tools']}")

