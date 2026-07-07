import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase
      .from('channels')
      .update({
        name: body.name,
        description: body.description,
        logo: body.logo,
        category: body.category,
        stream_url: body.streamUrl,
        language: body.language,
        country: body.country,
        quality: body.quality,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('Supabase update error:', err);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Supabase delete error:', err);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
