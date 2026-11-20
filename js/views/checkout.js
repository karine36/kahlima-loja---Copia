(() => {
  const { escapeHtml, formatPrice } = window.KahLimaUtils;

  function render({ state, products, pickupStations, getItemVariantLabel }) {
    const steps = ['Seus dados', 'Local', 'Pagamento', 'Pix', 'Confirmado'];
    const currentStep = state.checkoutStep;
    const stations = pickupStations;
    const cartItems = state.cart
      .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
      .filter((item) => item.product);
    const items = state.order?.items || cartItems;
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const total = state.order?.total ?? items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery = state.order?.delivery || state.checkoutDelivery;
    const selectedStation = stations.find((station) => station.value === delivery?.station)?.label;
    const deliveryAddress = [delivery?.street, delivery?.number && `nº ${delivery.number}`]
      .filter(Boolean)
      .join(', ');
    const locationDescription = delivery?.receiveMethod === 'station'
      ? `Linha 12–Safira · ${selectedStation || ''}`
      : `Entrega local · ${[
        deliveryAddress,
        delivery?.deliveryNote && `Observação: ${delivery.deliveryNote}`,
      ].filter(Boolean).join(' · ')}`;
    const deliverySummary = state.checkoutStep >= 2 && delivery
      ? `<p class="checkout-delivery-summary">${escapeHtml(locationDescription)}</p>`
      : '';
    const itemsMarkup = items.map(({ quantity, product, color, type }) => `
      <div class="checkout-summary-item">
        <span>${quantity} × ${escapeHtml(product.name)}      <small class="checkout-summary-variant">${escapeHtml(getItemVariantLabel(color, type))}</small></span>
        <strong>${formatPrice(product.price * quantity)}</strong>
      </div>
    `).join('');
    let content = '';

    if (state.checkoutStep === 0) {
      const customer = state.checkoutDelivery;
      const isNearby = customer.receiveMethod === 'nearby';
      const isStation = customer.receiveMethod === 'station';
      content = `
        <div class="checkout-section-heading"><p class="eyebrow eyebrow-muted">Etapa 1 de 5</p><h2>Seus dados e local</h2><p>Informe como prefere receber seu pedido.</p></div>
        <form id="customer-form" class="checkout-form">
          <label class="field"><span>Nome</span><input name="name" value="${escapeHtml(customer.name)}" autocomplete="name" required></label>
          <label class="field"><span>WhatsApp</span><input name="whatsapp" type="tel" value="${escapeHtml(customer.whatsapp)}" autocomplete="tel" required></label>
          <fieldset class="receive-options checkout-field-wide">
            <legend>Como deseja receber?</legend>
            <label class="receive-option"><input type="radio" name="receiveMethod" value="nearby" ${isNearby ? 'checked' : ''} required><span>Entrega local próxima</span></label>
            <label class="receive-option"><input type="radio" name="receiveMethod" value="station" ${isStation ? 'checked' : ''}><span>Retirada em estação</span></label>
          </fieldset>
          <section class="checkout-location-fields checkout-field-wide" id="nearby-fields" ${isNearby ? '' : 'hidden'} role="region" aria-live="polite" aria-label="Endereço para entrega local">
            <div class="checkout-local-alert" role="note"><span aria-hidden="true">i</span><p>Entregas disponíveis somente em locais próximos à loja, em um raio de até <strong>2 km</strong>.</p></div>
            <div class="checkout-address-fields">
              <label class="field"><span>Nome da rua</span><input name="street" value="${escapeHtml(customer.street || '')}" autocomplete="street-address" ${isNearby ? 'required' : 'disabled'}></label>
              <label class="field"><span>Número</span><input name="number" value="${escapeHtml(customer.number || '')}" autocomplete="off" ${isNearby ? 'required' : 'disabled'}></label>
              <label class="field checkout-field-wide"><span>Observação <small>(opcional)</small></span><textarea name="deliveryNote" rows="3" placeholder="Complemento, referência ou instruções para encontrar o local" ${isNearby ? '' : 'disabled'}>${escapeHtml(customer.deliveryNote || '')}</textarea></label>
            </div>
          </section>
          <section class="checkout-location-fields checkout-field-wide" id="station-fields" ${isStation ? '' : 'hidden'} role="region" aria-live="polite" aria-label="Estação para retirada">
            <fieldset class="station-options">
              <legend>Escolha uma estação da Linha 12–Safira</legend>
              <p class="station-route">Estações entre Itaim Paulista e Tatuapé</p>
              <div class="station-grid">
                ${stations.map((station) => `
                  <label class="station-option">
                    <input type="radio" name="station" value="${station.value}" ${customer.station === station.value ? 'checked' : ''} ${isStation ? 'required' : 'disabled'}>
                    <span>${station.label}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>
          </section>
          <div class="checkout-actions checkout-field-wide">
            <button type="button" class="button button-cancel" id="checkout-cancel">Voltar à sacola</button>
            <button type="submit" class="button button-primary">Continuar <span aria-hidden="true">→</span></button>
          </div>
        </form>
      `;
    } else if (state.checkoutStep === 1) {
      const isStation = state.checkoutDelivery.receiveMethod === 'station';
      const reviewTitle = isStation ? 'Retirada em estação' : 'Endereço para entrega';
      const reviewDescription = isStation
        ? `Linha 12–Safira · ${selectedStation || 'Selecione uma estação'}`
        : deliveryAddress;
      content = `
        <div class="checkout-section-heading"><p class="eyebrow eyebrow-muted">Etapa 2 de 5</p><h2>Revise o local</h2><p>Confira os dados escolhidos para receber seu pedido.</p></div>
        <form id="location-form">
          <section class="location-review-card">
            <span class="location-review-icon" aria-hidden="true">${isStation ? '🚉' : '⌂'}</span>
            <div><strong>${reviewTitle}</strong><p>${escapeHtml(reviewDescription)}</p>${!isStation && state.checkoutDelivery.deliveryNote ? `<small>Observação: ${escapeHtml(state.checkoutDelivery.deliveryNote)}</small>` : ''}</div>
          </section>
          <div class="checkout-actions">
            <button type="button" class="button button-cancel" id="checkout-back">Voltar aos dados</button>
            <button type="submit" class="button button-primary">Forma de pagamento <span aria-hidden="true">→</span></button>
          </div>
        </form>
      `;
    } else if (state.checkoutStep === 2) {
      content = `
        <div class="checkout-section-heading"><p class="eyebrow eyebrow-muted">Etapa 3 de 5</p><h2>Forma de pagamento</h2><p>Selecione como deseja pagar.</p></div>
        <form id="payment-form">
          <fieldset class="payment-options">
            <legend>Forma de pagamento</legend>
            <label class="payment-option">
              <input type="radio" name="payment" value="pix" ${state.paymentMethod === 'pix' ? 'checked' : ''} required>
              <span class="payment-option-icon" aria-hidden="true">Pix</span>
              <span><strong>Pix</strong><small>QR Code Pix para pagamento</small></span>
            </label>
          </fieldset>
          ${state.checkoutError ? `<p class="form-error" role="alert">${escapeHtml(state.checkoutError)}</p>` : ''}
          <div class="checkout-actions">
            <button type="button" class="button button-cancel" id="checkout-back">Voltar ao local</button>
            <button type="submit" class="button button-primary" ${state.paymentPending ? 'disabled' : ''}>${state.paymentPending ? 'Gerando Pix...' : 'Gerar Pix'} <span aria-hidden="true">→</span></button>
          </div>
        </form>
      `;
    } else if (state.checkoutStep === 3) {
      content = `
        <div class="checkout-section-heading"><p class="eyebrow eyebrow-muted">Etapa 4 de 5</p><h2>💰 Pix</h2><p>Pagamento do pedido ${escapeHtml(state.order.number)}.</p></div>
        <div class="pix-demo-panel">
          ${state.paymentPending ? `
            <span class="pix-demo-mark" aria-hidden="true">PIX</span>
            <p class="pix-demo-amount">${formatPrice(total)}</p>
            <p>Preparando seu QR Code Pix...</p>
          ` : `
            ${state.order.paymentProvider === 'manual_pix'
              ? `<div id="manual-pix-qr" class="pix-qr-code manual-pix-qr" role="img" aria-label="QR Code Pix do pedido ${escapeHtml(state.order.number)}"></div>`
              : state.order.qrCodeBase64
                ? `<img class="pix-qr-code" src="data:image/png;base64,${escapeHtml(state.order.qrCodeBase64)}" alt="QR Code Pix do pedido ${escapeHtml(state.order.number)}">`
                : '<span class="pix-demo-mark" aria-hidden="true">PIX</span>'}
            <p class="pix-demo-amount">${formatPrice(total)}</p>
            <p>${state.order.paymentProvider === 'manual_pix'
              ? 'Pague pela sua instituição financeira e use o código Pix copia e cola. A loja confirmará o recebimento manualmente; o status pode levar alguns instantes para atualizar.'
              : 'Escaneie o QR Code com o aplicativo do seu banco ou copie o código Pix abaixo. A confirmação pode levar alguns instantes.'}</p>
            <label class="pix-copy-field"><span>Código Pix copia e cola</span><textarea id="pix-copy-code" readonly rows="4">${escapeHtml(state.order.qrCode || '')}</textarea></label>
            <div class="checkout-actions pix-actions">
              <button type="button" class="button button-cancel" id="copy-pix-code">Copiar código Pix</button>
              ${state.order.paymentProvider === 'manual_pix'
                ? state.order.customerReportedPaidAt
                  ? '<span class="pix-payment-status">Aviso enviado à loja; aguardando conferência.</span>'
                  : '<button type="button" class="button button-cancel" id="report-manual-pix-paid">Já paguei</button>'
                : ''}
              ${state.order.ticketUrl ? `<a class="button button-primary" href="${escapeHtml(state.order.ticketUrl)}" target="_blank" rel="noopener noreferrer">Abrir no Mercado Pago</a>` : ''}
            </div>
            <p class="pix-payment-status" role="status">Status: ${state.order.status === 'paid' ? 'pagamento aprovado' : state.order.paymentProvider === 'manual_pix' ? 'aguardando conferência da loja' : 'aguardando pagamento'}. ${state.order.paymentProvider === 'manual_pix' ? 'Após confirmar o recebimento no banco, a loja atualizará o pedido.' : 'Esta tela será atualizada automaticamente.'}</p>
          `}
          ${state.checkoutError ? `<p class="form-error" role="alert">${escapeHtml(state.checkoutError)}</p>` : ''}
        </div>
      `;
    } else {
      content = `
        <section class="order-confirmed" aria-live="polite">
          <span class="confirmed-mark" aria-hidden="true">✓</span>
          <p class="eyebrow eyebrow-muted">Etapa 5 de 5</p>
          <h2>✅ Pagamento confirmado</h2>
          <p>Pedido ${escapeHtml(state.order.number)} pago. Os produtos comprados foram registrados na sua conta e já estão disponíveis na área de pedidos.</p>
          <button type="button" class="button button-primary" id="finish-checkout">Voltar à loja</button>
        </section>
      `;
    }

    return `
      <section class="checkout" data-checkout-step="${state.checkoutStep}" aria-labelledby="checkout-title">
        <div class="checkout-heading"><div><p class="eyebrow eyebrow-muted">KahLima Vendas</p><h1 id="checkout-title" tabindex="-1">Finalização da compra</h1></div><button type="button" class="text-button" id="checkout-cancel-top" ${state.paymentPending ? 'disabled' : ''}>Voltar à loja</button></div>
        <ol class="checkout-steps" aria-label="Etapas da compra">
          ${steps.map((label, index) => `<li class="checkout-step${index < currentStep ? ' is-complete' : ''}${index === currentStep ? ' is-current' : ''}"${index === currentStep ? ' aria-current="step"' : ''}><span>${index < currentStep ? '✓' : index + 1}</span><small>${label}</small></li>`).join('')}
        </ol>
        <div class="checkout-layout">
          <section class="checkout-main">${content}</section>
          <aside class="checkout-summary">
            <div class="checkout-summary-heading"><h2>Resumo do pedido</h2><span>${itemCount} ${itemCount === 1 ? 'item' : 'itens'}</span></div>
            <div class="checkout-summary-items">${itemsMarkup}</div>
            <div class="total-row"><span>Total</span><strong>${formatPrice(total)}</strong></div>
            ${deliverySummary}
            <p class="demo-cart-note">Pagamento via Pix.</p>
          </aside>
        </div>
      </section>
    `;
  }

  window.KahLimaCheckoutView = { render };
})();
