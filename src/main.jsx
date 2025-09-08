import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import locale from "antd/locale/pt_BR";
import dayjs from "dayjs";
import { ConfigProvider } from "antd";
import "dayjs/locale/pt-br";
dayjs.locale("pt-br");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider locale={locale}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
