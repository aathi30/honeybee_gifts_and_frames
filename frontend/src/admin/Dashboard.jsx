import { Link } from "react-router-dom";
import {
  Images,
  Shapes,
  CheckCircle2,
  CircleOff,
  Plus,
  ArrowRight,
  Gift,
} from "lucide-react";
import { useResource } from "../utils/useResource";
import { LoadingSpinner, ErrorMessage, EmptyState } from "../components/UI";
import { money } from "../utils/whatsapp";
import { useAuth } from "../context/AuthContext";
export default function Dashboard() {
  const { user } = useAuth();
  const r = useResource("/admin/dashboard");
  if (r.loading) return <LoadingSpinner label="Loading your overview…" />;
  if (r.error) return <ErrorMessage message={r.error} retry={r.reload} />;
  const cards = [
    ["Total frames", r.data.totalFrames, Images],
    ["Total gifts", r.data.totalGifts ?? 0, Gift],
    ["Frame categories", r.data.totalCategories, Shapes],
    ["Gift categories", r.data.totalGiftCategories ?? 0, Shapes],
    ["Available frames", r.data.availableFrames, CheckCircle2],
    ["Unavailable frames", r.data.unavailableFrames, CircleOff],
    ["Available gifts", r.data.availableGifts ?? 0, CheckCircle2],
    ["Unavailable gifts", r.data.unavailableGifts ?? 0, CircleOff],
  ];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow">A LITTLE CARE GOES A LONG WAY</div>
          <h1>Hello, {user.username}.</h1>
          <p>Here’s how your collection looks today.</p>
        </div>
        <div className="dashboard-add-actions">
          <Link className="button button-gold" to="/admin/frames/add">
            <Plus size={17} />
            Add Frame
          </Link>
          <Link className="button button-outline" to="/admin/gifts/add">
            <Plus size={17} />
            Add Gift
          </Link>
        </div>
      </div>
      <div className="stats-grid">
        {cards.map(([title, count, Icon]) => (
          <div className="stat-card" key={title}>
            <span>
              <Icon size={21} />
            </span>
            <small>{title}</small>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Recently added frames</h2>
            <p>The latest additions to your shop.</p>
          </div>
          <Link className="text-link" to="/admin/frames">
            Manage frames <ArrowRight size={16} />
          </Link>
        </div>
        {r.data.recentFrames.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Frame</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {r.data.recentFrames.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="table-product">
                        {f.images[0] && (
                          <img src={f.images[0].imageUrl} alt="" />
                        )}
                        <strong>{f.name}</strong>
                      </div>
                    </td>
                    <td>{f.category.name}</td>
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
                      <Link
                        className="text-link"
                        to={"/admin/frames/edit/" + f.id}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact title="Let your collection begin.">
            Create a category, then add your first frame.
            <Link className="text-link" to="/admin/categories">
              Manage categories <ArrowRight size={15} />
            </Link>
          </EmptyState>
        )}
      </div>
      <div className="dashboard-gift-link">
        <Gift size={20} />
        <span>Make room for a little more joy.</span>
        <Link className="text-link" to="/admin/gifts">
          Manage gifts <ArrowRight size={16} />
        </Link>
        <Link className="text-link" to="/admin/gift-categories">
          Gift categories <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
