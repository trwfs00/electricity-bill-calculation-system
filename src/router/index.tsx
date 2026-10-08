import { createBrowserRouter } from "react-router-dom"
import { PublicLayout } from "../components/layouts/PublicLayout"
import { HomePage } from "../pages/Home"
import { SharedBillPage } from "../pages/SharedBill"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/split/water",
        element: <SharedBillPage defaultCategory='water' />,
      },
      {
        path: "/split/other",
        element: <SharedBillPage defaultCategory='other' />,
      },
    ],
  },
])
