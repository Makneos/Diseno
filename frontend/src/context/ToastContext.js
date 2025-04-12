import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast/Toast';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Métodos de ayuda para tipos comunes de toast
  const showInfo = (message, duration) => addToast(message, 'info', duration);
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);

  return (
    <ToastContext.Provider value={{ showInfo, showSuccess, showWarning, showError }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};