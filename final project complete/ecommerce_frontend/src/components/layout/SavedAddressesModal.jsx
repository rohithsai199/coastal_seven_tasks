import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Truck,
  CheckCircle2,
  Plus,
  Home,
  Briefcase,
  Phone,
  ShieldCheck,
  Check,
} from "lucide-react";

function SavedAddressesModal({ isOpen, onClose, user }) {
  const [selectedId, setSelectedId] = useState(1);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  if (!isOpen) return null;

  const formatUserName = (email) => {
    if (!email) return "Rohith Sai Gunturu";
    if (email.toLowerCase().includes("guntururohith")) {
      return "Rohith Sai Gunturu";
    }
    const clean = email.split("@")[0].replace(/[._-]/g, " ");
    return clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const recipientName = formatUserName(user?.email);

  const addresses = [
    {
      id: 1,
      type: "Primary Residence",
      icon: Home,
      recipient: `${recipientName} • VIP Luxury Member`,
      street: "742 Evergreen Terrace, Penthouse Suite 14B",
      city: "Beverly Hills, CA 90210",
      country: "United States",
      phone: "+1 (555) 234-8900",
      instructions: "Leave with front desk concierge • Signature required",
      verified: true,
      shippingType: "White-Glove VIP Express (1-Day)",
    },
    {
      id: 2,
      type: "Executive Atelier Office",
      icon: Briefcase,
      recipient: `${recipientName} • Atelier Corporate Suite`,
      street: "450 Fashion Avenue, 28th Floor, Suite 2800",
      city: "New York, NY 10018",
      country: "United States",
      phone: "+1 (212) 555-0199",
      instructions: "Business hours only (9:00 AM – 6:00 PM EST)",
      verified: true,
      shippingType: "Insured Direct Courier",
    },
  ];

  const modalContent = (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div
        className="login-modal-container animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
      >
        {/* Header */}
        <div className="login-modal-header">
          <div className="modal-title-with-badge">
            <span className="security-icon-badge">
              <MapPin size={18} />
            </span>
            <div>
              <h2 id="address-modal-title" className="login-modal-title">
                Delivery Addresses & Shipping
              </h2>
              <p className="login-modal-subtitle">
                Verified luxury destinations & white-glove courier preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="login-modal-body">
          {showAddSuccess && (
            <div className="wishlist-drawer-toast animate-fadeIn" style={{ borderRadius: "10px" }}>
              <CheckCircle2 size={15} />
              <span>Default delivery address updated successfully!</span>
            </div>
          )}

          {addresses.map((addr) => {
            const Icon = addr.icon;
            const isSelected = selectedId === addr.id;

            return (
              <div
                key={addr.id}
                className={`modal-section-card address-card-item ${
                  isSelected ? "selected-address-card" : ""
                }`}
                onClick={() => {
                  setSelectedId(addr.id);
                  setShowAddSuccess(true);
                  setTimeout(() => setShowAddSuccess(false), 2500);
                }}
                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <div className="address-type-header">
                  <div className="address-type-badge">
                    <Icon size={15} />
                    <strong>{addr.type}</strong>
                    {isSelected && (
                      <span className="default-address-tag">Default</span>
                    )}
                  </div>

                  <span className="verified-pill">
                    <CheckCircle2 size={13} className="text-emerald inline mr-1" />
                    {addr.shippingType}
                  </span>
                </div>

                <div className="address-details-block">
                  <h4 className="address-recipient-name">{addr.recipient}</h4>
                  <p className="address-street">
                    <strong>Street: </strong>
                    {addr.street}
                  </p>
                  <p className="address-city">
                    <strong>Destination: </strong>
                    {addr.city} • {addr.country}
                  </p>
                  <p className="address-phone">
                    <Phone size={12} className="inline mr-1 text-muted" />
                    <strong>Contact: </strong>
                    {addr.phone}
                  </p>
                  <p className="address-instructions">
                    <strong>Courier Notes: </strong>
                    {addr.instructions}
                  </p>
                </div>

                <div className="address-card-action-row">
                  <span className="address-selection-status">
                    {isSelected ? (
                      <span className="selected-text">
                        <Check size={13} className="inline mr-1" /> Active Delivery Address
                      </span>
                    ) : (
                      <span className="unselected-text">Click to set as active address</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}

          {/* White-Glove Guarantee Box */}
          <div className="perk-guarantee-box">
            <Truck size={20} className="text-emerald" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>White-Glove Insured Courier Service</strong>
              <p>
                All atelier drops are dispatched in tamper-proof security packaging with
                real-time GPS dispatch tracking and compulsory physical signature.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-modal-footer">
          <div className="footer-secure-note">
            <ShieldCheck size={14} className="text-emerald" />
            <span>End-to-End Encrypted Destination Data</span>
          </div>
          <button type="button" onClick={onClose} className="btn-modal-done">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}

export default SavedAddressesModal;
