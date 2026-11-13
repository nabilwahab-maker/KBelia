import React from 'react';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const SessionTimeoutModal: React.FC = () => {
  const {
    user,
    userProfile,
    isAdmin,
    isMentor,
    isSessionWarningOpen,
    sessionCountdownSeconds,
    keepSessionActive,
    terminateSessionNow
  } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!user || !isSessionWarningOpen) return null;

  const mins = Math.floor(sessionCountdownSeconds / 60);
  const secs = sessionCountdownSeconds % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const roleLabel = isAdmin
    ? isEn
      ? 'Administrator'
      : 'Pentadbir Sistem'
    : isMentor
    ? isEn
      ? 'Mentor'
      : 'Mentor'
    : isEn
    ? 'Youth Entrepreneur'
    : 'Usahawan Belia';

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-amber-400/50 dark:border-amber-500/40 shadow-2xl p-6 sm:p-8 text-center transition-colors">
        {/* Top-Right Close Button (keeps session active) */}
        <button
          type="button"
          onClick={keepSessionActive}
          aria-label={isEn ? 'Close and keep session active' : 'Tutup dan kekal aktifkan sesi'}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-amber-100/70 dark:hover:bg-rose-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Circular Red Exclamation Icon matching reference */}
        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-sm select-none">
          <span className="text-3xl font-black leading-none text-white" aria-hidden="true">
            !
          </span>
        </div>

        {/* Strict Black/White Heading */}
        <h2
          id="session-timeout-title"
          className="mt-4 text-2xl font-bold text-black dark:text-white tracking-tight"
        >
          {isEn ? 'Oops!' : 'Perhatian!'}
        </h2>

        {/* Account Context Line (clean unboxed metadata) */}
        <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-black/70 dark:text-white/75">
          <span className="font-semibold text-black dark:text-white truncate max-w-[200px]">
            {userProfile?.fullName || user.displayName || user.email}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>{roleLabel}</span>
        </div>

        {/* Main Idle Termination Message with Live Tabular Countdown */}
        <p
          id="session-timeout-desc"
          className="mt-3 text-sm sm:text-[15px] text-black dark:text-white leading-relaxed"
        >
          {isEn ? (
            <>
              Session has been idle for 15 minutes and will be terminated in{' '}
              <span className="inline-block px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/70 font-mono font-bold tabular-nums text-black dark:text-white">
                {formattedCountdown}
              </span>
            </>
          ) : (
            <>
              Sesi anda telah tidak aktif selama 15 minit dan akan ditamatkan dalam{' '}
              <span className="inline-block px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/70 font-mono font-bold tabular-nums text-black dark:text-white">
                {formattedCountdown}
              </span>
            </>
          )}
        </p>

        {/* Primary Green Action Button + Secondary Sign Out Link */}
        <div className="mt-6 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={keepSessionActive}
            className="w-full sm:w-auto min-w-[210px] min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            {isEn ? 'Keep session active' : 'Kekal Aktifkan Sesi'}
          </button>

          <button
            type="button"
            onClick={terminateSessionNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black/75 dark:text-white/75 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isEn ? 'Sign out now' : 'Log keluar sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
