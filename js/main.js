const app = document.querySelector('#app');
const products = window.KahLimaProducts;
const categories = window.KahLimaCategories;
const { findProductsById } = window.KahLimaProductSearch;
const { renderProductDetail, bindProductDetail } = window.KahLimaProductDetail;
const { escapeHtml, formatPrice, digitsOnly, formatCpf, isValidCpf, formatPhone, initials, avatarMarkup } = window.KahLimaUtils;
const storePath = '#loja';

function cartItemKey(item) {
  return JSON.stringify([item.id, item.color || '', item.type || '']);
}

function getProductCartQuantity(productId) {
  return state.cart
    .filter((item) => item.id === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function getProductStock(product) {
  return product.stockByColor
    ? Object.values(product.stockByColor).reduce((sum, quantity) => sum + Math.max(0, Number(quantity) || 0), 0)
    : product.stock;
}

function getVariantStock(product, color) {
  if (!product.stockByColor) return product.stock;
  return Math.max(0, Number(product.stockByColor[color]) || 0);
}

function getProductOptions(product) {
  return window.getKahLimaProductOptions(product);
}

function getMissingProductVariant(product, variants) {
  const options = getProductOptions(product);
  return ['color', 'type'].find((kind) => options[kind].length && !variants?.[kind]);
}

function getItemVariantLabel(color, type) {
  const variants = [color, type].filter(Boolean);
  return variants.length ? variants.join(' · ') : 'Sem variações';
}

function getVariantCartQuantity(productId, color) {
  return state.cart
    .filter((item) => item.id === productId && item.color === color)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function getRemainingVariantStock(product, color) {
  return Math.max(0, getVariantStock(product, color) - getVariantCartQuantity(product.id, color));
}

const state = {
  profile: null,
  userId: null,
  profileDraft: null,
  cart: [],
  mode: 'login',
  authScreen: 'login',
  authName: '',
  authCpf: '',
  authEmail: '',
  authPhone: '',
  authPending: false,
  authInitializing: true,
  successMessage: '',
  search: '',
  quantities: {},
  error: '',
  notice: '',
  view: 'home',
  contentRefresh: false,
  selectedCategory: null,
  sidebarCollapsed: true,
  sidebarOpen: false,
  orders: [],
  adminOrders: [],
  isStoreAdmin: false,
  adminOrdersLoading: false,
  adminOrderError: '',
  cancellationNotificationCount: 0,
  selectedOrder: null,
  theme: localStorage.getItem('kahLimaTheme') || 'light',
  profileOpen: false,
  profileError: '',
  productDetailId: null,
  selectedProductVariants: null,
  checkoutStep: null,
  checkoutDelivery: null,
  paymentMethod: 'pix',
  order: null,
  checkoutError: '',
  paymentPending: false,
  ordersLoading: false,
  orderStatusTimer: null,
  renderedContentKey: null,
};
document.documentElement.dataset.theme = state.theme;

function goTo(hash) {
  if (window.location.hash === hash) {
    render();
    return;
  }
  window.location.hash = hash;
}

function renderLogin() {
  const isSignup = state.mode === 'signup';
  const isForgotPassword = state.authScreen === 'forgot';
  const isPasswordRecovery = state.authScreen === 'reset';
  const showAuthTabs = !isForgotPassword && !isPasswordRecovery;

  app.innerHTML = `
    <main class="auth-page">
      <div class="auth-card">
        <section class="auth-story">
          <a class="brand brand-light" href="#" aria-label="KahLima Vendas, início">
            <span class="brand-mark">K</span>
            <span>KahLima Vendas</span>
          </a>
          <div class="story-copy">
            <p class="eyebrow">Escolhas leves, feitas para você</p>
            <h1>Um lugar para escolher com calma.</h1>
            <p>Peças especiais para deixar o cotidiano um pouco mais seu.</p>
          </div>
          <p class="story-foot">Uma escolha especial para tornar o dia a dia mais seu.</p>
          <span class="story-orbit orbit-one"></span>
          <span class="story-orbit orbit-two"></span>
          <span class="story-sun"></span>
        </section>

        <section class="auth-form-side" aria-labelledby="auth-title">
          <a class="brand brand-mobile" href="#">
            <span class="brand-mark">K</span>
            <span>KahLima Vendas</span>
          </a>
          <p class="eyebrow eyebrow-muted">Sua conta KahLima</p>
          <h2 id="auth-title">${isPasswordRecovery ? 'Crie uma nova senha' : isForgotPassword ? 'Recuperar senha' : isSignup ? 'Crie sua conta' : 'Acesse sua conta'}</h2>
          <p class="auth-intro">${isPasswordRecovery ? 'Escolha uma nova senha para sua conta KahLima.' : isForgotPassword ? 'Informe seu e-mail e enviaremos um link para redefinir a senha.' : isSignup ? 'Cadastre-se para acompanhar seus pedidos e novidades.' : 'Entre para continuar sua experiência na KahLima.'}</p>

          ${showAuthTabs ? `<div class="auth-tabs" role="tablist" aria-label="Entrar ou criar conta">
            <button type="button" role="tab" aria-selected="${!isSignup}" class="${!isSignup ? 'active' : ''}" data-mode="login" ${state.authPending ? 'disabled' : ''}>Entrar</button>
            <button type="button" role="tab" aria-selected="${isSignup}" class="${isSignup ? 'active' : ''}" data-mode="signup" ${state.authPending ? 'disabled' : ''}>Criar conta</button>
          </div>` : ''}

          <form id="auth-form">
            ${isSignup && !isForgotPassword && !isPasswordRecovery ? `
              <label class="field">
                <span>Nome completo</span>
                <input name="name" value="${escapeHtml(state.authName)}" autocomplete="name" placeholder="Seu nome e sobrenome" maxlength="120" required>
              </label>
              <label class="field">
                <span>WhatsApp</span>
                <input name="phone" value="${escapeHtml(state.authPhone)}" type="tel" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" maxlength="15" required>
              </label>
              <label class="field">
                <span>CPF</span>
                <input name="cpf" value="${escapeHtml(state.authCpf)}" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14" required>
              </label>
            ` : ''}
            ${!isPasswordRecovery ? `
              <label class="field">
                <span>E-mail</span>
                <input name="email" value="${escapeHtml(state.authEmail)}" type="email" autocomplete="email" placeholder="voce@exemplo.com" required>
              </label>
            ` : ''}
            ${!isForgotPassword ? `
              <label class="field">
                <span>${isPasswordRecovery ? 'Nova senha' : 'Senha'}</span>
                <input name="password" type="password" autocomplete="${isPasswordRecovery || isSignup ? 'new-password' : 'current-password'}" minlength="8" placeholder="${isPasswordRecovery || isSignup ? 'Mínimo de 8 caracteres' : 'Digite sua senha'}" required>
              </label>
            ` : ''}
            ${isPasswordRecovery ? `
              <label class="field">
                <span>Confirme a nova senha</span>
                <input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" placeholder="Digite a nova senha novamente" required>
              </label>
            ` : ''}
            ${state.error ? `<p class="form-error" role="alert">${escapeHtml(state.error)}</p>` : ''}
            ${state.successMessage ? `<p class="form-success" role="status">${escapeHtml(state.successMessage)}</p>` : ''}
            ${state.mode === 'login' && !isForgotPassword && !isPasswordRecovery ? '<button type="button" class="auth-forgot-password" id="forgot-password">Esqueci minha senha</button>' : ''}
            <button class="button button-primary button-wide" type="submit" ${state.authPending ? 'disabled' : ''}>${state.authPending ? 'Aguarde...' : isPasswordRecovery ? 'Salvar nova senha' : isForgotPassword ? 'Enviar link de recuperação' : isSignup ? 'Criar minha conta' : 'Entrar'} <span aria-hidden="true">→</span></button>
          </form>
          ${isForgotPassword || isPasswordRecovery ? '<button type="button" class="auth-forgot-password" id="back-to-login">Voltar para entrar</button>' : ''}
        </section>
      </div>
    </main>
  `; 

  app.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      state.authScreen = state.mode;
      state.error = '';
      state.successMessage = '';
      renderLogin();
      app.querySelector(`[name="${state.mode === 'signup' ? 'name' : 'email'}"]`)?.focus();
    });
  });
  app.querySelector('#forgot-password')?.addEventListener('click', () => {
    state.authScreen = 'forgot';
    state.error = '';
    state.successMessage = '';
    renderLogin();
    app.querySelector('[name="email"]')?.focus();
  });
  app.querySelector('#back-to-login')?.addEventListener('click', () => {
    state.authScreen = 'login';
    state.mode = 'login';
    state.error = '';
    state.successMessage = '';
    renderLogin();
    app.querySelector('[name="email"]')?.focus();
  });

  const authForm = app.querySelector('#auth-form');
  authForm.addEventListener('input', (event) => {
    if (event.target.name === 'name') state.authName = event.target.value;
    if (event.target.name === 'email') state.authEmail = event.target.value;
    if (event.target.name === 'cpf') {
      state.authCpf = formatCpf(event.target.value);
      event.target.value = state.authCpf;
    }
    if (event.target.name === 'phone') {
      state.authPhone = formatPhone(event.target.value);
      event.target.value = state.authPhone;
    }
  });
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const passwordConfirmation = String(form.get('passwordConfirmation') || '');
    const phone = formatPhone(form.get('phone'));
    const cpf = formatCpf(form.get('cpf'));

    if (state.authScreen === 'signup' && name.length < 2) {
      state.error = 'Informe seu nome completo.';
      renderLogin();
      return;
    }
    if (state.authScreen === 'signup' && ![10, 11].includes(digitsOnly(phone).length)) {
      state.error = 'Digite um telefone com DDD e 10 ou 11 números.';
      state.authPhone = phone;
      renderLogin();
      return;
    }
    if (state.authScreen === 'signup' && !isValidCpf(cpf)) {
      state.error = 'Digite um CPF válido.';
      state.authCpf = cpf;
      renderLogin();
      return;
    }
    if (state.authScreen !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      state.error = 'Confira o formato do seu e-mail.';
      renderLogin();
      return;
    }
    if (state.authScreen !== 'forgot' && password.length < 8) {
      state.error = 'Sua senha precisa ter pelo menos 8 caracteres.';
      renderLogin();
      return;
    }
    if (state.authScreen === 'reset' && password !== passwordConfirmation) {
      state.error = 'As senhas não coincidem.';
      renderLogin();
      return;
    }

    const mode = state.mode;
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase) {
      state.error = window.KahLimaSupabase?.configured
        ? 'Não foi possível iniciar o serviço de contas. Atualize a página e tente novamente.'
        : 'A conexão da conta ainda não está configurada.';
      renderLogin();
      return;
    }

    state.authPending = true;
    state.error = '';
    state.successMessage = '';
    renderLogin();

    try {
      const result = state.authScreen === 'forgot'
        ? await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        })
        : state.authScreen === 'reset'
          ? await supabase.auth.updateUser({ password })
          : mode === 'signup'
            ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: name, phone, cpf: digitsOnly(cpf) } },
            })
            : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        state.error = getAuthErrorMessage(result.error, state.authScreen === 'reset' ? 'reset' : mode);
      } else if (state.authScreen === 'forgot') {
        state.authEmail = email;
        state.successMessage = 'Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Confira também a caixa de spam.';
      } else if (state.authScreen === 'reset' && result.data.user) {
        state.authScreen = 'login';
        state.notice = 'Senha redefinida com sucesso.';
        setAuthenticatedUser(result.data.user);
        return;
      } else if (mode === 'signup' && !result.data.session) {
        state.authName = '';
        state.authPhone = '';
        state.authCpf = '';
        state.authEmail = email;
        state.successMessage = 'Conta criada. Confira seu e-mail para confirmar o cadastro e entrar.';
      } else if (result.data.session?.user) {
        setAuthenticatedUser(result.data.session.user);
        return;
      } else {
        state.error = 'Não foi possível iniciar sua sessão. Tente novamente.';
      }
    } catch (error) {
      console.error('Supabase authentication request failed.', error);
      state.error = 'Não foi possível conectar ao serviço de contas. Tente novamente.';
    }

    state.authPending = false;
    renderLogin();
  });
}

