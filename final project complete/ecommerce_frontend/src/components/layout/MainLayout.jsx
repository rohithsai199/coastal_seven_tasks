import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackgroundTaskTracker from "../common/BackgroundTaskTracker";
import AIAssistantDrawer from "../ai/AIAssistantDrawer";
import AIErrorBoundary from "../ai/AIErrorBoundary";
import { useCategoryStore } from "../../stores/categoryStore";

function MainLayout() {
  const location = useLocation();
  const activeCategory = useCategoryStore((state) => state.activeCategory);

  const isHomePage = location.pathname === "/" && activeCategory === "home";

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      {isHomePage && <Footer />}
      <BackgroundTaskTracker />
      <AIErrorBoundary>
        <AIAssistantDrawer />
      </AIErrorBoundary>
    </div>
  );
}

export default MainLayout;