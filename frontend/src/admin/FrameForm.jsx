import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useResource } from "../utils/useResource";
import { api, errorText, fieldErrors, multipart } from "../services/api";
import {
  Field,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  DeleteConfirmationModal,
} from "../components/UI";
import ImageUploader from "./ImageUploader";
const initial = {
  name: "",
  description: "",
  categoryId: "",
  price: "",
  size: "",
  available: true,
  featured: false,
};
export default function FrameForm({ gift = false }) {
  const kind = gift ? "gifts" : "frames";
  const label = gift ? "Gift" : "Frame";
  const adminPath = "/admin/" + kind;
  const categoryPath = gift ? "/admin/gift-categories" : "/admin/categories";
  const { id } = useParams();
  const navigate = useNavigate();
  const resource = useResource(id ? "/" + kind + "/" + id : null);
  const categories = useResource(gift ? "/gift-categories" : "/categories");
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [remove, setRemove] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const uploadOptions = {
    onUploadProgress: (event) =>
      setUploadProgress(
        event.total
          ? Math.min(100, Math.round((event.loaded * 100) / event.total))
          : null,
      ),
  };
  useEffect(() => {
    if (resource.data) {
      const f = resource.data;
      setForm({
        name: f.name,
        description: f.description,
        categoryId: String(f.category.id),
        price: String(f.price),
        size: f.size || "",
        available: f.available,
        featured: f.featured,
      });
      setExisting(f.images);
    }
  }, [resource.data]);
  const change = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSuccess("");
  };
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setSuccess("");
    if (!id && !files.length) {
      setError(`Add at least one ${gift ? "gift" : "frame"} image.`);
      return;
    }
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(form.price) || Number(form.price) <= 0) {
      setErrors({
        price: "Enter a positive price with up to two decimal places.",
      });
      return;
    }
    setBusy(true);
    let detailsSaved = false;
    try {
      const data = {
        ...form,
        categoryId: Number(form.categoryId),
        price: form.price,
      };
      if (gift) delete data.size;
      if (id) {
        await api.put(adminPath + "/" + id, data);
        detailsSaved = true;
        if (files.length) {
          setUploadProgress(0);
          const body = new FormData();
          files.forEach((f) => body.append("images", f));
          const result = await api.post(
            adminPath + "/" + id + "/images",
            body,
            uploadOptions,
          );
          setExisting(result.data.images);
          setFiles([]);
        }
        setSuccess(
          `${label} updated. Your changes are live in the collection.`,
        );
      } else {
        setUploadProgress(0);
        await api.post(
          adminPath,
          multipart(gift ? "gift" : "frame", data, files),
          uploadOptions,
        );
        navigate(adminPath);
      }
    } catch (e) {
      setError(
        (detailsSaved
          ? `${label} details saved, but the new images could not be uploaded. `
          : "") + errorText(e),
      );
      setErrors(fieldErrors(e));
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };
  const deleteImage = async () => {
    setBusy(true);
    setError("");
    try {
      await api.delete(adminPath + "/" + id + "/images/" + remove.id);
      setExisting((prev) => prev.filter((i) => i.id !== remove.id));
      setRemove(null);
      setSuccess("Image removed.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  if (id && resource.loading) return <LoadingSpinner />;
  if (id && resource.error)
    return <ErrorMessage message={resource.error} retry={resource.reload} />;
  return (
    <>
      <Link className="text-link" to={adminPath}>
        <ArrowLeft size={16} />
        Back to {kind}
      </Link>
      <div className="admin-page-heading">
        <div>
          <h1>
            {id
              ? "Care for the details."
              : gift
                ? "A new gift. A little joy."
                : "A new frame. A new story."}
          </h1>
          <p>
            {id
              ? `Keep your ${gift ? "gift" : "frame"} information up to date.`
              : "Add a beautiful addition to your collection."}
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="frame-form">
        <ErrorMessage message={error} />
        <ErrorMessage message={categories.error} retry={categories.reload} />
        <SuccessMessage>{success}</SuccessMessage>
        {busy && files.length > 0 && (
          <div className="upload-progress" role="status">
            <span>
              {uploadProgress === 100
                ? "Images uploaded. Saving your product…"
                : uploadProgress === null
                  ? "Preparing image upload…"
                  : `Uploading images · ${uploadProgress}%`}
            </span>
            <progress
              max="100"
              value={uploadProgress ?? undefined}
              aria-label="Image upload progress"
            />
          </div>
        )}
        <div className="form-columns">
          <div className="admin-panel form-panel">
            <h2>{label} details</h2>
            <Field label={label + " name *"} error={errors.name}>
              <input
                required
                maxLength={180}
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </Field>
            <Field label="Description" error={errors.description}>
              <textarea
                rows={5}
                maxLength={10000}
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
            <Field
              label={gift ? "Gift category *" : "Category *"}
              error={errors.categoryId}
            >
              <select
                required
                value={form.categoryId}
                onChange={(e) => change("categoryId", e.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {(gift || categories.data?.length === 0) && (
              <p className="form-hint">
                {categories.data?.length === 0
                  ? "Create a category first. "
                  : "Need another category? "}
                <Link to={categoryPath}>
                  {gift ? "Create Gift Category" : "Manage categories"}
                </Link>
              </p>
            )}
            <div className="form-row">
              <Field label="Price in LKR *" error={errors.price}>
                <input
                  required
                  type="number"
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => change("price", e.target.value)}
                />
              </Field>
              {!gift && (
                <Field
                  label="Size *"
                  error={errors.size}
                  hint="Separate multiple sizes with commas."
                >
                  <input
                    required
                    maxLength={200}
                    placeholder="e.g. 8 × 12 inches"
                    value={form.size}
                    onChange={(e) => change("size", e.target.value)}
                  />
                </Field>
              )}
            </div>
            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => change("available", e.target.checked)}
                />
                Available for enquiries
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => change("featured", e.target.checked)}
                />
                Feature on homepage
              </label>
            </div>
          </div>
          <div className="admin-panel form-panel">
            <h2>{label} images</h2>
            <p>
              The first image is your main product image. At least one image is
              required.
            </p>
            {existing.length > 0 && (
              <div className="existing-images">
                {existing.map((image, i) => (
                  <div key={image.id}>
                    <img
                      src={image.imageUrl}
                      alt={"Existing " + kind + " image " + (i + 1)}
                    />
                    {i === 0 && <span>Main image</span>}
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={"Delete image " + (i + 1)}
                      disabled={busy || existing.length === 1}
                      title={
                        existing.length === 1
                          ? "Upload a replacement before removing the last image"
                          : "Remove image"
                      }
                      onClick={() => setRemove(image)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUploader
              label={"Upload " + (gift ? "gift" : "frame") + " images"}
              files={files}
              onChange={setFiles}
              max={8 - existing.length}
              disabled={busy}
            />
          </div>
        </div>
        <div className="form-actions">
          <Link className="button button-outline" to={adminPath}>
            Back to {kind}
          </Link>
          <button
            className="button button-gold"
            disabled={busy || categories.loading || !categories.data?.length}
          >
            <Save size={17} />
            {busy
              ? "Saving…"
              : id
                ? "Save changes"
                : gift
                  ? "Publish gift"
                  : "Publish frame"}
          </button>
        </div>
      </form>
      {remove && (
        <DeleteConfirmationModal
          title="Remove this image?"
          description={`The image will be removed from this ${gift ? "gift" : "frame"} and queued for deletion from image storage.`}
          busy={busy}
          error={error}
          onClose={() => setRemove(null)}
          onConfirm={deleteImage}
        />
      )}
    </>
  );
}
