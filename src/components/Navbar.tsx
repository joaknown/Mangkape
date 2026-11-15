import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

const BASE_NAV_LINKS = [
  { label: 'Menu', target: 'menu' },
  { label: 'Our Story', target: 'story' },
  { label: 'Track & Rewards', target: 'orders' },
  { label: 'Location', target: 'location' },
];

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { cart, setBagOpen, user, isAdmin, openAuthModal } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleLinkClick = (target: string) => {
    setMobileMenuOpen(false);
    onNavigate(target);
  };

  const handleAccountNavClick = () => {
    setMobileMenuOpen(false);
    if (!user) {
      openAuthModal('login');
      return;
    }
    onNavigate(isAdmin ? 'cms' : 'orders');
  };

  const accountNavLabel = !user ? 'Login' : isAdmin ? 'Store Manager' : 'My Account';
  const accountNavHref = !user ? '#orders' : isAdmin ? '#cms' : '#orders';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (single line, no descriptor/badge) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('top');
          }}
          className="inline-flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-[#181615] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B3B2B]"
        >
          <img
            src={SHOP_DETAILS.logoUrl}
            alt="Mang Kape official logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 object-contain shrink-0 rounded-full bg-white"
          />
          <span>Mang Kape</span>
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4E4842]">
          {BASE_NAV_LINKS.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.target);
              }}
              className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-[#181615] hover:border-[#181615] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B3B2B]"
            >
              {link.label}
            </a>
          ))}
          <a
            href={accountNavHref}
            onClick={(e) => {
              e.preventDefault();
              handleAccountNavClick();
            }}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-[#181615] hover:border-[#181615] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B3B2B]"
          >
            {accountNavLabel}
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setBagOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3B2B]"
            aria-label={`Open items list with ${itemCount} items`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Items</span>
            <span className="font-mono-tabular text-xs opacity-90">({itemCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#181615] hover:bg-[#EFECE4] transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#E6E2D8] bg-[#FAF9F6] px-4 py-3 flex flex-col gap-1"
        >
          {BASE_NAV_LINKS.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.target);
              }}
              className="px-3 py-3 min-h-[44px] flex items-center text-sm font-medium text-[#181615] rounded-lg hover:bg-[#EFECE4] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href={accountNavHref}
            onClick={(e) => {
              e.preventDefault();
              handleAccountNavClick();
            }}
            className="px-3 py-3 min-h-[44px] flex items-center text-sm font-medium text-[#181615] rounded-lg hover:bg-[#EFECE4] transition-colors"
          >
            {accountNavLabel}
          </a>
        </nav>
      )}
    </header>
  );
};
