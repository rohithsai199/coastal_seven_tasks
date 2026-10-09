import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackgroundTaskTracker from "../common/BackgroundTaskTracker";

function MainLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <BackgroundTaskTracker />
    </div>
  );
}

export default MainLayout;