import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Tiempo para la animación de salida
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type} ${isVisible ? 'show' : 'hide'}`}>
      <div className="toast-content">
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={() => setIsVisible(false)}>×</button>
      </div>
    </div>
  );
};

export default Toast;