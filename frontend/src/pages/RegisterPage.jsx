import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    
    setLoadingMessage('Registering user...');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/usuarios/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.name,
          email: formData.email,
          contrasena: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error registering user');
      }
      
      console.log('User registered:', data);
      
      setTimeout(() => {
        setLoadingMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Returning to the main page...');
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
        <h2>Create Account</h2>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
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
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="auth-submit-button">
            Sign Up
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
          <a href="/" onClick={handleReturnHome}>Return to main page</a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
