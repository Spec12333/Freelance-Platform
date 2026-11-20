import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import FreelancerProfile from "./pages/FreelancerProfile";
import EditOrder from "./pages/EditOrder";
import CreateOrder from "./pages/CreateOrder";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { useAuthInit } from "./hooks/useAuthInit";
import Spinner from "./components/ui/Spinner";
import ErrorMessage from "./components/ui/ErrorMessage";

// Load workspace pages only when their routes are opened.
const Freelancers = lazy(() => import("./pages/Freelancers"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));

// All <Route> definitions: public (Login, Register) and ProtectedRoute-wrapped ones inside Layout.
export default function App() {
  const { isChecking, error, retry } = useAuthInit();

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <ErrorMessage
          title="Unable to check your session"
          message={error}
          onRetry={retry}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Open to everyone */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Signed-in users only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Suspense fallback={<div className="card p-10"><Spinner label="Opening your workspace…" /></div>}><Dashboard /></Suspense>} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/freelancers" element={<Suspense fallback={<div className="card p-10"><Spinner label="Opening the talent directory…" /></div>}><Freelancers /></Suspense>} />
            <Route path="/freelancers/:id" element={<FreelancerProfile />} />

            {/* Clients Only */}
            <Route element={<ProtectedRoute roles={["CLIENT"]} />}>
              <Route path="/orders/new" element={<CreateOrder />} />
              <Route path="/orders/:id/edit" element={<EditOrder />} />
            </Route>

            {/* Freelancers only */}
            <Route element={<ProtectedRoute roles={["FREELANCER"]} />}>
              <Route path="/profile" element={<Suspense fallback={<div className="card p-10"><Spinner label="Opening your profile…" /></div>}><MyProfile /></Suspense>} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin/users" element={<Suspense fallback={<div className="card p-10"><Spinner label="Opening user management…" /></div>}><AdminUsers /></Suspense>} />
              <Route path="/admin/categories" element={<Suspense fallback={<div className="card p-10"><Spinner label="Opening category management…" /></div>}><AdminCategories /></Suspense>} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
