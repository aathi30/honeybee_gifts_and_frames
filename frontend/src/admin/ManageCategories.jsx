import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowRight, Image } from "lucide-react";
import { useResource } from "../utils/useResource";
import { api, errorText, fieldErrors, multipart } from "../services/api";
import {
  Field,
  ErrorMessage,
  LoadingSpinner,
  EmptyState,
  DeleteConfirmationModal,
  SuccessMessage,
} from "../components/UI";
import ImageUploader from "./ImageUploader";
export default function ManageCategories({ gift = false }) {
  const kind = gift ? "gifts" : "frames";
  const categoryPath = gift ? "/admin/gift-categories" : "/admin/categories";
  const resource = useResource(gift ? "/gift-categories" : "/categories");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [files, setFiles] = useState([]);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [target, setTarget] = useState(null);
  const edit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description });
    setFiles([]);
    setRemoveImage(false);
    setError("");
    setErrors({});
    setSuccess("");
    document
      .getElementById("category-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const reset = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setFiles([]);
    setRemoveImage(false);
    setErrors({});
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = multipart("category", form, files, "image");
      if (editing)
        await api.put(
          categoryPath + "/" + editing.id + "?removeImage=" + removeImage,
          body,
        );
      else await api.post(categoryPath, body);
      setSuccess(
        editing
          ? "Category updated."
          : "Category created. It is now available on the website.",
      );
      reset();
      resource.reload();
    } catch (e) {
      setError(errorText(e));
      setErrors(fieldErrors(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await api.delete(categoryPath + "/" + target.id);
      if (editing?.id === target.id) reset();
      setTarget(null);
      resource.reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>
            {gift ? "A gift for every occasion." : "A place for every style."}
          </h1>
          <p>
            Manage the {gift ? "gift" : "frame"} categories your visitors use to
            explore the collection.
          </p>
        </div>
      </div>
      <div className="category-admin-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <h2>{gift ? "Your gift categories" : "Your categories"}</h2>
            <span>{resource.data?.length || 0} categories</span>
          </div>
          {resource.loading ? (
            <LoadingSpinner />
          ) : resource.error ? (
            <ErrorMessage message={resource.error} retry={resource.reload} />
          ) : resource.data.length ? (
            <div className="category-admin-list">
              {resource.data.map((c) => (
                <div key={c.id}>
                  <span className="category-admin-thumb">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" />
                    ) : (
                      <Image size={23} />
                    )}
                  </span>
                  <div>
                    <h3>{c.name}</h3>
                    <Link
                      className="text-link"
                      to={"/admin/" + kind + "?category=" + c.id}
                    >
                      View {kind} <ArrowRight size={13} />
                    </Link>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + c.name}
                    onClick={() => edit(c)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={"Delete " + c.name}
                    onClick={() => {
                      setTarget(c);
                      setError("");
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Start with a category.">
              Give your collection a thoughtful structure.
            </EmptyState>
          )}
        </div>
        <form
          className="admin-panel form-panel"
          id="category-editor"
          onSubmit={save}
        >
          <h2>
            {editing
              ? gift
                ? "Edit gift category"
                : "Edit category"
              : gift
                ? "Create a gift category"
                : "Create a category"}
          </h2>
          <ErrorMessage message={!target ? error : ""} />
          <SuccessMessage>{success}</SuccessMessage>
          <Field label="Category name *" error={errors.name}>
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Description" error={errors.description}>
            <textarea
              rows={3}
              maxLength={5000}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          {editing?.imageUrl && (
            <div className="category-current-image">
              <img src={editing.imageUrl} alt="Current category" />
              <label>
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                />
                Remove current image
              </label>
            </div>
          )}
          <div className="field">
            <div className="field-label">Category image (optional)</div>
            <ImageUploader
              label={
                gift ? "Upload gift category image" : "Upload frame images"
              }
              files={files}
              onChange={setFiles}
              max={1}
              disabled={busy}
            />
          </div>
          <div className="form-actions">
            {editing && (
              <button
                type="button"
                className="button button-outline"
                disabled={busy}
                onClick={reset}
              >
                Cancel editing
              </button>
            )}
            <button className="button button-gold" disabled={busy}>
              <Plus size={17} />
              {busy
                ? "Saving…"
                : editing
                  ? "Save category"
                  : gift
                    ? "Create gift category"
                    : "Create category"}
            </button>
          </div>
          <p className="form-hint">
            A category can only be deleted after its {kind} have been moved or
            removed.
          </p>
        </form>
      </div>
      {target && (
        <DeleteConfirmationModal
          title="Delete this category?"
          description={
            "“" +
            target.name +
            `” will be removed. Categories that still contain ${kind} cannot be deleted.`
          }
          busy={busy}
          error={error}
          onClose={() => setTarget(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
