import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Utility function to check if user is authenticated
const isAuthenticated = () => {
  try {
    const user = sessionStorage.getItem('user');
    
    if (!user) {
      console.log('🚫 No user data in sessionStorage');
      return false;
    }
    
    const userData = JSON.parse(user);
    console.log('🔍 Checking auth for user:', userData.email);
    
    // Check if token exists
    if (!userData.token) {
      console.log('❌ No token found in user data');
      return false;
    }
    
    // Basic token validation (check if it looks like a JWT)
    const tokenParts = userData.token.split('.');
    if (tokenParts.length !== 3) {
      console.log('❌ Invalid token format');
      return false;
    }
    
    // Decode token to check expiration (optional)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('❌ Token expired');
        sessionStorage.removeItem('user');
        return false;
      }
      
      console.log('✅ Token valid until:', new Date(payload.exp * 1000));
    } catch (decodeError) {
      console.warn('⚠️ Could not decode token payload, but proceeding');
    }
    
    console.log('✅ User is authenticated');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
};

// Get user data safely
const getUserData = () => {
  try {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// AuthGuard component for protecting routes
const AuthGuard = ({ children, redirectTo = '/login' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔒 AuthGuard: Checking authentication...');
    
    // Small delay to ensure sessionStorage is fully loaded
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsLoading(false);
      
      if (!authenticated) {
        console.log('🚨 AuthGuard: Not authenticated, redirecting to login');
        navigate(redirectTo, { replace: true });
      } else {
        console.log('✅ AuthGuard: Authenticated, allowing access');
      }
    };
    
    checkAuth();
  }, [navigate, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">Verifying authentication...</p>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuth ? children : null;
};

// Hook for components to use authentication data
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const userData = getUserData();
      const authStatus = userData && userData.token ? true : false;
      
      setUser(userData);
      setIsAuthenticated(authStatus);
    };

    checkAuth();

    // Listen for storage changes (in case of logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    console.log('🚪 Logging out user...');
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login'; // Force reload to clear any cached state
  };

  return {
    user,
    isAuthenticated,
    logout
  };
};

// Logout function that can be used anywhere
const logoutUser = () => {
  console.log('🚪 Global logout function called');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};

// CSS styles for the loading screen
const styles = `
.fullscreen-loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  z-index: 1000;
}

.loading-text {
  margin-top: 20px;
  font-size: 18px;
  color: #25b09b;
}

.loader {
  width: 40px;
  height: 40px;
  position: relative;
  --c: no-repeat linear-gradient(#25b09b 0 0);
  background:
    var(--c) center/100% 10px,
    var(--c) center/10px 100%;
}

.loader:before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    var(--c) 0    0,
    var(--c) 100% 0,
    var(--c) 0    100%,
    var(--c) 100% 100%;
  background-size: 15.5px 15.5px;
  animation: l16 1.5s infinite cubic-bezier(0.3,1,0,1);
}

@keyframes l16 {
  33%  {inset:-10px;transform: rotate(0deg)}
  66%  {inset:-10px;transform: rotate(90deg)}
  100% {inset:0    ;transform: rotate(90deg)}
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('auth-guard-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'auth-guard-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default AuthGuard;
export { useAuth, logoutUser, isAuthenticated, getUserData };