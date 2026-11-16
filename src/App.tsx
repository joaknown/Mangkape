/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountAndTrackingSection } from './components/AccountAndTrackingSection';
import { AuthModal } from './components/AuthModal';
import { CmsSection } from './components/CmsSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HolidayTreatsSection } from './components/HolidayTreatsSection';
import { LocationSection } from './components/LocationSection';
import { MenuSection } from './components/MenuSection';
import { Navbar } from './components/Navbar';
import { StorySection } from './components/StorySection';
import { ShopProvider, useShop } from './context/ShopContext';
import {
  getSectionPath,
  resolveSectionFromLocation,
  SECTION_TITLES,
} from './data/catalog';
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
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window === 'undefined') return 'top';
    return resolveSectionFromLocation(window.location.pathname, window.location.hash) || 'top';
  });

  const programmaticLockUntilRef = useRef<number>(0);
  const initialHandledRef = useRef<boolean>(false);
  const visibleRatiosRef = useRef<Record<string, number>>({});

  const syncBrowserUrl = useCallback((sectionId: string, mode: 'push' | 'replace') => {
    const nextPath = getSectionPath(sectionId);
    const nextTitle = SECTION_TITLES[sectionId] || SECTION_TITLES.top;
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }

    const currentUrl = `${window.location.pathname}${window.location.hash}`;
    if (currentUrl !== nextPath) {
      if (mode === 'push') {
        window.history.pushState({ sectionId }, '', nextPath);
      } else {
        window.history.replaceState({ sectionId }, '', nextPath);
      }
    }
  }, []);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // Scroll to matching section on initial load (e.g. direct visit to /our-story or /menu)
  useEffect(() => {
    if (initialHandledRef.current) return;
    const initialSection = resolveSectionFromLocation(
      window.location.pathname,
      window.location.hash
    );

    if (!initialSection) return;
    if (initialSection === 'cms' && !isAdmin) return;

    initialHandledRef.current = true;
    setActiveSection(initialSection);
    syncBrowserUrl(initialSection, 'replace');

    if (initialSection !== 'top') {
      const el = document.getElementById(initialSection);
      if (el) {
        programmaticLockUntilRef.current = Date.now() + 900;
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [isAdmin, syncBrowserUrl]);

  // Browser back / forward navigation support
  useEffect(() => {
    const handlePopState = () => {
      const targetSection =
        resolveSectionFromLocation(window.location.pathname, window.location.hash) || 'top';
      setActiveSection(targetSection);
      document.title = SECTION_TITLES[targetSection] || SECTION_TITLES.top;

      const pageId = SECTION_TO_PAGE_ID[targetSection];
      if (pageId) {
        trackPageView(pageId);
      }

      const el = document.getElementById(targetSection);
      if (el) {
        programmaticLockUntilRef.current = Date.now() + 900;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [trackPageView]);

  // Observe visible sections for analytics and manual-scroll URL syncing
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    visibleRatiosRef.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatiosRef.current[entry.target.id] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;

          if (entry.isIntersecting) {
            const pageId = SECTION_TO_PAGE_ID[entry.target.id];
            if (pageId) {
              trackPageView(pageId);
            }
          }
        });

        if (Date.now() < programmaticLockUntilRef.current) {
          return;
        }

        let bestSection: string | null = null;
        let bestRatio = 0;
        Object.entries(visibleRatiosRef.current).forEach(([id, ratio]) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestSection = id;
          }
        });

        if (bestSection && bestRatio >= 0.2) {
          setActiveSection(bestSection);
          syncBrowserUrl(bestSection, 'replace');
        }
      },
      { threshold: [0, 0.2, 0.4, 0.65] }
    );

    const sectionIds = Object.keys(SECTION_TO_PAGE_ID);
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [trackPageView, isAdmin, syncBrowserUrl]);

  const navigateTo = useCallback(
    (sectionId: string) => {
      const pageId = SECTION_TO_PAGE_ID[sectionId];
      if (pageId) {
        trackPageView(pageId);
      }

      setActiveSection(sectionId);
      syncBrowserUrl(sectionId, 'push');
      programmaticLockUntilRef.current = Date.now() + 950;

      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [trackPageView, syncBrowserUrl]
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

      <Navbar onNavigate={navigateTo} activeSection={activeSection} />

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
        <AccountAndTrackingSection onNavigate={navigateTo} />
        <LocationSection />
        <CmsSection />
      </main>

      <Footer onNavigate={navigateTo} />
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
