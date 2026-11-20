const app = document.querySelector('#app');
const products = window.KahLimaProducts;
const categories = window.KahLimaCategories;
const { findProducts } = window.KahLimaProductSearch;
const { renderProductDetail, bindProductDetail } = window.KahLimaProductDetail;
const { renderProductReviews } = window.KahLimaProductReviews;
const { escapeHtml, formatPrice, digitsOnly, formatCpf, isValidCpf, formatPhone, initials, avatarMarkup } = window.KahLimaUtils;
const storePath = '#loja';
const cartPath = '#sacola';
const authPath = '#entrar';
const pickupStations = [
  { value: 'itaim-paulista', label: 'Itaim Paulista' },
  { value: 'jardim-helena-vila-mara', label: 'Jardim Helena–Vila Mara' },
  { value: 'sao-miguel-paulista', label: 'São Miguel Paulista' },
  { value: 'comendador-ermelino', label: 'Comendador Ermelino' },
  { value: 'usp-leste', label: 'USP Leste' },
  { value: 'engenheiro-goulart', label: 'Engenheiro Goulart' },
  { value: 'tatuape', label: 'Tatuapé' },
];

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

function loadSavedCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem('kahLimaCart') || '[]');
    if (!Array.isArray(savedCart)) return [];
    return savedCart.filter((item) =>
      products.some((product) => product.id === item.id)
      && Number.isInteger(Number(item.quantity))
      && Number(item.quantity) > 0
      && Number(item.quantity) <= 99,
    ).map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      const options = getProductOptions(product);
      return {
        id: item.id,
        color: typeof item.color === 'string' && options.color.includes(item.color) ? item.color : '',
        type: typeof item.type === 'string' && options.type.includes(item.type) ? item.type : '',
        quantity: Number(item.quantity),
      };
    });
  } catch (error) {
    console.error('Could not restore the saved shopping cart.', error);
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem('kahLimaCart', JSON.stringify(state.cart));
  } catch (error) {
    console.error('Could not save the shopping cart in this browser.', error);
    state.notice = 'Não foi possível salvar sua sacola neste navegador. Evite fechar a página antes de finalizar.';
  }
}

const state = {
  profile: null,
  userId: null,
  profileDraft: null,
  cart: loadSavedCart(),
  mode: 'login',
  authScreen: 'login',
  authName: '',
  authCpf: '',
  authEmail: '',
  authPhone: '',
  authPending: false,
  authInitializing: false,
  storeOpening: false,
  storeOpeningTimer: null,
  authReturnToCheckout: false,
  authReturnHash: '',
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
  adminStockProducts: [],
  adminDashboard: null,
  adminDashboardLoading: false,
  adminDashboardError: '',
  adminReviewList: [],
  adminReviewsLoading: false,
  adminReviewsError: '',
  adminSupportSearch: '',
  adminSettingsError: '',
  adminSettingsNotice: '',
  storeSettings: {
    store_name: 'KahLima Vendas',
    support_whatsapp: '(11) 95983-9395',
    support_email: 'kah0368270@gmail.com',
    support_message: 'Estamos por aqui para ajudar com dúvidas sobre seus pedidos.',
  },
  productReviews: [],
  productReviewOrders: [],
  productReviewsLoading: false,
  productReviewsError: '',
  productReviewNotice: '',
  productReviewsForId: null,
  adminStockLoading: false,
  adminStockError: '',
  customerNotifications: [],
  systemNotifications: [],
  systemNotificationsLoadedFor: '',
  systemNotificationsLoading: false,
  systemNotificationError: '',
  notificationPanelOpen: false,
  adminNotificationRecipients: [],
  adminNotificationRecipientsLoading: false,
  adminNotificationRecipientsError: '',
  adminCustomerPresence: [],
  adminCustomerPresenceLoading: false,
  adminCustomerPresenceError: '',
  adminCustomerPhotoError: '',
  adminCustomerPhotoUrlCache: new Map(),
  adminCustomerDetailsUserId: null,
  adminCustomerDetails: null,
  adminCustomerDetailsLoading: false,
  adminCustomerDetailsError: '',
  adminCustomerDetailsRequestId: 0,
  profileSaving: false,
  storePresenceTouchPending: false,
  adminNotificationPublishError: '',
  adminNotificationPublishNotice: '',
  editingOrderId: null,
  isStoreAdmin: false,
  adminOrdersLoading: false,
  adminOrderError: '',
  notificationCount: 0,
  selectedOrder: null,
  theme: localStorage.getItem('kahLimaTheme') || 'light',
  profileOpen: false,
  profileError: '',
  productDetailId: null,
  productGalleryIndex: 0,
  selectedProductVariants: null,
  variantPickerAction: '',
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
  window.KahLimaAuthView.render({ state, app, goTo, storePath, setAuthenticatedUser });
}

function setAuthenticatedUser(user, { preserveAuthRoute = false, showStoreOpening = false } = {}) {
  const metadata = user.user_metadata || {};
  const isSameUser = state.userId === user.id;
  state.profile = {
    name: metadata.full_name || user.email?.split('@')[0] || 'Cliente',
    email: user.email || '',
    cpf: formatCpf(metadata.cpf || ''),
    phone: metadata.phone || '',
    photoUrl: '',
    avatarPath: '',
  };
  state.userId = user.id;
  if (!isSameUser) {
    state.adminDashboard = null;
    state.adminReviewList = [];
    state.systemNotifications = [];
    state.systemNotificationsLoadedFor = '';
    state.notificationPanelOpen = false;
    state.adminNotificationRecipients = [];
    state.adminCustomerPresence = [];
    state.adminCustomerDetailsUserId = null;
    state.adminCustomerDetails = null;
    state.adminCustomerDetailsLoading = false;
    state.adminCustomerDetailsError = '';
    state.adminCustomerDetailsRequestId += 1;
    state.adminCustomerPhotoUrlCache = new Map();
    state.adminNotificationPublishError = '';
    state.adminNotificationPublishNotice = '';
  }
  state.orders = [];
  state.customerNotifications = [];
  state.notificationCount = 0;
  state.adminOrders = [];
  state.adminStockProducts = [];
  state.isStoreAdmin = false;
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
  persistCart();
  void loadProfilePhoto(user.id);
  void touchStorePresence();
  void loadCustomerOrders();
  void loadStoreInventory();
  void loadStoreSettings();
  void loadStoreAdminAccess(user.id);
  if (state.authReturnToCheckout) {
    state.authReturnToCheckout = false;
    goTo(storePath);
    startCheckout();
    return;
  }
  if (state.authReturnHash.startsWith('#produto/')) {
    const returnHash = state.authReturnHash;
    state.authReturnHash = '';
    goTo(returnHash);
    return;
  }
  if (preserveAuthRoute && window.location.hash === authPath) {
    renderLogin();
    return;
  }
  if ([storePath, cartPath].includes(window.location.hash) || window.location.hash.startsWith('#produto/')) {
    render();
    return;
  }
  if (showStoreOpening) {
    window.clearTimeout(state.storeOpeningTimer);
    state.storeOpening = true;
    const openingDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 2300;
    state.storeOpeningTimer = window.setTimeout(() => {
      state.storeOpening = false;
      state.storeOpeningTimer = null;
      renderStore();
    }, openingDuration);
  }
  goTo(storePath);
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
  if (!state.isStoreAdmin && ['admin-orders', 'admin-stock', 'admin-dashboard', 'admin-support', 'admin-reviews', 'admin-settings'].includes(state.view)) state.view = 'home';
  if (state.isStoreAdmin) {
    void loadAdminNotificationRecipients();
    if (state.view === 'admin-support') void loadAdminCustomerPresence();
  }
  renderStore();
}

function getStoreNotificationUnreadCount() {
  return state.systemNotifications.filter((notification) => !notification.is_read).length;
}

async function loadStoreNotifications(force = false) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) return;
  const userId = state.userId || '';
  if (state.systemNotificationsLoading
    || (!force && state.systemNotificationsLoadedFor === userId)) return;
  state.systemNotificationsLoading = true;
  const { data, error } = await supabase.rpc('get_store_notifications');
  state.systemNotificationsLoading = false;
  if ((state.userId || '') !== userId) {
    void loadStoreNotifications();
    return;
  }
  if (error) {
    console.error('Could not load store notifications.', error);
    state.systemNotificationError = 'Não foi possível carregar os avisos da loja.';
    state.systemNotificationsLoadedFor = userId;
  } else {
    state.systemNotifications = data || [];
    state.systemNotificationError = '';
    state.systemNotificationsLoadedFor = userId;
  }
  const orderUnreadCount = state.customerNotifications.length
    + state.orders.filter((order) => order.status === 'Compra cancelada').length;
  state.notificationCount = orderUnreadCount + getStoreNotificationUnreadCount();
  renderStore();
}

async function markStoreNotificationRead(notificationId) {
  const supabase = window.KahLimaSupabase?.client;
  const notification = state.systemNotifications.find((item) => String(item.id) === String(notificationId));
  if (!notification) return false;
  if (notification.is_read) return true;
  if (state.userId && supabase) {
    const { error } = await supabase.rpc('mark_store_notification_read', {
      p_notification_id: notificationId,
    });
    if (error) {
      console.error('Could not mark store notification as read.', error);
      state.systemNotificationError = 'Não foi possível atualizar o aviso. Tente novamente.';
      renderStore();
      return false;
    }
  }
  notification.is_read = true;
  state.notificationCount = state.customerNotifications.length
    + state.orders.filter((order) => order.status === 'Compra cancelada').length
    + getStoreNotificationUnreadCount();
  return true;
}

async function loadAdminNotificationRecipients() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin || state.adminNotificationRecipientsLoading) return;
  const userId = state.userId;
  state.adminNotificationRecipientsLoading = true;
  state.adminNotificationRecipientsError = '';
  const { data, error } = await supabase.rpc('get_store_notification_recipients');
  state.adminNotificationRecipientsLoading = false;
  if (state.userId !== userId || !state.isStoreAdmin) {
    if (state.isStoreAdmin) void loadAdminNotificationRecipients();
    return;
  }
  if (error) {
    console.error('Could not load store notification recipients.', error);
    state.adminNotificationRecipientsError = 'Não foi possível carregar a lista de clientes.';
  } else {
    state.adminNotificationRecipients = data || [];
  }
  if (state.view === 'admin-support') renderStore();
}

