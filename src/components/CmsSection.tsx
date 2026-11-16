import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Camera,
  Check,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { MENU_CATEGORIES, TRACKED_PAGES } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { ImageKey, MenuCategory, MenuItem } from '../types/coffee';
import { ResilientImage } from './ResilientImage';

const TEMP_IMAGE_OPTIONS: { key: ImageKey; label: string }[] = [
  { key: 'latte', label: 'Warm Latte' },
  { key: 'coldbrew', label: 'Iced / Cold Brew' },
  { key: 'matcha', label: 'Matcha' },
  { key: 'beans', label: 'Pour-Over Beans' },
];

async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read the selected image file.'));
      image.src = objectUrl;
    });

    const maxDim = 640;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image processing is not supported in this browser.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (dataUrl.length > 220_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    }
    if (dataUrl.length > 240_000) {
      throw new Error('Image is still too large after compression. Please pick a smaller photo.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const EMPTY_DRAFT: Omit<MenuItem, 'id' | 'sortOrder'> = {
  name: '',
  category: 'Perfectly Classic',
  description: '',
  tastingNotes: '',
  priceCents: 16000,
  isSeasonal: true,
  inStock: true,
  featured: true,
  imageKey: 'latte',
  imageUrl: '',
};

export const CmsSection: React.FC = () => {
  const {
    isAdmin,
    menuItems,
    isMenuSeeded,
    hasLegacyMenu,
    itemPopularityById,
    pageStats,
    pageStatsLoading,
    seedDefaultMenu,
    saveMenuItem,
    deleteMenuItem,
    resetPageStats,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'menu' | 'analytics'>('menu');
  const [cmsSearch, setCmsSearch] = useState('');
  const [cmsCategory, setCmsCategory] = useState<'All' | MenuCategory>('All');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'temp' | 'custom'>('all');
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<MenuItem, 'id' | 'sortOrder'>>(EMPTY_DRAFT);
  const [priceInput, setPriceInput] = useState('160.00');
  const [inlinePrices, setInlinePrices] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetStats, setConfirmResetStats] = useState(false);
  const [resettingStats, setResettingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const photoCounts = useMemo(() => {
    const customCount = menuItems.filter((m) => Boolean(m.imageUrl && m.imageUrl.trim())).length;
    return {
      all: menuItems.length,
      custom: customCount,
      temp: menuItems.length - customCount,
    };
  }, [menuItems]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    menuItems.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    });
    return counts;
  }, [menuItems]);

  const filteredCmsItems = useMemo(() => {
    const q = cmsSearch.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (cmsCategory !== 'All' && item.category !== cmsCategory) return false;
      const hasCustomPhoto = Boolean(item.imageUrl && item.imageUrl.trim());
      if (photoFilter === 'custom' && !hasCustomPhoto) return false;
      if (photoFilter === 'temp' && hasCustomPhoto) return false;
      if (q) {
        const haystack = `${item.name} ${item.category} ${item.tastingNotes} ${item.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [menuItems, cmsSearch, cmsCategory, photoFilter]);

  const analyticsSummary = useMemo(() => {
    const byId = new Map(pageStats.map((stat) => [stat.pageId, stat]));
    const siteOverview = byId.get('site-overview');
    const rankedPages = TRACKED_PAGES.map((meta, idx) => {
      const stat = byId.get(meta.id);
      return {
        ...meta,
        orderIndex: idx,
        views: stat?.views ?? 0,
        uniqueVisitors: stat?.uniqueVisitors ?? 0,
        updatedAtMs: stat?.updatedAtMs ?? 0,
      };
    }).sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      if (b.uniqueVisitors !== a.uniqueVisitors) return b.uniqueVisitors - a.uniqueVisitors;
      return a.orderIndex - b.orderIndex;
    });

    const totalSectionViews = rankedPages.reduce((sum, p) => sum + p.views, 0);
    const totalWebsiteViews = siteOverview?.views ?? 0;
    const totalUniqueVisitors = siteOverview?.uniqueVisitors ?? 0;
    const topPage = rankedPages[0] ?? null;

    return {
      totalWebsiteViews,
      totalUniqueVisitors,
      totalSectionViews,
      topPage,
      rankedPages,
    };
  }, [pageStats]);

  const handleResetAnalytics = async () => {
    setResettingStats(true);
    try {
      await resetPageStats();
      setConfirmResetStats(false);
    } finally {
      setResettingStats(false);
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setPriceInput('160.00');
    setShowAddForm(true);
    setErrorMsg(null);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      category: item.category,
      description: item.description,
      tastingNotes: item.tastingNotes,
      priceCents: item.priceCents,
      isSeasonal: item.isSeasonal,
      inStock: item.inStock,
      featured: item.featured,
      imageKey: item.imageKey,
      imageUrl: item.imageUrl || '',
    });
    setPriceInput((item.priceCents / 100).toFixed(2));
    setShowAddForm(true);
    setErrorMsg(null);
  };

  const handleRowPhotoUpload = async (item: MenuItem, file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploadingItemId(item.id);
    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      await saveMenuItem({ ...item, imageUrl: compressedDataUrl }, false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleDraftPhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setUploadingItemId('draft');
    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      setDraft((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process photo.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsedPesos = Number.parseFloat(priceInput);
    if (!Number.isFinite(parsedPesos) || parsedPesos < 0.5 || parsedPesos > 5000) {
      setErrorMsg('Enter a valid price between ₱0.50 and ₱5,000.00.');
      return;
    }
    if (!draft.name.trim() || !draft.description.trim()) {
      setErrorMsg('Name and description are required.');
      return;
    }

    const priceCents = Math.round(parsedPesos * 100);
    const id =
      editingId ||
      `${draft.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48)}-${Date.now().toString(36).slice(-4)}`;

    setSaving(true);
    try {
      await saveMenuItem(
        {
          id,
          name: draft.name.trim(),
          category: draft.category,
          description: draft.description.trim(),
          tastingNotes: draft.tastingNotes.trim(),
          priceCents,
          isSeasonal: draft.isSeasonal,
          inStock: draft.inStock,
          featured: draft.featured,
          imageKey: draft.imageKey,
          imageUrl: (draft.imageUrl || '').trim(),
          sortOrder: editingId
            ? menuItems.find((m) => m.id === editingId)?.sortOrder ?? menuItems.length + 1
            : menuItems.length + 1,
        },
        !editingId
      );
      setShowAddForm(false);
      setEditingId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPriceSave = async (item: MenuItem) => {
    const raw = inlinePrices[item.id];
    if (raw === undefined) return;
    const pesos = Number.parseFloat(raw);
    if (!Number.isFinite(pesos) || pesos < 0.5 || pesos > 5000) return;
    const nextCents = Math.round(pesos * 100);
    await saveMenuItem({ ...item, priceCents: nextCents }, false);
    setInlinePrices((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleToggleField = async (
    item: MenuItem,
    field: 'isSeasonal' | 'inStock' | 'featured'
  ) => {
    await saveMenuItem({ ...item, [field]: !item[field] }, false);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <section id="cms" className="py-14 lg:py-20 bg-[#F3F1EC]/60 border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Shop Management &amp; Storefront Console
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Store manager, menu &amp; traffic analytics
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#E6E2D8]/80 rounded-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'menu'
                  ? 'bg-white text-[#181615] shadow-sm'
                  : 'text-[#4E4842] hover:text-[#181615]'
              }`}
            >
              Menu &amp; Prices
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white text-[#181615] shadow-sm'
                  : 'text-[#4E4842] hover:text-[#181615]'
              }`}
            >
              Site Traffic ({analyticsSummary.totalWebsiteViews.toLocaleString()})
            </button>
          </div>
        </div>

        {activeTab === 'menu' ? (
          <div className="space-y-5">
            {/* CMS Toolbar */}
            <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#181615]">
                  {isMenuSeeded
                    ? `Live Cloud Catalog · ${menuItems.length} items synced`
                    : 'Default Starter Catalog Active (Auto-syncs on your first edit)'}
                </p>
                <p className="text-xs text-[#6B645C] mt-0.5">
                  Temporary pictures appear until you upload a custom photo for an item.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(!isMenuSeeded || hasLegacyMenu) && (
                  <button
                    type="button"
                    onClick={seedDefaultMenu}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-semibold text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UploadCloud className="w-4 h-4 text-[#1B3B2B]" />
                    <span>
                      {hasLegacyMenu
                        ? 'Sync New Mang Kape Menu (31 Items)'
                        : 'Sync Menu to Firestore'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={openNewForm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Seasonal / Menu Item</span>
                </button>
              </div>
            </div>

            {/* Easy Navigation Bar: Search + Photo Filter + Category Strip */}
            <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#6B645C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cmsSearch}
                    onChange={(e) => setCmsSearch(e.target.value)}
                    placeholder="Search items to edit, price, or upload photos..."
                    aria-label="Search store manager menu items"
                    className="w-full pl-10 pr-9 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  />
                  {cmsSearch && (
                    <button
                      type="button"
                      onClick={() => setCmsSearch('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B645C] hover:text-[#181615] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPhotoFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      photoFilter === 'all'
                        ? 'bg-[#181615] text-white border-[#181615]'
                        : 'bg-[#FAF9F6] text-[#4E4842] border-[#DFD9CC] hover:text-[#181615]'
                    }`}
                  >
                    All ({photoCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoFilter('temp')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      photoFilter === 'temp'
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                        : 'bg-[#FAF9F6] text-[#4E4842] border-[#DFD9CC] hover:text-[#181615]'
                    }`}
                  >
                    Needs Photo ({photoCounts.temp})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoFilter('custom')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      photoFilter === 'custom'
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                        : 'bg-[#FAF9F6] text-[#4E4842] border-[#DFD9CC] hover:text-[#181615]'
                    }`}
                  >
                    Uploaded Photo ({photoCounts.custom})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EFECE4]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCmsCategory('All')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      cmsCategory === 'All'
                        ? 'bg-[#1B3B2B] text-white'
                        : 'bg-[#F3F1EC] text-[#4E4842] hover:text-[#181615]'
                    }`}
                  >
                    All Categories ({menuItems.length})
                  </button>
                  {MENU_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setCmsCategory(category)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        cmsCategory === category
                          ? 'bg-[#1B3B2B] text-white'
                          : 'bg-[#F3F1EC] text-[#4E4842] hover:text-[#181615]'
                      }`}
                    >
                      {category} ({categoryCounts.get(category) ?? 0})
                    </button>
                  ))}
                </div>

                <p className="text-xs font-mono-tabular text-[#6B645C] whitespace-nowrap">
                  Showing {filteredCmsItems.length} of {menuItems.length}
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-3 text-xs text-[#991B1B]">
                <span>{uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="font-semibold hover:underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Add / Edit Item Modal */}
            {showAddForm && (
              <div
                className="fixed inset-0 z-50 bg-[#181615]/50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label={editingId ? 'Edit Menu Item' : 'Publish New Menu Item'}
              >
                <form
                  onSubmit={handleSaveDraft}
                  className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E6E2D8] p-6 space-y-5 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-[#EFECE4] pb-3">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-[#181615]">
                        {editingId ? 'Edit Menu Item' : 'Publish New Menu Item'}
                      </h3>
                      <p className="text-xs text-[#6B645C] mt-0.5">
                        Update details, pricing, or upload an item photo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="p-2 rounded-lg text-[#4E4842] hover:text-[#181615] hover:bg-[#F3F1EC] cursor-pointer"
                      aria-label="Close edit modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
                      {errorMsg}
                    </div>
                  )}

                  {/* Photo Upload & Temporary Photo Style */}
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2D8] flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-28 h-28 rounded-xl overflow-hidden border border-[#DFD9CC] bg-[#EFECE4] shrink-0">
                      <ResilientImage
                        imageKey={draft.imageKey}
                        customSrc={draft.imageUrl}
                        alt={draft.name || 'Menu item preview'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <p className="text-xs font-semibold text-[#181615]">
                          {draft.imageUrl ? 'Uploaded Item Photo' : 'Temporary Menu Picture Active'}
                        </p>
                        <p className="text-xs text-[#6B645C] mt-0.5">
                          Upload a square or landscape drink photo (automatically resized for fast storefront loading).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg cursor-pointer transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          <span>
                            {uploadingItemId === 'draft'
                              ? 'Processing...'
                              : draft.imageUrl
                                ? 'Replace Photo'
                                : 'Upload Photo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              handleDraftPhotoUpload(file);
                            }}
                          />
                        </label>

                        {draft.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setDraft({ ...draft, imageUrl: '' })}
                            className="px-3 py-2 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4E4842] mb-1">
                          Temporary Picture Fallback Style
                        </label>
                        <select
                          value={draft.imageKey}
                          onChange={(e) =>
                            setDraft({ ...draft, imageKey: e.target.value as ImageKey })
                          }
                          className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                        >
                          {TEMP_IMAGE_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="e.g. Honey Lavender Cortado"
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Category
                      </label>
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({ ...draft, category: e.target.value as MenuCategory })
                        }
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      >
                        {MENU_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Price (PHP ₱)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0.50"
                        max="5000"
                        required
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4E4842] mb-1">
                      Tasting Notes
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={draft.tastingNotes}
                      onChange={(e) => setDraft({ ...draft, tastingNotes: e.target.value })}
                      placeholder="Wildflower honey · Culinary lavender · Velvet espresso"
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4E4842] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      required
                      maxLength={260}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="Preparation details and origin notes..."
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <label className="inline-flex items-center gap-2 text-sm text-[#181615] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isSeasonal}
                        onChange={(e) => setDraft({ ...draft, isSeasonal: e.target.checked })}
                        className="w-4 h-4 accent-[#1B3B2B]"
                      />
                      <span>Seasonal Special</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-[#181615] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.inStock}
                        onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
                        className="w-4 h-4 accent-[#1B3B2B]"
                      />
                      <span>In Stock</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-[#181615] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.featured}
                        onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                        className="w-4 h-4 accent-[#1B3B2B]"
                      />
                      <span>Featured</span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-[#EFECE4] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2.5 min-h-[42px] text-xs font-medium text-[#4E4842] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Item'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Table */}
            {filteredCmsItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E6E2D8] p-10 text-center space-y-3">
                <p className="text-sm font-medium text-[#181615]">
                  No menu items match your current filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCmsSearch('');
                    setCmsCategory('All');
                    setPhotoFilter('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#1B3B2B] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E6E2D8] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E2D8] text-xs font-medium text-[#6B645C]">
                      <th className="py-3.5 px-5">Photo</th>
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Stars &amp; Loves</th>
                      <th className="py-3.5 px-4">Price (₱)</th>
                      <th className="py-3.5 px-4">Seasonal</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4] text-sm">
                    {filteredCmsItems.map((item) => {
                      const pendingPrice =
                        inlinePrices[item.id] ?? (item.priceCents / 100).toFixed(2);
                      const priceDirty =
                        inlinePrices[item.id] !== undefined &&
                        inlinePrices[item.id] !== (item.priceCents / 100).toFixed(2);
                      const hasCustomPhoto = Boolean(item.imageUrl && item.imageUrl.trim());
                      const isUploading = uploadingItemId === item.id;

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E6E2D8] bg-[#EFECE4] shrink-0">
                                <ResilientImage
                                  imageKey={item.imageKey}
                                  customSrc={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1">
                                <p
                                  className={`text-[11px] font-medium ${
                                    hasCustomPhoto ? 'text-[#1B3B2B]' : 'text-[#6B645C]'
                                  }`}
                                >
                                  {hasCustomPhoto ? 'Uploaded' : 'Temp photo'}
                                </p>
                                <label className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded cursor-pointer transition-colors">
                                  <Camera className="w-3 h-3 text-[#1B3B2B]" />
                                  <span>
                                    {isUploading
                                      ? 'Saving...'
                                      : hasCustomPhoto
                                        ? 'Change'
                                        : 'Upload'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isUploading}
                                    className="sr-only"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = '';
                                      handleRowPhotoUpload(item, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-[#181615]">{item.name}</p>
                            <p className="text-xs text-[#6B645C] truncate max-w-xs">
                              {item.tastingNotes || item.description}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#4E4842] whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap font-mono-tabular">
                            {(() => {
                              const pop = itemPopularityById[item.id];
                              return (
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-3.5 h-3.5 fill-[#C88A1E] text-[#C88A1E]" />
                                  <span className="font-semibold text-[#181615]">
                                    {pop ? pop.ratingAvg.toFixed(1) : '4.8'}
                                  </span>
                                  <span className="text-[#6B645C]">
                                    · {pop ? pop.loveCount : 0} loves
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.50"
                                min="0.50"
                                max="5000"
                                aria-label={`Price for ${item.name}`}
                                value={pendingPrice}
                                onChange={(e) =>
                                  setInlinePrices((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                className="w-20 px-2 py-1 text-sm font-mono-tabular bg-[#FAF9F6] border border-[#DFD9CC] rounded-md"
                              />
                              {priceDirty && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickPriceSave(item)}
                                  className="p-1.5 rounded-md bg-[#1B3B2B] text-white hover:bg-[#142D20] cursor-pointer"
                                  aria-label={`Save price for ${item.name}`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleField(item, 'isSeasonal')}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                                item.isSeasonal
                                  ? 'bg-[#1B3B2B]/10 border-[#1B3B2B]/30 text-[#1B3B2B]'
                                  : 'bg-[#FAF9F6] border-[#DFD9CC] text-[#6B645C]'
                              }`}
                            >
                              {item.isSeasonal ? 'Featured' : 'Standard'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleField(item, 'inStock')}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                                item.inStock
                                  ? 'bg-white border-[#DFD9CC] text-[#181615]'
                                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                              }`}
                            >
                              {item.inStock ? 'In Stock' : 'Sold Out'}
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(item)}
                                className="p-2 rounded-lg text-[#4E4842] hover:text-[#181615] hover:bg-[#EFECE4] cursor-pointer"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {isMenuSeeded &&
                                (confirmDeleteId === item.id ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      deleteMenuItem(item.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-white bg-[#991B1B] rounded-md cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    className="p-2 rounded-lg text-[#6B645C] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                                    aria-label={`Delete ${item.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Website Traffic & Most Visited Pages Tab */
          <div className="space-y-6">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-[#E6E2D8] p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-[#6B645C]">Total Website Views</p>
                  <Eye className="w-4 h-4 text-[#1B3B2B]" />
                </div>
                <p className="font-display text-3xl font-semibold font-mono-tabular text-[#181615]">
                  {analyticsSummary.totalWebsiteViews.toLocaleString()}
                </p>
                <p className="text-xs text-[#6B645C] mt-1.5">
                  Storefront sessions recorded across devices
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#E6E2D8] p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-[#6B645C]">Unique Visitors</p>
                  <Users className="w-4 h-4 text-[#1B3B2B]" />
                </div>
                <p className="font-display text-3xl font-semibold font-mono-tabular text-[#181615]">
                  {analyticsSummary.totalUniqueVisitors.toLocaleString()}
                </p>
                <p className="text-xs text-[#6B645C] mt-1.5">
                  Distinct browsers that visited Mang Kape
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#E6E2D8] p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-[#6B645C]">Most Visited Page</p>
                  <BarChart3 className="w-4 h-4 text-[#1B3B2B]" />
                </div>
                <p className="font-display text-2xl font-semibold text-[#181615] truncate">
                  {analyticsSummary.topPage && analyticsSummary.topPage.views > 0
                    ? analyticsSummary.topPage.label
                    : 'No visits yet'}
                </p>
                <p className="text-xs font-mono-tabular text-[#6B645C] mt-2">
                  {analyticsSummary.topPage && analyticsSummary.topPage.views > 0
                    ? `${analyticsSummary.topPage.views.toLocaleString()} views · ${Math.round(
                        (analyticsSummary.topPage.views /
                          Math.max(1, analyticsSummary.totalSectionViews)) *
                          100
                      )}% of page visits`
                    : 'Visits appear here as guests browse sections'}
                </p>
              </div>
            </div>

            {/* Most Visited Pages Ranked Table */}
            <div className="bg-white rounded-xl border border-[#E6E2D8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E6E2D8] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[#181615]">
                    Most Visited Pages &amp; Storefront Sections
                  </h3>
                  <p className="text-xs text-[#6B645C] mt-0.5">
                    Ranked by session views across navigation clicks and scrolled sections ·{' '}
                    <span className="font-mono-tabular">
                      {analyticsSummary.totalSectionViews.toLocaleString()} total section views
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {confirmResetStats ? (
                    <>
                      <button
                        type="button"
                        disabled={resettingStats}
                        onClick={handleResetAnalytics}
                        className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#991B1B] hover:bg-[#7F1D1D] rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {resettingStats ? 'Resetting...' : 'Confirm Reset'}
                      </button>
                      <button
                        type="button"
                        disabled={resettingStats}
                        onClick={() => setConfirmResetStats(false)}
                        className="px-3 py-2 min-h-[38px] text-xs font-medium text-[#4E4842] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmResetStats(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#4E4842] bg-[#FAF9F6] hover:bg-[#EFECE4] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Counters</span>
                    </button>
                  )}
                </div>
              </div>

              {pageStatsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-11 rounded-lg bg-[#F3F1EC] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E2D8] text-xs font-medium text-[#6B645C]">
                        <th className="py-3.5 px-5 w-16">Rank</th>
                        <th className="py-3.5 px-4">Page / Section</th>
                        <th className="py-3.5 px-4 text-right">Page Views</th>
                        <th className="py-3.5 px-4 text-right">Unique</th>
                        <th className="py-3.5 px-4 w-56">Share of Visits</th>
                        <th className="py-3.5 px-5 text-right">Last Visited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE4] text-sm">
                      {analyticsSummary.rankedPages.map((page, index) => {
                        const sharePct =
                          analyticsSummary.totalSectionViews > 0
                            ? Math.round((page.views / analyticsSummary.totalSectionViews) * 100)
                            : 0;
                        const lastVisitedLabel =
                          page.views > 0 && page.updatedAtMs > 0
                            ? new Date(page.updatedAtMs).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : '—';

                        return (
                          <tr key={page.id} className="hover:bg-[#FAF9F6]">
                            <td className="py-3.5 px-5 font-mono-tabular text-xs font-semibold text-[#1B3B2B]">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-baseline gap-2">
                                <span className="font-medium text-[#181615]">{page.label}</span>
                                <span className="text-xs font-mono-tabular text-[#6B645C]">
                                  {page.route}
                                </span>
                              </div>
                              <p className="text-xs text-[#6B645C] mt-0.5">{page.description}</p>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#181615] whitespace-nowrap">
                              {page.views.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono-tabular text-[#4E4842] whitespace-nowrap">
                              {page.uniqueVisitors.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-[#EFECE4] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#1B3B2B] rounded-full transition-all duration-200"
                                    style={{ width: `${sharePct}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right text-xs font-mono-tabular text-[#4E4842]">
                                  {sharePct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right text-xs font-mono-tabular text-[#6B645C] whitespace-nowrap">
                              {lastVisitedLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
