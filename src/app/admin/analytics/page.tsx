'use client';

import { useState, useEffect } from 'react';
import { Eye, Users, Clock, TrendingUp, Loader2, Tv, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  liveViewers: number;
  todayViews: number;
  totalMinutes: number;
  topChannels: { channelId: number; name: string; views: number; minutes: number }[];
  hourlyData: { hour: string; count: number }[];
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics/stats');
        const data = await res.json();
        setStats(data);
      } catch {} finally { setLoading(false); }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[#1F2937] rounded-[20px] animate-pulse" />)}
        </div>
      </div>
    );
  }

  const maxHourly = Math.max(...(stats?.hourlyData?.map(h => h.count) || [1]), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Analytics</h1>
          <p className="text-sm text-[#64748B] mt-1">Real-time viewer analytics & insights</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1F2937] rounded-[20px] p-5 border border-[rgba(255,255,255,.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[12px] bg-[rgba(34,197,94,.1)]"><Eye className="w-4 h-4 text-[#22C55E]" /></div>
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Live Now</span>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{stats?.liveViewers || 0}</p>
          <p className="text-xs text-[#64748B] mt-1">current viewers</p>
        </div>

        <div className="bg-[#1F2937] rounded-[20px] p-5 border border-[rgba(255,255,255,.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[12px] bg-[rgba(124,58,237,.1)]"><Users className="w-4 h-4 text-[#8B5CF6]" /></div>
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Today</span>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{stats?.todayViews || 0}</p>
          <p className="text-xs text-[#64748B] mt-1">total views today</p>
        </div>

        <div className="bg-[#1F2937] rounded-[20px] p-5 border border-[rgba(255,255,255,.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[12px] bg-[rgba(6,182,212,.1)]"><Clock className="w-4 h-4 text-[#06B6D4]" /></div>
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Watch Time</span>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{(stats?.totalMinutes || 0).toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">total minutes watched</p>
        </div>

        <div className="bg-[#1F2937] rounded-[20px] p-5 border border-[rgba(255,255,255,.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[12px] bg-[rgba(239,68,68,.1)]"><TrendingUp className="w-4 h-4 text-[#EF4444]" /></div>
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Avg Watch</span>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">
            {stats?.todayViews && stats.todayViews > 0
              ? Math.round((stats.totalMinutes || 0) / stats.todayViews)
              : 0}
          </p>
          <p className="text-xs text-[#64748B] mt-1">min per viewer</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#1F2937] rounded-[24px] p-5 border border-[rgba(255,255,255,.06)]">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Today's Viewership</h3>
          <div className="h-48 flex items-end gap-1.5">
            {stats?.hourlyData?.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-[4px] bg-gradient-to-t from-[#7C3AED] to-[#8B5CF6] transition-all duration-500"
                  style={{ height: `${(h.count / maxHourly) * 100}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                />
                <span className="text-[9px] text-[#64748B]">{h.hour.split(':')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1F2937] rounded-[24px] p-5 border border-[rgba(255,255,255,.06)]">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Top Channels Today</h3>
          {(!stats?.topChannels || stats.topChannels.length === 0) ? (
            <div className="text-center py-10 text-[#64748B] text-sm">No data yet</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {stats.topChannels.map((ch, i) => (
                <Link key={ch.channelId} href={`/admin/channels`} className="flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-[rgba(255,255,255,.03)] transition-colors">
                  <span className="w-5 text-center text-xs font-medium text-[#64748B]">{i + 1}</span>
                  <Tv className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="flex-1 text-sm text-[#CBD5E1] truncate">{ch.name}</span>
                  <span className="text-xs text-[#94A3B8]">{ch.views} views</span>
                  <span className="text-xs text-[#64748B]">{ch.minutes}m</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
