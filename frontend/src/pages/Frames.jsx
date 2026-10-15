import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useResource } from "../utils/useResource";
import {
  SearchBar,
  FilterBar,
  FrameGrid,
  ProductSkeleton,
  EmptyState,
  ErrorMessage,
  Pagination,
} from "../components/UI";
export default function Frames({ gift = false }) {
  const kind = gift ? "gifts" : "frames";
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("keyword") || "");
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const page = Math.max(0, Number(params.get("page")) || 0);
  const keyword = params.get("keyword") || "";
  const categories = useResource(gift ? "/gift-categories" : "/categories");
  const frames = useResource("/" + kind, {
    categoryId: category || undefined,
    keyword: keyword || undefined,
    sort,
    page,
    size: 12,
  });
  const change = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== keyword) change("keyword", search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, keyword]);
  const selected = categories.data?.find((c) => String(c.id) === category);
  return (
    <div className="container catalog-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Our collection</span>
      </div>
      <div className="catalog-heading">
        <div>
          <div className="eyebrow">THE HONEYBEE COLLECTION</div>
          <h1>
            {selected?.name ||
              (gift ? "Find the Perfect Gift" : "A Frame for Every Memory")}
          </h1>
          <p>
            {selected?.description ||
              (gift
                ? "Thoughtful little things for the people and moments you love."
                : "Beautiful little homes for the moments that make life yours.")}
          </p>
        </div>
        <SearchBar value={search} onChange={setSearch} kind={kind} />
      </div>
      <ErrorMessage message={categories.error} retry={categories.reload} />
      <FilterBar
        kind={kind}
        categories={categories.data || []}
        category={category}
        setCategory={(v) => change("category", v)}
        sort={sort}
        setSort={(v) => change("sort", v)}
      />
      {frames.loading ? (
        <ProductSkeleton count={8} />
      ) : frames.error ? (
        <ErrorMessage message={frames.error} retry={frames.reload} />
      ) : frames.data.content.length ? (
        <>
          <div className="result-count">
            {frames.data.totalElements}{" "}
            {frames.data.totalElements === 1 ? (gift ? "gift" : "frame") : kind}{" "}
            to make your own
          </div>
          <FrameGrid frames={frames.data.content} gift={gift} />
          <Pagination
            page={page}
            totalPages={frames.data.totalPages}
            onChange={(v) => {
              change("page", String(v));
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              });
            }}
          />
        </>
      ) : (
        <EmptyState
          title={
            category || keyword
              ? `No ${kind} found.`
              : "Something beautiful is on its way."
          }
        >
          {category || keyword ? (
            <>
              <span>Try a different category or search.</span>
              <button
                className="text-link"
                onClick={() => {
                  setSearch("");
                  setParams({});
                }}
              >
                Explore all {kind} <ArrowRight size={16} />
              </button>
            </>
          ) : gift ? (
            "Our gift collection is being curated. Visit again soon or get in touch for gift ideas."
          ) : (
            "Our collection is being curated. Get in touch to discuss your framing ideas."
          )}
        </EmptyState>
      )}
    </div>
  );
}
