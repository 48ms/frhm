import os
import re

directory = '.'
lucide_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"]', re.DOTALL)

all_icons = set()

for root, _, files in os.walk(directory):
    if '.git' in root or 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = lucide_pattern.findall(content)
                    for match in matches:
                        icons = match.split(',')
                        for icon in icons:
                            icon = icon.strip()
                            if not icon: continue
                            if ' type ' in icon or icon.startswith('type '):
                                continue 
                            if ' as ' in icon:
                                icon = icon.split(' as ')[0].strip()
                            all_icons.add(icon)
            except Exception as e:
                pass

print('Found icons:', sorted(list(all_icons)))
