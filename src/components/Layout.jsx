import { useState } from "react"
import { Layout, Menu, Avatar, Dropdown, Button, theme } from "antd"
import {
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

const { Header, Sider, Content } = Layout

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    // {
    //   key: "/dashboard",
    //   icon: <DashboardOutlined />,
    //   label: "Dashboard",
    //   onClick: () => navigate("/dashboard"),
    // },
    // {
    //   key: "/profile",
    //   icon: <UserOutlined />,
    //   label: "Perfil",
    //   onClick: () => navigate("/profile"),
    // },
    {
      key: "/users",
      icon: <TeamOutlined />,
      label: "Usuários",
      onClick: () => navigate("/users"),
    },
  ]

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Perfil",
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sair",
      onClick: logout,
    },
  ]

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} className="bg-white shadow-md">
        <div className="p-4 text-center border-b">
          <h1 className={`font-bold text-blue-600 ${collapsed ? "text-sm" : "text-lg"}`}>
            {collapsed ? "App" : "Meu App"}
          </h1>
        </div>
        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} className="border-r-0" />
      </Sider>

      <Layout>
        <Header
          style={{ padding: 0, background: colorBgContainer }}
          className="shadow-sm flex items-center justify-between px-4"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg"
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
              <Avatar icon={<UserOutlined />} />
              <span className="hidden sm:inline">{user?.displayName || user?.email}</span>
            </div>
          </Dropdown>
        </Header>

        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm">{children}</Content>
      </Layout>
    </Layout>
  )
}
