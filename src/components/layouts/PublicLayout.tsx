import logo from "@/assets/my-logo-w.png"
import { AppShell, Container, Group, Image } from "@mantine/core"
import type { FC } from "react"
import { NavLink as RouterNavLink, Outlet } from "react-router-dom"

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  color: "white",
  fontSize: 14,
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
  padding: "8px 10px",
  borderRadius: 6,
  backgroundColor: isActive ? "rgba(255, 255, 255, 0.18)" : "transparent",
})

export const PublicLayout: FC = () => {
  return (
    <AppShell header={{ height: "64px" }}>
      <AppShell.Header bg='primary'>
        <Container size='lg'>
          <Group align='center' justify='space-between' h='60px' wrap='nowrap' gap='xs'>
            <RouterNavLink to='/' aria-label='หน้าคำนวณค่าไฟ MEA'>
              <Image src={logo} alt='logo' width={50} height={50} />
            </RouterNavLink>
            <Group component='nav' aria-label='เมนูหารบิล' gap={4} wrap='nowrap'>
              <RouterNavLink to='/' end style={navStyle}>ไฟฟ้า MEA</RouterNavLink>
              <RouterNavLink to='/split/water' style={navStyle}>น้ำ MWA</RouterNavLink>
              <RouterNavLink to='/split/other' style={navStyle}>บิลอื่น</RouterNavLink>
            </Group>
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
