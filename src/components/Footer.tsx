import React from 'react';
import { SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { user, isAdmin, openAuthModal } = useShop();

  return (
    <footer className="bg-[#FAF9F6] py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#E6E2D8]">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3.5 mb-3">
              <img
                src={SHOP_DETAILS.logoUrl}
                alt="Mang Kape official logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-contain shrink-0 rounded-full bg-white border border-[#E6E2D8] p-0.5"
              />
              <div>
                <p className="font-display text-lg font-semibold text-[#181615] leading-tight">
                  {SHOP_DETAILS.name}
                </p>
                <p className="text-sm font-medium text-[#1B3B2B]">
                  {SHOP_DETAILS.tagline}.
                </p>
              </div>
            </div>
            <p className="text-sm text-[#4E4842] max-w-sm leading-relaxed">
              Specialty coffee house and pour-over bar in Roxas City, Capiz, Philippines.
            </p>
          </div>

          <div className="md:col-span-4 space-y-1 text-sm text-[#4E4842]">
            <p className="font-medium text-[#181615] mb-1.5">Hours &amp; Address</p>
            <p>{SHOP_DETAILS.addressLine}</p>
            <p className="font-mono-tabular text-xs">{SHOP_DETAILS.hoursDaily}</p>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2 text-sm text-[#4E4842]">
            <p className="font-medium text-[#181615] mb-0.5">Explore</p>
            {[
              { label: 'Holiday Treats', target: 'holiday-treats' },
              { label: 'Menu & Ordering', target: 'menu' },
              { label: 'Our Story', target: 'story' },
              { label: 'Orders & Rewards', target: 'orders' },
              { label: 'Location Map', target: 'location' },
            ].map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.target);
                }}
                className="hover:text-[#181615] transition-colors w-fit"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                } else {
                  onNavigate(isAdmin ? 'cms' : 'orders');
                }
              }}
              className="hover:text-[#181615] transition-colors w-fit text-left cursor-pointer"
            >
              {!user ? 'Login / Register' : isAdmin ? 'Store Manager' : 'My Account'}
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B645C]">
          <p>© {new Date().getFullYear()} {SHOP_DETAILS.name}. All rights reserved.</p>
          <p>
            Interactive location map integrates Google Maps features subject to the{' '}
            <a
              href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#181615]"
            >
              Google Maps End User Terms
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};
