import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../utils/useResource";
import { api, errorText, fieldErrors } from "../services/api";
import {
  Field,
  ErrorMessage,
  LoadingSpinner,
  SuccessMessage,
  DeleteConfirmationModal,
} from "../components/UI";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};
const pageSize = 8;
const joinedDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";

function AdminEditor({ admin, onClose, onSaved }) {
  const dialog = useRef(null);
  const { user, refresh } = useAuth();
  const [form, setForm] = useState(
    admin
      ? { ...emptyForm, username: admin.username, email: admin.email }
      : emptyForm,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector('input[name="username"]')?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const change = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setError("");
  };
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setErrors({});
    if (form.password !== form.confirmPassword)
      return setErrors({ confirmPassword: "Passwords do not match." });
    if (new TextEncoder().encode(form.password).length > 72)
      return setErrors({
        password: "Use at most 72 UTF-8 bytes for the password.",
      });
    setBusy(true);
    try {
      const body = {
        username: form.username.trim(),
        email: form.email.trim(),
        ...(form.password ? { password: form.password } : {}),
      };
      if (admin) await api.put(`/admin/admins/${admin.id}`, body);
      else await api.post("/admin/admins", body);
      onSaved(
        admin
          ? `Admin ${body.username} updated successfully.`
          : `Admin ${body.username} added. They can now sign in.`,
      );
      if (admin?.username === user.username) await refresh();
    } catch (e) {
      setError(errorText(e));
      setErrors(fieldErrors(e));
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      className="admin-editor-dialog"
      aria-labelledby="admin-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="admin-editor-heading">
        <span className="admin-editor-icon">
          <ShieldCheck size={23} />
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Close admin form"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="eyebrow">TEAM & ACCESS</div>
        <h2 id="admin-editor-title">
          {admin ? "Edit admin" : "Add a new admin"}
        </h2>
        <p>
          {admin
            ? "Keep account details up to date and manage sign-in."
            : "Give someone you trust a place on your team."}
        </p>
      </div>
      <form onSubmit={save}>
        <div className="admin-editor-body">
          <ErrorMessage message={error} />
          <fieldset className="admin-account-fields" disabled={busy}>
            <div className="admin-editor-fields">
              <Field
                label="Username *"
                error={errors.username}
                hint="Letters, numbers, dots, underscores or hyphens."
              >
                <input
                  name="username"
                  autoComplete="off"
                  autoFocus
                  required
                  minLength={3}
                  maxLength={100}
                  pattern="[a-zA-Z0-9_.\-]{3,100}"
                  placeholder="e.g. alex.smith"
                  value={form.username}
                  onChange={(e) => change("username", e.target.value)}
                />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  maxLength={254}
                  placeholder="alex@example.com"
                  value={form.email}
                  onChange={(e) => change("email", e.target.value)}
                />
              </Field>
            </div>
            <div className="admin-password-heading">
              <h3>Account security</h3>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {admin && (
              <p className="admin-password-note">
                Leave the password fields empty to keep the current password.
              </p>
            )}
            <div className="admin-editor-fields">
              <Field
                label={admin ? "New password" : "Password *"}
                error={errors.password}
                hint="At least 8 characters, up to 72 UTF-8 bytes."
              >
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required={!admin}
                  minLength={8}
                  maxLength={72}
                  placeholder={
                    admin ? "Enter a new password" : "Create a strong password"
                  }
                  value={form.password}
                  onChange={(e) => change("password", e.target.value)}
                />
              </Field>
              <Field
                label={admin ? "Confirm new password" : "Confirm password *"}
                error={errors.confirmPassword}
              >
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required={!admin || Boolean(form.password)}
                  minLength={8}
                  maxLength={72}
                  placeholder="Repeat the password"
                  value={form.confirmPassword}
                  onChange={(e) => change("confirmPassword", e.target.value)}
                />
              </Field>
            </div>
          </fieldset>
          <div className="admin-access-notice">
            <ShieldCheck size={18} />
            <div>
              <strong>Administrator access</strong>
              <p>
                Can manage frames, gifts, categories, shop settings and other
                admins.
              </p>
            </div>
          </div>
        </div>
        <div className="admin-editor-footer">
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-gold" disabled={busy}>
            {admin ? <Check size={17} /> : <Plus size={17} />}
            {busy ? "Saving…" : admin ? "Save changes" : "Create admin"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function AdminManagement() {
  const resource = useResource("/admin/admins");
  const { user } = useAuth();
  const [editor, setEditor] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const admins = resource.data || [];
  const filtered = admins.filter((admin) =>
    `${admin.username} ${admin.email}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  const openEditor = (admin = null) => {
    setSuccess("");
    setEditor({ admin });
  };
  const remove = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/admin/admins/${target.id}`);
      setSuccess(`Admin ${target.username} deleted.`);
      setTarget(null);
      resource.reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-management">
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow">YOUR PEOPLE. YOUR SHOP.</div>
          <h1>Admin Management</h1>
          <p>A trusted team behind every beautiful detail.</p>
        </div>
        <div className="admin-team-mark">
          <ShieldCheck size={18} />
          <span>Secure team access</span>
        </div>
      </div>
      <SuccessMessage>{success}</SuccessMessage>
      <section className="admin-directory" aria-label="Admin accounts">
        <div className="admin-directory-toolbar">
          <div className="admin-directory-title">
            <span className="admin-directory-icon">
              <Users size={20} />
            </span>
            <div>
              <h2>
                Admin list <span>{admins.length}</span>
              </h2>
              <p>The people who help your shop thrive.</p>
            </div>
          </div>
          <div className="admin-directory-controls">
            <div className="admin-directory-search">
              <Search size={17} />
              <input
                type="search"
                aria-label="Search admins"
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <button className="button button-gold" onClick={() => openEditor()}>
              <Plus size={18} />
              Add Admin
            </button>
          </div>
        </div>
        {resource.loading ? (
          <LoadingSpinner label="Loading admins…" />
        ) : resource.error ? (
          <ErrorMessage message={resource.error} retry={resource.reload} />
        ) : filtered.length ? (
          <div className="admin-directory-table-wrap">
            <table className="admin-directory-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Admin</th>
                  <th scope="col">Access</th>
                  <th scope="col">Date added</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((admin, index) => {
                  const self =
                    admin.username.toLowerCase() ===
                    user.username.toLowerCase();
                  const cannotDelete = self || admins.length <= 1;
                  return (
                    <tr key={admin.id}>
                      <td className="admin-row-number">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="admin-identity-cell">
                        <div className="admin-directory-person">
                          <span
                            className={`admin-person-avatar admin-person-tone-${admin.id % 4}`}
                          >
                            {admin.username.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <h3>
                              {admin.username}
                              {self && (
                                <span className="admin-you-tag">You</span>
                              )}
                            </h3>
                            <p>{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-access-cell">
                        <span className="admin-access-badge">
                          <ShieldCheck size={14} />
                          Full access
                        </span>
                      </td>
                      <td className="admin-date-cell">
                        <span className="admin-mobile-label">Added </span>
                        {joinedDate(admin.createdAt)}
                      </td>
                      <td className="admin-actions-cell">
                        <div className="admin-directory-actions">
                          <button
                            className="admin-edit-button"
                            disabled={busy}
                            aria-label={`Edit admin ${admin.username}`}
                            onClick={() => openEditor(admin)}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                          <button
                            className="admin-delete-button"
                            disabled={busy || cannotDelete}
                            aria-label={`Delete admin ${admin.username}`}
                            title={
                              self
                                ? "You cannot delete your own account"
                                : cannotDelete
                                  ? "The last admin cannot be deleted"
                                  : "Delete admin"
                            }
                            onClick={() => {
                              setTarget(admin);
                              setError("");
                              setSuccess("");
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-directory-empty">
            <Search size={29} />
            <h3>No admins found</h3>
            <p>Try another name or email address.</p>
            <button
              className="text-link"
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
            >
              Clear search <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="admin-directory-footer">
          <span>
            {resource.loading
              ? "Loading accounts…"
              : `Showing ${filtered.length ? currentPage * pageSize + 1 : 0}–${Math.min((currentPage + 1) * pageSize, filtered.length)} of ${filtered.length} admins`}
          </span>
          <div>
            <button
              aria-label="Previous admin page"
              disabled={currentPage === 0 || resource.loading}
              onClick={() => setPage(currentPage - 1)}
            >
              <ArrowLeft size={15} />
            </button>
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              aria-label="Next admin page"
              disabled={currentPage + 1 >= totalPages || resource.loading}
              onClick={() => setPage(currentPage + 1)}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
      <p className="admin-directory-footnote">
        <ShieldCheck size={15} />
        Your account and the last admin are protected from deletion.
      </p>
      {editor && (
        <AdminEditor
          admin={editor.admin}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null);
            setSuccess(message);
            resource.reload();
          }}
        />
      )}
      {target && (
        <DeleteConfirmationModal
          title="Delete this admin?"
          description={`Admin ${target.username} will lose access and be signed out. This cannot be undone.`}
          busy={busy}
          error={error}
          onClose={() => {
            setTarget(null);
            setError("");
          }}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
