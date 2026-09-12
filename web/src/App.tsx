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
import ReportsPage from "./features/reports/ReportsPage";
import ServicesPage from "./features/services/ServicesPage";
import ServiceFormPage from "./features/services/ServiceFormPage";
import UsersPage from "./features/users/UsersPage";
import UserFormPage from "./features/users/UserFormPage";

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
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/new" element={<ServiceFormPage />} />
            <Route path="/services/:id/edit" element={<ServiceFormPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<UserFormPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />
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
