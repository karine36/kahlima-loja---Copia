(function () {
  const { escapeHtml, formatPrice } = window.KahLimaUtils;

  function renderProductDetail(product, available, quantity, selectedVariants, variantStocks, reviewsMarkup, recommendations) {
    const images = (product.images || []).slice(0, 3);
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
          <p class="eyebrow eyebrow-muted">Produto · ${escapeHtml(product.id)}</p>
        </div>
        <section class="product-detail-layout" data-product-detail-id="${escapeHtml(product.id)}">
          <div class="product-detail-gallery">
            <div class="product-gallery-track" data-gallery-track aria-label="Galeria de ${escapeHtml(product.name)}">
              ${images.map((image, index) => `
                <div class="product-gallery-slide art-${escapeHtml(product.color)}${image ? '' : ' image-unavailable'}" data-gallery-slide>
                  <div class="product-gallery-fallback" aria-hidden="true"><span class="product-object object-${escapeHtml(product.shape)}"><span></span></span><small>${index + 1} / 3</small></div>
                  ${image ? `<button type="button" class="product-gallery-zoom" data-zoom-image="${escapeHtml(image)}" data-zoom-alt="${escapeHtml(product.name)} · imagem ${index + 1} de 3" aria-label="Ampliar imagem ${index + 1} de ${escapeHtml(product.name)}"><img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" draggable="false"><span class="zoom-image-hint" aria-hidden="true">Ampliar imagem ⤢</span></button>` : ''}
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
            <h1 id="product-detail-title">${escapeHtml(product.name)}</h1>
            <p class="product-detail-description">${escapeHtml(product.description)}</p>
            <div class="product-detail-price-card">
              <div><span class="product-price-label">Preço</span><p class="product-detail-price">${formatPrice(product.price)}</p><span class="product-price-payment">Pagamento via Pix</span></div>
              <span class="product-price-highlight">Seleção KahLima</span>
            </div>
            <p class="product-detail-stock${available ? '' : ' out-of-stock'}">${available ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}` : 'Sem estoque'}</p>
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
        <dialog class="product-image-lightbox" data-image-lightbox aria-label="Imagem ampliada do produto">
          <button type="button" class="product-image-lightbox-close" data-close-lightbox aria-label="Fechar imagem ampliada">×</button>
          <img data-lightbox-image alt="">
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
    root.querySelectorAll('.product-recommendation-image img').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.product-recommendation-image').classList.remove('has-product-image');
        image.remove();
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
