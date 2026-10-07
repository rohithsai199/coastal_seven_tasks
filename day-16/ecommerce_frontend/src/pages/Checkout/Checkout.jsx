import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkout } from "../../services/orderService";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Lock,
} from "lucide-react";

const checkoutSchema = z.object({
  shipping_name: z
  .string()
  .min(2, "Name must be at least 2 characters")
  .regex(
    /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
    "Name can contain only letters, spaces, apostrophes, or hyphens"
  ),

  shipping_phone: z
    .string()
    .regex(
      /^[+]?[0-9\s-]{10,15}$/,
      "Enter a valid phone number"
    ),

  shipping_address: z
    .string()
    .min(5, "Address must be at least 5 characters"),

  shipping_city: z
    .string()
    .min(2, "City is required"),

  shipping_state: z
    .string()
    .min(2, "State is required"),

  shipping_postal_code: z
    .string()
    .regex(
      /^[0-9]{5,6}$/,
      "Enter a valid postal code"
    ),
});

function Checkout() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping_name: "",
      shipping_phone: "",
      shipping_address: "",
      shipping_city: "",
      shipping_state: "",
      shipping_postal_code: "",
    },
  });

  const onSubmit = async (formData) => {
    try {
      setServerError("");

      const order = await checkout(formData);

      console.log("Order created:", order);

      navigate("/orders");
    } catch (err) {
      console.error("Checkout error:", err);

      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        setServerError(detail);
      } else if (Array.isArray(detail)) {
        setServerError(
          detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ")
        );
      } else {
        setServerError(
          "Unable to place your order. Please make sure your cart is not empty."
        );
      }
    }
  };

  return (
    <div className="checkout-page">
      <div
        className="container"
        style={{ maxWidth: "780px" }}
      >
        <div style={{ marginBottom: "24px" }}>
          <Link
            to="/cart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#6C5CE7",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={18} />
            Back to Shopping Cart
          </Link>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "40px",
            border: "1px solid #EFEFEF",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <span className="section-badge-purple">
              <Lock
                size={13}
                className="inline mr-1"
              />
              Secure 256-Bit Checkout
            </span>

            <h1
              style={{
                fontSize: "30px",
                fontWeight: 900,
                color: "#1E272E",
                margin: "6px 0",
              }}
            >
              Shipping & Delivery Details
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "#808E9B",
              }}
            >
              Where should we deliver your order?
              All shipments include live tracking.
            </p>
          </div>

          {serverError && (
            <div
              className="details-alert alert-error"
              style={{ marginBottom: "24px" }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  className="form-label"
                  htmlFor="shipping_name"
                >
                  Full Name *
                </label>

                <input
                  id="shipping_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rohith Sai"
                  {...register("shipping_name")}
                />

                {errors.shipping_name && (
                  <p className="form-error">
                    {errors.shipping_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="form-label"
                  htmlFor="shipping_phone"
                >
                  Phone Number *
                </label>

                <input
                  id="shipping_phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 9876543210"
                  {...register("shipping_phone")}
                />

                {errors.shipping_phone && (
                  <p className="form-error">
                    {errors.shipping_phone.message}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                className="form-label"
                htmlFor="shipping_address"
              >
                Street Address *
              </label>

              <textarea
                id="shipping_address"
                rows="3"
                className="form-input"
                placeholder="Apartment, suite, unit, building, floor, street address..."
                style={{ resize: "vertical" }}
                {...register("shipping_address")}
              />

              {errors.shipping_address && (
                <p className="form-error">
                  {errors.shipping_address.message}
                </p>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr 1fr",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div>
                <label
                  className="form-label"
                  htmlFor="shipping_city"
                >
                  City *
                </label>

                <input
                  id="shipping_city"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hyderabad"
                  {...register("shipping_city")}
                />

                {errors.shipping_city && (
                  <p className="form-error">
                    {errors.shipping_city.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="form-label"
                  htmlFor="shipping_state"
                >
                  State *
                </label>

                <input
                  id="shipping_state"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Telangana"
                  {...register("shipping_state")}
                />

                {errors.shipping_state && (
                  <p className="form-error">
                    {errors.shipping_state.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="form-label"
                  htmlFor="shipping_postal_code"
                >
                  Postal Code *
                </label>

                <input
                  id="shipping_postal_code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500001"
                  {...register(
                    "shipping_postal_code"
                  )}
                />

                {errors.shipping_postal_code && (
                  <p className="form-error">
                    {
                      errors.shipping_postal_code
                        .message
                    }
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                background: "#F8F9FA",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-around",
                marginBottom: "28px",
                fontSize: "13px",
                color: "#485460",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Truck
                  size={16}
                  className="text-purple"
                />
                Express 2-Day Delivery
              </span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck
                  size={16}
                  className="text-emerald"
                />
                100% Secure Checkout
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-add-to-cart-cta"
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "16px",
              }}
            >
              {isSubmitting
                ? "Placing Your Order..."
                : "Confirm & Place Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;