import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Tables from "../pages/admin/Table";
import Login from "../pages/admin/Login";
import MenuCategories from "../pages/admin/MenuCategories";
import ProtectedRoute from "./ProtectedRoute";
import MenuItems from "../pages/admin/MenuItems";
import CustomerMenuPage from "../pages/customer/CustomerMenuPage";
import CustomerLayout from "../layouts/CustomerLayout";
import CustomerItemDetailPage from "../pages/customer/CustomerMenuDetail";
import CustomerLoginPage from "../pages/customer/CustomerLogin";
import CustomerRegisterPage from "../pages/customer/CustomerRegister";
import AccountsPage from "../pages/admin/AccountsPage";
import StaffLayout from "../layouts/StaffLayout";
import MonitorWaiterLayout from "../pages/staff/waiter/MonitorWaiterLayout";
import MonitorWaiterOrdersPage from "../pages/staff/waiter/MonitorWaiterOrdersPage";
import MonitorWaiterBillsPage from "../pages/staff/waiter/MonitorWaiterBillsPage";
import MonitorKdsPage from "../pages/staff/kds/MonitorKdsPage";

export default function AppRoute() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<CustomerRegisterPage />} />
        <Route path="/customer/menu" element={<CustomerMenuPage />} />
        <Route path="/customer/menu/:id" element={<CustomerItemDetailPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/menu/categories" element={<MenuCategories />} />
        <Route path="/menu/items" element={<MenuItems />} />
        <Route path="/accounts" element={<AccountsPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/monitor/waiter" element={<MonitorWaiterLayout />}>
          <Route index element={<Navigate to="/monitor/waiter/orders" replace />} />
          <Route path="orders" element={<MonitorWaiterOrdersPage />} />
          <Route path="bills" element={<MonitorWaiterBillsPage />} />
        </Route>
        <Route path="/monitor/kds" element={<MonitorKdsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
