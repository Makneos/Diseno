import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const PriceSummary = ({ comparisonResults }) => {
  const { t } = useTranslation();

  if (!comparisonResults.farmacias) {
    return null;
  }

  const allPrices = comparisonResults.farmacias.flatMap(f => f.medicamentos.map(m => m.precio));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const avgPrice = (allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
  const savings = maxPrice - minPrice;

  return (
    <div className="row mt-5">
      <div className="col-md-8">
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="card-title">
              <i className="bi bi-info-circle me-2 text-info"></i>
              {t('priceSummary.title')}
            </h4>
            <div className="row text-center">
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-success">${minPrice.toLocaleString('es-CL')}</div>
                  <div className="small text-muted">{t('priceSummary.lowestPrice')}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-danger">${maxPrice.toLocaleString('es-CL')}</div>
                  <div className="small text-muted">{t('priceSummary.highestPrice')}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-info">${avgPrice.toFixed(0).toLocaleString('es-CL')}</div>
                  <div className="small text-muted">{t('priceSummary.averagePrice')}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-warning">${savings.toLocaleString('es-CL')}</div>
                  <div className="small text-muted">{t('priceSummary.maxSavings')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">
              <i className="bi bi-lightbulb me-2 text-warning"></i>
              {t('priceSummary.quickTip')}
            </h5>
            <p className="mb-0">
              {t('priceSummary.tipText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;