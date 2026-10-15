import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight, Heart } from "lucide-react";
import { Logo, WhatsAppButton } from "./UI";
const links = [
  ["/", "Home"],
  ["/frames", "All Frames"],
  ["/gifts", "All Gifts"],
  ["/categories", "Categories"],
  ["/contact", "Contact Us"],
];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useRef(null);
  const toggle = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const oldOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1101px)");
    const resized = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", resized);
    return () => {
      element.close();
      document.body.style.overflow = oldOverflow;
      media.removeEventListener("change", resized);
      toggle.current?.focus();
    };
  }, [open]);
  return (
    <>
      <div className="announcement">
        <span>
          <Heart size={13} /> A little thought. A lifetime of memories.
        </span>
        <Link to="/contact">
          Made personal, with HoneyBee <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link to="/" aria-label="HoneyBee Gifts & Frames home">
            <Logo />
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <WhatsAppButton className="nav-whatsapp">
              Let's talk <ArrowUpRight size={15} />
            </WhatsAppButton>
            <button
              ref={toggle}
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <dialog
          ref={dialog}
          className="mobile-menu"
          aria-label="Site menu"
          onCancel={() => setOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mobile-menu-heading">
            <Logo small />
            <button
              className="icon-button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="mobile-nav"
          >
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
              >
                {label}
                <ArrowUpRight size={18} />
              </NavLink>
            ))}
          </nav>
          <div className="mobile-menu-contact">
            <p>Something special in mind?</p>
            <WhatsAppButton className="button-gold">
              Let's make it personal
            </WhatsAppButton>
          </div>
        </dialog>
      )}
    </>
  );
}
