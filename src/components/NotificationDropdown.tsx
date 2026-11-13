import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight,
  User,
  Inbox
} from 'lucide-react';
import { YouthNotification } from '../types';
import { getStoredNotifications, saveNotifications } from '../services/notificationStore';
import { useAuth } from '../context/AuthContext';

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onNavigateTab
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<YouthNotification[]>(getStoredNotifications);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setNotifications(e.detail);
      } else {
        setNotifications(getStoredNotifications());
      }
    };
    window.addEventListener('kbelia_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('kbelia_notifications_updated', handleUpdate);
    };
  }, []);

  // Filter strictly according to current active account type
  const filteredNotifications = notifications.filter(n => {
    if (isAdmin) {
      return n.targetRole === 'admin' || n.targetRole === 'all';
    }
    if (isMentor) {
      return n.targetRole === 'mentor' || n.targetRole === 'all';
    }
    // Youth entrepreneur
    return n.targetRole === 'youth' || n.targetRole === 'all' || (!n.targetRole && n.senderRole !== 'admin');
  });

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    const activeIds = new Set(filteredNotifications.map(n => n.id));
    const updated = notifications.map(n => activeIds.has(n.id) ? { ...n, isRead: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAsRead = (id: string, tab?: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
    if (tab && onNavigateTab) {
      onNavigateTab(tab);
      setIsOpen(false);
    }
  };

  const accountRoleLabel = isAdmin 
    ? 'Akaun Pentadbir' 
    : isMentor 
      ? 'Akaun Mentor' 
      : 'Akaun Usahawan';

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        id="kbelia-notifications-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer shadow-2xs group interactive-press hover:border-sky-400/50"
        title={`Pemberitahuan (${accountRoleLabel})`}
        aria-label="Pusat Notifikasi"
      >
        <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 hover-bell-icon" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-600 text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header: Displays notification title & active account badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Pemberitahuan
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
                  isAdmin 
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : isMentor 
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                      : 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                }`}>
                  {isAdmin && <ShieldCheck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
                  {isMentor && <GraduationCap className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />}
                  {!isAdmin && !isMentor && <User className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />}
                  <span>{accountRoleLabel}</span>
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-sky-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  Tanda semua dibaca
                </button>
              )}
            </div>

            {/* Notification List filtered strictly by current account type */}
            <div className="flex flex-col gap-2 my-2.5 max-h-72 overflow-y-auto pr-0.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                  <Inbox className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-medium">Tiada pemberitahuan baharu untuk {accountRoleLabel.toLowerCase()}.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.actionTab)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      !n.isRead
                        ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40 shadow-xs hover:bg-sky-100/50'
                        : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                        {n.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700 text-[10px]">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        isAdmin 
                          ? 'text-amber-700 dark:text-amber-400'
                          : isMentor 
                            ? 'text-indigo-700 dark:text-indigo-400' 
                            : 'text-sky-700 dark:text-sky-400'
                      }`}>
                        {isAdmin ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : isMentor ? (
                          <GraduationCap className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span>{n.sender || 'Urusetia KBelia'}</span>
                      </span>

                      {n.actionTab && (
                        <span className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-0.5 hover:underline">
                          <span>Buka</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Memaparkan makluman rasmi khusus untuk {accountRoleLabel.toLowerCase()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
