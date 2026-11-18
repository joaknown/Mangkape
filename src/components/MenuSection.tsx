import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Heart,
  MessageSquare,
  Pencil,
  Search,
  Star,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  formatCents,
  MENU_CATEGORIES,
  MENU_CATEGORY_META,
  SHOP_DETAILS,
} from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { MenuCategory, MenuItem, MenuReview } from '../types/coffee';
import { ResilientImage } from './ResilientImage';

function formatReviewDate(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(ms));
  } catch {
    return 'Recently';
  }
}

interface StarDisplayProps {
  item: MenuItem;
  ratingAvg: number;
  ratingCount: number;
  orderCount: number;
  isMostLoved: boolean;
  onSelectStar: (stars: number) => void;
}

const StarRatingRow: React.FC<StarDisplayProps> = ({
  item,
  ratingAvg,
  ratingCount,
  orderCount,
  isMostLoved,
  onSelectStar,
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
                onClick={() => onSelectStar(starNum)}
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

interface ItemReviewsModalProps {
  item: MenuItem;
  initialStars?: number;
  onClose: () => void;
}

const ItemReviewsModal: React.FC<ItemReviewsModalProps> = ({
  item,
  initialStars = 5,
  onClose,
}) => {
  const {
    user,
    isAdmin,
    userProfile,
    itemPopularityById,
    reviewsByItemId,
    saveMenuReview,
    deleteMenuReview,
    openAuthModal,
  } = useShop();

  const itemReviews: MenuReview[] = reviewsByItemId[item.id] ?? [];
  const pop = itemPopularityById[item.id] ?? {
    loveCount: 68,
    orderCount: 124,
    totalInteractions: 192,
    ratingAvg: 4.8,
    ratingCount: 24,
    reviewCount: 0,
    isMostLoved: false,
  };

  const myReview = useMemo(
    () => (user ? itemReviews.find((r) => r.userId === user.uid) ?? null : null),
    [itemReviews, user]
  );

  const [rating, setRating] = useState<number>(initialStars);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else {
      setRating(initialStars);
      setComment('');
      setIsEditingExisting(false);
    }
    setErrorMsg(null);
  }, [myReview, initialStars, item.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (comment.trim().length < 3) {
      setErrorMsg('Please write at least 3 characters in your tasting comment.');
      return;
    }

    setSubmitting(true);
    try {
      await saveMenuReview(item, rating, comment);
      setIsEditingExisting(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setErrorMsg(null);
    setDeletingId(reviewId);
    try {
      await deleteMenuReview(reviewId);
      setIsEditingExisting(false);
      setComment('');
      setRating(5);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to remove review.');
    } finally {
      setDeletingId(null);
    }
  };

  const showComposerForm = Boolean(user && (!myReview || isEditingExisting));
  const activeStars = hoveredStar ?? rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181615]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-reviews-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF9F6] rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with coffee item preview */}
        <div className="px-6 py-4 bg-white border-b border-[#E6E2D8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#E6E2D8] bg-[#F3F1EC] shrink-0">
              <ResilientImage
                imageKey={item.imageKey}
                customSrc={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B645C] truncate">
                {item.category}
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span className="font-mono-tabular">{formatCents(item.priceCents)}</span>
              </p>
              <h3
                id="item-reviews-modal-title"
                className="font-display text-xl font-semibold text-[#181615] truncate"
              >
                {item.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4E4842] hover:text-[#181615] hover:bg-[#EFECE4] cursor-pointer shrink-0"
            aria-label={`Close reviews for ${item.name}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Overall Rating Summary */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-display text-4xl font-semibold font-mono-tabular text-[#181615]">
                {pop.ratingAvg.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <Star
                      key={starNum}
                      className={`w-4 h-4 ${
                        starNum <= Math.round(pop.ratingAvg)
                          ? 'fill-[#C88A1E] text-[#C88A1E]'
                          : 'fill-transparent text-[#CFC8BA]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-mono-tabular text-[#6B645C]">
                  {pop.ratingCount} ratings · {itemReviews.length}{' '}
                  {itemReviews.length === 1 ? 'written review' : 'written reviews'}
                </p>
              </div>
            </div>

            <div className="text-xs text-right font-mono-tabular text-[#4E4842]">
              <p className="font-semibold text-[#1B3B2B]">
                {pop.loveCount.toLocaleString()} customer loves
              </p>
              <p className="text-[#6B645C]">
                {pop.orderCount.toLocaleString()} cups ordered
              </p>
            </div>
          </div>

          {/* Review Composer (Logged-In) or Login Prompt (Guest) */}
          {!user ? (
            <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#181615]">
                  Sign in to vote &amp; write a rating for {item.name}
                </p>
                <p className="text-xs text-[#6B645C] mt-1">
                  Sign in with Google to leave star ratings and tasting comments on this drink.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In to Vote &amp; Rate</span>
              </button>
            </div>
          ) : showComposerForm ? (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-[#E6E2D8] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-[#181615]">
                    {myReview ? 'Update your review' : 'Share your star rating & comment'}
                  </h4>
                  <p className="text-xs text-[#6B645C]">
                    Posting as {userProfile?.displayName || user.displayName || 'Mang Kape Member'}
                  </p>
                </div>

                {myReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditingExisting(false)}
                    className="text-xs font-medium text-[#6B645C] hover:text-[#181615] cursor-pointer"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4E4842] mb-1.5">
                  Your Star Rating
                </label>
                <div
                  className="inline-flex items-center gap-1"
                  onMouseLeave={() => setHoveredStar(null)}
                >
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const filled = starNum <= activeStars;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        onMouseEnter={() => setHoveredStar(starNum)}
                        aria-label={`Select ${starNum} out of 5 stars`}
                        className="p-1 rounded hover:scale-110 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B3B2B]"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            filled
                              ? 'fill-[#C88A1E] text-[#C88A1E]'
                              : 'fill-transparent text-[#CFC8BA]'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-mono-tabular font-semibold text-[#181615]">
                    {rating} / 5 stars
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="review-comment-input"
                    className="block text-xs font-medium text-[#4E4842]"
                  >
                    Your Comment
                  </label>
                  <span className="text-[11px] font-mono-tabular text-[#6B645C]">
                    {comment.length} / 400
                  </span>
                </div>
                <textarea
                  id="review-comment-input"
                  rows={3}
                  required
                  minLength={3}
                  maxLength={400}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`What did you enjoy about ${item.name}?`}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg text-[#181615] placeholder:text-[#8A8278] focus:outline-2 focus:outline-[#1B3B2B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 min-h-[40px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : myReview
                      ? 'Save Updated Review'
                      : 'Post Review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-[#1B3B2B]/30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#1B3B2B] mb-0.5">
                  Your Review ({myReview?.rating}★)
                </p>
                <p className="text-sm text-[#181615]">{myReview?.comment}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingExisting(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#1B3B2B]" />
                  <span>Edit</span>
                </button>
                {myReview && (
                  <button
                    type="button"
                    disabled={deletingId === myReview.id}
                    onClick={() => handleDelete(myReview.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === myReview.id ? 'Removing...' : 'Delete'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Customer Reviews List */}
          <div className="bg-white rounded-xl border border-[#E6E2D8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#181615]">Customer Reviews</h4>
              <span className="text-xs font-mono-tabular text-[#6B645C]">
                {itemReviews.length} {itemReviews.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            {itemReviews.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#6B645C]">
                No written customer comments yet for {item.name}.{' '}
                {user
                  ? 'Use the form above to share the first review!'
                  : 'Sign in above to vote or share your tasting notes.'}
              </div>
            ) : (
              <div className="divide-y divide-[#EFECE4]">
                {itemReviews.map((rev) => {
                  const isOwn = Boolean(user && rev.userId === user.uid);
                  const canDelete = isOwn || isAdmin;
                  return (
                    <div key={rev.id} className="px-5 py-4 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-[#181615]">
                            {rev.authorName}
                          </span>
                          {isOwn && (
                            <span className="font-medium text-[#1B3B2B]">· You</span>
                          )}
                          <span aria-hidden="true" className="text-[#B8B0A2]">·</span>
                          <span className="text-[#6B645C]">
                            {formatReviewDate(rev.updatedAtMs)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-0.5" aria-label={`${rev.rating} out of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'fill-[#C88A1E] text-[#C88A1E]'
                                    : 'fill-transparent text-[#CFC8BA]'
                                }`}
                              />
                            ))}
                          </div>
                          {canDelete && !isOwn && (
                            <button
                              type="button"
                              disabled={deletingId === rev.id}
                              onClick={() => handleDelete(rev.id)}
                              aria-label={`Remove review by ${rev.authorName}`}
                              className="p-1 text-[#6B645C] hover:text-[#991B1B] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-[#4E4842] leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MenuSection: React.FC = () => {
  const {
    menuItems,
    menuLoading,
    itemPopularityById,
    reviewsByItemId,
    lovedItemIds,
    toggleLoveItem,
  } = useShop();

  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostLovedOnly, setMostLovedOnly] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    item: MenuItem;
    initialStars: number;
  } | null>(null);

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
              description: '',
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
        description: MENU_CATEGORY_META[category]?.description ?? '',
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
              Mang Kape Drinks Menu · Customer Ratings &amp; Reviews
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
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-6 border-b border-[#E6E2D8]">
                  <div className="max-w-[70ch]">
                    <h3 className="font-display text-2xl font-semibold text-[#181615]">
                      {group.category}
                    </h3>
                    {group.subtitle && (
                      <p className="text-xs font-medium text-[#1B3B2B] mt-1">{group.subtitle}</p>
                    )}
                    {group.description && (
                      <p className="text-sm text-[#4E4842] leading-relaxed mt-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono-tabular text-[#6B645C] shrink-0">
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
                      reviewCount: 0,
                      isMostLoved: false,
                    };
                    const itemReviews = reviewsByItemId[item.id] ?? [];
                    const latestReview = itemReviews[0];
                    const isLoved = lovedItemIds.includes(item.id);

                    return (
                      <article
                        key={item.id}
                        className="group bg-white rounded-xl border border-[#E6E2D8] overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        {/* Drink Photo */}
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

                            {/* Interactive 5-Star Customer Rating Display */}
                            <StarRatingRow
                              item={item}
                              ratingAvg={pop.ratingAvg}
                              ratingCount={pop.ratingCount}
                              orderCount={pop.orderCount}
                              isMostLoved={pop.isMostLoved}
                              onSelectStar={(stars) =>
                                setReviewTarget({ item, initialStars: stars })
                              }
                            />

                            <p className="text-sm text-[#4E4842] leading-relaxed mb-3">
                              {item.description}
                            </p>

                            {item.tastingNotes && (
                              <p className="text-xs text-[#6B645C] mb-3">{item.tastingNotes}</p>
                            )}

                            {latestReview && (
                              <p className="text-xs text-[#4E4842] pt-2.5 mb-3 border-t border-[#EFECE4] line-clamp-2">
                                <span className="font-semibold text-[#181615]">
                                  {latestReview.authorName}:
                                </span>{' '}
                                &ldquo;{latestReview.comment}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Baseline-aligned Price, Reviews Trigger & Customer Love Action */}
                          <div className="pt-4 border-t border-[#EFECE4] flex items-center justify-between gap-2">
                            <span className="text-[16px] font-semibold font-mono-tabular text-[#181615]">
                              {formatCents(item.priceCents)}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setReviewTarget({ item, initialStars: 5 })}
                                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-medium text-[#181615] bg-[#FAF9F6] hover:bg-[#EFECE4] border border-[#DFD9CC] rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap"
                                aria-label={`View or write reviews for ${item.name} (${itemReviews.length} written reviews)`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-[#1B3B2B]" />
                                <span className="font-mono-tabular">
                                  {itemReviews.length > 0
                                    ? `Reviews (${itemReviews.length})`
                                    : 'Review'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleLoveItem(item)}
                                aria-pressed={isLoved}
                                aria-label={`${isLoved ? 'Remove love for' : 'Love'} ${item.name} (${pop.loveCount} loves)`}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg border transition-colors duration-150 cursor-pointer whitespace-nowrap ${
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
                                  {pop.loveCount.toLocaleString()}
                                </span>
                              </button>
                            </div>
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

      {/* Item Reviews & Ratings Modal */}
      {reviewTarget && (
        <ItemReviewsModal
          item={reviewTarget.item}
          initialStars={reviewTarget.initialStars}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </section>
  );
};
