import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/ui/theme-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
