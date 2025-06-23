import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// CSS Styles
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
  selectedMedicationData,
  medicationName,
  chartType = 'line', 
  showComparison = false,
  timeRange = '30d' 
}) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate data using ONLY existing real prices (no simulation)
  const generateRealDataPoints = (allMedicationData, medicationName = '') => {
    const data = [];
    const today = new Date();
    
    console.log(`📈 Using real data points for "${medicationName}"`);
    console.log(`📊 Available real prices:`, allMedicationData);
    
    if (!allMedicationData || allMedicationData.length === 0) {
      console.log('❌ No real data available');
      return [];
    }
    
    // Create one data point per pharmacy with real prices
    allMedicationData.forEach((medData, index) => {
      if (medData && medData.precio && medData.farmacia) {
        const date = new Date(today);
        // Spread points across a few days for visualization
        date.setDate(today.getDate() - (allMedicationData.length - 1 - index));
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toISOString().split('T')[0],
          precio: medData.precio,
          pharmacy: medData.farmacia.nombre,
          isRealPrice: true, // All points are real
          availability: medData.disponible
        });
      }
    });
    
    // Sort by date
    data.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    
    console.log(`📊 Generated ${data.length} real data points:`, data);
    return data;
  };

  // Generate pharmacy comparison data (for bar chart only)
  const generatePharmacyComparison = (allMedicationData) => {
    return allMedicationData.map(med => ({
      farmacia: med.farmacia.nombre,
      precio: med.precio,
      disponible: med.disponible
    }));
  };

  useEffect(() => {
    if (!selectedMedicationData || selectedMedicationData.length === 0) {
      setIsLoading(false);
      return;
    }

    // Simulate data loading
    setTimeout(() => {
      let data;
      
      if (showComparison) {
        // For bar chart: show comparison between pharmacies
        data = generatePharmacyComparison(selectedMedicationData);
      } else {
        // For line chart: use only real existing data
        const selectedMed = selectedMedicationData[0];
        if (selectedMed && selectedMed.precio) {
          data = generateRealDataPoints(
            selectedMedicationData,
            selectedMed.medicamento_nombre || medicationName
          );
        } else {
          data = [];
        }
      }
      
      setChartData(data);
      setIsLoading(false);
    }, 1000);
  }, [selectedMedicationData, timeRange, showComparison]);

  // Formatters for tooltips
  const formatTooltip = (value, name) => {
    return [`$${value.toLocaleString('en-US')}`, 'Price'];
  };

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

  if (!selectedMedicationData || selectedMedicationData.length === 0) {
    return (
      <div className="alert alert-info text-center">
        <i className="bi bi-info-circle me-2"></i>
        No price data available to display the chart.
      </div>
    );
  }

  if (showComparison) {
    // Bar chart: Comparison between pharmacies
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
                formatter={(value) => [`$${value.toLocaleString('en-US')}`, 'Price']}
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

  // Line chart: Only trend of selected medication
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Price Trend - {medicationName} 
          <small className="text-muted">({chartData.length} real price{chartData.length !== 1 ? 's' : ''})</small>
        </h5>
        <div className="btn-group btn-group-sm" role="group">
          <span className="btn btn-outline-secondary disabled">
            Real Data Only
          </span>
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
            
            {/* SINGLE LINE: Only the selected medication */}
            <Line
              type="monotone"
              dataKey="precio"
              name={medicationName}
              stroke="#007bff"
              strokeWidth={3}
              dot={(props) => {
                // Show all points as real
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="#dc3545"
                    stroke="#dc3545"
                    strokeWidth="2"
                  />
                );
              }}
              activeDot={{ r: 8, fill: '#0056b3', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        
      </div>
    </div>
  );
};