function getAuthErrorMessage(error, mode) {
  const code = String(error.code || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();

  if (error.status === 429 || /rate.?limit|too many requests|over_email_send_rate_limit/.test(`${code} ${message}`)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (code === 'invalid_credentials') {
    return 'E-mail ou senha incorretos.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already been registered/.test(message)) {
    return 'Já existe uma conta com este e-mail. Entre na sua conta ou recupere a senha.';
  }
  if (code === 'weak_password' || /password should be at least|password is too weak/.test(message)) {
    return 'Escolha uma senha mais segura e tente novamente.';
  }
  if (code === 'email_address_invalid' || /invalid email/.test(message)) {
    return 'Confira o endereço de e-mail informado.';
  }
  if (/profiles_cpf_unique|duplicate key value violates unique constraint/.test(message)) {
    return 'Este CPF já está vinculado a outra conta. Confira o número ou entre na conta existente.';
  }
  if (/database error saving new user/.test(message)) {
    return 'O Supabase não conseguiu criar seu perfil. A tabela existe; confira os Logs de Auth do projeto, especialmente o trigger de criação de perfil.';
  }
  if (code === 'signup_disabled') {
    return 'O cadastro de novas contas está desativado nas configurações do Supabase.';
  }
  if (code === 'email_not_confirmed') {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }
  if (/otp_expired|expired.*token|invalid.*token|token.*invalid/.test(`${code} ${message}`)) {
    return 'Este link de recuperação expirou ou já foi usado. Solicite um novo link e tente novamente.';
  }
  if (mode === 'reset' && /same_password|different.*password/.test(`${code} ${message}`)) {
    return 'Escolha uma senha diferente da senha atual.';
  }
  if (mode === 'reset' && /password.*weak|weak.*password/.test(`${code} ${message}`)) {
    return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.';
  }
  if (/too many colons in address|dial tcp: address http:\/\/(127\.0\.0\.1|localhost)/.test(message)) {
    return 'O servidor de e-mail do Supabase está configurado com o endereço local da loja. Configure o host SMTP do seu provedor em Authentication → SMTP Settings.';
  }
  return mode === 'login'
    ? 'Não foi possível entrar. Confira os dados e tente novamente.'
    : 'Não foi possível criar sua conta. Confira os dados e tente novamente.';
}

function setAuthenticatedUser(user) {
  const metadata = user.user_metadata || {};
  state.profile = {
    name: metadata.full_name || user.email?.split('@')[0] || 'Cliente',
    email: user.email || '',
    cpf: formatCpf(metadata.cpf || ''),
    phone: metadata.phone || '',
    photoUrl: '',
  };
  state.userId = user.id;
  state.cart = [];
  state.orders = [];
  state.view = 'home';
  state.selectedCategory = null;
  state.search = '';
  state.quantities = {};
  state.authName = '';
  state.authEmail = '';
  state.authPhone = '';
  state.authCpf = '';
  state.error = '';
  state.successMessage = '';
  state.authPending = false;
  state.authInitializing = false;
  void loadCustomerOrders();
  void loadStoreAdminAccess(user.id);
  if (window.location.hash === storePath) renderStore();
  else goTo(storePath);
}

async function loadStoreAdminAccess(userId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) return;
  const { data, error } = await supabase.rpc('is_store_admin');
  if (error) {
    console.error('Could not determine store admin access.', error);
    return;
  }
  if (state.userId !== userId) return;
  state.isStoreAdmin = data === true;
  if (!state.isStoreAdmin && state.view === 'admin-orders') state.view = 'home';
  renderStore();
}

async function loadCustomerOrders() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.userId) return;
  const userId = state.userId;
  state.ordersLoading = true;
  const { data, error } = await supabase
    .from('orders')
    .select('id,status,total,item_count,created_at,payment_provider,customer_reported_paid_at,cancellation_message,cancelled_at,refund_amount,items_snapshot,order_items(product_id,product_name,unit_price,quantity,color,product_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  state.ordersLoading = false;
  if (state.userId !== userId) return;
  if (error) {
    console.error('Could not load customer orders from Supabase.', error);
    state.notice = 'Não foi possível carregar seus pedidos. Atualize a página para tentar novamente.';
    renderStore();
    return;
  }
  state.orders = (data || []).map((row) => {
    const itemRows = row.order_items?.length ? row.order_items : row.items_snapshot || [];
    return {
      id: row.id,
      number: row.id.slice(0, 8).toUpperCase(),
      status: row.status === 'paid'
        ? 'Pago'
        : row.status === 'cancelled'
          ? 'Compra cancelada'
        : row.status === 'failed'
          ? 'Pagamento não concluído'
          : row.customer_reported_paid_at
            ? 'Pagamento informado · aguardando conferência'
            : 'Aguardando Pix',
      createdAt: row.created_at,
      total: Number(row.total),
      itemCount: row.item_count,
      paymentProvider: row.payment_provider,
      customerReportedPaidAt: row.customer_reported_paid_at,
      cancellationMessage: row.cancellation_message,
      cancelledAt: row.cancelled_at,
      refundAmount: row.refund_amount === null ? null : Number(row.refund_amount),
      items: itemRows.map((item) => ({
        quantity: item.quantity,
        color: item.color,
        type: item.product_type || item.type || '',
        product: {
          ...(products.find((product) => product.id === (item.product_id || item.id)) || {}),
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          price: Number(item.unit_price ?? item.price),
        },
      })),
    };
  });
  state.cancellationNotificationCount = state.orders.filter((order) => order.status === 'Compra cancelada').length;
  if (state.view === 'orders' || state.view === 'notifications') {
    state.contentRefresh = true;
    renderStore();
  }
}

async function loadAdminOrders() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  state.adminOrdersLoading = true;
  state.adminOrderError = '';
  renderStore();
  const { data, error } = await supabase
    .from('orders')
    .select('id,status,total,item_count,created_at,customer_name,customer_phone,delivery,items_snapshot,customer_reported_paid_at,payment_provider,cancellation_message,cancelled_at,refund_amount')
    .eq('payment_provider', 'manual_pix')
    .order('created_at', { ascending: false });
  state.adminOrdersLoading = false;
  if (error) {
    console.error('Could not load store orders for review.', error);
    state.adminOrderError = 'Não foi possível carregar os pedidos. Atualize e tente novamente.';
    renderStore();
    return;
  }
  state.adminOrders = (data || []).map((row) => ({
    ...row,
    number: row.id.slice(0, 8).toUpperCase(),
    items: (row.items_snapshot || []).map((item) => ({
      ...item,
      type: item.product_type || '',
      product: {
        ...(products.find((product) => product.id === item.product_id) || {}),
        id: item.product_id,
        name: item.product_name,
        price: Number(item.unit_price),
      },
    })),
  }));
  state.contentRefresh = true;
  renderStore();
}

async function confirmManualPixOrder(orderId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('confirm_manual_pix_payment', { p_order_id: orderId });
  if (error) {
    console.error('Could not confirm manual Pix order.', error);
    state.adminOrderError = 'Não foi possível confirmar o pedido. Confira o acesso de administradora e tente novamente.';
    renderStore();
    return;
  }
  await loadAdminOrders();
}

async function cancelManualPixOrder(orderId, message) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('cancel_manual_pix_order', {
    p_order_id: orderId,
    p_message: message,
  });
  if (error) {
    console.error('Could not cancel manual Pix order.', error);
    state.adminOrderError = 'Não foi possível cancelar o pedido. Atualize e tente novamente.';
    renderStore();
    return;
  }
  await loadAdminOrders();
}

