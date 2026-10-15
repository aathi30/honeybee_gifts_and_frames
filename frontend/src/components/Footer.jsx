import { Link } from "react-router-dom";
import { Instagram, Facebook, ArrowUpRight } from "lucide-react";
import { Logo, WhatsAppButton } from "./UI";
import { useShop } from "../context/ShopContext";
export default function Footer() {
  const { settings } = useShop();
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link to="/">
            <Logo />
          </Link>
          <p>
            For the moments you want to keep close.
            <br />
            Thoughtful frames. Meaningful gifts.
          </p>
          <div className="social-links">
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            )}
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/frames">All frames</Link>
          <Link to="/gifts">All gifts</Link>
          <Link to="/categories">Our categories</Link>
          <Link to="/contact">
            Custom framing <ArrowUpRight size={12} />
          </Link>
        </div>
        <div>
          <h3>Come say hello</h3>
          <p>{settings.address || "Visit details will be shared soon."}</p>
          {settings.phoneNumber && (
            <a href={"tel:" + settings.phoneNumber.replace(/[^+0-9]/g, "")}>
              {settings.phoneNumber}
            </a>
          )}
          <Link to="/contact">
            Contact us <ArrowUpRight size={12} />
          </Link>
          <WhatsAppButton className="footer-whatsapp button-small">
            Message on WhatsApp
          </WhatsAppButton>
        </div>
        <div>
          <h3>Opening hours</h3>
          <p className="preserve-lines">
            {settings.openingHours || "Please contact us for opening hours."}
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.shopName}. All rights
          reserved.
        </span>
        <span>Made for memories, with a little honey.</span>
      </div>
    </footer>
  );
}
