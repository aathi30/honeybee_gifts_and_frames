import { useEffect, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { ErrorMessage } from "../components/UI";
export default function ImageUploader({
  files,
  onChange,
  max = 8,
  disabled = false,
  label = "Upload frame images",
}) {
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  const choose = (e) => {
    const next = Array.from(e.target.files);
    e.target.value = "";
    if (
      next.some(
        (f) =>
          !["image/jpeg", "image/png"].includes(f.type) ||
          f.size > 8 * 1024 * 1024,
      )
    ) {
      setError("Choose JPEG or PNG images under 8 MB each.");
      return;
    }
    if (files.length + next.length > max) {
      setError("You can add up to " + max + " more images.");
      return;
    }
    setError("");
    onChange([...files, ...next]);
  };
  return (
    <div className="image-uploader">
      <label className={"upload-zone " + (disabled ? "disabled" : "")}>
        <UploadCloud size={28} />
        <strong>Choose images</strong>
        <span>JPEG or PNG · up to 8 MB each · {max} image slots</span>
        <input
          type="file"
          aria-label={label}
          accept="image/jpeg,image/png"
          multiple
          disabled={disabled || max === 0}
          onChange={choose}
        />
      </label>
      <ErrorMessage message={error} />
      <div className="upload-previews">
        {previews.map((src, i) => (
          <div key={src}>
            <img src={src} alt={"New image " + (i + 1)} />
            <button
              type="button"
              className="icon-button"
              disabled={disabled}
              aria-label={"Remove new image " + (i + 1)}
              onClick={() => onChange(files.filter((_, n) => n !== i))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