async function reportManualPixPaid(orderId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) return;
  const { error } = await supabase.rpc('report_manual_pix_paid', { p_order_id: orderId });
  if (error) {
    console.error('Could not report manual Pix payment.', error);
    state.checkoutError = 'Não foi possível avisar a loja. Tente novamente.';
    renderStore();
    return;
  }
  state.order.customerReportedPaidAt = new Date().toISOString();
  state.checkoutError = '';
  await loadCustomerOrders();
  renderStore();
}

async function createPixPayment() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) {
    state.checkoutError = 'A conexão com o Supabase não está configurada.';
    state.paymentPending = false;
    state.checkoutStep = 2;
    renderStore();
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-pix-payment', {
      body: {
        items: state.cart.map(({ id, quantity, color, type }) => ({ id, quantity, color, type })),
        delivery: state.checkoutDelivery,
      },
    });
    if (error || data?.error || !data?.orderId || !data?.qrCode) {
      if (error) console.error('PIX request failed.', error);
      state.checkoutError = data?.error
        || (error ? await getPixRequestErrorMessage(error) : 'O servidor não retornou os dados do Pix. Tente novamente.');
      state.paymentPending = false;
      state.checkoutStep = 2;
      renderStore();
      return;
    }

    state.order = {
      ...state.order,
      id: data.orderId,
      number: data.orderId.slice(0, 8).toUpperCase(),
      paymentId: data.paymentId,
      qrCode: data.qrCode,
      qrCodeBase64: data.qrCodeBase64,
      ticketUrl: data.ticketUrl,
      paymentProvider: data.paymentProvider || 'mercadopago',
      status: 'pending',
      total: Number(data.total),
    };
    state.paymentPending = false;
    state.checkoutError = '';
    renderStore();
    if (state.order.paymentProvider === 'manual_pix') {
      const qrContainer = app.querySelector('#manual-pix-qr');
      if (typeof window.QRCode !== 'function' || !qrContainer) {
        state.checkoutError = 'O código Pix foi criado, mas não foi possível montar a imagem do QR Code. Copie o código Pix abaixo para pagar.';
        renderStore();
      } else {
        new window.QRCode(qrContainer, {
          text: state.order.qrCode,
          width: 240,
          height: 240,
          colorDark: '#102018',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    }
    startPaymentStatusPolling();
  } catch (error) {
    console.error('Could not request PIX payment.', error);
    state.checkoutError = 'Não foi possível gerar o código Pix. Tente novamente.';
    state.paymentPending = false;
    state.checkoutStep = 2;
    renderStore();
  }
}

async function getPixRequestErrorMessage(error) {
  const response = error?.context;
  if (response && typeof response.clone === 'function') {
    try {
      const body = await response.clone().json();
      if (typeof body?.error === 'string' && body.error.trim()) return body.error;
    } catch (parseError) {
      console.error('Could not read PIX function error response.', parseError);
    }
    if (response.status === 401) return 'Sua sessão expirou. Saia da conta, entre novamente e tente gerar o Pix.';
    if (response.status === 404) return 'A função de pagamento não foi encontrada. Confirme se ela foi publicada no Supabase.';
    if (response.status >= 500) return `O servidor de pagamento retornou erro ${response.status}. Consulte os logs da função no Supabase.`;
  }
  return 'Não foi possível conectar ao servidor de pagamento. Confira sua conexão e tente novamente.';
}

function startPaymentStatusPolling() {
  window.clearInterval(state.orderStatusTimer);
  state.orderStatusTimer = window.setInterval(async () => {
    if (state.checkoutStep !== 3 || !state.order?.id) {
      window.clearInterval(state.orderStatusTimer);
      return;
    }
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', state.order.id)
        .eq('user_id', state.userId)
        .single();
      if (error) throw error;
      state.checkoutError = '';
      if (data.status === 'paid') {
        window.clearInterval(state.orderStatusTimer);
        state.order.status = 'paid';
        state.cart = [];
        state.quantities = {};
        state.checkoutStep = 4;
        await loadCustomerOrders();
        renderStore();
        app.querySelector('#checkout-title')?.focus();
      } else if (data.status === 'failed') {
        window.clearInterval(state.orderStatusTimer);
        state.checkoutError = 'Este pagamento não foi concluído. Volte à etapa anterior para gerar um novo Pix.';
        renderStore();
      }
    } catch (error) {
      console.error('Could not check PIX payment status.', error);
      state.checkoutError = 'Não foi possível verificar o pagamento agora. Aguardando a próxima tentativa.';
      renderStore();
    }
  }, 5000);
}

function getVisibleProducts() {
  return findProductsById(products, state.search)
    .filter((product) => !state.selectedCategory || product.categoryId === state.selectedCategory);
}

