import puppeteer from "puppeteer";
import fs from "fs";

async function scrapeFarmaciasAhumadaMedicamentos() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1024,768']
  });

  const page = await browser.newPage();
  const outputFile = "ahumada_medicamentos.json";
  const priceHistoryFile = "price_history.json";
  let totalProducts = 0;
  let loadMoreCount = 0;
  
  // Set to track product IDs that have already been registered
  const registeredProductIds = new Set();
  
  const MAX_LOAD_MORE = 20; // Load more 20 times

  // Check if this is the first run or a price monitoring run
  const isFirstRun = !fs.existsSync(outputFile);
  
  // Initialize files
  let existingProducts = [];
  let priceHistory = {};
  
  try {
    if (!isFirstRun) {
      // Read existing products for price monitoring
      existingProducts = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      
      // Add existing product IDs to the set
      existingProducts.forEach(product => {
        if (product.productId && product.productId !== 'No product ID found') {
          registeredProductIds.add(product.productId);
        }
      });
      
      console.log(`🔍 PRICE MONITORING MODE - Found ${registeredProductIds.size} existing products to monitor`);
      
      // Load or initialize price history
      if (fs.existsSync(priceHistoryFile)) {
        priceHistory = JSON.parse(fs.readFileSync(priceHistoryFile, 'utf8'));
      }
    } else {
      console.log(`🆕 FIRST RUN MODE - Starting initial product scraping`);
      // Create new files with empty data
      fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
      fs.writeFileSync(priceHistoryFile, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error("Error handling existing files:", error);
    // Create new files if there was an error
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    fs.writeFileSync(priceHistoryFile, JSON.stringify({}, null, 2));
  }

  try {
    // Navigate to the medicamentos section
    await page.goto("https://www.farmaciasahumada.cl/medicamentos", { 
      waitUntil: "networkidle2",
      timeout: 30000 
    });
    
    console.log("Page loaded successfully");
    
    // Accept cookies using the exact selector provided
    await acceptCookies(page);
    
    // Wait for the initial products to load
    const containerSelector = "#maincontent > div.container.search-results > div:nth-child(3) > div";
    const productsContainerSelector = "#product-search-results > div:nth-child(2) > div.col-sm-12.col-md-9 > div.row.product-grid.equal-height";
    
    await Promise.race([
      page.waitForSelector(containerSelector, { timeout: 15000 }),
      page.waitForSelector(productsContainerSelector, { timeout: 15000 })
    ]).catch(e => {
      console.log("Timeout waiting for product container.");
    });

    // Give time for all content to load
    await sleep(3000);
    
    if (isFirstRun) {
      // FIRST RUN: Extract all products normally
      await performInitialScraping(page, containerSelector, productsContainerSelector, outputFile, registeredProductIds, MAX_LOAD_MORE);
    } else {
      // PRICE MONITORING: Only check prices for existing products
      await performPriceMonitoring(page, containerSelector, productsContainerSelector, existingProducts, outputFile, priceHistoryFile, priceHistory, MAX_LOAD_MORE);
    }
    
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    console.log(`✅ Process completed`);
    await browser.close();
  }

  return totalProducts;
}

async function performInitialScraping(page, containerSelector, productsContainerSelector, outputFile, registeredProductIds, MAX_LOAD_MORE) {
  let totalProducts = 0;
  let loadMoreCount = 0;
  
  console.log("Extracting initial products...");
  let initialProducts = await extractAllProducts(page, containerSelector, productsContainerSelector);
  console.log(`Found ${initialProducts.length} initial products`);
  
  // Filter out products with duplicate IDs
  const uniqueInitialProducts = filterUniqueProducts(initialProducts, registeredProductIds);
  console.log(`After filtering, ${uniqueInitialProducts.length} unique products remain`);
  
  if (uniqueInitialProducts.length > 0) {
    await appendProductsToJson(outputFile, uniqueInitialProducts);
    totalProducts += uniqueInitialProducts.length;
    console.log(`✅ Initial products scraped and saved. Total: ${totalProducts} products`);
  }
  
  // Click "Más Resultados" button multiple times
  while (loadMoreCount < MAX_LOAD_MORE) {
    const hasMoreResults = await clickLoadMoreButton(page);
    
    if (!hasMoreResults) {
      console.log("No more 'Más Resultados' button found");
      break;
    }
    
    loadMoreCount++;
    console.log(`Clicked 'Más Resultados' button ${loadMoreCount} time(s)`);
    
    // Wait for new products to load
    await sleep(5000);
    
    // Extract new products
    const newProducts = await extractAllProducts(page, containerSelector, productsContainerSelector);
    console.log(`Found ${newProducts.length} products after clicking 'Más Resultados' ${loadMoreCount} time(s)`);
    
    if (newProducts.length > 0) {
      // Filter out products with duplicate IDs
      const uniqueNewProducts = filterUniqueProducts(newProducts, registeredProductIds);
      console.log(`After filtering, ${uniqueNewProducts.length} unique new products remain`);
      
      if (uniqueNewProducts.length > 0) {
        await appendProductsToJson(outputFile, uniqueNewProducts);
        totalProducts += uniqueNewProducts.length;
        console.log(`✅ New unique products scraped and saved. Running total: ${totalProducts} products`);
      } else {
        console.log("No new unique products found after 'Más Resultados' click");
      }
    }
  }
  
  console.log(`✅ Initial scraping completed. Total unique products: ${totalProducts}`);
}

async function performPriceMonitoring(page, containerSelector, productsContainerSelector, existingProducts, outputFile, priceHistoryFile, priceHistory, MAX_LOAD_MORE) {
  let loadMoreCount = 0;
  let priceChanges = [];
  const currentTimestamp = new Date().toISOString();
  
  console.log("Starting price monitoring...");
  
  // Extract current products from the page
  let currentProducts = await extractAllProducts(page, containerSelector, productsContainerSelector);
  
  // Load more products to get complete current data
  while (loadMoreCount < MAX_LOAD_MORE) {
    const hasMoreResults = await clickLoadMoreButton(page);
    
    if (!hasMoreResults) {
      console.log("No more 'Más Resultados' button found");
      break;
    }
    
    loadMoreCount++;
    console.log(`Loading more products for monitoring... (${loadMoreCount}/${MAX_LOAD_MORE})`);
    
    await sleep(5000);
    
    const newProducts = await extractAllProducts(page, containerSelector, productsContainerSelector);
    currentProducts = [...currentProducts, ...newProducts];
  }
  
  console.log(`Found ${currentProducts.length} current products for price comparison`);
  
  // Create a map of current products by ID for quick lookup
  const currentProductsMap = new Map();
  currentProducts.forEach(product => {
    if (product.productId && product.productId !== 'No product ID found') {
      currentProductsMap.set(product.productId, product);
    }
  });
  
  // Compare prices with existing products
  const updatedProducts = existingProducts.map(existingProduct => {
    const currentProduct = currentProductsMap.get(existingProduct.productId);
    
    if (currentProduct) {
      // Initialize price history for this product if it doesn't exist
      if (!priceHistory[existingProduct.productId]) {
        priceHistory[existingProduct.productId] = {
          title: existingProduct.title,
          prices: [
            {
              price: existingProduct.price,
              timestamp: existingProduct.lastUpdated || currentTimestamp,
              isInitial: true
            }
          ]
        };
      }
      
      // Check if price has changed
      if (currentProduct.price !== existingProduct.price) {
        console.log(`💰 PRICE CHANGE DETECTED: ${existingProduct.title}`);
        console.log(`   Old price: ${existingProduct.price} → New price: ${currentProduct.price}`);
        
        // Add new price to history
        priceHistory[existingProduct.productId].prices.push({
          price: currentProduct.price,
          timestamp: currentTimestamp,
          previousPrice: existingProduct.price
        });
        
        // Track this change
        priceChanges.push({
          productId: existingProduct.productId,
          title: existingProduct.title,
          oldPrice: existingProduct.price,
          newPrice: currentProduct.price,
          timestamp: currentTimestamp,
          trend: getPriceTrend(existingProduct.price, currentProduct.price)
        });
        
        // Update the product with new price and timestamp
        return {
          ...existingProduct,
          price: currentProduct.price,
          image: currentProduct.image, // Update image in case it changed
          lastUpdated: currentTimestamp,
          priceChanged: true
        };
      } else {
        // Price hasn't changed, just update timestamp
        return {
          ...existingProduct,
          lastUpdated: currentTimestamp,
          priceChanged: false
        };
      }
    } else {
      // Product not found in current scraping (might be out of stock)
      console.log(`⚠️  Product not found in current scraping: ${existingProduct.title}`);
      return {
        ...existingProduct,
        lastUpdated: currentTimestamp,
        status: 'not_found'
      };
    }
  });
  
  // Save updated products
  fs.writeFileSync(outputFile, JSON.stringify(updatedProducts, null, 2));
  
  // Save price history
  fs.writeFileSync(priceHistoryFile, JSON.stringify(priceHistory, null, 2));
  
  // Generate and display price change report
  generatePriceReport(priceChanges, priceHistory);
  
  console.log(`✅ Price monitoring completed. ${priceChanges.length} price changes detected.`);
}

function getPriceTrend(oldPrice, newPrice) {
  // Extract numeric values from price strings
  const oldNumeric = parseFloat(oldPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
  const newNumeric = parseFloat(newPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
  
  if (isNaN(oldNumeric) || isNaN(newNumeric)) {
    return 'unknown';
  }
  
  if (newNumeric > oldNumeric) {
    return 'increased';
  } else if (newNumeric < oldNumeric) {
    return 'decreased';
  } else {
    return 'unchanged';
  }
}

function generatePriceReport(priceChanges, priceHistory) {
  if (priceChanges.length === 0) {
    console.log("\n📈 PRICE REPORT: No price changes detected in this monitoring cycle.");
    return;
  }
  
  console.log("\n📈 PRICE CHANGE REPORT");
  console.log("=" .repeat(60));
  
  const increases = priceChanges.filter(change => change.trend === 'increased');
  const decreases = priceChanges.filter(change => change.trend === 'decreased');
  
  console.log(`Total price changes: ${priceChanges.length}`);
  console.log(`Price increases: ${increases.length}`);
  console.log(`Price decreases: ${decreases.length}`);
  console.log("-".repeat(60));
  
  // Show price increases
  if (increases.length > 0) {
    console.log("\n📈 PRICE INCREASES:");
    increases.forEach(change => {
      console.log(`• ${change.title}`);
      console.log(`  ${change.oldPrice} → ${change.newPrice}`);
    });
  }
  
  // Show price decreases
  if (decreases.length > 0) {
    console.log("\n📉 PRICE DECREASES:");
    decreases.forEach(change => {
      console.log(`• ${change.title}`);
      console.log(`  ${change.oldPrice} → ${change.newPrice}`);
    });
  }
  
  // Show products with most price changes
  console.log("\n🔄 PRODUCTS WITH MOST PRICE CHANGES:");
  const productsByChanges = Object.entries(priceHistory)
    .map(([productId, history]) => ({
      productId,
      title: history.title,
      totalChanges: history.prices.length - 1, // -1 because first entry is initial price
      latestPrice: history.prices[history.prices.length - 1].price
    }))
    .filter(product => product.totalChanges > 0)
    .sort((a, b) => b.totalChanges - a.totalChanges)
    .slice(0, 5);
  
  productsByChanges.forEach(product => {
    console.log(`• ${product.title} (${product.totalChanges} changes) - Current: ${product.latestPrice}`);
  });
  
  console.log("\n" + "=".repeat(60));
}

// Function to filter products and update the registeredProductIds set
function filterUniqueProducts(products, registeredProductIds) {
  return products.filter(product => {
    // If the product has no ID or the ID is already registered, filter it out
    if (!product.productId || product.productId === 'No product ID found' || registeredProductIds.has(product.productId)) {
      return false;
    }
    
    // If the product has a valid ID that hasn't been registered yet, add it to the set and keep it
    registeredProductIds.add(product.productId);
    return true;
  });
}

async function acceptCookies(page) {
  try {
    console.log("Attempting to accept cookies...");
    
    // Wait briefly for cookie banner to appear
    await sleep(2000);
    
    // Use the exact cookie button selector provided
    const exactCookieSelector = '#consent-tracking > div > div > div.modal-footer > div > button.affirm.btn.btn-primary';
    
    try {
      // Check if the exact selector exists
      const exactSelectorExists = await page.$(exactCookieSelector);
      
      if (exactSelectorExists) {
        await page.click(exactCookieSelector);
        console.log("Accepted cookies using the exact provided selector");
        await sleep(1000);
        return true;
      } else {
        console.log("Exact cookie selector not found, trying alternatives");
      }
    } catch (e) {
      console.log("Error with exact cookie selector:", e);
    }
    
    // Fallback cookie selectors
    const cookieSelectors = [
      'button.affirm.btn.btn-primary',
      'button.btn.btn-primary.affirm',
      '#consent-tracking button.btn-primary',
      '.modal-footer button.btn-primary',
      '#onetrust-accept-btn-handler',
      '.cookie-button-accept',
      'button[aria-label="Aceptar cookies"]',
      'button[aria-label="Aceptar"]'
    ];
    
    for (const selector of cookieSelectors) {
      try {
        const selectorExists = await page.$(selector);
        if (selectorExists) {
          await page.click(selector);
          console.log(`Accepted cookies using fallback selector: ${selector}`);
          await sleep(1000);
          return true;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    // If no selector worked, try to find buttons with text content related to accepting cookies
    const cookieButtonClicked = await page.evaluate(() => {
      const buttonTexts = ['Aceptar', 'Accept', 'Aceptar cookies', 'Aceptar todas', 'Entendido'];
      
      for (const text of buttonTexts) {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const button of buttons) {
          if (button.textContent.includes(text)) {
            button.click();
            return true;
          }
        }
      }
      
      return false;
    });
    
    if (cookieButtonClicked) {
      console.log("Accepted cookies using text content search");
      await sleep(1000);
      return true;
    }
    
    console.log("Could not find cookie acceptance button");
    return false;
  } catch (e) {
    console.log("Error accepting cookies:", e);
    return false;
  }
}

// Function to append products to the JSON file
async function appendProductsToJson(filePath, newProducts) {
  try {
    // Read the current content of the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let allProducts = [];
    
    if (fileContent.trim()) {
      // Parse the existing JSON content
      allProducts = JSON.parse(fileContent);
    }
    
    // Add timestamp to new products
    const timestamp = new Date().toISOString();
    const productsWithTimestamp = newProducts.map(product => ({
      ...product,
      lastUpdated: timestamp
    }));
    
    // Append the new products
    allProducts = [...allProducts, ...productsWithTimestamp];
    
    // Write the updated array back to the file
    fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2));
    
    return true;
  } catch (error) {
    console.error("Error appending to JSON file:", error);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractAllProducts(page, containerSelector, alternativeContainerSelector) {
  // Try the first container selector
  let products = await extractProductsFromPage(page, containerSelector);
  
  // If no products found, try the alternative selector
  if (products.length === 0 && alternativeContainerSelector) {
    console.log("First selector returned no products, trying alternative selector");
    products = await extractProductsFromPage(page, alternativeContainerSelector);
  }
  
  return products;
}

async function extractProductsFromPage(page, containerSelector) {
  // Extract product data using the provided selectors
  const products = await page.evaluate((containerSelector) => {
    // Get the container element
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log("Container not found with selector:", containerSelector);
      return [];
    }
    
    // Find all product tiles
    const productElements = container.querySelectorAll('.product-tile');
    
    console.log("Found", productElements.length, "product tiles");
    
    return Array.from(productElements).map((product, index) => {
      try {
        // We still need the product ID for uniqueness tracking
        const productId = product.getAttribute('data-pid') || 'No product ID found';
        
        // Title - Use the specific provided selector for the name
        const exactNameSelector = '.pdp-link > a'; 
        let title = 'No title found';
        
        const exactTitleElement = product.querySelector(exactNameSelector);
        if (exactTitleElement) {
          title = exactTitleElement.getAttribute('title') || exactTitleElement.textContent.trim();
        } else {
          // Fallback to other potential title selectors
          const titleElement = product.querySelector('.link, .name, .product-name, h3 a, h2 a, a[title]');
          if (titleElement) {
            title = titleElement.getAttribute('title') || titleElement.textContent.trim();
          }
        }
        
        // Price - Use the exact price selector provided
        const priceSelector = 'div.price > span > span > span';
        const priceElement = product.querySelector(priceSelector);
        
        let price = 'No price found';
        if (priceElement) {
          price = priceElement.textContent.trim();
        } else {
          // Fallback price selectors if the exact one doesn't work
          const fallbackPriceSelectors = [
            '.price-sales',
            '.sales .value',
            '.price .value',
            '.price span',
            '.price',
            'span[class*="price"]'
          ];
          
          for (const selector of fallbackPriceSelectors) {
            const fallbackElement = product.querySelector(selector);
            if (fallbackElement) {
              price = fallbackElement.textContent.trim();
              break;
            }
          }
        }
        
        // Image
        const imageElement = product.querySelector('img.tile-image');
        const image = imageElement ? 
                     (imageElement.getAttribute('src') || imageElement.getAttribute('data-src')) : 
                     'No image found';
        
        // Return only title, price, image, and productId (needed internally)
        return {
          productId, // Keep for uniqueness tracking
          title,
          price,
          image
        };
      } catch (err) {
        console.log(`Error extracting product data for index ${index + 1}:`, err);
        return {
          error: "Failed to extract product data",
          productIndex: index + 1,
          errorMessage: err.message
        };
      }
    });
  }, containerSelector);

  return products.filter(product => !product.error);
}

async function clickLoadMoreButton(page) {
  try {
    // Scroll to the bottom to ensure "Más Resultados" button is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await sleep(1000);
    
    // Use the exact button selector you provided
    const loadMoreButtonSelector = 'button.btn.btn-primary.col-8.col-sm-4.more';
    
    // Check if button exists
    const buttonExists = await page.$(loadMoreButtonSelector);
    
    if (buttonExists) {
      // Click the "Más Resultados" button
      await page.click(loadMoreButtonSelector);
      console.log("Clicked 'Más Resultados' button");
      return true;
    }
    
    // Try alternative selector that might be more specific to the actual button
    const specificButtonSelector = 'button.more[data-url*="Search-UpdateGrid"]';
    const specificButtonExists = await page.$(specificButtonSelector);
    
    if (specificButtonExists) {
      await page.click(specificButtonSelector);
      console.log("Clicked 'Más Resultados' button using specific selector");
      return true;
    }
    
    // Try finding the button by text content as a last resort
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const button of buttons) {
        if (button.textContent.trim() === 'Más Resultados') {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    if (buttonClicked) {
      console.log("Clicked 'Más Resultados' button using text content search");
      return true;
    }
    
    console.log("Could not find 'Más Resultados' button");
    return false;
  } catch (error) {
    console.error("Error clicking 'Más Resultados' button:", error);
    return false;
  }
}

// Execute
scrapeFarmaciasAhumadaMedicamentos()
  .then((totalProducts) =>
    console.log(`Process finished.`)
  )
  .catch((error) => console.error("Error in scraping process:", error));