import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });
    const body = await req.json();
    const { channelId, viewerId, eventType, metadata, sessionId } = body;
    if (!channelId || !viewerId || !eventType) {
      return NextResponse.json({ ok: true });
    }

    if (eventType === 'heartbeat' && sessionId) {
      const { data: session } = await supabase.from('view_sessions').select('started_at').eq('id', sessionId).single();
      if (session) {
        const seconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        await supabase.from('view_sessions').update({ duration_seconds: seconds, is_active: true }).eq('id', sessionId);
      }
      return NextResponse.json({ ok: true });
    }

    if (eventType === 'play') {
      const device = metadata?.device || '';
      const ip = req.headers.get('x-forwarded-for') || '';
      const { data: session } = await supabase.from('view_sessions').insert({
        channel_id: channelId,
        viewer_id: viewerId,
        device,
        ip,
      }).select('id').single();

      if (session) {
        await supabase.from('analytics_events').insert({
          channel_id: channelId, viewer_id: viewerId, session_id: session.id, event_type: 'play', metadata: metadata || {},
        });
        return NextResponse.json({ sessionId: session.id });
      }
      return NextResponse.json({ ok: true });
    }

    if (eventType === 'stop' && sessionId) {
      const { data: session } = await supabase.from('view_sessions').select('started_at').eq('id', sessionId).single();
      if (session) {
        const seconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        await supabase.from('view_sessions').update({ ended_at: new Date().toISOString(), duration_seconds: seconds, is_active: false }).eq('id', sessionId);
      }
      await supabase.from('analytics_events').insert({
        channel_id: channelId, viewer_id: viewerId, session_id: sessionId, event_type: 'stop', metadata: metadata || {},
      });
      return NextResponse.json({ ok: true });
    }

    if (sessionId) {
      await supabase.from('analytics_events').insert({
        channel_id: channelId, viewer_id: viewerId, session_id: sessionId, event_type: eventType, metadata: metadata || {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
