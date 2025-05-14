import puppeteer from "puppeteer";
import fs from "fs";

async function scrapeCruzVerdeMedicamentos() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1024,768'] 
  });

  const page = await browser.newPage();
  const outputFile = "cruzverde_medicamentos_respiratorios.json";
  let totalProducts = 0;
  let hasMorePages = true;
  let currentPage = 1;


  const MAX_PAGES = 3;

  // Initialize the JSON file with an empty array
  fs.writeFileSync(outputFile, JSON.stringify([], null, 2));

  try {
    // Navigate to the specific respiratory and allergy medications section
    await page.goto("https://www.cruzverde.cl/medicamentos/sistema-respiratorio-y-alergias/", { 
      waitUntil: "networkidle2",
      timeout: 30000 
    });
    
    console.log("Page loaded successfully");
    
    // Accept cookies with the specific selector proporcionado
    try {
      const cookieButtonSelector = '#modal > section > div > div.flex.flex-wrap.justify-center.pb-30.pt-15.px-15.md\\:px-25.md\\:mx-auto.md\\:w-3\\/4.md\\:px-0\\! > div > at-button > button';
      await page.waitForSelector(cookieButtonSelector, { timeout: 5000 });
      await page.click(cookieButtonSelector);
      console.log("Accepted cookies with specific selector");
      await sleep(1000);
    } catch (e) {
      console.log("No cookie dialog found or error clicking it:", e);
      // Fallback to the original method
      try {
        const cookieButton = await page.$('button[aria-label="Aceptar"]');
        if (cookieButton) {
          await cookieButton.click();
          console.log("Accepted cookies with fallback selector");
          await sleep(1000);
        }
      } catch (e) {
        console.log("Fallback cookie button not found either:", e);
      }
    }

    // Select 48 products per page
    try {
      console.log("Attempting to select 48 products per page...");
      
      // First click on the dropdown to open it
      const dropdownSelector = "body > app-root > app-page > div.flex.flex-col.h-full > div > main > tpl-category-catalog > div.bg-gray-lightest.pt-30.ng-star-inserted > tpl-catalog > div > div.atomic-container > div.hidden.lg\\:flex.mb-2.justify-end > div > ml-form-field:nth-child(4) > div > at-select > div > div.ng-star-inserted.select-options-input.pl-15.text-gray-darkest.pr-30.border.rounded-sm.pt-5.pb-7.font-open.text-16.bg-white.appearance-none.focus\\:outline-none.border-gray.lg\\:mb-16 > div > p";
      
      await page.waitForSelector(dropdownSelector, { timeout: 10000 });
      await page.click(dropdownSelector);
      
      // Wait for dropdown to open
      await sleep(2000);
      
      // Debug screenshot
      await page.screenshot({ path: 'after-dropdown-click.png' });
      
      // Now click on the option for 48 products using your exact selector
      const option48Selector = "body > app-root > app-page > div.flex.flex-col.h-full > div > main > tpl-category-catalog > div.bg-gray-lightest.pt-30.ng-star-inserted > tpl-catalog > div > div.atomic-container > div.hidden.lg\\:flex.mb-2.justify-end > div > ml-form-field:nth-child(4) > div > at-select > div > div.absolute.z-40.w-full.border.rounded-sm.border-gray.font-open.text-16.appearance-none.cursor-default.select-none.select-option-container.block > div:nth-child(3)";
      
      await page.waitForSelector(option48Selector, { timeout: 5000 });
      await page.click(option48Selector);
      
      console.log("Successfully clicked on 48 products per page option");
      
      // Debug screenshot
      await page.screenshot({ path: 'after-selection.png' });
      
      await sleep(5000); // Wait for page to reload with 48 products
    } catch (error) {
      console.error("Error selecting 48 products per page:", error);
      
      // Fallback method - try using evaluate
      try {
        console.log("Trying fallback method to select 48 products per page...");
        
        const successful = await page.evaluate(() => {
          // Open dropdown if not already open
          const dropdown = document.querySelector('div.select-options-input');
          if (dropdown) dropdown.click();
          
          // Wait a bit using setTimeout inside evaluate
          return new Promise(resolve => {
            setTimeout(() => {
              // Try to find the option with text "48"
              const options = Array.from(document.querySelectorAll('.select-option, .dropdown-item, div[class*="select-option-container"] > div'));
              console.log("Found", options.length, "potential options");
              
              // Debug - log all options
              options.forEach((opt, i) => console.log(`Option ${i}: ${opt.textContent.trim()}`));
              
              const option48 = options.find(opt => opt.textContent.trim() === '48' || opt.textContent.includes('48'));
              
              if (option48) {
                option48.click();
                resolve(true);
              } else {
                console.log("Could not find option 48");
                resolve(false);
              }
            }, 1000);
          });
        });
        
        if (successful) {
          console.log("Successfully selected 48 products using fallback method");
          await sleep(5000);
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
      }
    }

    while (hasMorePages && currentPage <= MAX_PAGES) {
      console.log(`Processing page ${currentPage}...`);

      // Wait for the parent container to load
      const containerSelector = "body > app-root > app-page > div.flex.flex-col.h-full > div > main > tpl-category-catalog > div.bg-gray-lightest.pt-30.ng-star-inserted > tpl-catalog > div > div.atomic-container > div.grid.grid-cols-4.gap-50.ng-star-inserted > div.col-span-4.lg\\:col-span-3 > div";
      
      // Wait for at least one product card to appear
      const productCardSelector = `${containerSelector} > ml-card-product:nth-child(1) > div`;
      
      await page.waitForSelector(productCardSelector, { timeout: 15000 }).catch(e => {
        console.log("Timeout waiting for product card. Reloading page...");
        return page.reload({ waitUntil: "networkidle2" });
      });

      // Give time for all content to load
      await sleep(3000);

      // Extract products from the current page
      const pageProducts = await extractProductsFromPage(page, containerSelector);
      console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
      
      // Append the current page products to the JSON file
      await appendProductsToJson(outputFile, pageProducts);
      totalProducts += pageProducts.length;
      
      console.log(`✅ Page ${currentPage} scraped and saved. Running total: ${totalProducts} products`);

      // Use the exact next button selector provided
      const nextButtonSelector = "body > app-root > app-page > div.flex.flex-col.h-full > div > main > tpl-category-catalog > div.bg-gray-lightest.pt-30.ng-star-inserted > tpl-catalog > div > div.atomic-container > div.grid.grid-cols-4.gap-50.ng-star-inserted > div.col-span-4.lg\\:col-span-3 > ml-pagination > div > div:nth-child(5)";
      
      // Navigate to next page if available
      hasMorePages = await clickNextPage(page, nextButtonSelector);

      if (hasMorePages) {
        await sleep(5000); // Wait longer for page transition
        currentPage++;
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    console.log(`✅ Scraping completed. Total products: ${totalProducts}`);
    await browser.close();
  }

  return totalProducts;
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
    
    // Append the new products
    allProducts = [...allProducts, ...newProducts];
    
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

async function extractProductsFromPage(page, containerSelector) {
  // Use the exact selectors provided
  const products = await page.evaluate((containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log("Container not found");
      return [];
    }
    
    // Find all product cards
    const productElements = container.querySelectorAll('ml-card-product > div');
    
    return Array.from(productElements).map((product, index) => {
      try {
        // Title - Look for the product name
        const titleElement = product.querySelector('.title, h3, h2');
        const title = titleElement ? titleElement.textContent.trim() : 'No title found';
        
        // Price - Use the exact price selector provided
        const exactPriceSelector = 'div > div > div.text-gray-dark.ng-star-inserted > div > ml-price-tag > div.flex.flex-col.text-18.sm\\:text-22 > div.flex.items-center.order-4.ng-star-inserted > span.font-bold.text-prices.text-16';
        const priceElement = product.querySelector(exactPriceSelector);
        
        // If exact selector doesn't work, try fallback selectors
        const price = priceElement ? 
                      priceElement.textContent.trim() : 
                      (product.querySelector('.price, .font-bold.text-prices, ml-price-tag span.font-bold')?.textContent.trim() || 'No price found');
        
        // Member price (if available)
        const memberPriceElement = product.querySelector('.club-price, .cv-price, span.club-price');
        const memberPrice = memberPriceElement ? memberPriceElement.textContent.trim() : 'No member price found';
        
        // Image
        const imageElement = product.querySelector('img');
        const image = imageElement ? imageElement.getAttribute('src') : 'No image found';
        
        // Product URL
        const urlElement = product.querySelector('a');
        const url = urlElement ? urlElement.getAttribute('href') : 'No URL found';
        
        // Brand
        const brandElement = product.querySelector('.brand');
        const brand = brandElement ? brandElement.textContent.trim() : 'No brand found';
        
        // Description
        const descElement = product.querySelector('.description');
        const description = descElement ? descElement.textContent.trim() : 'No description found';
        
        // Product index for debugging
        const productIndex = index + 1;
        
        return {
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

  return products;
}

async function clickNextPage(page, nextButtonSelector) {
  try {
    // Check if the next button exists
    const nextButton = await page.$(nextButtonSelector);
    
    if (nextButton) {
      console.log("Found next button with provided selector");
      
      // Check if button is disabled
      const isDisabled = await page.evaluate(selector => {
        const button = document.querySelector(selector);
        return button.disabled || 
               button.classList.contains('disabled') || 
               button.closest('.disabled') !== null;
      }, nextButtonSelector);
      
      if (!isDisabled) {
        // Click the next button
        await nextButton.click();
        console.log("Clicked next page button");
        return true;
      } else {
        console.log("Next button is disabled, no more pages");
        return false;
      }
    } else {
      console.log("Could not find the next button with provided selector");
      
      // Try alternative pagination method
      return await alternativePagination(page);
    }
  } catch (error) {
    console.error("Error clicking next page:", error);
    // Try alternative pagination method as fallback
    return await alternativePagination(page);
  }
}

async function alternativePagination(page) {
  try {
    // Scroll to the bottom to ensure pagination is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await sleep(1000);
    
    // Try to find and click any next page button
    const nextButtonClicked = await page.evaluate(() => {
      try {
        // Look for various possible next page button patterns
        const paginationSelectors = [
          'button.next',
          'a.next',
          'a[aria-label="Next"]',
          'button[aria-label="Next"]',
          'a[aria-label="Siguiente"]',
          'button[aria-label="Siguiente"]',
          '.pagination-wrapper button:last-child',
          '.pagination-wrapper a:last-child',
          'li.next a',
          'li.next button',
          'a.page-next',
          'button.page-next',
          'ml-pagination div > div:nth-child(5)' // Your specific pagination element
        ];
        
        for (const selector of paginationSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const nextButton of elements) {
            if (nextButton && 
                !nextButton.disabled && 
                !nextButton.classList.contains('disabled')) {
              console.log("Found next button with selector:", selector);
              nextButton.click();
              return true;
            }
          }
        }
        
        return false;
      } catch (err) {
        console.log("Error in alternative pagination:", err);
        return false;
      }
    });

    return nextButtonClicked;
  } catch (error) {
    console.error("Error in alternative pagination:", error);
    return false;
  }
}

// Execute
scrapeCruzVerdeMedicamentos()
  .then((totalProducts) =>
    console.log(`Process finished with ${totalProducts} products saved to JSON.`)
  )
  .catch((error) => console.error("Error in scraping process:", error));