import random
import time
from locust import HttpUser, task, between, events


class EcommerceUser(HttpUser):
    """
    Simulates realistic user traffic against the E-Commerce API:
    - Browsing product listings (with caching & pagination)
    - Product search & filtering
    - Viewing product details
    - Cart operations (adding items, viewing cart)
    - Health checks & compressed endpoints
    """
    wait_time = between(1, 2.5)

    def on_start(self):
        """Prepare session: perform signup/login to test authenticated flows."""
        self.user_email = f"loadtest_{int(time.time() * 1000)}_{random.randint(1000, 9999)}@example.com"
        self.password = "LoadTestPass123!"
        self.token = None
        self.auth_headers = {}

        # Attempt user registration
        signup_res = self.client.post(
            "/auth/signup",
            json={"email": self.user_email, "password": self.password},
            name="/auth/signup",
        )
        if signup_res.status_code == 201:
            # Login to get access token
            login_res = self.client.post(
                "/auth/login",
                data={"username": self.user_email, "password": self.password},
                name="/auth/login",
            )
            if login_res.status_code == 200:
                data = login_res.json()
                self.token = data.get("access_token")
                if self.token:
                    self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    @task(6)
    def browse_products(self):
        """Frequently requested public endpoint - evaluates Redis cache & response compression."""
        page = random.randint(1, 3)
        self.client.get(
            f"/products?page={page}&page_size=10",
            headers={"Accept-Encoding": "gzip"},
            name="/products?page=[p]",
        )

    @task(4)
    def search_and_filter_products(self):
        """Evaluates database query latency and search performance."""
        queries = ["phone", "laptop", "audio", "wireless", "pro", "smart"]
        q = random.choice(queries)
        sort_options = ["newest", "price_asc", "price_desc"]
        sort = random.choice(sort_options)
        self.client.get(
            f"/products?q={q}&sort={sort}",
            headers={"Accept-Encoding": "gzip"},
            name="/products?q=[query]",
        )

    @task(4)
    def view_product_details(self):
        """View specific product details."""
        prod_id = random.randint(1, 10)
        self.client.get(
            f"/products/{prod_id}",
            headers={"Accept-Encoding": "gzip"},
            name="/products/[id]",
        )

    @task(2)
    def cart_lifecycle(self):
        """Simulate authenticated shopping cart operations."""
        if not self.auth_headers:
            return

        prod_id = random.randint(1, 5)
        # Add to cart
        self.client.post(
            f"/cart/add?product_id={prod_id}&quantity=1",
            headers=self.auth_headers,
            name="/cart/add",
        )
        # View cart
        self.client.get(
            "/cart",
            headers=self.auth_headers,
            name="/cart",
        )

    @task(1)
    def health_check(self):
        """Liveness probe / load balancer ping."""
        self.client.get("/health", name="/health")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("=" * 60)
    print("Starting Locust Load Test Simulation: 50 Concurrent Users")
    print("Target Host:", environment.host)
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("=" * 60)
    print("Locust Load Test Completed.")
    total_reqs = environment.stats.total.num_requests
    total_fails = environment.stats.total.num_failures
    avg_response = environment.stats.total.avg_response_time
    rps = environment.stats.total.total_rps
    print(f"Total Requests: {total_reqs}")
    print(f"Total Failures: {total_fails}")
    print(f"Average Response Time: {avg_response:.2f} ms")
    print(f"Throughput: {rps:.2f} req/s")
    print("=" * 60)
