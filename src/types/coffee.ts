export type MenuCategory =
  | 'Perfectly Classic'
  | 'Redefined Creation'
  | 'Beyond Coffee'
  | 'Specialty Options'
  | 'Homegrown Signature'
  | 'Blended Drinks';

export type ImageKey = 'latte' | 'matcha' | 'coldbrew' | 'beans' | 'hero';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PickupType = 'counter' | 'patio' | 'curbside';

export type DrinkSize = '12 oz' | '16 oz' | '22 oz';

export type MilkOption = 'Whole Milk' | 'Oat Milk' | 'Almond Milk' | 'None';

export type TempOption = 'Hot' | 'Iced';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  tastingNotes: string;
  priceCents: number;
  isSeasonal: boolean;
  inStock: boolean;
  featured: boolean;
  imageKey: ImageKey;
  imageUrl?: string;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  cartKey: string;
  menuItemId: string;
  name: string;
  category: MenuCategory;
  imageKey: ImageKey;
  size: DrinkSize;
  milk: MilkOption;
  temperature: TempOption;
  extraShot: boolean;
  qty: number;
  unitPriceCents: number;
}

export interface OrderLineItem {
  id: string;
  name: string;
  size: DrinkSize;
  milk: MilkOption;
  temperature: TempOption;
  extraShot: boolean;
  qty: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  pickupType: PickupType;
  pickupTime: string;
  notes: string;
  items: OrderLineItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  pointsEarned: number;
  pointsRedeemed: number;
  status: OrderStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  preferredTemp?: TempOption;
  preferredSize?: DrinkSize;
  preferredMilk?: MilkOption;
  loyaltyPoints: number;
  lifetimePoints: number;
  favoriteOrderId: string;
}

export type TrackedPageId =
  | 'home'
  | 'holiday-treats'
  | 'menu'
  | 'story'
  | 'orders'
  | 'location'
  | 'cms';

export type PageStatId = 'site-overview' | TrackedPageId;

export interface PageStat {
  pageId: PageStatId;
  views: number;
  uniqueVisitors: number;
  updatedAtMs: number;
}
