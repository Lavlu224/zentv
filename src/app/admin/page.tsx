'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tv, FolderTree, Eye, TrendingUp, ArrowUpRight } from 'lucide-react';
import { channelService } from '@/lib/channelService';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ channels: 0, categories: 0, live: 0, viewers: 0 });
  const [recentChannels, setRecentChannels] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const channels = await channelService.fetchChannels();
        const categories = await channelService.getCategories();
        setStats({
          channels: channels.length,
          categories: categories.length,
          live: channels.filter(c => c.isLive).length,
          viewers: channels.reduce((sum, c) => sum + parseInt(String(c.viewers).replace(/\D/g, '')) || 0, 0),
        });
        setRecentChannels(channels.slice(0, 5));
      } catch {}
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Channels', value: stats.channels, icon: Tv, href: '/admin/channels', color: 'text-[#8B5CF6]', bg: 'bg-[rgba(124,58,237,.1)]' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, href: '/admin/categories', color: 'text-[#06B6D4]', bg: 'bg-[rgba(6,182,212,.1)]' },
    { label: 'Live Now', value: stats.live, icon: Eye, href: '/admin/channels', color: 'text-[#EF4444]', bg: 'bg-[rgba(239,68,68,.1)]' },
    { label: 'Total Viewers', value: stats.viewers.toLocaleString(), icon: TrendingUp, href: '/admin/channels', color: 'text-[#22C55E]', bg: 'bg-[rgba(34,197,94,.1)]' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">Overview of your channel platform</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] p-5 hover:shadow-[0_20px_60px_rgba(124,58,237,.35)] hover:border-[#7C3AED] transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-[14px] ${card.bg}`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#64748B]" />
            </div>
            <p className="text-2xl font-bold text-[#F8FAFC]">{card.value}</p>
            <p className="text-sm text-[#94A3B8] mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,.06)]">
          <h2 className="font-semibold text-[#F8FAFC]">Recent Channels</h2>
          <Link href="/admin/channels" className="text-sm text-[#8B5CF6] hover:text-[#A855F7] transition-colors">View All</Link>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,.06)]">
          {recentChannels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 px-5 py-3.5">
              <img src={ch.logo} alt="" className="w-8 h-6 rounded-[8px] object-contain" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F8FAFC] truncate">{ch.name}</p>
                <p className="text-xs text-[#64748B]">{ch.category}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ch.isLive ? 'bg-[rgba(239,68,68,.1)] text-[#EF4444]' : 'bg-[rgba(255,255,255,.06)] text-[#64748B]'}`}>
                {ch.isLive ? 'Live' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
