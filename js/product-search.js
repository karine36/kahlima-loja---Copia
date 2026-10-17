(function () {
  function normalizeProductId(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function findProductsById(products, query) {
    if (!String(query || '').trim()) return products;
    const normalizedQuery = normalizeProductId(query);
    if (!normalizedQuery) return [];
    return products.filter((product) => normalizeProductId(product.id) === normalizedQuery);
  }

  window.KahLimaProductSearch = { findProductsById };
})();