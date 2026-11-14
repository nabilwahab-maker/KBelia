import React, { useState, useMemo } from 'react';
import {
  MessagesSquare,
  Search,
  Plus,
  Pin,
  CheckCircle2,
  ThumbsUp,
  MessageCircle,
  Edit3,
  Trash2,
  RotateCcw,
  X,
  Send,
  ArrowRight
} from 'lucide-react';
import {
  CommunityCategory,
  CommunityPost,
  CommunityReply,
  CommunityStatus,
  KelantanDistrict,
  UserRole
} from '../types';
import { COMMUNITY_CATEGORIES, COMMUNITY_DISTRICTS } from '../data/communityData';
import {
  saveCommunityPostRecord,
  deleteCommunityPostRecord,
  toggleCommunityHelpfulRecord,
  saveCommunityReplyRecord,
  deleteCommunityReplyRecord,
  markAcceptedCommunityReplyRecord,
  restoreDefaultDemoCommunity
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';

interface CommunityPageProps {
  posts: CommunityPost[];
  replies: CommunityReply[];
  isLoading?: boolean;
  onRefresh: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Pentadbir',
  mentor: 'Mentor Bertauliah',
  user: 'Usahawan Belia'
};

export const CommunityPage: React.FC<CommunityPageProps> = ({
  posts,
  replies,
  isLoading = false,
  onRefresh
}) => {
  const { user, userProfile, isAdmin, isMentor } = useAuth();
  const currentUserId = user?.uid || (isAdmin ? 'admin' : isMentor ? userProfile?.mentorId || 'mentor' : 'guest');
  const currentUserName =
    userProfile?.fullName ||
    user?.displayName ||
    (isAdmin ? 'Pentadbir KBelia' : isMentor ? 'Mentor Bimbingan' : 'Usahawan Belia');
  const currentUserRole: UserRole = isAdmin ? 'admin' : isMentor ? 'mentor' : 'user';
  const defaultDistrict: KelantanDistrict =
    (userProfile?.district as KelantanDistrict) &&
    COMMUNITY_DISTRICTS.includes(userProfile?.district as KelantanDistrict)
      ? (userProfile?.district as KelantanDistrict)
      : 'Kota Bharu';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | CommunityCategory>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'pinned'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'active' | 'helpful'>('latest');

  // Create / Edit Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<CommunityCategory>('Soal Jawab Geran');
  const [formDistrict, setFormDistrict] = useState<KelantanDistrict>(defaultDistrict);
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Thread Detail & Reply State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState<string | null>(null);
  const [isRestoringDemo, setIsRestoringDemo] = useState(false);

  // Live selected post from props so votes/replies update instantaneously
  const selectedPost = useMemo(
    () => posts.find(p => p.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  // Actual reply count per post combining persisted count and loaded replies
  const replyMap = useMemo(() => {
    const map = new Map<string, CommunityReply[]>();
    for (const r of replies) {
      const list = map.get(r.postId) || [];
      list.push(r);
      map.set(r.postId, list);
    }
    for (const [postId, list] of map.entries()) {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      map.set(postId, list);
    }
    return map;
  }, [replies]);

  const getReplyCount = (post: CommunityPost) => {
    const loaded = replyMap.get(post.id)?.length;
    return typeof loaded === 'number' && loaded > 0 ? loaded : post.replyCount || 0;
  };

  const stats = useMemo(() => {
    const total = posts.length;
    const resolved = posts.filter(p => p.status === 'resolved').length;
    const open = total - resolved;
    return { total, resolved, open };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = posts.filter(post => {
      if (selectedCategory !== 'Semua' && post.category !== selectedCategory) return false;
      if (statusFilter === 'open' && post.status !== 'open') return false;
      if (statusFilter === 'resolved' && post.status !== 'resolved') return false;
      if (statusFilter === 'pinned' && !post.isPinned) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.district.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      if (sortBy === 'active') {
        return getReplyCount(b) - getReplyCount(a);
      }
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [posts, selectedCategory, statusFilter, searchQuery, sortBy, replyMap]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Soal Jawab Geran');
    setFormDistrict(defaultDistrict);
    setShowPostModal(true);
  };

  const openEditModal = (post: CommunityPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormCategory(post.category);
    setFormDistrict(post.district);
    setShowPostModal(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('Sila lengkapkan tajuk dan isi perbincangan.', 'warning');
      return;
    }

    setIsSavingPost(true);
    try {
      const saved = await saveCommunityPostRecord({
        id: editingPost?.id,
        title: formTitle,
        content: formContent,
        category: formCategory,
        district: formDistrict,
        authorId: editingPost?.authorId || currentUserId,
        authorName: editingPost?.authorName || currentUserName,
        authorRole: editingPost?.authorRole || currentUserRole,
        status: editingPost?.status || 'open',
        isPinned: editingPost?.isPinned || false,
        helpfulUserIds: editingPost?.helpfulUserIds || [],
        helpfulCount: editingPost?.helpfulCount || 0,
        replyCount: editingPost?.replyCount || 0,
        acceptedReplyId: editingPost?.acceptedReplyId,
        createdAt: editingPost?.createdAt
      });

      showToast(
        editingPost ? 'Topik perbincangan berjaya dikemaskini.' : 'Topik baharu telah diterbitkan ke Komuniti.',
        'success'
      );
      setShowPostModal(false);
      setEditingPost(null);
      if (!editingPost) {
        setSelectedPostId(saved.id);
      }
      onRefresh();
    } catch {
      showToast('Gagal menyimpan topik. Sila cuba lagi.', 'error');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleToggleHelpful = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    try {
      await toggleCommunityHelpfulRecord(post, currentUserId);
      onRefresh();
    } catch {
      showToast('Gagal mengemaskini undian bermanfaat.', 'error');
    }
  };

  const handleAdminPinToggle = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      await saveCommunityPostRecord({
        ...post,
        isPinned: !post.isPinned
      });
      showToast(!post.isPinned ? 'Topik dipin di bahagian atas forum.' : 'Topik dinyahpin.', 'info');
      onRefresh();
    } catch {
      showToast('Gagal mengubah status pin.', 'error');
    }
  };

  const handleTogglePostStatus = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    if (!isAdmin && post.authorId !== currentUserId) return;
    const nextStatus: CommunityStatus = post.status === 'resolved' ? 'open' : 'resolved';
    try {
      await saveCommunityPostRecord({
        ...post,
        status: nextStatus
      });
      showToast(
        nextStatus === 'resolved' ? 'Topik ditanda sebagai Terjawab.' : 'Topik dibuka semula untuk perbincangan.',
        'success'
      );
      onRefresh();
    } catch {
      showToast('Gagal menukar status topik.', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteCommunityPostRecord(postId);
      showToast('Topik perbincangan telah dipadam.', 'info');
      setConfirmDeletePostId(null);
      if (selectedPostId === postId) {
        setSelectedPostId(null);
      }
      onRefresh();
    } catch {
      showToast('Gagal memadam topik.', 'error');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!replyDraft.trim()) {
      showToast('Sila tulis balasan anda sebelum menghantar.', 'warning');
      return;
    }

    setIsSubmittingReply(true);
    try {
      await saveCommunityReplyRecord(
        {
          postId: selectedPost.id,
          content: replyDraft,
          authorId: currentUserId,
          authorName: currentUserName,
          authorRole: currentUserRole
        },
        selectedPost
      );

      // Emit notification only when permitted by Firestore notification rules across roles
      const canNotifyAuthor =
        selectedPost.authorId !== currentUserId &&
        (isAdmin ||
          (isMentor && selectedPost.authorRole !== 'mentor') ||
          (!isAdmin && !isMentor && selectedPost.authorRole !== 'user'));

      if (canNotifyAuthor) {
        emitAdminOrMentorNotification({
          title: `Balasan Baharu di Komuniti`,
          message: `${currentUserName} membalas topik "${selectedPost.title.slice(0, 70)}".`,
          sender: currentUserName,
          senderRole: currentUserRole,
          targetRole:
            selectedPost.authorRole === 'admin'
              ? 'admin'
              : selectedPost.authorRole === 'mentor'
              ? 'mentor'
              : 'youth',
          targetUserId: selectedPost.authorId,
          actionTab: 'community'
        });
      }

      setReplyDraft('');
      showToast('Balasan anda telah ditambah.', 'success');
      onRefresh();
    } catch {
      showToast('Gagal menghantar balasan. Sila cuba lagi.', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!selectedPost) return;
    try {
      await deleteCommunityReplyRecord(replyId, selectedPost);
      setConfirmDeleteReplyId(null);
      showToast('Balasan telah dipadam.', 'info');
      onRefresh();
    } catch {
      showToast('Gagal memadam balasan.', 'error');
    }
  };

  const handleMarkAccepted = async (reply: CommunityReply) => {
    if (!selectedPost) return;
    if (!isAdmin && selectedPost.authorId !== currentUserId) return;
    const repliesForPost = replyMap.get(selectedPost.id) || [];
    try {
      await markAcceptedCommunityReplyRecord(selectedPost, reply, repliesForPost);
      const unmarking = selectedPost.acceptedReplyId === reply.id;
      showToast(
        unmarking ? 'Tanda jawapan disahkan dikeluarkan.' : 'Balasan ditanda sebagai Jawapan Disahkan.',
        'success'
      );
      onRefresh();
    } catch {
      showToast('Gagal mengemaskini jawapan disahkan.', 'error');
    }
  };

  const handleRestoreDemo = async () => {
    setIsRestoringDemo(true);
    try {
      await restoreDefaultDemoCommunity();
      showToast('Topik contoh Komuniti berjaya dipulihkan.', 'success');
      onRefresh();
    } catch {
      showToast('Gagal memulihkan topik contoh.', 'error');
    } finally {
      setIsRestoringDemo(false);
    }
  };

  const selectedPostReplies = selectedPost ? replyMap.get(selectedPost.id) || [] : [];

  return (
    <div className="w-full space-y-4">
      {/* Page Header & Tabular Summary Strip */}
      <div className="bg-slate-50/80 dark:bg-zinc-950/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight text-balance">
            Komuniti Usahawan Belia Kelantan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            Ajukan soalan geran, kongsi tip operasi kapsul niaga, dan bincang peluang kerjasama antara jajahan bersama Mentor dan Pentadbir.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          {/* Compact Tabular Metrics */}
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Topik</div>
              <div className="font-black text-slate-900 dark:text-white tabular-nums">{stats.total}</div>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-zinc-800" />
            <div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Terjawab</div>
              <div className="font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{stats.resolved}</div>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-zinc-800" />
            <div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Dibuka</div>
              <div className="font-black text-amber-700 dark:text-amber-400 tabular-nums">{stats.open}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleRestoreDemo}
                disabled={isRestoringDemo}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
                title="Pulihkan topik perbincangan demo"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoringDemo ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Pulih Demo</span>
              </button>
            )}
            <button
              id="btn-community-new-post"
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Topik Baharu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari soalan, topik geran, kapsul, daerah atau nama pengarang..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Kosongkan carian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Segmented Bar */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/80 dark:border-zinc-800">
              {([
                { id: 'all', label: 'Semua' },
                { id: 'open', label: 'Belum Terjawab' },
                { id: 'resolved', label: 'Terjawab' },
                { id: 'pinned', label: 'Dipin' }
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === opt.id
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'active' | 'helpful')}
              aria-label="Susun topik mengikut"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="latest">Susun: Terkini</option>
              <option value="active">Susun: Paling Aktif</option>
              <option value="helpful">Susun: Paling Bermanfaat</option>
            </select>

            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
              {filteredPosts.length} topik
            </span>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(['Semua', ...COMMUNITY_CATEGORIES] as const).map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && posts.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuatkan topik komuniti">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3"
            >
              <div className="kbelia-skeleton-box h-3.5 w-64 rounded" />
              <div className="kbelia-skeleton-box h-5 w-3/4 rounded" />
              <div className="kbelia-skeleton-box h-3.5 w-full rounded" />
              <div className="kbelia-skeleton-box h-3.5 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3">
          <MessagesSquare className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tiada topik perbincangan ditemui
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedCategory !== 'Semua' || statusFilter !== 'all'
              ? 'Cuba tukar kata kunci carian atau set semula penapis untuk melihat perbincangan lain.'
              : 'Belum ada soalan atau perkongsian lagi. Jadilah usahawan pertama yang memulakan perbincangan.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(searchQuery || selectedCategory !== 'Semua' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Set Semula Tapisan</span>
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mulakan Perbincangan</span>
            </button>
          </div>
        </div>
      ) : (
        /* Structured Forum Topic Feed */
        <div className="space-y-3.5">
          {filteredPosts.map(post => {
            const hasVoted = post.helpfulUserIds.includes(currentUserId);
            const totalReplies = getReplyCount(post);
            const canManagePost = isAdmin || post.authorId === currentUserId;

            return (
              <article
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className={`group rounded-2xl bg-white dark:bg-zinc-900 border p-5 sm:p-6 transition-colors cursor-pointer space-y-3 ${
                  post.isPinned
                    ? 'border-blue-300/90 dark:border-blue-800/80'
                    : 'border-slate-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {/* Unboxed Inline Metadata Row (Zero-Pill Discipline) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <div className="flex flex-wrap items-center gap-2 tabular-nums">
                    {post.isPinned && (
                      <>
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                          <Pin className="w-3.5 h-3.5" />
                          <span>Topik Dipin</span>
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-bold text-blue-700 dark:text-blue-400">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.district}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="font-semibold text-slate-800 dark:text-zinc-200">{post.authorName}</strong>{' '}
                      ({ROLE_LABEL[post.authorRole]})
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs whitespace-nowrap ${
                      post.status === 'resolved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {post.status === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{post.status === 'resolved' ? 'Terjawab' : 'Menunggu Jawapan'}</span>
                  </span>
                </div>

                {/* Title & Excerpt */}
                <div className="space-y-1.5">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight text-balance group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                    {post.content}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleHelpful(e, post)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                        hasVoted
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Bermanfaat · {post.helpfulCount || 0}</span>
                    </button>

                    <span className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-300 inline-flex items-center gap-1.5 tabular-nums">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{totalReplies} balasan</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleAdminPinToggle(e, post)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                        title={post.isPinned ? 'Nyahpin Topik' : 'Pin Topik di Atas'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canManagePost && (
                      <button
                        type="button"
                        onClick={(e) => handleTogglePostStatus(e, post)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                        title={post.status === 'resolved' ? 'Buka Semula Topik' : 'Tanda Sudah Terjawab'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      <span>Lihat Perbincangan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Topic Modal */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingPost ? 'Sunting Topik Perbincangan' : 'Cipta Topik Baharu di Komuniti'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Perkongsian dan soalan anda dapat dibaca serta dijawab oleh Belia, Mentor dan Pentadbir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Tutup borang topik"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Kategori Topik
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CommunityCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {COMMUNITY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Jajahan / Daerah
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {COMMUNITY_DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-zinc-200">
                    Tajuk Soalan atau Perbincangan
                  </label>
                  <span className="text-slate-400 tabular-nums">{formTitle.length}/200</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Bagaimana cara kemaskini penyata jualan untuk sokongan geran?"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-zinc-200">
                    Huraian Terperinci
                  </label>
                  <span className="text-slate-400 tabular-nums">{formContent.length}/5000</span>
                </div>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Terangkan latar belakang perniagaan, masalah yang dihadapi, atau jenis kerjasama yang anda cari..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSavingPost ? 'Menyimpan...' : editingPost ? 'Simpan Perubahan' : 'Terbitkan Topik'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Topic Discussion & Replies Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
          onClick={() => {
            setSelectedPostId(null);
            setConfirmDeletePostId(null);
            setConfirmDeleteReplyId(null);
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Modal Header */}
            <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 tabular-nums min-w-0">
                <span className="font-bold text-blue-700 dark:text-blue-400">{selectedPost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedPost.district}</span>
                <span aria-hidden="true">·</span>
                <span className={selectedPost.status === 'resolved' ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-bold text-amber-700 dark:text-amber-400'}>
                  {selectedPost.status === 'resolved' ? 'Terjawab' : 'Menunggu Jawapan'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                aria-label="Tutup perbincangan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* Post Body */}
              <div className="space-y-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight text-balance leading-snug">
                    {selectedPost.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selectedPost.authorName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ROLE_LABEL[selectedPost.authorRole]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(selectedPost.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {selectedPost.content.split(/\n\s*\n/).map((para, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Post Interaction & Author/Admin Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleHelpful(e, selectedPost)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                      selectedPost.helpfulUserIds.includes(currentUserId)
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Bermanfaat ({selectedPost.helpfulCount || 0})</span>
                  </button>

                  {(isAdmin || selectedPost.authorId === currentUserId) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleAdminPinToggle(e, selectedPost)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{selectedPost.isPinned ? 'Nyahpin' : 'Pin Topik'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleTogglePostStatus(e, selectedPost)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selectedPost.status === 'resolved' ? 'Buka Semula' : 'Tanda Terjawab'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(selectedPost)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sunting</span>
                      </button>

                      {confirmDeletePostId === selectedPost.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeletePost(selectedPost.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Sahkan Padam
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePostId(null)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePostId(selectedPost.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Padam</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Replies List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    Balasan & Pandangan ({selectedPostReplies.length})
                  </h3>
                </div>

                {selectedPostReplies.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400">
                    Belum ada balasan lagi. Kongsikan jawapan atau pandangan anda di bawah.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPostReplies.map(reply => {
                      const isAccepted = selectedPost.acceptedReplyId === reply.id || Boolean(reply.isAccepted);
                      const canAccept = isAdmin || selectedPost.authorId === currentUserId;
                      const canDeleteReply = isAdmin || reply.authorId === currentUserId;

                      return (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-xl border space-y-2.5 ${
                            isAccepted
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50/70 dark:bg-zinc-950/70 border-slate-200/80 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-zinc-400 tabular-nums">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {reply.authorName}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  reply.authorRole === 'mentor'
                                    ? 'font-semibold text-teal-700 dark:text-teal-400'
                                    : reply.authorRole === 'admin'
                                    ? 'font-semibold text-blue-700 dark:text-blue-400'
                                    : ''
                                }
                              >
                                {ROLE_LABEL[reply.authorRole]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{formatDate(reply.createdAt)}</span>
                            </div>

                            {isAccepted && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Jawapan Disahkan</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                            {reply.content}
                          </p>

                          {(canAccept || canDeleteReply) && (
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                              {canAccept && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAccepted(reply)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isAccepted ? 'Nyahaktif Jawapan Disahkan' : 'Tanda Jawapan Disahkan'}</span>
                                </button>
                              )}

                              {canDeleteReply && (
                                confirmDeleteReplyId === reply.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReply(reply.id)}
                                      className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Padam
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteReplyId(null)}
                                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] text-slate-600 dark:text-zinc-300 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteReplyId(reply.id)}
                                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/70 text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  >
                                    Padam
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Composer */}
                <form onSubmit={handleSubmitReply} className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 dark:text-zinc-200">
                      Tulis Balasan Anda ({ROLE_LABEL[currentUserRole]})
                    </label>
                    <span className="text-slate-400 tabular-nums">{replyDraft.length}/3000</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Kongsikan jawapan, panduan praktikal, atau cadangan membina..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyDraft.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReply ? 'Menghantar...' : 'Hantar Balasan'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
