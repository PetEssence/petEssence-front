import { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Button, theme } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logoDark from "../assets/logo_dark.png";
const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/usuario",
      label: "Usuários",
      onClick: () => navigate("/usuario"),
    },
    {
      key: "/raca",
      label: "Raças",
      onClick: () => navigate("/raca"),
    },
    {
      key: "/especie",
      label: "Espécies",
      onClick: () => navigate("/especie"),
    },
  ];

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
  ];

  return (
    <Layout>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white shadow-md p-4 "
      > 
        <div className="flex flex-col justify-between h-screen items-center">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="border-r-0"
          />
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg mb-8"
          />
        </div>
      </Sider>

      <Layout>
        <Header className="shadow-sm flex items-center justify-between px-8 bg-primaryGreen">
          <img src={logoDark} className="w-44"></img>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded">
              <Avatar icon={<UserOutlined />} />
              <span className="hidden sm:inline text-white">
                {user?.displayName || user?.email}
              </span>
            </div>
          </Dropdown>
        </Header>

        <Content className="bg-white rounded-lg shadow-sm p-8">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
