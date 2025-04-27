import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoadingMessage('Logging in...');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          contrasena: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error logging in');
      }

      console.log('Authenticated user:', data);

      sessionStorage.setItem('user', JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        email: data.email
      }));

      setTimeout(() => {
        setLoadingMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Returning to homepage...');
    setIsLoading(true);

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-button">
            Login
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
          <a href="/" onClick={handleReturnHome}>Return to main page</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
