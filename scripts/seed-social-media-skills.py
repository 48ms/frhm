#!/usr/bin/env python3
"""
Seed 106 social-media-skills from the upstream repo into Frhm's Supabase database
using the Management API query endpoint.
"""

import os
import re
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime

# Load env variables
sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

SMS_REPO_PATH = Path('/c/tmp/sms-repo/skills')
PACKS_JSON_PATH = Path('/c/tmp/sms-repo/scripts/packs.json')

ACCESS_TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN')
PROJECT_REF = os.environ.get('SUPABASE_PROJECT_REF')

if not ACCESS_TOKEN or not PROJECT_REF:
    print("Error: Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in .env.local")
    sys.exit(1)

API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_query(sql, params=None):
    """Executes SQL on Supabase via Management API."""
    data = {"query": sql}
    # Parameters handling for this endpoint is tricky; we will safely inject values for bulk inserts
    
    req = urllib.request.Request(API_URL, method="POST")
    req.add_header("Authorization", f"Bearer {ACCESS_TOKEN}")
    req.add_header("Content-Type", "application/json")
    
    try:
        json_data = json.dumps(data).encode("utf-8")
        with urllib.request.urlopen(req, data=json_data) as res:
            response_body = res.read().decode("utf-8")
            if response_body:
                return json.loads(response_body)
            return None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"\nSQL Error: {err_msg}")
        raise Exception(f"HTTP {e.code}: {e.reason}")

def escape_string(s):
    if s is None:
        return 'NULL'
    # Escape single quotes by doubling them
    escaped = str(s).replace("'", "''")
    return f"'{escaped}'"

# Category mapping
CATEGORY_MAP = {
    'Foundation & strategy': ['brand-profile', 'voice-builder', 'writing-style-and-tone', 'audience-research', 'social-strategy', 'content-pillars', 'goals-and-kpis', 'profile-optimization'],
    'Ideas & content angles': ['idea-generation-and-ideation', 'content-research-and-sourcing', 'educational-content-and-how-to', 'storytelling-and-narrative', 'contrarian-and-opinion', 'before-after-and-transformation', 'social-proof-and-testimonials', 'listicle-and-roundup', 'behind-the-scenes-and-founder', 'interactive-content', 'meme-and-culture', 'trend-jacking', 'data-and-original-research'],
    'Copy & captions': ['hook-writer', 'caption-writer', 'thread-writer', 'threads-post', 'text-post-and-microblog', 'carousel-writer', 'story-writer', 'reply-and-comment-writer'],
    'Video scripts': ['short-form-video-script', 'reels-script', 'tiktok-script', 'youtube-shorts', 'youtube-long-form', 'scripting-and-storyboarding', 'talking-head-and-piece-to-camera', 'podcast-and-audiograms', 'livestream-and-realtime'],
    'AI video': ['ai-video', 'veo-3', 'kling', 'luma', 'heygen', 'synthesia', 'runway'],
    'Visual & design': ['design-and-templates', 'thumbnail-design', 'pinterest-pin-design', 'quote-cards-and-text-graphics', 'infographic-and-data-viz', 'image-prompt', 'nano-banana', 'ideogram', 'flux', 'ai-image-editing', 'canva'],
    'Voice & music': ['ai-voiceover', 'suno', 'ai-music-and-sound'],
    'Editing & clipping': ['capcut', 'descript', 'opus-clip', 'captions-and-clipping'],
    'Platform growth': ['instagram-growth', 'tiktok-growth', 'tiktok-photo-mode', 'linkedin-growth', 'linkedin-post-writer', 'linkedin-company-pages', 'x-growth', 'threads-growth', 'facebook-strategy', 'facebook-groups', 'pinterest-growth', 'pinterest-seo', 'youtube-publishing-and-metadata', 'reddit-marketing'],
    'Distribution & monetization': ['hashtag-strategy', 'social-seo', 'ai-search-optimization', 'cross-platform-repurposing', 'content-recycling', 'link-in-bio-and-traffic', 'lead-magnets-and-funnels', 'social-selling-and-dm', 'collabs-and-cross-promotion', 'ugc-and-influencer', 'creator-monetization'],
    'Community & operations': ['engagement-routine', 'community-management', 'crisis-and-moderation'],
    'Publishing & measurement': ['scheduling-and-queue', 'platform-specs-and-validation', 'analytics-and-reporting', 'content-audit', 'experimentation-and-ab-testing'],
    'Planning': ['campaign-and-launch-planning', 'batch-content-plan', 'content-calendar'],
}

def get_category(skill_name):
    for cat, skills in CATEGORY_MAP.items():
        if skill_name in skills: return cat
    return 'uncategorized'