function renderProduct(product) {
  const inCart = getProductCartQuantity(product.id);
  const available = Math.max(0, getProductStock(product) - inCart);
  const quantity = available ? Math.min(state.quantities[product.id] || 1, available) : 0;
  const cardImage = product.images?.[0];
  return `
    <article class="product-card">
      <button type="button" class="product-art art-${escapeHtml(product.color)}${cardImage ? ' has-product-image' : ''}" data-open-product="${escapeHtml(product.id)}" aria-label="Ver detalhes e imagens de ${escapeHtml(product.name)}">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <span class="product-id">${escapeHtml(product.id)}</span>
        ${cardImage ? `<img src="${escapeHtml(cardImage)}" alt="${escapeHtml(product.name)}" draggable="false">` : ''}
        <div class="product-object object-${escapeHtml(product.shape)}"><span></span></div>
      </button>
      <div class="product-info">
        <div class="product-title-row">
          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <button type="button" class="product-detail-link" data-open-product="${escapeHtml(product.id)}">Ver detalhes <span aria-hidden="true">→</span></button>
          </div>
          <strong>${formatPrice(product.price)}</strong>
        </div>
        <p class="product-stock${available ? '' : ' out-of-stock'}">${available ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}` : 'Sem estoque'}</p>
        <div class="product-actions">
          <div class="quantity-control" aria-label="Quantidade de ${escapeHtml(product.name)}">
            <button type="button" data-quantity="-1" data-id="${escapeHtml(product.id)}" aria-label="Diminuir quantidade" ${quantity <= 1 ? 'disabled' : ''}>−</button>
            <span>${quantity}</span>
            <button type="button" data-quantity="1" data-id="${escapeHtml(product.id)}" aria-label="Aumentar quantidade" ${quantity >= available ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="button button-add" data-open-product="${escapeHtml(product.id)}" ${available === 0 ? 'disabled' : ''}>${getProductOptions(product).color.length || getProductOptions(product).type.length ? 'Escolher opções' : 'Ver produto'}</button>
        </div>
      </div>
    </article>
  `;
}

function updateProductQuantityControls(productId) {
  const product = products.find((item) => item.id === productId);
  const inCart = getProductCartQuantity(productId);
  const available = Math.max(0, getProductStock(product) - inCart);
  const quantity = available ? Math.min(state.quantities[productId] || 1, available) : 0;
  const card = app.querySelector(`.product-card [data-open-product="${productId}"]`)?.closest('.product-card');
  const detail = app.querySelector(`[data-product-detail-id="${productId}"]`);

  if (card) {
    const count = card.querySelector('.quantity-control span');
    const decrease = card.querySelector('[data-quantity="-1"]');
    const increase = card.querySelector('[data-quantity="1"]');
    count.textContent = quantity;
    decrease.disabled = quantity <= 1;
    increase.disabled = quantity >= available;
    const stockLabel = card.querySelector('.product-stock');
    stockLabel.textContent = available
      ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}`
      : 'Sem estoque';
    stockLabel.classList.toggle('out-of-stock', available === 0);
    card.querySelector('.button-add').disabled = available === 0;
  }
  if (detail) {
    const selectedColor = state.selectedProductVariants?.color;
    const hasColorOptions = getProductOptions(product).color.length > 0;
    const detailAvailable = selectedColor
      ? Math.min(getRemainingVariantStock(product, selectedColor), available)
      : available;
    const detailQuantity = detailAvailable ? Math.min(state.quantities[productId] || 1, detailAvailable) : 0;
    const count = detail.querySelector('.quantity-control span');
    const decrease = detail.querySelector('[data-detail-quantity="-1"]');
    const increase = detail.querySelector('[data-detail-quantity="1"]');
    count.textContent = detailQuantity;
    decrease.disabled = detailQuantity <= 1;
    increase.disabled = detailQuantity >= detailAvailable;
    const stockLabel = detail.querySelector('.product-detail-stock');
    stockLabel.textContent = selectedColor
      ? detailAvailable
        ? `${detailAvailable} ${detailAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'} na cor ${selectedColor}`
        : `Sem estoque na cor ${selectedColor}`
      : available
        ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}${hasColorOptions ? ' · escolha uma cor' : ''}`
        : 'Sem estoque';
    stockLabel.classList.toggle('out-of-stock', detailAvailable === 0);
    detail.querySelector('[data-detail-add]').disabled = detailAvailable === 0;
    detail.querySelectorAll('[data-variant-kind="color"]').forEach((option) => {
      const colorStock = Math.min(getRemainingVariantStock(product, option.dataset.variantValue), available);
      const colorCount = option.querySelector('[data-variant-stock]');
      if (colorCount) colorCount.textContent = `${colorStock} un.`;
      option.disabled = colorStock === 0;
    });
  }
}

function updateCartSummary() {
  const items = state.cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
    .filter((item) => item.product);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const cartLinkCount = app.querySelector('.cart-link-count');
  const cartIcon = app.querySelector('.cart-icon');
  const cartCount = app.querySelector('.cart-count');
  const subtotal = app.querySelector('.subtotal strong');
  const totalLabel = app.querySelector('.total-row strong');
  if (cartLinkCount) cartLinkCount.textContent = count;
  app.querySelector('.cart-link')?.setAttribute('aria-label', `Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`);
  if (cartIcon) cartIcon.textContent = count;
  if (cartCount) cartCount.textContent = count;
  if (subtotal) subtotal.textContent = formatPrice(total);
  if (totalLabel) totalLabel.textContent = formatPrice(total);
  items.forEach((item) => {
    const { id, quantity, product } = item;
    const key = cartItemKey(item);
    const row = [...app.querySelectorAll('.cart-item')].find((cartItem) => cartItem.dataset.cartKey === key);
    if (!row) return;
    row.querySelector('.cart-item-quantity').textContent = quantity;
    row.querySelector('.cart-item-total').textContent = formatPrice(product.price * quantity);
    row.querySelector('[data-cart-quantity="-1"]').disabled = quantity <= 1;
    row.querySelector('[data-cart-quantity="1"]').disabled =
      getRemainingVariantStock(product, item.color) === 0 ||
      getProductCartQuantity(id) >= getProductStock(product);
  });
}

function showStoreNotice(message) {
  state.notice = message;
  let notice = app.querySelector('.notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'notice';
    notice.setAttribute('role', 'status');
    app.querySelector('.store-page').append(notice);
  }
  notice.textContent = message;
  window.clearTimeout(showStoreNotice.timeout);
  showStoreNotice.timeout = window.setTimeout(() => {
    state.notice = '';
    notice.remove();
  }, 2200);
}

function addProductToCart(productId, variants) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const inCart = getProductCartQuantity(productId);
  const variant = { color: variants.color, type: variants.type };
  const variantAvailable = getRemainingVariantStock(product, variant.color);
  const totalAvailable = Math.max(0, getProductStock(product) - inCart);
  const amount = Math.min(state.quantities[productId] || 1, variantAvailable, totalAvailable);
  if (amount <= 0) return;
  const key = cartItemKey({ id: productId, ...variant });
  const existing = state.cart.find((item) => cartItemKey(item) === key);
  state.cart = existing
    ? state.cart.map((item) => cartItemKey(item) === key ? { ...item, quantity: item.quantity + amount } : item)
    : [...state.cart, { id: productId, ...variant, quantity: amount }];

  const hasCartLine = [...app.querySelectorAll('.cart-item')].some((item) => item.dataset.cartKey === key);
  if (!hasCartLine) replaceCartPanel();
  updateProductQuantityControls(productId);
  updateCartSummary();
  showStoreNotice(`${amount} ${amount === 1 ? 'unidade adicionada' : 'unidades adicionadas'} à sacola.`);
}

function renderCart() {
  const items = state.cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
    .filter((item) => item.product);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!items.length) {
    return `
      <aside class="cart-panel" id="sacola">
        <div class="cart-heading"><div><p class="eyebrow eyebrow-muted">Sua seleção</p><h2>Sacola</h2></div><span class="cart-icon">0</span></div>
        <div class="empty-cart"><span class="empty-bag">＋</span><h3>Sua sacola está vazia</h3><p>Quando encontrar algo especial, ele aparece aqui.</p></div>
        <p class="cart-caption">Sua seleção, sempre à mão.</p>
      </aside>
    `;
  }

  return `
    <aside class="cart-panel" id="sacola">
      <div class="cart-heading">
        <div><p class="eyebrow eyebrow-muted">Sua seleção</p><h2>Sacola <span class="cart-count">${count}</span></h2></div>
        <span class="cart-icon">${count}</span>
      </div>
      <div class="cart-items">
        ${items.map((item) => {
          const { id, quantity, product, color, type } = item;
          const key = cartItemKey(item);
          return `
          <article class="cart-item" data-cart-key="${escapeHtml(key)}">
            <div class="mini-art art-${escapeHtml(product.color)}"><span class="mini-shape object-${escapeHtml(product.shape)}"></span></div>
            <div class="cart-item-info">
              <div class="cart-item-top">
                <div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(getItemVariantLabel(color, type))} · ${formatPrice(product.price)} cada</p></div>
                <button type="button" class="remove-item" data-remove="${escapeHtml(key)}" aria-label="Remover ${escapeHtml(product.name)}, ${escapeHtml(getItemVariantLabel(color, type))}">Remover</button>
              </div>
              <div class="cart-item-bottom">
                <div class="cart-quantity">
                  <button type="button" data-cart-quantity="-1" data-cart-key="${escapeHtml(key)}" aria-label="Diminuir quantidade">−</button>
                  <span class="cart-item-quantity">${quantity}</span>
                  <button type="button" data-cart-quantity="1" data-cart-key="${escapeHtml(key)}" aria-label="Aumentar quantidade" ${getRemainingVariantStock(product, color) === 0 || getProductCartQuantity(id) >= getProductStock(product) ? 'disabled' : ''}>+</button>
                </div>
                <strong class="cart-item-total">${formatPrice(product.price * quantity)}</strong>
              </div>
            </div>
          </article>
        `}).join('')}
      </div>
      <div class="cart-summary">
        <div class="subtotal"><span>Subtotal</span><strong>${formatPrice(total)}</strong></div>
        <p>Pagamento via Pix.</p>
        <div class="total-row"><span>Total</span><strong>${formatPrice(total)}</strong></div>
        <p class="demo-cart-note">Confira seus produtos e quantidades antes de continuar.</p>
        <button type="button" class="button button-primary button-wide" id="start-checkout">Finalizar compra <span aria-hidden="true">→</span></button>
      </div>
    </aside>
  `;
}

function replaceCartPanel() {
  const current = app.querySelector('#sacola');
  if (!current) return;
  const container = document.createElement('div');
  container.innerHTML = renderCart();
  const updated = container.firstElementChild;
  current.replaceWith(updated);
  bindCartPanel(updated);
}

function startCheckout() {
  state.productDetailId = null;
  state.checkoutDelivery = {
    name: state.profile.name,
    whatsapp: state.profile.phone || '',
    receiveMethod: 'nearby',
    street: '',
    number: '',
    deliveryNote: '',
    station: '',
    otherLocation: '',
  };
  state.order = null;
  state.checkoutStep = 0;
  renderStore();
  app.querySelector('#checkout-title').focus();
}

function bindCartPanel(panel) {
  panel?.querySelector('#start-checkout')?.addEventListener('click', startCheckout);
  panel?.querySelectorAll('[data-cart-quantity]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.cartKey;
      const amount = Number(button.dataset.cartQuantity);
      const cartItem = state.cart.find((item) => cartItemKey(item) === key);
      const product = products.find((item) => item.id === cartItem?.id);
      if (!cartItem || !product) return;
      const productQuantity = getProductCartQuantity(product.id);
      const maxQuantity = button.dataset.cartQuantity === '1'
        ? cartItem.quantity + Math.min(
          getRemainingVariantStock(product, cartItem.color),
          getProductStock(product) - productQuantity,
        )
        : cartItem.quantity - 1;
      state.cart = state.cart
        .map((item) => cartItemKey(item) === key
          ? { ...item, quantity: amount > 0 ? Math.min(item.quantity + amount, maxQuantity) : maxQuantity }
          : item)
        .filter((item) => item.quantity > 0);
      if (!state.cart.some((item) => cartItemKey(item) === key)) replaceCartPanel();
      updateProductQuantityControls(product.id);
      updateCartSummary();
    });
  });
  panel?.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.remove;
      const cartItem = state.cart.find((item) => cartItemKey(item) === key);
      if (!cartItem) return;
      const id = cartItem.id;
      state.cart = state.cart.filter((item) => cartItemKey(item) !== key);
      replaceCartPanel();
      updateProductQuantityControls(id);
      updateCartSummary();
    });
  });
}

function renderCheckout() {
  const steps = ['Seus dados', 'Local', 'Pagamento', 'Pix', 'Confirmado'];
  const currentStep = state.checkoutStep;
  const stations = [
    { value: 'itaim-paulista', label: 'Itaim Paulista' },
    { value: 'jardim-helena-vila-mara', label: 'Jardim Helena–Vila Mara' },
    { value: 'sao-miguel-paulista', label: 'São Miguel Paulista' },
    { value: 'comendador-ermelino', label: 'Comendador Ermelino' },
    { value: 'usp-leste', label: 'USP Leste' },
    { value: 'engenheiro-goulart', label: 'Engenheiro Goulart' },
    { value: 'tatuape', label: 'Tatuapé' },
  ];
  const cartItems = state.cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
    .filter((item) => item.product);
  const items = state.order?.items || cartItems;
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
          <h2>Resumo do pedido</h2>
          <div class="checkout-summary-items">${itemsMarkup}</div>
          <div class="total-row"><span>Total</span><strong>${formatPrice(total)}</strong></div>
          ${deliverySummary}
          <p class="demo-cart-note">Pagamento via Pix.</p>
        </aside>
      </div>
    </section>
  `;
}

