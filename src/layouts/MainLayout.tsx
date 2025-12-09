// src/layouts/MainLayout.tsx
import { useState } from 'react'
import { Layout, Menu, Button, theme, Typography, Avatar, Tooltip } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DashboardOutlined,
  DotChartOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import './MainLayout.css'
import { useThemeMode } from '../context/ThemeContext'

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
  const { mode, toggleMode } = useThemeMode()

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
    <Layout className={`main-layout ${mode}-mode`}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`main-sider ${mode}-mode`}
      >
        <div className="logo-vertical">
          <Avatar shape="square" size="large" src="/vite.svg" />
          {!collapsed && <span className="logo-text">BigLotus</span>}
        </div>
        <Menu
          theme={mode === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className={`main-header ${mode}-mode`} style={{ padding: 0 }}>
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
              <Tooltip title={mode === 'dark' ? '切换为浅色' : '切换为深色'}>
                <Button
                  type="text"
                  icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleMode}
                  style={{ marginRight: 8 }}
                >
                  {mode === 'dark' ? '浅色' : '深色'}
                </Button>
              </Tooltip>
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
        <Content
          className={`main-content ${mode}-mode`}
          style={{ borderRadius: borderRadiusLG }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
