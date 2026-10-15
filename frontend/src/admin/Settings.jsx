import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useResource } from "../utils/useResource";
import { useShop } from "../context/ShopContext";
import { api, errorText, fieldErrors } from "../services/api";
import {
  Field,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from "../components/UI";
export default function Settings() {
  const resource = useResource("/admin/settings");
  const shop = useShop();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (resource.data) setForm(resource.data);
  }, [resource.data]);
  const change = (key, value) => {
    setForm({ ...form, [key]: value });
    setSuccess("");
    setErrors({ ...errors, [key]: "" });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/admin/settings", form);
      shop.reload();
      setSuccess(
        "Shop settings saved. Your website now uses the updated details.",
      );
    } catch (e) {
      setError(errorText(e));
      setErrors(fieldErrors(e));
    } finally {
      setBusy(false);
    }
  };
  if (resource.loading || (!form && !resource.error))
    return <LoadingSpinner label="Loading shop settings…" />;
  if (resource.error)
    return <ErrorMessage message={resource.error} retry={resource.reload} />;
  const input = (
    key,
    label,
    { required = false, max = 500, type = "text", hint, pattern } = {},
  ) => (
    <Field label={label} error={errors[key]} hint={hint}>
      <input
        type={type}
        required={required}
        maxLength={max}
        pattern={pattern}
        value={form[key]}
        onChange={(e) => change(key, e.target.value)}
      />
    </Field>
  );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>The details that make it yours.</h1>
          <p>
            Update your business information and homepage, without changing any
            code.
          </p>
        </div>
      </div>
      <form onSubmit={save}>
        <ErrorMessage message={error} />
        <SuccessMessage>{success}</SuccessMessage>
        <div className="form-columns">
          <div className="admin-panel form-panel">
            <h2>Shop & contact information</h2>
            {input("shopName", "Shop name *", { required: true, max: 120 })}
            {input("whatsappNumber", "WhatsApp number", {
              max: 15,
              pattern: "[1-9][0-9]{6,14}",
              hint: "International format, digits only. Leave empty to disable WhatsApp until configured.",
            })}
            {input("phoneNumber", "Contact phone", { max: 40 })}
            <Field label="Business address" error={errors.address}>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.address}
                onChange={(e) => change("address", e.target.value)}
              />
            </Field>
            <Field label="Opening hours" error={errors.openingHours}>
              <textarea
                maxLength={500}
                rows={3}
                value={form.openingHours}
                onChange={(e) => change("openingHours", e.target.value)}
              />
            </Field>
            {input("mapsUrl", "Google Maps link", {
              type: "url",
              pattern: "https://.*",
              hint: "Use a full HTTPS URL, or leave blank.",
            })}
          </div>
          <div className="admin-panel form-panel">
            <h2>Homepage & social links</h2>
            {input("heroTitle", "Homepage hero title *", {
              required: true,
              max: 200,
            })}
            <Field label="Homepage subtitle *" error={errors.heroSubtitle}>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={form.heroSubtitle}
                onChange={(e) => change("heroSubtitle", e.target.value)}
              />
            </Field>
            {input("facebookUrl", "Facebook link", {
              type: "url",
              pattern: "https://.*",
            })}
            {input("instagramUrl", "Instagram link", {
              type: "url",
              pattern: "https://.*",
            })}
            <p className="form-hint">
              Only add business details you want publicly visible. Empty contact
              fields are shown as not yet available.
            </p>
          </div>
        </div>
        <div className="form-actions">
          <button className="button button-gold" disabled={busy}>
            <Save size={17} />
            {busy ? "Saving…" : "Save shop settings"}
          </button>
        </div>
      </form>
    </>
  );
}
