
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Every API call in this app needs the auth session cookie attached.
  // Rather than adding `credentials: "include"` to ~30 individual fetch()
  // calls across every page (and remembering to do it in every future one),
  // patch the global default once here. Explicit credentials options on
  // individual calls still take precedence over this default.
  //
  // Also redirect to /login on any 401 from the API — an expired or
  // invalidated session should send the user back to sign in rather than
  // leaving every page silently showing empty data.
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const response = await originalFetch(input, { credentials: "include", ...init });
    const url = typeof input === "string" ? input : input.toString();
    if (response.status === 401 && url.includes("/api/") && !url.includes("/api/auth/")) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return response;
  };

  createRoot(document.getElementById("root")!).render(<App />);
  