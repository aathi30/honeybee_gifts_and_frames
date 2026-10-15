import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useResource } from "../utils/useResource";
import { api, errorText } from "../services/api";
import { money } from "../utils/whatsapp";
import {
  SearchBar,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  Pagination,
  DeleteConfirmationModal,
} from "../components/UI";
export default function ManageFrames({ gift = false }) {
  const kind = gift ? "gifts" : "frames";
  const adminPath = "/admin/" + kind;
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frames = useResource("/" + kind, {
    categoryId: category || undefined,
    keyword: keyword || undefined,
    page,
    size: 12,
  });
  const categories = useResource(gift ? "/gift-categories" : "/categories");
  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await api.delete(adminPath + "/" + target.id);
      setTarget(null);
      if (frames.data.content.length === 1 && page > 0) setPage(page - 1);
      else frames.reload();
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
          <h1>Your {kind}</h1>
          <p>Every {gift ? "gift" : "frame"}, every detail, in one place.</p>
        </div>
        <Link className="button button-gold" to={adminPath + "/add"}>
          <Plus size={17} />
          Add {gift ? "gift" : "frame"}
        </Link>
      </div>
      <div className="admin-filters">
        <SearchBar
          kind={kind}
          value={keyword}
          onChange={(v) => {
            setKeyword(v);
            setPage(0);
          }}
        />
        <select
          aria-label={"Filter " + kind + " by category"}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <ErrorMessage message={categories.error} retry={categories.reload} />
      {frames.loading ? (
        <LoadingSpinner />
      ) : frames.error ? (
        <ErrorMessage message={frames.error} retry={frames.reload} />
      ) : frames.data.content.length ? (
        <div className="admin-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{gift ? "Gift" : "Frame"}</th>
                  <th>{gift ? "Category" : "Category / Size"}</th>
                  <th>Price (LKR)</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {frames.data.content.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="table-product">
                        {f.images[0] && (
                          <img src={f.images[0].imageUrl} alt="" />
                        )}
                        <div>
                          <strong>{f.name}</strong>
                          {f.featured && (
                            <span className="featured-label">
                              <Star size={12} /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {f.category.name}
                      {!gift && (
                        <small className="table-subtext">{f.size}</small>
                      )}
                    </td>
                    <td>{money(f.price)}</td>
                    <td>
                      <span
                        className={
                          "status-pill " + (!f.available ? "unavailable" : "")
                        }
                      >
                        {f.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="icon-button"
                          aria-label={"Edit " + f.name}
                          to={adminPath + "/edit/" + f.id}
                        >
                          <Pencil size={17} />
                        </Link>
                        <button
                          className="icon-button danger"
                          aria-label={"Delete " + f.name}
                          onClick={() => {
                            setTarget(f);
                            setError("");
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={frames.data.totalPages}
            onChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title={
            keyword || category
              ? `No matching ${kind}.`
              : `Your first ${gift ? "gift" : "frame"} belongs here.`
          }
        >
          Add a {gift ? "gift" : "frame"} to share it with your visitors.
        </EmptyState>
      )}
      {target && (
        <DeleteConfirmationModal
          title={`Delete this ${gift ? "gift" : "frame"}?`}
          description={
            "“" +
            target.name +
            "” will be removed from the website. Its images will be queued for deletion."
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
