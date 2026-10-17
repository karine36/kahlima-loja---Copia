(function () {
  const { escapeHtml, formatPrice } = window.KahLimaUtils;

  function renderProductDetail(product, available, quantity, selectedVariants, variantStocks) {
    const images = (product.images || []).slice(0, 3);
    const options = window.getKahLimaProductOptions(product);
    const variants = selectedVariants || {};
    const hasColorOptions = options.color.length > 0;
    const hasTypeOptions = options.type.length > 0;
    while (images.length < 3) images.push('');

    return `
      <div class="product-detail-backdrop" id="product-detail-backdrop">
        <section class="product-detail-dialog" data-product-detail-id="${escapeHtml(product.id)}" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
          <button type="button" class="product-detail-close" data-close-product aria-label="Fechar detalhes">×</button>
          <div class="product-detail-gallery">
            <div class="product-gallery-track" data-gallery-track aria-label="Galeria de ${escapeHtml(product.name)}">
              ${images.map((image, index) => `
                <div class="product-gallery-slide art-${escapeHtml(product.color)}${image ? '' : ' image-unavailable'}" data-gallery-slide>
                  <div class="product-gallery-fallback" aria-hidden="true"><span class="product-object object-${escapeHtml(product.shape)}"><span></span></span><small>${index + 1} / 3</small></div>
                  ${image ? `<button type="button" class="product-gallery-zoom" data-zoom-image="${escapeHtml(image)}" data-zoom-alt="${escapeHtml(product.name)} · imagem ${index + 1} de 3" aria-label="Ampliar imagem ${index + 1} de ${escapeHtml(product.name)}"><img src="${escapeHtml(image)}" alt="" draggable="false"><span class="zoom-image-hint" aria-hidden="true">Ampliar imagem ⤢</span></button>` : ''}
                </div>
              `).join('')}
            </div>
            <button type="button" class="gallery-arrow gallery-prev" data-gallery-prev aria-label="Imagem anterior">‹</button>
            <button type="button" class="gallery-arrow gallery-next" data-gallery-next aria-label="Próxima imagem">›</button>
            <div class="product-gallery-dots" aria-label="Selecionar imagem">
              ${images.map((image, index) => `<button type="button" data-gallery-index="${index}" aria-label="Mostrar imagem ${index + 1}"${index === 0 ? ' aria-current="true"' : ''}></button>`).join('')}
            </div>
          </div>
          <div class="product-detail-copy">
            <p class="eyebrow eyebrow-muted">${escapeHtml(product.category)} · ${escapeHtml(product.id)}</p>
            <h2 id="product-detail-title">${escapeHtml(product.name)}</h2>
            <p class="product-detail-description">${escapeHtml(product.details || product.description)}</p>
            ${hasColorOptions ? `<fieldset class="product-variant-group">
              <legend>Cor <span>${variants.color ? `· ${escapeHtml(variants.color)}` : '· Escolha uma opção'}</span></legend>
              <div class="product-variant-options">
                ${options.color.map((color) => {
                  const stock = variantStocks?.[color];
                  return `<button type="button" class="product-variant-option${variants.color === color ? ' is-selected' : ''}" data-variant-kind="color" data-variant-value="${escapeHtml(color)}" aria-pressed="${variants.color === color}"${stock === 0 ? ' disabled' : ''}>${escapeHtml(color)}${stock === undefined ? '' : ` <small data-variant-stock>${stock} un.</small>`}</button>`;
                }).join('')}
              </div>
            </fieldset>` : ''}
            ${hasTypeOptions ? `<fieldset class="product-variant-group">
              <legend>Tipo <span>${variants.type ? `· ${escapeHtml(variants.type)}` : '· Escolha uma opção'}</span></legend>
              <div class="product-variant-options">
                ${options.type.map((type) => `<button type="button" class="product-variant-option${variants.type === type ? ' is-selected' : ''}" data-variant-kind="type" data-variant-value="${escapeHtml(type)}" aria-pressed="${variants.type === type}">${escapeHtml(type)}</button>`).join('')}
              </div>
            </fieldset>` : ''}
            <p class="product-variant-error" data-variant-error role="alert" hidden>Escolha ${hasColorOptions && hasTypeOptions ? 'uma cor e um tipo' : hasColorOptions ? 'uma cor' : 'um tipo'} antes de adicionar à sacola.</p>
            <p class="product-detail-price">${formatPrice(product.price)}</p>
            <p class="product-detail-stock${available ? '' : ' out-of-stock'}">${available ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}` : 'Sem estoque'}</p>
            <div class="product-detail-actions">
              <div class="quantity-control" aria-label="Quantidade de ${escapeHtml(product.name)}">
                <button type="button" data-detail-quantity="-1" aria-label="Diminuir quantidade" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                <span>${quantity}</span>
                <button type="button" data-detail-quantity="1" aria-label="Aumentar quantidade" ${quantity >= available ? 'disabled' : ''}>+</button>
              </div>
              <button type="button" class="button button-primary" data-detail-add ${available === 0 ? 'disabled' : ''}>Adicionar à sacola</button>
            </div>
          </div>
        </section>
        <dialog class="product-image-lightbox" data-image-lightbox aria-label="Imagem ampliada do produto">
          <button type="button" class="product-image-lightbox-close" data-close-lightbox aria-label="Fechar imagem ampliada">×</button>
          <img data-lightbox-image alt="">
        </dialog>
      </div>
    `;
  }

  function bindProductDetail(root) {
    const track = root.querySelector('[data-gallery-track]');
    if (!track) return;

    let currentIndex = 0;
  let pointerStart = null;
    const slides = [...track.querySelectorAll('[data-gallery-slide]')];
    const dots = [...root.querySelectorAll('[data-gallery-index]')];

    const goTo = (index) => {
      currentIndex = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({ left: currentIndex * track.clientWidth, behavior: 'smooth' });
      dots.forEach((dot, dotIndex) => {
        if (dotIndex === currentIndex) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(currentIndex - 1));
    root.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(currentIndex + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.galleryIndex))));
    track.addEventListener('scroll', () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      if (index !== currentIndex) {
        currentIndex = index;
        dots.forEach((dot, dotIndex) => {
          if (dotIndex === currentIndex) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });
      }
    }, { passive: true });
    track.addEventListener('pointerdown', (event) => {
      pointerStart = { x: event.clientX, scrollLeft: track.scrollLeft };
    });
    track.addEventListener('pointermove', (event) => {
      if (!pointerStart) return;
      const distance = event.clientX - pointerStart.x;
      if (Math.abs(distance) > 5) event.preventDefault();
      track.scrollLeft = pointerStart.scrollLeft - distance;
    });
    track.addEventListener('pointerup', () => { pointerStart = null; });
    track.addEventListener('pointercancel', () => { pointerStart = null; });
    root.querySelectorAll('.product-gallery-slide img').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.product-gallery-slide').classList.add('image-unavailable');
      }, { once: true });
    });

    const lightbox = root.querySelector('[data-image-lightbox]');
    const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
    const closeLightbox = () => lightbox.close();
    root.querySelectorAll('[data-zoom-image]').forEach((button) => {
      button.addEventListener('click', () => {
        lightboxImage.src = button.dataset.zoomImage;
        lightboxImage.alt = button.dataset.zoomAlt;
        lightbox.showModal();
      });
    });
    lightbox.querySelector('[data-close-lightbox]').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  window.KahLimaProductDetail = { renderProductDetail, bindProductDetail };
})();
