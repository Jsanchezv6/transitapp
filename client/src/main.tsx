import { createRoot } from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";
import "./index.css";

const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  body {
    margin: 0;
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

createRoot(document.getElementById("root")!).render(
  <>
    <GlobalStyle />
    <App />
  </>
);