async function loadAdminCustomerPresence() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin || state.adminCustomerPresenceLoading) return;
  const userId = state.userId;
  state.adminCustomerPresenceLoading = true;
  state.adminCustomerPresenceError = '';
  state.adminCustomerPhotoError = '';
  try {
    const { data, error } = await supabase.rpc('get_store_customer_presence');
    if (error) throw error;
    if (state.userId !== userId || !state.isStoreAdmin) return;
    const customers = data || [];
    const photoPaths = [...new Set(customers.map((customer) => customer.avatar_path).filter(Boolean))];
    const now = Date.now();
    const cachedPhotoUrls = state.adminCustomerPhotoUrlCache;
    const photoPathsToSign = photoPaths.filter((path) => {
      const cachedPhoto = cachedPhotoUrls.get(path);
      return !cachedPhoto || cachedPhoto.expiresAt < now + 5 * 60 * 1000;
    });
    if (photoPathsToSign.length) {
      const { data: signedPhotos, error: signedPhotosError } = await supabase.storage
        .from('profile-photos')
        .createSignedUrls(photoPathsToSign, 3600);
      if (signedPhotosError) throw signedPhotosError;
      (signedPhotos || []).forEach((photo) => {
        if (photo.signedUrl) {
          cachedPhotoUrls.set(photo.path, { signedUrl: photo.signedUrl, expiresAt: now + 55 * 60 * 1000 });
        } else {
          console.error('Could not sign an individual customer profile photo.', photo.error || photo.path);
          state.adminCustomerPhotoError = 'Algumas fotos de perfil não puderam ser carregadas.';
        }
      });
    }
    const activePhotoPaths = new Set(photoPaths);
    cachedPhotoUrls.forEach((value, path) => {
      if (!activePhotoPaths.has(path)) cachedPhotoUrls.delete(path);
    });
    state.adminCustomerPresence = customers.map((customer) => ({
      ...customer,
      photoUrl: cachedPhotoUrls.get(customer.avatar_path)?.signedUrl || '',
    }));
  } catch (error) {
    console.error('Could not load customer presence for the store admin.', error);
    if (state.userId === userId && state.isStoreAdmin) {
      state.adminCustomerPresenceError = 'Não foi possível carregar os perfis e o status de atividade.';
    }
  } finally {
    state.adminCustomerPresenceLoading = false;
  }
  if (state.userId === userId && state.isStoreAdmin && state.view === 'admin-support') renderStore();
}

async function loadAdminCustomerDetails(customerId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin || !customerId) return;
  const adminUserId = state.userId;
  const requestId = state.adminCustomerDetailsRequestId + 1;
  state.adminCustomerDetailsRequestId = requestId;
  state.adminCustomerDetailsUserId = customerId;
  state.adminCustomerDetails = null;
  state.adminCustomerDetailsLoading = true;
  state.adminCustomerDetailsError = '';
  renderStore();
  app.querySelector('#admin-customer-details-title')?.focus();
  const isCurrentRequest = () => (
    state.adminCustomerDetailsRequestId === requestId
    && state.adminCustomerDetailsUserId === customerId
    && state.userId === adminUserId
    && state.isStoreAdmin
    && state.view === 'admin-support'
  );
  try {
    const { data, error } = await supabase.rpc('get_store_customer_account_details', {
      p_user_id: customerId,
    });
    if (error) throw error;
    const customer = Array.isArray(data) ? data[0] : data;
    if (!isCurrentRequest()) return;
    if (!customer) {
      state.adminCustomerDetailsError = 'Não foi possível encontrar os dados desta conta.';
      return;
    }
    state.adminCustomerDetails = customer;
  } catch (error) {
    console.error('Could not load customer account details for the store admin.', error);
    if (isCurrentRequest()) {
      state.adminCustomerDetailsError = 'Não foi possível carregar os dados desta conta.';
    }
  } finally {
    if (isCurrentRequest()) {
      state.adminCustomerDetailsLoading = false;
      renderStore();
      app.querySelector('#admin-customer-details-title')?.focus();
    }
  }
}

function closeAdminCustomerDetails() {
  if (!state.adminCustomerDetailsUserId) return;
  const customerId = state.adminCustomerDetailsUserId;
  state.adminCustomerDetailsRequestId += 1;
  state.adminCustomerDetailsUserId = null;
  state.adminCustomerDetails = null;
  state.adminCustomerDetailsLoading = false;
  state.adminCustomerDetailsError = '';
  renderStore();
  [...app.querySelectorAll('[data-customer-details]')]
    .find((button) => button.dataset.customerDetails === customerId)
    ?.focus();
}

async function loadProfilePhoto(userId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !userId) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    if (state.userId !== userId) return;
    if (error.code === '42703' || /avatar_path.*(column|schema cache)|column.*avatar_path/i.test(error.message || '')) {
      console.warn('Profile photos are unavailable until the private profile photo migration is applied.');
      return;
    }
    console.error('Could not load the signed-in customer profile photo; showing initials instead.', error);
    return;
  }
  if (state.userId !== userId || !data?.avatar_path) return;
  const { data: signedPhoto, error: signedPhotoError } = await supabase.storage
    .from('profile-photos')
    .createSignedUrl(data.avatar_path, 86400);
  if (signedPhotoError) {
    console.error('Could not create a private profile photo URL.', signedPhotoError);
    if (state.userId !== userId) return;
    return;
  }
  if (state.userId !== userId) return;
  state.profile.avatarPath = data.avatar_path;
  state.profile.photoUrl = signedPhoto.signedUrl;
  renderStore();
}

async function uploadProfilePhoto(file, userId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) throw new Error('Supabase profile photo storage is unavailable.');
  const photoId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const photoPath = `${userId}/${photoId}`;
  const previousPhotoPath = state.profile?.avatarPath;
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(photoPath, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
  if (uploadError) throw uploadError;
  const { data: signedPhoto, error: signedPhotoError } = await supabase.storage
    .from('profile-photos')
    .createSignedUrl(photoPath, 86400);
  if (signedPhotoError) {
    const { error: cleanupError } = await supabase.storage.from('profile-photos').remove([photoPath]);
    if (cleanupError) console.error('Could not remove a profile photo without a signed URL.', cleanupError);
    throw signedPhotoError;
  }
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_path: photoPath })
    .eq('id', userId);
  if (profileError) {
    const { error: cleanupError } = await supabase.storage.from('profile-photos').remove([photoPath]);
    if (cleanupError) console.error('Could not remove an unsaved profile photo.', cleanupError);
    throw profileError;
  }
  if (previousPhotoPath) {
    const { error: previousPhotoError } = await supabase.storage
      .from('profile-photos')
      .remove([previousPhotoPath]);
    if (previousPhotoError) console.error('Could not remove the previous customer profile photo.', previousPhotoError);
  }
  return { avatarPath: photoPath, photoUrl: signedPhoto.signedUrl };
}

async function touchStorePresence() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.userId || state.storePresenceTouchPending
    || document.visibilityState !== 'visible' || window.location.hash === authPath) return;
  const userId = state.userId;
  state.storePresenceTouchPending = true;
  try {
    const { error } = await supabase.rpc('touch_store_presence');
    if (error) throw error;
  } catch (error) {
    if (state.userId === userId) {
      console.error('Could not update customer online presence.', error);
    }
  } finally {
    state.storePresenceTouchPending = false;
  }
}

async function loadCustomerOrders() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.userId) return;
  const userId = state.userId;
  const previousNotificationCount = state.notificationCount;
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
  const { data: notifications, error: notificationsError } = await supabase
    .from('order_notifications')
    .select('id,order_id,message,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (state.userId !== userId) return;
  if (notificationsError) {
    console.error('Could not load customer notifications.', notificationsError);
    state.notice = 'Não foi possível carregar as notificações. Atualize a página para tentar novamente.';
  } else {
    const orderNumbers = new Map(state.orders.map((order) => [order.id, order.number]));
    state.customerNotifications = (notifications || []).map((notification) => ({
      ...notification,
      orderNumber: orderNumbers.get(notification.order_id) || notification.order_id.slice(0, 8).toUpperCase(),
    }));
  }
  state.notificationCount = state.customerNotifications.length
    + state.orders.filter((order) => order.status === 'Compra cancelada').length
    + getStoreNotificationUnreadCount();
  if (state.view === 'orders' || state.view === 'notifications'
    || state.productDetailId
    || state.notificationCount !== previousNotificationCount) {
    state.contentRefresh = true;
    renderStore();
  }
}

function applyInventoryRows(rows) {
  const inventoryById = new Map(rows.map((row) => [row.id, row]));
  products.forEach((product) => {
    const inventory = inventoryById.get(product.id);
    if (!inventory) return;
    if (Number.isFinite(Number(inventory.price)) && Number(inventory.price) > 0) {
      product.price = Number(inventory.price);
    }
    product.stock = Number(inventory.stock);
    product.stockByColor = inventory.stock_by_color && Object.keys(inventory.stock_by_color).length
      ? { ...inventory.stock_by_color }
      : undefined;
  });
}

async function loadStoreInventory() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) return;
  const { data, error } = await supabase
    .from('products')
    .select('id,price,stock,stock_by_color')
    .eq('active', true);
  if (error) {
    console.error('Could not load live product inventory.', error);
    state.notice = 'Não foi possível atualizar o estoque. O checkout ainda validará a disponibilidade no servidor.';
    renderStore();
    return;
  }
  applyInventoryRows(data || []);
  renderStore();
}

async function loadStoreSettings() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase) return;
  const { data, error } = await supabase
    .from('store_settings')
    .select('store_name,support_whatsapp,support_email,support_message')
    .eq('id', true)
    .maybeSingle();
  if (error) {
    console.error('Could not load public store settings.', error);
    state.notice = 'Não foi possível carregar as informações de suporte. Tente atualizar a página.';
    render();
    return;
  }
  if (data) {
    state.storeSettings = { ...state.storeSettings, ...data };
    if (state.notice === 'Não foi possível carregar as informações de suporte. Tente atualizar a página.') {
      state.notice = '';
    }
  }
  if (state.profile) renderStore();
  else if (['#loja', cartPath].includes(window.location.hash) || window.location.hash.startsWith('#produto/')) renderStore();
}

async function loadAdminDashboard() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  state.adminDashboardLoading = true;
  state.adminDashboardError = '';
  renderStore();
  try {
    state.adminDashboard = await window.KahLimaAdminDashboard.loadSalesOverview(supabase);
  } catch (error) {
    console.error('Could not load the store sales overview.', error);
    state.adminDashboardError = 'Não foi possível carregar o resumo de vendas. Confira se a migration administrativa foi aplicada e tente novamente.';
  }
  state.adminDashboardLoading = false;
  renderStore();
}

async function loadAdminReviews() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  state.adminReviewsLoading = true;
  state.adminReviewsError = '';
  renderStore();
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id,product_id,rating,comment,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(200);
  state.adminReviewsLoading = false;
  if (error) {
    console.error('Could not load pending product reviews.', error);
    state.adminReviewsError = 'Não foi possível carregar as avaliações pendentes. Confira se a migration foi aplicada.';
    renderStore();
    return;
  }
  state.adminReviewList = data || [];
  renderStore();
}

