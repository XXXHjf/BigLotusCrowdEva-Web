// src/layouts/MainLayout.tsx
import { useState } from 'react'
import { Layout, Menu, Button, theme, Typography, Avatar } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DashboardOutlined,
  DotChartOutlined,
  LineChartOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import './MainLayout.css'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: '/dashboard/overview',
    icon: <DashboardOutlined />,
    label: '全域态势',
  },
  {
    key: '/dashboard/monitor',
    icon: <DotChartOutlined />,
    label: '聚类监控',
  },
  {
    key: '/dashboard/prediction',
    icon: <LineChartOutlined />,
    label: '趋势研判',
  },
  {
    key: '/dashboard/simulation',
    icon: <ExperimentOutlined />,
    label: '应急沙盘',
  },
]

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    navigate('/login')
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} className="main-sider">
        <div className="logo-vertical">
          <Avatar shape="square" size="large" src="/vite.svg" />
          {!collapsed && <span className="logo-text">BigLotus</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="main-header" style={{ padding: 0 }}>
          <div className="header-content">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="trigger-btn"
            />
            <div className="header-right">
              <div className="header-titles">
                <Title level={5} style={{ margin: 0 }}>
                  智慧场馆人群态势感知系统
                </Title>
              </div>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </div>
          </div>
        </Header>
        <Content className="main-content" style={{ borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
