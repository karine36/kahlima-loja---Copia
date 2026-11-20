(function () {
  function normalizeProductId(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function normalizeProductName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }

  function findProducts(products, query) {
    if (!String(query || '').trim()) return products;
    const normalizedIdQuery = normalizeProductId(query);
    const normalizedNameQuery = normalizeProductName(query);
    return products.filter((product) =>
      (normalizedIdQuery && normalizeProductId(product.id).includes(normalizedIdQuery))
      || normalizeProductName(product.name).includes(normalizedNameQuery)
    );
  }

  window.KahLimaProductSearch = { findProducts };
})();