async function loadProductReviews(productId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !productId) return;
  state.productReviewsForId = productId;
  state.productReviewsLoading = true;
  state.productReviewsError = '';
  state.productReviewNotice = '';
  state.productReviews = [];
  state.productReviewOrders = [];
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id,rating,comment,created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);
  if (state.productReviewsForId !== productId) return;
  if (error) {
    console.error('Could not load approved product reviews.', error);
    state.productReviewsError = 'Não foi possível carregar as avaliações. Atualize a página para tentar novamente.';
  } else {
    state.productReviews = data || [];
  }

  if (state.userId) {
    const { data: ownReviews, error: ownReviewsError } = await supabase
      .rpc('get_my_product_review_orders', { p_product_id: productId });
    if (state.productReviewsForId !== productId) return;
    if (ownReviewsError) {
      console.error('Could not load the customer product review status.', ownReviewsError);
      state.productReviewsError = 'Não foi possível verificar se você já avaliou este produto.';
    } else {
      state.productReviewOrders = ownReviews || [];
    }
  }
  state.productReviewsLoading = false;
  renderStore();
}

async function loadAdminOrders() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  state.adminOrdersLoading = true;
  state.adminOrderError = '';
  renderStore();
  const { data, error } = await supabase
    .from('orders')
    .select('id,status,total,item_count,created_at,customer_name,customer_phone,delivery,items_snapshot,customer_reported_paid_at,payment_provider,cancellation_message,cancelled_at,refund_amount,inventory_shortfall,order_notifications(id,message,created_at)')
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

async function loadAdminStock() {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  state.adminStockLoading = true;
  state.adminStockError = '';
  renderStore();
  const { data, error } = await supabase
    .from('products')
    .select('id,stock,stock_by_color,active')
    .eq('active', true)
    .order('id');
  state.adminStockLoading = false;
  if (error) {
    console.error('Could not load product inventory for store admin.', error);
    state.adminStockError = 'Não foi possível carregar o estoque. Atualize e tente novamente.';
    renderStore();
    return;
  }
  state.adminStockProducts = data || [];
  applyInventoryRows(state.adminStockProducts);
  state.contentRefresh = true;
  renderStore();
}

async function saveProductStock(productId, stock, stockByColor) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('update_product_stock', {
    p_product_id: productId,
    p_stock: stock,
    p_stock_by_color: stockByColor,
  });
  if (error) {
    console.error('Could not update product inventory.', error);
    state.adminStockError = 'Não foi possível salvar o estoque. Confira os valores e tente novamente.';
    renderStore();
    return;
  }
  await loadAdminStock();
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
  await loadStoreInventory();
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

async function deleteStoreOrder(orderId) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('delete_store_order', { p_order_id: orderId });
  if (error) {
    console.error('Could not delete store order.', error);
    state.adminOrderError = 'Não foi possível excluir o pedido. Atualize e tente novamente.';
    renderStore();
    return;
  }
  state.adminOrderError = '';
  await loadAdminOrders();
}

async function clearAdminRecords(recordType) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const isOrders = recordType === 'orders';
  const rpcName = isOrders ? 'clear_admin_store_orders' : 'clear_admin_store_notifications';
  const successMessage = isOrders
    ? 'Os pedidos foram removidos e o resumo de vendas foi atualizado.'
    : 'As notificações da loja e mensagens de pedidos foram apagadas.';

  try {
    const { data, error } = await supabase.rpc(rpcName);
    if (error) throw error;

    state.notice = `${successMessage} (${Number(data) || 0} registros removidos).`;
    if (isOrders) {
      state.adminOrders = [];
      state.orders = [];
      state.customerNotifications = [];
      await Promise.all([
        loadAdminOrders(),
        loadCustomerOrders(),
        loadAdminDashboard(),
        loadAdminNotificationRecipients(),
      ]);
    } else {
      state.customerNotifications = [];
      state.systemNotifications = [];
      state.systemNotificationsLoadedFor = '';
      await Promise.all([
        loadStoreNotifications(true),
        loadCustomerOrders(),
      ]);
    }
    renderStore();
  } catch (error) {
    console.error(`Could not clear store ${recordType}.`, error);
    state.notice = isOrders
      ? 'Não foi possível apagar os pedidos. Confira se a migration foi aplicada e tente novamente.'
      : 'Não foi possível apagar as notificações. Confira se a migration foi aplicada e tente novamente.';
    renderStore();
  }
}

async function sendCustomerOrderNotification(orderId, message) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('send_order_notification', {
    p_order_id: orderId,
    p_message: message,
  });
  if (error) {
    console.error('Could not send customer order notification.', error);
    state.adminOrderError = 'Não foi possível enviar a mensagem. Atualize e tente novamente.';
    renderStore();
    return;
  }
  state.adminOrderError = '';
  state.notice = 'Mensagem enviada para as notificações do cliente.';
  await loadAdminOrders();
}

async function updateManualPixOrderDetails(orderId, customerName, customerPhone, delivery) {
  const supabase = window.KahLimaSupabase?.client;
  if (!supabase || !state.isStoreAdmin) return;
  const { error } = await supabase.rpc('update_manual_pix_order_details', {
    p_order_id: orderId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_delivery: delivery,
  });
  if (error) {
    console.error('Could not update manual Pix order details.', error);
    state.adminOrderError = 'Não foi possível atualizar os dados do pedido. Confira os campos e tente novamente.';
    renderStore();
    return;
  }
  state.editingOrderId = null;
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
    const requestBody = {
      items: state.cart.map(({ id, quantity, color, type }) => ({ id, quantity, color, type })),
      delivery: state.checkoutDelivery,
    };
    let { data, error } = await supabase.functions.invoke('create-pix-payment', { body: requestBody });
    if (error?.context?.status === 401) {
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Could not refresh the customer session after PIX authorization failed.', refreshError);
      }
      if (refreshedSession.session?.access_token) {
        ({ data, error } = await supabase.functions.invoke('create-pix-payment', { body: requestBody }));
      } else {
        state.error = 'Sua sessão expirou. Entre novamente para continuar; sua sacola será mantida nesta página.';
        state.checkoutError = '';
        state.authScreen = 'login';
        state.mode = 'login';
        state.authReturnToCheckout = true;
        goTo(authPath);
        return;
      }
    }
    if (error || data?.error || !data?.orderId || !data?.qrCode) {
      if (error) console.error('PIX request failed.', error);
      if (error?.context?.status === 401) {
        state.error = 'Não foi possível validar sua sessão. Entre novamente para continuar; sua sacola será mantida nesta página.';
        state.checkoutError = '';
        state.authScreen = 'login';
        state.mode = 'login';
        state.authReturnToCheckout = true;
        goTo(authPath);
        return;
      }
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
        persistCart();
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
  return findProducts(products, state.search)
    .filter((product) => !state.selectedCategory || product.categoryId === state.selectedCategory);
}

function getRelatedProducts(product) {
  const sameCategory = products.filter((item) => item.id !== product.id && item.categoryId === product.categoryId);
  const otherCategories = products.filter((item) => item.id !== product.id && item.categoryId !== product.categoryId);
  return [...sameCategory, ...otherCategories].slice(0, 4);
}

