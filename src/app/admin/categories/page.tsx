'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderTree, AlertTriangle, Pencil, Trash2, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { channelService } from '@/lib/channelService';

interface CategoryItem {
  name: string;
  count: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [cats, channels] = await Promise.all([
        channelService.getCategories(),
        channelService.fetchChannels()
      ]);
      const counts: Record<string, number> = {};
      channels.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
      setCategories(cats.map(name => ({ name, count: counts[name] || 0 })));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setCatName('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (name: string) => {
    setEditing(name);
    setCatName(name);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const trimmed = catName.trim();
    if (!trimmed) { setError('Category name required'); return; }
    if (editing === trimmed) { setShowModal(false); return; }
    if (!editing && categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Category already exists'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { oldName: editing, newName: trimmed } : { name: trimmed }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      if (!editing) {
        setCategories(prev => [...prev, { name: trimmed, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setCategories(prev => prev.map(c => c.name === editing ? { ...c, name: trimmed } : c).sort((a, b) => a.name.localeCompare(b.name)));
      }
      await fetchData();
      setShowModal(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setConfirmDelete(null);
    } catch {}
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[rgba(255,255,255,.05)] rounded-xl animate-pulse w-48" />
        <div className="h-64 bg-[#1F2937] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Categories</h1>
          <p className="text-sm text-[#64748B] mt-1">{categories.length} total categories</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] transition-all duration-300 shadow-[0_10px_25px_rgba(124,58,237,.35)]">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)] p-5 hover:border-[#7C3AED] hover:shadow-[0_20px_60px_rgba(124,58,237,.35)] transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[14px] bg-[rgba(124,58,237,.1)]">
                  <FolderTree className="w-4.5 h-4.5 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F8FAFC]">{cat.name}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{cat.count} channel{cat.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat.name)} className="p-1.5 rounded-md text-[#64748B] hover:text-[#8B5CF6] hover:bg-[rgba(124,58,237,.1)] transition-all"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(cat.name)} className="p-1.5 rounded-md text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,.1)] transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 bg-[#1F2937] rounded-[24px] border border-[rgba(255,255,255,.08)]">
          <AlertTriangle className="w-8 h-8 mx-auto text-[#64748B] mb-2" />
          <p className="text-sm text-[#94A3B8]">No categories found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-[#1F2937] rounded-[24px] p-6 w-full max-w-md border border-[rgba(255,255,255,.08)] shadow-[0_25px_80px_rgba(0,0,0,.45)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#F8FAFC]">{editing ? 'Rename Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-[#64748B] hover:text-[#94A3B8]"><X className="w-5 h-5" /></button>
            </div>

            {editing && (
              <p className="text-sm text-[#94A3B8] mb-4">
                Rename <strong className="text-[#F8FAFC]">{editing}</strong> — all channels in this category will be updated.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Category Name</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => { setCatName(e.target.value); setError(''); }}
                placeholder="e.g. Sports"
                className="w-full px-4 py-2.5 rounded-[12px] bg-[#0B1120] border border-[rgba(255,255,255,.08)] text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,.15)] transition-all"
                autoFocus
              />
              {error && (
                <p className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,.06)]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !catName.trim()} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-semibold hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editing ? 'Rename' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#1F2937] rounded-[24px] p-6 w-full max-w-sm border border-[rgba(255,255,255,.08)] shadow-[0_25px_80px_rgba(0,0,0,.45)]" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#F8FAFC] text-center mb-2">Delete Category</h2>
            <p className="text-sm text-[#94A3B8] text-center mb-6">
              All <strong className="text-[#F8FAFC]">{categories.find(c => c.name === confirmDelete)?.count || 0}</strong> channel{(categories.find(c => c.name === confirmDelete)?.count || 0) !== 1 ? 's' : ''} in <strong className="text-[#F8FAFC]">{confirmDelete}</strong> will be permanently deleted.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm font-medium border border-[rgba(255,255,255,.08)] hover:bg-[#273449] transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={saving} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-sm font-semibold hover:from-[#F87171] hover:to-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
