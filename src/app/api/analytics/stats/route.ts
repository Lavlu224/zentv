import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function safeQuery(q: any) {
  return q.catch(() => ({ count: 0, data: [] }));
}

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({
      liveViewers: 0, todayViews: 0, totalMinutes: 0, topChannels: [], hourlyData: [],
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const results = await Promise.allSettled([
      supabase.from('view_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('view_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStart),
      supabase.from('view_sessions').select('duration_seconds').not('ended_at', 'is', null),
      supabase.from('view_sessions').select('channel_id, duration_seconds').gte('started_at', todayStart).order('started_at', { ascending: false }),
      supabase.from('analytics_events').select('created_at').eq('event_type', 'play').gte('created_at', todayStart),
    ]);

    const getCount = (r: PromiseSettledResult<any>, fallback = 0) =>
      r.status === 'fulfilled' ? (r.value.count ?? fallback) : fallback;
    const getData = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value.data ?? []) : [];

    const liveViewers = getCount(results[0]);
    const todayViews = getCount(results[1]);
    const totalSessions = getData(results[2]);
    const totalMinutes = Math.round(totalSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60);
    const topRows = getData(results[3]);
    const hourlyData = getData(results[4]);

    const channelMap: Record<number, { views: number; minutes: number }> = {};
    topRows.forEach((r: any) => {
      if (!channelMap[r.channel_id]) channelMap[r.channel_id] = { views: 0, minutes: 0 };
      channelMap[r.channel_id].views++;
      channelMap[r.channel_id].minutes += Math.round((r.duration_seconds || 0) / 60);
    });
    const topChannels = Object.entries(channelMap)
      .map(([id, data]) => ({ channelId: Number(id), ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const channelIds = topChannels.map(c => c.channelId);
    let channelNames: Record<number, string> = {};
    if (channelIds.length > 0) {
      const { data: channels } = await supabase.from('channels').select('id, name').in('id', channelIds);
      if (channels) channels.forEach((c: any) => { channelNames[c.id] = c.name; });
    }

    const hourlyMap: Record<string, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[`${h}:00`] = 0;
    hourlyData.forEach((e: any) => {
      const d = new Date(e.created_at);
      hourlyMap[`${d.getHours()}:00`] = (hourlyMap[`${d.getHours()}:00`] || 0) + 1;
    });

    return NextResponse.json({
      liveViewers,
      todayViews,
      totalMinutes,
      topChannels: topChannels.map(c => ({ ...c, name: channelNames[c.channelId] || `Channel #${c.channelId}` })),
      hourlyData: Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count })),
    });
  } catch {
    return NextResponse.json({
      liveViewers: 0, todayViews: 0, totalMinutes: 0, topChannels: [], hourlyData: [],
    });
  }
}
