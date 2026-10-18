import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from app/.env.local
const envPath = path.resolve(__dirname, '../app/.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in app/.env.local');
  process.exit(1);
}

const supabaseJsPath = path.resolve(__dirname, '../app/node_modules/@supabase/supabase-js/dist/index.mjs');
const { createClient } = await import(pathToFileURL(supabaseJsPath).href);
const supabase = createClient(supabaseUrl, supabaseKey);

const SMS_REPO_PATH = path.resolve(__dirname, '../social-media-skills/skills');
const PACKS_JSON_PATH = path.resolve(__dirname, '../social-media-skills/scripts/packs.json');

const TAXONOMY_PATH = path.resolve(__dirname, '../social-media-skills/scripts/site-taxonomy.json');

const STAGE_MAP = {
  'Foundation & strategy': 'foundation',
  'Ideas & content angles': 'plan',
  'Copy & captions': 'create',
  'Video scripts': 'create',
  'AI video': 'media',
  'Visual & design': 'media',
  'Voice & music': 'media',
  'Editing & clipping': 'media',
  'Platform growth': 'grow',
  'Plan, publish & schedule': 'publish',
  'Hashtags & SEO': 'grow',
  'Community & engagement': 'grow',
  'Influencer, funnels & monetization': 'grow',
  'Analytics & optimization': 'measure',
};

function deriveFileDependencies(skillId) {
  const WRITES_MAP = {
    'brand-profile': ['brand-profile.md'],
    'voice-builder': ['voice.md'],
    'writing-style-and-tone': ['voice.md'],
    'content-pillars': ['content-pillars.md'],
    'guardrails': ['guardrails.md'],
    'audience-research': ['audience.md'],
    'social-strategy': ['social-strategy.md'],
    'goals-and-kpis': ['goals-and-kpis.md'],
    'content-calendar': ['content-calendar.md'],
    'batch-content-plan': ['content-calendar.md'],
    'competitor-analysis': ['competitor-analysis.md'],
    'campaign-and-launch-planning': ['campaign-plan.md'],
  };

  const READS_MAP = {
    'brand-profile': [],
    'voice-builder': ['brand-profile.md'],
    'writing-style-and-tone': ['brand-profile.md'],
    'audience-research': ['brand-profile.md'],
    'social-strategy': ['brand-profile.md', 'audience.md'],
    'content-pillars': ['brand-profile.md', 'social-strategy.md'],
    'goals-and-kpis': ['brand-profile.md', 'social-strategy.md'],
    'content-calendar': ['brand-profile.md', 'social-strategy.md', 'content-pillars.md'],
    'batch-content-plan': ['brand-profile.md', 'voice.md', 'content-pillars.md'],
    'competitor-analysis': ['brand-profile.md'],
    'campaign-and-launch-planning': ['brand-profile.md', 'social-strategy.md', 'content-pillars.md'],
  };

  const writes = WRITES_MAP[skillId] || [];
  const reads = READS_MAP[skillId] || ['brand-profile.md', 'voice.md'];
  return { reads, writes };
}

function getTaxonomyMap() {
  if (fs.existsSync(TAXONOMY_PATH)) {
    return JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
  }
  return {};
}

const TAXONOMY = getTaxonomyMap();

function getCategory(skillName) {
  for (const [groupName, skills] of Object.entries(TAXONOMY)) {
    if (skills.includes(skillName)) return groupName;
  }
  return 'uncategorized';
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { name: null, description: null, version: '1.0.0', allowedTools: null };
  const fm = match[1];

  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : null;

  const descBlockMatch = fm.match(/^description:\s*>\-\n((?:  .+\n?)*)/m);
  let description = null;
  if (descBlockMatch) {
    description = descBlockMatch[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
  } else {
    const descSimple = fm.match(/^description:\s*(.+)$/m);
    description = descSimple ? descSimple[1].trim() : null;
  }

  const verMatch = fm.match(/^version:\s*(.+)$/m);
  const version = verMatch ? verMatch[1].trim() : '1.0.0';

  const toolsMatch = fm.match(/^allowed-tools:\s*(.+)$/m);
  const allowedTools = toolsMatch ? toolsMatch[1].trim() : null;

  return { name, description, version, allowedTools };
}

function loadSkillFiles(skillDir) {
  const files = {};
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const rel = path.relative(skillDir, fullPath).replace(/\\/g, '/');
        files[rel] = fs.readFileSync(fullPath, 'utf8');
      }
    }
  }
  walk(skillDir);
  return files;
}

