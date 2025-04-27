//Para compilar el codigo escribir en la terminal node Webscraping.js
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

    // Cambiar a 96 productos por página
    await setProductsPerPage(page, 96);

    while (hasMorePages && currentPage <= MAX_PAGES) {
      console.log(`Processing page ${currentPage}...`);

      await page.waitForSelector(".product-catalog", { timeout: 10000 }).catch(e => {
        console.log("Timeout waiting for catalog. Reloading page...");
        return page.reload({ waitUntil: "networkidle2" });
      });

      await sleep(2000);

      const pageProducts = await extractProductsFromPage(page);
      console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
      allProducts.push(...pageProducts);

      if (currentPage % 5 === 0) {
        fs.writeFileSync(
          `medicamentos_progreso_pagina_${currentPage}.json`,
          JSON.stringify(allProducts, null, 2)
        );
        console.log(`Progress saved up to page ${currentPage}`);
      }

      hasMorePages = await navigateToNextPage(page);

      if (hasMorePages) {
        await sleep(3000);
        await ensureProductsPerPageFilter(page, 96);
        currentPage++;

        if (currentPage % 5 === 0) {
          await page.screenshot({ path: `pagina_${currentPage}.png` });
        }
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    fs.writeFileSync('medicamentos_parcial_error.json', JSON.stringify(allProducts, null, 2));
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    console.log(`Scraping completed. Total products: ${allProducts.length}`);
    fs.writeFileSync("salcobrand_medicamentos.json", JSON.stringify(allProducts, null, 2));
    await browser.close();
  }

  return allProducts;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to remove tildes (accent marks) from text
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
      console.log(" Products per page filter correctly set.");
    } else {
      console.log(" Couldn't set products per page filter.");
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
  // Get product descriptions but store them as title in the JSON
  const titles = await page.$$eval("#content > div > div.ais-Hits > ul > li > div > div > div > div.info > a > span.product-info.truncate", (elements) =>
    elements.map((el) => el.textContent.trim())
  ).catch(err => {
    console.log("Error fetching titles, trying alternative selector");
    return page.$$eval("span.product-info.truncate", (elements) =>
      elements.map((el) => el.textContent.trim())
    );
  });

  const prices = await page.$$eval(".product-catalog .product-prices .sale-price", (elements) =>
    elements.map((el) => el.textContent.trim())
  );

  const images = await page.$$eval(".product-catalog .product-image img", (elements) =>
    elements.map((el) => el.getAttribute("src")?.trim())
  );

  const products = [];
  const minLength = Math.min(titles.length, prices.length, images.length);

  for (let i = 0; i < minLength; i++) {
    products.push({
      title: removeTildes(titles[i]), // Remove tildes from the title
      price: prices[i],
      image: images[i],
    });
  }

  return products;
}

async function navigateToNextPage(page) {
  try {
    const nextButtonClicked = await page.evaluate(() => {
      const findByText = () => {
        const allPaginationLinks = document.querySelectorAll('nav ul li a');
        for (const link of allPaginationLinks) {
          if (link.textContent.includes('Siguiente') || link.textContent.includes('>')) {
            const parentLi = link.closest('li');
            if (!parentLi || !parentLi.classList.contains('disabled')) {
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
              link.click();
              return true;
            }
          }
        }
        return false;
      };

      const findBySpecificStructure = () => {
        const specificButton = document.querySelector('#content > nav > ul > li:nth-child(6) > a');
        if (specificButton) {
          specificButton.click();
          return true;
        }

        for (let i = 5; i <= 7; i++) {
          const button = document.querySelector(`#content > nav > ul > li:nth-child(${i}) > a`);
          if (button && (button.textContent.includes('>') || button.textContent.includes('Siguiente'))) {
            button.click();
            return true;
          }
        }

        return false;
      };

      return findByText() || findByPosition() || findBySpecificStructure();
    });

    return nextButtonClicked;
  } catch (error) {
    console.error("Error navigating to next page:", error);
    return false;
  }
}

// Ejecutar
scrapeAllMedicamentos()
  .then((products) =>
    console.log(`Process finished with ${products.length} products saved to salcobrand_medicamentos.json.`)
  )
  .catch((error) => console.error("Error in scraping process:", error));

// se puso un limite de 3 paginas se genera un error luego de la cuarta (por revisar)