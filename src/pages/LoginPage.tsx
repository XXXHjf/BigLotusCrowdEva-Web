// src/pages/LoginPage.tsx
import { Card, Form, Input, Button, message, Typography, Space, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  UserOutlined,
  LockOutlined,
  BarChartOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import LoginGraphic from '../components/LoginGraphic'
import './LoginPage.css'
import { useThemeMode } from '../context/ThemeContext'

const { Title, Text } = Typography

const LoginPage = () => {
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeMode()

  const onFinish = (values: any) => {
    // 硬编码的登录逻辑
    if (values.username === 'admin' && values.password === 'admin') {
      message.success('登录成功!')
      localStorage.setItem('isAuthenticated', 'true')
      navigate('/')
    } else {
      message.error('用户名或密码错误!')
    }
  }

  return (
    <div className="login-page-container">
      <div className="login-grid-overlay" />
      <div className="login-theme-toggle">
        <Tooltip title={mode === 'dark' ? '切换为浅色' : '切换为深色'}>
          <Button
            type="text"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleMode}
          >
            {mode === 'dark' ? '浅色' : '深色'}
          </Button>
        </Tooltip>
      </div>
      <div className="login-inner">
        <div className="login-graphic-panel">
          <LoginGraphic />
          <Text className="login-graphic-caption">
            实时人群态势 · 一键推演预案
          </Text>
        </div>
        <div className="login-form-panel">
          <Card className="login-card panel-card" bordered={false}>
            <div className="login-header">
              <Space align="center" size="large">
                <div className="login-icon">
                  <BarChartOutlined />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    重要场所人群疏散可视化分析系统
                  </Title>
                  <Text type="secondary">智慧场馆 · 指挥中枢</Text>
                </div>
              </Space>
            </div>
            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="admin" />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="admin"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                >
                  进入驾驶舱
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
