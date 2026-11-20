(() => {
  const { escapeHtml, formatPrice, digitsOnly, formatCpf, avatarMarkup } = window.KahLimaUtils;

  function renderDashboard(state) {
    const report = state.adminDashboard;
    return `
      <section class="store-view" aria-labelledby="view-title">
        <div class="view-heading">
          <div><p class="eyebrow eyebrow-muted">Visão geral da loja</p><h1 id="view-title">Resumo de vendas</h1><p>Indicadores dos últimos 30 dias.</p></div>
          <button type="button" class="button button-cancel" id="refresh-admin-dashboard">Atualizar</button>
        </div>
        ${state.adminDashboardError ? `<p class="form-error" role="alert">${escapeHtml(state.adminDashboardError)}</p>` : ''}
        ${state.adminDashboardLoading ? '<p role="status">Carregando indicadores...</p>' : report ? `
          <div class="admin-dashboard-grid">
            <article class="admin-metric-card"><span>Vendas confirmadas</span><strong>${report.paidCount}</strong></article>
            <article class="admin-metric-card"><span>Valor recebido</span><strong>${formatPrice(report.revenue)}</strong></article>
            <article class="admin-metric-card"><span>Pedidos aguardando</span><strong>${report.pendingCount}</strong></article>
            <article class="admin-metric-card"><span>Pedidos cancelados</span><strong>${report.cancelledCount}</strong></article>
          </div>
          <section class="admin-dashboard-panel">
            <h2>Produtos mais vendidos</h2>
            <p class="admin-overview-meta">Unidades em pedidos com pagamento confirmado.</p>
            ${report.topProducts.length ? `<ol class="admin-top-products">${report.topProducts.map((item) => `
              <li><span>${escapeHtml(item.name)}</span><strong>${Number(item.quantity)} un.</strong></li>
            `).join('')}</ol>` : '<p class="review-status">Ainda não há vendas confirmadas nesse período.</p>'}
          </section>
        ` : ''}
      </section>
    `;
  }

  function renderSupport(state, products) {
    const groupedCustomers = new Map();
    state.adminOrders.forEach((order) => {
      const key = digitsOnly(order.customer_phone) || order.id;
      if (!groupedCustomers.has(key)) groupedCustomers.set(key, { name: order.customer_name, phone: order.customer_phone, orders: [] });
      groupedCustomers.get(key).orders.push(order);
    });
    const customers = [...groupedCustomers.values()].filter((customer) =>
      `${customer.name} ${customer.phone}`.toLowerCase().includes(state.adminSupportSearch.toLowerCase()));
    const presenceCustomers = state.adminCustomerPresence.filter((customer) =>
      `${customer.customer_name} ${customer.customer_phone}`.toLowerCase().includes(state.adminSupportSearch.toLowerCase()));
    const detailsCustomer = state.adminCustomerPresence.find((customer) =>
      customer.user_id === state.adminCustomerDetailsUserId);
    const onlineCount = state.adminCustomerPresence.filter((customer) => {
      const lastSeen = Date.parse(customer.last_seen_at || '');
      return Number.isFinite(lastSeen) && Date.now() - lastSeen <= 120000;
    }).length;
    return `
      <section class="store-view" aria-labelledby="view-title">
        <div class="view-heading">
          <div><p class="eyebrow eyebrow-muted">Área restrita da loja</p><h1 id="view-title">Atendimento</h1><p>Consulte os pedidos Pix e o histórico de mensagens por cliente.</p></div>
          <button type="button" class="button button-cancel" id="refresh-admin-orders">Atualizar</button>
        </div>
        ${state.adminOrderError ? `<p class="form-error" role="alert">${escapeHtml(state.adminOrderError)}</p>` : ''}
        <form class="admin-notification-form" data-store-notification-form>
          <div><p class="eyebrow eyebrow-muted">Notificação do sistema</p><h2>Enviar um aviso</h2><p>Avise todos os visitantes e clientes ou escolha uma conta específica.</p></div>
          <label class="field"><span>Destinatário</span><select name="targetUserId"><option value="">Todos os visitantes e clientes</option>${state.adminNotificationRecipients.map((customer) => `<option value="${escapeHtml(customer.user_id)}">${escapeHtml(customer.customer_name)}${customer.customer_phone ? ` · ${escapeHtml(customer.customer_phone)}` : ''}</option>`).join('')}</select></label>
          <label class="field"><span>Produto relacionado <small>(opcional)</small></span><select name="productId"><option value="">Nenhum produto</option>${products.filter((product) => product.stock > 0 || product.stockByColor).map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${formatPrice(product.price)}</option>`).join('')}</select></label>
          <label class="field"><span>Título</span><input name="title" maxlength="120" placeholder="Ex.: Oferta por tempo limitado" required></label>
          <label class="field"><span>Mensagem</span><textarea name="message" rows="3" maxlength="500" placeholder="Escreva o aviso que aparecerá na loja" required></textarea></label>
          ${state.adminNotificationRecipientsLoading ? '<p class="review-status" role="status">Carregando clientes...</p>' : ''}
          ${state.adminNotificationRecipientsError ? `<p class="form-error" role="alert">${escapeHtml(state.adminNotificationRecipientsError)}</p>` : ''}
          ${state.adminNotificationPublishError ? `<p class="form-error" role="alert">${escapeHtml(state.adminNotificationPublishError)}</p>` : ''}
          ${state.adminNotificationPublishNotice ? `<p class="form-success" role="status">${escapeHtml(state.adminNotificationPublishNotice)}</p>` : ''}
          <button type="submit" class="button button-primary">Enviar notificação</button>
        </form>
        <label class="search-field admin-support-search"><span class="visually-hidden">Buscar cliente</span><input id="admin-support-search" value="${escapeHtml(state.adminSupportSearch)}" placeholder="Buscar por nome ou telefone"></label>
        <section class="admin-presence-panel" aria-labelledby="admin-presence-title">
          <div class="admin-presence-heading">
            <div><p class="eyebrow eyebrow-muted">Atendimento direto</p><h2 id="admin-presence-title">Clientes e atividade</h2><p>${onlineCount} ${onlineCount === 1 ? 'cliente online' : 'clientes online'} · status atualizado a cada 30 segundos</p></div>
            <button type="button" class="button button-cancel" id="refresh-admin-customers">Atualizar</button>
          </div>
          ${state.adminCustomerPresenceError ? `<p class="form-error" role="alert">${escapeHtml(state.adminCustomerPresenceError)}</p>` : ''}
          ${state.adminCustomerPhotoError ? `<p class="review-status" role="status">${escapeHtml(state.adminCustomerPhotoError)}</p>` : ''}
          ${state.adminCustomerPresenceLoading ? '<p class="review-status" role="status">Carregando perfis...</p>' : presenceCustomers.length ? `
            <div class="admin-presence-list">
              ${presenceCustomers.map((customer) => {
                const lastSeen = Date.parse(customer.last_seen_at || '');
                const hasActivity = Number.isFinite(lastSeen);
                const elapsedMinutes = hasActivity ? Math.max(0, Math.floor((Date.now() - lastSeen) / 60000)) : 0;
                const isOnline = hasActivity && Date.now() - lastSeen <= 120000;
                const elapsedHours = Math.floor(elapsedMinutes / 60);
                const elapsedDays = Math.floor(elapsedHours / 24);
                const activityLabel = isOnline
                  ? 'Online agora'
                  : !hasActivity
                    ? 'Offline · ainda não esteve online'
                    : elapsedMinutes < 60
                      ? `Offline · ativo há ${Math.max(1, elapsedMinutes)} ${elapsedMinutes === 1 ? 'minuto' : 'minutos'}`
                      : elapsedHours < 24
                        ? `Offline · ativo há ${elapsedHours} ${elapsedHours === 1 ? 'hora' : 'horas'}`
                        : `Offline · ativo há ${elapsedDays} ${elapsedDays === 1 ? 'dia' : 'dias'}`;
                  const canNotify = state.adminNotificationRecipients.some((recipient) => recipient.user_id === customer.user_id);
                  return `
                  <article class="admin-presence-customer">
                    ${avatarMarkup({ name: customer.customer_name || 'Cliente', photoUrl: customer.photoUrl || '' }, 'admin-presence-avatar')}
                    <div class="admin-presence-customer-info">
                      <button type="button" class="admin-presence-customer-name" data-customer-details="${escapeHtml(customer.user_id)}" aria-haspopup="dialog">${escapeHtml(customer.customer_name || 'Cliente')}</button>
                      <span class="admin-presence-status${isOnline ? ' is-online' : ''}"><i aria-hidden="true"></i>${activityLabel}</span>
                      ${customer.customer_phone ? `<small>${escapeHtml(customer.customer_phone)}</small>` : ''}
                    </div>
                    <button type="button" class="text-button" data-notify-customer="${escapeHtml(customer.user_id)}" ${canNotify ? '' : 'disabled'}>Enviar aviso</button>
                  </article>
                `;
              }).join('')}
            </div>
          ` : '<p class="review-status">Nenhum perfil encontrado. Contas cadastradas aparecerão aqui.</p>'}
        </section>
        ${state.adminOrdersLoading ? '<p role="status">Carregando clientes...</p>' : customers.length ? `
          <div class="admin-customer-list">
            ${customers.map((customer) => {
              const latestOrder = customer.orders[0];
              const phone = digitsOnly(customer.phone);
              const whatsapp = phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : '';
              const messages = customer.orders.flatMap((order) => (order.order_notifications || []).map((message) => ({
                ...message,
                orderNumber: order.number,
              }))).sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).slice(0, 5);
              return `
                <article class="admin-customer-card">
                  <div class="admin-customer-heading">
                    <div><h2>${escapeHtml(customer.name || 'Cliente')}</h2><p>${escapeHtml(customer.phone || 'Telefone não informado')} · ${customer.orders.length} ${customer.orders.length === 1 ? 'pedido' : 'pedidos'}</p></div>
                    ${whatsapp ? `<a class="button button-cancel" href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>` : ''}
                  </div>
                  <div class="admin-customer-messages">
                    ${messages.length ? messages.map((message) => `<div class="admin-customer-message"><strong>Pedido ${escapeHtml(message.orderNumber)}</strong> · ${new Date(message.created_at).toLocaleString('pt-BR')}<br>${escapeHtml(message.message)}</div>`).join('') : '<p class="review-status">Ainda não há mensagens registradas.</p>'}
                  </div>
                  ${customer.orders.map((order) => `
                    <p class="admin-customer-order">Pedido ${escapeHtml(order.number)} · ${new Date(order.created_at).toLocaleDateString('pt-BR')} · ${formatPrice(Number(order.total))} · ${escapeHtml(order.status)}</p>
                  `).join('')}
                  <div class="admin-customer-actions">
                    <button type="button" class="text-button" data-send-order-notification="${escapeHtml(latestOrder.id)}">Enviar mensagem no site</button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        ` : '<div class="empty-search orders-empty"><h3>Nenhum cliente encontrado</h3><p>Pedidos Pix registrados aparecerão nesta área.</p></div>'}
        ${state.adminCustomerDetailsUserId ? `
          <div class="profile-overlay admin-customer-details-overlay" data-customer-details-overlay>
            <section class="profile-dialog admin-customer-details-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-customer-details-title">
              <div class="profile-dialog-heading">
                <div><p class="eyebrow eyebrow-muted">Dados da conta</p><h2 id="admin-customer-details-title" tabindex="-1">${escapeHtml(state.adminCustomerDetails?.customer_name || detailsCustomer?.customer_name || 'Dados do cliente')}</h2></div>
                <button type="button" class="profile-close" data-close-customer-details aria-label="Fechar dados do cliente">×</button>
              </div>
              ${state.adminCustomerDetailsLoading ? '<p class="review-status" role="status">Carregando dados da conta...</p>' : ''}
              ${state.adminCustomerDetailsError ? `<p class="form-error" role="alert">${escapeHtml(state.adminCustomerDetailsError)}</p>` : ''}
              ${state.adminCustomerDetails ? `
                <dl class="admin-customer-details-list">
                  <div><dt>Nome</dt><dd>${escapeHtml(state.adminCustomerDetails.customer_name || 'Não informado')}</dd></div>
                  <div><dt>E-mail de acesso</dt><dd>${escapeHtml(state.adminCustomerDetails.customer_email || 'Não informado')}</dd></div>
                  <div><dt>CPF</dt><dd>${escapeHtml(formatCpf(state.adminCustomerDetails.customer_cpf || '') || 'Não informado')}</dd></div>
                  <div><dt>Telefone</dt><dd>${escapeHtml(state.adminCustomerDetails.customer_phone || 'Não informado')}</dd></div>
                </dl>
                <p class="admin-customer-account-note">A senha não pode ser consultada. Para recuperar o acesso, o cliente precisa usar a opção “Esqueci minha senha” na tela de entrada.</p>
              ` : ''}
              <div class="profile-buttons"><button type="button" class="button button-cancel" data-close-customer-details>Fechar</button></div>
            </section>
          </div>
        ` : ''}
      </section>
    `;
  }

  function renderReviews(state, products) {
    return `
      <section class="store-view" aria-labelledby="view-title">
        <div class="view-heading">
          <div><p class="eyebrow eyebrow-muted">Moderação</p><h1 id="view-title">Avaliações</h1><p>Somente avaliações aprovadas ficam visíveis na loja.</p></div>
          <button type="button" class="button button-cancel" id="refresh-admin-reviews">Atualizar</button>
        </div>
        ${state.adminReviewsError ? `<p class="form-error" role="alert">${escapeHtml(state.adminReviewsError)}</p>` : ''}
        ${state.adminReviewsLoading ? '<p role="status">Carregando avaliações...</p>' : state.adminReviewList.length ? `
          <div class="admin-review-list">
            ${state.adminReviewList.map((review) => {
              const product = products.find((item) => item.id === review.product_id);
              return `
                <article class="admin-review-card">
                  <h2>${escapeHtml(product?.name || review.product_id)}</h2>
                  <div class="product-review-stars" aria-label="Nota ${Number(review.rating)} de 5">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</div>
                  <p>${escapeHtml(review.comment)}</p>
                  <small>Compra verificada · ${new Date(review.created_at).toLocaleString('pt-BR')}</small>
                  <div class="admin-review-actions">
                    <button type="button" class="button button-primary" data-review-action="approved" data-review-id="${review.id}">Aprovar</button>
                    <button type="button" class="button button-cancel" data-review-action="rejected" data-review-id="${review.id}">Rejeitar</button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        ` : '<div class="empty-search orders-empty"><h3>Nenhuma avaliação pendente</h3><p>Novas avaliações de compras confirmadas aparecerão aqui.</p></div>'}
      </section>
    `;
  }

  function renderSettings(state) {
    const settings = state.storeSettings;
    return `
      <section class="store-view" aria-labelledby="view-title">
        <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Informações públicas</p><h1 id="view-title">Dados da loja</h1><p>Esses contatos aparecem na área de suporte para todos os clientes.</p></div></div>
        ${state.adminSettingsError ? `<p class="form-error" role="alert">${escapeHtml(state.adminSettingsError)}</p>` : ''}
        ${state.adminSettingsNotice ? `<p class="form-success" role="status">${escapeHtml(state.adminSettingsNotice)}</p>` : ''}
        <form class="admin-settings-form" id="admin-settings-form">
          <label class="field"><span>Nome da loja</span><input name="storeName" maxlength="120" value="${escapeHtml(settings.store_name)}" required></label>
          <label class="field"><span>WhatsApp de suporte</span><input name="supportWhatsapp" type="tel" maxlength="30" value="${escapeHtml(settings.support_whatsapp)}" required></label>
          <label class="field"><span>E-mail de suporte</span><input name="supportEmail" type="email" maxlength="254" value="${escapeHtml(settings.support_email)}" required></label>
          <label class="field"><span>Mensagem de atendimento</span><textarea name="supportMessage" rows="3" maxlength="300">${escapeHtml(settings.support_message)}</textarea></label>
          <p class="admin-settings-notice">As alterações são salvas no Supabase e aparecem na página de suporte.</p>
          <button class="button button-primary" type="submit">Salvar informações</button>
        </form>
      </section>
    `;
  }

  window.KahLimaAdminViews = {
    renderDashboard,
    renderSupport,
    renderReviews,
    renderSettings,
  };
})();
