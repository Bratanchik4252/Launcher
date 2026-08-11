import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/themes.css";
import "./styles/global.css";

document.documentElement.dataset.theme = "dark";
document.documentElement.dataset.accent = "nova";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
