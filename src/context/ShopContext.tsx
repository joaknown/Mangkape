import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  BASE_ITEM_POPULARITY,
  DEFAULT_MENU_ITEMS,
  MENU_CATEGORIES,
  TRACKED_PAGES,
} from '../data/catalog';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type {
  DrinkSize,
  ItemStat,
  MenuItem,
  MenuItemPopularity,
  MenuReview,
  MilkOption,
  PageStat,
  PageStatId,
  TempOption,
  TrackedPageId,
  UserProfile,
} from '../types/coffee';

const SESSION_PAGES_KEY = 'mang_kape_session_pages_v1';
const UNIQUE_PAGES_KEY = 'mang_kape_unique_pages_v1';
const LOVED_ITEMS_KEY = 'mang_kape_loved_items_v1';
const RATED_ITEMS_KEY = 'mang_kape_rated_items_v1';

export interface UserProfileUpdateInput {
  displayName: string;
  phone: string;
  address: string;
  preferredTemp: TempOption;
  preferredSize: DrinkSize;
  preferredMilk: MilkOption;
}

export interface AuthResult {
  ok: boolean;
  isAdmin: boolean;
}

interface ShopContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  authModalOpen: boolean;
  authForMenuReview: boolean;
  authSkipRedirect: boolean;
  openAuthModal: (forMenuReview?: boolean) => void;
  closeAuthModal: () => void;
  menuItems: MenuItem[];
  isMenuSeeded: boolean;
  hasLegacyMenu: boolean;
  menuLoading: boolean;
  itemPopularityById: Record<string, MenuItemPopularity>;
  reviewsByItemId: Record<string, MenuReview[]>;
  lovedItemIds: string[];
  ratedItems: Record<string, number>;
  toggleLoveItem: (item: MenuItem) => Promise<void>;
  rateMenuItem: (item: MenuItem, stars: number) => Promise<void>;
  saveMenuReview: (item: MenuItem, rating: number, comment: string) => Promise<void>;
  deleteMenuReview: (reviewId: string) => Promise<void>;
  pageStats: PageStat[];
  pageStatsLoading: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  authError: string | null;
  signInWithGoogle: (rememberMe?: boolean, allowCustomerForMenu?: boolean) => Promise<AuthResult>;
  updateUserProfile: (updates: UserProfileUpdateInput) => Promise<void>;
  signOutUser: () => Promise<void>;
  seedDefaultMenu: () => Promise<void>;
  saveMenuItem: (item: MenuItem, isNew: boolean) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  resetMenuPhotosToDefault: () => Promise<void>;
  trackPageView: (pageId: TrackedPageId) => void;
  resetPageStats: () => Promise<void>;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleaned || `item-${Date.now()}`;
}

