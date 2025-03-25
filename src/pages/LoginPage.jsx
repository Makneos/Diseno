import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AuthPages.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para procesar el inicio de sesión
    console.log('Datos de inicio de sesión:', formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log in</h2>
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
            Log in
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Don´t have an account? <Link to="/register">Sign in</Link></p>
          <Link to="/">Return to Homepage</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;