def extract_frontmatter(content):
    match = re.match(r'---\n(.*?)\n---', content, re.DOTALL)
    if not match: return None, None, None
    fm = match.group(1)
    
    name_match = re.search(r'^name:\s*(.+)$', fm, re.MULTILINE)
    name = name_match.group(1).strip() if name_match else None
    
    desc_match = re.search(r'^description:\s*>\-\n((?:  .+\n?)*)', fm, re.MULTILINE)
    if desc_match:
        description = ' '.join(line.strip() for line in desc_match.group(1).strip().split('\n'))
    else:
        desc_simple = re.search(r'^description:\s*(.+)$', fm, re.MULTILINE)
        description = desc_simple.group(1).strip() if desc_simple else None
    
    version_match = re.search(r'^version:\s*(.+)$', fm, re.MULTILINE)
    version = version_match.group(1).strip() if version_match else '1.0.0'
    
    return name, description, version

def load_packs():
    with open(PACKS_JSON_PATH) as f:
        return json.load(f)['packs']

def load_skill_files(skill_dir):
    files = {}
    for path in skill_dir.rglob('*'):
        if path.is_file() and path.name.endswith('.md'):
            rel_path = path.relative_to(skill_dir)
            files[str(rel_path).replace('\\', '/')] = path.read_text(encoding='utf-8')
    return files

def seed():
    print("1. Clearing existing data...")
    run_query("""
        DELETE FROM skill_files;
        DELETE FROM pack_skills;
        DELETE FROM client_skills;
        DELETE FROM skill_packs;
        DELETE FROM skills;
    """)
    
    print("2. Preparing 106 skills...")
    skills_data = []
    for skill_dir in sorted(SMS_REPO_PATH.iterdir()):
        if not skill_dir.is_dir(): continue
        
        skill_name = skill_dir.name
        skill_file = skill_dir / 'SKILL.md'
        if not skill_file.exists(): continue
        
        content = skill_file.read_text(encoding='utf-8')
        name, description, version = extract_frontmatter(content)
        category = get_category(skill_name)
        job = description[:100] + '...' if description and len(description) > 100 else description
        
        skills_data.append({
            'id': skill_name, 'name': name or skill_name,
            'description': description, 'category': category, 'job': job
        })
    
    # Bulk insert skills
    values = []
    for s in skills_data:
        v = f"({escape_string(s['id'])}, {escape_string(s['name'])}, {escape_string(s['description'])}, {escape_string(s['category'])}, {escape_string(s['job'])})"
        values.append(v)
    
    print(f"3. Inserting {len(skills_data)} skills...")
    run_query(f"""
        INSERT INTO public.skills (id, name, description, category, job)
        VALUES {','.join(values)}
        ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, description=EXCLUDED.description, category=EXCLUDED.category, job=EXCLUDED.job;
    """)
    
    print("4. Inserting skill files...")
    file_values = []
    file_count = 0
    
    # Batch insertions to avoid query length limits
    for skill in skills_data:
        skill_dir = SMS_REPO_PATH / skill['id']
        files = load_skill_files(skill_dir)
        
        for path, content in files.items():
            v = f"({escape_string(skill['id'])}, {escape_string(path)}, {escape_string(content)})"
            file_values.append(v)
            file_count += 1
            
            # Send batch every 50 files
            if len(file_values) >= 50:
                run_query(f"""
                    INSERT INTO public.skill_files (skill_id, path, content)
                    VALUES {','.join(file_values)}
                    ON CONFLICT (skill_id, path) DO UPDATE SET content=EXCLUDED.content;
                """)
                file_values = []

    # Final batch
    if file_values:
        run_query(f"""
            INSERT INTO public.skill_files (skill_id, path, content)
            VALUES {','.join(file_values)}
            ON CONFLICT (skill_id, path) DO UPDATE SET content=EXCLUDED.content;
        """)
    print(f"   ✓ Inserted {file_count} skill files")
    
    print("5. Inserting 17 topic packs...")
    packs = load_packs()
    pack_values = []
    for p in packs:
        pack_id = p['name']
        v = f"({escape_string(pack_id)}, {escape_string(p['title'])}, {escape_string(p.get('description',''))}, {escape_string(p['name'])}, {p.get('sort_order',0)})"
        pack_values.append(v)
    
    run_query(f"""
        INSERT INTO public.skill_packs (id, name, description, category, sort_order)
        VALUES {','.join(pack_values)}
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;
    """)
    
    ps_values = []
    for p in packs:
        for s in p['skills']:
            ps_values.append(f"({escape_string(p['name'])}, {escape_string(s)})")
            
    run_query(f"""
        INSERT INTO public.pack_skills (pack_id, skill_id)
        VALUES {','.join(ps_values)}
        ON CONFLICT DO NOTHING;
    """)
    
    print(f"   ✓ Inserted {len(packs)} packs with {len(ps_values)} pack_skills")
    print("\n✅ Seeding complete!")

if __name__ == '__main__':
    seed()
