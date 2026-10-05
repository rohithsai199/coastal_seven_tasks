import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://127.0.0.1:8000/products", () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "Test Laptop",
        price: 30000,
        stock: 10,
        image_url: "/test-laptop.jpg",
        description: "Test product",
      },
    ]);
  }),
];