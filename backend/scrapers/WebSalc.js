import puppeteer from "puppeteer";
import fs from "fs";

async function scrapeAllMedicamentos() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
  });

  const page = await browser.newPage();
  const allProducts = [];
  let hasMorePages = true;
  let currentPage = 1;

  const MAX_PAGES = 3;

  try {
    await page.goto("https://salcobrand.cl/t/medicamentos", { waitUntil: "networkidle2" });

    await setProductsPerPage(page, 96);

    while (hasMorePages && currentPage <= MAX_PAGES) {
      console.log(`Processing page ${currentPage}/${MAX_PAGES}...`);

      await page.waitForSelector(".product-catalog", { timeout: 10000 }).catch(e => {
        console.log("Timeout waiting for catalog. Reloading page...");
        return page.reload({ waitUntil: "networkidle2" });
      });

      await sleep(2000);

      const pageProducts = await extractProductsFromPage(page);
      console.log(`Found ${pageProducts.length} products on page ${currentPage}`);

      // Extraer SKUs de cada producto visitando su página individual
      const productsWithSku = await extractSkusFromProducts(page, pageProducts);
      allProducts.push(...productsWithSku);

      // Guardar progreso después de cada página (no solo cada 5)
      fs.writeFileSync(
        `medicamentos_progreso_pagina_${currentPage}.json`,
        JSON.stringify(allProducts, null, 2)
      );
      console.log(`Progress saved for page ${currentPage}. Total products so far: ${allProducts.length}`);

      // Si hemos completado las 3 páginas, terminar
      if (currentPage >= MAX_PAGES) {
        console.log(`Completed ${MAX_PAGES} pages. Finishing...`);
        hasMorePages = false;
        break;
      }

      // Intentar navegar a la siguiente página
      hasMorePages = await navigateToNextPage(page);

      if (hasMorePages) {
        await sleep(3000);
        await ensureProductsPerPageFilter(page, 96);
        currentPage++;

        // Screenshot de la nueva página para verificar
        await page.screenshot({ path: `pagina_${currentPage}.png` });
      } else {
        console.log("No more pages available or navigation failed.");
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    fs.writeFileSync('medicamentos_parcial_error.json', JSON.stringify(allProducts, null, 2));
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    console.log(`Scraping completed. Total products: ${allProducts.length}`);
    console.log(`Pages processed: ${Math.min(currentPage, MAX_PAGES)}`);
    
    // Guardar productos con información completa
    fs.writeFileSync("salcobrand_medicamentos_con_sku.json", JSON.stringify(allProducts, null, 2));
    
    // Generar lista de URLs de API
    const apiUrls = allProducts
      .filter(product => product.sku)
      .map(product => ({
        productName: product.title,
        apiUrl: `https://salcobrand.cl/api/v2/products/store_stock?state_id=375&sku=${product.sku}`,
        sku: product.sku,
        productUrl: product.url
      }));
    
    fs.writeFileSync("salcobrand_api_urls.json", JSON.stringify(apiUrls, null, 2));
    console.log(`Generated ${apiUrls.length} API URLs`);
    
    await browser.close();
  }

  return allProducts;
}

async function extractSkusFromProducts(page, products) {
  const productsWithSku = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`Extracting SKU for product ${i + 1}/${products.length}: ${product.title}`);
    
    try {
      // Si el producto tiene URL, visitarla para extraer el SKU
      if (product.url) {
        await page.goto(product.url, { waitUntil: "networkidle2", timeout: 15000 });
        await sleep(1000);
        
        const sku = await extractSkuFromProductPage(page);
        
        productsWithSku.push({
          ...product,
          sku: sku
        });
        
        console.log(`SKU found: ${sku || 'No SKU found'}`);
        
        // Pausa entre requests para no sobrecargar el servidor
        await sleep(1500);
      } else {
        productsWithSku.push({
          ...product,
          sku: null
        });
      }
    } catch (error) {
      console.error(`Error extracting SKU for ${product.title}:`, error.message);
      productsWithSku.push({
        ...product,
        sku: null
      });
    }
  }
  
  return productsWithSku;
}

