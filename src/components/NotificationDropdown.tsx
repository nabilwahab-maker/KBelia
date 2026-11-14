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
import {
  getStoredNotifications,
  markAllNotificationsReadStatus,
  markNotificationReadStatus,
  subscribeNotifications
} from '../services/notificationStore';
import { useAuth } from '../context/AuthContext';

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onNavigateTab
}) => {
  const { user, userProfile, isAdmin, isDemoSession } = useAuth();
  const isMentor = userProfile?.role === 'mentor';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<YouthNotification[]>(getStoredNotifications);

  useEffect(() => {
    const unsub = subscribeNotifications(
      {
        uid: user?.uid,
        isAdmin,
        isMentor,
        isDemoSession
      },
      (updatedList) => {
        setNotifications(updatedList);
      }
    );
    return () => unsub();
  }, [user?.uid, isAdmin, isMentor, isDemoSession]);

  // Filter strictly according to current active account type & specific user ID
  const filteredNotifications = notifications.filter(n => {
    if (n.targetUserId && user?.uid && n.targetUserId !== user.uid) {
      return false;
    }
    if (isAdmin) {
      return n.targetRole === 'admin' || n.targetRole === 'all';
    }
    if (isMentor) {
      return n.targetRole === 'mentor' || n.targetRole === 'all';
    }
    // Youth entrepreneur (exclude items addressed to specific other users or admin/mentor only)
    if (n.targetUserId && !user?.uid) return false;
    return n.targetRole === 'youth' || n.targetRole === 'all' || (!n.targetRole && n.senderRole !== 'admin');
  });

  const allowedTabsForRole = isAdmin
    ? new Set(['home', 'admin', 'academic', 'ceed', 'hepa', 'news', 'settings'])
    : isMentor
    ? new Set(['home', 'mentor', 'news', 'settings'])
    : new Set(['home', 'merchant', 'academic', 'ceed', 'hepa', 'events', 'b2b', 'calculator', 'mentorship', 'news', 'settings']);

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    const activeIds = new Set(filteredNotifications.map(n => n.id));
    void markAllNotificationsReadStatus(activeIds, notifications).then((updated) => {
      setNotifications(updated);
    });
  };

  const markAsRead = (id: string, tab?: string) => {
    void markNotificationReadStatus(id, notifications).then((updated) => {
      setNotifications(updated);
    });
    if (tab && onNavigateTab) {
      const safeTab = allowedTabsForRole.has(tab)
        ? tab
        : isAdmin
        ? 'admin'
        : isMentor
        ? 'mentor'
        : 'merchant';
      onNavigateTab(safeTab);
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
        className="relative p-2 sm:p-2.5 rounded-xl text-black/70 hover:text-black hover:bg-slate-50 dark:text-white/75 dark:hover:text-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-all duration-200 cursor-pointer shadow-2xs group interactive-press hover:border-blue-400/70"
        title={`Pemberitahuan (${accountRoleLabel})`}
        aria-label="Pusat Notifikasi"
      >
        <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 hover-bell-icon" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-slate-900 dark:bg-rose-600">
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
          <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-300 dark:border-slate-600 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header: Displays notification title & active account badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black dark:text-white">
                  Pemberitahuan
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
                  isAdmin 
                    ? 'bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white border-amber-300 dark:border-amber-800'
                    : isMentor 
                      ? 'bg-amber-100 text-black dark:bg-rose-600 dark:text-white border-rose-200 dark:border-rose-800/70'
                      : 'bg-amber-100 text-black dark:bg-rose-600 dark:text-white border-amber-400 dark:border-amber-400/40'
                }`}>
                  {isAdmin && <ShieldCheck className="w-2.5 h-2.5 text-black dark:text-white/75" />}
                  {isMentor && <GraduationCap className="w-2.5 h-2.5 text-black dark:text-white/75" />}
                  {!isAdmin && !isMentor && <User className="w-2.5 h-2.5 text-black dark:text-white/75" />}
                  <span>{accountRoleLabel}</span>
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-black dark:text-white/75 hover:underline font-semibold cursor-pointer"
                >
                  Tanda semua dibaca
                </button>
              )}
            </div>

            {/* Notification List filtered strictly by current account type */}
            <div className="flex flex-col gap-2 my-2.5 max-h-72 overflow-y-auto pr-0.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center text-black/70 dark:text-white/75">
                  <Inbox className="w-8 h-8 stroke-1 text-black/35 dark:text-white/35 mb-2" />
                  <p className="text-xs font-medium">Tiada pemberitahuan baharu untuk {accountRoleLabel.toLowerCase()}.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.actionTab)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      !n.isRead
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 shadow-xs hover:bg-amber-100/50'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 dark:bg-amber-400" />
                        )}
                        <span className="text-xs font-bold text-black dark:text-white leading-tight">
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-black/70 dark:text-white/75 tabular-nums shrink-0">
                        {n.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-black dark:text-white leading-snug">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 text-[10px]">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        isAdmin 
                          ? 'text-black dark:text-white/75'
                          : isMentor 
                            ? 'text-black dark:text-white/75' 
                            : 'text-black dark:text-white/75'
                      }`}>
                        {isAdmin ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : isMentor ? (
                          <GraduationCap className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span>{n.sender || 'Admin KBelia'}</span>
                      </span>

                      {n.actionTab && (
                        <span className="font-bold text-black dark:text-white/75 flex items-center gap-0.5 hover:underline">
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
            <div className="pt-2 border-t border-slate-300 dark:border-slate-600 text-center">
              <span className="text-[10px] text-black/70 dark:text-white/75">
                Memaparkan makluman rasmi khusus untuk {accountRoleLabel.toLowerCase()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
