import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Gift,
  Images,
} from "lucide-react";
import HeroSection from "../components/HeroSection";
import {
  CategoryCard,
  FrameGrid,
  ProductSkeleton,
  EmptyState,
  ErrorMessage,
  WhatsAppButton,
} from "../components/UI";
import { useResource } from "../utils/useResource";
const reasons = [
  {
    icon: Sparkles,
    title: "Thoughtful Designs",
    text: "Find something that feels like you, from everyday favourites to meaningful keepsakes.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Products",
    text: "Explore the details and talk to us about the finish, materials, and your perfect fit.",
  },
  {
    icon: Heart,
    title: "Personalized Gifts",
    text: "Have an idea in mind? Let's discuss the little touches that make it uniquely theirs.",
  },
  {
    icon: MessageCircle,
    title: "Easy WhatsApp Ordering",
    text: "Choose your favourite, send us a message, and arrange every detail with us directly.",
  },
];
function FeaturedCollection({ resource, gift = false }) {
  if (resource.loading) return <ProductSkeleton />;
  if (resource.error)
    return <ErrorMessage message={resource.error} retry={resource.reload} />;
  return resource.data?.content.length ? (
    <FrameGrid gift={gift} frames={resource.data.content} />
  ) : (
    <EmptyState
      title={
        gift
          ? "Something thoughtful is on its way."
          : "Your next favourite frame is on its way."
      }
    >
      {gift
        ? "Our featured gifts will appear here soon. Explore all gifts or get in touch for ideas."
        : "Our featured collection is being curated. Explore all frames or get in touch about a custom frame."}
    </EmptyState>
  );
}
function CategoryCollection({ resource, gift = false }) {
  if (resource.loading) return <ProductSkeleton />;
  if (resource.error)
    return <ErrorMessage message={resource.error} retry={resource.reload} />;
  return resource.data?.length ? (
    <div className="category-grid">
      {resource.data.slice(0, 4).map((category, index) => (
        <CategoryCard
          gift={gift}
          category={category}
          index={index}
          key={category.id}
        />
      ))}
    </div>
  ) : (
    <EmptyState
      compact
      title={
        gift ? "A little joy is on its way." : "A collection worth waiting for."
      }
    >
      New {gift ? "gift" : "frame"} categories will appear here soon.
    </EmptyState>
  );
}
export default function Home() {
  const categories = useResource("/categories");
  const giftCategories = useResource("/gift-categories");
  const featured = useResource("/frames/featured", { size: 4 });
  const featuredGifts = useResource("/gifts/featured", { size: 4 });
  const latestGift = useResource("/gifts", { size: 1 });
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.IntersectionObserver
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.06 },
    );
    document.querySelectorAll(".home-page [data-reveal]").forEach((element) => {
      element.classList.add("reveal-ready");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return (
    <div className="home-page">
      <HeroSection
        frame={featured.data?.content[0]}
        gift={featuredGifts.data?.content[0] || latestGift.data?.content[0]}
      />
      <div className="story-strip">
        <div className="container">
          <span>
            <Heart size={17} /> Thoughtfully chosen
          </span>
          <span>
            <Images size={17} /> Memories, beautifully framed
          </span>
          <span>
            <Gift size={17} /> Gifts with a personal touch
          </span>
          <span>
            <MessageCircle size={17} /> Order on WhatsApp
          </span>
        </div>
      </div>
      <section className="section container" data-reveal>
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE FRAME COLLECTION</div>
            <h2>Frame Your Beautiful Memories</h2>
            <p>
              A favourite photograph deserves a beautiful place to call home.
            </p>
          </div>
          <Link to="/frames" className="text-link">
            View all frames <ArrowRight size={17} />
          </Link>
        </div>
        <FeaturedCollection resource={featured} />
      </section>
      <section className="section gift-feature-section" data-reveal>
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THOUGHTFULLY CHOSEN</div>
              <h2>Gifts That Make Every Moment Special</h2>
              <p>A little joy for someone who means a lot.</p>
            </div>
            <Link to="/gifts" className="text-link">
              View all gifts <ArrowRight size={17} />
            </Link>
          </div>
          <FeaturedCollection resource={featuredGifts} gift />
        </div>
      </section>
      <section className="section container" data-reveal>
        <div className="section-heading">
          <div>
            <div className="eyebrow">FIND YOUR KIND OF SPECIAL</div>
            <h2>Shop by Category</h2>
            <p>Frames for your space. Gifts for their favourite moments.</p>
          </div>
          <Link to="/categories" className="text-link">
            All categories <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-section-label">
          <Images size={18} />
          <h3>Frame categories</h3>
          <Link to="/frames">
            Browse frames <ArrowRight size={15} />
          </Link>
        </div>
        <CategoryCollection resource={categories} />
        <div className="category-section-label">
          <Gift size={18} />
          <h3>Gift categories</h3>
          <Link to="/gifts">
            Browse gifts <ArrowRight size={15} />
          </Link>
        </div>
        <CategoryCollection resource={giftCategories} gift />
        {categories.data?.length > 4 && (
          <div className="category-chips more-category-links">
            {categories.data.slice(4).map((category) => (
              <Link key={category.id} to={`/frames?category=${category.id}`}>
                {category.name}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        )}
        {giftCategories.data?.length > 4 && (
          <div className="category-chips more-category-links">
            {giftCategories.data.slice(4).map((category) => (
              <Link key={category.id} to={`/gifts?category=${category.id}`}>
                {category.name}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="custom-section container" data-reveal>
        <div className="custom-visual">
          <span className="custom-border" />
          <div className="custom-paper">
            <span className="eyebrow">SOMETHING UNIQUELY YOURS</span>
            <span className="custom-letter">
              your story,
              <br />
              <em>your frame.</em>
            </span>
            <span className="custom-paper-bottom">A LITTLE HONEYBEE MAGIC</span>
          </div>
          <Sparkles className="custom-sparkle" size={36} strokeWidth={1.5} />
        </div>
        <div className="custom-copy">
          <div className="eyebrow">LET'S MAKE IT PERSONAL</div>
          <h2>
            Little details.
            <br />
            Lasting memories.
          </h2>
          <p>
            A special photograph, an unusual size, or a gift idea that's all
            your own. Tell us what you're imagining and we'll help you explore
            the possibilities.
          </p>
          <WhatsAppButton className="button-gold">
            Talk about a custom frame <ArrowRight size={17} />
          </WhatsAppButton>
          <small>A conversation is all it takes to get started.</small>
        </div>
      </section>
      <section className="section why-section container" data-reveal>
        <div className="center-heading">
          <div className="eyebrow">A LITTLE CARE IN EVERY DETAIL</div>
          <h2>Why Choose HoneyBee?</h2>
          <p>Good things begin with a little thought.</p>
        </div>
        <div className="reason-grid">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="reason-icon">
                <Icon size={25} strokeWidth={1.8} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="contact-banner">
        <div className="container">
          <div>
            <div className="eyebrow">LET'S CREATE A LITTLE HAPPINESS</div>
            <h2>Your idea. Our next conversation.</h2>
            <p>
              Found something you love, or need a little inspiration? We're a
              message away.
            </p>
          </div>
          <WhatsAppButton className="button-gold">
            Say hello on WhatsApp <ArrowRight size={17} />
          </WhatsAppButton>
        </div>
      </section>
    </div>
  );
}
