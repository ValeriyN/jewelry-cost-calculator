import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import "./lib/i18n";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Components from "./pages/Components";
import ComponentForm from "./pages/ComponentForm";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import Settings from "./pages/Settings";
import PublicProduct from "./pages/PublicProduct";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/share/:token" element={<PublicProduct />} />

          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/components" replace />} />
          <Route
            path="/components"
            element={<PrivateRoute><Components /></PrivateRoute>}
          />
          <Route
            path="/components/new"
            element={<PrivateRoute><ComponentForm /></PrivateRoute>}
          />
          <Route
            path="/components/:id/edit"
            element={<PrivateRoute><ComponentForm /></PrivateRoute>}
          />
          <Route
            path="/products"
            element={<PrivateRoute><Products /></PrivateRoute>}
          />
          <Route
            path="/products/new"
            element={<PrivateRoute><ProductForm /></PrivateRoute>}
          />
          <Route
            path="/products/:id"
            element={<PrivateRoute><ProductDetail /></PrivateRoute>}
          />
          <Route
            path="/settings"
            element={<PrivateRoute><Settings /></PrivateRoute>}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
