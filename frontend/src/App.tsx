import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, RequirePermission } from '@/components/layout/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/store/theme';
// public
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { FeaturesPage } from '@/pages/public/FeaturesPage';
import { PricingPage } from '@/pages/public/PricingPage';
import { ContactPage } from '@/pages/public/ContactPage';
// auth
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
// app
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsListPage } from '@/pages/products/ProductsListPage';
import { ProductFormPage } from '@/pages/products/ProductFormPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { CategoriesListPage } from '@/pages/categories/CategoriesListPage';
import { CategoryFormPage } from '@/pages/categories/CategoryFormPage';
import { CustomersListPage } from '@/pages/customers/CustomersListPage';
import { CustomerFormPage } from '@/pages/customers/CustomerFormPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { SuppliersListPage } from '@/pages/suppliers/SuppliersListPage';
import { SupplierFormPage } from '@/pages/suppliers/SupplierFormPage';
import { SupplierDetailPage } from '@/pages/suppliers/SupplierDetailPage';
import { PurchasesListPage, PurchaseFormPage, PurchaseDetailPage } from '@/pages/purchases/PurchasesPages';
import { SalesListPage, SaleFormPage, SaleDetailPage } from '@/pages/sales/SalesPages';
import { ReportsPage } from '@/pages/ReportsPage';
import { UsersListPage } from '@/pages/users/UsersListPage';
import { UserFormPage } from '@/pages/users/UserFormPage';
import { RolesPage } from '@/pages/RolesPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  const init = useAuth((s) => s.init);
  const theme = useTheme((s) => s.theme);
  useEffect(() => { init(); useTheme.getState().setTheme(theme); /* eslint-disable-next-line */ }, []);

  return (
    <Routes>
      {/* Public marketing site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated app */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/products" element={<RequirePermission module="products"><ProductsListPage /></RequirePermission>} />
        <Route path="/products/new" element={<RequirePermission module="products" action="create"><ProductFormPage /></RequirePermission>} />
        <Route path="/products/:id" element={<RequirePermission module="products"><ProductDetailPage /></RequirePermission>} />
        <Route path="/products/:id/edit" element={<RequirePermission module="products" action="update"><ProductFormPage /></RequirePermission>} />

        <Route path="/categories" element={<RequirePermission module="categories"><CategoriesListPage /></RequirePermission>} />
        <Route path="/categories/new" element={<RequirePermission module="categories" action="create"><CategoryFormPage /></RequirePermission>} />
        <Route path="/categories/:id/edit" element={<RequirePermission module="categories" action="update"><CategoryFormPage /></RequirePermission>} />

        <Route path="/customers" element={<RequirePermission module="customers"><CustomersListPage /></RequirePermission>} />
        <Route path="/customers/new" element={<RequirePermission module="customers" action="create"><CustomerFormPage /></RequirePermission>} />
        <Route path="/customers/:id" element={<RequirePermission module="customers"><CustomerDetailPage /></RequirePermission>} />
        <Route path="/customers/:id/edit" element={<RequirePermission module="customers" action="update"><CustomerFormPage /></RequirePermission>} />

        <Route path="/suppliers" element={<RequirePermission module="suppliers"><SuppliersListPage /></RequirePermission>} />
        <Route path="/suppliers/new" element={<RequirePermission module="suppliers" action="create"><SupplierFormPage /></RequirePermission>} />
        <Route path="/suppliers/:id" element={<RequirePermission module="suppliers"><SupplierDetailPage /></RequirePermission>} />
        <Route path="/suppliers/:id/edit" element={<RequirePermission module="suppliers" action="update"><SupplierFormPage /></RequirePermission>} />

        <Route path="/purchases" element={<RequirePermission module="purchases"><PurchasesListPage /></RequirePermission>} />
        <Route path="/purchases/new" element={<RequirePermission module="purchases" action="create"><PurchaseFormPage /></RequirePermission>} />
        <Route path="/purchases/:id" element={<RequirePermission module="purchases"><PurchaseDetailPage /></RequirePermission>} />
        <Route path="/purchases/:id/edit" element={<RequirePermission module="purchases" action="update"><PurchaseFormPage /></RequirePermission>} />

        <Route path="/sales" element={<RequirePermission module="sales"><SalesListPage /></RequirePermission>} />
        <Route path="/sales/new" element={<RequirePermission module="sales" action="create"><SaleFormPage /></RequirePermission>} />
        <Route path="/sales/:id" element={<RequirePermission module="sales"><SaleDetailPage /></RequirePermission>} />
        <Route path="/sales/:id/edit" element={<RequirePermission module="sales" action="update"><SaleFormPage /></RequirePermission>} />

        <Route path="/reports" element={<RequirePermission module="reports"><ReportsPage /></RequirePermission>} />

        <Route path="/users" element={<RequirePermission module="users"><UsersListPage /></RequirePermission>} />
        <Route path="/users/new" element={<RequirePermission module="users" action="create"><UserFormPage /></RequirePermission>} />
        <Route path="/users/:id/edit" element={<RequirePermission module="users" action="update"><UserFormPage /></RequirePermission>} />
        <Route path="/roles" element={<RequirePermission module="users"><RolesPage /></RequirePermission>} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/:section" element={<SettingsPage />} />
        <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
