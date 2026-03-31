import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar         from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login          from './pages/Login';
import Register       from './pages/Register';
import VerifyEmail    from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Home           from './pages/Home';
import Search         from './pages/Search';
import CreateTrip     from './pages/CreateTrip';
import TripDetail     from './pages/TripDetail';
import Profile        from './pages/Profile';
import PaymentResult  from './pages/PaymentResult';

export default function App() {
  const { loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', color:'var(--green)' }}>CHAUBONDI</span>
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/verify"         element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/payment/:status" element={<PaymentResult />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/"         element={<Home />} />
          <Route path="/search"   element={<Search />} />
          <Route path="/create"   element={<CreateTrip />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/profile"  element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Navbar />
    </>
  );
}
