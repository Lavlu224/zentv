'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Grid3X3, List, Tv, Eye, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { channelService, Channel } from '@/lib/channelService';

const INITIAL_COUNT = 70;
const LOAD_MORE = 30;

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ch, cats] = await Promise.all([
          channelService.fetchChannels(),
          channelService.getCategories()
        ]);
        setChannels(ch);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = channels.filter(c => {
    const matchCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const visible = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  useEffect(() => {
    setDisplayCount(INITIAL_COUNT);
  }, [activeCategory, search]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loadingMore) {
      setLoadingMore(true);
      setDisplayCount(prev => Math.min(prev + LOAD_MORE, filtered.length));
      setTimeout(() => setLoadingMore(false), 300);
    }
  }, [hasMore, loadingMore, filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Channels</h1>
            <p className="text-sm text-[#64748B] mt-1">{filtered.length} channels available</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-[10px] transition-colors ${viewMode === 'grid' ? 'bg-[#7C3AED] text-white' : 'bg-[#1F2937] text-[#64748B] hover:text-[#94A3B8]'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-[10px] transition-colors ${viewMode === 'list' ? 'bg-[#7C3AED] text-white' : 'bg-[#1F2937] text-[#64748B] hover:text-[#94A3B8]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels..."
              className="input w-full pl-10 pr-4 py-2.5"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'All' ? 'bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,.3)]' : 'bg-[#1F2937] text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,.3)]' : 'bg-[#1F2937] text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-[#1F2937] rounded-[16px] p-3 border border-[rgba(255,255,255,.08)] animate-pulse">
                <div className="aspect-square bg-[rgba(255,255,255,.05)] rounded-[12px] mb-2" />
                <div className="h-4 bg-[rgba(255,255,255,.05)] rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {visible.map(channel => (
                <Link
                  key={channel.id}
                  href={`/watch?channel=${channel.id}`}
                  className="group bg-[#1F2937] rounded-[16px] p-3 border border-[rgba(255,255,255,.08)] hover:border-[#7C3AED] hover:shadow-[0_0_20px_rgba(124,58,237,.15)] transition-all duration-300"
                >
                  <div className="aspect-square bg-[rgba(255,255,255,.05)] rounded-[12px] flex items-center justify-center mb-2 overflow-hidden">
                    {channel.logo ? (
                      <img src={channel.logo} alt={channel.name} className="w-full h-full p-3 object-contain group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,.08)]" />
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#F8FAFC] truncate text-center group-hover:text-[#8B5CF6] transition-colors">{channel.name}</h3>
                  <p className="text-[10px] text-[#64748B] truncate text-center">{channel.category}</p>
                </Link>
              ))}
            </div>

            <div ref={sentinelRef} className="h-10" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              {visible.map(channel => (
                <Link
                  key={channel.id}
                  href={`/watch?channel=${channel.id}`}
                  className="flex items-center gap-4 bg-[#1F2937] rounded-[16px] p-4 border border-[rgba(255,255,255,.08)] hover:border-[#7C3AED] hover:bg-[rgba(124,58,237,.05)] transition-all duration-300"
                >
                  <div className="w-14 h-12 rounded-[10px] bg-[rgba(255,255,255,.05)] flex items-center justify-center">
                    <img src={channel.logo} alt={channel.name} className="w-10 h-8 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#F8FAFC]">{channel.name}</h3>
                    <p className="text-xs text-[#64748B]">{channel.category} {channel.language ? `· ${channel.language}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#64748B] flex items-center gap-1"><Eye className="w-3 h-3" />{channel.viewers}</span>
                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                  </div>
                </Link>
              ))}
            </div>

            <div ref={sentinelRef} className="h-10" />
            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
              </div>
            )}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Tv className="h-12 w-12 mx-auto text-[#64748B] mb-4" />
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">No channels found</h3>
            <p className="text-sm text-[#64748B]">Try a different category or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
