import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installGlobalStyles } from "./theme";
import { resetStaleData } from "./api/persist";

// Must run before any component reads storage.
resetStaleData();
installGlobalStyles();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
