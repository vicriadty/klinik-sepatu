import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RequireAuth from "./features/auth/RequireAuth";
import PlaceholderPage from "./pages/PlaceholderPage";

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
            <Route
              path="/dashboard"
              element={
                <PlaceholderPage
                  title="Dashboard"
                  description="Ringkasan performa toko hari ini."
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <PlaceholderPage
                  title="Transaksi"
                  description="Daftar dan detail transaksi order."
                />
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <PlaceholderPage
                  title="Detail Transaksi"
                  description="Rincian order, pembayaran, dan status."
                />
              }
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
