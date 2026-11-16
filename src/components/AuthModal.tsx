import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock, UserPlus, X } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';
import type { DrinkSize, MilkOption, TempOption } from '../types/coffee';

interface AuthModalProps {
  onAuthSuccess?: (isAdminUser: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const {
    user,
    authModalOpen,
    authModalTab,
    authSkipRedirect,
    openAuthModal,
    closeAuthModal,
    authError,
    signInWithGoogle,
    registerMemberWithGoogle,
  } = useShop();

  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // New Member Registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredTemp, setPreferredTemp] = useState<TempOption>('Iced');
  const [preferredSize, setPreferredSize] = useState<DrinkSize>('16 oz');
  const [preferredMilk, setPreferredMilk] = useState<MilkOption>('Whole Milk');

  useEffect(() => {
    setLocalError(null);
  }, [authModalOpen, authModalTab]);

  if (!authModalOpen || user) return null;

  const handleLogin = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      const result = await signInWithGoogle(rememberMe);
      if (result.ok) {
        closeAuthModal();
        if (!authSkipRedirect) onAuthSuccess?.(result.isAdmin);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!fullName.trim()) {
      setLocalError('Please enter your full name to register as a member.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerMemberWithGoogle(
        {
          displayName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          preferredTemp,
          preferredSize,
          preferredMilk,
        },
        rememberMe
      );
      if (result.ok) {
        closeAuthModal();
        if (!authSkipRedirect) onAuthSuccess?.(result.isAdmin);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#181615]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-lg bg-[#FAF9F6] rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E6E2D8] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={SHOP_DETAILS.logoUrl}
              alt="Mang Kape"
              referrerPolicy="no-referrer"
              className="w-8 h-8 object-contain rounded-full border border-[#E6E2D8] bg-white"
            />
            <div>
              <h2
                id="auth-modal-title"
                className="font-display text-xl font-semibold text-[#181615]"
              >
                {authModalTab === 'login' ? 'Member & Staff Login' : 'Register New Member'}
              </h2>
              <p className="text-xs text-[#6B645C]">
                Customers access their private account · Staff unlock Store Manager
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4E4842] hover:text-[#181615] hover:bg-[#EFECE4] cursor-pointer"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-5 bg-[#FAF9F6]">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#E6E2D8]/80 rounded-lg">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                authModalTab === 'login'
                  ? 'bg-white text-[#181615] shadow-sm'
                  : 'text-[#4E4842] hover:text-[#181615]'
              }`}
            >
              Existing Login
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                authModalTab === 'register'
                  ? 'bg-white text-[#181615] shadow-sm'
                  : 'text-[#4E4842] hover:text-[#181615]'
              }`}
            >
              Register New Member
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {displayError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
            >
              {displayError}
            </div>
          )}

          {authModalTab === 'login' ? (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 space-y-3">
                <p className="text-sm font-semibold text-[#181615]">
                  Unified Sign-In for Customers &amp; Administrators
                </p>
                <p className="text-xs leading-relaxed text-[#4E4842]">
                  Returning customers sign in automatically on revisit and view only their personal profile, saved details, loyalty points, and orders. Authorized Mang Kape administrators automatically unlock the Store Manager.
                </p>
                <ul className="space-y-2 pt-1 text-xs text-[#4E4842]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                    <span>Customers see only their private account &amp; update personal info</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#1B3B2B] shrink-0" />
                    <span>Shop managers access Menu Editor, Queue &amp; Traffic</span>
                  </li>
                </ul>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[#181615] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#1B3B2B]"
                />
                <span>Keep me signed in and log in automatically on this browser</span>
              </label>

              <button
                type="button"
                disabled={submitting}
                onClick={handleLogin}
                className="w-full py-3.5 px-5 min-h-[46px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Continue with Google'}
              </button>

              <p className="text-center text-xs text-[#6B645C]">
                New to Mang Kape?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="font-semibold text-[#1B3B2B] underline underline-offset-4 hover:text-[#142D20] cursor-pointer"
                >
                  Register as a new member
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white border border-[#E6E2D8] flex items-center gap-3">
                <Award className="w-5 h-5 text-[#1B3B2B] shrink-0" />
                <p className="text-xs text-[#4E4842]">
                  New members receive <strong className="text-[#181615]">50 welcome points</strong> and can save their preferred drink style and loved menu picks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#4E4842] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4842] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Burgos St, Roxas City, Capiz"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4E4842] mb-1">
                    Preferred Style
                  </label>
                  <select
                    value={preferredTemp}
                    onChange={(e) => setPreferredTemp(e.target.value as TempOption)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Iced">Iced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4842] mb-1">
                    Cup Size
                  </label>
                  <select
                    value={preferredSize}
                    onChange={(e) => setPreferredSize(e.target.value as DrinkSize)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  >
                    <option value="12 oz">12 oz</option>
                    <option value="16 oz">16 oz</option>
                    <option value="22 oz">22 oz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4E4842] mb-1">
                    Milk Choice
                  </label>
                  <select
                    value={preferredMilk}
                    onChange={(e) => setPreferredMilk(e.target.value as MilkOption)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DFD9CC] rounded-lg focus:outline-2 focus:outline-[#1B3B2B]"
                  >
                    <option value="Whole Milk">Whole Milk</option>
                    <option value="Oat Milk (Oatside)">Oat Milk (Oatside)</option>
                    <option value="Soy Milk (Kirkland)">Soy Milk (Kirkland)</option>
                    <option value="Low Fat Milk">Low Fat Milk</option>
                    <option value="None">No Milk</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[#181615] cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#1B3B2B]"
                />
                <span>Keep me signed in and log in automatically on return</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-[46px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Creating Account...' : 'Register with Google'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
