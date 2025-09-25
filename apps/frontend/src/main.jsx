// Import polyfills first
import './polyfills.js'

import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App.jsx'
import './index.css'

const privyConfig = {
  // Login methods - email, Gmail, and Twitter (no wallet login)
  loginMethods: ['email', 'google', 'twitter'],
  
  // Appearance
  appearance: {
    theme: 'light',
    accentColor: '#3498db',
    logo: '🐹',
  },
  
  // Embedded wallets configuration - automatically created for all users
  embeddedWallets: {
    createOnLogin: 'all-users',
    requireUserPasswordOnCreate: false,
  },
}

// Development fallback for Privy App ID
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl'; // Demo App ID

// Error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Privy configuration error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h2>🐹 Zoomies - Development Mode</h2>
          <p>Privy authentication configuration issue detected.</p>
          <p>To test wallet functionality, you need to:</p>
          <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '1rem auto' }}>
            <li>Create a Privy account at <a href="https://privy.io/" target="_blank">https://privy.io/</a></li>
            <li>Create a new app in your dashboard</li>
            <li>Add your App ID to VITE_PRIVY_APP_ID environment variable</li>
            <li>Configure allowed origins for localhost:5174</li>
          </ol>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Try Again
          </button>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PrivyProvider
        appId={privyAppId}
        config={privyConfig}
      >
        <App />
      </PrivyProvider>
    </ErrorBoundary>
  </StrictMode>,
)