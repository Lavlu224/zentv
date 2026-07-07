import { supabase } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

async function importChannelsFromFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const channels = JSON.parse(content) as Array<{
    name: string;
    logo?: string;
    url: string;
    group?: string;
    useProxy?: boolean;
  }>;

  console.log(`Found ${channels.length} channels in ${filePath}`);

  if (!supabase) {
    console.error('Supabase not configured');
    return { added: 0, skipped: 0, errors: channels.length };
  }

  let added = 0;
  let skipped = 0;
  const errors: Array<{ name: string; reason: string }> = [];

  for (const ch of channels) {
    if (!ch.url || !ch.name) {
      errors.push({ name: ch.name || 'Unknown', reason: 'Missing url or name' });
      skipped++;
      continue;
    }

    const { data: existing, error: checkError } = await supabase
      .from('channels')
      .select('id, stream_url')
      .eq('stream_url', ch.url)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const category = ch.group || 'Uncategorized';

    // Get or create category
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .maybeSingle();

    if (!catData) {
      const { error: catErr } = await supabase
        .from('categories')
        .insert({ name: category })
        .select()
        .maybeSingle();
      if (catErr) {
        console.error(`Category error for ${category}: ${catErr.message}`);
      }
    }

    const { error: insertErr } = await supabase
      .from('channels')
      .insert({
        name: ch.name,
        description: '',
        logo: ch.logo || '',
        category: category,
        is_live: true,
        viewers: '0',
        stream_url: ch.url,
        language: ch.name.includes('Bangla') ? 'Bengali' : 'English',
        country: 'BD',
        quality: 'HD',
      });

    if (insertErr) {
      console.error(`Error inserting ${ch.name}: ${insertErr.message}`);
      errors.push({ name: ch.name, reason: insertErr.message });
    } else {
      added++;
    }

    if (added % 50 === 0) {
      console.log(`Added ${added} channels...`);
    }
  }

  return { added, skipped, errors: errors.length };
}

async function main() {
  const scriptDir = path.dirname(__filename);
  const channelsDir = path.join(scriptDir, 'channels');

  console.log('Starting import from IPTV-Web repo...\n');

  const files = ['bangla-channels.json', 'channels.json'];
  for (const file of files) {
    const filePath = path.join(channelsDir, file);
    if (fs.realpathSync(filePath)) {
      console.log(`Processing ${file}...`);
      const result = await importChannelsFromFile(filePath);
      console.log(`Result: ${result.added} added, ${result.skipped} skipped, ${result.errors} errors\n`);
    } else {
      console.log(`File not found: ${file}`);
    }
  }

  console.log('Import completed!');
}

main().catch(console.error);
