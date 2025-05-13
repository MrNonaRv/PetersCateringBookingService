import { createRoot } from "react-dom/client";
import { Helmet, HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>Peter's Creation Catering Services - Exceptional Catering for Special Events</title>
      <meta name="description" content="Professional catering services with delicious cuisine for weddings, corporate events, and private parties. Book online today!" />
    </Helmet>
    <App />
  </HelmetProvider>
);
