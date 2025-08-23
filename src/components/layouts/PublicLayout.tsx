import logo from "@/assets/mea-logo-w.png"
import { AppShell, Container, Group, Image } from "@mantine/core"
import type { FC } from "react"
import { NavLink, Outlet } from "react-router-dom"

export const PublicLayout: FC = () => {
  return (
    <AppShell header={{ height: "64px" }}>
      <AppShell.Header bg='primary'>
        <Container size='lg'>
          <Group align='center' justify='space-between' h='60px'>
            <NavLink to='/'>
              <Image src={logo} alt='logo' width={50} height={50} />
            </NavLink>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main bg='#D9D9D9'>
        <Container size='lg' py='md'>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
