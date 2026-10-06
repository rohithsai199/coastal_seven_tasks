const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function getProductImageUrl(imageUrl) {
  if (!imageUrl) return "/images/headphones.jpg";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // If it's a backend static path like /static/headphones.jpg
  if (imageUrl.startsWith("/")) {
    return `${API_URL}${imageUrl}`;
  }
  return `${API_URL}/${imageUrl}`;
}

export function handleImageError(e, fallbackFilename = "headphones.jpg") {
  // If backend static image fails, fallback to local public /images
  const src = e.target.src;
  if (!src.includes("/images/")) {
    const filename = src.split("/").pop() || fallbackFilename;
    e.target.src = `/images/${filename}`;
  }
}
