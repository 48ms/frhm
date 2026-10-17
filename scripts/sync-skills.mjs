import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from app/.env.local
dotenv.config({ path: path.resolve(__dirname, '../app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SMS_REPO_PATH = path.resolve(__dirname, '../social-media-skills/skills');
const PACKS_JSON_PATH = path.resolve(__dirname, '../social-media-skills/scripts/packs.json');

const CATEGORY_MAP = {
  'Foundation & strategy': [
    'brand-profile', 'voice-builder', 'writing-style-and-tone', 'audience-research',
    'social-strategy', 'content-pillars', 'goals-and-kpis', 'profile-optimization', 'competitor-analysis'
  ],
  'Ideas & content angles': [
    'idea-generation-and-ideation', 'content-research-and-sourcing', 'educational-content-and-how-to',
    'storytelling-and-narrative', 'contrarian-and-opinion', 'before-after-and-transformation',
    'social-proof-and-testimonials', 'listicle-and-roundup', 'behind-the-scenes-and-founder',
    'interactive-content', 'meme-and-culture', 'trend-jacking', 'data-and-original-research',
    'viral-reverse-engineering'
  ],
  'Copy & captions': [
    'hook-writer', 'caption-writer', 'thread-writer', 'threads-post',
    'text-post-and-microblog', 'carousel-writer', 'story-writer', 'reply-and-comment-writer'
  ],
  'Video scripts': [
    'short-form-video-script', 'reels-script', 'tiktok-script', 'youtube-shorts',
    'youtube-long-form', 'scripting-and-storyboarding', 'talking-head-and-piece-to-camera',
    'podcast-and-audiograms', 'livestream-and-realtime'
  ],
  'AI video': ['ai-video', 'veo-3', 'kling', 'luma', 'heygen', 'synthesia', 'runway'],
  'Visual & design': [
    'design-and-templates', 'thumbnail-design', 'pinterest-pin-design',
    'quote-cards-and-text-graphics', 'infographic-and-data-viz', 'image-prompt',
    'nano-banana', 'ideogram', 'flux', 'ai-image-editing', 'canva'
  ],
  'Voice & music': ['ai-voiceover', 'suno', 'ai-music-and-sound'],
  'Editing & clipping': ['capcut', 'descript', 'opus-clip', 'captions-and-clipping'],
  'Platform growth': [
    'instagram-growth', 'tiktok-growth', 'tiktok-photo-mode', 'linkedin-growth',
    'linkedin-post-writer', 'linkedin-company-pages', 'x-growth', 'threads-growth',
    'facebook-strategy', 'facebook-groups', 'pinterest-growth', 'pinterest-seo',
    'youtube-publishing-and-metadata', 'reddit-marketing'
  ],
  'Distribution & monetization': [
    'hashtag-strategy', 'social-seo', 'ai-search-optimization',
    'cross-platform-repurposing', 'content-recycling', 'link-in-bio-and-traffic',
    'lead-magnets-and-funnels', 'social-selling-and-dm', 'collabs-and-cross-promotion',
    'ugc-and-influencer', 'creator-monetization', 'email-and-newsletter', 'instagram-seo'
  ],
  'Community & operations': ['engagement-routine', 'community-management', 'crisis-and-moderation'],
  'Publishing & measurement': [
    'scheduling-and-queue', 'platform-specs-and-validation', 'analytics-and-reporting',
    'content-audit', 'experimentation-and-ab-testing', 'instagram-reels-publishing',
    'tiktok-video-publishing'
  ],
  'Planning': [
    'campaign-and-launch-planning', 'batch-content-plan', 'content-calendar',
    'seasonal-and-moment-marketing'
  ],
};

function getCategory(skillName) {
  for (const [cat, skills] of Object.entries(CATEGORY_MAP)) {
    if (skills.includes(skillName)) return cat;
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
    const { name, description, allowedTools } = extractFrontmatter(content);
    const category = getCategory(skillId);
    const job = description && description.length > 120 ? description.slice(0, 120) + '...' : description;

    skillsData.push({
      id: skillId,
      name: name || skillId,
      description,
      category,
      job,
      allowed_tools: allowedTools,
    });

    const files = loadSkillFiles(dir);
    for (const [relPath, fileContent] of Object.entries(files)) {
      allFiles.push({
        skill_id: skillId,
        path: relPath,
        content: fileContent,
      });
    }
  }

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
