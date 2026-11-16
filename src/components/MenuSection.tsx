import React, { useMemo, useState } from 'react';
import { FileText, Heart, Search, Star } from 'lucide-react';
import {
  formatCents,
  MENU_CATEGORIES,
  MENU_CATEGORY_META,
  SHOP_DETAILS,
} from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { MenuCategory, MenuItem } from '../types/coffee';
import { ResilientImage } from './ResilientImage';

interface StarDisplayProps {
  item: MenuItem;
  ratingAvg: number;
  ratingCount: number;
  orderCount: number;
  userRating?: number;
  isMostLoved: boolean;
  onRate: (stars: number) => void;
}

const StarRatingRow: React.FC<StarDisplayProps> = ({
  item,
  ratingAvg,
  ratingCount,
  orderCount,
  userRating,
  isMostLoved,
  onRate,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const displayStars = hoveredStar ?? Math.round(ratingAvg);

  return (
    <div className="mb-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex items-center gap-0.5"
          role="group"
          aria-label={`Customer rating ${ratingAvg.toFixed(1)} out of 5 stars for ${item.name}`}
          onMouseLeave={() => setHoveredStar(null)}
        >
          {[1, 2, 3, 4, 5].map((starNum) => {
            const filled = starNum <= displayStars;
            return (
              <button
                key={starNum}
                type="button"
                onClick={() => onRate(starNum)}
                onMouseEnter={() => setHoveredStar(starNum)}
                aria-label={`Rate ${item.name} ${starNum} out of 5 stars`}
                className="p-0.5 rounded transition-transform duration-100 hover:scale-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B3B2B]"
              >
                <Star
                  className={`w-4 h-4 transition-colors duration-150 ${
                    filled
                      ? 'fill-[#C88A1E] text-[#C88A1E]'
                      : 'fill-transparent text-[#CFC8BA]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <span className="text-xs font-semibold font-mono-tabular text-[#181615]">
          {ratingAvg.toFixed(1)}
        </span>
        <span className="text-xs font-mono-tabular text-[#6B645C]">
          ({ratingCount})
        </span>
        {userRating && (
          <span className="text-[11px] font-medium text-[#1B3B2B]">
            · Rated {userRating}★
          </span>
        )}
      </div>

      <p className="text-xs font-mono-tabular text-[#6B645C]">
        {isMostLoved ? (
          <span className="font-semibold text-[#9A6314]">
            Most frequently loved &amp; ordered ({orderCount.toLocaleString()}+ cups)
          </span>
        ) : (
          <span>{orderCount.toLocaleString()} customer orders</span>
        )}
      </p>
    </div>
  );
};

export const MenuSection: React.FC = () => {
  const {
    menuItems,
    menuLoading,
    itemPopularityById,
    lovedItemIds,
    ratedItems,
    toggleLoveItem,
    rateMenuItem,
  } = useShop();

  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostLovedOnly, setMostLovedOnly] = useState(false);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = menuItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      const pop = itemPopularityById[item.id];
      if (mostLovedOnly && !pop?.isMostLoved) return false;
      if (q) {
        const hay = `${item.name} ${item.description} ${item.tastingNotes} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (mostLovedOnly) {
      return [...list].sort(
        (a, b) =>
          (itemPopularityById[b.id]?.totalInteractions ?? 0) -
          (itemPopularityById[a.id]?.totalInteractions ?? 0)
      );
    }

    return list;
  }, [menuItems, selectedCategory, searchQuery, mostLovedOnly, itemPopularityById]);

  const groupedSections = useMemo(() => {
    if (mostLovedOnly) {
      return filteredItems.length > 0
        ? [
            {
              category: 'Most Loved Customer Favorites',
              subtitle:
                'Ranked by customer loves, 5-star ratings, and most frequently ordered pours at Mang Kape',
              items: filteredItems,
            },
          ]
        : [];
    }

    const catsToShow =
      selectedCategory === 'All' ? MENU_CATEGORIES : [selectedCategory];
    return catsToShow
      .map((category) => ({
        category,
        subtitle: MENU_CATEGORY_META[category]?.subtitle ?? '',
        items: filteredItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredItems, selectedCategory, mostLovedOnly]);

  return (
    <section id="menu" className="py-14 lg:py-20 border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Mang Kape Drinks Menu · Rated by Customers
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Our handcrafted drinks menu
            </h2>
          </div>

          {/* Search, Most Loved Filter & PDF Link */}
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
              onClick={() => setMostLovedOnly((prev) => !prev)}
              aria-pressed={mostLovedOnly}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mostLovedOnly
                  ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                  : 'bg-white text-[#4E4842] border-[#DFD9CC] hover:text-[#181615]'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  mostLovedOnly ? 'fill-[#FBBF24] text-[#FBBF24]' : 'fill-[#C88A1E] text-[#C88A1E]'
                }`}
              />
              <span>Most Loved</span>
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
                setMostLovedOnly(false);
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
                  {group.items.map((item) => {
                    const pop = itemPopularityById[item.id] ?? {
                      loveCount: 68,
                      orderCount: 124,
                      totalInteractions: 192,
                      ratingAvg: 4.8,
                      ratingCount: 24,
                      isMostLoved: false,
                    };
                    const isLoved = lovedItemIds.includes(item.id);
                    const userRating = ratedItems[item.id];

                    return (
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
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B645C] mb-1.5">
                              <span>{item.category}</span>
                              {item.category === 'Specialty Options' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>12 oz</span>
                                </>
                              )}
                              {pop.isMostLoved && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-semibold text-[#9A6314]">
                                    Most Loved
                                  </span>
                                </>
                              )}
                              {!pop.isMostLoved && item.isSeasonal && (
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

                            {/* Interactive 5-Star Customer Rating & Popularity Display */}
                            <StarRatingRow
                              item={item}
                              ratingAvg={pop.ratingAvg}
                              ratingCount={pop.ratingCount}
                              orderCount={pop.orderCount}
                              userRating={userRating}
                              isMostLoved={pop.isMostLoved}
                              onRate={(stars) => rateMenuItem(item, stars)}
                            />

                            <p className="text-sm text-[#4E4842] leading-relaxed mb-3">
                              {item.description}
                            </p>

                            {item.tastingNotes && (
                              <p className="text-xs text-[#6B645C] mb-4">{item.tastingNotes}</p>
                            )}
                          </div>

                          {/* Baseline-aligned Price & Customer Love Action */}
                          <div className="pt-4 border-t border-[#EFECE4] flex items-center justify-between gap-3">
                            <span className="text-[16px] font-semibold font-mono-tabular text-[#181615]">
                              {formatCents(item.priceCents)}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleLoveItem(item)}
                              aria-pressed={isLoved}
                              aria-label={`${isLoved ? 'Remove love for' : 'Love'} ${item.name} (${pop.loveCount} loves)`}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                                isLoved
                                  ? 'bg-[#FDF2F2] text-[#991B1B] border-[#FECACA]'
                                  : 'bg-[#FAF9F6] text-[#181615] border-[#DFD9CC] hover:bg-[#EFECE4]'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 transition-colors ${
                                  isLoved
                                    ? 'fill-[#B91C1C] text-[#B91C1C]'
                                    : 'text-[#6B645C]'
                                }`}
                              />
                              <span className="font-mono-tabular">
                                {isLoved ? 'Loved' : 'Love'} · {pop.loveCount.toLocaleString()}
                              </span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
