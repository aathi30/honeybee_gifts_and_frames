import {
  Phone,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { useShop } from "../context/ShopContext";
import { WhatsAppButton, ErrorMessage } from "../components/UI";
export default function Contact() {
  const { settings, error, reload } = useShop();
  const details = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: settings.whatsappNumber
        ? "+" + settings.whatsappNumber
        : "WhatsApp details coming soon",
      href: null,
    },
    {
      icon: Phone,
      label: "Give us a call",
      value: settings.phoneNumber || "Phone details coming soon",
      href: settings.phoneNumber
        ? "tel:" + settings.phoneNumber.replace(/[^+0-9]/g, "")
        : null,
    },
    {
      icon: MapPin,
      label: "Visit the shop",
      value: settings.address || "Our address will be shared soon",
      href: settings.mapsUrl,
    },
    {
      icon: Clock,
      label: "Opening hours",
      value: settings.openingHours || "Please enquire for opening hours",
      href: null,
    },
  ];
  return (
    <div className="container contact-page">
      <div className="page-intro">
        <div className="eyebrow">WE’D LOVE TO HEAR YOUR STORY</div>
        <h1>
          A little hello.
          <br />A beautiful beginning.
        </h1>
        <p>
          Found a frame or gift you love? Have something special in mind?
          <br />
          Let’s make a home for your favourite memory.
        </p>
      </div>
      <ErrorMessage message={error} retry={reload} />
      <div className="contact-grid">
        <div className="contact-card">
          <span className="reason-icon">
            <MessageCircle size={28} />
          </span>
          <h2>Let’s talk frames & gifts.</h2>
          <p>
            Tell us about your photograph, your space, or the occasion. We’ll
            discuss the options and help you take the next step.
          </p>
          <WhatsAppButton>
            Start a conversation <ArrowUpRight size={18} />
          </WhatsAppButton>
          <small>Message us directly. Arrange your order personally.</small>
        </div>
        <div className="contact-details">
          {details.map(({ icon: Icon, label, value, href }) => (
            <div key={label}>
              <Icon size={23} strokeWidth={1.4} />
              <div>
                <h3>{label}</h3>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="preserve-lines"
                  >
                    {value}
                    <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <p className="preserve-lines">{value}</p>
                )}
              </div>
            </div>
          ))}
          <div className="social-links">
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} /> Instagram
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={18} /> Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
