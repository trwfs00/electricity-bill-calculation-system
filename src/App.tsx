import "@mantine/charts/styles.css"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import { DatesProvider } from "@mantine/dates"
import "@mantine/dates/styles.css"
import "@mantine/notifications/styles.css"
import dayjs from "dayjs"
import "dayjs/locale/th"
import buddhistEra from "dayjs/plugin/buddhistEra"
import { RouterProvider } from "react-router-dom"
import { theme } from "./const/theme"
import { router } from "./router"
dayjs.extend(buddhistEra)
dayjs.locale("th")

function App() {
  return (
    <MantineProvider theme={theme}>
      <DatesProvider settings={{ locale: "th" }}>
        <RouterProvider router={router} />
      </DatesProvider>
    </MantineProvider>
  )
}

export default App
