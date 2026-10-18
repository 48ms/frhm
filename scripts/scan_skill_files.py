import os
import re
from pathlib import Path

sms_dir = Path("social-media-skills/skills")
skills = sorted([d.name for d in sms_dir.iterdir() if d.is_dir()])

writes_pattern = re.compile(r'(?:writes?|creates?|produces?|outputs?|saves?)\s+[`"\'\(]?([a-zA-Z0-9_-]+\.md)', re.IGNORECASE)
reads_pattern = re.compile(r'(?:reads?|consumes?|loads?|checks?|requires?)\s+[`"\'\(]?([a-zA-Z0-9_-]+\.md)', re.IGNORECASE)

print(f"Scanning {len(skills)} upstream skills for file interactions...\n")

skill_file_map = {}
for s in skills:
    skill_md = sms_dir / s / "SKILL.md"
    if not skill_md.exists():
        continue
    text = skill_md.read_text(encoding="utf-8")
    
    # find all .md files mentioned
    all_md = set(re.findall(r'[`"\'\(]([a-zA-Z0-9_-]+\.md)[`"\'\)]', text))
    # filter out SKILL.md, README.md, CONTRIBUTING.md, REGISTRY.md, etc.
    brand_md = [f for f in all_md if f not in {'SKILL.md', 'README.md', 'CONTRIBUTING.md', 'REGISTRY.md', 'SECURITY.md', 'VERSIONS.md'}]
    
    writes = set(writes_pattern.findall(text))
    reads = set(reads_pattern.findall(text))
    
    writes = [f for f in writes if f in brand_md]
    reads = [f for f in reads if f in brand_md]
    
    if brand_md:
        skill_file_map[s] = {
            "all_brand_md": brand_md,
            "reads": reads,
            "writes": writes
        }

for s, data in skill_file_map.items():
    print(f"Skill: {s}")
    print(f"  Brand .md mentioned: {data['all_brand_md']}")
    if data['reads']:
        print(f"  Reads: {data['reads']}")
    if data['writes']:
        print(f"  Writes: {data['writes']}")
