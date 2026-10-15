import os, sys, json, urllib.request

def load_env(path):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

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

res = run_query("""
    UPDATE skills 
    SET allowed_tools = 'WoopSocial MCP (Projects, Social Accounts, Posts, Media, Webhooks, Health)'
    WHERE id = 'scheduling-and-queue';
    SELECT id, name, allowed_tools FROM skills WHERE id = 'scheduling-and-queue';
""")
print('Updated scheduling-and-queue allowed_tools:', res)
