// Token check + optional roles={["CLIENT"]}; redirects to /login or shows 403.

import { useAuthStore } from "@/store/auth";
import { Role } from "@/types/models";
import { Navigate, Outlet } from "react-router-dom";
import NotFound from "@/pages/NotFound";
type Props = {
  roles?: Role[];
};

export const ProtectedRoute: React.FC<Props> = ({ roles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <NotFound code={403} />;
  }

  return <Outlet />;
};
