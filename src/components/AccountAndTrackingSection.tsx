import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  LogOut,
  Pencil,
  RotateCcw,
  Star,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { formatCents, SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type {
  DrinkSize,
  MilkOption,
  Order,
  OrderStatus,
  TempOption,
} from '../types/coffee';

const TRACK_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'received', label: 'Order Received' },
  { key: 'preparing', label: 'Barista Brewing' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'completed', label: 'Completed' },
];

function getStepIndex(status: OrderStatus): number {
  const idx = TRACK_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function formatOrderTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return 'Recently';
  }
}

function statusDisplayText(status: OrderStatus): string {
  switch (status) {
    case 'received':
      return 'Order Received';
    case 'preparing':
      return 'Barista Brewing';
    case 'ready':
      return 'Ready for Pickup';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}

export const AccountAndTrackingSection: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    userProfile,
    orders,
    authError,
    openAuthModal,
    updateUserProfile,
    signOutUser,
    reorderFromHistory,
    cancelOrder,
    updateFavoriteOrder,
  } = useShop();

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileTemp, setProfileTemp] = useState<TempOption>('Iced');
  const [profileSize, setProfileSize] = useState<DrinkSize>('16 oz');
  const [profileMilk, setProfileMilk] = useState<MilkOption>('Whole Milk');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.displayName || '');
      setProfilePhone(userProfile.phone || '');
      setProfileAddress(userProfile.address || '');
      setProfileTemp(userProfile.preferredTemp || 'Iced');
      setProfileSize(userProfile.preferredSize || '16 oz');
      setProfileMilk(userProfile.preferredMilk || 'Whole Milk');
    } else if (user) {
      setProfileName(user.displayName || '');
    }
  }, [userProfile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!profileName.trim()) {
      setProfileError('Full name is required.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfile({
        displayName: profileName,
        phone: profilePhone,
        address: profileAddress,
        preferredTemp: profileTemp,
        preferredSize: profileSize,
        preferredMilk: profileMilk,
      });
      setEditingProfile(false);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Unable to save your information.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const activeOrder = useMemo<Order | null>(() => {
    return (
      orders.find(
        (o) => o.status === 'received' || o.status === 'preparing' || o.status === 'ready'
      ) || null
    );
  }, [orders]);

  const favoriteOrder = useMemo<Order | null>(() => {
    if (!userProfile?.favoriteOrderId) return null;
    return orders.find((o) => o.id === userProfile.favoriteOrderId) || null;
  }, [orders, userProfile]);

  const points = userProfile?.loyaltyPoints ?? 0;
  const lifetimePoints = userProfile?.lifetimePoints ?? 0;
  const rewardProgressPct = Math.min(
    100,
    Math.round((points / SHOP_DETAILS.rewardThresholdPts) * 100)
  );
  const availablePerksCount = Math.floor(points / SHOP_DETAILS.rewardThresholdPts);
  const memberTier =
    lifetimePoints >= 1000
      ? 'Reserve Roaster'
      : lifetimePoints >= 400
      ? 'Gold Bean'
      : "Roaster's Circle";

  const redeemedOrders = useMemo<Order[]>(() => {
    return orders.filter((o) => o.pointsRedeemed > 0 && o.status !== 'cancelled');
  }, [orders]);

  const totalSavedCents = useMemo(() => {
    return redeemedOrders.reduce((sum, o) => sum + o.discountCents, 0);
  }, [redeemedOrders]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section id="orders" className="py-14 lg:py-20 border-b border-[#E6E2D8] bg-[#F3F1EC]/60">
      <div id="rewards" className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Order Tracking, History &amp; Loyalty Rewards
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {user ? `Welcome back, ${userProfile?.displayName || user.displayName || 'Friend'}` : 'Your personal espresso bar pass'}
            </h2>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {isAdmin && (
                <a
                  href="#cms"
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Open Store Manager</span>
                </a>
              )}
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-[#4E4842] hover:text-[#181615] bg-white border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {authError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
          >
            {authError}
          </div>
        )}

        {!authReady ? (
          <div className="h-56 rounded-xl bg-white border border-[#E6E2D8] animate-pulse" />
        ) : !user ? (
          /* Signed-Out Personalized Invitation */
          <div className="bg-white rounded-xl border border-[#E6E2D8] p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <h3 className="font-display text-2xl font-semibold text-[#181615] mb-3">
                Member Login &amp; New Customer Registration
              </h3>
              <p className="text-[15px] leading-relaxed text-[#4E4842] mb-6 max-w-[60ch]">
                Log in to access your private account, update your profile and preferred cup style, track orders in real time, and earn 50 welcome points on your first visit. Returning customers stay signed in automatically.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#1B3B2B]" />
                  <span>Register New Member</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#E6E2D8] pt-6 lg:pt-0 lg:pl-8 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#181615]">Automatic Returning Login</p>
                <p className="text-xs text-[#6B645C]">Existing customers stay signed in on revisit</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#181615]">Private Member Profile</p>
                <p className="text-xs text-[#6B645C]">View and update your own details &amp; drink setup</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#181615]">50 Welcome Points</p>
                <p className="text-xs text-[#6B645C]">150 pts unlocks ₱150.00 off any drink</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Personal Account Information & Preferences */}
            <div
              id="account-profile"
              aria-labelledby="account-info-heading"
              className="bg-white rounded-xl border border-[#E6E2D8] p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFECE4]">
                <div>
                  <p className="text-xs text-[#4E4842] mb-1">
                    {isAdmin ? 'Administrator & Member Account' : 'Personal Member Account'}
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>Private to {userProfile?.email || user.email}</span>
                  </p>
                  <h3
                    id="account-info-heading"
                    className="font-display text-2xl font-semibold text-[#181615]"
                  >
                    Your Account Information
                  </h3>
                </div>

                {!editingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileError(null);
                      setEditingProfile(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#1B3B2B]" />
                    <span>Update Information</span>
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="pt-6 space-y-5">
                  {profileError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
                    >
                      {profileError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        maxLength={30}
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="0917 123 4567"
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Email (Verified)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={userProfile?.email || user.email || ''}
                        className="w-full px-3 py-2 text-sm bg-[#F3F1EC] text-[#6B645C] border border-[#E6E2D8] rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4E4842] mb-1">
                      Address / Barangay
                    </label>
                    <input
                      type="text"
                      maxLength={160}
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="Burgos St, Roxas City, Capiz"
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Preferred Temperature
                      </label>
                      <select
                        value={profileTemp}
                        onChange={(e) => setProfileTemp(e.target.value as TempOption)}
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      >
                        <option value="Hot">Hot</option>
                        <option value="Iced">Iced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Preferred Cup Size
                      </label>
                      <select
                        value={profileSize}
                        onChange={(e) => setProfileSize(e.target.value as DrinkSize)}
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      >
                        <option value="12 oz">12 oz</option>
                        <option value="16 oz">16 oz</option>
                        <option value="22 oz">22 oz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4E4842] mb-1">
                        Preferred Milk
                      </label>
                      <select
                        value={profileMilk}
                        onChange={(e) => setProfileMilk(e.target.value as MilkOption)}
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                      >
                        <option value="Whole Milk">Whole Milk</option>
                        <option value="Oat Milk">Oat Milk</option>
                        <option value="Almond Milk">Almond Milk</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileError(null);
                      }}
                      className="px-4 py-2.5 min-h-[40px] text-xs font-medium text-[#4E4842] bg-[#F3F1EC] hover:bg-[#E8E4DA] rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 min-h-[40px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving...' : 'Save Information'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-[#6B645C] mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-[#181615]">
                      {userProfile?.displayName || user.displayName || 'Member'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B645C] mb-1">Mobile Number</p>
                    <p className="text-sm font-medium text-[#181615] font-mono-tabular">
                      {userProfile?.phone?.trim() ? userProfile.phone : 'Not added yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B645C] mb-1">Address / Barangay</p>
                    <p className="text-sm font-medium text-[#181615]">
                      {userProfile?.address?.trim() ? userProfile.address : 'Not added yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B645C] mb-1">Default Cup Setup</p>
                    <p className="text-sm font-medium text-[#1B3B2B]">
                      {`${userProfile?.preferredTemp || 'Iced'} · ${userProfile?.preferredSize || '16 oz'} · ${userProfile?.preferredMilk || 'Whole Milk'}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Loyalty Dashboard Section */}
            <div
              aria-labelledby="loyalty-dashboard-heading"
              className="bg-white rounded-xl border border-[#E6E2D8] p-6 sm:p-8 space-y-6"
            >
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFECE4]">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#4E4842] mb-1">
                    <Award className="w-4 h-4 text-[#1B3B2B]" />
                    <span>{memberTier}</span>
                    <span aria-hidden="true">·</span>
                    <span>{userProfile?.email || user.email}</span>
                  </div>
                  <h3
                    id="loyalty-dashboard-heading"
                    className="font-display text-2xl font-semibold text-[#181615]"
                  >
                    Loyalty Dashboard
                  </h3>
                </div>

                {favoriteOrder ? (
                  <button
                    type="button"
                    onClick={() => reorderFromHistory(favoriteOrder)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder Favorite ({favoriteOrder.orderNumber})</span>
                  </button>
                ) : orders.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => reorderFromHistory(orders[0])}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder Last Order</span>
                  </button>
                ) : null}
              </div>

              {/* Balance Metrics & Progress Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[#6B645C] mb-1">Current Balance</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl font-semibold font-mono-tabular text-[#181615]">
                        {points}
                      </span>
                      <span className="text-xs text-[#4E4842]">pts</span>
                    </div>
                    <p className="mt-1 text-xs font-mono-tabular text-[#1B3B2B]">
                      {availablePerksCount}{' '}
                      {availablePerksCount === 1 ? 'free drink ready' : 'free drinks ready'}
                    </p>
                  </div>

                  <div className="border-l border-[#EFECE4] pl-6">
                    <p className="text-xs text-[#6B645C] mb-1">Lifetime Earned</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-semibold font-mono-tabular text-[#181615]">
                        {lifetimePoints}
                      </span>
                      <span className="text-xs text-[#4E4842]">pts</span>
                    </div>
                    <p className="mt-1 text-xs font-mono-tabular text-[#6B645C]">
                      Total saved: {formatCents(totalSavedCents)}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 lg:border-l lg:border-[#EFECE4] lg:pl-8">
                  <div className="flex items-center justify-between text-xs font-medium text-[#181615] mb-2">
                    <span>Progress Toward Next Reward ({formatCents(SHOP_DETAILS.rewardValueCents)} Signature Drink Credit)</span>
                    <span className="font-mono-tabular">
                      {Math.min(points, SHOP_DETAILS.rewardThresholdPts)} / {SHOP_DETAILS.rewardThresholdPts} pts ({rewardProgressPct}%)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Progress toward next loyalty reward"
                    aria-valuenow={Math.min(points, SHOP_DETAILS.rewardThresholdPts)}
                    aria-valuemin={0}
                    aria-valuemax={SHOP_DETAILS.rewardThresholdPts}
                    className="h-3 w-full rounded-full bg-[#EFECE4] overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#1B3B2B] transition-all duration-300"
                      style={{ width: `${rewardProgressPct}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-[#4E4842]">
                    {points >= SHOP_DETAILS.rewardThresholdPts
                      ? 'Reward unlocked — toggle "Redeem 150 Loyalty Points" inside your Items drawer at checkout.'
                      : `${SHOP_DETAILS.rewardThresholdPts - points} more points (${formatCents((SHOP_DETAILS.rewardThresholdPts - points) * 500)} in café orders) to unlock your next ${formatCents(SHOP_DETAILS.rewardValueCents)} drink credit.`}
                  </p>
                </div>
              </div>

              {/* History of Redeemed Perks */}
              <div className="pt-6 border-t border-[#EFECE4]">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h4 className="text-sm font-semibold text-[#181615]">
                    Redeemed Perks History
                  </h4>
                  <span className="text-xs font-mono-tabular text-[#6B645C]">
                    {redeemedOrders.length}{' '}
                    {redeemedOrders.length === 1 ? 'perk redeemed' : 'perks redeemed'}
                  </span>
                </div>

                {redeemedOrders.length === 0 ? (
                  <p className="text-sm text-[#6B645C] py-3">
                    No perks redeemed yet. Once you reach {SHOP_DETAILS.rewardThresholdPts} points, you can apply a {formatCents(SHOP_DETAILS.rewardValueCents)} drink credit directly in your Items drawer and every redemption will appear here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EFECE4]">
                    {redeemedOrders.map((order) => (
                      <div
                        key={`perk-${order.id}`}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#181615]">
                            Free Signature Drink Credit
                          </p>
                          <p className="text-xs text-[#6B645C] mt-0.5">
                            <span className="font-mono-tabular">{order.orderNumber}</span>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span>{formatOrderTime(order.createdAtMs)}</span>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span>
                              {order.items.map((it) => `${it.qty}× ${it.name}`).join(', ')}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono-tabular shrink-0">
                          <span className="text-[#4E4842]">-{order.pointsRedeemed} pts</span>
                          <span className="font-semibold text-[#1B3B2B]">
                            Saved {formatCents(order.discountCents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Live Order Tracker */}
            {activeOrder && (
              <div className="bg-white rounded-xl border border-[#1B3B2B]/30 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#EFECE4]">
                  <div>
                    <p className="text-xs font-medium text-[#1B3B2B] mb-1">
                      Live Order Tracker · MANG KAPE SHOP PICKUP
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-[#181615] font-mono-tabular">
                      Order {activeOrder.orderNumber}
                    </h3>
                    <p className="text-sm text-[#4E4842] mt-1">
                      Pickup window: {activeOrder.pickupTime} · Placed {formatOrderTime(activeOrder.createdAtMs)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#1B3B2B]">
                      {statusDisplayText(activeOrder.status)}
                    </span>
                    {activeOrder.status === 'received' && (
                      <button
                        type="button"
                        disabled={cancellingId === activeOrder.id}
                        onClick={() => handleCancelOrder(activeOrder.id)}
                        className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === activeOrder.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-Step Progress Bar */}
                <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {TRACK_STEPS.map((step, index) => {
                    const currentIdx = getStepIndex(activeOrder.status);
                    const isDone = index <= currentIdx;
                    const isCurrent = index === currentIdx;
                    return (
                      <div key={step.key} className="flex flex-col gap-2">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            isDone ? 'bg-[#1B3B2B]' : 'bg-[#E6E2D8]'
                          }`}
                        />
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#A39B8F] shrink-0" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              isCurrent
                                ? 'text-[#181615] font-semibold'
                                : isDone
                                ? 'text-[#4E4842]'
                                : 'text-[#8A8278]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Order Receipt Summary */}
                <div className="pt-4 border-t border-[#EFECE4] flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="text-[#4E4842]">
                    {activeOrder.items.map((line, i) => (
                      <span key={`${line.id}-${i}`}>
                        {i > 0 ? ' · ' : ''}
                        <span className="font-mono-tabular font-medium text-[#181615]">
                          {line.qty}×
                        </span>{' '}
                        {line.name} ({line.size}, {line.temperature})
                      </span>
                    ))}
                  </div>
                  <div className="font-mono-tabular font-semibold text-[#181615]">
                    Total: {formatCents(activeOrder.totalCents)}
                    {activeOrder.pointsEarned > 0 && (
                      <span className="ml-2 text-xs font-normal text-[#1B3B2B]">
                        (+{activeOrder.pointsEarned} pts)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Order History */}
            <div className="bg-white rounded-xl border border-[#E6E2D8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E6E2D8] flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#181615]">Account Order History</h3>
                <span className="text-xs font-mono-tabular text-[#6B645C]">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#4E4842]">
                    No past orders yet. Add a seasonal pour from the menu above to place your first pickup order.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#EFECE4]">
                  {orders.map((order) => {
                    const isPinned = userProfile?.favoriteOrderId === order.id;
                    return (
                      <div
                        key={order.id}
                        className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B645C]">
                            <span className="font-mono-tabular font-semibold text-[#181615]">
                              {order.orderNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatOrderTime(order.createdAtMs)}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-medium ${
                                order.status === 'cancelled'
                                  ? 'text-[#991B1B]'
                                  : order.status === 'ready' || order.status === 'completed'
                                  ? 'text-[#1B3B2B]'
                                  : 'text-[#181615]'
                              }`}
                            >
                              {statusDisplayText(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-[#181615]">
                            {order.items
                              .map((it) => `${it.qty}× ${it.name}`)
                              .join(', ')}
                          </p>
                          <p className="text-xs text-[#6B645C] font-mono-tabular">
                            Mang Kape Shop pickup · +{order.pointsEarned} pts earned
                            {order.pointsRedeemed > 0 ? ` · -${order.pointsRedeemed} pts redeemed` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold font-mono-tabular text-[#181615] mr-1">
                            {formatCents(order.totalCents)}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateFavoriteOrder(isPinned ? '' : order.id)}
                            aria-label={isPinned ? 'Unpin favorite order' : 'Pin as favorite order'}
                            className={`inline-flex items-center gap-1 px-2.5 py-2 min-h-[38px] text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                              isPinned
                                ? 'bg-[#1B3B2B]/10 border-[#1B3B2B]/30 text-[#1B3B2B]'
                                : 'bg-[#FAF9F6] border-[#DFD9CC] text-[#4E4842] hover:text-[#181615]'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-[#1B3B2B]' : ''}`} />
                            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => reorderFromHistory(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