async function extractSkuFromProductPage(page) {
  try {
    // Método 1: Buscar en el HTML el SKU directamente
    const sku = await page.evaluate(() => {
      // Buscar en scripts que contengan información del producto
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || script.innerText;
        
        // Buscar patrones comunes de SKU
        const skuMatch = content.match(/sku['":\s]*['"]?(\d+)['"]?/i) ||
                        content.match(/product[_-]?id['":\s]*['"]?(\d+)['"]?/i) ||
                        content.match(/item[_-]?id['":\s]*['"]?(\d+)['"]?/i);
        
        if (skuMatch) {
          return skuMatch[1];
        }
      }
      
      // Buscar en elementos data-* attributes
      const dataElements = document.querySelectorAll('[data-sku], [data-product-id], [data-item-id]');
      for (const el of dataElements) {
        const sku = el.getAttribute('data-sku') || 
                   el.getAttribute('data-product-id') || 
                   el.getAttribute('data-item-id');
        if (sku) return sku;
      }
      
      // Buscar en la URL actual
      const urlMatch = window.location.href.match(/\/(\d{6,})/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      return null;
    });
    
    // Método 2: Si no se encuentra, buscar en network requests
    if (!sku) {
      const skuFromNetwork = await page.evaluate(() => {
        // Intentar encontrar el SKU en requests realizados
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (entry.name.includes('api') && entry.name.includes('sku=')) {
                const match = entry.name.match(/sku=(\d+)/);
                if (match) {
                  resolve(match[1]);
                  return;
                }
              }
            }
          });
          observer.observe({ entryTypes: ['resource'] });
          
          // Timeout después de 2 segundos
          setTimeout(() => resolve(null), 2000);
        });
      });
      
      return skuFromNetwork;
    }
    
    return sku;
  } catch (error) {
    console.error("Error extracting SKU:", error);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function removeTildes(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function setProductsPerPage(page, count) {
  try {
    console.log(`Setting filter to show ${count} products per page...`);
    await page.waitForSelector('#search-result > div:nth-child(1) > div.top-filter-wrap > div > div.col-xs-6.col-sm-12.col-md-6.top-filter > div.modify-results-filter.pages > div > div > select', 
      { timeout: 5000 });

    const success = await page.evaluate((count) => {
      try {
        const selector = document.querySelector('#search-result > div:nth-child(1) > div.top-filter-wrap > div > div.col-xs-6.col-sm-12.col-md-6.top-filter > div.modify-results-filter.pages > div > div > select');
        if (selector) {
          selector.value = count.toString();
          const event = new Event('change', { bubbles: true });
          selector.dispatchEvent(event);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }, count);

    if (success) {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
        console.log("Timeout after changing filter.");
      });
      await sleep(2000);
      console.log("✓ Products per page filter correctly set.");
    } else {
      console.log("✗ Couldn't set products per page filter.");
    }
  } catch (error) {
    console.error("Error setting products per page filter:", error);
  }
}

async function ensureProductsPerPageFilter(page, count) {
  try {
    const currentCount = await page.evaluate(() => {
      const selector = document.querySelector('#search-result > div:nth-child(1) > div.top-filter-wrap > div > div.col-xs-6.col-sm-12.col-md-6.top-filter > div.modify-results-filter.pages > div > div > select');
      return selector ? selector.value : null;
    });

    if (currentCount !== count.toString()) {
      console.log(`Products per page filter is set to ${currentCount}, changing to ${count}...`);
      await setProductsPerPage(page, count);
    }
  } catch (error) {
    console.error("Error checking products per page filter:", error);
  }
}

async function extractProductsFromPage(page) {
  // Extraer información básica de productos incluyendo URLs
  const products = await page.evaluate(() => {
    const productElements = document.querySelectorAll("#content > div > div.ais-Hits > ul > li > div > div");
    const products = [];
    
    productElements.forEach((productEl) => {
      try {
        // Título
        const titleEl = productEl.querySelector("div > div.info > a > span.product-info.truncate");
        const title = titleEl ? titleEl.textContent.trim() : null;
        
        // Precio
        const priceEl = productEl.querySelector(".product-prices .sale-price");
        const price = priceEl ? priceEl.textContent.trim() : null;
        
        // Imagen
        const imageEl = productEl.querySelector(".product-image img");
        const image = imageEl ? imageEl.getAttribute("src") : null;
        
        // URL del producto
        const linkEl = productEl.querySelector("div > div.info > a") || 
                      productEl.querySelector("a");
        const url = linkEl ? linkEl.getAttribute("href") : null;
        const fullUrl = url ? (url.startsWith('http') ? url : `https://salcobrand.cl${url}`) : null;
        
        if (title) {
          products.push({
            title: title.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // Remove tildes
            price: price,
            image: image,
            url: fullUrl
          });
        }
      } catch (error) {
        console.error("Error extracting product info:", error);
      }
    });
    
    return products;
  });

  return products;
}

async function navigateToNextPage(page) {
  try {
    console.log("Attempting to navigate to next page...");
    
    const nextButtonClicked = await page.evaluate(() => {
      const findByText = () => {
        const allPaginationLinks = document.querySelectorAll('nav ul li a');
        for (const link of allPaginationLinks) {
          if (link.textContent.includes('Siguiente') || link.textContent.includes('>')) {
            const parentLi = link.closest('li');
            if (!parentLi || !parentLi.classList.contains('disabled')) {
              console.log("Found 'Siguiente' button, clicking...");
              link.click();
              return true;
            }
          }
        }
        return false;
      };

      const findByPosition = () => {
        const paginationList = document.querySelector('nav ul.pagination');
        if (paginationList) {
          const activeItems = paginationList.querySelectorAll('li:not(.disabled):not(.active)');
          if (activeItems.length > 0) {
            const lastActiveItem = activeItems[activeItems.length - 1];
            const link = lastActiveItem.querySelector('a');
            if (link) {
              console.log("Found pagination link by position, clicking...");
              link.click();
              return true;
            }
          }
        }
        return false;
      };

      const findBySpecificStructure = () => {
        // Intentar encontrar el botón de siguiente página por estructura específica
        for (let i = 5; i <= 8; i++) {
          const button = document.querySelector(`#content > nav > ul > li:nth-child(${i}) > a`);
          if (button) {
            const text = button.textContent.trim();
            if (text.includes('>') || text.includes('Siguiente') || (!isNaN(parseInt(text)) && parseInt(text) > 1)) {
              console.log(`Found next page button at position ${i}, clicking...`);
              button.click();
              return true;
            }
          }
        }
        return false;
      };

      return findByText() || findByPosition() || findBySpecificStructure();
    });

    if (nextButtonClicked) {
      // Esperar a que se cargue la nueva página
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
        console.log("Timeout waiting for navigation after clicking next page");
      });
      console.log("✓ Successfully navigated to next page");
    } else {
      console.log("✗ Could not find next page button");
    }

    return nextButtonClicked;
  } catch (error) {
    console.error("Error navigating to next page:", error);
    return false;
  }
}

