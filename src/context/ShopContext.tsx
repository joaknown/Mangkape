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
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_MENU_ITEMS,
  MENU_CATEGORIES,
  SHOP_DETAILS,
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
  CartItem,
  DrinkSize,
  MenuItem,
  MilkOption,
  Order,
  OrderLineItem,
  OrderStatus,
  PageStat,
  PageStatId,
  PickupType,
  TempOption,
  TrackedPageId,
  UserProfile,
} from '../types/coffee';

const CART_STORAGE_KEY = 'mang_kape_bag_v1';
const SESSION_PAGES_KEY = 'mang_kape_session_pages_v1';
const UNIQUE_PAGES_KEY = 'mang_kape_unique_pages_v1';

interface PlaceOrderInput {
  customerName: string;
  pickupType: PickupType;
  pickupTime: string;
  notes: string;
  redeemReward: boolean;
}

export interface MemberRegistrationInput {
  displayName: string;
  phone: string;
  address: string;
  preferredTemp: TempOption;
  preferredSize: DrinkSize;
  preferredMilk: MilkOption;
}

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
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  menuItems: MenuItem[];
  isMenuSeeded: boolean;
  hasLegacyMenu: boolean;
  menuLoading: boolean;
  cart: CartItem[];
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
  orders: Order[];
  adminOrders: Order[];
  pageStats: PageStat[];
  pageStatsLoading: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  authError: string | null;
  signInWithGoogle: (rememberMe?: boolean) => Promise<AuthResult>;
  registerMemberWithGoogle: (
    details: MemberRegistrationInput,
    rememberMe?: boolean
  ) => Promise<AuthResult>;
  updateUserProfile: (updates: UserProfileUpdateInput) => Promise<void>;
  signOutUser: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'cartKey'>) => void;
  updateCartQty: (cartKey: string, delta: number) => void;
  updateCartItemOptions: (
    cartKey: string,
    updates: { temperature?: TempOption; size?: DrinkSize }
  ) => void;
  removeFromCart: (cartKey: string) => void;
  clearCart: () => void;
  reorderFromHistory: (order: Order) => void;
  placeOrder: (input: PlaceOrderInput) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  seedDefaultMenu: () => Promise<void>;
  saveMenuItem: (item: MenuItem, isNew: boolean) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  updateFavoriteOrder: (orderId: string) => Promise<void>;
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

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const [bagOpen, setBagOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [pageStatsLoading, setPageStatsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const recordedSessionRef = useRef<Set<PageStatId>>(new Set());
  const registrationInProgressRef = useRef(false);

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthError(null);
    setAuthModalTab(tab);
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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setHasAdminDoc(false);
        setUserProfile(null);
        setOrders([]);
        setAdminOrders([]);
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

  // Authenticated User Profile + Admin check + Customer Orders listeners
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    const userDocRef = doc(db, 'users', user.uid);
    const adminDocRef = doc(db, 'admins', user.uid);

    // Check optional /admins/{uid} document
    getDoc(adminDocRef)
      .then((snap) => {
        if (!cancelled) setHasAdminDoc(snap.exists());
      })
      .catch(() => {
        if (!cancelled) setHasAdminDoc(false);
      });

    // Ensure user profile exists if verified (unless registerMemberWithGoogle is handling creation)
    const ensureProfile = async () => {
      if (registrationInProgressRef.current) return;
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists() && user.emailVerified && !registrationInProgressRef.current) {
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
            loyaltyPoints: 50,
            lifetimePoints: 50,
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
              data.preferredMilk === 'Oat Milk' ||
              data.preferredMilk === 'Almond Milk' ||
              data.preferredMilk === 'None'
                ? data.preferredMilk
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

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: String(data.orderNumber || ''),
            userId: String(data.userId || ''),
            customerName: String(data.customerName || ''),
            customerEmail: String(data.customerEmail || ''),
            pickupType: data.pickupType || 'counter',
            pickupTime: String(data.pickupTime || 'ASAP'),
            notes: String(data.notes || ''),
            items: Array.isArray(data.items) ? data.items : [],
            subtotalCents: Number(data.subtotalCents || 0),
            discountCents: Number(data.discountCents || 0),
            totalCents: Number(data.totalCents || 0),
            pointsEarned: Number(data.pointsEarned || 0),
            pointsRedeemed: Number(data.pointsRedeemed || 0),
            status: data.status || 'received',
            createdAtMs: timestampToMs(data.createdAt),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setOrders(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      cancelled = true;
      unsubProfile();
      unsubOrders();
    };
  }, [authReady, user]);

  // Admin All-Orders Barista Queue & Site Analytics listeners
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setAdminOrders([]);
      setPageStats([]);
      setPageStatsLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(
      q,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: String(data.orderNumber || ''),
            userId: String(data.userId || ''),
            customerName: String(data.customerName || ''),
            customerEmail: String(data.customerEmail || ''),
            pickupType: data.pickupType || 'counter',
            pickupTime: String(data.pickupTime || 'ASAP'),
            notes: String(data.notes || ''),
            items: Array.isArray(data.items) ? data.items : [],
            subtotalCents: Number(data.subtotalCents || 0),
            discountCents: Number(data.discountCents || 0),
            totalCents: Number(data.totalCents || 0),
            pointsEarned: Number(data.pointsEarned || 0),
            pointsRedeemed: Number(data.pointsRedeemed || 0),
            status: data.status || 'received',
            createdAtMs: timestampToMs(data.createdAt),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setAdminOrders(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

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
      unsubOrders();
      unsubStats();
    };
  }, [authReady, user, isAdmin]);

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
        // Already logged via handleFirestoreError; prevent unhandled rejection in background analytics
      }
    });
  }, []);

  // Record overall site visit & landing hero view once per session
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
    async (rememberMe = true): Promise<AuthResult> => {
      setAuthError(null);
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
        showToast(
          signedInAsAdmin
            ? 'Signed in as Mang Kape Administrator'
            : `Welcome back, ${loggedUser.displayName || 'Member'}`
        );
        return { ok: true, isAdmin: signedInAsAdmin };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to complete sign-in.';
        setAuthError(msg);
        return { ok: false, isAdmin: false };
      }
    },
    [showToast]
  );

  const registerMemberWithGoogle = useCallback(
    async (details: MemberRegistrationInput, rememberMe = true): Promise<AuthResult> => {
      setAuthError(null);
      registrationInProgressRef.current = true;
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        const cred = await signInWithPopup(auth, googleProvider);
        const loggedUser = cred.user;
        if (!loggedUser.emailVerified) {
          throw new Error('A verified Google account is required to register.');
        }

        const cleanName = (
          details.displayName.trim() ||
          loggedUser.displayName ||
          loggedUser.email?.split('@')[0] ||
          'Coffee Lover'
        ).slice(0, 80);
        const cleanEmail = (loggedUser.email || 'guest@mangkape.com').slice(0, 120);
        const cleanPhone = details.phone.trim().slice(0, 30);
        const cleanAddress = details.address.trim().slice(0, 160);

        const userDocRef = doc(db, 'users', loggedUser.uid);
        try {
          const existingSnap = await getDoc(userDocRef);
          if (!existingSnap.exists()) {
            await setDoc(userDocRef, {
              uid: loggedUser.uid,
              displayName: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              address: cleanAddress,
              preferredTemp: details.preferredTemp,
              preferredSize: details.preferredSize,
              preferredMilk: details.preferredMilk,
              loyaltyPoints: 50,
              lifetimePoints: 50,
              favoriteOrderId: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            showToast(`Welcome to Mang Kape, ${cleanName}! +50 welcome points added`);
          } else {
            await updateDoc(userDocRef, {
              displayName: cleanName,
              phone: cleanPhone,
              address: cleanAddress,
              preferredTemp: details.preferredTemp,
              preferredSize: details.preferredSize,
              preferredMilk: details.preferredMilk,
              updatedAt: serverTimestamp(),
            });
            showToast(`Existing account recognized · Updated profile for ${cleanName}`);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${loggedUser.uid}`);
        }

        let signedInAsAdmin = loggedUser.email === BOOTSTRAP_ADMIN_EMAIL;
        if (!signedInAsAdmin) {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', loggedUser.uid));
            signedInAsAdmin = adminSnap.exists();
          } catch {
            signedInAsAdmin = false;
          }
        }
        return { ok: true, isAdmin: signedInAsAdmin };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to register member.';
        setAuthError(msg);
        return { ok: false, isAdmin: false };
      } finally {
        registrationInProgressRef.current = false;
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

  const addToCart = useCallback(
    (item: Omit<CartItem, 'cartKey'>) => {
      const cartKey = `${item.menuItemId}_${item.size}_${item.milk}_${item.temperature}_${item.extraShot ? 'x' : 'std'}`;
      setCart((prev) => {
        const existingIdx = prev.findIndex((c) => c.cartKey === cartKey);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(20, updated[existingIdx].qty + item.qty);
          updated[existingIdx] = { ...updated[existingIdx], qty: nextQty };
          return updated;
        }
        if (prev.length >= 20) return prev;
        return [...prev, { ...item, cartKey }];
      });
      showToast(`Added ${item.name} (${item.temperature}, ${item.size}) to items`);
    },
    [showToast]
  );

  const updateCartQty = useCallback((cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartKey === cartKey ? { ...c, qty: Math.min(20, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  }, []);

  const updateCartItemOptions = useCallback(
    (cartKey: string, updates: { temperature?: TempOption; size?: DrinkSize }) => {
      setCart((prev) => {
        const targetIdx = prev.findIndex((c) => c.cartKey === cartKey);
        if (targetIdx < 0) return prev;
        const target = prev[targetIdx];
        const nextTemp = updates.temperature ?? target.temperature;
        const nextSize = updates.size ?? target.size;
        const oldUpcharge =
          target.size === '22 oz' ? 4500 : target.size === '16 oz' ? 2500 : 0;
        const newUpcharge =
          nextSize === '22 oz' ? 4500 : nextSize === '16 oz' ? 2500 : 0;
        const nextUnitPriceCents = Math.max(
          50,
          target.unitPriceCents - oldUpcharge + newUpcharge
        );
        const nextKey = `${target.menuItemId}_${nextSize}_${target.milk}_${nextTemp}_${
          target.extraShot ? 'x' : 'std'
        }`;

        const updatedItem: CartItem = {
          ...target,
          cartKey: nextKey,
          temperature: nextTemp,
          size: nextSize,
          unitPriceCents: nextUnitPriceCents,
        };

        const duplicateIdx = prev.findIndex(
          (c, idx) => idx !== targetIdx && c.cartKey === nextKey
        );
        if (duplicateIdx >= 0) {
          const merged = [...prev];
          merged[duplicateIdx] = {
            ...merged[duplicateIdx],
            qty: Math.min(20, merged[duplicateIdx].qty + target.qty),
          };
          return merged.filter((_, idx) => idx !== targetIdx);
        }

        const nextList = [...prev];
        nextList[targetIdx] = updatedItem;
        return nextList;
      });
    },
    []
  );

  const removeFromCart = useCallback((cartKey: string) => {
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const reorderFromHistory = useCallback(
    (order: Order) => {
      const nextItems: CartItem[] = order.items.slice(0, 20).map((line) => ({
        cartKey: `${line.id}_${line.size}_${line.milk}_${line.temperature}_${line.extraShot ? 'x' : 'std'}`,
        menuItemId: line.id,
        name: line.name,
        category: 'Perfectly Classic',
        imageKey: 'latte',
        size: line.size,
        milk: line.milk,
        temperature: line.temperature,
        extraShot: line.extraShot,
        qty: line.qty,
        unitPriceCents: line.unitPriceCents,
      }));
      setCart(nextItems);
      setBagOpen(true);
      showToast(`Loaded items from ${order.orderNumber}`);
    },
    [showToast]
  );

  const placeOrder = useCallback(
    async (input: PlaceOrderInput): Promise<Order | null> => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to place an order.');
      }
      if (cart.length === 0) {
        throw new Error('Your items list is empty.');
      }

      const subtotalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.qty, 0);
      const currentPoints = userProfile?.loyaltyPoints ?? 0;
      const canRedeem = input.redeemReward && currentPoints >= SHOP_DETAILS.rewardThresholdPts;
      const pointsRedeemed = canRedeem ? SHOP_DETAILS.rewardThresholdPts : 0;
      const discountCents = canRedeem
        ? Math.min(SHOP_DETAILS.rewardValueCents, subtotalCents)
        : 0;
      const totalCents = Math.max(0, subtotalCents - discountCents);
      const pointsEarned = Math.min(1000, Math.max(0, Math.round(totalCents / 500)));

      const orderId = sanitizeId(`ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
      const orderNumber = `MK-${String(Math.floor(1000 + Math.random() * 9000))}`;

      const lineItems: OrderLineItem[] = cart.slice(0, 20).map((c) => ({
        id: sanitizeId(c.menuItemId),
        name: c.name.slice(0, 80),
        size: c.size,
        milk: c.milk,
        temperature: c.temperature,
        extraShot: c.extraShot,
        qty: Math.min(20, Math.max(1, c.qty)),
        unitPriceCents: Math.min(500000, Math.max(50, c.unitPriceCents)),
      }));

      const customerName = (input.customerName.trim() || user.displayName || 'Guest').slice(0, 80);
      const customerEmail = (user.email || 'guest@mangkape.com').slice(0, 120);
      const notes = input.notes.trim().slice(0, 240);
      const pickupTime = input.pickupTime.slice(0, 40);

      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      const userRef = doc(db, 'users', user.uid);

      batch.set(orderRef, {
        orderNumber,
        userId: user.uid,
        customerName,
        customerEmail,
        pickupType: input.pickupType,
        pickupTime,
        notes,
        items: lineItems,
        subtotalCents,
        discountCents,
        totalCents,
        pointsEarned,
        pointsRedeemed,
        status: 'received',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const nextPoints = Math.min(100000, Math.max(0, currentPoints - pointsRedeemed + pointsEarned));
      const nextLifetime = Math.min(1000000, (userProfile?.lifetimePoints ?? 50) + pointsEarned);

      batch.update(userRef, {
        loyaltyPoints: nextPoints,
        lifetimePoints: nextLifetime,
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        setCart([]);
        setBagOpen(false);
        showToast(`Order ${orderNumber} sent to the espresso bar`);
        return {
          id: orderId,
          orderNumber,
          userId: user.uid,
          customerName,
          customerEmail,
          pickupType: input.pickupType,
          pickupTime,
          notes,
          items: lineItems,
          subtotalCents,
          discountCents,
          totalCents,
          pointsEarned,
          pointsRedeemed,
          status: 'received',
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
      }
    },
    [user, cart, userProfile, showToast]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!user) return;
      const orderRef = doc(db, 'orders', orderId);
      try {
        await updateDoc(orderRef, {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
        showToast('Order cancelled');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [user, showToast]
  );

  const advanceOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      if (!isAdmin) return;
      const orderRef = doc(db, 'orders', orderId);
      try {
        await updateDoc(orderRef, {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
        showToast(`Order updated to ${nextStatus}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [isAdmin, showToast]
  );

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
        // If menu hasn't been synced to Firestore yet (or only legacy docs exist), seed all default items in the same batch
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

  const updateFavoriteOrder = useCallback(
    async (orderId: string) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          favoriteOrderId: orderId.slice(0, 128),
          updatedAt: serverTimestamp(),
        });
        showToast('Pinned favorite order for quick reorder');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [user, showToast]
  );

  return (
    <ShopContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        userProfile,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        menuItems,
        isMenuSeeded,
        hasLegacyMenu,
        menuLoading,
        cart,
        bagOpen,
        setBagOpen,
        orders,
        adminOrders,
        pageStats,
        pageStatsLoading,
        toastMessage,
        showToast,
        authError,
        signInWithGoogle,
        registerMemberWithGoogle,
        updateUserProfile,
        signOutUser,
        addToCart,
        updateCartQty,
        updateCartItemOptions,
        removeFromCart,
        clearCart,
        reorderFromHistory,
        placeOrder,
        cancelOrder,
        advanceOrderStatus,
        seedDefaultMenu,
        saveMenuItem,
        deleteMenuItem,
        updateFavoriteOrder,
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
