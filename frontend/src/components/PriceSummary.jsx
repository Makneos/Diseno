import React from 'react';

const PriceSummary = ({ comparisonResults }) => {
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
              Price Summary
            </h4>
            <div className="row text-center">
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-success">${minPrice.toLocaleString('en-US')}</div>
                  <div className="small text-muted">Lowest Price</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-danger">${maxPrice.toLocaleString('en-US')}</div>
                  <div className="small text-muted">Highest Price</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-info">${avgPrice.toFixed(0).toLocaleString('en-US')}</div>
                  <div className="small text-muted">Average Price</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="statistic">
                  <div className="h4 text-warning">${savings.toLocaleString('en-US')}</div>
                  <div className="small text-muted">Max Savings</div>
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
              Quick Tip
            </h5>
            <p className="mb-0">
              Consider generic alternatives - they contain the same active ingredient 
              and are often significantly cheaper while being equally effective.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;