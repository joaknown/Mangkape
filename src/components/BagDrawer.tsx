import React, { useEffect, useState } from 'react';
import { Award, MapPin, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCents, SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { DrinkSize, TempOption } from '../types/coffee';

interface BagDrawerProps {
  onOrderPlaced: () => void;
}

export const BagDrawer: React.FC<BagDrawerProps> = ({ onOrderPlaced }) => {
  const {
    user,
    userProfile,
    cart,
    bagOpen,
    setBagOpen,
    updateCartQty,
    updateCartItemOptions,
    removeFromCart,
    placeOrder,
    openAuthModal,
  } = useShop();

  const [customerName, setCustomerName] = useState('');
  const [pickupTime, setPickupTime] = useState('ASAP · 10–12 min');
  const [notes, setNotes] = useState('');
  const [redeemReward, setRedeemReward] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.displayName && !customerName) {
      setCustomerName(userProfile.displayName);
    } else if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
  }, [userProfile, user, customerName]);

  if (!bagOpen) return null;

  const subtotalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.qty, 0);
  const availablePoints = userProfile?.loyaltyPoints ?? 0;
  const eligibleForReward = availablePoints >= SHOP_DETAILS.rewardThresholdPts && subtotalCents > 0;
  const discountCents =
    redeemReward && eligibleForReward
      ? Math.min(SHOP_DETAILS.rewardValueCents, subtotalCents)
      : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const estimatedPointsEarned = Math.min(1000, Math.round(totalCents / 500));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setSubmitting(true);
    try {
      const created = await placeOrder({
        customerName: customerName || user?.displayName || 'Guest',
        pickupType: 'counter',
        pickupTime,
        notes,
        redeemReward: redeemReward && eligibleForReward,
      });
      if (created) {
        setNotes('');
        setRedeemReward(false);
        onOrderPlaced();
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Unable to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label="Items and Place Order"
    >
      <div className="w-full max-w-md bg-[#FAF9F6] h-full border-l border-[#E6E2D8] shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E6E2D8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#1B3B2B]" />
            <h2 className="font-display text-xl font-semibold text-[#181615]">Items</h2>
          </div>
          <button
            type="button"
            onClick={() => setBagOpen(false)}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[#EFECE4] text-[#4E4842] cursor-pointer"
            aria-label="Close items drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base font-medium text-[#181615] mb-1">Your items list is empty</p>
              <p className="text-sm text-[#6B645C]">
                Select any drink from the menu, choose Hot or Iced and cup size (12 oz, 16 oz, or 22 oz), and add it to start a pickup order.
              </p>
            </div>
          ) : (
            <>
              {/* Line Items with inline Hot/Iced & Cup Size controls */}
              <div className="divide-y divide-[#E6E2D8] bg-white rounded-xl border border-[#E6E2D8] px-4">
                {cart.map((item) => (
                  <div key={item.cartKey} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#181615]">{item.name}</p>
                        <p className="text-xs text-[#6B645C] mt-0.5">
                          {`${item.temperature} · ${item.size}${item.milk !== 'None' ? ` · ${item.milk}` : ''}${item.extraShot ? ' · Extra shot' : ''}`}
                        </p>
                      </div>

                      <span className="text-sm font-semibold font-mono-tabular text-[#181615] shrink-0">
                        {formatCents(item.unitPriceCents * item.qty)}
                      </span>
                    </div>

                    {/* Inline Temperature & Cup Size Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="inline-flex rounded-md border border-[#DFD9CC] bg-[#FAF9F6] p-0.5"
                        role="group"
                        aria-label={`Temperature for ${item.name}`}
                      >
                        {(['Hot', 'Iced'] as TempOption[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              updateCartItemOptions(item.cartKey, { temperature: opt })
                            }
                            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              item.temperature === opt
                                ? 'bg-[#1B3B2B] text-white'
                                : 'text-[#4E4842] hover:text-[#181615]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div
                        className="inline-flex rounded-md border border-[#DFD9CC] bg-[#FAF9F6] p-0.5"
                        role="group"
                        aria-label={`Cup size for ${item.name}`}
                      >
                        {(['12 oz', '16 oz', '22 oz'] as DrinkSize[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateCartItemOptions(item.cartKey, { size: opt })}
                            className={`px-2 py-1 text-[11px] font-mono-tabular font-medium rounded transition-colors cursor-pointer ${
                              item.size === opt
                                ? 'bg-[#1B3B2B] text-white'
                                : 'text-[#4E4842] hover:text-[#181615]'
                            }`}
                          >
                            {opt.replace(' ', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <div className="inline-flex items-center border border-[#DFD9CC] rounded-md">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartKey, -1)}
                          className="w-7 h-7 inline-flex items-center justify-center text-[#181615] hover:bg-[#F3F1EC] cursor-pointer"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono-tabular">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartKey, 1)}
                          className="w-7 h-7 inline-flex items-center justify-center text-[#181615] hover:bg-[#F3F1EC] cursor-pointer"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartKey)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#6B645C] hover:text-[#991B1B] cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Place Order Form */}
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="block text-xs font-semibold text-[#181615] mb-1.5">
                    Pickup Spot
                  </p>
                  <div className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#1B3B2B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#181615]">Mang Kape Shop</p>
                      <p className="text-xs text-[#4E4842] mt-0.5">{SHOP_DETAILS.addressLine}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#181615] mb-1">
                      Pickup Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181615] mb-1">
                      Pickup Time
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                    >
                      <option value="ASAP · 10–12 min">ASAP · 10–12 min</option>
                      <option value="In 20 minutes">In 20 minutes</option>
                      <option value="In 35 minutes">In 35 minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181615] mb-1">
                    Barista Notes (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={240}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Extra hot, light ice, sleeve..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  />
                </div>

                {/* Loyalty Reward Redemption */}
                {user && (
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      eligibleForReward
                        ? 'bg-white border-[#1B3B2B]/40 cursor-pointer'
                        : 'bg-[#F3F1EC] border-[#E6E2D8] opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-[#1B3B2B] mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-xs font-semibold text-[#181615]">
                          Redeem {SHOP_DETAILS.rewardThresholdPts} Loyalty Points (-{formatCents(SHOP_DETAILS.rewardValueCents)})
                        </span>
                        <span className="block text-[11px] text-[#6B645C] font-mono-tabular">
                          Balance: {availablePoints} pts
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!eligibleForReward}
                      checked={redeemReward && eligibleForReward}
                      onChange={(e) => setRedeemReward(e.target.checked)}
                      className="w-5 h-5 accent-[#1B3B2B]"
                    />
                  </label>
                )}

                {checkoutError && (
                  <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
                    {checkoutError}
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E6E2D8] bg-white space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#4E4842]">
                <span>Subtotal</span>
                <span className="font-mono-tabular">{formatCents(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-[#1B3B2B]">
                  <span>Loyalty Reward (150 pts)</span>
                  <span className="font-mono-tabular">-{formatCents(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[#181615] pt-2 border-t border-[#EFECE4]">
                <span>Total</span>
                <span className="font-mono-tabular">{formatCents(totalCents)}</span>
              </div>
              {user && (
                <p className="text-xs text-[#1B3B2B] font-mono-tabular text-right">
                  You will earn +{estimatedPointsEarned} loyalty points
                </p>
              )}
            </div>

            {user ? (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3.5 px-5 min-h-[46px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? 'Sending to Espresso Bar...'
                  : `Place Order · ${formatCents(totalCents)}`}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full py-3.5 px-5 min-h-[46px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer"
                >
                  Login / Register to Place Order
                </button>
                <p className="text-[11px] text-center text-[#6B645C]">
                  Your items are saved automatically across sign-in for live order tracking &amp; rewards.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
