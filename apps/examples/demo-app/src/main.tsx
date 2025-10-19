import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Error Boundary component for runtime error display
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    console.error('Runtime Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          fontFamily: 'monospace',
          color: '#c92a2a'
        }}>
          <h1 style={{ color: '#c92a2a', marginBottom: '16px' }}>
            🚨 Runtime Error
          </h1>
          <div style={{ marginBottom: '16px' }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Stack Trace:</strong>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.stack}
            </pre>
          </div>
          {this.state.errorInfo && (
            <div>
              <strong>Component Stack:</strong>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#c92a2a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found')
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>'
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}
