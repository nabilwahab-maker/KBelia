import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface UMKAlertBannerProps {
  onOpenResetPassword?: () => void;
}

export const UMKAlertBanner: React.FC<UMKAlertBannerProps> = ({ onOpenResetPassword }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div 
      id="umk-security-alert-banner"
      className="bg-[#FFF4D9] text-[#A66700] border border-[#FFE7A8] rounded-xl px-4 py-3 text-xs sm:text-[13px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs transition-all animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
        <span className="font-medium">
          We have noticed some security issues with your account, we recommend that you should reset your password to make your account more secure
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
        <span className="font-medium text-slate-700">
          You may reset them here{' '}
          <button
            onClick={onOpenResetPassword}
            className="font-bold text-[#A66700] hover:text-[#784800] underline hover:no-underline transition-all"
          >
            Password Reset
          </button>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          title="Tutup Hebahan"
          className="text-[#A66700] hover:text-slate-900 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