// Función adicional para generar un reporte resumido
function generateReport(products) {
  const report = {
    totalProducts: products.length,
    productsWithSku: products.filter(p => p.sku).length,
    productsWithoutSku: products.filter(p => !p.sku).length,
    estimatedProductsPerPage: Math.round(products.length / 3),
    sampleApiUrls: products
      .filter(p => p.sku)
      .slice(0, 10)
      .map(p => ({
        product: p.title,
        apiUrl: `https://salcobrand.cl/api/v2/products/store_stock?state_id=375&sku=${p.sku}`
      }))
  };
  
  fs.writeFileSync("scraping_report.json", JSON.stringify(report, null, 2));
  console.log("\n=== SCRAPING REPORT ===");
  console.log(`Total products scraped: ${report.totalProducts}`);
  console.log(`Products with SKU: ${report.productsWithSku}`);
  console.log(`Products without SKU: ${report.productsWithoutSku}`);
  console.log(`Estimated products per page: ${report.estimatedProductsPerPage}`);
  console.log(`Success rate: ${((report.productsWithSku / report.totalProducts) * 100).toFixed(2)}%`);
  console.log("Report saved to scraping_report.json");
}

// Ejecutar
scrapeAllMedicamentos()
  .then((products) => {
    console.log(`Process finished with ${products.length} products saved.`);
    generateReport(products);
  })
  .catch((error) => console.error("Error in scraping process:", error));