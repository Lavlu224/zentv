import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { data: channelData, error: chErr } = await supabase.from('channels').select('category');
    if (chErr) throw chErr;
    const channelCats = channelData.map((c: any) => c.category);

    let tableCats: string[] = [];
    const { data: catData, error: catErr } = await supabase.from('categories').select('*');
    if (catErr) {
      console.error('Categories table query failed:', catErr.message);
    } else if (catData) {
      tableCats = catData.map((c: any) => c.name);
    }

    const all = [...new Set([...channelCats, ...tableCats])].sort();
    return NextResponse.json({ categories: all });
  } catch (e: any) {
    console.error('GET /api/categories error:', e?.message || e);
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(req: Request) {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const { error } = await supabase.from('categories').insert({ name });
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { oldName, newName } = await req.json();
    if (!oldName || !newName) return NextResponse.json({ error: 'Missing oldName or newName' }, { status: 400 });
    const { error: chErr } = await supabase.from('channels').update({ category: newName }).eq('category', oldName);
    if (chErr) throw chErr;
    await supabase.from('categories').update({ name: newName }).eq('name', oldName);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to rename category' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Missing category name' }, { status: 400 });
    const { error: chErr } = await supabase.from('channels').delete().eq('category', name);
    if (chErr) throw chErr;
    await supabase.from('categories').delete().eq('name', name);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
