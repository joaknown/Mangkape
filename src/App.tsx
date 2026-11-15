/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AccountAndTrackingSection } from './components/AccountAndTrackingSection';
import { AuthModal } from './components/AuthModal';
import { BagDrawer } from './components/BagDrawer';
import { CmsSection } from './components/CmsSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HolidayTreatsSection } from './components/HolidayTreatsSection';
import { LocationSection } from './components/LocationSection';
import { MenuSection } from './components/MenuSection';
import { Navbar } from './components/Navbar';
import { StorySection } from './components/StorySection';
import { ShopProvider, useShop } from './context/ShopContext';
import type { TrackedPageId } from './types/coffee';

const SECTION_TO_PAGE_ID: Record<string, TrackedPageId> = {
  top: 'home',
  'holiday-treats': 'holiday-treats',
  menu: 'menu',
  story: 'story',
  orders: 'orders',
  location: 'location',
  cms: 'cms',
};

const ToastBanner: React.FC = () => {
  const { toastMessage } = useShop();
  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg bg-[#181615] text-white text-sm font-medium shadow-lg border border-white/10 max-w-sm"
    >
      {toastMessage}
    </div>
  );
};

const StorefrontContent: React.FC = () => {
  const { trackPageView, isAdmin } = useShop();
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageId = SECTION_TO_PAGE_ID[entry.target.id];
            if (pageId) {
              trackPageView(pageId);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    const sectionIds = Object.keys(SECTION_TO_PAGE_ID);
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [trackPageView, isAdmin]);

  const navigateTo = useCallback(
    (sectionId: string) => {
      const pageId = SECTION_TO_PAGE_ID[sectionId];
      if (pageId) {
        trackPageView(pageId);
      }
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [trackPageView]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#181615]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar onNavigate={navigateTo} />

      <main className="flex-1">
        <HeroSection
          onExploreMenu={() => navigateTo('menu')}
          onVisitLocation={() => navigateTo('location')}
          onOpenAccount={() => navigateTo('orders')}
        />
        <HolidayTreatsSection
          onExploreMenu={() => navigateTo('menu')}
          onVisitLocation={() => navigateTo('location')}
        />
        <MenuSection />
        <StorySection />
        <AccountAndTrackingSection />
        <LocationSection />
        <CmsSection />
      </main>

      <Footer onNavigate={navigateTo} />
      <BagDrawer onOrderPlaced={() => navigateTo('orders')} />
      <AuthModal onAuthSuccess={(asAdmin) => navigateTo(asAdmin ? 'cms' : 'orders')} />
      <ToastBanner />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <StorefrontContent />
    </ShopProvider>
  );
}
