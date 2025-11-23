import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { STOCK_LEVELS, STOCK_COLORS, STOCK_LABELS } from '../services/PharmacyStockService';

const PharmacyStockIndicator = ({ 
  stockInfo, 
  showLabel = true, 
  showQuantity = true, 
  size = 'medium',
  className = '' 
}) => {
  const { t } = useTranslation();

  if (!stockInfo) {
    return null;
  }

  const { level, quantity, price, lastUpdated } = stockInfo;
  const color = STOCK_COLORS[level];
  
  // Traducir el label según el nivel
  const getTranslatedLabel = (level) => {
    switch (level) {
      case STOCK_LEVELS.HIGH:
        return t('stock.high');
      case STOCK_LEVELS.MEDIUM:
        return t('stock.medium');
      case STOCK_LEVELS.LOW:
        return t('stock.low');
      case STOCK_LEVELS.OUT_OF_STOCK:
        return t('stock.out');
      default:
        return t('common.unknown');
    }
  };

  const label = getTranslatedLabel(level);

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
    
    if (diffMinutes < 1) return t('stock.justNow');
    if (diffMinutes < 60) return t('stock.minutesAgo', { minutes: diffMinutes });
    if (diffMinutes < 1440) return t('stock.hoursAgo', { hours: Math.floor(diffMinutes / 60) });
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
          width: config.indicator.split(':')[1].trim(),
          height: config.indicator.split(':')[1].trim(),
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
              style={{ color: color }}
            >
              <i className={`bi ${getStockIcon()} me-1`}></i>
              {label}
            </span>
            
            {showQuantity && quantity !== null && level !== STOCK_LEVELS.OUT_OF_STOCK && (
              <span 
                className="badge"
                style={{
                  backgroundColor: color,
                  color: 'white'
                }}
              >
                {quantity} {t('stock.units')}
              </span>
            )}
          </div>
        )}

        {/* Price information */}
        {price && (
          <div className="price-info">
            <span className="fw-bold text-primary">
              {formatPrice(price)}
            </span>
          </div>
        )}

        {/* Last updated */}
        {size === 'large' && lastUpdated && (
          <small className="text-muted">
            {t('stock.updated')} {formatLastUpdated(lastUpdated)}
          </small>
        )}
      </div>
    </div>
  );
};

// Compact version for map markers
export const CompactStockIndicator = ({ stockInfo, showPrice = false }) => {
  const { t } = useTranslation();

  if (!stockInfo) return null;

  const { level, quantity, price } = stockInfo;
  const color = STOCK_COLORS[level];

  const getCompactLabel = (level) => {
    if (level === STOCK_LEVELS.OUT_OF_STOCK) return t('stock.out');
    if (level === STOCK_LEVELS.LOW) return `${quantity}`;
    if (level === STOCK_LEVELS.MEDIUM) return t('stock.limited');
    return t('stock.inStock');
  };

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
        {getCompactLabel(level)}
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
  const { t } = useTranslation();

  if (!stockInfo) return null;

  const { level, quantity } = stockInfo;
  const color = STOCK_COLORS[level];

  const badgeClass = variant === 'pill' ? 'badge rounded-pill' : 'badge';

  const getBadgeText = (level, quantity) => {
    if (level === STOCK_LEVELS.OUT_OF_STOCK) return t('stock.outOfStock');
    if (level === STOCK_LEVELS.LOW) return `${t('stock.lowStock')} (${quantity})`;
    if (level === STOCK_LEVELS.MEDIUM) return `${t('stock.limited')} (${quantity})`;
    return `${t('stock.inStock')} (${quantity})`;
  };

  return (
    <span 
      className={`${badgeClass} text-white`}
      style={{ backgroundColor: color }}
    >
      {getBadgeText(level, quantity)}
    </span>
  );
};

// Stock level comparison component
export const StockComparison = ({ medications }) => {
  const { t } = useTranslation();

  if (!medications || medications.length === 0) return null;

  return (
    <div className="stock-comparison">
      <h6 className="mb-3">{t('priceComparison.title')}</h6>
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