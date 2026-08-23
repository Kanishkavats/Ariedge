import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { Users, Search, Trash2, Edit, Plus, X, Check, Eye, Mail, Calendar, Shield, PieChart as PieChartIcon, BarChart3, BookOpen } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const LIMIT = 10;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
      Member
    </span>
  );
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // View detail
  const [viewTarget, setViewTarget] = useState(null);

  // Full snapshot for analytics charts (independent of the table's pagination/search)
  const [allUsers, setAllUsers] = useState([]);
  const [allBorrows, setAllBorrows] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [usersRes, borrowsRes] = await Promise.all([
        api.get('/users', { params: { limit: 100 } }),
        api.get('/borrows'),
      ]);
      setAllUsers(usersRes.data.data || []);
      setAllBorrows(borrowsRes.data.data.borrows || []);
    } catch {
      // Non-critical — charts just stay empty if this fails.
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users', {
        params: { page, limit: LIMIT, search: debouncedSearch }
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleEditSave = async (userId) => {
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/users/${userId}`, { role: editRole });
      setEditingId(null);
      fetchUsers();
      fetchChartData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(userId);
    setDeleteError('');
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
      fetchChartData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived chart data (from the full snapshot, real & dynamic) ──
  const adminCount = allUsers.filter((u) => u.role === 'admin').length;
  const memberCount = allUsers.length - adminCount;
  const rolePieData = [
    { name: 'Members', value: memberCount, color: '#10b981' },
    { name: 'Admins', value: adminCount, color: '#4f46e5' },
  ].filter((d) => d.value > 0);

  const JOIN_DAYS = 14;
  const joinSince = new Date();
  joinSince.setDate(joinSince.getDate() - (JOIN_DAYS - 1));
  joinSince.setHours(0, 0, 0, 0);
  const joinCountByDate = {};
  allUsers.forEach((u) => {
    const d = new Date(u.createdAt);
    if (d < joinSince) return;
    const key = d.toISOString().slice(0, 10);
    joinCountByDate[key] = (joinCountByDate[key] || 0) + 1;
  });
  const joinedPerDayData = [];
  for (let i = 0; i < JOIN_DAYS; i++) {
    const d = new Date(joinSince);
    d.setDate(joinSince.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    joinedPerDayData.push({
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      count: joinCountByDate[key] || 0,
    });
  }

  const borrowCountByMember = {};
  allBorrows.forEach((b) => {
    const name = b.user?.name || 'Unknown';
    borrowCountByMember[name] = (borrowCountByMember[name] || 0) + 1;
  });
  const topBorrowersData = Object.entries(borrowCountByMember)
    .map(([name, count]) => ({ name: name.length > 14 ? `${name.slice(0, 14)}…` : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Members
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all registered users and their roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total: <span className="font-bold text-slate-800 dark:text-white">{pagination.total}</span>
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition"
        />
      </div>

      {error && <Alert type="error" message={error} />}
      {deleteError && <Alert type="error" message={deleteError} />}
      {editError && <Alert type="error" message={editError} />}

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No members found</p>
            <p className="text-sm mt-1">Try adjusting the search or add a new member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
                    {/* Avatar + Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                    {/* Role - Editable */}
                    <td className="px-6 py-4">
                      {editingId === u._id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>
                    {/* Joined On */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === u._id ? (
                          <>
                            <button
                              onClick={() => handleEditSave(u._id)}
                              disabled={editLoading}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={editLoading}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setViewTarget(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingId(u._id); setEditRole(u.role); setEditError(''); }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 transition-colors"
                              title="Edit role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u._id)}
                              disabled={deletingId === u._id}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} &bull; {pagination.total} total members
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Members Analytics ── */}
      <div className="mt-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Members Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Live charts computed from your registered users</p>

        {chartsLoading ? (
          <div className="py-10"><LoadingSpinner /></div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            No members yet — analytics will appear here once users sign up.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role distribution — Pie chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Role Distribution
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{allUsers.length}</span>
                </div>
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {rolePieData.map((entry, index) => <Cell key={`r-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                {rolePieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}: <span className="font-bold">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* New signups per day — Bar chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                New Signups
              </h3>
              <p className="text-xs text-slate-400 mb-4">Last 14 days</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={joinedPerDayData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={1} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" name="New Members" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top borrowers — Bar chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Top Borrowers
              </h3>
              <p className="text-xs text-slate-400 mb-4">Top {topBorrowersData.length || 0} members by books borrowed</p>
              {topBorrowersData.length === 0 ? (
                <div className="h-[230px] flex items-center justify-center text-xs text-slate-400">No borrowing activity yet</div>
              ) : (
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topBorrowersData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" name="Books Borrowed" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewTarget && (
        <Modal title="Member Details" onClose={() => setViewTarget(null)} maxWidth="max-w-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
              {viewTarget.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{viewTarget.name}</h3>
              <RoleBadge role={viewTarget.role} />
            </div>
          </div>

          <div className="space-y-4 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{viewTarget.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{viewTarget.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Joined On</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(viewTarget.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              onClick={() => { setViewTarget(null); setEditingId(viewTarget._id); setEditRole(viewTarget.role); setEditError(''); }}
              className="btn-secondary flex-1"
            >
              Edit Role
            </button>
            <button onClick={() => setViewTarget(null)} className="btn-primary flex-1">
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
