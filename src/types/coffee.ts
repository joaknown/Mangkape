export type MenuCategory =
  | 'Perfectly Classic'
  | 'Redefined Creation'
  | 'Beyond Coffee'
  | 'Specialty Options'
  | 'Homegrown Signature'
  | 'Blended Drinks';

export type ImageKey = 'latte' | 'matcha' | 'coldbrew' | 'beans' | 'hero';

export type DrinkSize = '12 oz' | '16 oz' | '22 oz';

export type MilkOption =
  | 'Whole Milk'
  | 'Oat Milk (Oatside)'
  | 'Soy Milk (Kirkland)'
  | 'Low Fat Milk'
  | 'None';

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

export interface ItemStat {
  itemId: string;
  loveCount: number;
  ratingSum: number;
  ratingCount: number;
  updatedAtMs: number;
}

export interface MenuItemPopularity {
  loveCount: number;
  orderCount: number;
  totalInteractions: number;
  ratingAvg: number;
  ratingCount: number;
  isMostLoved: boolean;
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
