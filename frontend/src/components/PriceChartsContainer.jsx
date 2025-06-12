import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Additional CSS styles to improve appearance
const chartStyles = `
  .price-charts-container .nav-tabs .nav-link {
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: #6c757d;
    font-weight: 500;
  }
  
  .price-charts-container .nav-tabs .nav-link.active {
    border-bottom-color: #007bff;
    color: #007bff;
    background: none;
  }
  
  .price-charts-container .nav-tabs .nav-link:hover {
    border-bottom-color: #007bff;
    color: #007bff;
  }
  
  .statistic {
    padding: 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    margin-bottom: 0.5rem;
  }
  
  .recharts-tooltip-wrapper {
    z-index: 1000;
  }
`;

const PriceTrendChart = ({ 
  medicationData, 
  chartType = 'line', 
  showComparison = false,
  timeRange = '30d' 
}) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate historical data based on current price
  const generateHistoricalData = (currentPrices, days = 30) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dataPoint = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString().split('T')[0]
      };
      
      // For each pharmacy, generate price variation
      currentPrices.forEach(pharmacy => {
        // Simulate price fluctuation (±10% of current price)
        const variation = (Math.random() - 0.5) * 0.2; // ±20% maximum
        const basePrice = pharmacy.precio;
        const simulatedPrice = Math.round(basePrice * (1 + variation * (i / days)));
        
        dataPoint[pharmacy.farmacia.nombre] = Math.max(simulatedPrice, basePrice * 0.8);
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Generate current comparison data
  const generateCurrentComparison = (currentPrices) => {
    return currentPrices.map(pharmacy => ({
      farmacia: pharmacy.farmacia.nombre,
      precio: pharmacy.precio,
      disponible: pharmacy.disponible
    }));
  };

  useEffect(() => {
    if (!medicationData) {
      setIsLoading(false);
      return;
    }

    // Simulate data loading
    setTimeout(() => {
      let data;
      
      if (showComparison) {
        // Data for pharmacy comparison chart
        data = generateCurrentComparison(medicationData);
      } else {
        // Data for temporal trend chart
        data = generateHistoricalData(medicationData, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
      }
      
      setChartData(data);
      setIsLoading(false);
    }, 1000);
  }, [medicationData, timeRange, showComparison]);

  // Color configuration for pharmacies
  const pharmacyColors = {
    'Ahumada': '#dc3545',
    'Cruz Verde': '#28a745', 
    'Salcobrand': '#007bff'
  };

  // Formatter for tooltip
  const formatTooltip = (value, name) => {
    if (showComparison) {
      return [`$${value.toLocaleString('en-US')}`, name];
    }
    return [`$${value.toLocaleString('en-US')}`, name];
  };

  // Formatter for labels
  const formatLabel = (label) => {
    if (showComparison) {
      return `Pharmacy: ${label}`;
    }
    return `Date: ${label}`;
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading chart...</span>
          </div>
          <div className="text-muted">Loading price data...</div>
        </div>
      </div>
    );
  }

  if (!medicationData || medicationData.length === 0) {
    return (
      <div className="alert alert-info text-center">
        <i className="bi bi-info-circle me-2"></i>
        No price data available to display the chart.
      </div>
    );
  }

  if (showComparison) {
    // Bar chart for pharmacy comparison
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-bar-chart me-2"></i>
            Price Comparison by Pharmacy
          </h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="farmacia" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString('en-US')}`}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  `$${value.toLocaleString('en-US')}`,
                  'Price'
                ]}
                labelFormatter={(label) => `Pharmacy: ${label}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="precio" 
                fill="#007bff"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-3">
            <div className="row text-center">
              <div className="col-md-4">
                <div className="small text-muted">Minimum Price</div>
                <div className="h6 text-success">
                  ${Math.min(...chartData.map(d => d.precio)).toLocaleString('en-US')}
                </div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Maximum Price</div>
                <div className="h6 text-danger">
                  ${Math.max(...chartData.map(d => d.precio)).toLocaleString('en-US')}
                </div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Difference</div>
                <div className="h6 text-warning">
                  ${(Math.max(...chartData.map(d => d.precio)) - Math.min(...chartData.map(d => d.precio))).toLocaleString('en-US')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Line chart for temporal trend
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Price Trends ({timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'})
        </h5>
        <div className="btn-group btn-group-sm" role="group">
          <input type="radio" className="btn-check" name="timeRange" id="7d" defaultChecked={timeRange === '7d'} />
          <label className="btn btn-outline-primary" htmlFor="7d">7d</label>
          
          <input type="radio" className="btn-check" name="timeRange" id="30d" defaultChecked={timeRange === '30d'} />
          <label className="btn btn-outline-primary" htmlFor="30d">30d</label>
          
          <input type="radio" className="btn-check" name="timeRange" id="90d" defaultChecked={timeRange === '90d'} />
          <label className="btn btn-outline-primary" htmlFor="90d">90d</label>
        </div>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={formatLabel}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {medicationData.map((pharmacy, index) => (
              <Line
                key={pharmacy.farmacia.nombre}
                type="monotone"
                dataKey={pharmacy.farmacia.nombre}
                stroke={pharmacyColors[pharmacy.farmacia.nombre] || '#6c757d'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-3">
          <div className="alert alert-info mb-0">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Historical data is simulated for demonstration purposes. 
              Once the tracking table is implemented, real data will be displayed.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

// Container component that handles multiple chart types
const PriceChartsContainer = ({ medicationData, medicationName }) => {
  const [activeTab, setActiveTab] = useState('trend');

  if (!medicationData || medicationData.length === 0) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Insufficient data to display price charts.
      </div>
    );
  }

  return (
    <div className="price-charts-container">
      <style>{chartStyles}</style>
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button 
                    className={`nav-link ${activeTab === 'trend' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trend')}
                    type="button"
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    Price Trends
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button 
                    className={`nav-link ${activeTab === 'comparison' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comparison')}
                    type="button"
                  >
                    <i className="bi bi-bar-chart me-2"></i>
                    Pharmacy Comparison
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body p-0">
              <div className="tab-content">
                {activeTab === 'trend' && (
                  <div className="tab-pane fade show active p-3">
                    <PriceTrendChart 
                      medicationData={medicationData}
                      chartType="line"
                      showComparison={false}
                      timeRange="30d"
                    />
                  </div>
                )}
                {activeTab === 'comparison' && (
                  <div className="tab-pane fade show active p-3">
                    <PriceTrendChart 
                      medicationData={medicationData}
                      chartType="bar"
                      showComparison={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick statistics */}
      <div className="row">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="card-title">
                <i className="bi bi-calculator me-2"></i>
                Price Summary for "{medicationName}"
              </h6>
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="statistic">
                    <div className="h5 text-success">
                      ${Math.min(...medicationData.map(d => d.precio)).toLocaleString('en-US')}
                    </div>
                    <div className="small text-muted">Lowest Price</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="statistic">
                    <div className="h5 text-danger">
                      ${Math.max(...medicationData.map(d => d.precio)).toLocaleString('en-US')}
                    </div>
                    <div className="small text-muted">Highest Price</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="statistic">
                    <div className="h5 text-info">
                      ${Math.round(medicationData.reduce((sum, d) => sum + d.precio, 0) / medicationData.length).toLocaleString('en-US')}
                    </div>
                    <div className="small text-muted">Average Price</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="statistic">
                    <div className="h5 text-warning">
                      ${(Math.max(...medicationData.map(d => d.precio)) - Math.min(...medicationData.map(d => d.precio))).toLocaleString('en-US')}
                    </div>
                    <div className="small text-muted">Max Savings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChartsContainer;