import LoginPage from "./components/pages/login.jsx";
import RegisterPage from "./components/pages/register.jsx";
import HomePage from "./components/pages/HomePage.jsx";
import ProductDetailPage from "./components/pages/ProductDetailPage.jsx";
import SearchPage from "./components/pages/SearchPage.jsx";
import CartPage from "./components/pages/CartPage.jsx";
import CheckoutPage from "./components/pages/CheckoutPage.jsx";
import OrdersPage from "./components/pages/OrdersPage.jsx";
import OrderDetailPage from "./components/pages/OrderDetailPage.jsx";
import VendorDashboardPage from "./components/pages/VendorDashboardPage.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AuthGuard from "./components/AuthGuard.jsx";
import { ProductProvider } from "./components/context/ProductContext.jsx";
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from "./components/layout/AppLayout.jsx";

const PrivateLayout = ({ children }) => (
  <PrivateRoute>
    <AppLayout>{children}</AppLayout>
  </PrivateRoute>
);

function App() {
  return (
    <ProductProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/user/dashboard" element={<Navigate to="/home" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout>
                <VendorDashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route 
          path="/home" 
          element={
            <PrivateLayout>
              <HomePage />
            </PrivateLayout>
          } 
        />
        <Route 
          path="/login" 
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthGuard>
              <RegisterPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="/product/:id" 
          element={
            <PrivateLayout>
              <ProductDetailPage />
            </PrivateLayout>
          } 
        />
        <Route 
          path="/search" 
          element={
            <PrivateLayout>
              <SearchPage />
            </PrivateLayout>
          } 
        />
        <Route
          path="/cart"
          element={
            <PrivateLayout>
              <CartPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateLayout>
              <CheckoutPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateLayout>
              <OrdersPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <PrivateLayout>
              <OrderDetailPage />
            </PrivateLayout>
          }
        />
      </Routes>
    </ProductProvider>
  );
}

export default App
