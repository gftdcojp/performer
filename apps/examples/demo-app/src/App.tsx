import React, { useState, useEffect } from 'react'
import Layout from '../app/layout'
import HomePage from '../app/page/page.client'
import OrderPage from '../app/order/page.client'
import AdminDashboard from '../app/admin/dashboard/page.client'
import ProcessInstancesPage from '../app/admin/processes/page.client'
import TaskManagementPage from '../app/admin/tasks/page.client'
import IntegratedProcessManagementPage from '../app/admin/integrated/page.client'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [routeParams, setRouteParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
      parseRoute(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    // Initial route parsing
    parseRoute(window.location.pathname)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const parseRoute = (path: string) => {
    const params: Record<string, string> = {}

    // Handle /order/:businessKey route
    if (path.startsWith('/order/')) {
      const parts = path.split('/')
      if (parts.length >= 3) {
        params.businessKey = parts[2]
      }
    }

    setRouteParams(params)
  }

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    parseRoute(path)
  }

  // Make navigate available globally for components
  (window as any).navigate = navigate

  const renderPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <HomePage />
    }

    if (currentPath.startsWith('/order/')) {
      return <OrderPage businessKey={routeParams.businessKey} />
    }

    if (currentPath === '/admin/dashboard') {
      return <AdminDashboard />
    }

    if (currentPath === '/admin/processes') {
      return <ProcessInstancesPage />
    }

    if (currentPath === '/admin/tasks') {
      return <TaskManagementPage />
    }

    if (currentPath === '/admin/integrated') {
      return <IntegratedProcessManagementPage />
    }

    return <HomePage />
  }

  return (
    <Layout>
      {renderPage()}
    </Layout>
  )
}

export default App
