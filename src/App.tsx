import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import HealthNewsPage from './pages/HealthNewsPage';
import HealthNewsDbPage from './pages/HealthNewsDbPage';
import AdminDashboard from './pages/AdminDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import CheckoutPage from './pages/CheckoutPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminLoginPage from './pages/AdminLoginPage';
import PharmacistLoginPage from './pages/PharmacistLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ArticleDetail from './pages/HealthNewsDetailPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PharmacistChat from './pages/PharmacistChat';
import GlobalChat from './components/GlobalChat';
// Import the new page

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin-login" element={<AdminLoginPage />} />
                  <Route path="/pharmacist-login" element={<PharmacistLoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/health-news" element={<HealthNewsPage />} />
                  <Route path="/health-news-db" element={<HealthNewsDbPage />} /> 
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/article-detail" element={<ArticleDetail />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <AccountPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/delete-account"
                    element={
                      <ProtectedRoute>
                        <DeleteAccountPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Dashboard */}
                  <Route
                    path="/admin"
                    element={
                      <RoleProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Pharmacist Dashboard */}
                  <Route
                    path="/pharmacist"
                    element={
                      <RoleProtectedRoute roles={['pharmacist']}>
                        <PharmacistDashboard />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/pharmacist/chat"
                    element={
                      <RoleProtectedRoute roles={['pharmacist']}>
                        <PharmacistChat />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Redirect to home for unknown routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <GlobalChat />
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