function renderProfileDialog() {
  const profile = state.profileDraft || state.profile;
  return `
    <div class="profile-overlay" id="profile-overlay">
      <section class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div class="profile-dialog-heading">
          <div><p class="eyebrow eyebrow-muted">Seus dados</p><h2 id="profile-title" tabindex="-1">Meu perfil</h2></div>
          <button type="button" class="profile-close" id="close-profile" aria-label="Fechar perfil">×</button>
        </div>
        <div class="photo-uploader">
          ${avatarMarkup(profile, 'avatar-large')}
          <div class="photo-uploader-copy">
            <label class="button button-add photo-button" for="profile-photo">Escolher foto</label>
            <input class="visually-hidden" id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp">
            <p>Imagem JPG, PNG ou WEBP, de até 5 MB.</p>
          </div>
        </div>
        <form id="profile-form">
          <div class="profile-fields">
            <label class="field"><span>Nome</span><input name="name" value="${escapeHtml(profile.name)}" autocomplete="name" required></label>
            <label class="field"><span>E-mail</span><input name="email" type="email" value="${escapeHtml(profile.email)}" autocomplete="email" required></label>
            <label class="field"><span>CPF</span><input name="cpf" value="${escapeHtml(profile.cpf)}" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required></label>
            <label class="field"><span>Telefone</span><input name="phone" type="tel" value="${escapeHtml(profile.phone)}" inputmode="tel" maxlength="15" placeholder="(00) 00000-0000" required></label>
          </div>
          ${state.profileError ? `<p class="form-error" role="alert">${escapeHtml(state.profileError)}</p>` : ''}
          <p class="profile-privacy">Nome, e-mail e telefone da conta são protegidos pelo serviço de autenticação. A edição do perfil e o envio de foto serão habilitados em uma próxima etapa.</p>
          <div class="profile-buttons">
            <button type="button" class="button button-cancel" id="cancel-profile">Cancelar</button>
            <button type="submit" class="button button-primary">Salvar perfil</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function closeProfileDialog() {
  const draftPhoto = state.profileDraft?.photoUrl;
  if (draftPhoto?.startsWith('blob:') && draftPhoto !== state.profile?.photoUrl) {
    URL.revokeObjectURL(draftPhoto);
  }
  state.profileDraft = null;
  state.profileOpen = false;
  state.profileError = '';
  renderStore();
  app.querySelector('#open-profile').focus();
}

function renderProductListing(title, description, visibleProducts) {
  return `
    <section class="catalog" aria-labelledby="catalog-title">
      <div class="catalog-heading">
        <div><p class="eyebrow eyebrow-muted">${escapeHtml(description)}</p><h2 id="catalog-title">${escapeHtml(title)}</h2></div>
      </div>
      <p class="search-hint" id="search-hint">Digite o ID com ou sem hífen, por exemplo AU-101 ou AU101.</p>
      ${visibleProducts.length
        ? `<div class="product-grid">${visibleProducts.map(renderProduct).join('')}</div>`
        : `<div class="empty-search"><h3>Nenhum produto encontrado</h3><p>Confira o ID ou escolha outra categoria.</p><button class="text-button" type="button" data-clear-category>Ver todos os produtos</button></div>`}
    </section>
  `;
}

function renderCategoriesView() {
  if (state.selectedCategory) {
    const category = categories.find((item) => item.id === state.selectedCategory);
    return `<div class="view-heading"><div><p class="eyebrow eyebrow-muted">Categorias</p><h1>${escapeHtml(category.name)}</h1></div><button type="button" class="text-button" data-clear-category>Ver todas as categorias</button></div>${renderProductListing(`Produtos de ${category.name}`, 'Selecionados para você', getVisibleProducts())}`;
  }
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Explore a loja</p><h1 id="view-title">Categorias</h1><p>Encontre o que procura por departamento.</p></div></div>
      <div class="category-grid">
        ${categories.map((category) => `<button type="button" class="category-tile" data-category-choose="${category.id}"><span aria-hidden="true">${category.icon}</span><strong>${escapeHtml(category.name)}</strong><small>${products.filter((product) => product.categoryId === category.id).length} produtos</small></button>`).join('')}
      </div>
    </section>
  `;
}

function renderHomeView(firstName) {
  const newProducts = getVisibleProducts().filter((product) => product.isNew);
  return `
    <section class="store-welcome">
      <p class="eyebrow">KahLima Vendas · novidades</p>
      <h1>Olá, ${escapeHtml(firstName)}.</h1>
      <p>Descubra o que acabou de chegar à loja.</p>
      <span class="welcome-orbit welcome-orbit-one"></span><span class="welcome-orbit welcome-orbit-two"></span>
    </section>
    <div class="home-shortcuts" aria-label="Categorias em destaque">
      ${categories.slice(0, 4).map((category) => `<button type="button" class="category-chip" data-category-choose="${category.id}">${category.icon} ${escapeHtml(category.name)}</button>`).join('')}
      <button type="button" class="category-chip category-chip-all" data-view="categories">Todas as categorias →</button>
    </div>
    ${renderProductListing('Acabaram de chegar', 'Novidades da semana', newProducts)}
  `;
}

