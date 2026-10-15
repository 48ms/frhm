import json
from collections import defaultdict

with open('app/dogfood-output/all_skills_dump.json', 'r', encoding='utf-8') as f:
    skills = json.load(f)

by_cat = defaultdict(list)
for s in skills:
    by_cat[s['category']].append(s)

actively_wired = {
    'batch-content-plan': 'Copilot generateBatchPlan (Content Planning Modal & Calendar)',
    'caption-writer': 'Copilot generateCaption (SchedulePostModal & Composer)',
    'idea-generation-and-ideation': 'Copilot generateContentIdeas (Composer / Content Lab)',
    'tiktok-script': 'Copilot generateVideoScript (Routing: TikTok)',
    'reels-script': 'Copilot generateVideoScript (Routing: Instagram Reels)',
    'short-form-video-script': 'Copilot generateVideoScript (Routing: YouTube Shorts / generic)',
    'cross-platform-repurposing': 'Copilot repurposeCrossPlatform (Multi-platform Adapt)',
    'hook-writer': 'Copilot generateHooks (AiHookModal & Composer)',
    'carousel-writer': 'Copilot generateCarousel (Carousel Slide Brief & Script)',
    'platform-specs-and-validation': 'Copilot validatePlatformPost (Pre-publish Validator)',
    'nano-banana': 'Copilot generateVisualPrompt (Flux / Midjourney / DALL-E)',
    'image-prompt': 'Copilot generateVisualPrompt (Midjourney prompt engineering)',
    'ideogram': 'Copilot generateVisualPrompt (Typography & Text-in-image)',
    'flux': 'Copilot generateVisualPrompt (Photorealistic & Concept art)',
    'trend-jacking': 'Copilot evaluateTrend & Trend Radar (/api/trends/radar)',
    'analytics-and-reporting': 'Analytics generateDailyInsight (Daily Insight Cron & Dashboard)',
    'brand-profile': 'Brand Profile Sync (client_files brand-profile.md)',
    'voice-builder': 'Brand Context Injection (voice.md in loadClientFiles)',
    'content-pillars': 'Brand Context Injection (content-pillars.md in loadClientFiles)',
    'guardrails': 'Brand Context Injection (guardrails.md in loadClientFiles)'
}

print(f'Total skills: {len(skills)}')
active_count = sum(1 for s in skills if s['id'] in actively_wired)
dormant_count = len(skills) - active_count
print(f'Actively wired skills in Frhm pipeline: {active_count}')
print(f'Unwired / Dormant skills in database: {dormant_count}\n')

for cat, cat_skills in by_cat.items():
    print(f'=== {cat} ({len(cat_skills)} skills) ===')
    for s in cat_skills:
        status = 'ACTIVE' if s['id'] in actively_wired else 'DORMANT'
        note = f' -> {actively_wired[s["id"]]}' if status == 'ACTIVE' else ''
        print(f'  [{status:7s}] {s["id"]}{note}')
