import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/errorBoundry.tsx";
import { VSCodeProvider } from "./context/vscodeProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VSCodeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </VSCodeProvider>
  </StrictMode>
);
