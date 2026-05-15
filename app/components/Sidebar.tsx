"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "../lib/role-context";
import { useAuth } from "../lib/auth-context";

import { useMobile } from "../lib/mobile-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: "ri-layout-grid-line", admin: false },
  { href: "/transactions", label: "Transactions", icon: "ri-exchange-line", admin: false },
  { href: "/inventory", label: "Inventory", icon: "ri-archive-line", admin: false },
  { href: "/sites", label: "Sites", icon: "ri-map-pin-line", admin: false },
  { href: "/invoices", label: "Invoices", icon: "ri-file-paper-2-line", admin: false },
  { href: "/quotations", label: "Quotations", icon: "ri-price-tag-3-line", admin: false },
  { href: "/contacts", label: "Contacts", icon: "ri-contacts-book-line", admin: false },
  { href: "/cash-flow", label: "Cash Flow", icon: "ri-water-flash-line", admin: true },
  { href: "/reports", label: "Reports", icon: "ri-stack-line", admin: true },
  { href: "/ai-insights", label: "AI Insights", icon: "ri-sparkling-2-line", admin: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const { logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useMobile();

  const Content = (
    <div className="flex flex-col px-4 py-6 bg-white h-full border-r border-line">
      <div className="px-2 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: "#b8893d" }}
          >
            <img 
              src="/assets/logo.jpeg" 
              alt="NIPANA Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-display text-[17px] leading-tight text-ink">
              NIPANA
            </div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-ink-muted">
              Atlas · GBMS
            </div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-ink-faint hover:text-ink transition">
          <i className="ri-close-line text-2xl" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          if (item.admin && !isAdmin) return null;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-auto">
        <div className="divider-rule mb-4" />
        <Link href="/profile" onClick={() => setSidebarOpen(false)} className={`nav-item ${pathname?.startsWith("/profile") ? "active" : ""}`}>
          <i className="ri-user-3-line" />
          <span>Profile</span>
        </Link>
        {isAdmin && (
          <>
            <Link href="/users" onClick={() => setSidebarOpen(false)} className={`nav-item ${pathname?.startsWith("/users") ? "active" : ""}`}>
              <i className="ri-group-line" />
              <span>Users</span>
            </Link>
            <Link href="/settings" onClick={() => setSidebarOpen(false)} className={`nav-item ${pathname?.startsWith("/settings") ? "active" : ""}`}>
              <i className="ri-settings-3-line" />
              <span>Settings</span>
            </Link>
          </>
        )}
        <button onClick={logout} className="nav-item w-full text-left">
          <i className="ri-logout-circle-r-line" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 hidden md:block h-screen sticky top-0">
        {Content}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`mobile-drawer md:hidden ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}>
        <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
          {Content}
        </div>
      </div>
    </>
  );
}
