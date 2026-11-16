import drinkMapleCardamomLatte from '../assets/images/drink_maple_cardamom_latte_1794657965188.jpg';
import drinkCeremonialMatcha from '../assets/images/drink_ceremonial_matcha_1794657964422.jpg';
import drinkNitroColdBrew from '../assets/images/drink_nitro_cold_brew_1794657965762.jpg';
import storyRoasteryBeans from '../assets/images/story_roastery_beans_1794657967623.jpg';
import type {
  ImageKey,
  MenuCategory,
  MenuItem,
} from '../types/coffee';

export const SHOP_DETAILS = {
  name: 'Mang Kape',
  tagline: 'Brewing happiness, one cup at a time',
  logoUrl: '/assets/aistudio/logo_with_R_offcial_registered_1a2fe5ec.png',
  storyPdfUrl: '/assets/aistudio/Mang_Kape_-_A_Story_of_Humble_Beginnings_ebd25cbb.pdf',
  menuPdfUrl: '/assets/aistudio/Mang_Kape_Menu_f9a2ffa2.pdf',
  addressLine: 'Burgos, in front of Saint Mary’s Academy, Roxas City, Capiz',
  neighborhood: 'Specialty Espresso & Pour-Over Bar · Est. 2019',
  email: 'hello@mangkape.com',
  hoursDaily: 'Monday–Sunday · 9:00 AM – 9:00 PM',
  coordinates: { lat: 11.5853, lng: 122.7511 },
  loyaltyRateText: '1 pt per ₱5 · 150 pts = ₱150 Free Drink Credit',
  rewardThresholdPts: 150,
  rewardValueCents: 15000,
};

export const IMAGE_MAP: Record<ImageKey, string> = {
  hero: '/assets/aistudio/IMG_9330_Original_22273f4b.jpg',
  latte: drinkMapleCardamomLatte,
  matcha: drinkCeremonialMatcha,
  coldbrew: drinkNitroColdBrew,
  beans: storyRoasteryBeans,
};

export const MENU_CATEGORIES: MenuCategory[] = [
  'Perfectly Classic',
  'Redefined Creation',
  'Beyond Coffee',
  'Specialty Options',
  'Homegrown Signature',
  'Blended Drinks',
];

export const MENU_CATEGORY_META: Record<MenuCategory, { subtitle: string }> = {
  'Perfectly Classic': {
    subtitle: 'Timeless everyday espresso & milk pairings crafted to order',
  },
  'Redefined Creation': {
    subtitle: 'Elevated flavors, creamy oat blends, and bold citrus or sea salt twists',
  },
  'Beyond Coffee': {
    subtitle: 'Non-coffee and Japanese matcha favorites for any time of day',
  },
  'Specialty Options': {
    subtitle: 'Curated Collection · Exclusive for 12 oz cup size',
  },
  'Homegrown Signature': {
    subtitle: 'Mang Kape’s original house creations & local muscovado blends',
  },
  'Blended Drinks': {
    subtitle: 'Ice-blended coffee and creamy caffeine-free frappes',
  },
};

export const BASE_ITEM_POPULARITY: Record<
  string,
  { loves: number; orders: number; ratingAvg: number; ratingCount: number }
