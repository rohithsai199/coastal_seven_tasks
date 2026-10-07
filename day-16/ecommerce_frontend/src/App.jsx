
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, [initializeAuth, initializeTheme]);

  return <AppRoutes />;
}

export default App;
