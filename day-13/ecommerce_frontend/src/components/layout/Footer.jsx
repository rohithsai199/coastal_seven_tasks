import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function Footer() {
  return (
    <footer className="modern-footer">
      {/* Top Banner Feature Strip */}
      <div className="footer-feature-strip">
        <div className="container footer-feature-grid">
          <div className="footer-feature-item">
            <Truck size={24} className="feature-icon" />
            <div>
              <strong>Free Global Shipping</strong>
              <span>On all orders over $50</span>
            </div>
          </div>
          <div className="footer-feature-item">
            <ShieldCheck size={24} className="feature-icon" />
            <div>
              <strong>Secure Checkout</strong>
              <span>256-Bit SSL Encryption</span>
            </div>
          </div>
          <div className="footer-feature-item">
            <RotateCcw size={24} className="feature-icon" />
            <div>
              <strong>30-Day Easy Returns</strong>
              <span>No questions asked policy</span>
            </div>
          </div>
          <div className="footer-feature-item">
            <Sparkles size={24} className="feature-icon" />
            <div>
              <strong>Authenticity Guaranteed</strong>
              <span>Curated premium products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="footer-main">
        <div className="container footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-logo">
              <span className="logo-dot"></span>
              ShopStore
            </Link>
            <p className="footer-tagline">
              Elevate your daily essentials with our curated collection of next-generation tech, smart wearables, and modern lifestyle products.
            </p>
            <div className="social-links">
              <a href="#twitter" aria-label="Twitter" className="social-btn">𝕏</a>
              <a href="#instagram" aria-label="Instagram" className="social-btn">📸</a>
              <a href="#github" aria-label="GitHub" className="social-btn">🐙</a>
              <a href="#discord" aria-label="Discord" className="social-btn">💬</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Shop Collections</h4>
            <ul className="footer-links">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=audio">Audio & Headphones</Link></li>
              <li><Link to="/products?category=wearables">Smart Wearables</Link></li>
              <li><Link to="/products?category=footwear">Footwear & Sneakers</Link></li>
              <li><Link to="/products?category=accessories">Urban Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="footer-col">
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/orders">Order Tracking</Link></li>
              <li><a href="#shipping">Shipping Policy</a></li>
              <li><a href="#returns">Returns & Exchanges</a></li>
              <li><a href="#faq">Help & FAQ</a></li>
              <li><a href="#contact">Contact Support</a></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-col-title">Stay in the Loop</h4>
            <p className="newsletter-text">
              Subscribe to unlock 15% off your first order plus exclusive member-only releases.
            </p>
            <form className="footer-newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing! Check your inbox for your 15% discount code."); }}>
              <input
                type="email"
                placeholder="Enter your email..."
                required
                className="footer-email-input"
              />
              <button type="submit" className="footer-submit-btn" aria-label="Subscribe">
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="trust-badges">
              <span className="trust-pill">🔒 100% Privacy</span>
              <span className="trust-pill">⚡ Instant Perks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} ShopStore Inc. All rights reserved. Crafted with <Heart size={14} className="inline heart-icon" /> for a premium shopping experience.
          </p>
          <div className="payment-icons">
            <span className="payment-badge">VISA</span>
            <span className="payment-badge">Mastercard</span>
            <span className="payment-badge">Amex</span>
            <span className="payment-badge">Apple Pay</span>
            <span className="payment-badge">Google Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
