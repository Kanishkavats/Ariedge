import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CatalogPage from './pages/CatalogPage';
import MemberHomePage from './pages/MemberHomePage';
import MemberBookDetailsPage from './pages/MemberBookDetailsPage';
import MyBorrowsPage from './pages/MyBorrowsPage';
import BrowseBooksPage from './pages/BrowseBooksPage';
import BookIssuedPage from './pages/BookIssuedPage';
import ReturnedBooksPage from './pages/ReturnedBooksPage';
import AdminBooksPage from './pages/AdminBooksPage';
import AdminBorrowsPage from './pages/AdminBorrowsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSearchBooksPage from './pages/AdminSearchBooksPage';
import AdminBookDetailsPage from './pages/AdminBookDetailsPage';
import AdminMembersPage from './pages/AdminMembersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import MemberLayout from './components/MemberLayout';
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/catalog" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/home'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

      {/* Member Routes — use MemberLayout (sidebar) */}
      <Route element={<PrivateRoute><MemberLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<MemberHomePage />} />
        <Route path="/browse" element={<BrowseBooksPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/book/:id" element={<MemberBookDetailsPage />} />
        <Route path="/my-borrows" element={<MyBorrowsPage />} />
        <Route path="/issued" element={<BookIssuedPage />} />
        <Route path="/returned" element={<ReturnedBooksPage />} />
      </Route>

      {/* Admin Routes — use AdminLayout */}
      <Route element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/search" element={<AdminSearchBooksPage />} />
        <Route path="/admin/books" element={<AdminBooksPage />} />
        <Route path="/admin/books/new" element={<AdminBooksPage />} />
        <Route path="/admin/books/details/:id" element={<AdminBookDetailsPage />} />
        <Route path="/admin/borrows" element={<AdminBorrowsPage />} />
        <Route path="/admin/members" element={<AdminMembersPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  );
}
