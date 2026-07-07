'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Eye, ChevronRight, Tv } from 'lucide-react';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import { channelService, Channel } from '@/lib/channelService';

function WatchContent() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channel') || '';
  const [channel, setChannel] = useState<Channel | null>(null);
  const [related, setRelated] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ch = await channelService.fetchChannelById(channelId);
        if (!ch) { setError('Channel not found'); return; }
        setChannel(ch);
        const all = await channelService.fetchChannels();
        setRelated(all.filter(c => c.category === ch.category));
      } catch {
        setError('Failed to load channel.');
      } finally {
        setLoading(false);
      }
    };
    if (channelId) fetchData();
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="aspect-video bg-[#1F2937] animate-pulse rounded-[24px]" />
            <div className="bg-[#1F2937] rounded-[16px] p-4 mt-3 space-y-2 border border-[rgba(255,255,255,.08)]">
              <div className="h-5 bg-[rgba(255,255,255,.05)] rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-[rgba(255,255,255,.05)] rounded w-2/3 animate-pulse" />
            </div>
          </div>
          <div className="w-full lg:w-[240px] flex-shrink-0">
            <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] animate-pulse flex flex-col p-5 space-y-3 sticky top-6 max-h-[calc(100vh-3rem)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-6 bg-[rgba(255,255,255,.05)] rounded-[8px]" />
                  <div className="flex-1 h-4 bg-[rgba(255,255,255,.05)] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="bg-[#1F2937] p-8 text-center max-w-sm mx-auto rounded-[24px] border border-[rgba(255,255,255,.08)]">
          <AlertTriangle className="h-12 w-12 mx-auto text-[#EF4444] mb-4" />
          <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">{error}</h3>
          <Link href="/channels" className="btn-primary mt-4 inline-flex">Back to Channels</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <VideoPlayer src={channel.streamUrl} title={channel.name} channel={channel.category} channelId={Number(channel.id)} />

          <div className="bg-[#1F2937] rounded-[16px] p-4 border border-[rgba(255,255,255,.08)] mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-[#F8FAFC]">{channel.name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[9px] font-semibold uppercase shadow-[0_0_12px_rgba(239,68,68,.4)]">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <Eye className="w-3 h-3" />
                <span>{channel.viewers}</span>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">{channel.description}</p>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,.06)] text-[#94A3B8]">{channel.category}</span>
              {channel.quality && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(6,182,212,.1)] text-[#06B6D4]">{channel.quality}</span>}
              {channel.language && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,.06)] text-[#94A3B8]">{channel.language}</span>}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,.06)] text-[#94A3B8]">24/7</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[240px] flex-shrink-0">
          <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] sticky top-6 flex flex-col overflow-hidden max-h-[calc(100vh-3rem)]">
            <h3 className="font-semibold text-[#F8FAFC] px-5 pt-5 pb-3 flex items-center gap-2 flex-shrink-0">
              <Tv className="w-4 h-4 text-[#64748B]" />
              {channel.category} Channels
            </h3>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 scrollbar-thin">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/watch?channel=${r.id}`}
                  className={`flex items-center gap-2.5 p-2.5 rounded-[12px] transition-all duration-300 ${
                    r.id === channel.id
                      ? 'bg-[rgba(124,58,237,.12)] border border-[rgba(124,58,237,.2)]'
                      : 'hover:bg-[rgba(255,255,255,.04)]'
                  }`}
                >
                  {r.logo ? <img src={r.logo} alt={r.name} className="w-8 h-6 rounded-[8px] object-contain bg-[rgba(255,255,255,.05)] flex-shrink-0" /> : <div className="w-8 h-6 rounded-[8px] bg-[rgba(255,255,255,.05)] flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      r.id === channel.id ? 'text-[#8B5CF6]' : 'text-[#94A3B8] hover:text-[#CBD5E1]'
                    }`}>{r.name}</h4>
                  </div>
                  {r.id === channel.id ? (
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,.6)] flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#64748B] flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>

            <Link
              href={`/channels?category=${channel.category}`}
              className="flex items-center justify-center gap-1 py-3 border-t border-[rgba(255,255,255,.06)] text-xs font-medium text-[#8B5CF6] hover:text-[#A855F7] transition-colors flex-shrink-0"
            >
              View all {channel.category} channels
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1120] p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="aspect-video bg-[#1F2937] animate-pulse rounded-[24px]" />
          </div>
          <div className="w-full lg:w-[240px]">
            <div className="bg-[#1F2937] rounded-[24px] p-5 animate-pulse h-64 lg:h-96" />
          </div>
        </div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
