import { Link } from "react-router-dom";
import { useResource } from "../utils/useResource";
import {
  CategoryCard,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from "../components/UI";
export default function Categories() {
  const categories = useResource("/categories");
  const gifts = useResource("/gift-categories");
  return (
    <div className="container category-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Categories</span>
      </div>
      <div className="page-intro">
        <div className="eyebrow">SOMETHING FOR EVERY MOMENT</div>
        <h1>Find your kind of beautiful.</h1>
        <p>
          Browse frames by style and gifts by occasion. Find a little something
          that feels just right.
        </p>
      </div>
      <section aria-labelledby="frame-categories-heading">
        <div className="section-heading">
          <h2 id="frame-categories-heading">Frame Categories</h2>
        </div>
        {categories.loading ? (
          <LoadingSpinner />
        ) : categories.error ? (
          <ErrorMessage message={categories.error} retry={categories.reload} />
        ) : categories.data.length ? (
          <div className="category-grid">
            {categories.data.map((c, i) => (
              <CategoryCard category={c} index={i} key={c.id} />
            ))}
          </div>
        ) : (
          <EmptyState>
            Our categories are being curated. Please visit again soon.
          </EmptyState>
        )}
      </section>
      <section className="section" aria-labelledby="gift-categories-heading">
        <div className="section-heading">
          <h2 id="gift-categories-heading">Gift Categories</h2>
          <Link className="text-link" to="/gifts">
            Explore gifts
          </Link>
        </div>
        {gifts.loading ? (
          <LoadingSpinner label="Loading gift categories…" />
        ) : gifts.error ? (
          <ErrorMessage message={gifts.error} retry={gifts.reload} />
        ) : gifts.data.length ? (
          <div className="category-grid">
            {gifts.data.map((category, index) => (
              <CategoryCard
                gift
                category={category}
                index={index}
                key={category.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="A little joy is on its way.">
            Our gift categories are being curated. Please visit again soon.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
