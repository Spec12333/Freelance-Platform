import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import MyProfile from "./pages/MyProfile";
import Freelancers from "./pages/Freelancers";
import FreelancerProfile from "./pages/FreelancerProfile";
import EditOrder from "./pages/EditOrder";
import CreateOrder from "./pages/CreateOrder";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
// All <Route> definitions: public (Login, Register) and ProtectedRoute-wrapped ones inside Layout.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Open to everyone */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Signed-in users only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/freelancers" element={<Freelancers />} />
            <Route path="/freelancers/:id" element={<FreelancerProfile />} />

            {/* Clients Only */}
            <Route element={<ProtectedRoute roles={["CLIENT"]} />}>
              <Route path="/orders/new" element={<CreateOrder />} />
              <Route path="/orders/:id/edit" element={<EditOrder />} />
            </Route>

            {/* Freelancers only */}
            <Route element={<ProtectedRoute roles={["FREELANCER"]} />}>
              <Route path="/profile" element={<MyProfile />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
