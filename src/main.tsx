import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { recordAppUsed } from "./lastUsed.ts";
import { trackAppOpened } from "./tracking.ts";

// Before anything renders, so the visit is stamped even if the user leaves during the
// first round. What it was compared against is frozen by the same call.
recordAppUsed();

// Outside the React tree, so the launch is counted once rather than once per mount:
// StrictMode mounts twice in development, and a remount would count again.
trackAppOpened();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
