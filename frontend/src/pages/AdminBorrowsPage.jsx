import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { Eye, Pencil, Trash2, PieChart as PieChartIcon, BarChart3, Users } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

function DueBadge({ borrow }) {
  if (borrow.status === 'returned') {
    return <span className="badge-green badge">Returned</span>;
  }
  if (borrow.isOverdue) {
    return <span className="badge-red badge">Overdue</span>;
  }
  return <span className="badge-blue badge">Active</span>;
}

export default function AdminBorrowsPage() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editDueAt, setEditDueAt] = useState('');
  const [editStatus, setEditStatus] = useState('borrowed');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/borrows');
      setBorrows(res.data.data.borrows);
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

  const openEdit = (borrow) => {
    setEditTarget(borrow);
    setEditDueAt(toDateInputValue(borrow.dueAt));
    setEditStatus(borrow.status);
    setEditError('');
    setBanner({ type: '', text: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      await api.patch(`/borrows/${editTarget._id}`, { dueAt: editDueAt, status: editStatus });
      setEditTarget(null);
      setBanner({ type: 'success', text: 'Borrow record updated.' });
      fetchBorrows();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/borrows/${deleteTarget._id}`);
      setDeleteTarget(null);
      setBanner({ type: 'success', text: 'Borrow record deleted.' });
      fetchBorrows();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Derived chart data (from the currently loaded borrows, real & dynamic) ──
  const activeCount = borrows.filter((b) => b.status === 'borrowed' && !b.isOverdue).length;
  const overdueCount = borrows.filter((b) => b.status === 'borrowed' && b.isOverdue).length;
  const returnedCount = borrows.filter((b) => b.status === 'returned').length;
  const statusPieData = [
    { name: 'Active', value: activeCount, color: '#3b82f6' },
    { name: 'Overdue', value: overdueCount, color: '#ef4444' },
    { name: 'Returned', value: returnedCount, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const bookCounts = {};
  borrows.forEach((b) => {
    const title = b.book?.title || 'Unknown';
    bookCounts[title] = (bookCounts[title] || 0) + 1;
  });
  const topBooksData = Object.entries(bookCounts)
    .map(([name, count]) => ({ name: name.length > 14 ? `${name.slice(0, 14)}…` : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const memberCounts = {};
  borrows.forEach((b) => {
    const name = b.user?.name || 'Unknown';
    memberCounts[name] = (memberCounts[name] || 0) + 1;
  });
  const topMembersData = Object.entries(memberCounts)
    .map(([name, count]) => ({ name: name.length > 14 ? `${name.slice(0, 14)}…` : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Borrowing Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track all borrowing activity across the library</p>
        </div>
      </div>

      {banner.text && <Alert type={banner.type} message={banner.text} />}
      {fetchError && <Alert type="error" message={fetchError} />}

      {loading ? (
        <LoadingSpinner />
      ) : borrows.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="font-medium text-slate-500">No borrowing records found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-slate-600">Member</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Book</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Borrowed On</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Due/Returned Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {borrows.map((borrow) => (
                  <tr key={borrow._id} className={`hover:bg-slate-50/60 transition-colors ${borrow.isOverdue && borrow.status !== 'returned' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{borrow.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{borrow.user?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">{borrow.book?.title || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{borrow.book?.author || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(borrow.borrowedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {borrow.status === 'returned' && borrow.returnedAt ? (
                        <span>{formatDate(borrow.returnedAt)}</span>
                      ) : (
                        <span className={borrow.isOverdue ? 'text-red-600 font-medium' : ''}>
                          {formatDate(borrow.dueAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DueBadge borrow={borrow} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewTarget(borrow)}
                          title="View details"
                          className="btn-secondary btn-sm !p-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(borrow)}
                          title="Edit"
                          className="btn-secondary btn-sm !p-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(borrow); setBanner({ type: '', text: '' }); }}
                          title="Delete"
                          className="btn-danger btn-sm !p-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Borrowing Analytics ── */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Borrowing Analytics</h2>
        <p className="text-sm text-slate-500 mb-5">Live charts computed from your current borrowing records</p>

        {!loading && borrows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
            No borrowing activity yet — analytics will appear here once books are borrowed.
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status distribution — Pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Status Distribution
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{borrows.length}</span>
                </div>
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {statusPieData.map((entry, index) => <Cell key={`st-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                {statusPieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs text-slate-600">{item.name}: <span className="font-bold">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most borrowed books — Bar chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Most Borrowed Books
              </h3>
              <p className="text-xs text-slate-400 mb-4">Top {topBooksData.length} by borrow count</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBooksData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" name="Borrows" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most active members — Bar chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-indigo-500" />
                Most Active Members
              </h3>
              <p className="text-xs text-slate-400 mb-4">Top {topMembersData.length} by borrow count</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMembersData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" name="Borrows" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewTarget && (
        <Modal title="Transaction Details" onClose={() => setViewTarget(null)} maxWidth="max-w-md">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-1">Member</p>
              <p className="font-semibold text-slate-800">{viewTarget.user?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{viewTarget.user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Book</p>
              <p className="font-semibold text-slate-800">{viewTarget.book?.title || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{viewTarget.book?.author} {viewTarget.book?.genre ? `· ${viewTarget.book.genre}` : ''}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Borrowed On</p>
                <p className="font-medium text-slate-700">{formatDate(viewTarget.borrowedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Due Date</p>
                <p className="font-medium text-slate-700">{formatDate(viewTarget.dueAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Return Date</p>
                <p className="font-medium text-slate-700">{formatDate(viewTarget.returnedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <DueBadge borrow={viewTarget} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <Modal title="Edit Borrow Record" onClose={() => setEditTarget(null)} maxWidth="max-w-md">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && <Alert type="error" message={editError} />}
            <div>
              <p className="text-xs text-slate-400 mb-1">Member</p>
              <p className="font-medium text-slate-700 text-sm">{editTarget.user?.name} — {editTarget.book?.title}</p>
            </div>
            <div>
              <label className="form-label" htmlFor="edit-due-date">Due Date</label>
              <input
                id="edit-due-date"
                type="date"
                className="form-input"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                className="form-input"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="borrowed">Borrowed (Active)</option>
                <option value="returned">Returned</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Changing status automatically adjusts the book's available copies.
              </p>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={editLoading}>
              {editLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <Modal title="Delete Borrow Record" onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-600 mb-5">
            Are you sure you want to delete this borrow record for{' '}
            <span className="font-semibold text-slate-800">"{deleteTarget.book?.title}"</span>
            {' '}({deleteTarget.user?.name})?
            {deleteTarget.status === 'borrowed' && ' The book\'s available copy will be released back to the catalog.'}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1" disabled={deleteLoading}>
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn-danger flex-1" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
