import React from 'react';
import { STOCK_LEVELS, STOCK_COLORS, STOCK_LABELS } from '../services/PharmacyStockService';

const PharmacyStockIndicator = ({ 
  stockInfo, 
  showLabel = true, 
  showQuantity = true, 
  size = 'medium',
  className = '' 
}) => {
  if (!stockInfo) {
    return null;
  }

  const { level, quantity, price, lastUpdated } = stockInfo;
  const color = STOCK_COLORS[level];
  const label = STOCK_LABELS[level];

  // Size configurations
  const sizeConfig = {
    small: {
      indicator: 'width: 12px; height: 12px;',
      text: 'font-size: 0.75rem;',
      badge: 'font-size: 0.7rem; padding: 0.2rem 0.4rem;'
    },
    medium: {
      indicator: 'width: 16px; height: 16px;',
      text: 'font-size: 0.875rem;',
      badge: 'font-size: 0.75rem; padding: 0.25rem 0.5rem;'
    },
    large: {
      indicator: 'width: 20px; height: 20px;',
      text: 'font-size: 1rem;',
      badge: 'font-size: 0.875rem; padding: 0.375rem 0.75rem;'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Get appropriate icon based on stock level
  const getStockIcon = () => {
    switch (level) {
      case STOCK_LEVELS.HIGH:
        return 'bi-check-circle-fill';
      case STOCK_LEVELS.MEDIUM:
        return 'bi-exclamation-triangle-fill';
      case STOCK_LEVELS.LOW:
        return 'bi-exclamation-circle-fill';
      case STOCK_LEVELS.OUT_OF_STOCK:
        return 'bi-x-circle-fill';
      default:
        return 'bi-question-circle-fill';
    }
  };

  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`stock-indicator d-inline-flex align-items-center gap-2 ${className}`}>
      {/* Visual indicator */}
      <div 
        className="stock-dot rounded-circle"
        style={{
          backgroundColor: color,
          ...config.indicator,
          flexShrink: 0
        }}
        title={label}
      ></div>

      {/* Stock information */}
      <div className="stock-info">
        {showLabel && (
          <div className="d-flex align-items-center gap-2">
            <span 
              className="fw-medium"
              style={{ 
                color: color,
                ...config.text
              }}
            >
              <i className={`bi ${getStockIcon()} me-1`}></i>
              {label}
            </span>
            
            {showQuantity && quantity !== null && level !== STOCK_LEVELS.OUT_OF_STOCK && (
              <span 
                className="badge"
                style={{
                  backgroundColor: color,
                  color: 'white',
                  ...config.badge
                }}
              >
                {quantity} units
              </span>
            )}
          </div>
        )}

        {/* Price information */}
        {price && (
          <div className="price-info">
            <span className="fw-bold text-primary" style={config.text}>
              {formatPrice(price)}
            </span>
          </div>
        )}

        {/* Last updated - only show for small components when requested */}
        {size === 'large' && lastUpdated && (
          <small className="text-muted">
            Updated {formatLastUpdated(lastUpdated)}
          </small>
        )}
      </div>
    </div>
  );
};

// Compact version for map markers
export const CompactStockIndicator = ({ stockInfo, showPrice = false }) => {
  if (!stockInfo) return null;

  const { level, quantity, price } = stockInfo;
  const color = STOCK_COLORS[level];

  return (
    <div className="compact-stock-indicator d-flex align-items-center gap-1">
      <div 
        className="stock-dot rounded-circle"
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: color
        }}
      ></div>
      
      <small style={{ color: color, fontSize: '0.7rem' }}>
        {level === STOCK_LEVELS.OUT_OF_STOCK ? 'Out' : 
         level === STOCK_LEVELS.LOW ? `${quantity}` :
         level === STOCK_LEVELS.MEDIUM ? 'Limited' : 'In Stock'}
      </small>
      
      {showPrice && price && (
        <small className="text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
          ${Math.round(price / 1000)}k
        </small>
      )}
    </div>
  );
};

// Badge version for lists
export const StockBadge = ({ stockInfo, variant = 'default' }) => {
  if (!stockInfo) return null;

  const { level, quantity } = stockInfo;
  const color = STOCK_COLORS[level];
  const label = STOCK_LABELS[level];

  const badgeClass = variant === 'pill' ? 'badge rounded-pill' : 'badge';

  return (
    <span 
      className={`${badgeClass} text-white`}
      style={{ backgroundColor: color }}
    >
      {level === STOCK_LEVELS.OUT_OF_STOCK ? 'Out of Stock' :
       level === STOCK_LEVELS.LOW ? `Low (${quantity})` :
       level === STOCK_LEVELS.MEDIUM ? `Limited (${quantity})` :
       `In Stock (${quantity})`}
    </span>
  );
};

// Stock level comparison component
export const StockComparison = ({ medications }) => {
  if (!medications || medications.length === 0) return null;

  return (
    <div className="stock-comparison">
      <h6 className="mb-3">Stock Availability Comparison</h6>
      {medications.map((med, index) => (
        <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div>
            <strong>{med.pharmacy}</strong>
            <div className="small text-muted">{med.address}</div>
          </div>
          <div className="text-end">
            <PharmacyStockIndicator 
              stockInfo={med.stockInfo} 
              size="small"
              showQuantity={false}
            />
            {med.stockInfo?.price && (
              <div className="small text-primary fw-bold">
                ${Math.round(med.stockInfo.price / 1000)}k
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PharmacyStockIndicator;