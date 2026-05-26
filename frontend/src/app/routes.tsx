import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Chat } from "./components/Chat";
import { Dashboard } from "./components/Dashboard";
import { Emergency } from "./components/Emergency";
import { Resources } from "./components/Resources";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      { index: true, element: <Chat /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "emergency", element: <Emergency /> },
      { path: "resources", element: <Resources /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);