function renderProduct(product) {
  const inCart = getProductCartQuantity(product.id);
  const available = Math.max(0, getProductStock(product) - inCart);
  const cardImage = product.images?.[0];
  return `
    <article class="product-card">
      <button type="button" class="product-art art-${escapeHtml(product.color)}${cardImage ? ' has-product-image' : ''}" data-open-product="${escapeHtml(product.id)}" aria-label="Ver detalhes e imagens de ${escapeHtml(product.name)}">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <span class="product-id">${escapeHtml(product.id)}</span>
        ${cardImage ? `<img src="${escapeHtml(cardImage)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" draggable="false">` : ''}
        <div class="product-object object-${escapeHtml(product.shape)}"><span></span></div>
      </button>
      <div class="product-info">
        <div class="product-title-row">
          <div>
            <h3><a class="product-title-link" href="#produto/${encodeURIComponent(product.id)}" data-open-product="${escapeHtml(product.id)}">${escapeHtml(product.name)}</a></h3>
            <p>${escapeHtml(product.description)}</p>
            <a class="product-detail-link" href="#produto/${encodeURIComponent(product.id)}" data-open-product="${escapeHtml(product.id)}">Ver detalhes <span aria-hidden="true">→</span></a>
          </div>
          <strong>${formatPrice(product.price)}</strong>
        </div>
        <p class="product-stock${available ? '' : ' out-of-stock'}">${available ? `${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}` : 'Sem estoque'}</p>
        <div class="product-actions">
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
    detail.querySelector('[data-detail-buy]').disabled = detailAvailable === 0;
    app.querySelectorAll('.product-variant-group[data-variant-group="color"] [data-variant-kind="color"]').forEach((option) => {
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

function addProductToCart(productId, variants, { notify = true } = {}) {
  const product = products.find((item) => item.id === productId);
  if (!product) return false;
  const inCart = getProductCartQuantity(productId);
  const variant = { color: variants.color, type: variants.type };
  const variantAvailable = getRemainingVariantStock(product, variant.color);
  const totalAvailable = Math.max(0, getProductStock(product) - inCart);
  const amount = Math.min(state.quantities[productId] || 1, variantAvailable, totalAvailable);
  if (amount <= 0) return false;
  const key = cartItemKey({ id: productId, ...variant });
  const existing = state.cart.find((item) => cartItemKey(item) === key);
  state.cart = existing
    ? state.cart.map((item) => cartItemKey(item) === key ? { ...item, quantity: item.quantity + amount } : item)
    : [...state.cart, { id: productId, ...variant, quantity: amount }];
  persistCart();

  const hasCartLine = [...app.querySelectorAll('.cart-item')].some((item) => item.dataset.cartKey === key);
  if (!hasCartLine) replaceCartPanel();
  updateProductQuantityControls(productId);
  updateCartSummary();
  if (notify) showStoreNotice(`${amount} ${amount === 1 ? 'unidade adicionada' : 'unidades adicionadas'} à sacola.`);
  return true;
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
            <div class="mini-art art-${escapeHtml(product.color)}">${product.images?.[0]
              ? `<img src="${escapeHtml(product.images[0])}" alt="" loading="lazy" decoding="async">`
              : `<span class="mini-shape object-${escapeHtml(product.shape)}"></span>`}</div>
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
  current.classList.forEach((className) => updated.classList.add(className));
  current.replaceWith(updated);
  bindCartPanel(updated);
}

function startCheckout() {
  if (!state.profile) {
    state.authReturnToCheckout = true;
    state.mode = 'signup';
    state.authScreen = 'signup';
    state.error = 'Para finalizar a compra, entre na sua conta ou crie uma conta. Sua sacola será mantida.';
    state.successMessage = '';
    goTo(authPath);
    return;
  }
  if (!state.cart.length) {
    showStoreNotice('Adicione ao menos um produto à sacola para continuar.');
    return;
  }
  state.productDetailId = null;
  if (window.location.hash.startsWith('#produto/')) goTo(storePath);
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
      persistCart();
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
      persistCart();
      replaceCartPanel();
      updateProductQuantityControls(id);
      updateCartSummary();
    });
  });
}

function renderCheckout() {
  return window.KahLimaCheckoutView.render({ state, products, pickupStations, getItemVariantLabel });
}

function renderProfileDialog() {
  const profile = state.profileDraft || state.profile;
  return `
    <div class="profile-overlay" id="profile-overlay">
      <section class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div class="profile-dialog-heading">
          <div><p class="eyebrow eyebrow-muted">Seus dados</p><h2 id="profile-title" tabindex="-1">Meu perfil</h2></div>
          <button type="button" class="profile-close" id="close-profile" aria-label="Fechar perfil" ${state.profileSaving ? 'disabled' : ''}>×</button>
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
          <p class="profile-privacy">A foto fica armazenada com acesso restrito à sua conta e à equipe da loja. Quando estiver conectado, sua atividade recente também fica visível à equipe para facilitar o atendimento. As alterações dos demais dados ainda não são persistidas.</p>
          <div class="profile-buttons">
            <button type="button" class="button button-cancel" id="cancel-profile" ${state.profileSaving ? 'disabled' : ''}>Cancelar</button>
            <button type="submit" class="button button-primary" ${state.profileSaving ? 'disabled' : ''}>${state.profileSaving ? 'Salvando...' : 'Salvar perfil'}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function closeProfileDialog() {
  if (state.profileSaving) return;
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
      <p class="search-hint" id="search-hint">Busque pelo nome do produto ou pelo ID, com ou sem hífen (ex.: Power Bank ou AU-101).</p>
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

function renderHomeOffers() {
  const affordableProducts = products
    .filter((product) => getProductStock(product) > 0)
    .sort((first, second) => first.price - second.price)
    .slice(0, 5);
  if (!affordableProducts.length) return '';

  const renderOffer = (product) => `
    <button type="button" class="home-offer-item" data-open-product="${escapeHtml(product.id)}">
      <span class="home-offer-star" aria-hidden="true">✦</span>
      <span class="home-offer-name">${escapeHtml(product.name)}</span>
      <span class="home-offer-price"><small>POR APENAS</small><strong>${formatPrice(product.price)}</strong></span>
      <span class="home-offer-arrow" aria-hidden="true">↗</span>
    </button>
  `;
  const offerItems = affordableProducts.map(renderOffer).join('');
  return `
    <section class="home-offers" aria-label="Ofertas especiais">
      <div class="home-offers-heading">
        <span class="home-offers-spark" aria-hidden="true">✦</span>
        <span><strong>OFERTAS DA VEZ</strong><small>Preços especiais para aproveitar</small></span>
      </div>
      <div class="home-offers-marquee">
        <div class="home-offers-track">
          <div class="home-offers-group">${offerItems}</div>
          <div class="home-offers-group" aria-hidden="true" inert>${offerItems}</div>
        </div>
      </div>
    </section>
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
                  ${order.inventory_shortfall ? `
                    <section class="order-cancellation-notice inventory-shortfall">
                      <strong>Atenção: estoque abaixo do necessário</strong>
                      <p>Este pedido foi pago, mas houve outra compra antes da confirmação. Confira a disponibilidade e combine a entrega com o cliente.</p>
                    </section>
                  ` : ''}
                  ${order.status === 'cancelled' ? `
                    <section class="order-cancellation-notice">
                      <strong>Compra cancelada</strong>
                      <p>${escapeHtml(order.cancellation_message || '')}</p>
                      ${order.refund_amount !== null ? `<p>Valor a devolver: <strong>${formatPrice(Number(order.refund_amount))}</strong> · devolução manual via Pix</p>` : '<p>Pedido cancelado antes da confirmação do pagamento; não há valor de devolução registrado.</p>'}
                    </section>
                  ` : ''}
                  ${order.status === 'pending' ? `<button type="button" class="button button-primary" data-confirm-manual-pix="${escapeHtml(order.id)}">Confirmar recebimento no banco</button>` : ''}
                  ${['pending', 'paid'].includes(order.status) ? `<button type="button" class="button button-cancel" data-cancel-manual-pix="${escapeHtml(order.id)}" data-cancel-total="${escapeHtml(String(Number(order.total)))}" data-cancel-paid="${order.status === 'paid'}">Cancelar compra</button>${order.status === 'paid' ? `<p class="refund-amount-note">Valor a devolver ao cliente: <strong>${formatPrice(Number(order.total))}</strong></p>` : ''}` : ''}
                  ${['pending', 'paid'].includes(order.status) ? `
                    <div class="admin-order-actions">
                      <button type="button" class="text-button" data-toggle-order-edit="${escapeHtml(order.id)}">${state.editingOrderId === order.id ? 'Fechar edição' : 'Editar contato/entrega'}</button>
                      <button type="button" class="text-button" data-send-order-notification="${escapeHtml(order.id)}">Enviar mensagem ao cliente</button>
                    </div>
                    ${state.editingOrderId === order.id ? renderOrderEditForm(order) : ''}
                  ` : ''}
                  <button type="button" class="button button-cancel" data-delete-store-order="${escapeHtml(order.id)}" data-order-number="${escapeHtml(order.number)}">Excluir pedido</button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      ` : '<div class="empty-search orders-empty"><h3>Nenhum pedido Pix encontrado</h3><p>Novos pedidos aparecerão aqui.</p></div>'}
    </section>
  `;
}

function renderOrderEditForm(order) {
  const delivery = order.delivery || {};
  return `
    <form class="admin-order-edit-form" data-edit-order="${escapeHtml(order.id)}">
      <h3>Editar contato e recebimento</h3>
      <label>Nome do cliente<input name="customerName" maxlength="120" required value="${escapeHtml(order.customer_name || '')}"></label>
      <label>Telefone<input name="customerPhone" maxlength="30" required value="${escapeHtml(order.customer_phone || '')}"></label>
      <label>Forma de recebimento
        <select name="receiveMethod">
          <option value="nearby" ${delivery.receiveMethod === 'nearby' ? 'selected' : ''}>Entrega</option>
          <option value="station" ${delivery.receiveMethod === 'station' ? 'selected' : ''}>Retirada em estação</option>
        </select>
      </label>
      <div class="admin-delivery-fields">
        <label>Rua<input name="street" maxlength="160" value="${escapeHtml(delivery.street || '')}"></label>
        <label>Número<input name="number" maxlength="20" value="${escapeHtml(delivery.number || '')}"></label>
        <label>Observação<input name="deliveryNote" maxlength="300" value="${escapeHtml(delivery.deliveryNote || '')}"></label>
      </div>
      <label>Estação de retirada
        <select name="station">
          ${pickupStations.map((station) => `<option value="${station.value}" ${delivery.station === station.value ? 'selected' : ''}>${station.label}</option>`).join('')}
        </select>
      </label>
      <button class="button button-primary" type="submit">Salvar dados do pedido</button>
    </form>
  `;
}

function renderAdminStockView() {
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading">
        <div><p class="eyebrow eyebrow-muted">Área restrita da loja</p><h1 id="view-title">Controle de estoque</h1><p>O estoque é baixado quando o pagamento é confirmado. Pedidos aguardando Pix não reservam unidades.</p></div>
        <button type="button" class="button button-cancel" id="refresh-admin-stock">Atualizar</button>
      </div>
      ${state.adminStockError ? `<p class="form-error" role="alert">${escapeHtml(state.adminStockError)}</p>` : ''}
      ${state.adminStockLoading ? '<p role="status">Carregando estoque...</p>' : state.adminStockProducts.length ? `
        <div class="admin-stock-list">
          ${state.adminStockProducts.map((row) => {
            const product = products.find((item) => item.id === row.id);
            const variants = row.stock_by_color || {};
            return `
              <form class="admin-stock-row" data-stock-product="${escapeHtml(row.id)}">
                <div class="admin-stock-product"><strong>${escapeHtml(product?.name || row.id)}</strong><small>${escapeHtml(row.id)}</small></div>
                ${Object.keys(variants).length
                  ? `<div class="admin-stock-variants">${Object.entries(variants).map(([color, quantity]) => `
                    <label>${escapeHtml(color)}<input type="number" min="0" step="1" required name="variantStock" data-stock-color="${escapeHtml(color)}" value="${Number(quantity)}"></label>
                  `).join('')}</div>`
                  : `<label>Unidades<input type="number" min="0" step="1" required name="stock" value="${Number(row.stock)}"></label>`}
                <button type="submit" class="button button-primary">Salvar</button>
              </form>
            `;
          }).join('')}
        </div>
      ` : '<div class="empty-search orders-empty"><h3>Nenhum produto ativo</h3><p>Os produtos ativos aparecerão aqui.</p></div>'}
    </section>
  `;
}

function renderNotificationsView() {
  const notices = [
    ...state.systemNotifications.map((notification) => ({
      id: `store-${notification.id}`,
      createdAt: notification.created_at,
      title: notification.title,
      message: notification.message,
      productId: notification.product_id,
      isRead: notification.is_read,
    })),
    ...state.customerNotifications.map((notification) => ({
      id: `message-${notification.id}`,
      orderNumber: notification.orderNumber,
      createdAt: notification.created_at,
      title: 'Mensagem da loja',
      message: notification.message,
    })),
    ...state.orders.filter((order) => order.status === 'Compra cancelada').map((order) => ({
      id: `cancelled-${order.id}`,
      orderNumber: order.number,
      createdAt: order.cancelledAt || order.createdAt,
      title: 'Compra cancelada',
      message: order.cancellationMessage || 'A loja cancelou esta compra.',
      refundAmount: order.refundAmount,
    })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Sua conta</p><h1 id="view-title">Notificações</h1><p>Avisos da loja, ofertas e mensagens sobre seus pedidos.</p></div></div>
      ${notices.length ? `<div class="notification-list">${notices.map((notice) => `
        <article class="order-cancellation-notice${notice.isRead === false ? ' is-unread' : ''}">
          <p class="eyebrow eyebrow-muted">${notice.orderNumber ? `Pedido ${escapeHtml(notice.orderNumber)} · ` : ''}${new Date(notice.createdAt).toLocaleString('pt-BR')}</p>
          <h2>${escapeHtml(notice.title)}</h2>
          <p>${escapeHtml(notice.message)}</p>
          ${notice.refundAmount !== undefined && notice.refundAmount !== null ? `<p>Valor para devolução: <strong>${formatPrice(notice.refundAmount)}</strong>. A devolução é feita manualmente pela loja.</p>` : ''}
          ${notice.productId ? `<button type="button" class="text-button" data-open-product="${escapeHtml(notice.productId)}">Ver produto →</button>` : ''}
          ${notice.orderNumber ? '<button type="button" class="text-button" data-view="orders">Ver pedido</button>' : ''}
          ${notice.id.startsWith('store-') && notice.isRead === false ? `<button type="button" class="text-button" data-mark-store-notification="${escapeHtml(notice.id.slice(6))}">Marcar como lida</button>` : ''}
        </article>
      `).join('')}</div>` : '<div class="empty-search orders-empty"><h3>Nenhuma notificação</h3><p>Os avisos da loja aparecerão aqui.</p></div>'}
    </section>
  `;
}

function renderStoreNotificationWidget() {
  const notifications = state.systemNotifications;
  const newest = notifications.find((notification) => !notification.is_read);
  const notificationMarkup = (notification, showReadAction = true) => `
    <article class="system-notification-card${notification.is_read ? '' : ' is-unread'}">
      <div class="system-notification-card-heading">
        <span>${notification.notification_type === 'price_drop' ? 'Oferta especial' : 'Aviso da loja'}</span>
        <time datetime="${escapeHtml(notification.created_at)}">${new Date(notification.created_at).toLocaleDateString('pt-BR')}</time>
      </div>
      <h2>${escapeHtml(notification.title)}</h2>
      <p>${escapeHtml(notification.message)}</p>
      <div class="system-notification-card-actions">
        ${notification.product_id ? `<button type="button" class="system-notification-product" data-open-product="${escapeHtml(notification.product_id)}">Ver produto <span aria-hidden="true">→</span></button>` : ''}
        ${showReadAction && !notification.is_read ? `<button type="button" class="system-notification-read" data-mark-store-notification="${escapeHtml(notification.id)}">Dispensar</button>` : ''}
      </div>
    </article>
  `;
  const unreadCount = getStoreNotificationUnreadCount();
  return `
    <aside class="system-notification-widget" aria-label="Notificações da loja">
      ${!state.notificationPanelOpen ? `<button type="button" class="system-notification-launcher" data-toggle-system-notifications aria-expanded="false" aria-label="${unreadCount ? `${unreadCount} avisos não lidos` : 'Abrir avisos da loja'}">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="system-notification-launcher-label">Avisos</span>
        ${unreadCount ? `<b>${unreadCount > 9 ? '9+' : unreadCount}</b>` : ''}
      </button>` : ''}
      ${!state.notificationPanelOpen && newest ? `<div class="system-notification-preview">${notificationMarkup(newest)}</div>` : ''}
      ${state.notificationPanelOpen ? `<section class="system-notification-panel" aria-label="Avisos da loja">
        <div class="system-notification-panel-heading"><div><p class="eyebrow eyebrow-muted">Fique por dentro</p><h2>Avisos da loja</h2></div><button type="button" class="system-notification-close" data-toggle-system-notifications aria-label="Fechar avisos">×</button></div>
        ${state.systemNotificationError ? `<p class="form-error" role="alert">${escapeHtml(state.systemNotificationError)}</p>` : ''}
        <div class="system-notification-list">${notifications.length ? notifications.map((notification) => notificationMarkup(notification)).join('') : '<p class="system-notification-empty">Ainda não há avisos. Quando a loja enviar uma novidade, ela aparecerá aqui.</p>'}</div>
      </section>` : ''}
    </aside>
  `;
}

function closeSystemNotificationPanel() {
  const panel = app.querySelector('.system-notification-panel');
  if (!state.notificationPanelOpen || !panel || panel.classList.contains('is-closing')) return;

  let fallbackTimer;
  const finishClose = (event) => {
    if (event && (event.target !== panel || event.animationName !== 'notification-panel-exit')) return;
    panel.removeEventListener('animationend', finishClose);
    window.clearTimeout(fallbackTimer);
    if (!state.notificationPanelOpen) return;
    state.notificationPanelOpen = false;
    renderStore();
    app.querySelector('[data-toggle-system-notifications]')?.focus();
  };

  panel.addEventListener('animationend', finishClose);
  panel.classList.add('is-closing');
  fallbackTimer = window.setTimeout(() => finishClose(), 300);
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
  const supportPhoneDigits = digitsOnly(state.storeSettings.support_whatsapp || '');
  const whatsappNumber = supportPhoneDigits
    ? supportPhoneDigits.startsWith('55') ? supportPhoneDigits : `55${supportPhoneDigits}`
    : '';
  return `
    <section class="store-view" aria-labelledby="view-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Estamos por aqui</p><h1 id="view-title">Suporte</h1><p>${escapeHtml(state.storeSettings.support_message)}</p></div></div>
      <div class="support-options">
        <div class="support-option"><span aria-hidden="true">☏</span><div><small>Telefone / WhatsApp</small><strong>${whatsappNumber ? `<a href="https://wa.me/${escapeHtml(whatsappNumber)}" target="_blank" rel="noopener noreferrer">${escapeHtml(state.storeSettings.support_whatsapp)}</a>` : 'Não informado'}</strong><p>Fale conosco pelo WhatsApp.</p></div></div>
        <div class="support-option"><span aria-hidden="true">@</span><div><small>E-mail</small><strong><a href="mailto:${escapeHtml(state.storeSettings.support_email)}">${escapeHtml(state.storeSettings.support_email)}</a></strong><p>Envie sua dúvida por e-mail.</p></div></div>
      </div>
    </section>
  `;
}

function renderCurrentView(firstName, productDetail) {
  if (state.checkoutStep !== null) return renderCheckout();
  if (productDetail) return renderProductDetail(...productDetail);
  if (state.view === 'home') {
    return `<div class="shop-layout"><div class="home-content">${renderHomeView(firstName)}</div>${renderCart()}</div>`;
  }
  if (state.view === 'cart') {
    return `<section class="store-view cart-page-view" aria-labelledby="cart-page-title">
      <div class="view-heading"><div><p class="eyebrow eyebrow-muted">Sua seleção</p><h1 id="cart-page-title">Sua sacola</h1><p>Revise produtos, variações e quantidades antes de finalizar.</p></div><button type="button" class="button button-cancel cart-page-back" data-view="home">Continuar comprando</button></div>
      ${renderCart().replace('<aside class="cart-panel" id="sacola">', '<aside class="cart-panel cart-page-panel" id="sacola">')}
    </section>`;
  }
  if (state.view === 'categories') {
    const content = renderCategoriesView();
    return state.selectedCategory
      ? `<div class="shop-layout"><div class="category-products">${content}</div>${renderCart()}</div>`
      : content;
  }
  if (state.view === 'orders') return renderOrdersView();
  if (state.view === 'notifications') return renderNotificationsView();
  if (state.view === 'admin-orders' && state.profile && state.isStoreAdmin) return renderAdminOrdersView();
  if (state.view === 'admin-stock' && state.profile && state.isStoreAdmin) return renderAdminStockView();
  if (state.view === 'admin-dashboard' && state.profile && state.isStoreAdmin) return window.KahLimaAdminViews.renderDashboard(state);
  if (state.view === 'admin-support' && state.profile && state.isStoreAdmin) return window.KahLimaAdminViews.renderSupport(state, products);
  if (state.view === 'admin-reviews' && state.profile && state.isStoreAdmin) return window.KahLimaAdminViews.renderReviews(state, products);
  if (state.view === 'admin-settings' && state.profile && state.isStoreAdmin) return window.KahLimaAdminViews.renderSettings(state);
  if (state.view === 'profile') return renderProfileView();
  if (state.view === 'settings') return renderSettingsView();
  return renderSupportView();
}

function renderStore() {
  if (window.location.hash === authPath) {
    renderLogin();
    return;
  }
  const isGuest = !state.profile;
  const sidebarCollapsed = state.sidebarCollapsed;
  const profile = state.profile || { name: 'Visitante', email: '', phone: '', photoUrl: '' };
  const firstName = profile.name.split(' ')[0];
  const visibleProducts = getVisibleProducts();
  const showProductSearch = state.checkoutStep === null && !state.productDetailId && (state.view === 'home' || (state.view === 'categories' && state.selectedCategory));
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
  const reviewsForProduct = selectedProduct && state.productReviewsForId === selectedProduct.id
    ? state.productReviews
    : [];
  const reviewStatuses = new Map(state.productReviewOrders.map((review) => [review.order_id, review.status]));
  const eligibleReviewOrders = selectedProduct && state.profile
    ? state.orders
      .filter((order) => order.status === 'Pago' && order.items.some((item) => item.product.id === selectedProduct.id))
      .map((order) => ({
        id: order.id,
        number: order.number,
        reviewStatus: reviewStatuses.get(order.id) || '',
      }))
    : [];
  const reviewsMarkup = selectedProduct ? renderProductReviews({
    reviews: reviewsForProduct,
    eligibleOrders: eligibleReviewOrders,
    isLoggedIn: Boolean(state.profile),
    loading: state.productReviewsLoading && state.productReviewsForId === selectedProduct.id,
    error: state.productReviewsForId === selectedProduct.id ? state.productReviewsError : '',
    notice: state.productReviewsForId === selectedProduct.id ? state.productReviewNotice : '',
  }) : '';
  const contentKey = `${state.view}:${state.checkoutStep}:${state.selectedCategory || ''}:${state.productDetailId || ''}`;
  const enteringContent = state.renderedContentKey !== contentKey || state.contentRefresh;
  state.renderedContentKey = contentKey;
  state.contentRefresh = false;

  document.documentElement.dataset.theme = state.theme;
  document.title = selectedProduct
    ? `${selectedProduct.name} | ${state.storeSettings.store_name}`
    : state.storeSettings.store_name || 'KahLima Vendas';
  app.innerHTML = `
    <div class="store-page${sidebarCollapsed ? ' sidebar-collapsed' : ''}${state.sidebarOpen ? ' sidebar-open' : ''}${state.checkoutStep !== null ? ' is-checkout' : ''}">
      ${state.storeOpening ? `<div class="store-opening" role="status" aria-live="polite">
        <div class="store-opening-card">
          <span class="store-opening-mark" aria-hidden="true">K</span>
          <span class="store-opening-spinner" aria-hidden="true"></span>
          <p class="store-opening-title">Acesso confirmado</p>
          <p class="store-opening-copy">Preparando sua loja...</p>
          <span class="store-opening-progress" aria-hidden="true"></span>
        </div>
      </div>` : ''}
      <button type="button" class="sidebar-backdrop" data-sidebar-close aria-label="Fechar menu"></button>
      <aside class="side-panel" aria-label="Navegação principal">
        <button type="button" class="sidebar-drawer-close" data-sidebar-close><span aria-hidden="true">×</span>Fechar menu</button>
        ${isGuest
          ? `<div class="guest-account-card"><strong>Conheça a KahLima</strong><p>Navegue e escolha seus produtos. A conta será necessária apenas para finalizar a compra.</p><button type="button" class="button button-primary" data-auth-login>Entrar ou criar conta</button></div>`
          : `<div class="sidebar-brand-row"><div class="sidebar-account"><p>Conta ativa</p><button type="button" class="sidebar-profile" data-view="profile" aria-label="Abrir perfil de ${escapeHtml(profile.name)}">${avatarMarkup(profile)}<span><strong>${escapeHtml(profile.name)}</strong><small>Meu perfil</small></span></button></div></div>`}
        <p class="sidebar-section-label">NAVEGAÇÃO</p>
        <nav class="sidebar-nav" aria-label="Seções">
          <button type="button" class="sidebar-link${state.view === 'home' ? ' is-active' : ''}" data-view="home" aria-label="Início" title="Início"><span aria-hidden="true">⌂</span><span>Início</span></button>
          <button type="button" class="sidebar-link${state.view === 'categories' ? ' is-active' : ''}" data-view="categories" aria-label="Categorias" title="Categorias"><span aria-hidden="true">▦</span><span>Categorias</span><b aria-hidden="true">${state.view === 'categories' ? '⌄' : '›'}</b></button>
          ${state.view === 'categories' ? `<div class="sidebar-category-list">${categories.map((category) => `<button type="button" class="sidebar-category${state.selectedCategory === category.id ? ' is-active' : ''}" data-category-choose="${category.id}">${escapeHtml(category.name)}</button>`).join('')}</div>` : ''}
          ${!isGuest ? `<div class="sidebar-link-with-action"><button type="button" class="sidebar-link${state.view === 'orders' ? ' is-active' : ''}" data-view="orders" aria-label="Pedidos" title="Pedidos"><span aria-hidden="true">▣</span><span>Pedidos</span><b class="sidebar-badge">${state.orders.length}</b></button>${state.isStoreAdmin ? '<button type="button" class="sidebar-cleanup" data-clear-admin-records="orders" aria-label="Apagar todos os pedidos e zerar o resumo de vendas" title="Apagar todos os pedidos"><svg class="sidebar-cleanup-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg></button>' : ''}</div>
          <div class="sidebar-link-with-action"><button type="button" class="sidebar-link${state.view === 'notifications' ? ' is-active' : ''}" data-view="notifications" aria-label="Notificações" title="Notificações"><span aria-hidden="true">♢</span><span>Notificações</span>${state.notificationCount ? `<b class="sidebar-badge">${state.notificationCount}</b>` : ''}</button>${state.isStoreAdmin ? '<button type="button" class="sidebar-cleanup" data-clear-admin-records="notifications" aria-label="Apagar notificações da loja" title="Apagar notificações"><svg class="sidebar-cleanup-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg></button>' : ''}</div>` : ''}
          ${state.profile && state.isStoreAdmin ? `          <button type="button" class="sidebar-link${state.view === 'admin-dashboard' ? ' is-active' : ''}" data-view="admin-dashboard" aria-label="Resumo de vendas" title="Resumo de vendas"><span aria-hidden="true">▥</span><span>Resumo de vendas</span></button>
          <button type="button" class="sidebar-link${state.view === 'admin-orders' ? ' is-active' : ''}" data-view="admin-orders" aria-label="Conferir pagamentos" title="Conferir pagamentos"><span aria-hidden="true">✓</span><span>Conferir pagamentos</span></button>
          <button type="button" class="sidebar-link${state.view === 'admin-stock' ? ' is-active' : ''}" data-view="admin-stock" aria-label="Estoque" title="Estoque"><span aria-hidden="true">▤</span><span>Estoque</span></button>
          <button type="button" class="sidebar-link${state.view === 'admin-support' ? ' is-active' : ''}" data-view="admin-support" aria-label="Atendimento" title="Atendimento"><span aria-hidden="true">☏</span><span>Atendimento</span></button>
          <button type="button" class="sidebar-link${state.view === 'admin-reviews' ? ' is-active' : ''}" data-view="admin-reviews" aria-label="Avaliações" title="Avaliações"><span aria-hidden="true">★</span><span>Avaliações</span>${state.adminReviewList.length ? `<b class="sidebar-badge">${state.adminReviewList.length}</b>` : ''}</button>
          <button type="button" class="sidebar-link${state.view === 'admin-settings' ? ' is-active' : ''}" data-view="admin-settings" aria-label="Dados da loja" title="Dados da loja"><span aria-hidden="true">⚙</span><span>Dados da loja</span></button>` : ''}
          ${!isGuest ? `<button type="button" class="sidebar-link${state.view === 'settings' ? ' is-active' : ''}" data-view="settings" aria-label="Configurações" title="Configurações"><span aria-hidden="true">⚙</span><span>Configurações</span></button>` : ''}
          <button type="button" class="sidebar-link${state.view === 'support' ? ' is-active' : ''}" data-view="support" aria-label="Suporte" title="Suporte"><span aria-hidden="true">?</span><span>Suporte</span></button>
          ${!isGuest ? '<button type="button" class="sidebar-link sidebar-logout" id="logout" aria-label="Sair" title="Sair"><span aria-hidden="true">↪</span><span>Sair</span></button>' : ''}
        </nav>
        <div class="sidebar-bottom"><span class="sidebar-demo-mark"></span><span>${escapeHtml(state.storeSettings.store_name)}</span></div>
      </aside>
      <div class="store-workspace">
        <header class="store-header">
          <div class="store-header-start"><button type="button" class="menu-toggle" data-sidebar-toggle aria-label="${state.sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}" aria-expanded="${state.sidebarOpen}">${state.sidebarOpen ? 'Fechar' : 'Menu'}</button><a class="brand header-brand" href="#loja" data-view="home"><span class="brand-mark">K</span><span>${escapeHtml(state.storeSettings.store_name)}</span></a></div>
          ${showProductSearch ? `<label class="search-field header-search"><span class="visually-hidden">Buscar produto por nome ou ID</span><input id="product-search" value="${escapeHtml(state.search)}" placeholder="Buscar produto por nome ou ID" autocomplete="off"><button type="button" id="clear-search" aria-label="Limpar busca" ${state.search ? '' : 'hidden'}>×</button></label>` : ''}
          <nav class="store-nav" aria-label="Sacola e sessão">
            <button type="button" class="cart-link" data-open-cart aria-label="Abrir sacola, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}">
              <svg class="cart-link-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>
              <span class="cart-link-label">Sacola</span>
              <span class="cart-link-count">${cartItemCount}</span>
            </button>
            ${isGuest ? '<button type="button" class="header-auth-link" data-auth-login>Entrar</button>' : ''}
          </nav>
        </header>

        ${state.checkoutStep === null && state.view === 'home' && !state.productDetailId ? renderHomeOffers() : ''}

        <main class="store-main${enteringContent ? ' is-entering' : ''}">
          ${renderCurrentView(firstName, selectedProduct ? [
            selectedProduct,
            selectedProductVariantAvailable,
            selectedProductQuantity,
            state.selectedProductVariants,
            selectedProductVariantStocks,
            reviewsMarkup,
            getRelatedProducts(selectedProduct),
            state.productGalleryIndex,
          ] : null)}
        </main>

        <footer class="store-footer">
          <div class="store-footer-inner">
            <a class="store-footer-brand" href="#loja" data-view="home" aria-label="KahLima Vendas, voltar ao início">
              <span class="store-footer-mark" aria-hidden="true">K</span>
              <span><strong>${escapeHtml(state.storeSettings.store_name)}</strong><small>Escolhas leves, feitas para você</small></span>
            </a>
            <p>© 2026 KahLima Vendas. Todos os direitos reservados.</p>
            <span class="store-footer-status"><i aria-hidden="true"></i> Escolhas leves, feitas para você</span>
          </div>
        </footer>
      </div>
      ${state.notice ? `<div class="notice" role="status">${escapeHtml(state.notice)}</div>` : ''}
      ${state.profileOpen ? renderProfileDialog() : ''}
      ${state.checkoutStep === null ? renderStoreNotificationWidget() : ''}
    </div>
  `;
  bindCartPanel(app.querySelector('#sacola'));
  void loadStoreNotifications();
  app.querySelector('[data-store-notification-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const title = String(values.get('title') || '').trim();
    const message = String(values.get('message') || '').trim();
    if (!title || !message) return;
    const submitButton = form.querySelector('[type="submit"]');
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase) {
      state.adminNotificationPublishError = 'O serviço de notificações não está disponível. Tente novamente.';
      renderStore();
      return;
    }
    submitButton.disabled = true;
    state.adminNotificationPublishError = '';
    state.adminNotificationPublishNotice = '';
    const { error } = await supabase.rpc('publish_store_notification', {
      p_title: title,
      p_message: message,
      p_target_user_id: String(values.get('targetUserId') || '') || null,
      p_product_id: String(values.get('productId') || '') || null,
    });
    if (error) {
      console.error('Could not publish store notification.', error);
      state.adminNotificationPublishError = 'Não foi possível enviar o aviso. Confira os dados e tente novamente.';
      renderStore();
      return;
    }
    state.adminNotificationPublishNotice = 'Notificação enviada com sucesso.';
    if (!String(values.get('targetUserId') || '')) {
      state.systemNotificationsLoadedFor = '';
      await loadStoreNotifications(true);
    }
    renderStore();
  });

  app.querySelector('#open-profile')?.addEventListener('click', () => {
    state.profileOpen = true;
    state.profileDraft = { ...state.profile };
    state.profileError = '';
    renderStore();
    app.querySelector('#close-profile').focus();
  });

  app.querySelector('#logout')?.addEventListener('click', async () => {
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
    state.isStoreAdmin = false;
    state.adminOrders = [];
    state.adminReviewList = [];
    state.orders = [];
    state.customerNotifications = [];
    state.systemNotifications = [];
    state.systemNotificationsLoadedFor = '';
    state.notificationPanelOpen = false;
    state.adminNotificationRecipients = [];
    state.adminCustomerPresence = [];
    state.adminCustomerPhotoUrlCache = new Map();
    state.adminNotificationPublishError = '';
    state.adminNotificationPublishNotice = '';
    state.notificationCount = 0;
    state.mode = 'login';
    state.profileOpen = false;
    state.productDetailId = null;
    state.view = 'home';
    state.checkoutStep = null;
    state.checkoutDelivery = null;
    state.order = null;
    goTo(storePath);
  });

  app.querySelectorAll('[data-auth-login]').forEach((button) => {
    button.addEventListener('click', () => {
      state.authReturnToCheckout = false;
      state.authReturnHash = '';
      state.mode = 'login';
      state.authScreen = 'login';
      state.error = '';
      state.successMessage = '';
      goTo(authPath);
    });
  });

  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      if (state.view !== 'admin-support' && state.adminCustomerDetailsUserId) {
        state.adminCustomerDetailsRequestId += 1;
        state.adminCustomerDetailsUserId = null;
        state.adminCustomerDetails = null;
        state.adminCustomerDetailsLoading = false;
        state.adminCustomerDetailsError = '';
      }
      state.selectedCategory = null;
      state.search = '';
      state.selectedOrder = null;
      state.sidebarOpen = false;
      if (state.view === 'orders' || state.view === 'notifications') void loadCustomerOrders();
      if (['admin-orders', 'admin-support'].includes(state.view)) void loadAdminOrders();
      if (state.view === 'admin-support') void loadAdminCustomerPresence();
      if (state.view === 'admin-stock') void loadAdminStock();
      if (state.view === 'admin-dashboard') void loadAdminDashboard();
      if (state.view === 'admin-reviews') void loadAdminReviews();
      if (state.view === 'admin-settings') void loadStoreSettings();
      if (state.view === 'cart') {
        goTo(cartPath);
        return;
      }
      if (window.location.hash === cartPath || window.location.hash.startsWith('#produto/')) {
        goTo(storePath);
        return;
      }
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
    state.sidebarOpen = !state.sidebarOpen;
    renderStore();
  });
  app.querySelector('[data-open-cart]')?.addEventListener('click', () => {
    state.view = 'cart';
    state.selectedCategory = null;
    goTo(cartPath);
  });
  app.querySelectorAll('[data-toggle-system-notifications]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.notificationPanelOpen) {
        closeSystemNotificationPanel();
        return;
      }
      state.notificationPanelOpen = true;
      renderStore();
      app.querySelector('.system-notification-close')?.focus();
    });
  });
  app.querySelectorAll('[data-mark-store-notification]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (await markStoreNotificationRead(button.dataset.markStoreNotification)) {
        state.notificationPanelOpen = false;
        renderStore();
      }
    });
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
  app.querySelectorAll('[data-delete-store-order]').forEach((button) => {
    button.addEventListener('click', () => {
      const confirmed = window.confirm(
        `Excluir permanentemente o pedido ${button.dataset.orderNumber}? Esta ação também removerá os itens, mensagens e avaliações vinculados e não pode ser desfeita.`
      );
      if (!confirmed) return;
      button.disabled = true;
      void deleteStoreOrder(button.dataset.deleteStoreOrder);
    });
  });
  app.querySelectorAll('[data-clear-admin-records]').forEach((button) => {
    button.addEventListener('click', () => {
      const isOrders = button.dataset.clearAdminRecords === 'orders';
      const message = isOrders
        ? 'Apagar TODOS os pedidos do banco? Isso inclui pedidos pendentes, pagos, cancelados e com falha, além dos itens, avaliações e mensagens vinculados. O resumo de vendas será zerado. Esta ação é permanente.'
        : 'Apagar todas as notificações da loja e mensagens ligadas a pedidos? Os pedidos não serão apagados. Esta ação é permanente.';
      if (!window.confirm(message)) return;
      button.disabled = true;
      void clearAdminRecords(button.dataset.clearAdminRecords);
    });
  });
  app.querySelectorAll('[data-toggle-order-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      state.editingOrderId = state.editingOrderId === button.dataset.toggleOrderEdit
        ? null
        : button.dataset.toggleOrderEdit;
      renderStore();
    });
  });
  app.querySelectorAll('[data-send-order-notification]').forEach((button) => {
    button.addEventListener('click', () => {
      const message = window.prompt('Escreva a mensagem que aparecerá nas notificações do cliente (até 1000 caracteres).');
      if (message === null) return;
      if (!message.trim() || message.trim().length > 1000) {
        window.alert('A mensagem deve ter entre 1 e 1000 caracteres.');
        return;
      }
      button.disabled = true;
      void sendCustomerOrderNotification(button.dataset.sendOrderNotification, message.trim());
    });
  });
  app.querySelectorAll('[data-edit-order]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const customerName = String(values.get('customerName') || '').trim();
      const customerPhone = String(values.get('customerPhone') || '').trim();
      const receiveMethod = String(values.get('receiveMethod') || '');
      const delivery = receiveMethod === 'station'
        ? {
          name: customerName,
          whatsapp: customerPhone,
          receiveMethod,
          station: String(values.get('station') || ''),
        }
        : {
          name: customerName,
          whatsapp: customerPhone,
          receiveMethod,
          street: String(values.get('street') || '').trim(),
          number: String(values.get('number') || '').trim(),
          deliveryNote: String(values.get('deliveryNote') || '').trim(),
        };
      void updateManualPixOrderDetails(form.dataset.editOrder, customerName, customerPhone, delivery);
    });
  });
  app.querySelectorAll('[data-stock-product]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const variantInputs = [...form.querySelectorAll('[data-stock-color]')];
      const stockByColor = Object.fromEntries(variantInputs.map((input) => [
        input.dataset.stockColor,
        Math.max(0, Number(values.getAll('variantStock')[variantInputs.indexOf(input)])),
      ]));
      const stock = variantInputs.length
        ? Object.values(stockByColor).reduce((sum, quantity) => sum + quantity, 0)
        : Math.max(0, Number(values.get('stock')));
      const saveButton = form.querySelector('[type="submit"]');
      saveButton.disabled = true;
      void saveProductStock(form.dataset.stockProduct, stock, stockByColor);
    });
  });
  app.querySelector('#refresh-admin-orders')?.addEventListener('click', () => {
    void loadAdminOrders();
  });
  app.querySelector('#refresh-admin-customers')?.addEventListener('click', () => {
    void loadAdminNotificationRecipients();
    void loadAdminCustomerPresence();
  });
  app.querySelectorAll('[data-notify-customer]').forEach((button) => {
    button.addEventListener('click', () => {
      const form = app.querySelector('[data-store-notification-form]');
      const recipient = form?.querySelector('[name="targetUserId"]');
      if (!recipient) return;
      const customerId = button.dataset.notifyCustomer;
      if (![...recipient.options].some((option) => option.value === customerId)) {
        state.adminNotificationPublishError = 'A lista de destinatários ainda não está pronta. Atualize os clientes e tente novamente.';
        renderStore();
        return;
      }
      recipient.value = customerId;
      form.querySelector('[name="title"]')?.focus();
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  app.querySelectorAll('[data-customer-details]').forEach((button) => {
    button.addEventListener('click', () => {
      void loadAdminCustomerDetails(button.dataset.customerDetails);
    });
  });
  app.querySelectorAll('[data-close-customer-details]').forEach((button) => {
    button.addEventListener('click', closeAdminCustomerDetails);
  });
  app.querySelector('[data-customer-details-overlay]')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeAdminCustomerDetails();
  });
  app.querySelector('#refresh-admin-stock')?.addEventListener('click', () => {
    void loadAdminStock();
  });
  app.querySelector('#refresh-admin-dashboard')?.addEventListener('click', () => {
    void loadAdminDashboard();
  });
  app.querySelector('#refresh-admin-reviews')?.addEventListener('click', () => {
    void loadAdminReviews();
  });
  app.querySelector('#admin-support-search')?.addEventListener('input', (event) => {
    state.adminSupportSearch = event.target.value;
    const cursor = event.target.selectionStart;
    renderStore();
    const search = app.querySelector('#admin-support-search');
    search?.focus();
    search?.setSelectionRange(cursor, cursor);
  });
  app.querySelectorAll('[data-review-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const supabase = window.KahLimaSupabase?.client;
      if (!supabase || !state.isStoreAdmin) return;
      button.disabled = true;
      const { error } = await supabase.rpc('moderate_product_review', {
        p_review_id: Number(button.dataset.reviewId),
        p_status: button.dataset.reviewAction,
      });
      if (error) {
        console.error('Could not moderate the product review.', error);
        state.adminReviewsError = 'Não foi possível atualizar a avaliação. Tente novamente.';
        renderStore();
        return;
      }
      state.adminReviewList = state.adminReviewList.filter((review) => String(review.id) !== button.dataset.reviewId);
      state.adminReviewsError = '';
      renderStore();
    });
  });
  app.querySelector('#admin-settings-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase || !state.isStoreAdmin) return;
    const values = new FormData(event.currentTarget);
    const updatedSettings = {
      store_name: String(values.get('storeName') || '').trim(),
      support_whatsapp: String(values.get('supportWhatsapp') || '').trim(),
      support_email: String(values.get('supportEmail') || '').trim(),
      support_message: String(values.get('supportMessage') || '').trim(),
    };
    const submitButton = event.currentTarget.querySelector('[type="submit"]');
    submitButton.disabled = true;
    const { error } = await supabase.rpc('save_store_settings', {
      p_store_name: updatedSettings.store_name,
      p_support_whatsapp: updatedSettings.support_whatsapp,
      p_support_email: updatedSettings.support_email,
      p_support_message: updatedSettings.support_message,
    });
    if (error) {
      console.error('Could not save store support settings.', error);
      state.adminSettingsError = 'Não foi possível salvar. Confira o WhatsApp e o e-mail e tente novamente.';
      state.adminSettingsNotice = '';
      renderStore();
      return;
    }
    state.storeSettings = updatedSettings;
    state.adminSettingsError = '';
    state.adminSettingsNotice = 'Informações da loja atualizadas.';
    renderStore();
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
      if (event.target.id === 'profile-overlay' && !state.profileSaving) closeProfileDialog();
    });
    app.querySelector('#profile-photo').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const discardPhotoDraft = () => {
        if (state.profileDraft.photoUrl.startsWith('blob:')) URL.revokeObjectURL(state.profileDraft.photoUrl);
        state.profileDraft.photoUrl = state.profile.photoUrl;
        delete state.profileDraft.photoFile;
      };
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        discardPhotoDraft();
        state.profileError = 'Escolha uma imagem JPG, PNG ou WEBP.';
        renderStore();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        discardPhotoDraft();
        state.profileError = 'A imagem precisa ter no máximo 5 MB.';
        renderStore();
        return;
      }
      if (state.profileDraft.photoUrl.startsWith('blob:') && state.profileDraft.photoUrl !== state.profile.photoUrl) {
        URL.revokeObjectURL(state.profileDraft.photoUrl);
      }
      state.profileDraft.photoUrl = URL.createObjectURL(file);
      state.profileDraft.photoFile = file;
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
    app.querySelector('#profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (state.profileSaving) return;
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
        state.profileSaving = true;
        state.profileError = '';
        renderStore();
        const photoFile = state.profileDraft.photoFile;
        if (photoFile) {
          try {
            const savedPhoto = await uploadProfilePhoto(photoFile, state.userId);
            updatedProfile.avatarPath = savedPhoto.avatarPath;
            updatedProfile.photoUrl = savedPhoto.photoUrl;
          } catch (error) {
            console.error('Could not save the customer profile photo.', error);
            state.profileSaving = false;
            state.profileError = 'Não foi possível salvar a foto. Confira sua conexão e tente novamente.';
            renderStore();
            app.querySelector('#profile-title')?.focus();
            return;
          }
        }
        state.profileSaving = false;
        delete updatedProfile.photoFile;
        if (state.profileDraft.photoUrl.startsWith('blob:')) URL.revokeObjectURL(state.profileDraft.photoUrl);
        state.profile = updatedProfile;
        state.profileDraft = null;
        state.profileOpen = false;
        state.profileError = '';
        renderStore();
        app.querySelector('#open-profile').focus();
        return;
      }
      renderStore();
      app.querySelector('#profile-title')?.focus();
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
    button.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return;
      event.preventDefault();
      const productId = button.dataset.openProduct;
      state.notificationPanelOpen = false;
      state.productDetailId = productId;
      state.productGalleryIndex = 0;
      state.selectedProductVariants = { color: '', type: '' };
      window.scrollTo(0, 0);
      goTo(`#produto/${encodeURIComponent(productId)}`);
      void loadProductReviews(productId);
      app.querySelector('[data-close-product]')?.focus();
    });
  });

  const closeProductDetail = () => {
    const productId = state.productDetailId;
    app.querySelector('[data-variant-picker][open]')?.close();
    state.variantPickerAction = '';
    state.productDetailId = null;
    state.productGalleryIndex = 0;
    state.selectedProductVariants = null;
    state.productReviewsForId = null;
    state.productReviews = [];
    goTo(storePath);
    app.querySelector(`[data-open-product="${productId}"]`)?.focus();
  };
  app.querySelector('[data-close-product]')?.addEventListener('click', closeProductDetail);
  app.querySelectorAll('[data-variant-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.variantKind;
      const value = button.dataset.variantValue;
      state.selectedProductVariants = {
        ...(state.selectedProductVariants || { color: '', type: '' }),
        [kind]: value,
      };
      app.querySelectorAll(`.product-variant-group[data-variant-group="${kind}"]`).forEach((group) => {
        group.querySelectorAll('[data-variant-kind]').forEach((option) => {
          const isSelected = option.dataset.variantValue === value;
          option.classList.toggle('is-selected', isSelected);
          option.setAttribute('aria-pressed', String(isSelected));
        });
        group.querySelector('legend span').textContent = `· ${value}`;
      });
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
      if (!getMissingProductVariant(product, state.selectedProductVariants)) {
        app.querySelector('[data-picker-error]')?.setAttribute('hidden', '');
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
  const executeProductAction = (action) => {
    const product = products.find((item) => item.id === state.productDetailId);
    if (!product || getMissingProductVariant(product, state.selectedProductVariants)) return;
    if (!addProductToCart(state.productDetailId, state.selectedProductVariants, { notify: action !== 'buy' })) {
      showStoreNotice('Não foi possível adicionar esse produto. Confira o estoque e tente novamente.');
      return;
    }
    if (action === 'buy') startCheckout();
    else closeProductDetail();
  };
  const openVariantPicker = (action) => {
    const product = products.find((item) => item.id === state.productDetailId);
    if (!product) return;
    const picker = app.querySelector('[data-variant-picker]');
    if (!picker) {
      executeProductAction(action);
      return;
    }
    state.selectedProductVariants = { color: '', type: '' };
    app.querySelectorAll('.product-variant-picker .product-variant-group').forEach((group) => {
      group.querySelector('legend span').textContent = '· Escolha uma opção';
      group.querySelectorAll('[data-variant-kind]').forEach((option) => {
        option.classList.remove('is-selected');
        option.setAttribute('aria-pressed', 'false');
      });
    });
    updateProductQuantityControls(product.id);
    state.variantPickerAction = action;
    picker.querySelector('[data-confirm-variant-action]').textContent =
      action === 'buy' ? 'Continuar para compra' : 'Adicionar à sacola';
    picker.querySelector('[data-picker-error]').hidden = true;
    picker.showModal();
    picker.querySelector('.product-variant-group [data-variant-kind]:not(:disabled)')?.focus();
  };
  app.querySelector('[data-detail-add]')?.addEventListener('click', () => openVariantPicker('add'));
  app.querySelector('[data-detail-buy]')?.addEventListener('click', () => openVariantPicker('buy'));
  app.querySelector('[data-close-variant-picker]')?.addEventListener('click', () => {
    app.querySelector('[data-variant-picker]').close();
  });
  app.querySelector('[data-variant-picker]')?.addEventListener('close', () => {
    state.variantPickerAction = '';
  });
  app.querySelector('[data-confirm-variant-action]')?.addEventListener('click', () => {
    const product = products.find((item) => item.id === state.productDetailId);
    const missingVariant = getMissingProductVariant(product, state.selectedProductVariants);
    if (missingVariant) {
      const error = app.querySelector('[data-picker-error]');
      error.hidden = false;
      app.querySelector(`[data-variant-picker] [data-variant-group="${missingVariant}"] [data-variant-kind]:not(:disabled)`)?.focus();
      return;
    }
    const action = state.variantPickerAction;
    app.querySelector('[data-variant-picker]').close();
    executeProductAction(action);
  });
  app.querySelector('[data-review-signin]')?.addEventListener('click', () => {
    state.authReturnHash = window.location.hash;
    state.mode = 'login';
    state.authScreen = 'login';
    state.error = '';
    goTo(authPath);
  });
  app.querySelector('#product-review-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    const productId = state.productDetailId;
    const supabase = window.KahLimaSupabase?.client;
    if (!supabase || !state.userId || !productId) {
      state.productReviewsError = 'Entre na sua conta para enviar uma avaliação.';
      renderStore();
      return;
    }
    const { error } = await supabase.rpc('submit_product_review', {
      p_order_id: String(form.get('orderId')),
      p_product_id: productId,
      p_rating: Number(form.get('rating')),
      p_comment: String(form.get('comment') || '').trim(),
    });
    if (error) {
      console.error('Could not submit the verified product review.', error);
      state.productReviewsError = /duplicate key|unique constraint/i.test(error.message || '')
        ? 'Este pedido já tem uma avaliação enviada para esse produto.'
        : /confirmed purchase/i.test(error.message || '')
          ? 'Só é possível avaliar o produto depois da confirmação da compra.'
          : 'Não foi possível enviar a avaliação. Confira os dados e tente novamente.';
      renderStore();
      return;
    }
    state.productReviewNotice = 'Avaliação enviada. Ela ficará visível depois da aprovação da loja.';
    state.productReviewsError = '';
    await loadProductReviews(productId);
  });
  app.querySelectorAll('.review-stars input').forEach((input) => {
    input.addEventListener('change', () => {
      const selectedRating = Number(input.value);
      app.querySelectorAll('.review-stars label').forEach((label) => {
        label.classList.toggle('is-active', Number(label.querySelector('input').value) <= selectedRating);
        label.classList.toggle('is-selected', label.querySelector('input') === input);
      });
    });
  });
  bindProductDetail(app, (index) => {
    if (selectedProduct && state.productDetailId === selectedProduct.id) state.productGalleryIndex = index;
  });

}