function renderOrdersView() {
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Sua conta</p><h1 id="view-title">Pedidos</h1><p>Acompanhe seus pedidos e pagamentos.</p></div></div>
      ${state.ordersLoading ? '<p role="status">Carregando seus pedidos...</p>' : state.orders.length ? `<div class="orders-list">${state.orders.map((order) => `
        <article class="order-row${state.selectedOrder?.number === order.number ? ' is-expanded' : ''}">
          <div class="order-row-main"><span class="order-status">${escapeHtml(order.status)}</span><h2>Pedido ${escapeHtml(order.number)}</h2><p>${new Date(order.createdAt).toLocaleDateString('pt-BR')} · ${order.itemCount || order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</p></div>
          <strong>${formatPrice(order.total)}</strong>
          <button type="button" class="text-button" data-order-detail="${escapeHtml(order.number)}" aria-expanded="${state.selectedOrder?.number === order.number}" aria-controls="order-detail-${escapeHtml(order.number)}">${state.selectedOrder?.number === order.number ? 'Fechar resumo' : 'Ver resumo'}</button>
          ${state.selectedOrder?.number === order.number ? `
            <div class="order-detail-strip" id="order-detail-${escapeHtml(order.number)}">
              <h3>Produtos do pedido</h3>
              ${order.items.length ? `<ul class="order-item-list">
                ${order.items.map((item) => `
                  <li class="order-item">
                    <span class="order-item-quantity">${item.quantity}×</span>
                    <span class="order-item-name">${escapeHtml(item.product.name)}<small>${escapeHtml(getItemVariantLabel(item.color, item.type))}</small></span>
                    <strong>${formatPrice(item.product.price * item.quantity)}</strong>
                  </li>
                `).join('')}
              </ul>` : '<p>Os produtos deste pedido serão exibidos após a confirmação do Pix.</p>'}
              <div class="order-detail-total"><span>Total do pedido</span><strong>${formatPrice(order.total)}</strong></div>
              ${order.paymentProvider === 'manual_pix' && order.status !== 'Pago' && order.status !== 'Pagamento não concluído'
                ? order.customerReportedPaidAt
                  ? '<p class="pix-payment-status">Pagamento informado. A loja fará a conferência.</p>'
                  : `<button type="button" class="button button-cancel" data-report-manual-pix="${escapeHtml(order.id)}">Já paguei</button>`
                : ''}
              ${order.status === 'Compra cancelada' ? `
                <section class="order-cancellation-notice" aria-label="Aviso de cancelamento">
                  <strong>Compra cancelada</strong>
                  <p>${escapeHtml(order.cancellationMessage || 'A loja cancelou esta compra.')}</p>
                  ${order.refundAmount !== null ? `<p>Valor para devolução: <strong>${formatPrice(order.refundAmount)}</strong>. A devolução será feita manualmente pela loja.</p>` : ''}
                </section>
              ` : ''}
            </div>
          ` : ''}
        </article>
      `).join('')}</div>` : `<div class="empty-search orders-empty"><h3>Você ainda não tem pedidos</h3><p>Seus pedidos e pagamentos aparecerão aqui.</p><button type="button" class="button button-primary" data-view="home">Explorar novidades</button></div>`}
    </section>
  `;
}

function renderAdminOrdersView() {
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading">
        <div><p class="eyebrow eyebrow-muted">Área restrita da loja</p><h1 id="view-title">Conferir pedidos Pix</h1><p>Confira o crédito no aplicativo do banco antes de confirmar o pagamento.</p></div>
        <button type="button" class="button button-cancel" id="refresh-admin-orders">Atualizar</button>
      </div>
      ${state.adminOrderError ? `<p class="form-error" role="alert">${escapeHtml(state.adminOrderError)}</p>` : ''}
      ${state.adminOrdersLoading ? '<p role="status">Carregando pedidos...</p>' : state.adminOrders.length ? `
        <div class="orders-list">
          ${state.adminOrders.map((order) => {
            const delivery = order.delivery || {};
            const pickup = delivery.receiveMethod === 'station';
            const deliveryText = pickup
              ? `Retirada: ${String(delivery.station || 'Estação não informada').replace(/-/g, ' ')}`
              : `Entrega: ${[delivery.street, delivery.number].filter(Boolean).join(', ')}${delivery.deliveryNote ? ` · ${delivery.deliveryNote}` : ''}`;
            return `
              <article class="order-row admin-order-row">
                <div class="order-row-main">
                  <span class="order-status">${order.status === 'paid' ? 'Pago' : order.status === 'cancelled' ? 'Compra cancelada' : order.status === 'failed' ? 'Falhou' : order.customer_reported_paid_at ? 'Cliente informou pagamento' : 'Aguardando Pix'}</span>
                  <h2>Pedido ${escapeHtml(order.number)}</h2>
                  <p>${new Date(order.created_at).toLocaleString('pt-BR')} · ${order.item_count} itens</p>
                </div>
                <strong>${formatPrice(Number(order.total))}</strong>
                <div class="admin-order-details">
                  <p><strong>Cliente:</strong> ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}</p>
                  <p><strong>Recebimento:</strong> ${escapeHtml(deliveryText)}</p>
                  <h3>Produtos</h3>
                  <ul class="order-item-list">
                    ${order.items.map((item) => `
                      <li class="order-item">
                        <span class="order-item-quantity">${item.quantity}×</span>
                        <span class="order-item-name">${escapeHtml(item.product.name)}<small>${escapeHtml(getItemVariantLabel(item.color, item.type))}</small></span>
                        <strong>${formatPrice(Number(item.unit_price) * item.quantity)}</strong>
                      </li>
                    `).join('')}
                  </ul>
                  ${order.status === 'cancelled' ? `
                    <section class="order-cancellation-notice">
                      <strong>Compra cancelada</strong>
                      <p>${escapeHtml(order.cancellation_message || '')}</p>
                      ${order.refund_amount !== null ? `<p>Valor a devolver: <strong>${formatPrice(Number(order.refund_amount))}</strong> · devolução manual via Pix</p>` : '<p>Pedido cancelado antes da confirmação do pagamento; não há valor de devolução registrado.</p>'}
                    </section>
                  ` : ''}
                  ${order.status === 'pending' ? `<button type="button" class="button button-primary" data-confirm-manual-pix="${escapeHtml(order.id)}">Confirmar recebimento no banco</button>` : ''}
                  ${['pending', 'paid'].includes(order.status) ? `<button type="button" class="button button-cancel" data-cancel-manual-pix="${escapeHtml(order.id)}" data-cancel-total="${escapeHtml(String(Number(order.total)))}" data-cancel-paid="${order.status === 'paid'}">Cancelar compra</button>${order.status === 'paid' ? `<p class="refund-amount-note">Valor a devolver ao cliente: <strong>${formatPrice(Number(order.total))}</strong></p>` : ''}` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      ` : '<div class="empty-search orders-empty"><h3>Nenhum pedido Pix encontrado</h3><p>Novos pedidos aparecerão aqui.</p></div>'}
    </section>
  `;
}

function renderNotificationsView() {
  const notifications = state.orders.filter((order) => order.status === 'Compra cancelada');
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Sua conta</p><h1 id="view-title">Notificações</h1><p>Avisos enviados pela loja sobre seus pedidos.</p></div></div>
      ${notifications.length ? `<div class="notification-list">${notifications.map((order) => `
        <article class="order-cancellation-notice">
          <p class="eyebrow eyebrow-muted">Pedido ${escapeHtml(order.number)} · ${new Date(order.cancelledAt || order.createdAt).toLocaleString('pt-BR')}</p>
          <h2>Compra cancelada</h2>
          <p>${escapeHtml(order.cancellationMessage || 'A loja cancelou esta compra.')}</p>
          ${order.refundAmount !== null ? `<p>Valor para devolução: <strong>${formatPrice(order.refundAmount)}</strong>. A devolução é feita manualmente pela loja.</p>` : ''}
          <button type="button" class="text-button" data-view="orders">Ver pedido</button>
        </article>
      `).join('')}</div>` : '<div class="empty-search orders-empty"><h3>Nenhuma notificação</h3><p>Os avisos da loja aparecerão aqui.</p></div>'}
    </section>
  `;
}

function renderProfileView() {
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Sua conta</p><h1 id="view-title">Perfil</h1><p>Seus dados e preferências da conta.</p></div><button type="button" class="button button-primary" id="open-profile">Editar perfil</button></div>
      <div class="account-profile">
        ${avatarMarkup(state.profile, 'avatar-large')}
        <div><h2>${escapeHtml(state.profile.name)}</h2><p>${escapeHtml(state.profile.email)}</p><p>${escapeHtml(state.profile.phone || 'WhatsApp não informado')}</p></div>
      </div>
      <div class="profile-settings-link"><div><strong>Configurações da loja</strong><p>Personalize a aparência da página.</p></div><button type="button" class="text-button" data-view="settings">Abrir configurações →</button></div>
    </section>
  `;
}

function renderSettingsView() {
  const dark = state.theme === 'dark';
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Preferências</p><h1 id="view-title">Configurações</h1><p>Escolha a aparência da loja.</p></div></div>
      <div class="settings-row"><div><strong>Modo de exibição</strong><p data-theme-status>${dark ? 'Modo escuro ativado' : 'Modo claro ativado'}</p></div><button type="button" class="theme-switch" id="theme-toggle" role="switch" aria-checked="${dark}" aria-label="Ativar modo ${dark ? 'claro' : 'escuro'}"><span>${dark ? 'Escuro' : 'Claro'}</span><i></i></button></div>
    </section>
  `;
}

function renderSupportView() {
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Estamos por aqui</p><h1 id="view-title">Suporte</h1><p>Consulte os canais de atendimento ilustrativos desta versão.</p></div></div>
      <div class="support-options">
        <div class="support-option"><span aria-hidden="true">☏</span><div><small>Telefone / WhatsApp</small><strong>(11) 4002-8922</strong><p>Canal de exemplo · indisponível para contato</p></div></div>
        <div class="support-option"><span aria-hidden="true">@</span><div><small>E-mail</small><strong>suporte@kahlimavendas.example</strong><p>Endereço ilustrativo · indisponível para contato</p></div></div>
      </div>
    </section>
  `;
}

function renderCurrentView(firstName) {
  if (state.checkoutStep !== null) return renderCheckout();
  if (state.view === 'home') {
    return `<div class="shop-layout"><div class="home-content">${renderHomeView(firstName)}</div>${renderCart()}</div>`;
  }
  if (state.view === 'categories') {
    const content = renderCategoriesView();
    return state.selectedCategory
      ? `<div class="shop-layout"><div class="category-products">${content}</div>${renderCart()}</div>`
      : content;
  }
  if (state.view === 'orders') return renderOrdersView();
  if (state.view === 'notifications') return renderNotificationsView();
  if (state.view === 'admin-orders' && state.isStoreAdmin) return renderAdminOrdersView();
  if (state.view === 'profile') return renderProfileView();
  if (state.view === 'settings') return renderSettingsView();
  return renderSupportView();
}

function renderStore() {
  const firstName = state.profile.name.split(' ')[0];
  const visibleProducts = getVisibleProducts();
  const showProductSearch = state.checkoutStep === null && (state.view === 'home' || (state.view === 'categories' && state.selectedCategory));
  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedProduct = products.find((product) => product.id === state.productDetailId);
  const selectedProductCartQuantity = selectedProduct ? getProductCartQuantity(selectedProduct.id) : 0;
  const selectedProductAvailable = selectedProduct ? Math.max(0, getProductStock(selectedProduct) - selectedProductCartQuantity) : 0;
  const selectedProductVariantStocks = selectedProduct?.stockByColor
    ? Object.fromEntries(getProductOptions(selectedProduct).color.map((color) => [
      color,
      Math.min(getRemainingVariantStock(selectedProduct, color), selectedProductAvailable),
    ]))
    : undefined;
  const selectedProductVariantAvailable = selectedProduct && state.selectedProductVariants?.color
    ? Math.min(
      getRemainingVariantStock(selectedProduct, state.selectedProductVariants.color),
      selectedProductAvailable,
    )
    : selectedProductAvailable;
  const selectedProductQuantity = selectedProductAvailable
    ? Math.min(state.quantities[selectedProduct.id] || 1, selectedProductVariantAvailable)
    : 0;
  const contentKey = `${state.view}:${state.checkoutStep}:${state.selectedCategory || ''}`;
  const enteringContent = state.renderedContentKey !== contentKey || state.contentRefresh;
  state.renderedContentKey = contentKey;
  state.contentRefresh = false;

  document.documentElement.dataset.theme = state.theme;
  app.innerHTML = `
    <div class="store-page${state.sidebarCollapsed ? ' sidebar-collapsed' : ''}${state.sidebarOpen ? ' sidebar-open' : ''}${state.checkoutStep !== null ? ' is-checkout' : ''}">
      <button type="button" class="sidebar-backdrop" data-sidebar-close aria-label="Fechar menu"></button>
      <aside class="side-panel" aria-label="Navegação principal">
        <div class="sidebar-brand-row"><div class="sidebar-account"><p>Conta ativa</p><button type="button" class="sidebar-profile" data-view="profile" aria-label="Abrir perfil de ${escapeHtml(state.profile.name)}">${avatarMarkup(state.profile)}<span><strong>${escapeHtml(state.profile.name)}</strong><small>Meu perfil</small></span></button></div></div>
        <p class="sidebar-section-label">NAVEGAÇÃO</p>
        <nav class="sidebar-nav" aria-label="Seções">
          <button type="button" class="sidebar-link${state.view === 'home' ? ' is-active' : ''}" data-view="home"><span aria-hidden="true">⌂</span><span>Início</span></button>
          <button type="button" class="sidebar-link${state.view === 'categories' ? ' is-active' : ''}" data-view="categories"><span aria-hidden="true">▦</span><span>Categorias</span><b aria-hidden="true">${state.view === 'categories' ? '⌄' : '›'}</b></button>
          ${state.view === 'categories' ? `<div class="sidebar-category-list">${categories.map((category) => `<button type="button" class="sidebar-category${state.selectedCategory === category.id ? ' is-active' : ''}" data-category-choose="${category.id}">${escapeHtml(category.name)}</button>`).join('')}</div>` : ''}
          <button type="button" class="sidebar-link${state.view === 'orders' ? ' is-active' : ''}" data-view="orders"><span aria-hidden="true">▣</span><span>Pedidos</span><b class="sidebar-badge">${state.orders.length}</b></button>
          <button type="button" class="sidebar-link${state.view === 'notifications' ? ' is-active' : ''}" data-view="notifications"><span aria-hidden="true">♢</span><span>Notificações</span>${state.cancellationNotificationCount ? `<b class="sidebar-badge">${state.cancellationNotificationCount}</b>` : ''}</button>
          ${state.isStoreAdmin ? `<button type="button" class="sidebar-link${state.view === 'admin-orders' ? ' is-active' : ''}" data-view="admin-orders"><span aria-hidden="true">✓</span><span>Conferir pagamentos</span></button>` : ''}
          <button type="button" class="sidebar-link${state.view === 'settings' ? ' is-active' : ''}" data-view="settings"><span aria-hidden="true">⚙</span><span>Configurações</span></button>
          <button type="button" class="sidebar-link${state.view === 'support' ? ' is-active' : ''}" data-view="support"><span aria-hidden="true">?</span><span>Suporte</span></button>
          <button type="button" class="sidebar-link sidebar-logout" id="logout"><span aria-hidden="true">↪</span><span>Sair</span></button>
        </nav>
        <div class="sidebar-bottom"><span class="sidebar-demo-mark"></span><span>KahLima Vendas</span></div>
      </aside>
      <div class="store-workspace">
        <header class="store-header">
          <div class="store-header-start"><button type="button" class="menu-toggle" data-sidebar-toggle aria-label="Abrir menu lateral">Menu</button><a class="brand header-brand" href="#loja" data-view="home"><span class="brand-mark">K</span><span>KahLima Vendas</span></a></div>
          ${showProductSearch ? `<label class="search-field header-search"><span class="visually-hidden">Buscar produto por ID</span><input id="product-search" value="${escapeHtml(state.search)}" placeholder="Buscar produto por ID" autocomplete="off"><button type="button" id="clear-search" aria-label="Limpar busca" ${state.search ? '' : 'hidden'}>×</button></label>` : ''}
          <nav class="store-nav" aria-label="Sacola e sessão">
            <button type="button" class="cart-link" data-open-cart aria-label="Abrir sacola, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}">
              <svg class="cart-link-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>
              <span class="cart-link-label">Sacola</span>
              <span class="cart-link-count">${cartItemCount}</span>
            </button>
          </nav>
        </header>

        <main class="store-main${enteringContent ? ' is-entering' : ''}">
          ${renderCurrentView(firstName)}
        </main>

        <footer class="store-footer">
          <div class="store-footer-inner">
            <a class="store-footer-brand" href="#loja" data-view="home" aria-label="KahLima Vendas, voltar ao início">
              <span class="store-footer-mark" aria-hidden="true">K</span>
              <span><strong>KahLima Vendas</strong><small>Escolhas leves, feitas para você</small></span>
            </a>
            <p>© 2026 KahLima Vendas. Todos os direitos reservados.</p>
            <span class="store-footer-status"><i aria-hidden="true"></i> Escolhas leves, feitas para você</span>
          </div>
        </footer>
      </div>
      ${state.notice ? `<div class="notice" role="status">${escapeHtml(state.notice)}</div>` : ''}
      ${selectedProduct ? renderProductDetail(selectedProduct, selectedProductVariantAvailable, selectedProductQuantity, state.selectedProductVariants, selectedProductVariantStocks) : ''}
      ${state.profileOpen ? renderProfileDialog() : ''}
    </div>
  `;
  bindCartPanel(app.querySelector('#sacola'));

  app.querySelector('#open-profile')?.addEventListener('click', () => {
    state.profileOpen = true;
    state.profileDraft = { ...state.profile };
    state.profileError = '';
    renderStore();
    app.querySelector('#close-profile').focus();
  });

  app.querySelector('#logout').addEventListener('click', async () => {
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase) {
      state.notice = 'Não foi possível encerrar sua sessão. Atualize a página e tente novamente.';
      renderStore();
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Supabase sign-out request failed.', error);
      state.notice = 'Não foi possível encerrar sua sessão. Tente novamente.';
      renderStore();
      return;
    }
    if (state.profile.photoUrl.startsWith('blob:')) URL.revokeObjectURL(state.profile.photoUrl);
    window.clearInterval(state.orderStatusTimer);
    state.profile = null;
    state.userId = null;
    state.cart = [];
    state.mode = 'login';
    state.profileOpen = false;
    state.productDetailId = null;
    state.checkoutStep = null;
    state.checkoutDelivery = null;
    state.order = null;
    goTo('');
  });

  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      state.selectedCategory = null;
      state.search = '';
      state.selectedOrder = null;
      state.sidebarOpen = false;
      if (state.view === 'orders' || state.view === 'notifications') void loadCustomerOrders();
      if (state.view === 'admin-orders') void loadAdminOrders();
      renderStore();
    });
  });
  app.querySelectorAll('[data-category-choose]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = 'categories';
      state.selectedCategory = button.dataset.categoryChoose;
      state.search = '';
      state.sidebarOpen = false;
      renderStore();
    });
  });
  app.querySelector('[data-sidebar-toggle]')?.addEventListener('click', () => {
    state.sidebarOpen = true;
    renderStore();
  });
  app.querySelector('[data-sidebar-close]')?.addEventListener('click', () => {
    state.sidebarOpen = false;
    renderStore();
  });
  app.querySelector('[data-open-cart]')?.addEventListener('click', () => {
    state.view = 'home';
    state.selectedCategory = null;
    renderStore();
    app.querySelector('#sacola')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  app.querySelectorAll('[data-clear-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = null;
      state.search = '';
      renderStore();
    });
  });
  app.querySelectorAll('[data-order-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedOrder = state.selectedOrder?.number === button.dataset.orderDetail
        ? null
        : state.orders.find((order) => order.number === button.dataset.orderDetail);
      renderStore();
    });
  });
  app.querySelectorAll('[data-report-manual-pix]').forEach((button) => {
    button.addEventListener('click', () => {
      void reportManualPixPaid(button.dataset.reportManualPix);
    });
  });
  app.querySelectorAll('[data-confirm-manual-pix]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('Confirme somente após verificar o crédito no aplicativo do banco. Marcar este pedido como pago?')) return;
      button.disabled = true;
      void confirmManualPixOrder(button.dataset.confirmManualPix);
    });
  });
  app.querySelectorAll('[data-cancel-manual-pix]').forEach((button) => {
    button.addEventListener('click', () => {
      const isPaid = button.dataset.cancelPaid === 'true';
      const refundAmount = Number(button.dataset.cancelTotal);
      const refundNote = isPaid
        ? ` O valor de ${formatPrice(refundAmount)} ficará registrado como valor a devolver, mas a transferência deverá ser feita manualmente.`
        : '';
      const message = window.prompt(
        `Escreva uma mensagem para o cliente explicando o cancelamento.${refundNote}`,
        isPaid
          ? `Sua compra foi cancelada. Entraremos em contato para combinar a devolução de ${formatPrice(refundAmount)}.`
          : 'Sua compra foi cancelada pela loja.',
      );
      if (message === null) return;
      if (!message.trim() || message.trim().length > 500) {
        window.alert('A mensagem deve ter entre 1 e 500 caracteres.');
        return;
      }
      button.disabled = true;
      void cancelManualPixOrder(button.dataset.cancelManualPix, message.trim());
    });
  });
  app.querySelector('#refresh-admin-orders')?.addEventListener('click', () => {
    void loadAdminOrders();
  });
  app.querySelector('#theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    const dark = state.theme === 'dark';
    localStorage.setItem('kahLimaTheme', state.theme);
    document.documentElement.dataset.theme = state.theme;
    const toggle = app.querySelector('#theme-toggle');
    toggle.setAttribute('aria-checked', String(dark));
    toggle.setAttribute('aria-label', `Ativar modo ${dark ? 'claro' : 'escuro'}`);
    toggle.querySelector('span').textContent = dark ? 'Escuro' : 'Claro';
    app.querySelector('[data-theme-status]').textContent = `Modo ${dark ? 'escuro' : 'claro'} ativado`;
  });

  const cancelCheckout = () => {
    window.clearInterval(state.orderStatusTimer);
    state.checkoutStep = null;
    renderStore();
  };
  app.querySelector('#checkout-cancel')?.addEventListener('click', cancelCheckout);
  app.querySelector('#checkout-cancel-top')?.addEventListener('click', cancelCheckout);

  const customerForm = app.querySelector('#customer-form');
  customerForm?.querySelectorAll('[name="receiveMethod"]').forEach((input) => {
    input.addEventListener('change', () => {
      const isNearby = input.value === 'nearby';
      state.checkoutDelivery.receiveMethod = input.value;
      const nearbyFields = customerForm.querySelector('#nearby-fields');
      const stationFields = customerForm.querySelector('#station-fields');
      state.checkoutDelivery.street = '';
      state.checkoutDelivery.number = '';
      state.checkoutDelivery.deliveryNote = '';
      state.checkoutDelivery.station = '';
      nearbyFields.querySelectorAll('input, textarea').forEach((field) => {
        field.value = '';
      });
      stationFields.querySelectorAll('[name="station"]').forEach((field) => {
        field.checked = false;
      });
      nearbyFields.hidden = !isNearby;
      stationFields.hidden = isNearby;
      nearbyFields.querySelectorAll('input, textarea').forEach((field) => {
        field.disabled = !isNearby;
        field.required = isNearby && field.name !== 'deliveryNote';
      });
      stationFields.querySelectorAll('[name="station"]').forEach((field) => {
        field.disabled = isNearby;
        field.required = !isNearby;
      });
    });
  });
  customerForm?.querySelectorAll('[name="street"], [name="number"], [name="deliveryNote"], [name="station"]').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.name === 'station') return;
      state.checkoutDelivery[input.name] = input.value;
    });
    input.addEventListener('change', () => {
      if (input.name === 'station') state.checkoutDelivery.station = input.value;
    });
  });
  app.querySelector('#customer-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    state.checkoutDelivery = {
      ...state.checkoutDelivery,
      name: String(form.get('name') || '').trim(),
      whatsapp: String(form.get('whatsapp') || '').trim(),
      receiveMethod: form.get('receiveMethod'),
      street: String(form.get('street') || '').trim(),
      number: String(form.get('number') || '').trim(),
      deliveryNote: String(form.get('deliveryNote') || '').trim(),
      station: form.get('station') || state.checkoutDelivery.station,
    };
    state.checkoutStep = 1;
    renderStore();
    app.querySelector('#checkout-title').focus();
  });

  app.querySelector('#location-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.checkoutStep = 2;
    renderStore();
    app.querySelector('#checkout-title').focus();
  });

  app.querySelector('#payment-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.paymentMethod = new FormData(event.currentTarget).get('payment');
    const items = state.cart
      .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
      .filter((item) => item.product);
    state.order = {
      items,
      total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      delivery: { ...state.checkoutDelivery },
    };
    state.checkoutStep = 3;
    state.paymentPending = true;
    state.checkoutError = '';
    renderStore();
    void createPixPayment();
  });

  app.querySelector('#checkout-back')?.addEventListener('click', () => {
    state.checkoutStep = Math.max(0, state.checkoutStep - 1);
    renderStore();
    app.querySelector('#checkout-title').focus();
  });
  app.querySelector('#copy-pix-code')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.order.qrCode);
      showStoreNotice('Código Pix copiado.');
    } catch (error) {
      console.error('Could not copy PIX code to clipboard.', error);
      state.checkoutError = 'Não foi possível copiar automaticamente. Selecione e copie o código Pix.';
      renderStore();
    }
  });
  app.querySelector('#report-manual-pix-paid')?.addEventListener('click', () => {
    void reportManualPixPaid(state.order.id);
  });
  app.querySelector('#finish-checkout')?.addEventListener('click', () => {
    window.clearInterval(state.orderStatusTimer);
    state.checkoutStep = null;
    state.checkoutDelivery = null;
    state.order = null;
    state.checkoutError = '';
    renderStore();
  });

  if (state.profileOpen) {
    app.querySelector('#close-profile').addEventListener('click', closeProfileDialog);
    app.querySelector('#cancel-profile').addEventListener('click', closeProfileDialog);
    app.querySelector('#profile-overlay').addEventListener('click', (event) => {
      if (event.target.id === 'profile-overlay') closeProfileDialog();
    });
    app.querySelector('#profile-photo').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        state.profileError = 'Escolha uma imagem JPG, PNG ou WEBP.';
        renderStore();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        state.profileError = 'A imagem precisa ter no máximo 5 MB.';
        renderStore();
        return;
      }
      if (state.profileDraft.photoUrl.startsWith('blob:') && state.profileDraft.photoUrl !== state.profile.photoUrl) {
        URL.revokeObjectURL(state.profileDraft.photoUrl);
      }
      state.profileDraft.photoUrl = URL.createObjectURL(file);
      state.profileError = '';
      renderStore();
      app.querySelector('#close-profile').focus();
    });
    app.querySelector('#profile-form').addEventListener('input', (event) => {
      const field = event.target.name;
      if (field === 'cpf') event.target.value = formatCpf(event.target.value);
      if (field === 'phone') event.target.value = formatPhone(event.target.value);
      if (['name', 'email', 'cpf', 'phone'].includes(field)) {
        state.profileDraft[field] = event.target.value;
      }
    });
    app.querySelector('#profile-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const updatedProfile = {
        ...state.profileDraft,
        name: String(form.get('name') || '').trim(),
        email: String(form.get('email') || '').trim(),
        cpf: formatCpf(form.get('cpf')),
        phone: formatPhone(form.get('phone')),
      };
      if (updatedProfile.name.length < 2) {
        state.profileError = 'Digite seu nome com pelo menos 2 letras.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedProfile.email)) {
        state.profileError = 'Confira o formato do seu e-mail.';
      } else if (digitsOnly(updatedProfile.cpf).length !== 11) {
        state.profileError = 'Digite um CPF com 11 números.';
      } else if (!isValidCpf(updatedProfile.cpf)) {
        state.profileError = 'Digite um CPF válido.';
      } else if (![10, 11].includes(digitsOnly(updatedProfile.phone).length)) {
        state.profileError = 'Digite um telefone com DDD e 10 ou 11 números.';
      } else {
        if (state.profile.photoUrl.startsWith('blob:') && state.profile.photoUrl !== updatedProfile.photoUrl) {
          URL.revokeObjectURL(state.profile.photoUrl);
        }
        state.profile = updatedProfile;
        state.profileDraft = null;
        state.profileOpen = false;
        state.profileError = '';
        renderStore();
        app.querySelector('#open-profile').focus();
        return;
      }
      renderStore();
      app.querySelector('#profile-title').focus();
    });
  }

  const searchInput = app.querySelector('#product-search');
  searchInput?.addEventListener('input', (event) => {
    state.search = event.target.value;
    const cursor = event.target.selectionStart;
    renderStore();
    const newInput = app.querySelector('#product-search');
    newInput.focus();
    newInput.setSelectionRange(cursor, cursor);
  });

  app.querySelector('#clear-search')?.addEventListener('click', () => {
    state.search = '';
    renderStore();
    app.querySelector('#product-search')?.focus();
  });
  app.querySelector('#show-all')?.addEventListener('click', () => {
    state.search = '';
    renderStore();
    app.querySelector('#product-search')?.focus();
  });

  app.querySelectorAll('.product-art img').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.product-art').classList.remove('has-product-image');
      image.remove();
    }, { once: true });
  });

  app.querySelectorAll('[data-open-product]').forEach((button) => {
    button.addEventListener('click', () => {
      state.productDetailId = button.dataset.openProduct;
      state.selectedProductVariants = { color: '', type: '' };
      renderStore();
      app.querySelector('[data-close-product]')?.focus();
    });
  });

  const closeProductDetail = () => {
    const productId = state.productDetailId;
    state.productDetailId = null;
    state.selectedProductVariants = null;
    renderStore();
    app.querySelector(`[data-open-product="${productId}"]`)?.focus();
  };
  app.querySelector('[data-close-product]')?.addEventListener('click', closeProductDetail);
  app.querySelector('#product-detail-backdrop')?.addEventListener('click', (event) => {
    if (event.target.id === 'product-detail-backdrop') closeProductDetail();
  });
  app.querySelectorAll('[data-variant-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.variantKind;
      state.selectedProductVariants = {
        ...(state.selectedProductVariants || { color: '', type: '' }),
        [kind]: button.dataset.variantValue,
      };
      const group = button.closest('.product-variant-group');
      group.querySelectorAll('[data-variant-kind]').forEach((option) => {
        const isSelected = option === button;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-pressed', String(isSelected));
      });
      group.querySelector('legend span').textContent = `· ${button.dataset.variantValue}`;
      const product = products.find((item) => item.id === state.productDetailId);
      if (kind === 'color') {
        const remaining = Math.min(
          getRemainingVariantStock(product, button.dataset.variantValue),
          getProductStock(product) - getProductCartQuantity(product.id),
        );
        state.quantities[product.id] = remaining
          ? Math.min(state.quantities[product.id] || 1, remaining)
          : 0;
      }
      updateProductQuantityControls(product.id);
      const variantError = app.querySelector('[data-variant-error]');
      if (!getMissingProductVariant(product, state.selectedProductVariants)) {
        variantError.hidden = true;
      }
    });
  });
  app.querySelectorAll('[data-detail-quantity]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === state.productDetailId);
      const inCart = getProductCartQuantity(product.id);
      const current = state.quantities[product.id] || 1;
      const selectedColor = state.selectedProductVariants?.color;
      const available = selectedColor
        ? Math.min(getRemainingVariantStock(product, selectedColor), getProductStock(product) - inCart)
        : getProductStock(product) - inCart;
      state.quantities[product.id] = Math.min(available, Math.max(1, current + Number(button.dataset.detailQuantity)));
      updateProductQuantityControls(product.id);
    });
  });
  app.querySelector('[data-detail-add]')?.addEventListener('click', () => {
    const product = products.find((item) => item.id === state.productDetailId);
    const missingVariant = getMissingProductVariant(product, state.selectedProductVariants);
    if (missingVariant) {
      const error = app.querySelector('[data-variant-error]');
      error.hidden = false;
      app.querySelector(`[data-variant-kind="${missingVariant}"]`)?.focus();
      return;
    }
    addProductToCart(state.productDetailId, state.selectedProductVariants);
  });
  bindProductDetail(app);

  app.querySelectorAll('[data-quantity]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const current = state.quantities[id] || 1;
      const product = products.find((item) => item.id === id);
      const inCart = getProductCartQuantity(id);
      state.quantities[id] = Math.min(getProductStock(product) - inCart, Math.max(1, current + Number(button.dataset.quantity)));
      updateProductQuantityControls(id);
    });
  });

}

function render() {
  if (state.authInitializing) {
    app.innerHTML = '<main class="auth-page"><p class="auth-loading" role="status">Carregando sua conta...</p></main>';
    return;
  }
  if (window.location.hash === storePath) {
    if (!state.profile) {
      goTo('');
      return;
    }
    renderStore();
    return;
  }
  renderLogin();
}

async function initializeAuthentication() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) {
    state.authInitializing = false;
    render();
    return;
  }

  const recoveryHash = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
  const recoveryQuery = new URLSearchParams(window.location.search).get('type') === 'recovery';
  if (recoveryHash || recoveryQuery) state.authScreen = 'reset';

  supabase.auth.onAuthStateChange((event) => {
    if (event !== 'PASSWORD_RECOVERY') return;
    state.authScreen = 'reset';
    state.mode = 'login';
    state.authPending = false;
    state.authInitializing = false;
    state.error = '';
    state.successMessage = '';
    renderLogin();
    app.querySelector('[name="password"]')?.focus();
  });

  render();
  try {
    const { data, error } = await supabase.auth.getSession();
    state.authInitializing = false;
    if (error) {
      state.error = 'Não foi possível verificar sua sessão. Atualize a página para tentar novamente.';
      render();
      return;
    }
    if (data.session?.user) {
      if (state.authScreen === 'reset') {
        state.authInitializing = false;
        renderLogin();
        return;
      }
      setAuthenticatedUser(data.session.user);
      return;
    }
    render();
  } catch (error) {
    console.error('Supabase session initialization failed.', error);
    state.authInitializing = false;
    state.error = 'Não foi possível conectar ao serviço de contas. Tente novamente.';
    render();
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.profileOpen) {
    closeProfileDialog();
  } else if (event.key === 'Escape' && app.querySelector('[data-image-lightbox][open]')) {
    app.querySelector('[data-image-lightbox][open]').close();
    return;
  } else if (event.key === 'Escape' && state.productDetailId) {
    app.querySelector('[data-close-product]')?.click();
  }
});
initializeAuthentication();