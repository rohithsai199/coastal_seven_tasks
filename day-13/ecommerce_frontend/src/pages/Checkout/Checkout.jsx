import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { checkout } from "../../services/orderService";
import { ArrowLeft, ShieldCheck, Truck, Lock, Sparkles } from "lucide-react";

function Checkout() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const order = await checkout(formData);
      console.log("Order created:", order);

      navigate("/orders");
    } catch (err) {
      console.error("Checkout error:", err);
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).filter(Boolean).join(", "));
      } else {
        setError("Unable to place your order. Please make sure your cart is not empty.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container" style={{ maxWidth: '780px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#6C5CE7',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} /> Back to Shopping Cart
          </Link>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #EFEFEF',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <span className="section-badge-purple">
              <Lock size={13} className="inline mr-1" /> Secure 256-Bit Checkout
            </span>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#1E272E', margin: '6px 0' }}>
              Shipping & Delivery Details
            </h1>
            <p style={{ fontSize: '14px', color: '#808E9B' }}>
              Where should we deliver your order? All shipments include live tracking.
            </p>
          </div>

          {error && (
            <div className="details-alert alert-error" style={{ marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="form-label" htmlFor="shipping_name">
                  Full Name *
                </label>
                <input
                  id="shipping_name"
                  name="shipping_name"
                  type="text"
                  value={formData.shipping_name}
                  onChange={handleChange}
                  placeholder="e.g. Rohith Sai"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="shipping_phone">
                  Phone Number *
                </label>
                <input
                  id="shipping_phone"
                  name="shipping_phone"
                  type="tel"
                  value={formData.shipping_phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="shipping_address">
                Street Address *
              </label>
              <textarea
                id="shipping_address"
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                placeholder="Apartment, suite, unit, building, floor, street address..."
                rows="3"
                className="form-input"
                style={{ resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label className="form-label" htmlFor="shipping_city">
                  City *
                </label>
                <input
                  id="shipping_city"
                  name="shipping_city"
                  type="text"
                  value={formData.shipping_city}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="shipping_state">
                  State *
                </label>
                <input
                  id="shipping_state"
                  name="shipping_state"
                  type="text"
                  value={formData.shipping_state}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="shipping_postal_code">
                  Postal Code *
                </label>
                <input
                  id="shipping_postal_code"
                  name="shipping_postal_code"
                  type="text"
                  value={formData.shipping_postal_code}
                  onChange={handleChange}
                  placeholder="e.g. 560001"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Perks strip */}
            <div style={{
              background: '#F8F9FA',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '28px',
              fontSize: '13px',
              color: '#485460'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} className="text-purple" /> Express 2-Day Delivery
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} className="text-emerald" /> 100% Secure Checkout
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-add-to-cart-cta"
              style={{ width: '100%', padding: '18px', fontSize: '16px' }}
            >
              {loading ? "Placing Your Order..." : "Confirm & Place Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;