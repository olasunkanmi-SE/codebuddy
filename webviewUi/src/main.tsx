import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { VSCodeProvider } from "./context/vscodeProvider.tsx";
import { ErrorBoundary } from "./components/errorBoundry.tsx";
import { ErrorFallBackComponent } from "./components/errorFallBack.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VSCodeProvider>
      <ErrorBoundary fallBackComponent={ErrorFallBackComponent()}>
        <App />
      </ErrorBoundary>
    </VSCodeProvider>
  </StrictMode>
);