> = {
  'classic-americano': { loves: 94, orders: 185, ratingAvg: 4.8, ratingCount: 42 },
  'classic-flat-white': { loves: 82, orders: 140, ratingAvg: 4.8, ratingCount: 31 },
  'classic-spanish-latte': { loves: 268, orders: 540, ratingAvg: 4.9, ratingCount: 118 },
  'classic-caramel-macchiato': { loves: 192, orders: 390, ratingAvg: 4.9, ratingCount: 84 },
  'classic-mocha-latte': { loves: 116, orders: 215, ratingAvg: 4.8, ratingCount: 47 },

  'redefined-vietnamese-oat': { loves: 148, orders: 270, ratingAvg: 4.9, ratingCount: 59 },
  'redefined-dark-oat-latte': { loves: 132, orders: 224, ratingAvg: 4.8, ratingCount: 51 },
  'redefined-crunchy-biscoff-oat': { loves: 284, orders: 512, ratingAvg: 5.0, ratingCount: 126 },
  'redefined-himalayan-salt-cream': { loves: 245, orders: 468, ratingAvg: 4.9, ratingCount: 109 },
  'redefined-orange-americano': { loves: 121, orders: 198, ratingAvg: 4.8, ratingCount: 44 },
  'redefined-dirty-matcha': { loves: 236, orders: 430, ratingAvg: 4.9, ratingCount: 96 },

  'beyond-chocolate-milk': { loves: 88, orders: 164, ratingAvg: 4.7, ratingCount: 36 },
  'beyond-strawberry-milk': { loves: 105, orders: 192, ratingAvg: 4.8, ratingCount: 43 },
  'beyond-matcha-latte': { loves: 142, orders: 268, ratingAvg: 4.8, ratingCount: 62 },
  'beyond-strawberry-matcha': { loves: 228, orders: 418, ratingAvg: 4.9, ratingCount: 94 },

  'specialty-droplets': { loves: 214, orders: 386, ratingAvg: 4.9, ratingCount: 88 },
  'specialty-filter-coffee': { loves: 96, orders: 152, ratingAvg: 4.8, ratingCount: 34 },
  'specialty-on-the-rocks': { loves: 78, orders: 138, ratingAvg: 4.7, ratingCount: 29 },
  'specialty-cup-of-joe': { loves: 164, orders: 295, ratingAvg: 4.9, ratingCount: 68 },
  'specialty-green-reverie': { loves: 219, orders: 392, ratingAvg: 5.0, ratingCount: 91 },

  'signature-baristas-choice': { loves: 256, orders: 488, ratingAvg: 5.0, ratingCount: 114 },
  'signature-doppio-freddo': { loves: 138, orders: 245, ratingAvg: 4.8, ratingCount: 54 },
  'signature-sugaroast': { loves: 176, orders: 334, ratingAvg: 4.9, ratingCount: 74 },
  'signature-beanilla': { loves: 144, orders: 262, ratingAvg: 4.8, ratingCount: 58 },

  'blended-biscoff-oat-cream': { loves: 232, orders: 415, ratingAvg: 4.9, ratingCount: 98 },
  'blended-java-chip': { loves: 154, orders: 290, ratingAvg: 4.8, ratingCount: 65 },
  'blended-caramel': { loves: 146, orders: 278, ratingAvg: 4.8, ratingCount: 61 },
  'blended-dark-mocha': { loves: 128, orders: 232, ratingAvg: 4.8, ratingCount: 52 },
  'blended-strawberry-cream': { loves: 118, orders: 210, ratingAvg: 4.8, ratingCount: 46 },
  'blended-chocolate-chip': { loves: 109, orders: 196, ratingAvg: 4.7, ratingCount: 40 },
  'blended-matcha-cream': { loves: 136, orders: 248, ratingAvg: 4.8, ratingCount: 55 },
};

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // 1. Perfectly Classic
  {
    id: 'classic-americano',
    name: 'Americano',
    category: 'Perfectly Classic',
    description:
      'Double shot of freshly pulled house espresso lengthened with hot or chilled purified water.',
    tastingNotes: 'Clean crema · Roasted cacao · Crisp finish',
    priceCents: 12500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 1,
  },
  {
    id: 'classic-flat-white',
    name: 'Flat White',
    category: 'Perfectly Classic',
    description:
      'Velvety microfoam folded cleanly over a balanced double espresso for a rich, silky cup.',
    tastingNotes: 'Toasted hazelnut · Milk chocolate · Silky body',
    priceCents: 14500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 2,
  },
  {
    id: 'classic-spanish-latte',
    name: 'Spanish Latte',
    category: 'Perfectly Classic',
    description:
      'Bold espresso layered with sweetened condensed milk and fresh steamed or iced milk.',
    tastingNotes: 'Caramelized milk · Rich espresso · Creamy sweetness',
    priceCents: 14500,
    isSeasonal: false,
    inStock: true,
    featured: true,
    imageKey: 'latte',
    sortOrder: 3,
  },
  {
    id: 'classic-caramel-macchiato',
    name: 'Caramel Macc. (Salted / Classic)',
    category: 'Perfectly Classic',
    description:
      'Espresso poured over textured milk and finished with your choice of classic or salted caramel drizzle.',
    tastingNotes: 'Buttery caramel · Espresso crema · Sweet-savory finish',
    priceCents: 15000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 4,
  },
  {
    id: 'classic-mocha-latte',
    name: 'Mocha Latte (White / Dark)',
    category: 'Perfectly Classic',
    description:
      'House espresso blended with your choice of rich dark cacao or creamy white chocolate and milk.',
    tastingNotes: 'White or dark chocolate · Espresso · Velvety texture',
    priceCents: 15000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 5,
  },

  // 2. Redefined Creation
  {
    id: 'redefined-vietnamese-oat',
    name: 'Vietnamese Oat / Classic',
    category: 'Redefined Creation',
    description:
      'Bold coffee extraction sweetened traditionally with condensed milk or prepared creamy with oat milk.',
    tastingNotes: 'Bold roast · Sweet cream or oat · Smooth kick',
    priceCents: 14500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 6,
  },
  {
    id: 'redefined-dark-oat-latte',
    name: 'Dark Oat Latte',
    category: 'Redefined Creation',
    description:
      'Deep dark chocolate sauce melted into double espresso and silky steamed or iced oat milk.',
    tastingNotes: 'Dark cacao · Creamy oat · Balanced roast',
    priceCents: 17500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 7,
  },
  {
    id: 'redefined-crunchy-biscoff-oat',
    name: 'Crunchy Biscoff Oat',
    category: 'Redefined Creation',
    description:
      'Spiced speculoos cookie butter swirled with espresso, oat milk, and crunchy Biscoff biscuit crumble.',
    tastingNotes: 'Spiced caramel biscuit · Oat milk · Crunchy topping',
    priceCents: 19500,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'latte',
    sortOrder: 8,
  },
  {
    id: 'redefined-himalayan-salt-cream',
    name: 'Himalayan Salt Cream',
    category: 'Redefined Creation',
    description:
      'Rich espresso topped with a thick, lightly salted pink Himalayan cream cap for sweet-savory contrast.',
    tastingNotes: 'Himalayan sea salt · Whipped cream cap · Deep espresso',
    priceCents: 18500,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'coldbrew',
    sortOrder: 9,
  },
  {
    id: 'redefined-orange-americano',
    name: 'Orange Americano',
    category: 'Redefined Creation',
    description:
      'Bright citrus orange layered beneath chilled espresso for a crisp, aromatic, refreshing brew.',
    tastingNotes: 'Zesty orange · Bright acidity · Crisp finish',
    priceCents: 16000,
    isSeasonal: true,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 10,
  },
  {
    id: 'redefined-dirty-matcha',
    name: 'Dirty Matcha',
    category: 'Redefined Creation',
    description:
      'Hand-whisked Japanese matcha layered with milk and crowned with a freshly pulled shot of espresso.',
    tastingNotes: 'Earthy matcha · Roasted espresso · Creamy milk',
    priceCents: 16500,
    isSeasonal: false,
    inStock: true,
    featured: true,
    imageKey: 'matcha',
    sortOrder: 11,
  },

  // 3. Beyond Coffee
  {
    id: 'beyond-chocolate-milk',
    name: 'Chocolate Milk',
    category: 'Beyond Coffee',
    description:
      'Caffeine-free comfort crafted with rich cocoa and creamy steamed or chilled milk.',
    tastingNotes: 'Smooth cocoa · Creamy milk · Classic comfort',
    priceCents: 12500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 12,
  },
  {
    id: 'beyond-strawberry-milk',
    name: 'Strawberry Milk',
    category: 'Beyond Coffee',
    description:
      'Sweet berry compote swirled into chilled fresh milk for a fruity, refreshing non-coffee favorite.',
    tastingNotes: 'Ripe strawberry · Fresh milk · Light sweetness',
    priceCents: 12000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 13,
  },
  {
    id: 'beyond-matcha-latte',
    name: 'Matcha Latte',
    category: 'Beyond Coffee',
    description:
      'Smooth, whisked Japanese green tea poured over your choice of steamed or iced milk.',
    tastingNotes: 'Umami green tea · Creamy milk · Clean finish',
    priceCents: 13500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'matcha',
    sortOrder: 14,
  },
  {
    id: 'beyond-strawberry-matcha',
    name: 'Strawberry Matcha',
    category: 'Beyond Coffee',
    description:
      'Layered strawberry purée, fresh milk, and hand-whisked matcha for a vibrant sweet-earthy blend.',
    tastingNotes: 'Sweet berry · Whisked matcha · Creamy layers',
    priceCents: 16000,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'matcha',
    sortOrder: 15,
  },

  // 4. Specialty Options (Curated Collection · Exclusive for 12oz cup size)
  {
    id: 'specialty-droplets',
    name: 'Droplets',
    category: 'Specialty Options',
    description:
      'Milk + bean syrup + sauce + espresso. Exclusive curated collection served in a 12 oz cup.',
    tastingNotes: 'Bean syrup · Signature sauce · Milk & espresso',
    priceCents: 16000,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'coldbrew',
    sortOrder: 16,
  },
  {
    id: 'specialty-filter-coffee',
    name: 'Filter Coffee',
    category: 'Specialty Options',
    description:
      'Choose among available specialty coffee origins, hand-brewed to highlight clarity and terroir. Served in 12 oz.',
    tastingNotes: 'Single-origin pour-over · Clean clarity · Terroir driven',
    priceCents: 15000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'beans',
    sortOrder: 17,
  },
  {
    id: 'specialty-on-the-rocks',
    name: 'On the Rocks',
    category: 'Specialty Options',
    description:
      'Espresso over ice. Pure, chilled extraction showcasing crema and roast character in a 12 oz cup.',
    tastingNotes: 'Pure chilled espresso · Crisp ice · Bold aroma',
    priceCents: 12000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 18,
  },
  {
    id: 'specialty-cup-of-joe',
    name: 'Cup of Joe',
    category: 'Specialty Options',
    description:
      'Espresso + milk + foam + burnt sugar. Torched caramelized finish exclusive to our 12 oz curated line.',
    tastingNotes: 'Burnt sugar crust · Silky foam · Espresso & milk',
    priceCents: 16000,
    isSeasonal: true,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 19,
  },
  {
    id: 'specialty-green-reverie',
    name: 'Green Reverie (Latte / Mousse)',
    category: 'Specialty Options',
    description:
      'Authentic ceremonial matcha from Japan, prepared as a velvety latte or topped with matcha mousse in 12 oz.',
    tastingNotes: 'Japanese ceremonial matcha · Silky mousse or latte',
    priceCents: 18000,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'matcha',
    sortOrder: 20,
  },

  // 5. Homegrown Signature
  {
    id: 'signature-baristas-choice',
    name: 'Barista’s Choice',
    category: 'Homegrown Signature',
    description:
      'Oat milk, espresso, white, and golden sauce — Mang Kape’s signature creamy house creation.',
    tastingNotes: 'Oat milk · White & golden sauce · Balanced espresso',
    priceCents: 17500,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'latte',
    sortOrder: 21,
  },
  {
    id: 'signature-doppio-freddo',
    name: 'Doppio Freddo',
    category: 'Homegrown Signature',
    description:
      'Milk, espresso, white sauce, and golden sauce shaken chilled for a bold yet silky sip.',
    tastingNotes: 'Chilled doppio · White & golden sauce · Smooth dairy',
    priceCents: 16500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 22,
  },
  {
    id: 'signature-sugaroast',
    name: 'Sugaroast',
    category: 'Homegrown Signature',
    description:
      'Oat milk, espresso, and rich local muscovado sugar celebrating warm caramel notes.',
    tastingNotes: 'Local muscovado · Creamy oat milk · Roasted espresso',
    priceCents: 17000,
    isSeasonal: true,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 23,
  },
  {
    id: 'signature-beanilla',
    name: 'Beanilla',
    category: 'Homegrown Signature',
    description:
      'Oat milk, full cream milk, espresso, and fragrant house bean syrup crafted for smooth sweetness.',
    tastingNotes: 'Bean syrup · Oat & full cream · Smooth espresso',
    priceCents: 16500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'latte',
    sortOrder: 24,
  },

  // 6. Blended Drinks
  {
    id: 'blended-biscoff-oat-cream',
    name: 'Biscoff Oat Cream',
    category: 'Blended Drinks',
    description:
      'Ice-blended oat cream swirled with spiced Biscoff cookie butter and crunchy biscuit crumble.',
    tastingNotes: 'Blended oat cream · Speculoos butter · Cookie crunch',
    priceCents: 22000,
    isSeasonal: true,
    inStock: true,
    featured: true,
    imageKey: 'coldbrew',
    sortOrder: 25,
  },
  {
    id: 'blended-java-chip',
    name: 'Java Chip',
    category: 'Blended Drinks',
    description:
      'Espresso and rich chocolate chips blended smooth over ice for a classic coffee crunch.',
    tastingNotes: 'Chocolate chips · Blended espresso · Creamy frost',
    priceCents: 17500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 26,
  },
  {
    id: 'blended-caramel',
    name: 'Caramel (Classic / Salted)',
    category: 'Blended Drinks',
    description:
      'Smooth ice-blended coffee layered with your choice of classic or salted caramel ribbon.',
    tastingNotes: 'Classic or salted caramel · Blended coffee · Creamy swirl',
    priceCents: 17500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 27,
  },
  {
    id: 'blended-dark-mocha',
    name: 'Dark Mocha',
    category: 'Blended Drinks',
    description:
      'Deep dark chocolate blended with house espresso and ice for a bittersweet frozen treat.',
    tastingNotes: 'Dark cacao · Espresso · Velvety ice blend',
    priceCents: 17500,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 28,
  },
  {
    id: 'blended-strawberry-cream',
    name: 'Strawberry Cream',
    category: 'Blended Drinks',
    description:
      'Caffeine-free strawberry milk cream blended icy smooth for a sweet berry refresher.',
    tastingNotes: 'Sweet strawberry · Chilled cream · Caffeine-free',
    priceCents: 16000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 29,
  },
  {
    id: 'blended-chocolate-chip',
    name: 'Chocolate Chip',
    category: 'Blended Drinks',
    description:
      'Caffeine-free chocolate milk blended with crunchy dark chocolate chips over ice.',
    tastingNotes: 'Cocoa cream · Chocolate chips · Caffeine-free',
    priceCents: 16000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'coldbrew',
    sortOrder: 30,
  },
  {
    id: 'blended-matcha-cream',
    name: 'Matcha Cream',
    category: 'Blended Drinks',
    description:
      'Japanese matcha whisked and ice-blended with creamy milk for a smooth, cool green tea frost.',
    tastingNotes: 'Matcha green tea · Blended cream · Cool finish',
    priceCents: 16000,
    isSeasonal: false,
    inStock: true,
    featured: false,
    imageKey: 'matcha',
    sortOrder: 31,
  },
];

