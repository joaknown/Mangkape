import React, { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatCents } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { DrinkSize, MenuItem, MilkOption, TempOption } from '../types/coffee';
import { ResilientImage } from './ResilientImage';

interface CustomizeModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({ item, onClose }) => {
  const { addToCart, userProfile } = useShop();

  const isExclusive12Oz = item?.category === 'Specialty Options';
  const isBlended = item?.category === 'Blended Drinks';
  const isBlackCoffee =
    item?.id === 'classic-americano' ||
    item?.id === 'redefined-orange-americano' ||
    item?.id === 'specialty-filter-coffee' ||
    item?.id === 'specialty-on-the-rocks';
  const isIcedDefault =
    isBlended ||
    item?.id === 'redefined-orange-americano' ||
    item?.id === 'specialty-on-the-rocks';

  const [size, setSize] = useState<DrinkSize>(
    isExclusive12Oz ? '12 oz' : userProfile?.preferredSize || '12 oz'
  );
  const [milk, setMilk] = useState<MilkOption>(
    isBlackCoffee ? 'None' : userProfile?.preferredMilk || 'Whole Milk'
  );
  const [temperature, setTemperature] = useState<TempOption>(
    isIcedDefault ? 'Iced' : userProfile?.preferredTemp || 'Hot'
  );
  const [extraShot, setExtraShot] = useState(false);
  const [qty, setQty] = useState(1);

  if (!item) return null;

  const sizeUpcharge = size === '22 oz' ? 4500 : size === '16 oz' ? 2500 : 0;
  const milkUpcharge = milk === 'Oat Milk' || milk === 'Almond Milk' ? 2500 : 0;
  const shotUpcharge = extraShot ? 3500 : 0;
  const unitPriceCents = item.priceCents + sizeUpcharge + milkUpcharge + shotUpcharge;

  const handleConfirm = () => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      imageKey: item.imageKey,
      size,
      milk,
      temperature,
      extraShot,
      qty,
      unitPriceCents,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-modal-title"
    >
      <div className="w-full max-w-lg bg-[#FAF9F6] rounded-xl border border-[#E6E2D8] shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E2D8]">
          <div>
            <p className="text-xs text-[#4E4842]">
              {item.category}
              {item.isSeasonal ? ' · Seasonal' : ''}
            </p>
            <h3 id="customize-modal-title" className="font-display text-xl font-semibold text-[#181615]">
              {item.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[#EFECE4] text-[#4E4842] cursor-pointer"
            aria-label="Close item customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#F3F1EC] border border-[#E6E2D8]">
            <ResilientImage
              imageKey={item.imageKey}
              customSrc={item.imageUrl}
              alt={item.name}
              label={item.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div>
            <p className="text-sm text-[#4E4842] leading-relaxed">{item.description}</p>
            {item.tastingNotes && (
              <p className="mt-2 text-xs text-[#6B645C]">{item.tastingNotes}</p>
            )}
          </div>

          <>
            {/* Temperature */}
            <div>
              <p className="text-xs font-semibold text-[#181615] mb-2">Temperature</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Hot', 'Iced'] as TempOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTemperature(opt)}
                    className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      temperature === opt
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                        : 'bg-white text-[#181615] border-[#DFD9CC] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cup Size */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-xs font-semibold text-[#181615]">Cup Size</p>
                {isExclusive12Oz && (
                  <span className="text-[11px] text-[#6B645C]">
                    Curated 12 oz default
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['12 oz', '16 oz', '22 oz'] as DrinkSize[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSize(opt)}
                    className={`px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      size === opt
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                        : 'bg-white text-[#181615] border-[#DFD9CC] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    <span className="block">{opt}</span>
                    {opt === '16 oz' && (
                      <span className="block text-[11px] font-mono-tabular opacity-85">
                        +₱25.00
                      </span>
                    )}
                    {opt === '22 oz' && (
                      <span className="block text-[11px] font-mono-tabular opacity-85">
                        +₱45.00
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Milk */}
            <div>
              <p className="text-xs font-semibold text-[#181615] mb-2">Milk Choice</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Whole Milk', 'Oat Milk', 'Almond Milk', 'None'] as MilkOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMilk(opt)}
                    className={`px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      milk === opt
                        ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                        : 'bg-white text-[#181615] border-[#DFD9CC] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    {opt} {opt === 'Oat Milk' || opt === 'Almond Milk' ? '(+₱25.00)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Espresso Shot */}
            <label className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-[#DFD9CC] cursor-pointer">
              <div>
                <span className="text-sm font-medium text-[#181615]">Add Extra Espresso Shot</span>
                <span className="block text-xs text-[#6B645C]">Double ristretto boost</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono-tabular text-[#4E4842]">+₱35.00</span>
                <input
                  type="checkbox"
                  checked={extraShot}
                  onChange={(e) => setExtraShot(e.target.checked)}
                  className="w-5 h-5 accent-[#1B3B2B] cursor-pointer"
                />
              </div>
            </label>
          </>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-[#E6E2D8] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center border border-[#DFD9CC] rounded-lg">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 inline-flex items-center justify-center text-[#181615] hover:bg-[#F3F1EC] cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-mono-tabular font-medium">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="w-10 h-10 inline-flex items-center justify-center text-[#181615] hover:bg-[#F3F1EC] cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Add to Cart · <span className="font-mono-tabular">{formatCents(unitPriceCents * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
