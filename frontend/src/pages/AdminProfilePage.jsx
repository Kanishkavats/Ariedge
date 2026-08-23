/**
 * AdminProfilePage — admin's own profile (editable, with avatar upload)
 * + their own borrowed books. Reuses /borrows/my and /borrows/:id/return —
 * those routes have no role restriction, so this works for an admin
 * account exactly the same way it does for a member.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import { Shield, Camera, Pencil, X, BookOpen, CheckCircle2, Clock } from 'lucide-react';

const PAGE_SIZE = 4;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatPill({ icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [returningId, setReturningId] = useState(null);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/borrows/my');
      setBorrows(res.data.data.borrows || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

  const handleReturn = async (borrow) => {
    setReturningId(borrow._id);
    setBanner({ type: '', text: '' });
    try {
      await api.patch(`/borrows/${borrow._id}/return`);
      setBanner({ type: 'success', text: `"${borrow.book?.title}" returned successfully.` });
      fetchBorrows();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setReturningId(null);
    }
  };

  const openEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setProfileError('');
    setEditing(true);
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('email', editEmail);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await api.patch('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.data.user);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setBanner({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileError('');
  };

  const now = new Date();
  const activeCount = borrows.filter((b) => b.status === 'borrowed' && !(b.isOverdue || new Date(b.dueAt) < now)).length;
  const overdueCount = borrows.filter((b) => b.status === 'borrowed' && (b.isOverdue || new Date(b.dueAt) < now)).length;
  const returnedCount = borrows.filter((b) => b.status === 'returned').length;

  const totalPages = Math.max(1, Math.ceil(borrows.length / PAGE_SIZE));
  const pageItems = borrows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'A';
  const displayAvatar = avatarPreview || user?.avatarUrl;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {banner.text && <Alert type={banner.type} message={banner.text} />}

      {/* ── Profile Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 relative">
          {!editing && (
            <button
              onClick={openEdit}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping the banner */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative">
              <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-slate-900 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </div>
          </div>

          {!editing ? (
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full capitalize">
                <Shield className="w-3 h-3" /> {user?.role}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && <Alert type="error" message={profileError} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label" htmlFor="profile-name">Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleCancelEdit} className="btn-secondary" disabled={savingProfile}>
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill icon={<BookOpen className="w-4 h-4" />} label="Currently Borrowed" value={activeCount} tone="blue" />
        <StatPill icon={<Clock className="w-4 h-4" />} label="Overdue" value={overdueCount} tone="amber" />
        <StatPill icon={<CheckCircle2 className="w-4 h-4" />} label="Returned" value={returnedCount} tone="emerald" />
      </div>

      {/* ── My Borrowed Books ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">My Borrowed Books</h2>

        {error && <Alert type="error" message={error} />}

        {loading ? (
          <div className="py-10"><LoadingSpinner /></div>
        ) : borrows.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">You haven't borrowed any books yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4 font-semibold">Book Title</th>
                    <th className="py-2 pr-4 font-semibold">Borrow Date</th>
                    <th className="py-2 pr-4 font-semibold">Due Date</th>
                    <th className="py-2 pr-4 font-semibold">Status</th>
                    <th className="py-2 pr-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {pageItems.map((borrow) => {
                    const isActive = borrow.status === 'borrowed';
                    const isOverdue = isActive && (borrow.isOverdue || new Date(borrow.dueAt) < now);
                    let statusLabel = 'Active';
                    let statusClass = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
                    if (borrow.status === 'returned') {
                      statusLabel = 'Returned';
                      statusClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                    } else if (isOverdue) {
                      statusLabel = 'Overdue';
                      statusClass = 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
                    }
                    return (
                      <tr key={borrow._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">{borrow.book?.title || '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.borrowedAt)}</td>
                        <td className={`py-2.5 pr-4 text-xs font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{formatDate(borrow.dueAt)}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusClass}`}>
                            {statusLabel}{isOverdue && ' ⚠'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          {isActive ? (
                            <button
                              onClick={() => handleReturn(borrow)}
                              disabled={returningId === borrow._id}
                              className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50"
                            >
                              {returningId === borrow._id ? 'Returning…' : 'Return'}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
