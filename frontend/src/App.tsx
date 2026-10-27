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
// All <Route> definitions: public (Login, Register) and ProtectedRoute-wrapped ones inside Layout.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-details" element={<OrderDetails />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/freelancers" element={<Freelancers />} />
        <Route path="/freelancer-profile" element={<FreelancerProfile />} />
        <Route path="/edit-order" element={<EditOrder />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-order" element={<CreateOrder />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
