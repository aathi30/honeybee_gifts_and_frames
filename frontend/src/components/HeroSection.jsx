import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, MessageCircle, Heart, Gift } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { money } from "../utils/whatsapp";
export default function HeroSection({ frame, gift }) {
  const { settings } = useShop();
  const customTitle =
    settings.heroTitle && settings.heroTitle !== "Make memories feel at home.";
  const customDescription =
    settings.heroSubtitle &&
    settings.heroSubtitle !==
      "A thoughtful frame turns a favourite moment into something you live with. Find the perfect home for yours.";
  const frameImage = frame?.images?.[0]?.imageUrl;
  const giftImage = gift?.images?.[0]?.imageUrl;
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="welcome-badge">
            <Sparkles size={15} /> Welcome to HoneyBee
          </div>
          <h1>
            {customTitle ? (
              settings.heroTitle
            ) : (
              <>
                Beautiful Frames.
                <br />
                <span>Thoughtful Gifts.</span>
              </>
            )}
          </h1>
          <p>
            {customDescription
              ? settings.heroSubtitle
              : "For the memories you treasure and the people you love. Discover beautiful frames and thoughtful gifts, made a little more personal."}
          </p>
          <div className="hero-buttons">
            <Link className="button button-gold" to="/frames">
              Explore Frames <ArrowRight size={18} />
            </Link>
            <Link className="button button-dark" to="/gifts">
              Explore Gifts <Gift size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="note-icon">
              <MessageCircle size={19} />
            </span>
            <span>
              A personal touch, from start to finish.
              <br />
              <strong>Choose it. Love it. Order on WhatsApp.</strong>
            </span>
          </div>
        </div>
        <div className="hero-art">
          <span className="hero-orbit" aria-hidden="true" />
          <div className="hero-product hero-frame">
            <div className="hero-product-photo">
              <img
                src={frameImage || "/images/hero-landscape.jpg"}
                alt={
                  frameImage
                    ? frame.name
                    : "A mountain lake photograph, ready to frame"
                }
                fetchPriority="high"
              />
            </div>
            <div className="hero-product-label">
              <span>
                <small>
                  {frameImage
                    ? "FROM OUR FRAME COLLECTION"
                    : "A HOME FOR YOUR MEMORIES"}
                </small>
                <strong>
                  {frameImage ? frame.name : "Every picture tells a story."}
                </strong>
              </span>
              {frameImage ? <b>{money(frame.price)}</b> : <Heart size={21} />}
            </div>
          </div>
          <div className="hero-product hero-gift">
            <div className="hero-product-photo">
              <img
                src={giftImage || "/images/hero-botanical.jpg"}
                alt={giftImage ? gift.name : "A delicate botanical photograph"}
              />
            </div>
            <div className="hero-product-label">
              <span>
                <small>
                  {giftImage ? "A LITTLE JOY" : "LITTLE DETAILS, BIG FEELINGS"}
                </small>
                <strong>
                  {giftImage ? gift.name : "Thoughtfully chosen."}
                </strong>
              </span>
              <Gift size={20} />
            </div>
          </div>
          <div className="hero-seal">
            <Sparkles size={20} />
            <span>
              Made for
              <br />
              <strong>your moments.</strong>
            </span>
          </div>
          <span className="hero-art-caption">A little HoneyBee magic.</span>
        </div>
      </div>
    </section>
  );
}
