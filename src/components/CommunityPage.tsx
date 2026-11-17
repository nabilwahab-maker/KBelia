import React, { useState, useMemo } from 'react';
import {
  MessagesSquare,
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
  markAcceptedCommunityReplyRecord
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { ToolbarSortOption } from '../utils/sortUtils';

interface CommunityPageProps {
  posts: CommunityPost[];
  replies: CommunityReply[];
  isLoading?: boolean;
  onRefresh: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Pentadbir',
  mentor: 'Mentor',
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
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyDraft, setEditReplyDraft] = useState('');
  const [isSavingReplyEdit, setIsSavingReplyEdit] = useState(false);

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

  const getPostTimestamp = (post: CommunityPost) =>
    new Date(post.updatedAt || post.createdAt || 0).getTime() || 0;

  // Sorotan Utama: topik dipin atau paling bermanfaat, diikuti terkini
  const featuredPost = useMemo(() => {
    if (posts.length === 0) return null;
    return [...posts].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const helpfulDiff = (b.helpfulCount || 0) - (a.helpfulCount || 0);
      if (helpfulDiff !== 0) return helpfulDiff;
      return getPostTimestamp(b) - getPostTimestamp(a);
    })[0];
  }, [posts]);

  // 3 Kad Sorotan Topik: topik terkini lain selepas Topik Utama
  const highlightPosts = useMemo(() => {
    if (!featuredPost) return [];
    return [...posts]
      .filter(p => p.id !== featuredPost.id)
      .sort((a, b) => {
        const timeDiff = getPostTimestamp(b) - getPostTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      })
      .slice(0, 3);
  }, [posts, featuredPost]);

  const sortOptions: ToolbarSortOption[] = [
    { value: 'latest', label: 'Terkini' },
    { value: 'active', label: 'Paling Aktif (Balasan)' },
    { value: 'helpful', label: 'Paling Bermanfaat' }
  ];

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
      return getPostTimestamp(b) - getPostTimestamp(a);
    });
  }, [posts, selectedCategory, statusFilter, searchQuery, sortBy, replyMap]);

  const pagination = usePagination(filteredPosts, 8, [
    searchQuery,
    selectedCategory,
    statusFilter,
    sortBy,
    filteredPosts.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'Semua' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0);

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

  const handleStartEditReply = (reply: CommunityReply) => {
    setEditingReplyId(reply.id);
    setEditReplyDraft(reply.content);
    setConfirmDeleteReplyId(null);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyDraft('');
  };

  const handleSaveEditReply = async (reply: CommunityReply) => {
    if (!selectedPost) return;
    const trimmed = editReplyDraft.trim();
    if (!trimmed) {
      showToast('Teks balasan tidak boleh kosong.', 'warning');
      return;
    }
    setIsSavingReplyEdit(true);
    try {
      await saveCommunityReplyRecord({ ...reply, content: trimmed }, selectedPost);
      setEditingReplyId(null);
      setEditReplyDraft('');
      showToast('Balasan berjaya dikemas kini.', 'success');
      onRefresh();
    } catch {
      showToast('Gagal mengemas kini balasan.', 'error');
    } finally {
      setIsSavingReplyEdit(false);
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

  const selectedPostReplies = selectedPost ? replyMap.get(selectedPost.id) || [] : [];

  return (
    <div className="w-full space-y-5 animate-dashboard-tab">
      {/* Page Header */}
      <div className="bg-slate-50/80 dark:bg-zinc-950/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight text-balance">
            Komuniti Usahawan Belia Kelantan
          </h1>
          <p className="text-[0.9375rem] text-slate-600 dark:text-zinc-300 leading-relaxed">
            Ajukan soalan geran, kongsi tip operasi kapsul niaga, dan bincang peluang kerjasama antara jajahan bersama Mentor dan Pentadbir.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="btn-community-new-post"
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Topik Baharu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Topik Utama Besar & 2. 3 Kad Sorotan Topik */}
      {featuredPost && (
        <div className="space-y-4">
          {/* Topik Utama Besar */}
          <article
            style={{ '--stagger': 0 } as React.CSSProperties}
            onClick={() => setSelectedPostId(featuredPost.id)}
            className="animate-dashboard-card group relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/80 dark:hover:border-blue-500/70 overflow-hidden shadow-xs transition-colors duration-200 cursor-pointer"
          >
            <div className={`h-0.5 w-full ${featuredPost.isPinned ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'}`} />

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tabular-nums">
                  <span className={`uppercase tracking-wider font-bold ${featuredPost.isPinned ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {featuredPost.isPinned ? 'Topik Dipin Utama' : 'Topik Utama Komuniti'}
                  </span>
                  <span className="text-slate-400 dark:text-zinc-500" aria-hidden="true">·</span>
                  <span className="text-slate-700 dark:text-zinc-200">{featuredPost.category}</span>
                  <span className="text-slate-400 dark:text-zinc-500" aria-hidden="true">·</span>
                  <span className="text-slate-600 dark:text-zinc-300">{featuredPost.district}</span>
                  <span className="text-slate-400 dark:text-zinc-500" aria-hidden="true">·</span>
                  <span className={featuredPost.status === 'resolved' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
                    {featuredPost.status === 'resolved' ? 'Terjawab' : 'Belum Terjawab'}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleAdminPinToggle(e, featuredPost)}
                    className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    title={featuredPost.isPinned ? 'Nyahpin Topik' : 'Pin Topik di Atas'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{featuredPost.isPinned ? 'Nyahpin' : 'Pin Utama'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-w-4xl">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight text-balance leading-snug">
                  {featuredPost.title}
                </h2>
                <p className="text-[0.9375rem] text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                  {featuredPost.content}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">{featuredPost.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ROLE_LABEL[featuredPost.authorRole]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDate(featuredPost.createdAt)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleHelpful(e, featuredPost)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                      featuredPost.helpfulUserIds.includes(currentUserId)
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-black dark:text-white'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{featuredPost.helpfulCount || 0} Bermanfaat</span>
                  </button>

                  <span className="px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 inline-flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{getReplyCount(featuredPost)} balasan</span>
                  </span>

                  <span className="py-2 px-4 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0">
                    <span>Buka Perbincangan</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </article>

          {/* 3 Kad Sorotan Topik */}
          {highlightPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sorotan Topik Terkini
                </h2>
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 tabular-nums">
                  {highlightPosts.length} topik sorotan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                {highlightPosts.map((post, idx) => {
                  const hasVoted = post.helpfulUserIds.includes(currentUserId);
                  const totalReplies = getReplyCount(post);
                  return (
                    <article
                      key={post.id}
                      style={{ '--stagger': idx + 1 } as React.CSSProperties}
                      onClick={() => setSelectedPostId(post.id)}
                      className="animate-dashboard-card group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/80 dark:hover:border-blue-500/70 shadow-2xs overflow-hidden transition-colors duration-200 cursor-pointer"
                    >
                      <div
                        className={`h-0.5 w-full ${
                          post.isPinned
                            ? 'bg-amber-500'
                            : post.status === 'resolved'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500/80 dark:bg-blue-400/80'
                        }`}
                      />

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 tabular-nums">
                            <span className="text-blue-700 dark:text-blue-400">{post.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.district}</span>
                            <span aria-hidden="true">·</span>
                            <span className={post.status === 'resolved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                              {post.status === 'resolved' ? 'Terjawab' : 'Dibuka'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {post.title}
                          </h3>

                          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                            {post.content}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400 inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span>Lihat Topik</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleHelpful(e, post)}
                              className={`px-2 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
                                hasVoted
                                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-black dark:text-white'
                                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{post.helpfulCount || 0}</span>
                            </button>

                            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 inline-flex items-center gap-1 tabular-nums">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{totalReplies}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Senarai Penuh Topik dengan Bar Carian & Butang Penapis Bersepadu */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          accent="blue"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari tajuk, isi perbincangan, daerah atau penulis..."
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setSelectedCategory('Semua');
            setStatusFilter('all');
            setSortBy('latest');
          }}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={(val) => setSortBy(val as 'latest' | 'active' | 'helpful')}
          sortLabel="Susun Topik Mengikut"
          rightSlot={
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap px-1">
              {filteredPosts.length} topik
            </span>
          }
          filterContent={
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Kategori Topik
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as 'Semua' | CommunityCategory)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="Semua">Semua Kategori</option>
                  {COMMUNITY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Status Topik
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'resolved' | 'pinned')}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="open">Belum Terjawab</option>
                  <option value="resolved">Terjawab</option>
                  <option value="pinned">Dipin Sahaja</option>
                </select>
              </div>
            </div>
          }
        />

        {/* Loading Skeleton State */}
        {isLoading && posts.length === 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-zinc-800" aria-busy="true" aria-label="Memuatkan topik komuniti">
            {[1, 2, 3].map(n => (
              <div key={n} className="p-5 sm:p-6 space-y-3">
                <div className="kbelia-skeleton-box h-3.5 w-64 rounded" />
                <div className="kbelia-skeleton-box h-5 w-3/4 rounded" />
                <div className="kbelia-skeleton-box h-3.5 w-full rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <MessagesSquare className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tiada topik perbincangan ditemui
            </h3>
            <p className="text-[0.9375rem] text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'Semua' || statusFilter !== 'all' || sortBy !== 'latest'
                ? 'Cuba tukar kata kunci carian atau set semula penapis untuk melihat perbincangan lain.'
                : 'Belum ada soalan atau perkongsian lagi. Jadilah usahawan pertama yang memulakan perbincangan.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {(searchQuery || selectedCategory !== 'Semua' || statusFilter !== 'all' || sortBy !== 'latest') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                    setStatusFilter('all');
                    setSortBy('latest');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Set Semula Tapisan</span>
                </button>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mulakan Perbincangan</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Structured Minimalist Forum Topic List */}
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-800">
              {pagination.paginatedItems.map(post => {
                const hasVoted = post.helpfulUserIds.includes(currentUserId);
                const totalReplies = getReplyCount(post);
                const canManagePost = isAdmin || post.authorId === currentUserId;

                return (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`kbelia-table-row p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer ${
                      post.isPinned ? 'bg-blue-50/35 dark:bg-blue-950/15' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-16 h-16 rounded-lg border flex flex-col items-center justify-center shrink-0 ${
                          post.isPinned
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                            : post.status === 'resolved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {post.isPinned ? <Pin className="w-4 h-4" /> : <MessagesSquare className="w-4 h-4" />}
                        <span className="text-[0.6875rem] font-bold tabular-nums mt-0.5">{totalReplies} bls</span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                            {post.title}
                          </h2>
                          <span
                            className={`text-xs font-bold whitespace-nowrap shrink-0 ${
                              post.status === 'resolved'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            · {post.status === 'resolved' ? 'Terjawab' : 'Belum Terjawab'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-300 truncate tabular-nums">
                          {post.category} · {post.district} · {post.authorName} ({ROLE_LABEL[post.authorRole]}) · {formatDate(post.createdAt)} · {post.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleHelpful(e, post)}
                        className={`px-2.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
                          hasVoted
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-black dark:text-white'
                            : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.helpfulCount || 0}</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleAdminPinToggle(e, post)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                          title={post.isPinned ? 'Nyahpin Topik' : 'Pin Topik di Atas'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManagePost && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePostStatus(e, post)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                          title={post.status === 'resolved' ? 'Buka Semula Topik' : 'Tanda Sudah Terjawab'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1 whitespace-nowrap">
                        <span>Lihat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={8}
              onPageChange={pagination.setCurrentPage}
              itemLabel="topik"
              accent="blue"
              variant="compact"
            />
          </>
        )}
      </div>

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
                <p className="text-[0.9375rem] text-slate-500 dark:text-zinc-400">
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
                  <label className="block text-sm font-bold text-black dark:text-white">
                    Kategori Topik
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CommunityCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {COMMUNITY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-black dark:text-white">
                    Daerah
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                <div className="flex items-center justify-between text-sm">
                  <label className="font-bold text-black dark:text-white">
                    Tajuk Topik
                  </label>
                  <span className="text-slate-400 tabular-nums">{formTitle.length}/200</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Masukkan tajuk topik"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <label className="font-bold text-black dark:text-white">
                    Keterangan Topik
                  </label>
                  <span className="text-slate-400 tabular-nums">{formContent.length}/5000</span>
                </div>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Masukkan keterangan topik"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
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
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 tabular-nums min-w-0">
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
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 tabular-nums">
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
                    className={`px-3.5 py-2 rounded-xl border text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                      selectedPost.helpfulUserIds.includes(currentUserId)
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-black dark:text-white'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
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
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{selectedPost.isPinned ? 'Nyahpin' : 'Pin Topik'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleTogglePostStatus(e, selectedPost)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selectedPost.status === 'resolved' ? 'Buka Semula' : 'Tanda Terjawab'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(selectedPost)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sunting</span>
                      </button>

                      {confirmDeletePostId === selectedPost.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeletePost(selectedPost.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[0.8125rem] font-bold cursor-pointer"
                          >
                            Sahkan Padam
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePostId(null)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-slate-600 dark:text-zinc-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePostId(selectedPost.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/70 text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
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
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-center text-sm text-slate-500 dark:text-zinc-400">
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
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
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
                              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Jawapan Disahkan</span>
                              </span>
                            )}
                          </div>

                          {editingReplyId === reply.id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                maxLength={3000}
                                value={editReplyDraft}
                                onChange={(e) => setEditReplyDraft(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-blue-400 dark:border-blue-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isSavingReplyEdit}
                                  onClick={handleCancelEditReply}
                                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-slate-600 dark:text-zinc-300 cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingReplyEdit || !editReplyDraft.trim()}
                                  onClick={() => handleSaveEditReply(reply)}
                                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[0.8125rem] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {isSavingReplyEdit ? 'Menyimpan...' : 'Simpan'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[0.9375rem] text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>
                          )}

                          {(canAccept || canDeleteReply) && editingReplyId !== reply.id && (
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                              {canAccept && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAccepted(reply)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isAccepted ? 'Nyahaktif Jawapan Disahkan' : 'Tanda Jawapan Disahkan'}</span>
                                </button>
                              )}

                              {canDeleteReply && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditReply(reply)}
                                  className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-[0.8125rem] font-semibold text-black dark:text-white inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Sunting</span>
                                </button>
                              )}

                              {canDeleteReply && (
                                confirmDeleteReplyId === reply.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReply(reply.id)}
                                      className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[0.8125rem] font-bold cursor-pointer"
                                    >
                                      Padam
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteReplyId(null)}
                                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-[0.8125rem] text-slate-600 dark:text-zinc-300 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteReplyId(reply.id)}
                                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/70 text-[0.8125rem] font-semibold text-black dark:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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
                  <div className="flex items-center justify-between text-sm">
                    <label className="font-bold text-black dark:text-white">
                      Balasan Anda
                    </label>
                    <span className="text-slate-400 tabular-nums">{replyDraft.length}/3000</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Masukkan balasan anda"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyDraft.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
