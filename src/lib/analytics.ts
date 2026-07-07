let viewerId = '';
function getViewerId(): string {
  if (viewerId) return viewerId;
  const stored = localStorage.getItem('zenty_viewer_id');
  if (stored) { viewerId = stored; return viewerId; }
  viewerId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem('zenty_viewer_id', viewerId);
  return viewerId;
}

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export class Tracker {
  private channelId: number;
  private sessionId: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private viewerId: string;

  constructor(channelId: number) {
    this.channelId = channelId;
    this.viewerId = getViewerId();
  }

  async start() {
    try {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: this.channelId,
          viewerId: this.viewerId,
          eventType: 'play',
          metadata: { device: getDevice() },
        }),
      });
      const data = await res.json();
      this.sessionId = data.sessionId;
      this.heartbeatInterval = setInterval(() => this.heartbeat(), 30000);
    } catch {}
  }

  private async heartbeat() {
    if (!this.sessionId) return;
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: this.channelId,
          viewerId: this.viewerId,
          sessionId: this.sessionId,
          eventType: 'heartbeat',
        }),
      });
    } catch {}
  }

  async stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.sessionId) {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: this.channelId,
            viewerId: this.viewerId,
            sessionId: this.sessionId,
            eventType: 'stop',
          }),
        });
      } catch {}
      this.sessionId = null;
    }
  }
}
