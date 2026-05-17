import LoginPage from "./components/pages/login.jsx";
import RegisterPage from "./components/pages/register.jsx";
import HomePage from "./components/pages/HomePage.jsx";
import ProductDetailPage from "./components/pages/ProductDetailPage.jsx";
import SearchPage from "./components/pages/SearchPage.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AuthGuard from "./components/AuthGuard.jsx";
import { ProductProvider } from "./components/context/ProductContext.jsx";
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <ProductProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route 
          path="/home" 
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
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
            <PrivateRoute>
              <ProductDetailPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/search" 
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </ProductProvider>
  );
}

export default App