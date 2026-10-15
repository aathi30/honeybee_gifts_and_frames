import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  Ruler,
  MessageCircle,
  Image,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useResource } from "../utils/useResource";
import { money } from "../utils/whatsapp";
import {
  LoadingSpinner,
  ErrorMessage,
  WhatsAppButton,
  FrameGrid,
} from "../components/UI";
export default function FrameDetails({ gift = false }) {
  const kind = gift ? "gifts" : "frames";
  const path = "/" + kind;
  const { id } = useParams();
  const resource = useResource(path + "/" + id);
  const frame = resource.data;
  const related = useResource(frame ? path : null, {
    categoryId: frame?.category.id,
    size: 5,
  });
  const [active, setActive] = useState(0);
  const [size, setSize] = useState("");
  useEffect(() => {
    setActive(0);
    setSize("");
  }, [id]);
  if (resource.loading)
    return (
      <div className="container detail-page">
        <LoadingSpinner />
      </div>
    );
  if (resource.error)
    return (
      <div className="container detail-page">
        <ErrorMessage message={resource.error} retry={resource.reload} />
        <Link className="text-link" to={path}>
          <ArrowLeft size={17} />
          Back to all {kind}
        </Link>
      </div>
    );
  const sizes = (gift ? "" : frame.size)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const images = frame.images || [];
  return (
    <div className="container detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={path}>All {kind}</Link>
        <span>/</span>
        <span>{frame.name}</span>
      </div>
      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            {images[active] ? (
              <img
                key={images[active].id}
                src={images[active].imageUrl}
                alt={frame.name + " — image " + (active + 1)}
              />
            ) : (
              <Image size={60} />
            )}{" "}
            {images.length > 1 && (
              <div className="gallery-controls">
                <button
                  className="icon-button"
                  aria-label="Previous image"
                  onClick={() =>
                    setActive((active + images.length - 1) % images.length)
                  }
                >
                  <ChevronLeft />
                </button>
                <span>
                  {active + 1} / {images.length}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next image"
                  onClick={() => setActive((active + 1) % images.length)}
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>
          <div className="gallery-thumbnails">
            {images.map((image, i) => (
              <button
                key={image.id}
                className={active === i ? "selected" : ""}
                aria-label={"View image " + (i + 1)}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
              >
                <img src={image.imageUrl} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <Link
            className="eyebrow"
            to={path + "?category=" + frame.category.id}
          >
            {frame.category.name}
          </Link>
          <h1>{frame.name}</h1>
          <div
            className={
              "stock-status " + (!frame.available ? "out-of-stock" : "")
            }
          >
            <span />
            {frame.available
              ? "Available for enquiry"
              : "Currently unavailable — enquire for details"}
          </div>
          <div className="detail-price">{money(frame.price)}</div>
          <p className="detail-description preserve-lines">
            {frame.description ||
              (gift
                ? "A thoughtful gift for someone special. Contact us to learn more."
                : "A beautiful home for your favourite memory. Contact us to learn more about this frame.")}
          </p>
          {!gift && (
            <div className="size-picker">
              <div className="eyebrow">
                <Ruler size={16} />{" "}
                {sizes.length > 1 ? "CHOOSE A SIZE" : "FRAME SIZE"}
              </div>
              <div>
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={(size || sizes[0]) === s ? "selected" : ""}
                    aria-pressed={(size || sizes[0]) === s}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <WhatsAppButton
            gift={gift}
            frame={frame}
            size={size || sizes[0]}
            className="button-full"
          >
            {frame.available ? "Order via WhatsApp" : "Enquire via WhatsApp"}
          </WhatsAppButton>
          <div className="order-note">
            <MessageCircle size={19} />
            <p>
              We’ll confirm the details with you directly.
              <br />
              {gift
                ? "Your selected gift and its details are included in the message."
                : "Your selected frame and size are included in the message."}
            </p>
          </div>
          <div className="detail-feature">
            <Check size={16} />{" "}
            {gift
              ? "A thoughtful gift for the moments that matter."
              : "A frame for the moments that matter."}
          </div>
        </div>
      </div>
      {related.data?.content.some((f) => f.id !== frame.id) && (
        <section className="section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">KEEP EXPLORING</div>
              <h2>A few more you might love.</h2>
            </div>
          </div>
          <FrameGrid
            gift={gift}
            frames={related.data.content
              .filter((f) => f.id !== frame.id)
              .slice(0, 4)}
          />
        </section>
      )}
      <ErrorMessage message={related.error} retry={related.reload} />
    </div>
  );
}
