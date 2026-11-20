(() => {
  const { escapeHtml } = window.KahLimaUtils;

  function renderProductReviews({ reviews, eligibleOrders, isLoggedIn, loading, error, notice }) {
    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
      : 0;
    const availableOrders = eligibleOrders.filter((order) => !order.reviewStatus);
    const orderOptions = availableOrders.map((order) =>
      `<option value="${escapeHtml(order.id)}">Pedido ${escapeHtml(order.number)}</option>`).join('');
    const pendingCount = eligibleOrders.filter((order) => order.reviewStatus === 'pending').length;
    const rejectedCount = eligibleOrders.filter((order) => order.reviewStatus === 'rejected').length;
    const submittedCount = eligibleOrders.filter((order) => order.reviewStatus === 'approved').length;

    return `
      <section class="product-reviews" aria-labelledby="product-reviews-title">
        <div class="product-reviews-heading">
          <div><p class="eyebrow eyebrow-muted">Experiências de clientes</p><h3 id="product-reviews-title">Avaliações</h3></div>
          <div class="review-average" aria-label="${reviews.length ? `Nota média ${average.toFixed(1)} de 5, ${reviews.length} avaliações` : 'Ainda sem avaliações'}">
            <strong>${reviews.length ? average.toFixed(1) : '—'}</strong>
            <span>${reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'avaliação' : 'avaliações'}` : 'Sem avaliações'}</span>
          </div>
        </div>
        ${loading ? '<p class="review-status" role="status">Carregando avaliações...</p>' : ''}
        ${error ? `<p class="form-error" role="alert">${escapeHtml(error)}</p>` : ''}
        ${notice ? `<p class="form-success" role="status">${escapeHtml(notice)}</p>` : ''}
        ${!isLoggedIn
          ? '<p class="review-status">Entre na sua conta para avaliar um produto comprado.</p><button type="button" class="text-button" data-review-signin>Entrar para avaliar →</button>'
          : availableOrders.length
            ? `<form class="product-review-form" id="product-review-form">
                ${availableOrders.length > 1 ? `<label class="field"><span>Pedido confirmado</span><select name="orderId" required>${orderOptions}</select></label>` : `<input type="hidden" name="orderId" value="${escapeHtml(availableOrders[0].id)}">`}
                <fieldset class="review-rating">
                  <legend>Sua nota</legend>
                  <div class="review-stars">
                    ${[5, 4, 3, 2, 1].map((rating) => `<label><input type="radio" name="rating" value="${rating}" required><span aria-label="${rating} ${rating === 1 ? 'estrela' : 'estrelas'}">★</span></label>`).join('')}
                  </div>
                </fieldset>
                <label class="field"><span>Seu comentário</span><textarea name="comment" rows="4" maxlength="1000" placeholder="Conte como foi sua experiência com este produto" required></textarea></label>
                <p class="review-guidance">A avaliação será exibida depois de aprovada pela loja.</p>
                <button class="button button-primary" type="submit">Enviar avaliação</button>
              </form>`
            : pendingCount || rejectedCount
              ? `<p class="review-status">${pendingCount ? 'Sua avaliação está aguardando aprovação.' : 'Você já enviou uma avaliação para este pedido.'}</p>`
              : submittedCount
                ? '<p class="review-status">Você já avaliou este produto em uma compra confirmada.</p>'
                : '<p class="review-status">A opção de avaliar fica disponível após a confirmação do pagamento de um pedido deste produto.</p>'}
        ${reviews.length ? `<div class="product-review-list">${reviews.map((review) => `
          <article class="product-review">
            <div class="product-review-stars" aria-label="Nota ${Number(review.rating)} de 5">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</div>
            <p>${escapeHtml(review.comment)}</p>
            <small>Compra verificada · ${new Date(review.created_at).toLocaleDateString('pt-BR')}</small>
          </article>
        `).join('')}</div>` : '<p class="review-status">Seja a primeira pessoa a avaliar este produto após a compra.</p>'}
      </section>
    `;
  }

  window.KahLimaProductReviews = { renderProductReviews };
})();
