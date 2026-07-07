'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Tv, TrendingUp, Sparkles, Trophy, Film, Newspaper, Smile, Music, BookOpen, Info, Clapperboard, Globe, Eye, ChevronRight, LayoutGrid, Monitor, Play } from 'lucide-react';
import { channelService, Channel } from '@/lib/channelService';

const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; color: string }> = {
  Sports: { icon: <Trophy className="w-5 h-5" />, gradient: 'from-[#06B6D4] to-[#0891B2]', color: '#06B6D4' },
  Entertainment: { icon: <Film className="w-5 h-5" />, gradient: 'from-[#8B5CF6] to-[#7C3AED]', color: '#8B5CF6' },
  News: { icon: <Newspaper className="w-5 h-5" />, gradient: 'from-[#F43F5E] to-[#E11D48]', color: '#F43F5E' },
  Kids: { icon: <Smile className="w-5 h-5" />, gradient: 'from-[#F59E0B] to-[#D97706]', color: '#F59E0B' },
  Music: { icon: <Music className="w-5 h-5" />, gradient: 'from-[#EC4899] to-[#DB2777]', color: '#EC4899' },
  Documentary: { icon: <BookOpen className="w-5 h-5" />, gradient: 'from-[#22C55E] to-[#16A34A]', color: '#22C55E' },
  Information: { icon: <Info className="w-5 h-5" />, gradient: 'from-[#3B82F6] to-[#2563EB]', color: '#3B82F6' },
  'Hindi Movies': { icon: <Clapperboard className="w-5 h-5" />, gradient: 'from-[#EF4444] to-[#DC2626]', color: '#EF4444' },
  Bangla: { icon: <Globe className="w-5 h-5" />, gradient: 'from-[#22C55E] to-[#16A34A]', color: '#22C55E' },
  'Web Series': { icon: <Monitor className="w-5 h-5" />, gradient: 'from-[#A855F7] to-[#9333EA]', color: '#A855F7' },
};