async function sync() {
  console.log('--- Syncing social-media-skills to Supabase ---');
  if (!fs.existsSync(SMS_REPO_PATH)) {
    console.error('Directory not found:', SMS_REPO_PATH);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SMS_REPO_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  console.log(`Found ${skillDirs.length} skills in repo.`);

  const skillsData = [];
  const allFiles = [];

  for (const skillId of skillDirs) {
    const dir = path.join(SMS_REPO_PATH, skillId);
    const skillMdPath = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    const content = fs.readFileSync(skillMdPath, 'utf8');
    const files = loadSkillFiles(dir);
    const { name, description, version, allowedTools } = extractFrontmatter(content);
    const category = getCategory(skillId);
    const job = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
    const { reads, writes } = deriveFileDependencies(skillId);
    const stage = STAGE_MAP[category] || 'create';

    skillsData.push({
      id: skillId,
      name: name || skillId,
      description,
      category,
      job,
      allowed_tools: allowedTools,
      reads_files: reads,
      writes_files: writes,
      version: version || '1.0.0',
      group_name: category,
      stage,
      file_count: Object.keys(files).length,
    });

    for (const [relPath, fileContent] of Object.entries(files)) {
      allFiles.push({
        skill_id: skillId,
        path: relPath,
        content: fileContent,
      });
    }
  }

  // Sync skill groups
  const groupsRows = Object.keys(TAXONOMY).map((groupName, idx) => ({
    name: groupName,
    sort_order: idx + 1,
    stage: STAGE_MAP[groupName] || 'create',
  }));
  console.log(`Syncing ${groupsRows.length} skill groups into public.skill_groups...`);
  await supabase.from('skill_groups').upsert(groupsRows, { onConflict: 'name' });

  console.log(`Upserting ${skillsData.length} skills into public.skills...`);
  const { error: skillErr } = await supabase.from('skills').upsert(skillsData, { onConflict: 'id' });
  if (skillErr) {
    console.error('Error upserting skills:', skillErr.message);
  } else {
    console.log(`✓ Successfully synced ${skillsData.length} skills!`);
  }

  console.log(`Upserting ${allFiles.length} skill files into public.skill_files...`);
  const CHUNK_SIZE = 40;
  let inserted = 0;
  for (let i = 0; i < allFiles.length; i += CHUNK_SIZE) {
    const chunk = allFiles.slice(i, i + CHUNK_SIZE);
    const { error: fileErr } = await supabase.from('skill_files').upsert(chunk, { onConflict: 'skill_id,path' });
    if (fileErr) {
      console.error(`Error upserting chunk ${i}:`, fileErr.message);
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`✓ Successfully synced ${inserted} / ${allFiles.length} skill files!`);

  // Sync Packs
  if (fs.existsSync(PACKS_JSON_PATH)) {
    const packsData = JSON.parse(fs.readFileSync(PACKS_JSON_PATH, 'utf8')).packs;
    console.log(`Syncing ${packsData.length} topic packs...`);

    const packsRows = packsData.map((p, idx) => ({
      id: p.name,
      name: p.title,
      description: p.description || '',
      category: p.name,
      tagline: p.tagline || '',
      slug: p.name,
      sort_order: idx + 1,
    }));

    await supabase.from('skill_packs').upsert(packsRows, { onConflict: 'id' });

    const packSkillsRows = [];
    for (const p of packsData) {
      for (const s of p.skills) {
        packSkillsRows.push({ pack_id: p.name, skill_id: s });
      }
    }

    await supabase.from('pack_skills').upsert(packSkillsRows, { onConflict: 'pack_id,skill_id' });
    console.log(`✓ Successfully synced ${packsData.length} packs & ${packSkillsRows.length} pack skills!`);
  }

  console.log('\n--- Sync Complete! ---');
}

sync();
