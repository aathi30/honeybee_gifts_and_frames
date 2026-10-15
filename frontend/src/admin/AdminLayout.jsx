import { useEffect, useRef, useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Images,
  Shapes,
  Settings,
  Users,
  Gift,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo, ErrorMessage } from "../components/UI";
import { errorText } from "../services/api";
export function AdminSidebar({ open, onClose, onLogout, busy }) {
  const sidebar = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...sidebar.current.querySelectorAll("a[href], button:not(:disabled)"),
    ];
    focusable()[0]?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open, onClose]);
  const links = [
    ["/admin/dashboard", "Dashboard", LayoutDashboard],
    ["/admin/frames", "Manage Frames", Images],
    ["/admin/frames/add", "Add Frame", PlusCircle],
    ["/admin/categories", "Frame Categories", Shapes],
    ["/admin/gifts", "Manage Gifts", Gift],
    ["/admin/gifts/add", "Add Gift", PlusCircle],
    ["/admin/gift-categories", "Gift categories", Shapes],
    ["/admin/settings", "Shop settings", Settings],
    ["/admin/admins", "Admin Management", Users],
  ];
  return (
    <aside
      ref={sidebar}
      className={"admin-sidebar " + (open ? "open" : "")}
      aria-label="Shop administration"
    >
      {open && (
        <button
          className="sidebar-close icon-button"
          aria-label="Close admin menu"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      )}
      <Link to="/" className="admin-brand">
        <Logo small />
      </Link>
      <span className="eyebrow">YOUR SHOP, BEAUTIFULLY MANAGED</span>
      <nav aria-label="Admin navigation">
        {links.map(([to, label, Icon]) => (
          <NavLink to={to} key={to} end onClick={onClose}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-logout" disabled={busy} onClick={onLogout}>
        <LogOut size={18} />
        {busy ? "Signing out…" : "Logout"}
      </button>
      <Link to="/" className="admin-view-shop">
        View the shop <ArrowUpRight size={17} />
      </Link>
    </aside>
  );
}
export function AdminHeader({ onMenu, onLogout, busy }) {
  const { user } = useAuth();
  return (
    <header className="admin-header">
      <button
        className="menu-toggle"
        aria-label="Toggle admin menu"
        onClick={onMenu}
      >
        <Menu size={23} />
      </button>
      <span>Collection management</span>
      <div>
        <span className="admin-avatar">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span>{user.username}</span>
        <button
          className="icon-button"
          title="Sign out"
          aria-label="Sign out"
          disabled={busy}
          onClick={onLogout}
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const signout = async () => {
    setBusy(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-shell">
      <AdminSidebar
        open={open}
        onClose={() => setOpen(false)}
        onLogout={signout}
        busy={busy}
      />
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <AdminHeader
          onMenu={() => setOpen(!open)}
          onLogout={signout}
          busy={busy}
        />
        <main className="admin-content">
          <ErrorMessage message={error} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
