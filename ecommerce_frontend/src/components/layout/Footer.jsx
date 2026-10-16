import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Heart,
} from "lucide-react";

function Footer() {
  return (
    <footer className="modern-footer">
      {/* 4-Column Luxury Perks Bar (Replaced yellow box with red box) */}
      <div className="footer-perks-container">
        <div className="container">
          <div className="perks-grid-4">
            <div className="perk-card">
              <div className="perk-icon-wrapper">
                <Truck size={22} />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">Free Express Shipping</h4>
                <p className="perk-desc">Fast, tracked delivery on all orders over $50.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper">
                <RotateCcw size={22} />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">30-Day Money-Back</h4>
                <p className="perk-desc">100% satisfaction guaranteed or full refund.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper">
                <Award size={22} />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">24/7 Priority Support</h4>
                <p className="perk-desc">Real specialist assistance around the clock.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper">
                <ShieldCheck size={22} />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">100% Authentic & Verified</h4>
                <p className="perk-desc">Direct from certified manufacturers with 2-year warranty.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} J2B Inc. All rights reserved. Crafted with <Heart size={14} className="inline heart-icon" /> for a premium shopping experience.
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
