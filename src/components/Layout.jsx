import { Menu, Layout, Avatar, Dropdown, Grid } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  TagOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logoLight from "../assets/logo-light.png";
import { PawPrintIcon, SyringeIcon } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return !screens.lg;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (!screens.lg && saved === null) {
      setCollapsed(true);
    }
  }, [screens]);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/Dashboard"),
    },
    {
      key: "/usuario",
      icon: <UserOutlined />,
      label: "Usuários",
      onClick: () => navigate("/usuario"),
    },
    {
      key: "/raca",
      icon: <TagOutlined />,
      label: "Raças",
      onClick: () => navigate("/raca"),
    },
    {
      key: "/especie",
      icon: <AppstoreOutlined />,
      label: "Espécies",
      onClick: () => navigate("/especie"),
    },
    {
      key: "/pet",
      icon: <PawPrintIcon size={20} />,
      label: "Pets",
      onClick: () => navigate("/pet"),
    },
    {
      key: "/vacina",
      icon: <SyringeIcon size={20} />,
      label: "Vacinas",
      onClick: () => navigate("/vacina"),
    },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sair",
      onClick: logout,
    },
  ];

  const siderWidth = collapsed ? 80 : 250;

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={250}
        className="fixed top-0 left-0 h-screen z-50 bg-primaryGreen"
        style={{ padding: 8 }}
      >
        <div className="flex flex-col h-full justify-between rounded-lg bg-primaryGreen">
          <div>
            <div className="flex items-center justify-between px-4 py-4">
              {!collapsed && (
                <span className="text-white text-xl font-bold">
                  PET<span className="font-normal">ESSENCE</span>
                </span>
              )}
              <button
                onClick={toggleCollapsed}
                className="text-white text-lg hover:bg-primaryGreenHouver rounded p-1"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>

            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              className="bg-primaryGreen text-white font-bold"
              items={menuItems}
            />
          </div>

          <div
            className="p-4 hover:bg-primaryGreenHouver cursor-pointer flex items-center space-x-3 text-white rounded-lg font-bold"
            onClick={logout}
          >
            <LogoutOutlined />
            {!collapsed && <span>Sair</span>}
          </div>
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: siderWidth,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Header
          className="flex items-center justify-between px-8 z-40 bg-white bg-opacity-80 backdrop-blur-md shadow-md"
          style={{
            position: "absolute",
            top: 16,
            left: siderWidth + 16,
            width: `calc(100% - ${siderWidth + 32}px)`,
            height: 72,
            borderRadius: 12,
            transition: "left 0.3s ease, width 0.3s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img src={logoLight} className="w-44" alt="logo" />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded">
              <Avatar icon={<UserOutlined />} />
              <span className="hidden sm:inline text-gray-700">
                {user?.displayName || user?.email}
              </span>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            marginTop: 104,
            padding: "24px",
          }}
          className="bg-white rounded-lg shadow-sm m-4"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
