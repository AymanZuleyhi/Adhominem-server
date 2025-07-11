const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(cors());

const buildHtml = (products) => `
<!-- Overlay HTML -->
<div class="SEARCH-BAR" style="display:none; flex-direction: column;">
  <div class="overlay"></div>
  <div class="logo-cover"></div>
  <div class="search-bar_container">
    <input placeholder="Search our collection..." />
    <p class="close-button" style="cursor:pointer;">X</p>
  </div>

  <div class="products-to-show" style="display:none;"></div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.querySelector('.SEARCH-BAR');
    const closeButton = document.querySelector('.close-button');
    const input = document.querySelector('.search-bar_container input');
    const productsToShow = document.querySelector('.products-to-show');

    const products = ${products};

    const searchIcon = '<svg class="search-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title" aria-describedby="desc" role="img" style="cursor:pointer;">' +
      '<title>Search</title>' +
      '<desc>Search This Website</desc>' +
      '<path data-name="layer2" fill="none" stroke="#202020" stroke-miterlimit="10" stroke-width="2" d="M39.049 39.049L56 56" stroke-linejoin="round" stroke-linecap="round"></path>' +
      '<circle data-name="layer1" cx="27" cy="27" r="17" fill="none" stroke="#202020" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></circle>' +
    '</svg>';

    const headerRightEls = document.querySelectorAll('.header-actions.header-actions--right');
    if (headerRightEls.length > 0) {
      headerRightEls.forEach(el => {
        el.insertAdjacentHTML('afterbegin', searchIcon);
      });
      console.log(\`Inserted Search Icon into \${headerRightEls.length} header-actions--right elements\`);
    } else {
      console.log('Could not find any .header-actions.header-actions--right elements');
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('.search-svg')) {
        searchBar.style.display = 'flex';
        input.focus();
      }
    });

    closeButton.addEventListener('click', () => {
      searchBar.style.display = 'none';
      input.value = '';
      productsToShow.innerHTML = '';
      productsToShow.style.display = 'none';
    });

    input.addEventListener('input', () => {
      const searchTerm = input.value.toLowerCase().trim();

      if (!searchTerm) {
        productsToShow.innerHTML = '';
        productsToShow.style.display = 'none';
        return;
      }

      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm)
      );

      productsToShow.innerHTML = '';

      if (filtered.length === 0) {
        productsToShow.innerHTML = '<p>No results found.</p>';
        productsToShow.style.display = 'block';
        return;
      }

      filtered.forEach(product => {
        const productEl = document.createElement('div');

        productEl.innerHTML = \`
          <a href="https://www.adhominem.co\${product.fullUrl}">
            <img src="\${product.assetUrl}" alt="\${product.title}">
            <span>\${product.title}</span>
          </a>
        \`;
        productsToShow.appendChild(productEl);
        productsToShow.style.display = 'grid';
      });
    });
  });
</script>
`;

app.get("/products", async (req, res) => {
  try {
    const response = await axios.get("https://www.adhominem.co/?format=json");

    const items = response.data.items;

    if (!Array.isArray(items)) {
      return res
        .status(500)
        .json({ success: false, message: "No 'items' array found." });
    }

    const products = items.map((item) => ({
      title: item.title,
      fullUrl: item.fullUrl,
      assetUrl: item.items?.[0]?.assetUrl || "",
    }));

    const fomattedProducts = JSON.stringify(products, null, 2);

    const html = buildHtml(fomattedProducts);

    res.json({ success: true, html });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
