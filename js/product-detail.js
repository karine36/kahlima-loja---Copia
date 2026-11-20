(function () {
  const { escapeHtml, formatPrice } = window.KahLimaUtils;

  function renderProductDetail(product, available, quantity, selectedVariants, variantStocks, reviewsMarkup, recommendations, selectedImageIndex = 0) {
    const images = (product.images || []).slice(0, 3);
    const heroImageIndex = images.findIndex(Boolean);
    const initialImageIndex = Math.max(0, Math.min(images.length - 1, Number(selectedImageIndex) || 0));
    const options = window.getKahLimaProductOptions(product);
    const variants = selectedVariants || {};
    const hasColorOptions = options.color.length > 0;
    const hasTypeOptions = options.type.length > 0;
    while (images.length < 3) images.push('');

    const renderVariantGroup = (kind, label, values) => {
      if (!values.length) return '';
      return `<fieldset class="product-variant-group" data-variant-group="${kind}">
        <legend>${label} <span>${variants[kind] ? `· ${escapeHtml(variants[kind])}` : '· Escolha uma opção'}</span></legend>
        <div class="product-variant-options">
          ${values.filter((value) => kind !== 'color' || variantStocks?.[value] !== 0).map((value) => {
            const stock = kind === 'color' ? variantStocks?.[value] : undefined;
            return `<button type="button" class="product-variant-option${variants[kind] === value ? ' is-selected' : ''}" data-variant-kind="${kind}" data-variant-value="${escapeHtml(value)}" aria-pressed="${variants[kind] === value}"${stock === 0 ? ' disabled' : ''}>${escapeHtml(value)}${stock === undefined ? '' : ` <small data-variant-stock>${stock} un.</small>`}</button>`;
          }).join('')}
        </div>
      </fieldset>`;
    };

    return `
      <section class="product-detail-page" aria-labelledby="product-detail-title">
        <div class="product-detail-page-heading">
          <button type="button" class="product-detail-back" data-close-product>← Voltar à loja</button>
        </div>
        <section class="product-detail-layout" data-product-detail-id="${escapeHtml(product.id)}">
          <div class="product-detail-gallery">
            <div class="product-gallery-track" data-gallery-track data-initial-gallery-index="${initialImageIndex}" role="region" aria-label="Galeria de ${escapeHtml(product.name)}">
              ${images.map((image, index) => `
                <div class="product-gallery-slide art-${escapeHtml(product.color)}${image ? '' : ' image-unavailable'}" data-gallery-slide>
                  <div class="product-gallery-fallback" aria-hidden="true"><span class="product-object object-${escapeHtml(product.shape)}"><span></span></span><small>${index + 1} / 3</small></div>
                  ${image ? `<button type="button" class="product-gallery-zoom" data-zoom-image="${escapeHtml(image)}" data-zoom-alt="${escapeHtml(product.name)} · imagem ${index + 1}" data-gallery-index="${index}" aria-label="Ampliar imagem ${index + 1} de ${escapeHtml(product.name)}"><img src="${escapeHtml(image)}" alt="" loading="${index === heroImageIndex ? 'eager' : 'lazy'}" ${index === heroImageIndex ? 'fetchpriority="high"' : ''} decoding="async" draggable="false"><span class="zoom-image-hint" aria-hidden="true">Ampliar imagem ⤢</span></button>` : ''}
                </div>
              `).join('')}
            </div>
            <button type="button" class="gallery-arrow gallery-prev" data-gallery-prev aria-label="Imagem anterior">‹</button>
            <button type="button" class="gallery-arrow gallery-next" data-gallery-next aria-label="Próxima imagem">›</button>
            <div class="product-gallery-thumbnails" role="group" aria-label="Selecionar imagem">
              ${images.map((image, index) => `<button type="button" class="product-gallery-thumbnail" data-gallery-index="${index}" aria-label="Mostrar imagem ${index + 1} de ${escapeHtml(product.name)}"${index === initialImageIndex ? ' aria-current="true"' : ''}>${image ? `<img src="${escapeHtml(image)}" alt="" loading="${index === initialImageIndex ? 'eager' : 'lazy'}" decoding="async" draggable="false">` : `<span aria-hidden="true">${index + 1}</span>`}</button>`).join('')}
            </div>
          </div>
          <div class="product-detail-copy">
            <p class="eyebrow eyebrow-muted">${escapeHtml(product.category)} · ${escapeHtml(product.id)}</p>
            <h1 id="product-detail-title">${escapeHtml(product.name)}</h1>
            <p class="product-detail-description">${escapeHtml(product.description)}</p>
            <div class="product-detail-price-card">
              <div><span class="product-price-label">Preço</span><p class="product-detail-price">${formatPrice(product.price)}</p><span class="product-price-payment">Pagamento via Pix</span></div>
              <span class="product-price-highlight">Seleção KahLima</span>
            </div>
            <p class="product-detail-stock${available ? '' : ' out-of-stock'}">${available ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}` : 'Sem estoque'}</p>
            <div class="product-fulfillment">
              <span aria-hidden="true">⌂</span>
              <p><strong>Como receber</strong><small>Entrega local em até 2 km ou retirada em estação da Linha 12–Safira.</small></p>
            </div>
            <div class="product-detail-actions">
              <div class="quantity-control" aria-label="Quantidade de ${escapeHtml(product.name)}">
                <button type="button" data-detail-quantity="-1" aria-label="Diminuir quantidade" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                <span>${quantity}</span>
                <button type="button" data-detail-quantity="1" aria-label="Aumentar quantidade" ${quantity >= available ? 'disabled' : ''}>+</button>
              </div>
              <div class="product-purchase-actions">
                <button type="button" class="button button-primary" data-detail-buy ${available === 0 ? 'disabled' : ''}>Comprar agora <span aria-hidden="true">→</span></button>
                <button type="button" class="button button-add product-detail-add" data-detail-add ${available === 0 ? 'disabled' : ''}>Adicionar à sacola</button>
              </div>
              <p class="product-buy-note">“Comprar agora” mantém os outros produtos que já estão na sua sacola.</p>
            </div>
          </div>
        </section>
        <details class="product-full-description">
          <summary>Ver descrição do produto</summary>
          <div class="product-full-description-content">
            <h2>Sobre este produto</h2>
            <p>${escapeHtml(product.details || product.description)}</p>
          </div>
        </details>
        ${reviewsMarkup || ''}
        ${renderRecommendations(recommendations || [])}
        <dialog class="product-image-lightbox" data-image-lightbox aria-labelledby="product-image-lightbox-title">
          <div class="product-image-lightbox-panel">
            <header class="product-image-lightbox-header">
              <div><span class="product-image-lightbox-eyebrow">GALERIA DO PRODUTO</span><h2 id="product-image-lightbox-title">${escapeHtml(product.name)}</h2></div>
              <button type="button" class="product-image-lightbox-dismiss" data-close-lightbox aria-label="Fechar imagem ampliada"><span aria-hidden="true">×</span></button>
            </header>
            <div class="product-image-lightbox-stage">
              <button type="button" class="product-image-lightbox-arrow" data-lightbox-prev aria-label="Imagem anterior"><span aria-hidden="true">‹</span></button>
              <img data-lightbox-image alt="">
              <button type="button" class="product-image-lightbox-arrow" data-lightbox-next aria-label="Próxima imagem"><span aria-hidden="true">›</span></button>
            </div>
            <footer class="product-image-lightbox-footer">
              <span class="product-image-lightbox-position" data-lightbox-position aria-live="polite"></span>
              <span class="product-image-lightbox-hint">Use as setas do teclado para navegar</span>
            </footer>
          </div>
        </dialog>
        ${(hasColorOptions || hasTypeOptions) ? `<dialog class="product-variant-picker" data-variant-picker aria-labelledby="variant-picker-title">
          <div class="product-variant-picker-heading">
            <div><p class="eyebrow eyebrow-muted">Personalize seu produto</p><h2 id="variant-picker-title">Escolha as opções</h2></div>
            <button type="button" class="product-image-lightbox-close variant-picker-close" data-close-variant-picker aria-label="Fechar escolha de opções">×</button>
          </div>
          <p class="product-variant-picker-product">${escapeHtml(product.name)}</p>
          ${renderVariantGroup('color', 'Cor', options.color)}
          ${renderVariantGroup('type', 'Tipo', options.type)}
          <p class="product-variant-picker-error" data-picker-error role="alert" hidden>Escolha todas as opções disponíveis para continuar.</p>
          <button type="button" class="button button-primary variant-picker-confirm" data-confirm-variant-action>Continuar</button>
        </dialog>` : ''}
      </section>
    `;
  }

  function renderRecommendations(products) {
    if (!products.length) return '';
    return `
      <section class="product-recommendations" aria-labelledby="product-recommendations-title">
        <div class="product-recommendations-heading">
          <div><p class="eyebrow eyebrow-muted">Mais para descobrir</p><h2 id="product-recommendations-title">Confira também</h2></div>
          <span>Selecionados para você</span>
        </div>
        <div class="product-recommendations-grid">
          ${products.map((item) => {
            const image = item.images?.[0];
            return `<a class="product-recommendation-card" href="#produto/${encodeURIComponent(item.id)}" data-open-product="${escapeHtml(item.id)}">
              <span class="product-recommendation-image art-${escapeHtml(item.color)}${image ? ' has-product-image' : ''}">
                ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : ''}
                <span class="product-object object-${escapeHtml(item.shape)}" aria-hidden="true"><span></span></span>
              </span>
              <span class="product-recommendation-copy"><small>${escapeHtml(item.category)}</small><strong>${escapeHtml(item.name)}</strong><span>${formatPrice(item.price)}</span></span>
              <span class="product-recommendation-arrow" aria-hidden="true">→</span>
            </a>`;
          }).join('')}
        </div>
      </section>
    `;
  }

  function bindProductDetail(root, onIndexChange = () => {}) {
    const track = root.querySelector('[data-gallery-track]');
    if (!track) return;

    let currentIndex = Number(track.dataset.initialGalleryIndex) || 0;
    let pointerStart = null;
    let scrollEndTimeout;
    const slides = [...track.querySelectorAll('[data-gallery-slide]')];
    const dots = [...root.querySelectorAll('[data-gallery-index]')];
    const previousButton = root.querySelector('[data-gallery-prev]');
    const nextButton = root.querySelector('[data-gallery-next]');

    const updateControls = () => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-current', slideIndex === currentIndex);
      });
      dots.forEach((dot, dotIndex) => {
        if (dotIndex === currentIndex) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (previousButton) previousButton.disabled = currentIndex === 0;
      if (nextButton) nextButton.disabled = currentIndex === slides.length - 1;
    };

    const updateCurrentIndex = () => {
      if (!track.isConnected || !track.clientWidth) return;
      currentIndex = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      updateControls();
      onIndexChange?.(currentIndex);
    };

    const goTo = (index) => {
      currentIndex = Math.max(0, Math.min(slides.length - 1, index));
      updateControls();
      onIndexChange?.(currentIndex);
      track.scrollLeft = currentIndex * track.clientWidth;
    };

    if (currentIndex > 0) track.scrollLeft = currentIndex * track.clientWidth;
    updateControls();
    previousButton?.addEventListener('click', () => goTo(currentIndex - 1));
    nextButton?.addEventListener('click', () => goTo(currentIndex + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.galleryIndex))));
    track.addEventListener('scroll', () => {
      window.clearTimeout(scrollEndTimeout);
      scrollEndTimeout = window.setTimeout(() => {
        updateCurrentIndex();
      }, 120);
    }, { passive: true });
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStart = {
        x: event.clientX,
        scrollLeft: track.scrollLeft,
        pointerId: event.pointerId,
        moved: false,
      };
    });
    track.addEventListener('pointermove', (event) => {
      if (!pointerStart || event.pointerId !== pointerStart.pointerId) return;
      const distance = event.clientX - pointerStart.x;
      if (Math.abs(distance) <= 5) return;
      pointerStart.moved = true;
      if (typeof track.setPointerCapture === 'function' && !track.hasPointerCapture(event.pointerId)) {
        track.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      track.scrollLeft = pointerStart.scrollLeft - distance;
    });
    const finishPointer = (event) => {
      if (pointerStart?.pointerId !== event.pointerId) return;
      const didMove = pointerStart.moved;
      pointerStart = null;
      if (didMove) {
        window.clearTimeout(scrollEndTimeout);
        updateCurrentIndex();
      }
    };
    track.addEventListener('pointerup', finishPointer);
    track.addEventListener('pointercancel', finishPointer);
    track.addEventListener('lostpointercapture', finishPointer);
    root.querySelectorAll('.product-gallery-slide img').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.product-gallery-slide').classList.add('image-unavailable');
      }, { once: true });
    });
    root.querySelectorAll('.product-recommendation-image img').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.product-recommendation-image').classList.remove('has-product-image');
        image.remove();
      }, { once: true });
    });

    const lightbox = root.querySelector('[data-image-lightbox]');
    const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
    const closeLightbox = () => lightbox.close();
    const lightboxPosition = lightbox.querySelector('[data-lightbox-position]');
    const lightboxPrevious = lightbox.querySelector('[data-lightbox-prev]');
    const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
    const zoomButtons = [...root.querySelectorAll('[data-zoom-image]')];
    let lightboxIndex = 0;
    const showLightboxImage = (index) => {
      if (!zoomButtons.length) return;
      lightboxIndex = (index + zoomButtons.length) % zoomButtons.length;
      const button = zoomButtons[lightboxIndex];
      lightboxImage.src = button.dataset.zoomImage;
      lightboxImage.alt = button.dataset.zoomAlt;
      lightboxPosition.textContent = `${lightboxIndex + 1} / ${zoomButtons.length}`;
      goTo(Number(button.dataset.galleryIndex));
    };

    lightboxPrevious.disabled = zoomButtons.length < 2;
    lightboxNext.disabled = zoomButtons.length < 2;
    zoomButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        showLightboxImage(index);
        lightbox.showModal();
      });
    });
    lightbox.querySelector('[data-close-lightbox]').addEventListener('click', closeLightbox);
    lightboxPrevious.addEventListener('click', () => showLightboxImage(lightboxIndex - 1));
    lightboxNext.addEventListener('click', () => showLightboxImage(lightboxIndex + 1));
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showLightboxImage(lightboxIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showLightboxImage(lightboxIndex + 1);
      }
    });
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  window.KahLimaProductDetail = { renderProductDetail, bindProductDetail };
})();
