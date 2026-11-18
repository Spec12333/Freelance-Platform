// Navbar + <Outlet /> + shared page container.

import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-10 sm:py-10">
        <Outlet />
      </main>
      <footer className="mt-10 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-gray-400 sm:px-10"><p>© {new Date().getFullYear()} FreelanceHub</p><p>Independent talent. Shared ambition.</p></div>
      </footer>
    </div>
  );
}