function render() {
  if (state.authInitializing) {
    app.innerHTML = '<main class="auth-page"><p class="auth-loading" role="status">Carregando sua conta...</p></main>';
    return;
  }
  const hash = window.location.hash;
  if (state.authScreen === 'reset' || hash === authPath) {
    renderLogin();
    return;
  }
  if (hash === cartPath) {
    state.view = 'cart';
    state.productDetailId = null;
    renderStore();
    return;
  }
  if (hash.startsWith('#produto/')) {
    let productId = '';
    try {
      productId = decodeURIComponent(hash.slice('#produto/'.length));
    } catch (error) {
      console.error('Invalid product link in the page URL.', error);
    }
    if (!products.some((product) => product.id === productId)) {
      state.productDetailId = null;
      state.notice = 'Esse produto não foi encontrado.';
      goTo(storePath);
      return;
    }
    if (state.productDetailId !== productId) {
      state.productDetailId = productId;
      state.productGalleryIndex = 0;
      state.selectedProductVariants = { color: '', type: '' };
      state.productReviewsForId = null;
    }
    state.view = 'home';
    renderStore();
    if (state.productReviewsForId !== productId) void loadProductReviews(productId);
    return;
  }
  if (hash === '' || hash === storePath) {
    if (state.productDetailId || state.view === 'cart') {
      state.productDetailId = null;
      state.productGalleryIndex = 0;
      state.selectedProductVariants = null;
      state.view = 'home';
    }
    renderStore();
    return;
  }
  renderLogin();
}

