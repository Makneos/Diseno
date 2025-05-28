import React, { useState } from 'react';
import './Counter.css'; 

const Counter = ({ onCountChange, initialCount = 0, maxCount = 10, label = "Cantidad" }) => {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    if (count < maxCount) {
      const newCount = count + 1;
      setCount(newCount);
      if (onCountChange) {
        onCountChange(newCount);
      }
    }
  };

  const decrement = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      if (onCountChange) {
        onCountChange(newCount);
      }
    }
  };

  const reset = () => {
    setCount(0);
    if (onCountChange) {
      onCountChange(0);
    }
  };

  return (
    <div className="counter-container">
      <label className="counter-label">{label}</label>
      <div className="counter-controls">
        <button 
          className="counter-btn counter-btn-decrement"
          onClick={decrement}
          disabled={count <= 0}
          aria-label="Disminuir cantidad"
        >
          <i className="bi bi-dash"></i>
        </button>
        
        <div className="counter-display">
          <span className="counter-value">{count}</span>
        </div>
        
        <button 
          className="counter-btn counter-btn-increment"
          onClick={increment}
          disabled={count >= maxCount}
          aria-label="Aumentar cantidad"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
      
      {count > 0 && (
        <button 
          className="counter-reset-btn"
          onClick={reset}
          aria-label="Resetear contador"
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reset
        </button>
      )}
      
      <div className="counter-info">
        <small className="text-muted">
          {count}/{maxCount} seleccionados
        </small>
      </div>
    </div>
  );
};

export default Counter;