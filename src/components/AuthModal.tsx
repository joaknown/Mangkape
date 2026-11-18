import React, { useEffect, useState } from 'react';
import { Lock, Star, X } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';
import { useShop } from '../context/ShopContext';

interface AuthModalProps {
  onAuthSuccess?: (isAdminUser: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const {
    user,
    authModalOpen,
    authForMenuReview,
    authSkipRedirect,
    closeAuthModal,
    authError,
    signInWithGoogle,
  } = useShop();

  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [authModalOpen, authForMenuReview]);

  if (!authModalOpen || user) return null;

  const handleLogin = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      const result = await signInWithGoogle(rememberMe, authForMenuReview);
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

  const displayError = localError || authError;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#181615]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-[#FAF9F6] rounded-2xl border border-[#E6E2D8] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
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
                {authForMenuReview ? 'Sign In to Vote & Rate' : 'Administrator Login'}
              </h2>
              <p className="text-xs text-[#6B645C]">
                {authForMenuReview
                  ? 'Sign in with Google to vote or write a menu rating'
                  : 'Store Manager access for authorized admins'}
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

          <div className="bg-white rounded-xl border border-[#E6E2D8] p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#181615]">
              {authForMenuReview ? (
                <Star className="w-4 h-4 fill-[#C88A1E] text-[#C88A1E] shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-[#1B3B2B] shrink-0" />
              )}
              <span>
                {authForMenuReview
                  ? 'Sign in to vote or write a coffee rating'
                  : 'Authorized Store Administrator Only'}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#4E4842]">
              {authForMenuReview
                ? 'Log in with your Google account to vote for your favorite Mang Kape drinks, rate with stars, and publish your tasting review on the menu.'
                : 'New member registration is disabled and direct login is restricted to Mang Kape administrators. Visitors can sign in directly on any menu item to vote or write a rating.'}
            </p>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-[#181615] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-[#1B3B2B]"
            />
            <span>Keep me signed in on this browser</span>
          </label>

          <button
            type="button"
            disabled={submitting}
            onClick={handleLogin}
            className="w-full py-3.5 px-5 min-h-[46px] text-sm font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {submitting
              ? 'Signing in...'
              : authForMenuReview
                ? 'Continue with Google to Vote & Rate'
                : 'Continue with Google (Admin)'}
          </button>
        </div>
      </div>
    </div>
  );
};