function timestampToMs(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts && typeof ts === 'object' && 'seconds' in ts) {
    return Number((ts as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [firestoreMenu, setFirestoreMenu] = useState<MenuItem[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [itemStats, setItemStats] = useState<Record<string, ItemStat>>({});
  const [reviews, setReviews] = useState<MenuReview[]>([]);

  const [lovedItemIds, setLovedItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOVED_ITEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [ratedItems, setRatedItems] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(RATED_ITEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, number>;
      }
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [pageStatsLoading, setPageStatsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authForMenuReview, setAuthForMenuReview] = useState(false);
  const [authSkipRedirect, setAuthSkipRedirect] = useState(false);
  const recordedSessionRef = useRef<Set<PageStatId>>(new Set());
  const adminLoginCheckingRef = useRef(false);

  const openAuthModal = useCallback((forMenuReview = false) => {
    setAuthError(null);
    setAuthForMenuReview(forMenuReview);
    setAuthSkipRedirect(forMenuReview);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(LOVED_ITEMS_KEY, JSON.stringify(lovedItemIds));
    } catch {
      // Ignore storage errors
    }
  }, [lovedItemIds]);

  useEffect(() => {
    try {
      localStorage.setItem(RATED_ITEMS_KEY, JSON.stringify(ratedItems));
    } catch {
      // Ignore storage errors
    }
  }, [ratedItems]);

  // Validate connection to Firestore on boot
  useEffect(() => {
    getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setHasAdminDoc(false);
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return user.email === BOOTSTRAP_ADMIN_EMAIL || hasAdminDoc;
  }, [user, hasAdminDoc]);

  // Public Menu listener
  useEffect(() => {
    const menuRef = collection(db, 'menuItems');
    const q = query(menuRef, orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: MenuItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            name: String(data.name || ''),
            category: data.category,
            description: String(data.description || ''),
            tastingNotes: String(data.tastingNotes || ''),
            priceCents: Number(data.priceCents || 15000),
            isSeasonal: Boolean(data.isSeasonal),
            inStock: data.inStock !== false,
            featured: Boolean(data.featured),
            imageKey: data.imageKey || 'latte',
            imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
            sortOrder: Number(data.sortOrder ?? 10),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setFirestoreMenu(docs);
        setMenuLoading(false);
      },
      (error) => {
        setMenuLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'menuItems');
      }
    );
    return () => unsub();
  }, []);

  // Public item love & star rating stats listener
  useEffect(() => {
    const statsRef = collection(db, 'itemStats');
    const unsub = onSnapshot(
      statsRef,
      (snap) => {
        const map: Record<string, ItemStat> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const itemId = String(data.itemId || d.id);
          map[itemId] = {
            itemId,
            loveCount: Number(data.loveCount ?? 0),
            ratingSum: Number(data.ratingSum ?? 0),
            ratingCount: Number(data.ratingCount ?? 0),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setItemStats(map);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'itemStats');
      }
    );
    return () => unsub();
  }, []);

  // Public customer reviews listener
  useEffect(() => {
    const reviewsRef = query(collection(db, 'reviews'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      reviewsRef,
      (snap) => {
        const list: MenuReview[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            itemId: String(data.itemId || ''),
            itemName: String(data.itemName || ''),
            userId: String(data.userId || ''),
            authorName: String(data.authorName || 'Member'),
            rating: Number(data.rating ?? 5),
            comment: String(data.comment || ''),
            createdAtMs: timestampToMs(data.createdAt),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setReviews(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );
    return () => unsub();
  }, []);

  const reviewsByItemId = useMemo<Record<string, MenuReview[]>>(() => {
    const grouped: Record<string, MenuReview[]> = {};
    reviews.forEach((rev) => {
      if (!grouped[rev.itemId]) grouped[rev.itemId] = [];
      grouped[rev.itemId].push(rev);
    });
    return grouped;
  }, [reviews]);

  const hasLegacyMenu = Boolean(
    firestoreMenu &&
      firestoreMenu.length > 0 &&
      firestoreMenu.some((m) => !MENU_CATEGORIES.includes(m.category))
  );
  const hasLegacyOnlyMenu = Boolean(
    firestoreMenu &&
      firestoreMenu.length > 0 &&
      firestoreMenu.every((m) => !MENU_CATEGORIES.includes(m.category))
  );
  const isMenuSeeded = Boolean(firestoreMenu && firestoreMenu.length > 0);
  const menuItems = useMemo(() => {
    if (firestoreMenu && firestoreMenu.length > 0 && !hasLegacyOnlyMenu) {
      return firestoreMenu;
    }
    return DEFAULT_MENU_ITEMS;
  }, [firestoreMenu, hasLegacyOnlyMenu]);

  // Compute star rating, love counts, order frequency, and Most Loved rankings for every item
  const itemPopularityById = useMemo<Record<string, MenuItemPopularity>>(() => {
    const rawEntries = menuItems.map((item) => {
      const base = BASE_ITEM_POPULARITY[item.id] ?? {
        loves: item.featured ? 112 : 68,
        orders: item.featured ? 210 : 124,
        ratingAvg: item.featured ? 4.9 : 4.8,
        ratingCount: item.featured ? 45 : 22,
      };
      const live = itemStats[item.id];
      const itemReviews = reviewsByItemId[item.id] ?? [];
      const liveLoves = Math.max(0, live?.loveCount ?? 0);
      const liveRatingCount = Math.max(0, live?.ratingCount ?? 0);
      const liveRatingSum = Math.max(0, live?.ratingSum ?? 0);
      const reviewRatingSum = itemReviews.reduce((sum, r) => sum + r.rating, 0);

      const baseRatingSum = base.ratingAvg * base.ratingCount;
      const totalRatingCount = base.ratingCount + liveRatingCount + itemReviews.length;
      const rawAvg =
        totalRatingCount > 0
          ? (baseRatingSum + liveRatingSum + reviewRatingSum) / totalRatingCount
          : 4.8;
      const ratingAvg = Math.min(5, Math.max(1, Math.round(rawAvg * 10) / 10));

      const loveCount = base.loves + liveLoves;
      const orderCount = base.orders;
      const totalInteractions = loveCount + orderCount + itemReviews.length;

      return {
        id: item.id,
        loveCount,
        orderCount,
        totalInteractions,
        ratingAvg,
        ratingCount: totalRatingCount,
        reviewCount: itemReviews.length,
      };
    });

    const sortedScores = [...rawEntries]
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .map((entry) => entry.id);
    const mostLovedSet = new Set(sortedScores.slice(0, 9));

    const result: Record<string, MenuItemPopularity> = {};
    rawEntries.forEach((entry) => {
      result[entry.id] = {
        loveCount: entry.loveCount,
        orderCount: entry.orderCount,
        totalInteractions: entry.totalInteractions,
        ratingAvg: entry.ratingAvg,
        ratingCount: entry.ratingCount,
        reviewCount: entry.reviewCount,
        isMostLoved: mostLovedSet.has(entry.id),
      };
    });
    return result;
  }, [menuItems, itemStats, reviewsByItemId]);

  // Authenticated User Profile + Admin check listeners
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    const userDocRef = doc(db, 'users', user.uid);
    const adminDocRef = doc(db, 'admins', user.uid);

    getDoc(adminDocRef)
      .then((snap) => {
        if (!cancelled) setHasAdminDoc(snap.exists());
      })
      .catch(() => {
        if (!cancelled) setHasAdminDoc(false);
      });

    const ensureProfile = async () => {
      if (adminLoginCheckingRef.current) return;
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists() && user.emailVerified && !adminLoginCheckingRef.current) {
          const displayName = (user.displayName || user.email?.split('@')[0] || 'Coffee Lover').slice(0, 80);
          const email = (user.email || 'guest@mangkape.com').slice(0, 120);
          await setDoc(userDocRef, {
            uid: user.uid,
            displayName,
            email,
            phone: '',
            address: '',
            preferredTemp: 'Iced',
            preferredSize: '16 oz',
            preferredMilk: 'Whole Milk',
            loyaltyPoints: 0,
            lifetimePoints: 0,
            favoriteOrderId: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    };
    ensureProfile();

    const unsubProfile = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile({
            uid: String(data.uid || user.uid),
            displayName: String(data.displayName || user.displayName || 'Member'),
            email: String(data.email || user.email || ''),
            phone: typeof data.phone === 'string' ? data.phone : '',
            address: typeof data.address === 'string' ? data.address : '',
            preferredTemp:
              data.preferredTemp === 'Hot' || data.preferredTemp === 'Iced'
                ? data.preferredTemp
                : 'Iced',
            preferredSize:
              data.preferredSize === '12 oz' ||
              data.preferredSize === '16 oz' ||
              data.preferredSize === '22 oz'
                ? data.preferredSize
                : '16 oz',
            preferredMilk:
              data.preferredMilk === 'Whole Milk' ||
              data.preferredMilk === 'Oat Milk (Oatside)' ||
              data.preferredMilk === 'Soy Milk (Kirkland)' ||
              data.preferredMilk === 'Low Fat Milk' ||
              data.preferredMilk === 'None'
                ? data.preferredMilk
                : data.preferredMilk === 'Oat Milk'
                  ? 'Oat Milk (Oatside)'
                  : 'Whole Milk',
            loyaltyPoints: Number(data.loyaltyPoints ?? 0),
            lifetimePoints: Number(data.lifetimePoints ?? 0),
            favoriteOrderId: String(data.favoriteOrderId || ''),
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    return () => {
      cancelled = true;
      unsubProfile();
    };
  }, [authReady, user]);

  // Admin Site Analytics listener
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setPageStats([]);
      setPageStatsLoading(false);
      return;
    }

    setPageStatsLoading(true);
    const statsRef = collection(db, 'pageStats');
    const unsubStats = onSnapshot(
      statsRef,
      (snap) => {
        const statsList: PageStat[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            pageId: (data.pageId || d.id) as PageStatId,
            views: Number(data.views ?? 0),
            uniqueVisitors: Number(data.uniqueVisitors ?? 0),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setPageStats(statsList);
        setPageStatsLoading(false);
      },
      (error) => {
        setPageStatsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'pageStats');
      }
    );

    return () => {
      unsubStats();
    };
  }, [authReady, user, isAdmin]);

  const toggleLoveItem = useCallback(
    async (item: MenuItem) => {
      if (!user || !user.emailVerified) {
        showToast('Please sign in to vote on the menu');
        openAuthModal(true);
        return;
      }

      const cleanId = sanitizeId(item.id);
      const currentlyLoved = lovedItemIds.includes(cleanId);
      const currentStat = itemStats[cleanId];
      const currentLiveLoves = currentStat?.loveCount ?? 0;

      setLovedItemIds((prev) =>
        currentlyLoved ? prev.filter((id) => id !== cleanId) : [...prev, cleanId]
      );

      if (currentlyLoved && currentLiveLoves <= 0) {
        showToast(`Removed ${item.name} from your loved drinks`);
        return;
      }

      const statRef = doc(db, 'itemStats', cleanId);
      try {
        const snap = await getDoc(statRef);
        if (!snap.exists()) {
          if (!currentlyLoved) {
            await setDoc(statRef, {
              itemId: cleanId,
              loveCount: 1,
              ratingSum: 0,
              ratingCount: 0,
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          const existingLoves = Number(snap.data().loveCount ?? 0);
          if (!currentlyLoved || existingLoves > 0) {
            await updateDoc(statRef, {
              loveCount: increment(currentlyLoved ? -1 : 1),
              updatedAt: serverTimestamp(),
            });
          }
        }
        showToast(
          currentlyLoved
            ? `Removed love for ${item.name}`
            : `Loved ${item.name} · Added to customer favorites`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `itemStats/${cleanId}`);
      }
    },
    [user, lovedItemIds, itemStats, showToast, openAuthModal]
  );

  const rateMenuItem = useCallback(
    async (item: MenuItem, stars: number) => {
      const clampedStars = Math.min(5, Math.max(1, Math.round(stars)));
      const cleanId = sanitizeId(item.id);
      if (ratedItems[cleanId]) {
        showToast(`You already rated ${item.name} (${ratedItems[cleanId]}★)`);
        return;
      }

      setRatedItems((prev) => ({ ...prev, [cleanId]: clampedStars }));
      const statRef = doc(db, 'itemStats', cleanId);

      try {
        const snap = await getDoc(statRef);
        if (!snap.exists()) {
          await setDoc(statRef, {
            itemId: cleanId,
            loveCount: 0,
            ratingSum: clampedStars,
            ratingCount: 1,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(statRef, {
            ratingSum: increment(clampedStars),
            ratingCount: increment(1),
            updatedAt: serverTimestamp(),
          });
        }
        showToast(`Rated ${item.name} ${clampedStars}★ — Thank you!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `itemStats/${cleanId}`);
      }
    },
    [ratedItems, showToast]
  );

  const saveMenuReview = useCallback(
    async (item: MenuItem, rating: number, comment: string) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please log in with a verified account to leave a review.');
      }
      const cleanComment = comment.trim().slice(0, 400);
      if (cleanComment.length < 3) {
        throw new Error('Please write at least 3 characters in your review comment.');
      }
      const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));
      const cleanItemId = sanitizeId(item.id);
      const reviewId = `${cleanItemId}__${user.uid}`;
      const reviewRef = doc(db, 'reviews', reviewId);
      const authorName = (
        userProfile?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Mang Kape Member'
      )
        .trim()
        .slice(0, 80);
      const itemName = item.name.trim().slice(0, 80);

      try {
        const snap = await getDoc(reviewRef);
        if (!snap.exists()) {
          await setDoc(reviewRef, {
            id: reviewId,
            itemId: cleanItemId,
            itemName,
            userId: user.uid,
            authorName,
            rating: clampedRating,
            comment: cleanComment,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          showToast(`Published your ${clampedRating}★ review for ${item.name}`);
        } else {
          await updateDoc(reviewRef, {
            authorName,
            itemName,
            rating: clampedRating,
            comment: cleanComment,
            updatedAt: serverTimestamp(),
          });
          showToast(`Updated your review for ${item.name}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `reviews/${reviewId}`);
      }
    },
    [user, userProfile, showToast]
  );

  const deleteMenuReview = useCallback(
    async (reviewId: string) => {
      if (!user || !user.emailVerified) return;
      const cleanId = sanitizeId(reviewId);
      try {
        await deleteDoc(doc(db, 'reviews', cleanId));
        showToast('Removed your review');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reviews/${cleanId}`);
      }
    },
    [user, showToast]
  );

  const recordStatHit = useCallback((statId: PageStatId) => {
    if (recordedSessionRef.current.has(statId)) return;

    let sessionSeen: string[] = [];
    try {
      const raw = sessionStorage.getItem(SESSION_PAGES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) sessionSeen = parsed;
    } catch {
      sessionSeen = [];
    }

    if (sessionSeen.includes(statId)) {
      recordedSessionRef.current.add(statId);
      return;
    }

    recordedSessionRef.current.add(statId);
    try {
      sessionStorage.setItem(SESSION_PAGES_KEY, JSON.stringify([...sessionSeen, statId]));
    } catch {
      // Ignore storage quota errors
    }

    let isFirstBrowserVisit = true;
    try {
      const rawUnique = localStorage.getItem(UNIQUE_PAGES_KEY);
      const parsedUnique = rawUnique ? JSON.parse(rawUnique) : [];
      const uniqueList: string[] = Array.isArray(parsedUnique) ? parsedUnique : [];
      if (uniqueList.includes(statId)) {
        isFirstBrowserVisit = false;
      } else {
        localStorage.setItem(UNIQUE_PAGES_KEY, JSON.stringify([...uniqueList, statId]));
      }
    } catch {
      isFirstBrowserVisit = false;
    }

    const statRef = doc(db, 'pageStats', statId);
    setDoc(
      statRef,
      {
        pageId: statId,
        views: increment(1),
        uniqueVisitors: increment(isFirstBrowserVisit ? 1 : 0),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((error) => {
      try {
        handleFirestoreError(error, OperationType.WRITE, `pageStats/${statId}`);
      } catch {
        // Prevent unhandled rejection in background analytics
      }
    });
  }, []);

  useEffect(() => {
    recordStatHit('site-overview');
    recordStatHit('home');
  }, [recordStatHit]);

  const trackPageView = useCallback(
    (pageId: TrackedPageId) => {
      recordStatHit(pageId);
    },
    [recordStatHit]
  );

  const resetPageStats = useCallback(async () => {
    if (!isAdmin) return;
    const allIds: PageStatId[] = ['site-overview', ...TRACKED_PAGES.map((p) => p.id)];
    const batch = writeBatch(db);
    allIds.forEach((statId) => {
      batch.set(doc(db, 'pageStats', statId), {
        pageId: statId,
        views: 0,
        uniqueVisitors: 0,
        updatedAt: serverTimestamp(),
      });
    });
    try {
      await batch.commit();
      recordedSessionRef.current.clear();
      try {
        sessionStorage.removeItem(SESSION_PAGES_KEY);
      } catch {
        // Ignore storage errors
      }
      showToast('Website traffic counters reset to 0');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pageStats');
    }
  }, [isAdmin, showToast]);

  const signInWithGoogle = useCallback(
    async (rememberMe = true, allowCustomerForMenu = false): Promise<AuthResult> => {
      setAuthError(null);
      adminLoginCheckingRef.current = !allowCustomerForMenu;
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        const cred = await signInWithPopup(auth, googleProvider);
        const loggedUser = cred.user;
        let signedInAsAdmin =
          Boolean(loggedUser.emailVerified) && loggedUser.email === BOOTSTRAP_ADMIN_EMAIL;
        if (!signedInAsAdmin && loggedUser.emailVerified) {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', loggedUser.uid));
            signedInAsAdmin = adminSnap.exists();
          } catch {
            signedInAsAdmin = false;
          }
        }

        if (!allowCustomerForMenu && !signedInAsAdmin) {
          await signOut(auth);
          setUser(null);
          setHasAdminDoc(false);
          setUserProfile(null);
          setAuthError(
            'Only Mang Kape administrators can log in directly. Visitors can sign in directly on any menu item when voting or writing a rating.'
          );
          return { ok: false, isAdmin: false };
        }

        if (signedInAsAdmin && loggedUser.emailVerified) {
          const userDocRef = doc(db, 'users', loggedUser.uid);
          try {
            const existingSnap = await getDoc(userDocRef);
            if (!existingSnap.exists()) {
              const displayName = (
                loggedUser.displayName ||
                loggedUser.email?.split('@')[0] ||
                'Administrator'
              ).slice(0, 80);
              const email = (loggedUser.email || 'admin@mangkape.com').slice(0, 120);
              await setDoc(userDocRef, {
                uid: loggedUser.uid,
                displayName,
                email,
                phone: '',
                address: '',
                preferredTemp: 'Iced',
                preferredSize: '16 oz',
                preferredMilk: 'Whole Milk',
                loyaltyPoints: 0,
                lifetimePoints: 0,
                favoriteOrderId: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch {
            // Listener will surface errors if needed
          }
        }

        showToast(
          signedInAsAdmin
            ? 'Signed in as Mang Kape Administrator'
            : `Signed in as ${loggedUser.displayName || 'Guest'} to vote & rate`
        );
        return { ok: true, isAdmin: signedInAsAdmin };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to complete sign-in.';
        setAuthError(msg);
        return { ok: false, isAdmin: false };
      } finally {
        adminLoginCheckingRef.current = false;
      }
    },
    [showToast]
  );

  const updateUserProfile = useCallback(
    async (updates: UserProfileUpdateInput) => {
      if (!user) return;
      const cleanName = updates.displayName.trim().slice(0, 80);
      if (!cleanName) {
        throw new Error('Display name cannot be empty.');
      }
      const cleanPhone = updates.phone.trim().slice(0, 30);
      const cleanAddress = updates.address.trim().slice(0, 160);

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
          preferredTemp: updates.preferredTemp,
          preferredSize: updates.preferredSize,
          preferredMilk: updates.preferredMilk,
          updatedAt: serverTimestamp(),
        });
        showToast('Your account information has been updated');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [user, showToast]
  );

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      showToast('Signed out');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-out failed.';
      setAuthError(msg);
    }
  }, [showToast]);

  const seedDefaultMenu = useCallback(async () => {
    if (!isAdmin) return;
    const batch = writeBatch(db);
    const nextIds = new Set(DEFAULT_MENU_ITEMS.map((item) => sanitizeId(item.id)));

    if (firestoreMenu && firestoreMenu.length > 0) {
      firestoreMenu.forEach((existingItem) => {
        const cleanExistingId = sanitizeId(existingItem.id);
        if (!nextIds.has(cleanExistingId)) {
          batch.delete(doc(db, 'menuItems', cleanExistingId));
        }
      });
    }

    DEFAULT_MENU_ITEMS.forEach((item) => {
      const cleanId = sanitizeId(item.id);
      const ref = doc(db, 'menuItems', cleanId);
      batch.set(ref, {
        id: cleanId,
        name: item.name.slice(0, 80),
        category: item.category,
        description: item.description.slice(0, 260),
        tastingNotes: item.tastingNotes.slice(0, 120),
        priceCents: Math.min(500000, Math.max(50, Math.round(item.priceCents))),
        isSeasonal: item.isSeasonal,
        inStock: item.inStock,
        featured: item.featured,
        imageKey: item.imageKey,
        imageUrl: (item.imageUrl || '').slice(0, 250000),
        sortOrder: item.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    try {
      await batch.commit();
      showToast('Published Mang Kape menu (31 items) to live Store Manager');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'menuItems');
    }
  }, [isAdmin, firestoreMenu, showToast]);

  const saveMenuItem = useCallback(
    async (item: MenuItem, isNew: boolean) => {
      if (!isAdmin) return;
      const cleanId = sanitizeId(item.id);
      const ref = doc(db, 'menuItems', cleanId);
      const payload = {
        id: cleanId,
        name: item.name.trim().slice(0, 80),
        category: item.category,
        description: item.description.trim().slice(0, 260),
        tastingNotes: item.tastingNotes.trim().slice(0, 120),
        priceCents: Math.min(500000, Math.max(50, Math.round(item.priceCents))),
        isSeasonal: Boolean(item.isSeasonal),
        inStock: Boolean(item.inStock),
        featured: Boolean(item.featured),
        imageKey: item.imageKey,
        imageUrl: (item.imageUrl || '').slice(0, 250000),
        sortOrder: Math.min(1000, Math.max(0, Math.round(item.sortOrder))),
        updatedAt: serverTimestamp(),
      };

      try {
        if (!firestoreMenu || firestoreMenu.length === 0 || hasLegacyOnlyMenu) {
          const batch = writeBatch(db);
          if (firestoreMenu && firestoreMenu.length > 0) {
            const defaultIds = new Set(DEFAULT_MENU_ITEMS.map((m) => sanitizeId(m.id)));
            firestoreMenu.forEach((existing) => {
              const existingCleanId = sanitizeId(existing.id);
              if (!defaultIds.has(existingCleanId) && existingCleanId !== cleanId) {
                batch.delete(doc(db, 'menuItems', existingCleanId));
              }
            });
          }

          let includedTarget = false;
          DEFAULT_MENU_ITEMS.forEach((def) => {
            const defCleanId = sanitizeId(def.id);
            if (defCleanId === cleanId) {
              includedTarget = true;
              batch.set(doc(db, 'menuItems', defCleanId), {
                ...payload,
                createdAt: serverTimestamp(),
              });
            } else {
              batch.set(doc(db, 'menuItems', defCleanId), {
                id: defCleanId,
                name: def.name.slice(0, 80),
                category: def.category,
                description: def.description.slice(0, 260),
                tastingNotes: def.tastingNotes.slice(0, 120),
                priceCents: Math.min(500000, Math.max(50, Math.round(def.priceCents))),
                isSeasonal: def.isSeasonal,
                inStock: def.inStock,
                featured: def.featured,
                imageKey: def.imageKey,
                imageUrl: (def.imageUrl || '').slice(0, 250000),
                sortOrder: def.sortOrder,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          });

          if (!includedTarget) {
            batch.set(ref, {
              ...payload,
              createdAt: serverTimestamp(),
            });
          }

          await batch.commit();
          showToast(`Synced menu & saved "${payload.name}"`);
          return;
        }

        if (isNew) {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
          });
          showToast(`Published "${payload.name}" to menu`);
        } else {
          await updateDoc(ref, payload);
          showToast(`Updated "${payload.name}"`);
        }
      } catch (error) {
        handleFirestoreError(
          error,
          isNew ? OperationType.CREATE : OperationType.UPDATE,
          `menuItems/${cleanId}`
        );
      }
    },
    [isAdmin, firestoreMenu, hasLegacyOnlyMenu, showToast]
  );

  const deleteMenuItem = useCallback(
    async (itemId: string) => {
      if (!isAdmin) return;
      const cleanId = sanitizeId(itemId);
      try {
        await deleteDoc(doc(db, 'menuItems', cleanId));
        showToast('Removed item from menu');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `menuItems/${cleanId}`);
      }
    },
    [isAdmin, showToast]
  );

  const resetMenuPhotosToDefault = useCallback(async () => {
    if (!isAdmin) return;
    if (!firestoreMenu || firestoreMenu.length === 0) {
      showToast('All menu items already use the default Mang Kape cup photo');
      return;
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    firestoreMenu.forEach((item) => {
      if ((item.imageUrl && item.imageUrl.trim()) || item.imageKey !== 'latte') {
        const cleanId = sanitizeId(item.id);
        batch.update(doc(db, 'menuItems', cleanId), {
          imageUrl: '',
          imageKey: 'latte',
          updatedAt: serverTimestamp(),
        });
        updatedCount += 1;
      }
    });

    if (updatedCount === 0) {
      showToast('All menu items already use the default Mang Kape cup photo');
      return;
    }

    try {
      await batch.commit();
      showToast(`Applied default Mang Kape cup photo to ${updatedCount} menu items`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'menuItems');
    }
  }, [isAdmin, firestoreMenu, showToast]);

  return (
    <ShopContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        userProfile,
        authModalOpen,
        authForMenuReview,
        authSkipRedirect,
        openAuthModal,
        closeAuthModal,
        menuItems,
        isMenuSeeded,
        hasLegacyMenu,
        menuLoading,
        itemPopularityById,
        reviewsByItemId,
        lovedItemIds,
        ratedItems,
        toggleLoveItem,
        rateMenuItem,
        saveMenuReview,
        deleteMenuReview,
        pageStats,
        pageStatsLoading,
        toastMessage,
        showToast,
        authError,
        signInWithGoogle,
        updateUserProfile,
        signOutUser,
        seedDefaultMenu,
        saveMenuItem,
        deleteMenuItem,
        resetMenuPhotosToDefault,
        trackPageView,
        resetPageStats,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
