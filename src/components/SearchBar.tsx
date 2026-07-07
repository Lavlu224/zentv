'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { channelService, Channel } from '@/lib/channelService';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Channel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const searchResults = await channelService.searchChannels(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Error searching channels:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
        </div>
      </form>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-[20px] bg-[#1F2937] shadow-[0_25px_80px_rgba(0,0,0,.45)] border border-[rgba(255,255,255,.08)] overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[#64748B]">Searching...</div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(255,255,255,.06)]">
                {results.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/watch?channel=${channel.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#CBD5E1] hover:bg-[rgba(255,255,255,.05)] transition-colors"
                    onClick={() => { setQuery(''); setIsOpen(false); }}
                  >
                    <img src={channel.logo} alt={channel.name} className="w-10 h-7 rounded-[10px] object-contain bg-[rgba(255,255,255,.05)]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#F8FAFC] truncate">{channel.name}</div>
                      <div className="text-xs text-[#64748B]">{channel.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block px-4 py-3 text-sm text-center text-[#8B5CF6] font-medium border-t border-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.05)] transition-colors"
                onClick={() => { setQuery(''); setIsOpen(false); }}
              >
                View all {results.length} results
              </Link>
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-[#64748B]">No channels found</div>
          )}
        </div>
      )}
    </div>
  );
}