export const TRACKED_PAGES: {
  id: 'home' | 'holiday-treats' | 'menu' | 'story' | 'orders' | 'location' | 'cms';
  label: string;
  route: string;
  description: string;
}[] = [
  {
    id: 'home',
    label: 'Home & Cover',
    route: '#top',
    description: 'Storefront hero, opening hours, and mission intro',
  },
  {
    id: 'holiday-treats',
    label: 'Holiday Treats',
    route: '#holiday-treats',
    description: 'Seasonal drinks highlight showcase',
  },
  {
    id: 'menu',
    label: 'Drinks Menu',
    route: '#menu',
    description: '6-category handcrafted menu with customer star ratings & favorites',
  },
  {
    id: 'story',
    label: 'Our Story',
    route: '#story',
    description: 'Humble beginnings narrative & throwback gallery',
  },
  {
    id: 'orders',
    label: 'Member Account',
    route: '#orders',
    description: 'Customer profile, loved drinks & loyalty perks',
  },
  {
    id: 'location',
    label: 'Location & Map',
    route: '#location',
    description: 'Roxas City address, store hours & Google Map',
  },
  {
    id: 'cms',
    label: 'Store Manager',
    route: '#cms',
    description: 'Admin menu editor, photo manager & traffic console',
  },
];

export function formatCents(cents: number): string {
  const safeCents = Number.isFinite(cents) ? cents : 0;
  return `₱${(safeCents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
