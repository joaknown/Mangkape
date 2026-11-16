import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onVisitLocation: () => void;
  onOpenAccount: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMenu,
  onVisitLocation,
  onOpenAccount,
}) => {
  const { user, userProfile, openAuthModal } = useShop();

  return (
    <section id="top" className="border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* 2-Column Editorial Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#4E4842] mb-4">
                Mang Kape · Roxas City, Capiz
              </p>
              <h1
                className="font-display font-semibold text-[#181615] tracking-tight leading-[1.08] mb-5 max-w-xl"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', textWrap: 'balance' }}
              >
                {SHOP_DETAILS.tagline}.
              </h1>
              <p className="text-[16px] leading-[1.65] text-[#4E4842] max-w-[56ch] mb-8">
                To deliver an excellent coffee experience through constant growth and innovation, fostering an unyielding commitment to the quality and sustainable coffee community.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onExploreMenu}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3B2B]"
                >
                  <span>View Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onVisitLocation}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3B2B]"
                >
                  <MapPin className="w-4 h-4 text-[#1B3B2B]" />
                  <span>Find Coffee Shop</span>
                </button>
              </div>
            </div>

            {/* Returning Member Recognition Strip */}
            <div className="mt-10 pt-6 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-4">
              {user ? (
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                  <div>
                    <p className="text-xs text-[#4E4842]">Welcome back</p>
                    <p className="text-sm font-semibold text-[#181615]">
                      {userProfile?.displayName || user.displayName || user.email}
                      <span className="mx-2 text-[#B8B0A2]">·</span>
                      <span className="font-mono-tabular text-[#1B3B2B]">
                        {userProfile?.loyaltyPoints ?? 0} pts
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAccount}
                    className="text-sm font-medium text-[#1B3B2B] underline underline-offset-4 hover:text-[#142D20] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    My Account &amp; Rewards
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                  <p className="text-sm text-[#4E4842]">
                    Earn 1 pt per ₱5 spent and unlock a complimentary ₱150.00 drink credit at 150 pts.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-sm font-semibold text-[#1B3B2B] underline underline-offset-4 hover:text-[#142D20] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Login / Register
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full lg:min-h-[440px] rounded-xl overflow-hidden border border-[#E6E2D8] bg-[#F3F1EC]">
              <ResilientImage
                imageKey="hero"
                alt="Mang Kape espresso and pour-over bar in Roxas City, Capiz"
                label="Mang Kape · Roxas City, Capiz"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>

        {/* 4-Column Storefront Info Strip below hero split */}
        <div className="mt-10 pt-8 border-t border-[#E6E2D8] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-[#4E4842] mb-1">Daily Hours</p>
            <p className="text-sm font-medium text-[#181615] font-mono-tabular">
              {SHOP_DETAILS.hoursDaily}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4E4842] mb-1">Coffee Shop Location</p>
            <p className="text-sm font-medium text-[#181615]">{SHOP_DETAILS.addressLine}</p>
          </div>
          <div>
            <p className="text-xs text-[#4E4842] mb-1">In-Store Service</p>
            <p className="text-sm font-medium text-[#181615]">
              Mang Kape Shop · Dine-In &amp; Counter
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4E4842] mb-1">Member Rewards</p>
            <p className="text-sm font-medium text-[#181615] font-mono-tabular">
              {SHOP_DETAILS.loyaltyRateText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
