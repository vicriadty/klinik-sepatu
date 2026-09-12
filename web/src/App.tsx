import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RequireAuth from "./features/auth/RequireAuth";
import PlaceholderPage from "./pages/PlaceholderPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionListPage from "./features/transactions/TransactionListPage";
import TransactionDetailPage from "./features/transactions/TransactionDetailPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<SignIn />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionListPage />} />
            <Route
              path="/transactions/:id"
              element={<TransactionDetailPage />}
            />
            <Route
              path="/reports"
              element={
                <PlaceholderPage
                  title="Laporan"
                  description="Laporan transaksi, revenue, layanan, dan customer."
                />
              }
            />
            <Route
              path="/services"
              element={
                <PlaceholderPage
                  title="Layanan"
                  description="Kelola kategori, layanan, dan harga."
                />
              }
            />
            <Route
              path="/users"
              element={
                <PlaceholderPage
                  title="Pengguna"
                  description="Kelola akun Owner, Admin, dan Kasir."
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Pengaturan"
                  description="Profil toko dan konfigurasi notifikasi."
                />
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