export default function Home() {
  const [featuredChannels, setFeaturedChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [channels, categoryList] = await Promise.all([
          channelService.fetchChannels(),
          channelService.getCategories()
        ]);
        setFeaturedChannels(channels.slice(0, 3));
        setCategories(categoryList);
        const counts: Record<string, number> = {};
        channels.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
        setChannelCounts(counts);
      } catch (err) {
        setError('Failed to load content.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120]">
        <section className="bg-gradient-to-br from-[#0B1120] via-[#1E1B4B] to-[#0B1120]">
          <div className="container-main py-24 md:py-32">
            <div className="max-w-2xl space-y-6">
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-6 bg-white/5 rounded-xl animate-pulse w-3/4" />
              <div className="flex gap-3">
                <div className="h-12 w-36 rounded-[14px] bg-white/5 animate-pulse" />
                <div className="h-12 w-36 rounded-[14px] bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        </section>
        <section className="container-main py-24">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[24px] bg-[#1F2937] animate-pulse overflow-hidden">
                <div className="h-48 bg-[rgba(255,255,255,.05)]" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-[rgba(255,255,255,.05)] rounded w-2/3" />
                  <div className="h-4 bg-[rgba(255,255,255,.05)] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="bg-[#1F2937] p-8 text-center max-w-sm rounded-[24px] border border-[rgba(255,255,255,.08)]">
          <AlertTriangle className="h-12 w-12 mx-auto text-[#EF4444] mb-4" />
          <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Something went wrong</h3>
          <p className="text-sm text-[#94A3B8] mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#1E1B4B] to-[#5B21B6] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,.15),transparent_40%)] pointer-events-none" />
        <div className="container-main py-24 md:py-32 relative">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[rgba(124,58,237,.15)] rounded-full blur-[100px] pointer-events-none" />
          <div className="relative max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(255,255,255,.06)] text-sm text-[#CBD5E1] border border-[rgba(255,255,255,.08)] mb-8">
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>Now streaming <span className="text-[#F8FAFC] font-semibold">500+</span> live channels</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-[#F8FAFC]">
              Your favorite channels,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]">live</span>
            </h1>
            <p className="text-lg text-[#CBD5E1] leading-relaxed mb-10 max-w-lg">
              Stream live TV, movies, sports, and news in stunning quality. No cable required. Watch anywhere, anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/channels" className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] transition-all duration-300 shadow-[0_10px_25px_rgba(124,58,237,.35)] hover:shadow-[0_15px_35px_rgba(124,58,237,.45)] hover:-translate-y-0.5">
                <Play className="w-5 h-5" />
                Start Watching
              </Link>
              <Link href="/channels" className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] bg-[#1F2937] text-white font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] hover:border-[rgba(255,255,255,.15)] transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
                What's Hot
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Channels */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,.08),transparent_50%)] pointer-events-none" />
        <div className="container-main relative">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C3AED]">Featured</span>
              <h2 className="section-title mt-2">Trending Live Channels</h2>
              <p className="section-subtitle">Most watched channels right now</p>
            </div>
            <Link href="/channels" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#8B5CF6] hover:text-[#A855F7] transition-colors">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredChannels.map((channel, index) => (
              <Link key={channel.id} href={`/watch?channel=${channel.id}`} className="group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#7C3AED] hover:shadow-[0_20px_60px_rgba(124,58,237,.35)]">
                  <div className="relative h-48 bg-gradient-to-br from-[rgba(255,255,255,.03)] to-[rgba(255,255,255,.06)] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,17,32,.8)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {channel.logo ? <img src={channel.logo} alt={channel.name} className="max-h-14 max-w-[120px] object-contain opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" /> : <div className="h-14 w-[120px] rounded-lg bg-[rgba(255,255,255,.05)]" />}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] text-white text-[10px] font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,.5)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">{channel.name}</h3>
                        <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(255,255,255,.06)] text-[#94A3B8]">{channel.category}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#06B6D4] bg-[rgba(6,182,212,.1)] px-2 py-0.5 rounded">HD</span>
                    </div>
                    <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed">{channel.description}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-[#64748B]">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{channel.viewers} watching</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link href="/channels" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8B5CF6] hover:text-[#A855F7] transition-colors">
              View All Channels
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-[#111827] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,.05),transparent_50%)] pointer-events-none" />
        <div className="container-main relative">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#06B6D4]">Browse</span>
            <h2 className="section-title mt-2">Categories</h2>
            <p className="section-subtitle">Explore channels by genre</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((category) => {
              const config = categoryConfig[category] || { icon: <LayoutGrid className="w-5 h-5" />, gradient: 'from-[#64748B] to-[#475569]', color: '#64748B' };
              const count = channelCounts[category] || 0;
              return (
                <Link
                  key={category}
                  href="/channels"
                  className="group relative overflow-hidden rounded-[24px] bg-[#1F2937] border border-[rgba(255,255,255,.08)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(124,58,237,.35)] hover:border-[#7C3AED]"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${config.gradient} transition-opacity duration-300`} />
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
                      {config.icon}
                    </div>
                    <h3 className="mt-4 font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">{category}</h3>
                    <p className="mt-1.5 text-sm text-[#64748B]">{count} channel{count !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.1),transparent_50%)] pointer-events-none" />
        <div className="container-main text-center relative">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start watching?</h2>
          <p className="text-[#CBD5E1] mb-10 max-w-md mx-auto">Join thousands of viewers enjoying unlimited entertainment</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/channels" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[14px] bg-white text-[#7C3AED] font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <Link href="/channels" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[14px] bg-[rgba(255,255,255,.1)] text-white font-medium hover:bg-[rgba(255,255,255,.2)] transition-all duration-300 border border-[rgba(255,255,255,.2)]">
              Browse Channels
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
