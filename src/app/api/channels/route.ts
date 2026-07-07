import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface DbChannel {
  id: number;
  name: string;
  description: string;
  logo: string;
  category: string;
  is_live: boolean;
  viewers: string;
  stream_url: string;
  language: string;
  country: string;
  quality: string;
}

function toCamelCase(ch: DbChannel) {
  return {
    id: String(ch.id),
    name: ch.name,
    description: ch.description,
    logo: ch.logo,
    category: ch.category,
    isLive: ch.is_live,
    viewers: ch.viewers,
    streamUrl: ch.stream_url,
    language: ch.language,
    country: ch.country,
    quality: ch.quality,
  };
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const channels = (data as DbChannel[]).map(toCamelCase);
    return NextResponse.json({ channels, total: channels.length });
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: body.name,
        description: body.description || `Live stream of ${body.name}`,
        logo: body.logo || '',
        category: body.category || 'Uncategorized',
        is_live: true,
        viewers: '1K',
        stream_url: body.streamUrl,
        language: body.language || 'Bengali',
        country: body.country || 'BD',
        quality: body.quality || 'HD',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(toCamelCase(data as DbChannel));
  } catch (err) {
    console.error('Supabase insert error:', err);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
