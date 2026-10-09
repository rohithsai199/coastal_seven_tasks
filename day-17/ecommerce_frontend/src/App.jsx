import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import OrderWebSocket from "./components/common/OrderWebSocket";
import GlobalChatWebSocket from "./components/common/GlobalChatWebSocket";

function App() {
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const initializeTheme = useThemeStore(
    (state) => state.initializeTheme
  );

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, [initializeAuth, initializeTheme]);

  return (
    <>
      <OrderWebSocket />
      <GlobalChatWebSocket />
      <AppRoutes />
    </>
  );
}

export default App;