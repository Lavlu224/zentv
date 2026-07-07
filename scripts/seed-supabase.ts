/**
 * One-time script: fetch M3U data and insert into Supabase.
 * Run: npx tsx scripts/seed-supabase.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const M3U_URL = 'https://raw.githubusercontent.com/subirkumarpaul/Subirmaxpro/main/Subirmaxpro';

function isValidUrl(str: string): boolean {
  if (!str || str.length < 5) return false;
  if (!str.startsWith('http://') && !str.startsWith('https://')) return false;
  if (str.startsWith('://')) return false;
  try { new URL(str); return true; } catch { return false; }
}

async function main() {
  console.log('Fetching M3U...');
  const res = await fetch(M3U_URL);
  const text = await res.text();
  const lines = text.split('\n');

  const channels: any[] = [];
  let idCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF')) continue;

    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupTitleMatch = line.match(/group-title="([^"]*)"/);
    const nameMatch = line.match(/,([^,]+)$/);

    const rawLogo = tvgLogoMatch?.[1] || '';
    const category = groupTitleMatch?.[1]?.trim() || 'Uncategorized';
    const name = nameMatch?.[1]?.trim() || 'Unknown';

    const streamUrl = lines[i + 1]?.trim();
    if (!streamUrl || !isValidUrl(streamUrl)) continue;

    if (!rawLogo && (streamUrl.includes('tsports') || streamUrl.includes('gazi'))) {
      continue;
    }

    const logo = rawLogo && isValidUrl(rawLogo)
      ? `/api/proxy?url=${encodeURIComponent(rawLogo)}`
      : `https://placehold.co/100x60/1F2937/7C3AED?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`;

    const quality = streamUrl.includes('4K') || name.includes('4K') ? '4K'
      : streamUrl.includes('FHD') || streamUrl.includes('1080') ? 'FHD'
      : streamUrl.includes('HD') || streamUrl.includes('720') ? 'HD'
      : 'HD';

    const language = category.toLowerCase().includes('bangla') || category.toLowerCase().includes('kolkata') ? 'Bengali'
      : category.toLowerCase().includes('indian') || category.toLowerCase().includes('hindi') ? 'Hindi'
      : category.toLowerCase().includes('english') || category.toLowerCase().includes('movies') ? 'English'
      : 'Bengali';

    const country = category.toLowerCase().includes('bangla') || category.toLowerCase().includes('kolkata') ? 'BD'
      : category.toLowerCase().includes('indian') || category.toLowerCase().includes('hindi') ? 'IN'
      : 'US';

    channels.push({
      name,
      description: `Live stream of ${name}`,
      logo,
      category,
      is_live: true,
      viewers: `${Math.floor(Math.random() * 50 + 1)}K`,
      stream_url: streamUrl,
      language,
      country,
      quality,
    });

    idCounter++;
  }

  // Deduplicate
  const seen = new Map<string, any>();
  for (const ch of channels) {
    const key = `${ch.name}|${ch.category}`;
    if (!seen.has(key)) seen.set(key, ch);
  }

  const unique = Array.from(seen.values());
  console.log(`Inserting ${unique.length} channels...`);

  const { error } = await supabase.from('channels').insert(unique);
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Done!');
  }
}

main().catch(console.error);
