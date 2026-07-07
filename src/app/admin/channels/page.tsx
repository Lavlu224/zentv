'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, Loader2, Check, AlertTriangle, Play, Square, Upload, Radio, List, ChevronDown } from 'lucide-react';
import { channelService, Channel } from '@/lib/channelService';

const emptyForm = { name: '', description: '', logo: '', category: '', streamUrl: '', language: 'Bengali', country: 'BD', quality: 'HD' };

function parseM3ULine(input: string): { name: string; logo: string; category: string; streamUrl: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('#EXTINF')) return null;

  const lines = trimmed.split('\n');
  const extinfLine = lines[0];
  let streamUrl = lines.slice(1).find(l => l.trim().startsWith('http'))?.trim() || '';

  const tvgLogoMatch = extinfLine.match(/tvg-logo="([^"]*)"/);
  const groupTitleMatch = extinfLine.match(/group-title="([^"]*)"/);
  const nameMatch = extinfLine.match(/,([^,]+)$/);
  let name = nameMatch?.[1]?.trim() || 'Unknown';

  // Find URL in the name portion (after last comma)
  if (!streamUrl && nameMatch) {
    const urls = nameMatch[1].match(/https?:\/\/[^\s"]+/g);
    if (urls && urls.length > 0) {
      streamUrl = urls[urls.length - 1];
      name = name.replace(urls[urls.length - 1], '').trim();
    }
  }

  return {
    name,
    logo: tvgLogoMatch?.[1] || '',
    category: groupTitleMatch?.[1]?.trim() || 'Uncategorized',
    streamUrl,
  };
}

export default function AdminChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [deleting, setDeleting] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [m3uInput, setM3uInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkChecking, setBulkChecking] = useState(false);
  const [streamResults, setStreamResults] = useState<Record<string, 'loading' | 'live' | 'dead'>>({});
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddM3U, setBulkAddM3U] = useState('');
  const [parsedChannels, setParsedChannels] = useState<{ name: string; logo: string; category: string; streamUrl: string }[]>([]);
  const [bulkAddSaving, setBulkAddSaving] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'loading' | 'live' | 'dead'>('idle');
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    channelService.fetchChannels().then(setChannels).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, []);

  useEffect(() => {
    if (showModal) {
      channelService.getCategories().then(setCategoryList).catch(() => {});
      setShowNewCatInput(false);
      setNewCatName('');
    }
  }, [showModal]);

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setM3uInput('');
    setStreamStatus('idle');
    stopStream();
    setShowModal(true);
  };

  const openEdit = (ch: Channel) => {
    setForm({
      name: ch.name,
      description: ch.description,
      logo: ch.logo,
      category: ch.category,
      streamUrl: ch.streamUrl,
      language: ch.language,
      country: ch.country,
      quality: ch.quality,
    });
    setM3uInput('');
    setStreamStatus('idle');
    stopStream();
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.streamUrl) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/channels/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      const chs = await channelService.fetchChannels();
      setChannels(chs);
      setShowModal(false);
      stopStream();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await fetch(`/api/channels/${deleting.id}`, { method: 'DELETE' });
      setChannels(prev => prev.filter(c => c.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map(id =>
          fetch(`/api/channels/${id}`, { method: 'DELETE' })
        )
      );
      setChannels(prev => prev.filter(c => !selected.has(c.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const checkSingleStream = (streamUrl: string): Promise<'live' | 'dead'> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve('dead'), 8000);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;

      const cleanUp = () => { clearTimeout(timeout); video.remove(); };

      const isHLS = streamUrl.endsWith('.m3u8') || streamUrl.includes('.m3u8');
      if (isHLS) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
            const hls = new Hls({
              startLevel: -1, abrEwmaDefaultEstimate: 2000000,
              maxMaxBufferLength: 120, maxBufferLength: 60, backBufferLength: 60,
              liveSyncDurationCount: 7, liveMaxLatencyDurationCount: 10, lowLatencyMode: false,
              enableWorker: true, startFragPrefetch: true, maxStarvationDelay: 10,
              fragLoadingTimeOut: 30000, manifestLoadingTimeOut: 30000,
            });
            hls.loadSource(proxyUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => { cleanUp(); resolve('live'); });
            hls.on(Hls.Events.ERROR, (_: any, data: any) => { if (data.fatal) { cleanUp(); hls.destroy(); resolve('dead'); } });
          } else {
            video.src = proxyUrl;
            video.onloadeddata = () => { cleanUp(); resolve('live'); };
            video.onerror = () => { cleanUp(); resolve('dead'); };
          }
        }).catch(() => { cleanUp(); resolve('dead'); });
      } else {
        video.src = streamUrl;
        video.onloadeddata = () => { cleanUp(); resolve('live'); };
        video.onerror = () => { cleanUp(); resolve('dead'); };
      }
    });
  };

  const handleBulkCheck = async () => {
    if (selected.size === 0) return;
    setBulkChecking(true);
    const ids = Array.from(selected);
    const results: Record<string, 'loading' | 'live' | 'dead'> = {};
    ids.forEach(id => { results[id] = 'loading'; });
    setStreamResults(prev => ({ ...prev, ...results }));
    await Promise.all(
      ids.map(async (id) => {
        const ch = channels.find(c => c.id === id);
        if (!ch) return;
        const status = await checkSingleStream(ch.streamUrl);
        setStreamResults(prev => ({ ...prev, [id]: status }));
      })
    );
    setBulkChecking(false);
  };

  const parseM3UChannels = (input: string): { name: string; logo: string; category: string; streamUrl: string }[] => {
    const results: { name: string; logo: string; category: string; streamUrl: string }[] = [];
    const lines = input.split('\n');
    let currentExtinf = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF')) {
        currentExtinf = line;
        const urlLine = lines[i + 1]?.trim();
        if (urlLine?.startsWith('http')) {
          const parsed = parseM3ULine(`${currentExtinf}\n${urlLine}`);
          if (parsed && parsed.streamUrl) results.push(parsed);
          i++;
          currentExtinf = '';
        }
      } else if (line.startsWith('http') && currentExtinf) {
        const combined = `${currentExtinf}\n${line}`;
        const parsed = parseM3ULine(combined);
        if (parsed && parsed.streamUrl) results.push(parsed);
        currentExtinf = '';
      }
    }
    return results;
  };

  const handleBulkAddParse = () => {
    const parsed = parseM3UChannels(bulkAddM3U);
    if (parsed.length === 0 && bulkAddM3U.trim()) {
      const singleUrl = bulkAddM3U.trim();
      if (singleUrl.startsWith('http')) {
        setParsedChannels([{ name: 'Unknown', logo: '', category: 'Uncategorized', streamUrl: singleUrl }]);
      }
      return;
    }
    setParsedChannels(parsed);
  };

  const handleBulkAddSave = async () => {
    if (parsedChannels.length === 0) return;
    setBulkAddSaving(true);
    try {
      await Promise.all(
        parsedChannels.map(ch =>
          fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: ch.name,
              description: `Live stream of ${ch.name}`,
              logo: ch.logo ? `/api/proxy?url=${encodeURIComponent(ch.logo)}` : '',
              category: ch.category || 'Uncategorized',
              streamUrl: ch.streamUrl,
              language: 'Bengali',
              country: 'BD',
              quality: 'HD',
            }),
          })
        )
      );
      const chs = await channelService.fetchChannels();
      setChannels(chs);
      setShowBulkAdd(false);
      setBulkAddM3U('');
      setParsedChannels([]);
    } catch (err) {
      console.error('Bulk add error:', err);
    } finally {
      setBulkAddSaving(false);
    }
  };

  const handleAddNewCategory = async () => {
    const name = newCatName.trim();
    if (!name || categoryList.includes(name)) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      setCategoryList(prev => [...prev, name].sort());
      setForm(f => ({ ...f, category: name }));
      setNewCatName('');
      setShowNewCatInput(false);
    } catch {}
  };

  const handleParse = () => {
    if (!m3uInput.trim()) return;
    const parsed = parseM3ULine(m3uInput);
    if (!parsed) {
      setForm(f => ({ ...f, streamUrl: m3uInput.trim() }));
      return;
    }
    const urlFromInput = parsed.streamUrl;
    const quality = urlFromInput.includes('4K') || parsed.name.includes('4K') ? '4K'
      : urlFromInput.includes('FHD') || urlFromInput.includes('1080') ? 'FHD'
      : urlFromInput.includes('HD') || urlFromInput.includes('720') ? 'HD'
      : 'HD';
    const language = parsed.category.toLowerCase().includes('bangla') || parsed.category.toLowerCase().includes('kolkata') ? 'Bengali'
      : parsed.category.toLowerCase().includes('indian') || parsed.category.toLowerCase().includes('hindi') ? 'Hindi'
      : parsed.category.toLowerCase().includes('english') ? 'English'
      : 'Bengali';
    const country = parsed.category.toLowerCase().includes('bangla') || parsed.category.toLowerCase().includes('kolkata') ? 'BD'
      : parsed.category.toLowerCase().includes('indian') || parsed.category.toLowerCase().includes('hindi') ? 'IN'
      : 'US';
    setForm({
      name: parsed.name,
      description: `Live stream of ${parsed.name}`,
      logo: parsed.logo ? `/api/proxy?url=${encodeURIComponent(parsed.logo)}` : '',
      category: parsed.category,
      streamUrl: urlFromInput,
      language,
      country,
      quality,
    });
  };

  const stopStream = () => {
    const video = videoRef.current;
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setStreamStatus('idle');
  };

  const checkStream = async () => {
    if (!form.streamUrl) return;
    setStreamStatus('loading');
    stopStream();

    const video = videoRef.current;
    if (!video) { setStreamStatus('dead'); return; }

    setTimeout(async () => {
      try {
        const isHLS = form.streamUrl.endsWith('.m3u8') || form.streamUrl.includes('.m3u8');
        if (isHLS) {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(form.streamUrl)}`;
            const hls = new Hls({
              startLevel: -1,
              abrEwmaDefaultEstimate: 2000000,
              maxMaxBufferLength: 120,
              maxBufferLength: 60,
              backBufferLength: 60,
              liveSyncDurationCount: 7,
              liveMaxLatencyDurationCount: 10,
              lowLatencyMode: false,
              enableWorker: true,
              startFragPrefetch: true,
              maxStarvationDelay: 10,
              fragLoadingTimeOut: 30000,
              manifestLoadingTimeOut: 30000,
            });
            hls.loadSource(proxyUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().then(() => setStreamStatus('live')).catch(() => setStreamStatus('live'));
            });
            hls.on(Hls.Events.ERROR, (_: any, data: any) => {
              if (data.fatal) setStreamStatus('dead');
            });
            hlsRef.current = hls;
          } else {
            video.src = form.streamUrl;
            video.onloadeddata = () => video.play().then(() => setStreamStatus('live')).catch(() => setStreamStatus('live'));
            video.onerror = () => setStreamStatus('dead');
          }
        } else {
          video.src = form.streamUrl;
          video.onloadeddata = () => video.play().then(() => setStreamStatus('live')).catch(() => setStreamStatus('live'));
          video.onerror = () => setStreamStatus('dead');
        }
      } catch {
        setStreamStatus('dead');
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-48" />
        <div className="h-96 bg-[#1F2937] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Channels</h1>
          <p className="text-sm text-[#64748B] mt-1">{channels.length} total channels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkAdd(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[rgba(255,255,255,.06)] text-white text-sm font-semibold hover:bg-[rgba(255,255,255,.1)] transition-all duration-300 border border-[rgba(255,255,255,.08)]">
            <List className="w-4 h-4" />
            Bulk Add
          </button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] transition-all duration-300 shadow-[0_10px_25px_rgba(124,58,237,.35)]">
            <Plus className="w-4 h-4" />
            Add Channel
          </button>
        </div>
      </div>

      <div className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,.06)]">
          <div className="relative max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search channels..." className="input pl-10" />
          </div>
        </div>

        <div className={`flex items-center justify-between px-5 py-3 border-b transition-all duration-300 ${selected.size > 0 ? 'bg-gradient-to-r from-[rgba(124,58,237,.08)] to-[rgba(6,182,212,.04)] border-[rgba(124,58,237,.15)]' : 'bg-transparent border-[rgba(255,255,255,.06)]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selected.size > 0 ? 'bg-[#7C3AED] shadow-[0_0_6px_rgba(124,58,237,.6)]' : 'bg-[rgba(255,255,255,.2)]'}`} />
            <span className={`text-sm font-medium transition-all duration-300 ${selected.size > 0 ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
              {selected.size > 0 ? `${selected.size} channel${selected.size > 1 ? 's' : ''} selected` : 'Bulk actions'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkCheck} disabled={selected.size === 0 || bulkChecking} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-semibold transition-all duration-300 disabled:opacity-0 disabled:scale-95 disabled:pointer-events-none bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white hover:from-[#22D3EE] hover:to-[#06B6D4] active:scale-95 shadow-[0_4px_15px_rgba(6,182,212,.35)] hover:shadow-[0_6px_20px_rgba(6,182,212,.5)]">
              {bulkChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              Check {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
            <button onClick={handleBulkDelete} disabled={selected.size === 0 || bulkDeleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-semibold transition-all duration-300 disabled:opacity-0 disabled:scale-95 disabled:pointer-events-none bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white hover:from-[#F87171] hover:to-[#EF4444] active:scale-95 shadow-[0_4px_15px_rgba(239,68,68,.35)] hover:shadow-[0_6px_20px_rgba(239,68,68,.5)]">
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,.06)] bg-[rgba(255,255,255,.02)]">
                <th className="w-10 px-3 py-3.5">
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-[rgba(255,255,255,.2)] bg-[#0B1120] text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer" />
                </th>
                <th className="text-left px-3 py-3.5 font-medium text-[#64748B]">Channel</th>
                <th className="text-left px-3 py-3.5 font-medium text-[#64748B]">Category</th>
                <th className="text-left px-3 py-3.5 font-medium text-[#64748B]">Status</th>
                <th className="text-right px-3 py-3.5 font-medium text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,.06)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto text-[#64748B] mb-2" />
                    <p className="text-sm text-[#94A3B8]">No channels found</p>
                  </td>
                </tr>
              ) : filtered.map((ch) => (
                <tr key={ch.id} className="hover:bg-[rgba(255,255,255,.02)] transition-colors">
                  <td className="px-3 py-3.5">
                    <input type="checkbox" checked={selected.has(ch.id)} onChange={() => toggleSelect(ch.id)} className="w-4 h-4 rounded border-[rgba(255,255,255,.2)] bg-[#0B1120] text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer" />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      {ch.logo ? <img src={ch.logo} alt="" className="w-10 h-7 rounded-[10px] object-contain bg-[rgba(255,255,255,.05)]" /> : <div className="w-10 h-7 rounded-[10px] bg-[rgba(255,255,255,.05)]" />}
                      <span className="font-medium text-[#F8FAFC]">{ch.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#94A3B8]">{ch.category}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      streamResults[ch.id] === 'live' ? 'bg-[rgba(34,197,94,.1)] text-[#22C55E]' :
                      streamResults[ch.id] === 'dead' ? 'bg-[rgba(239,68,68,.1)] text-[#EF4444]' :
                      streamResults[ch.id] === 'loading' ? 'bg-[rgba(6,182,212,.1)] text-[#06B6D4]' :
                      ch.isLive ? 'bg-[rgba(239,68,68,.1)] text-[#EF4444]' : 'bg-[rgba(255,255,255,.06)] text-[#64748B]'
                    }`}>
                      {(streamResults[ch.id] === 'live' || (!streamResults[ch.id] && ch.isLive)) && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      {streamResults[ch.id] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {streamResults[ch.id] === 'live' ? 'Live' :
                       streamResults[ch.id] === 'dead' ? 'Dead' :
                       streamResults[ch.id] === 'loading' ? 'Checking' :
                       ch.isLive ? 'Live' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => openEdit(ch)} className="p-1.5 rounded-md text-[#64748B] hover:text-[#8B5CF6] hover:bg-[rgba(124,58,237,.1)] transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleting(ch)} className="p-1.5 rounded-md text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.1)] transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-[#1F2937] rounded-[24px] p-6 w-full max-w-2xl border border-[rgba(255,255,255,.08)] shadow-[0_25px_80px_rgba(0,0,0,.45)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#F8FAFC]">{editing ? 'Edit Channel' : 'Add Channel'}</h2>
              <button onClick={() => { stopStream(); setShowModal(false); }} className="p-1 rounded text-[#64748B] hover:text-[#94A3B8]"><X className="w-5 h-5" /></button>
            </div>

            {/* Player Preview (always visible) */}
            <div className="rounded-[16px] overflow-hidden bg-black border border-[rgba(255,255,255,.08)] mb-4">
              <div className="relative aspect-video">
                <video ref={videoRef} className="w-full h-full" playsInline muted />
                {streamStatus === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="flex items-center gap-2 text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading stream...</span>
                    </div>
                  </div>
                )}
                {streamStatus === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white/30">
                      <Play className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs">Enter URL and click Check</p>
                    </div>
                  </div>
                )}
                {streamStatus === 'dead' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <AlertTriangle className="w-6 h-6 text-[#EF4444] mx-auto mb-1" />
                      <p className="text-white/60 text-xs">Stream unavailable</p>
                    </div>
                  </div>
                )}
              </div>
              {streamStatus === 'live' && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#0B1120] border-t border-[rgba(255,255,255,.08)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                    <span className="text-xs text-[#22C55E] font-medium">Live</span>
                  </div>
                  <button onClick={stopStream} className="text-xs text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1">
                    <Square className="w-3 h-3" /> Stop
                  </button>
                </div>
              )}
            </div>

            {/* M3U Parse Section */}
            <div className="mb-5 p-4 rounded-[16px] bg-[#0B1120] border border-[rgba(255,255,255,.06)]">
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Paste M3U link or EXTINF line</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={m3uInput}
                  onChange={(e) => setM3uInput(e.target.value)}
                  placeholder={'#EXTINF:-1 tvg-logo="..." group-title="...",Channel Name\\nhttps://...'}
                  className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#1F2937] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-all font-mono"
                />
                <button onClick={handleParse} className="px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-medium hover:from-[#8B5CF6] hover:to-[#A855F7] transition-all inline-flex items-center gap-2 flex-shrink-0">
                  <Upload className="w-4 h-4" />
                  Parse
                </button>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1.5">Paste a single EXTINF line + URL, or just a raw stream URL</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Input label="Channel Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Gazi TV" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Check Stream</label>
                  <button onClick={checkStream} disabled={!form.streamUrl || streamStatus === 'loading'} className="w-full px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white text-sm font-medium hover:from-[#22D3EE] hover:to-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2">
                    {streamStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Check
                  </button>
                </div>
              </div>
              <Input label="Stream URL (M3U8)" value={form.streamUrl} onChange={v => setForm(f => ({ ...f, streamUrl: v }))} placeholder="https://example.com/stream.m3u8" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Category</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') { setShowNewCatInput(true); }
                        else { setForm(f => ({ ...f, category: e.target.value })); }
                      }}
                      className="w-full px-4 py-2.5 rounded-[12px] bg-[#0B1120] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,.15)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select category</option>
                      {categoryList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__add_new__">+ Add New</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                  </div>
                  {showNewCatInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-3 py-1.5 rounded-[8px] bg-[#1F2937] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                        autoFocus
                      />
                      <button onClick={handleAddNewCategory} disabled={!newCatName.trim()} className="px-3 py-1.5 rounded-[8px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-medium disabled:opacity-50">
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <Input label="Language" value={form.language} onChange={v => setForm(f => ({ ...f, language: v }))} placeholder="Bengali" />
                <Input label="Quality" value={form.quality} onChange={v => setForm(f => ({ ...f, quality: v }))} placeholder="HD / FHD / 4K" />
              </div>
              <Input label="Logo URL (optional)" value={form.logo} onChange={v => setForm(f => ({ ...f, logo: v }))} placeholder="https://example.com/logo.png" />
              <Input label="Description (optional)" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Live stream of..." />
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,.06)]">
              <button onClick={() => { stopStream(); setShowModal(false); }} className="flex-1 py-2.5 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.streamUrl} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleting(null)}>
          <div className="bg-[#1F2937] rounded-[24px] p-6 w-full max-w-sm border border-[rgba(255,255,255,.08)] shadow-[0_25px_80px_rgba(0,0,0,.45)]" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#F8FAFC] text-center mb-2">Delete Channel</h2>
            <p className="text-sm text-[#94A3B8] text-center mb-6">Are you sure you want to delete <strong className="text-[#F8FAFC]">{deleting.name}</strong>?</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-sm font-semibold hover:from-[#F87171] hover:to-[#EF4444] transition-all duration-300">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowBulkAdd(false); setParsedChannels([]); setBulkAddM3U(''); }}>
          <div className="bg-[#1F2937] rounded-[24px] p-6 w-full max-w-3xl border border-[rgba(255,255,255,.08)] shadow-[0_25px_80px_rgba(0,0,0,.45)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Bulk Add Channels</h2>
              <button onClick={() => { setShowBulkAdd(false); setParsedChannels([]); setBulkAddM3U(''); }} className="p-1 rounded text-[#64748B] hover:text-[#94A3B8]"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-5 p-4 rounded-[16px] bg-[#0B1120] border border-[rgba(255,255,255,.06)]">
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Paste M3U playlist content</label>
              <textarea
                value={bulkAddM3U}
                onChange={(e) => setBulkAddM3U(e.target.value)}
                placeholder={"#EXTINF:-1 tvg-logo=\"...\" group-title=\"News\",Channel Name\nhttps://stream.url/playlist.m3u8\n#EXTINF:-1 tvg-logo=\"...\" group-title=\"Sports\",Sports Channel\nhttps://stream.url/sports.m3u8"}
                className="w-full h-32 px-4 py-3 rounded-[12px] bg-[#1F2937] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-all font-mono resize-none"
              />
              <div className="flex items-center gap-2 mt-3">
                <button onClick={handleBulkAddParse} disabled={!bulkAddM3U.trim()} className="px-4 py-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-medium hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Parse & Preview
                </button>
                {parsedChannels.length > 0 && (
                  <span className="text-xs text-[#94A3B8]">{parsedChannels.length} channel{parsedChannels.length > 1 ? 's' : ''} found</span>
                )}
              </div>
            </div>

            {parsedChannels.length > 0 && (
              <>
                <div className="max-h-64 overflow-y-auto rounded-[16px] border border-[rgba(255,255,255,.06)] mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,.06)] bg-[rgba(255,255,255,.02)] sticky top-0">
                        <th className="text-left px-4 py-3 font-medium text-[#64748B]">#</th>
                        <th className="text-left px-4 py-3 font-medium text-[#64748B]">Channel</th>
                        <th className="text-left px-4 py-3 font-medium text-[#64748B]">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-[#64748B]">Stream URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,.06)]">
                      {parsedChannels.map((ch, i) => (
                        <tr key={i} className="hover:bg-[rgba(255,255,255,.02)]">
                          <td className="px-4 py-2.5 text-[#64748B] text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {ch.logo && <img src={`/api/proxy?url=${encodeURIComponent(ch.logo)}`} alt="" className="w-6 h-4 rounded object-contain bg-[rgba(255,255,255,.05)]" />}
                              <span className="font-medium text-[#F8FAFC]">{ch.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#94A3B8]">{ch.category}</td>
                          <td className="px-4 py-2.5 text-[#64748B] text-xs max-w-[200px] truncate">{ch.streamUrl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,.06)]">
                  <button onClick={() => { setShowBulkAdd(false); setParsedChannels([]); setBulkAddM3U(''); }} className="flex-1 py-2.5 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] transition-colors">Cancel</button>
                  <button onClick={handleBulkAddSave} disabled={bulkAddSaving || parsedChannels.length === 0} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2">
                    {bulkAddSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Add {parsedChannels.length > 0 ? `All (${parsedChannels.length})` : ''}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-[12px] bg-[#0B1120] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,.15)] transition-all"
      />
    </div>
  );
}
