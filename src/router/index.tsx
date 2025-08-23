import { createBrowserRouter } from "react-router-dom"
import { PublicLayout } from "../components/layouts/PublicLayout"
import { HomePage } from "../pages/Home"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
    ],
  },
])
