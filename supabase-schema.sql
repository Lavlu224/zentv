-- Run this in Supabase SQL Editor

CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  category TEXT DEFAULT 'Uncategorized',
  is_live BOOLEAN DEFAULT true,
  viewers TEXT DEFAULT '1K',
  stream_url TEXT NOT NULL,
  language TEXT DEFAULT 'Bengali',
  country TEXT DEFAULT 'BD',
  quality TEXT DEFAULT 'HD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_category ON channels(category);
CREATE INDEX idx_channels_name ON channels(name);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  device TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_view_sessions_channel ON view_sessions(channel_id);
CREATE INDEX idx_view_sessions_viewer ON view_sessions(viewer_id);
CREATE INDEX idx_view_sessions_active ON view_sessions(is_active);
CREATE INDEX idx_view_sessions_started ON view_sessions(started_at);

CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  session_id UUID REFERENCES view_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_channel ON analytics_events(channel_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

CREATE TABLE channel_daily_stats (
  id BIGSERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_watch_minutes INTEGER DEFAULT 0,
  peak_concurrent INTEGER DEFAULT 0,
  UNIQUE(channel_id, date)
);

CREATE INDEX idx_daily_stats_date ON channel_daily_stats(date);
