'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Search as SearchIcon, Tv, Eye, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { channelService, Channel } from '@/lib/channelService';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) { setResults([]); setLoading(false); return; }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await channelService.searchChannels(query);
        setResults(data);
      } catch {
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] py-8">
        <div className="container-main">
          <div className="mb-6 space-y-2">
            <div className="h-8 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-48" />
            <div className="h-5 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-64" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[24px] bg-[#1F2937] animate-pulse overflow-hidden">
                <div className="h-44 bg-[rgba(255,255,255,.05)]" />
                <div className="p-5 space-y-2">
                  <div className="h-5 bg-[rgba(255,255,255,.05)] rounded w-2/3" />
                  <div className="h-4 bg-[rgba(255,255,255,.05)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1120] py-8">
        <div className="container-main">
          <div className="bg-[#1F2937] p-8 text-center max-w-sm mx-auto rounded-[24px] border border-[rgba(255,255,255,.08)]">
            <AlertTriangle className="h-12 w-12 mx-auto text-[#EF4444] mb-4" />
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Search Error</h3>
            <p className="text-sm text-[#94A3B8] mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] py-8 animate-fade-in">
      <div className="container-main">
        <div className="mb-8">
          <h1 className="section-title">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          <p className="section-subtitle">
            {query
              ? results.length > 0
                ? `Found ${results.length} channel${results.length !== 1 ? 's' : ''}`
                : 'No channels found. Try different keywords.'
              : 'Use the search bar above to find channels'}
          </p>
        </div>

        {results.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((channel) => (
              <Link key={channel.id} href={`/watch?channel=${channel.id}`} className="group">
                <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#7C3AED] hover:shadow-[0_20px_60px_rgba(124,58,237,.35)]">
                  <div className="relative h-44 bg-gradient-to-br from-[rgba(255,255,255,.03)] to-[rgba(255,255,255,.06)] flex items-center justify-center overflow-hidden">
                    {channel.logo ? <img src={channel.logo} alt={channel.name} className="max-h-14 max-w-[100px] object-contain opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" /> : <div className="h-14 w-[100px] rounded-lg bg-[rgba(255,255,255,.05)]" />}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] text-white text-[10px] font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,.5)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">{channel.name}</h3>
                        <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(255,255,255,.06)] text-[#94A3B8]">{channel.category}</span>
                      </div>
                      <span className="text-xs text-[#64748B] flex items-center gap-1"><Eye className="w-3 h-3" />{channel.viewers}</span>
                    </div>
                    <p className="text-sm text-[#64748B] line-clamp-2">{channel.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="bg-[#1F2937] rounded-[24px] p-16 text-center border border-[rgba(255,255,255,.08)]">
            <SearchIcon className="h-12 w-12 mx-auto text-[#64748B] mb-4" />
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-1">No results found</h3>
            <p className="text-sm text-[#94A3B8] mb-6">We couldn't find any channels matching "{query}"</p>
            <Link href="/channels" className="btn-primary">Browse All Channels</Link>
          </div>
        ) : (
          <div className="bg-[#1F2937] rounded-[24px] p-16 text-center border border-[rgba(255,255,255,.08)]">
            <Tv className="h-12 w-12 mx-auto text-[#64748B] mb-4" />
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-1">Search for channels</h3>
            <p className="text-sm text-[#94A3B8]">Enter a channel name, category, or keyword to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1120] py-8">
        <div className="container-main">
          <div className="h-8 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-48" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
