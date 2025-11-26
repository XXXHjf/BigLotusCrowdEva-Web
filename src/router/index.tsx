// src/router/index.tsx
import type { ReactElement } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import LoginPage from '../pages/LoginPage'
import MainLayout from '../layouts/MainLayout'
import OverviewPage from '../pages/dashboard/OverviewPage'
import MonitorPage from '../pages/dashboard/MonitorPage'
import PredictionPage from '../pages/dashboard/PredictionPage'
import SimulationPage from '../pages/dashboard/SimulationPage'

// 私有路由组件
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated')
  return isAuthenticated ? children : <Navigate to="/login" />
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/overview" replace />,
      },
      {
        path: 'dashboard',
        children: [
          { index: true, element: <Navigate to="/dashboard/overview" replace /> },
          { path: 'overview', element: <OverviewPage /> },
          { path: 'monitor', element: <MonitorPage /> },
          { path: 'prediction', element: <PredictionPage /> },
          { path: 'simulation', element: <SimulationPage /> },
        ],
      },
    ],
  },
  {
    path: '*', // 404 Not Found
    element: <Navigate to="/" replace />,
  },
])

const AppRouter = () => {
  const cockpitTheme = {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#4cc3ff',
      colorInfo: '#4cc3ff',
      colorBgBase: '#070f1f',
      colorBgContainer: 'rgba(15, 28, 61, 0.9)',
      colorBorder: '#1f2d4d',
      colorTextBase: '#d8e6ff',
      colorTextSecondary: '#9fb3d9',
      fontFamily:
        "'DIN Alternate', 'Segoe UI', 'HarmonyOS Sans', 'PingFang SC', sans-serif",
      borderRadius: 12,
    },
    components: {
      Layout: {
        bodyBg: '#070f1f',
        headerBg: 'rgba(15, 28, 61, 0.95)',
        siderBg: 'rgba(10, 19, 43, 0.96)',
      },
      Card: {
        colorBgContainer: 'rgba(15, 28, 61, 0.9)',
        borderRadiusLG: 14,
        colorBorderSecondary: '#1f2d4d',
      },
      Menu: {
        itemColor: '#9fb3d9',
        itemSelectedColor: '#4cc3ff',
        itemBg: 'transparent',
        itemSelectedBg: 'rgba(76, 195, 255, 0.12)',
        itemHoverColor: '#e6f4ff',
      },
      Button: {
        controlHeight: 40,
        colorBorder: '#4cc3ff',
      },
      Typography: {
        colorTextHeading: '#e8f4ff',
      },
    },
  }

  return (
    <ConfigProvider locale={zhCN} theme={cockpitTheme}>
      <AntdApp style={{ height: '100%' }}>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

export default AppRouter
