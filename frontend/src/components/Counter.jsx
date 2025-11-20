import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './Counter.css'; 

const Counter = ({ onCountChange, initialCount = 0, maxCount = 10, label = null }) => {
  const { t } = useTranslation();
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
      <label className="counter-label">{label || t('counter.quantity')}</label>
      <div className="counter-controls">
        <button 
          className="counter-btn counter-btn-decrement"
          onClick={decrement}
          disabled={count <= 0}
          aria-label={t('counter.decrease')}
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
          aria-label={t('counter.increase')}
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
      
      {count > 0 && (
        <button 
          className="counter-reset-btn"
          onClick={reset}
          aria-label={t('counter.reset')}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          {t('counter.reset')}
        </button>
      )}
      
      <div className="counter-info">
        <small className="text-muted">
          {t('counter.selected').replace('{count}', count).replace('{max}', maxCount)}
        </small>
      </div>
    </div>
  );
};

export default Counter;