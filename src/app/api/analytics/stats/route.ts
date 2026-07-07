import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [liveViewersRes, todayViewsRes, totalSessionsRes, topChannelsRes, hourlyRes] = await Promise.all([
      supabase.from('view_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('view_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStart),
      supabase.from('view_sessions').select('duration_seconds').not('ended_at', 'is', null),
      supabase.from('view_sessions').select('channel_id, duration_seconds').gte('started_at', todayStart).order('started_at', { ascending: false }),
      supabase.from('analytics_events').select('created_at').eq('event_type', 'play').gte('created_at', todayStart),
    ]);

    const liveViewers = liveViewersRes.count || 0;
    const todayViews = todayViewsRes.count || 0;

    const totalSessions = totalSessionsRes.data || [];
    const totalMinutes = Math.round(totalSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60);

    const topRows = topChannelsRes.data || [];
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

    const hourlyData = hourlyRes.data || [];
    const hourlyMap: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[`${h}:00`] = 0;
    }
    hourlyData.forEach((e: any) => {
      const d = new Date(e.created_at);
      const hour = d.getHours();
      hourlyMap[`${hour}:00`] = (hourlyMap[`${hour}:00`] || 0) + 1;
    });

    return NextResponse.json({
      liveViewers,
      todayViews,
      totalMinutes,
      topChannels: topChannels.map(c => ({ ...c, name: channelNames[c.channelId] || `Channel #${c.channelId}` })),
      hourlyData: Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count })),
    });
  } catch (e: any) {
    console.error('Stats error:', e);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
