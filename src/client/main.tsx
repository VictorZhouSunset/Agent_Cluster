// input: browser root element, global dashboard styles, and the top-level App component
// output: mounted React application with the shared Gemini-inspired visual system loaded first
// pos: client bootstrap entrypoint for the dashboard frontend
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
