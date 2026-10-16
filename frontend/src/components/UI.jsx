import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageCircle,
  LoaderCircle,
  Image,
  Search,
  X,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useShop } from "../context/ShopContext";
import { whatsappUrl, money } from "../utils/whatsapp";
export function Logo({ small = false }) {
  return (
    <span className={`brand brand-logo ${small ? "brand-small" : ""}`}>
      <img
        className="brand-image"
        src="/images/logo.jpg"
        alt=""
        width="2048"
        height="2048"
      />
      <span className="brand-caption">HoneyBee Gifts &amp; Designs</span>
    </span>
  );
}
export function ProductSkeleton({ count = 4 }) {
  return (
    <div
      className="frame-grid skeleton-grid"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton" key={index} aria-hidden="true">
          <div className="skeleton skeleton-image" />
          <div className="skeleton-copy">
            <span className="skeleton skeleton-short" />
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-short" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
export function LoadingSpinner({ label = "Loading collection…" }) {
  return (
    <div className="state-block" role="status">
      <LoaderCircle className="spinner" size={26} />
      <p>{label}</p>
    </div>
  );
}
export function EmptyState({
  title = "Something beautiful is on its way.",
  children,
  compact = false,
}) {
  return (
    <div className={"state-block empty-state " + (compact ? "compact" : "")}>
      <span className="state-icon">
        <Image size={28} />
      </span>
      <h3>{title}</h3>
      <p>
        {children ||
          "Our collection is being curated. Please visit again soon."}
      </p>
    </div>
  );
}
export function ErrorMessage({ message, retry }) {
  return message ? (
    <div className="error-message" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  ) : null;
}
export function SuccessMessage({ children }) {
  return children ? (
    <div className="success-message" role="status">
      <Check size={18} />
      {children}
    </div>
  ) : null;
}
export function WhatsAppButton({
  frame,
  size,
  gift = false,
  className = "",
  children,
}) {
  const { settings } = useShop();
  const url = whatsappUrl(
    settings.whatsappNumber,
    frame,
    size,
    window.location.origin,
    settings.shopName,
    gift ? "gift" : "frame",
  );
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={"button whatsapp " + className}
    >
      <MessageCircle size={17} />
      {children || "Order via WhatsApp"}
    </a>
  ) : (
    <button
      className={"button whatsapp " + className}
      disabled
      title="WhatsApp enquiries will be available soon"
    >
      <MessageCircle size={17} />
      {children || "WhatsApp coming soon"}
    </button>
  );
}
export function FrameCard({ frame, gift = false }) {
  const image = frame.images?.[0];
  const path = gift ? "/gifts/" : "/frames/";
  return (
    <article className="frame-card">
      <Link to={path + frame.id} className="frame-card-image">
        {image ? (
          <img src={image.imageUrl} alt={frame.name} loading="lazy" />
        ) : (
          <Image size={42} />
        )}
        <span
          className={"availability " + (!frame.available ? "unavailable" : "")}
        >
          {frame.available ? "Available" : "Currently unavailable"}
        </span>
        <span className="image-arrow">
          <ArrowRight size={20} />
        </span>
      </Link>
      <div className="frame-card-content">
        <div className="eyebrow">{frame.category.name}</div>
        <h3>
          <Link to={path + frame.id}>{frame.name}</Link>
        </h3>
        <div className={"product-meta" + (gift ? " gift-product-meta" : "")}>
          {!gift && <span>{frame.size}</span>}
          <strong>{money(frame.price)}</strong>
        </div>
        <div className="card-actions">
          <Link
            className="button button-outline button-small"
            to={path + frame.id}
          >
            View details <ArrowRight size={14} />
          </Link>
          <WhatsAppButton frame={frame} gift={gift} className="button-small" />
        </div>
      </div>
    </article>
  );
}
export function FrameGrid({ frames, gift = false }) {
  return (
    <div className="frame-grid">
      {frames.map((f) => (
        <FrameCard key={f.id} frame={f} gift={gift} />
      ))}
    </div>
  );
}
export function CategoryCard({ category, index = 0, gift = false }) {
  return (
    <Link
      className={"category-card tone-" + (index % 4)}
      to={(gift ? "/gifts?category=" : "/frames?category=") + category.id}
    >
      <div className="category-image">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} loading="lazy" />
        ) : (
          <span className="mini-frame">
            <Image size={35} strokeWidth={1} />
          </span>
        )}
        <span className="category-number">0{index + 1}</span>
      </div>
      <div>
        <h3>{category.name}</h3>
        <ArrowRight size={21} />
      </div>
      <p>
        {category.description ||
          (gift
            ? "Thoughtful finds for every occasion."
            : "A beautiful home for your memories.")}
      </p>
    </Link>
  );
}
export function SearchBar({ value, onChange, kind = "frames" }) {
  return (
    <div className="search-input">
      <Search size={19} />
      <input
        aria-label={"Search " + kind}
        placeholder={
          kind === "gifts"
            ? "Find a thoughtful gift…"
            : "Find your perfect frame…"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function FilterBar({
  categories,
  category,
  setCategory,
  sort,
  setSort,
  kind = "frames",
}) {
  return (
    <div className="filter-bar">
      <div
        className="category-chips"
        role="group"
        aria-label="Filter by category"
      >
        <button
          className={!category ? "active" : ""}
          aria-pressed={!category}
          onClick={() => setCategory("")}
        >
          All {kind}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={String(category) === String(c.id) ? "active" : ""}
            aria-pressed={String(category) === String(c.id)}
            onClick={() => setCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>
      <label className="sort-control">
        Sort by{" "}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label={"Sort " + kind}
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
    </div>
  );
}
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages < 2) return null;
  return (
    <nav className="pagination" aria-label="Catalog pages">
      <button
        className="button button-outline"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={17} /> Previous
      </button>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <button
        className="button button-outline"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight size={17} />
      </button>
    </nav>
  );
}
export function Field({ label, error, children, hint }) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
      {hint && <small>{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function DeleteConfirmationModal({
  title,
  description,
  busy,
  error,
  onClose,
  onConfirm,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-title">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close confirmation"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p>{description}</p>
      <ErrorMessage message={error} />
      <div className="dialog-actions">
        <button
          className="button button-outline"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="button button-danger"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </dialog>
  );
}
