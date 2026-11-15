import React, { useState } from 'react';
import { ArrowDownRight, Maximize2, X } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';

interface HolidayTreat {
  id: string;
  name: string;
  subtitle: string;
  pairingNote: string;
  story: string;
  servingOptions: string;
  imageSrc: string;
  imageAlt: string;
}

const HOLIDAY_TREATS: HolidayTreat[] = [
  {
    id: 'silent-night',
    name: 'Silent Night',
    subtitle: 'Sweetness · Cinnamon Spice · Silky Cream Cheese',
    pairingNote: 'Inspired by the peaceful magic of Christmas Eve.',
    story:
      'Silent Night brings warmth and comfort in every sip—a gentle blend of sweetness and cinnamon spice topped with silky cream cheese for a quiet moment to slow down, savor, and enjoy the season.',
    servingOptions: 'Cream cheese & cinnamon dusted finish',
    imageSrc: '/assets/aistudio/silent_night_final_04f102b8.jpg',
    imageAlt: 'Silent Night seasonal drink by Mang Kape — cinnamon spiced coffee topped with silky cream cheese',
  },
  {
    id: 'queso-de-latte',
    name: 'Queso de Latte',
    subtitle: 'Queso Cheese · Cream Cheese · Espresso Latte',
    pairingNote: 'Sweet-savory festive comfort in every creamy sip.',
    story:
      'Combining “Queso”, the Spanish word for cheese, and “Latte”, a classic milk coffee, this seasonal treat pairs cheese, velvety cream cheese foam, and espresso into one rich and memorable festive cup.',
    servingOptions: 'Topped with grated queso & cream cheese foam',
    imageSrc: '/assets/aistudio/queso_de_latte_final_29395df6.jpg',
    imageAlt: 'Queso de Latte seasonal drink by Mang Kape — creamy latte topped with cheese and cream cheese foam',
  },
  {
    id: 'iced-shaken-jingle-tea',
    name: 'Iced Shaken Jingle Tea',
    subtitle: 'Mixed Berries · Black Teas · Shaken Over Ice',
    pairingNote: 'Bright, crisp, and cheerfully refreshing for sunny Capiz afternoons.',
    story:
      'A playful Christmas-inspired drink blending the sweetness of mixed berries and black teas with the cheerful spirit of holiday bells—shaken over ice for a cool, refreshing sip.',
    servingOptions: 'Served chilled · Shaken over ice',
    imageSrc: '/assets/aistudio/jingle_tea_final_8320a928.jpg',
    imageAlt: 'Iced Shaken Jingle Tea seasonal drink by Mang Kape — mixed berry and black tea shaken over ice',
  },
];

interface HolidayTreatsSectionProps {
  onExploreMenu: () => void;
  onVisitLocation: () => void;
}

export const HolidayTreatsSection: React.FC<HolidayTreatsSectionProps> = ({
  onExploreMenu,
  onVisitLocation,
}) => {
  const [selectedTreat, setSelectedTreat] = useState<HolidayTreat | null>(null);

  return (
    <section
      id="holiday-treats"
      aria-labelledby="holiday-treats-heading"
      className="py-14 lg:py-20 bg-[#F3F1EC] border-b border-[#E6E2D8]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Seasonal Drinks Highlight · Limited Holiday Release
            </p>
            <h2
              id="holiday-treats-heading"
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Holiday Treats
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4E4842] mt-2.5 max-w-2xl leading-relaxed">
              Festive pours crafted to celebrate the season at our Roxas City bar—layered cream cheese, warm cinnamon spice, savory queso, and brisk shaken berry black tea.
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreMenu}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-[#181615] bg-white hover:bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3B2B]"
          >
            <span>Browse Full Drink Menu</span>
            <ArrowDownRight className="w-4 h-4 text-[#1B3B2B]" />
          </button>
        </div>

        {/* 3-Column Seasonal Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {HOLIDAY_TREATS.map((treat) => (
            <article
              key={treat.id}
              className="group bg-white rounded-xl border border-[#E6E2D8] overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <button
                type="button"
                onClick={() => setSelectedTreat(treat)}
                className="relative aspect-[3/4] w-full bg-[#EFECE4] overflow-hidden block text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1B3B2B]"
                aria-label={`View full Holiday Treats feature card for ${treat.name}`}
              >
                <img
                  src={treat.imageSrc}
                  alt={treat.imageAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.015]"
                />
              </button>

              <div className="p-5 border-t border-[#E6E2D8] flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs text-[#6B645C] mb-1">
                    Holiday Treats · {treat.servingOptions}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[#181615] leading-snug">
                    {treat.name}
                  </h3>
                  <p className="text-xs font-medium text-[#1B3B2B] mt-1">{treat.subtitle}</p>
                  <p className="text-sm text-[#4E4842] leading-relaxed mt-2.5">
                    {treat.pairingNote}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EFECE4] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#6B645C]">Served in-store daily</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTreat(treat)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#1B3B2B]" />
                    <span>View Story</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Seasonal Poster & Tasting Modal */}
      {selectedTreat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="holiday-treat-modal-title"
          onClick={() => setSelectedTreat(null)}
        >
          <div
            className="w-full max-w-3xl bg-[#FAF9F6] rounded-xl border border-[#E6E2D8] shadow-xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E2D8]">
              <div>
                <p className="text-xs text-[#6B645C]">
                  Seasonal Highlight · Holiday Treats
                </p>
                <h3
                  id="holiday-treat-modal-title"
                  className="font-display text-xl font-semibold text-[#181615]"
                >
                  {selectedTreat.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTreat(null)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[#EFECE4] text-[#4E4842] cursor-pointer"
                aria-label="Close seasonal drink preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-6 aspect-[3/4] rounded-lg overflow-hidden border border-[#E6E2D8] bg-[#EFECE4]">
                <img
                  src={selectedTreat.imageSrc}
                  alt={selectedTreat.imageAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-[#1B3B2B] mb-1">Flavor Profile</p>
                    <p className="text-sm font-medium text-[#181615]">{selectedTreat.subtitle}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#6B645C] mb-1">Seasonal Note</p>
                    <p className="text-sm text-[#4E4842] leading-relaxed">{selectedTreat.story}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F3F1EC] border border-[#E6E2D8] space-y-1">
                    <p className="text-xs font-semibold text-[#181615]">Available at Mang Kape</p>
                    <p className="text-xs text-[#4E4842]">{SHOP_DETAILS.addressLine}</p>
                    <p className="text-xs font-mono-tabular text-[#6B645C]">
                      {SHOP_DETAILS.hoursDaily}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTreat(null);
                      onVisitLocation();
                    }}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Visit Us in Roxas City
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTreat(null);
                      onExploreMenu();
                    }}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#181615] bg-white hover:bg-[#EFECE4] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Explore Regular Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
