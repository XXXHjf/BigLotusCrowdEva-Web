// src/router/index.tsx
import type { ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import PredictionPage from '../pages/dashboard/PredictionPage'
import SimulationPage from '../pages/dashboard/SimulationPage'
import CausalDetectionPage from '../pages/dashboard/CausalDetectionPage'
import {
  ThemeModeContext,
  type ThemeMode,
} from '../context/ThemeContext'

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
          { path: 'monitor', element: <Navigate to="/dashboard/overview" replace /> },
          { path: 'prediction', element: <PredictionPage /> },
          { path: 'simulation', element: <SimulationPage /> },
          { path: 'causal-detection', element: <CausalDetectionPage /> },
        ],
      },
    ],
  },
  {
    path: '*', // 404 Not Found
    element: <Navigate to="/" replace />,
  },
])

const buildTheme = (mode: ThemeMode) => {
  const isDark = mode === 'dark'
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#4cc3ff',
      colorInfo: '#4cc3ff',
      colorBgBase: isDark ? '#070f1f' : '#f5f7fb',
      colorBgContainer: isDark ? 'rgba(15, 28, 61, 0.9)' : '#ffffff',
      colorBorder: isDark ? '#1f2d4d' : '#dce4f2',
      colorTextBase: isDark ? '#d8e6ff' : '#1f2d3d',
      colorTextSecondary: isDark ? '#9fb3d9' : '#4a5a73',
      fontFamily:
        "'DIN Alternate', 'Segoe UI', 'HarmonyOS Sans', 'PingFang SC', sans-serif",
      borderRadius: 12,
    },
    components: {
      Layout: {
        bodyBg: isDark ? '#070f1f' : '#eef2f8',
        headerBg: isDark ? 'rgba(15, 28, 61, 0.95)' : '#ffffff',
        siderBg: isDark ? 'rgba(10, 19, 43, 0.96)' : '#ffffff',
      },
      Card: {
        colorBgContainer: isDark ? 'rgba(15, 28, 61, 0.9)' : '#ffffff',
        borderRadiusLG: 14,
        colorBorderSecondary: isDark ? '#1f2d4d' : '#dce4f2',
      },
      Menu: {
        itemColor: isDark ? '#9fb3d9' : '#4a5a73',
        itemSelectedColor: '#4cc3ff',
        itemBg: 'transparent',
        itemSelectedBg: isDark ? 'rgba(76, 195, 255, 0.12)' : '#e6f4ff',
        itemHoverColor: isDark ? '#e6f4ff' : '#1f2d3d',
      },
      Button: {
        controlHeight: 40,
        colorBorder: '#4cc3ff',
      },
      Typography: {
        colorTextHeading: isDark ? '#e8f4ff' : '#1f2d3d',
      },
    },
  }
}

const AppRouter = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('themeMode') as ThemeMode | null
    const initial = stored || 'light'
    // 设置初始 data-theme，避免浅色模式首次渲染时的颜色闪烁
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial)
    }
    return initial
  })

  const toggleMode = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('themeMode', next)
      return next
    })
  }, [])

  const cockpitTheme = useMemo(() => buildTheme(themeMode), [themeMode])
  const themeContextValue = useMemo(
    () => ({
      mode: themeMode,
      toggleMode,
    }),
    [themeMode, toggleMode],
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])
  return (
    <ThemeModeContext.Provider value={themeContextValue}>
      <ConfigProvider locale={zhCN} theme={cockpitTheme}>
        <AntdApp style={{ height: '100%' }}>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </ThemeModeContext.Provider>
  )
}

export default AppRouter