async function initializeAuthentication() {
  const supabase = window.KahLimaSupabase?.client;
  void loadStoreInventory();
  void loadStoreSettings();
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
      setAuthenticatedUser(data.session.user, { preserveAuthRoute: true });
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

window.addEventListener('hashchange', () => {
  render();
  void touchStorePresence();
});
const refreshStoreNotifications = () => {
  if (document.visibilityState !== 'visible' || state.authInitializing || state.systemNotificationsLoading) return;
  void touchStorePresence();
  void loadStoreNotifications(true);
  if (state.checkoutStep === null && state.view === 'home') void loadStoreInventory();
  if (state.isStoreAdmin && state.view === 'admin-support') void loadAdminCustomerPresence();
};
window.addEventListener('focus', refreshStoreNotifications);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshStoreNotifications();
});
window.setInterval(() => {
  void touchStorePresence();
  if (state.isStoreAdmin && state.view === 'admin-support') void loadAdminCustomerPresence();
}, 30_000);
window.setInterval(() => {
  if (!state.systemNotificationError) refreshStoreNotifications();
}, 60_000);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.sidebarOpen) {
    state.sidebarOpen = false;
    renderStore();
    app.querySelector('[data-sidebar-toggle]')?.focus();
  } else if (event.key === 'Escape' && state.notificationPanelOpen) {
    closeSystemNotificationPanel();
  } else if (event.key === 'Escape' && state.profileOpen) {
    closeProfileDialog();
  } else if (event.key === 'Escape' && state.adminCustomerDetailsUserId) {
    closeAdminCustomerDetails();
  } else if (event.key === 'Escape' && app.querySelector('[data-image-lightbox][open]')) {
    app.querySelector('[data-image-lightbox][open]').close();
    return;
  } else if (event.key === 'Escape' && state.productDetailId) {
    app.querySelector('[data-close-product]')?.click();
  }
});
app.addEventListener('click', (event) => {
  const closeButton = event.target instanceof Element
    ? event.target.closest('[data-sidebar-close]')
    : null;
  if (!closeButton) return;
  state.sidebarOpen = false;
  renderStore();
});
initializeAuthentication();