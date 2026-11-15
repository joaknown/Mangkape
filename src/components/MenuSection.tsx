import React, { useMemo, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import {
  formatCents,
  MENU_CATEGORIES,
  MENU_CATEGORY_META,
  SHOP_DETAILS,
} from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { MenuCategory, MenuItem } from '../types/coffee';
import { CustomizeModal } from './CustomizeModal';
import { ResilientImage } from './ResilientImage';

export const MenuSection: React.FC = () => {
  const { menuItems, menuLoading } = useShop();
  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonalOnly, setSeasonalOnly] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (seasonalOnly && !item.isSeasonal) return false;
      if (q) {
        const hay = `${item.name} ${item.description} ${item.tastingNotes} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, seasonalOnly]);

  const groupedSections = useMemo(() => {
    const catsToShow =
      selectedCategory === 'All' ? MENU_CATEGORIES : [selectedCategory];
    return catsToShow
      .map((category) => ({
        category,
        subtitle: MENU_CATEGORY_META[category]?.subtitle ?? '',
        items: filteredItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredItems, selectedCategory]);

  return (
    <section id="menu" className="py-14 lg:py-20 border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Integrated Menu &amp; Online Ordering
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Our handcrafted drinks menu
            </h2>
          </div>

          {/* Search, Seasonal Filter & PDF Link */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B645C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drinks or notes..."
                aria-label="Search menu items"
                className="pl-9 pr-3 py-2 min-h-[40px] w-52 sm:w-60 text-sm bg-white border border-[#DFD9CC] rounded-lg text-[#181615] placeholder:text-[#8A8278] focus:outline-2 focus:outline-[#1B3B2B]"
              />
            </div>

            <button
              type="button"
              onClick={() => setSeasonalOnly((prev) => !prev)}
              aria-pressed={seasonalOnly}
              className={`px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                seasonalOnly
                  ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                  : 'bg-white text-[#4E4842] border-[#DFD9CC] hover:text-[#181615]'
              }`}
            >
              Signature &amp; Featured
            </button>

            <a
              href={SHOP_DETAILS.menuPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#1B3B2B]" />
              <span>Menu PDF</span>
            </a>
          </div>
        </div>

        {/* Interactive Category Segmented Filter Bar */}
        <div
          className="flex items-center gap-1.5 p-1 bg-[#EFECE4] rounded-lg overflow-x-auto mb-10"
          role="tablist"
          aria-label="Menu categories"
        >
          {(['All', ...MENU_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#181615] shadow-sm'
                    : 'text-[#4E4842] hover:text-[#181615]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Organized Menu Sections */}
        {menuLoading && filteredItems.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-xl bg-[#F3F1EC] border border-[#E6E2D8] animate-pulse"
              />
            ))}
          </div>
        ) : groupedSections.length === 0 ? (
          <div className="py-14 px-6 text-center bg-[#F3F1EC] rounded-xl border border-[#E6E2D8]">
            <p className="text-base font-medium text-[#181615] mb-1">
              No menu items match your filter.
            </p>
            <p className="text-sm text-[#4E4842] mb-4">
              Try clearing your search or switching back to All categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setSeasonalOnly(false);
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B3B2B] rounded-lg hover:bg-[#142D20] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedSections.map((group) => (
              <div key={group.category}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 mb-6 border-b border-[#E6E2D8]">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[#181615]">
                      {group.category}
                    </h3>
                    {group.subtitle && (
                      <p className="text-xs text-[#6B645C] mt-0.5">{group.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono-tabular text-[#6B645C]">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="group bg-white rounded-xl border border-[#E6E2D8] overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      {/* Drink Photo (Uploaded custom photo or temporary category photo) */}
                      <div className="aspect-[4/3] bg-[#F3F1EC] relative overflow-hidden">
                        <ResilientImage
                          imageKey={item.imageKey}
                          customSrc={item.imageUrl}
                          alt={item.name}
                          label={item.name}
                          className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#6B645C] mb-1.5">
                            <span>{item.category}</span>
                            {item.category === 'Specialty Options' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>12 oz</span>
                              </>
                            )}
                            {item.isSeasonal && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-[#1B3B2B]">Featured</span>
                              </>
                            )}
                            {!item.inStock && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-[#991B1B]">Sold Out</span>
                              </>
                            )}
                          </div>

                          <h4 className="text-[17px] font-semibold text-[#181615] leading-snug mb-2">
                            {item.name}
                          </h4>

                          <p className="text-sm text-[#4E4842] leading-relaxed mb-3">
                            {item.description}
                          </p>

                          {item.tastingNotes && (
                            <p className="text-xs text-[#6B645C] mb-4">{item.tastingNotes}</p>
                          )}
                        </div>

                        {/* Baseline-aligned Price & Action Controls */}
                        <div className="pt-4 border-t border-[#EFECE4] flex items-center justify-between gap-3">
                          <span className="text-[16px] font-semibold font-mono-tabular text-[#181615]">
                            {formatCents(item.priceCents)}
                          </span>

                          <button
                            type="button"
                            disabled={!item.inStock}
                            onClick={() => setCustomizingItem(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] disabled:opacity-45 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            aria-label={`Add ${item.name} to cart and select Hot or Iced and cup size`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Customizer Modal */}
      {customizingItem && (
        <CustomizeModal
          key={customizingItem.id}
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
        />
      )}
    </section>
  );
};