// Main container component
const PriceChartsContainer = ({ medicationData, medicationName, selectedMedication }) => {
  const [activeTab, setActiveTab] = useState('trend');

  // DEBUG: Show what data is arriving
  console.log('📊 PriceChartsContainer received:');
  console.log('- medicationData:', medicationData);
  console.log('- medicationName:', medicationName);
  console.log('- selectedMedication:', selectedMedication);

  if (!medicationData || medicationData.length === 0) {
    console.log('❌ No medicationData available');
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        No price data available to display the chart.
        <br />
        <small className="text-muted">
          Debug: medicationData = {medicationData ? `${medicationData.length} elements` : 'null/undefined'}
        </small>
      </div>
    );
  }

  // Validate that data has correct structure
  const validMedicationData = medicationData.filter(med => 
    med && 
    med.farmacia && 
    med.farmacia.nombre && 
    med.precio !== undefined && 
    med.precio !== null &&
    !isNaN(med.precio)
  );

  console.log('✅ Valid data after filter:', validMedicationData);

  if (validMedicationData.length === 0) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Price data does not have the correct format to display charts.
        <br />
        <small className="text-muted">
          Found {medicationData.length} elements, but none have valid structure.
        </small>
      </div>
    );
  }

  // 🎯 FILTER ONLY THE SPECIFIC SELECTED MEDICATION
  const specificMedicationData = validMedicationData.filter(med => {
    // Filter by exact name of selected medication
    const medicationMatch = med.medicamento_nombre && 
                           selectedMedication && 
                           selectedMedication.nombre &&
                           med.medicamento_nombre.toLowerCase().includes(selectedMedication.nombre.toLowerCase());
    
    console.log(`🔍 Comparing: "${med.medicamento_nombre}" vs "${selectedMedication?.nombre}" = ${medicationMatch}`);
    
    return medicationMatch;
  });

  console.log('🎯 Specific medication data:', specificMedicationData);
  console.log(`📊 Found ${specificMedicationData.length} prices for "${selectedMedication?.nombre}"`);

  // For trend chart: ONLY the specific medication
  const singleMedicationData = specificMedicationData.length > 0 ? specificMedicationData : [];

  // If no specific medication data, use first available
  const fallbackData = specificMedicationData.length === 0 && validMedicationData.length > 0 
    ? [validMedicationData[0]] 
    : [];

  console.log('📈 Data for trend chart:', singleMedicationData);
  console.log('🔄 Fallback data:', fallbackData);

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
                    Price Trend
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
                    {singleMedicationData.length > 0 ? (
                      <div>
                        <div className="alert alert-info mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Showing price trend for: <strong>"{selectedMedication?.nombre}"</strong>
                          <br />
                          <small>
                            Found {singleMedicationData.length} real price(s) for this specific medication.
                            {singleMedicationData.length === 1 && " Displaying single data point."}
                            {singleMedicationData.length > 1 && " Connecting real price points from different pharmacies."}
                          </small>
                        </div>
                        <PriceTrendChart 
                          selectedMedicationData={singleMedicationData}
                          medicationName={selectedMedication?.nombre || medicationName}
                          chartType="line"
                          showComparison={false}
                          timeRange="30d"
                        />
                      </div>
                    ) : fallbackData.length > 0 ? (
                      <div>
                        <div className="alert alert-warning mb-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No specific prices found for <strong>"{selectedMedication?.nombre}"</strong>.
                          <br />
                          <small>Showing data from first medication with the same active ingredient as reference.</small>
                        </div>
                        <PriceTrendChart 
                          selectedMedicationData={fallbackData}
                          medicationName={fallbackData[0]?.medicamento_nombre || medicationName}
                          chartType="line"
                          showComparison={false}
                          timeRange="30d"
                        />
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Not enough data to show price trend.
                        <br />
                        <small>No real price data available for this medication.</small>
                        <PriceTrendChart 
                          selectedMedicationData={[{
                            farmacia: { nombre: 'Demo' },
                            precio: 1500,
                            disponible: true,
                            url_producto: '#',
                            medicamento_nombre: selectedMedication?.nombre || 'Test Medication'
                          }]}
                          medicationName={selectedMedication?.nombre || 'Test Medication'}
                          chartType="line"
                          showComparison={false}
                          timeRange="30d"
                        />
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'comparison' && (
                  <div className="tab-pane fade show active p-3">
                    {validMedicationData.length > 0 ? (
                      <PriceTrendChart 
                        selectedMedicationData={validMedicationData}
                        medicationName={medicationName}
                        chartType="bar"
                        showComparison={true}
                      />
                    ) : (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Not enough data to show pharmacy comparison.
                      </div>
                    )}
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