import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type MercadoPagoPayment = {
  id?: string | number;
  status?: string;
  message?: string;
  payment_method_id?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !accessToken) {
    console.error('Supabase or Mercado Pago function secrets are not configured.');
    return jsonResponse({ error: 'O pagamento ainda não está configurado no servidor.' }, 503);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Entre na sua conta para continuar.' }, 401);
  }
  const accessJwt = authorization.slice('Bearer '.length).trim();

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessJwt);
  if (authError || !user?.email) {
    return jsonResponse({ error: 'Sua sessão expirou. Entre novamente.' }, 401);
  }

  let body: {
    items?: Array<{ id?: string; quantity?: number; color?: string; type?: string }>;
    delivery?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Os dados do pedido são inválidos.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Os dados do pedido são inválidos.' }, 400);
  }

  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) {
    return jsonResponse({ error: 'A sacola está vazia ou contém itens demais.' }, 400);
  }
  const lines = new Map<string, { productId: string; quantity: number; color: string; type: string }>();
  const quantitiesByProduct = new Map<string, number>();
  for (const item of body.items) {
    if (typeof item.id !== 'string' || typeof item.quantity !== 'number'
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      return jsonResponse({ error: 'Confira os produtos e quantidades da sacola.' }, 400);
    }
    const color = typeof item.color === 'string' ? item.color.slice(0, 40) : '';
    const type = typeof item.type === 'string' ? item.type.slice(0, 40) : '';
    const productQuantity = (quantitiesByProduct.get(item.id) || 0) + item.quantity;
    if (productQuantity > 50) return jsonResponse({ error: 'A quantidade solicitada é muito alta.' }, 400);
    quantitiesByProduct.set(item.id, productQuantity);
    const lineKey = JSON.stringify([item.id, color, type]);
    const current = lines.get(lineKey) || { productId: item.id, quantity: 0, color, type };
    current.quantity += item.quantity;
    lines.set(lineKey, current);
  }

  const inputDelivery = body.delivery;
  if (!inputDelivery || typeof inputDelivery.name !== 'string' || typeof inputDelivery.whatsapp !== 'string'
    || !['nearby', 'station'].includes(String(inputDelivery.receiveMethod))) {
    return jsonResponse({ error: 'Informe os dados de entrega ou retirada.' }, 400);
  }
  const name = inputDelivery.name.trim().slice(0, 120);
  const phone = inputDelivery.whatsapp.trim().slice(0, 30);
  const receiveMethod = String(inputDelivery.receiveMethod);
  const station = typeof inputDelivery.station === 'string' ? inputDelivery.station : '';
  const street = typeof inputDelivery.street === 'string' ? inputDelivery.street.trim().slice(0, 160) : '';
  const number = typeof inputDelivery.number === 'string' ? inputDelivery.number.trim().slice(0, 20) : '';
  const deliveryNote = typeof inputDelivery.deliveryNote === 'string' ? inputDelivery.deliveryNote.trim().slice(0, 300) : '';
  const stations = [
    'itaim-paulista',
    'jardim-helena-vila-mara',
    'sao-miguel-paulista',
    'comendador-ermelino',
    'usp-leste',
    'engenheiro-goulart',
    'tatuape',
  ];
  if (name.length < 2 || phone.length < 8
    || (receiveMethod === 'nearby' && (!street || !number))
    || (receiveMethod === 'station' && !stations.includes(station))) {
    return jsonResponse({ error: 'Confira seu nome, telefone e local de entrega ou retirada.' }, 400);
  }
  const delivery = receiveMethod === 'nearby'
    ? { name, whatsapp: phone, receiveMethod, street, number, deliveryNote }
    : { name, whatsapp: phone, receiveMethod, station };

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: catalog, error: catalogError } = await admin
    .from('products')
    .select('id,name,price')
    .eq('active', true)
    .in('id', [...quantitiesByProduct.keys()]);
  if (catalogError) {
    console.error('Could not load product catalog.', catalogError);
    return jsonResponse({ error: 'Não foi possível validar os produtos. Tente novamente.' }, 500);
  }
  if (!catalog || catalog.length !== quantitiesByProduct.size) {
    return jsonResponse({ error: 'Um ou mais produtos não estão disponíveis para compra.' }, 400);
  }

  const productsById = new Map(catalog.map((product) => [product.id, product]));
  const snapshots: Array<{
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    color: string;
    product_type: string;
  }> = [];
  for (const line of lines.values()) {
    const product = productsById.get(line.productId);
    if (!product) return jsonResponse({ error: 'Um produto não está disponível para compra.' }, 400);
    snapshots.push({
      product_id: line.productId,
      product_name: product.name,
      unit_price: Number(product.price),
      quantity: line.quantity,
      color: line.color,
      product_type: line.type,
    });
  }
  const total = Math.round(snapshots.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      item_count: snapshots.reduce((sum, item) => sum + item.quantity, 0),
      customer_name: name,
      customer_phone: phone,
      delivery,
      items_snapshot: snapshots,
    })
    .select('id,total')
    .single();
  if (orderError || !order) {
    console.error('Could not create pending order.', orderError);
    return jsonResponse({ error: 'Não foi possível criar o pedido. Tente novamente.' }, 500);
  }

  let paymentResponse: Response;
  try {
    paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id,
      },
      body: JSON.stringify({
        transaction_amount: Number(order.total),
        description: `Pedido KahLima ${order.id}`,
        payment_method_id: 'pix',
        payer: { email: user.email, first_name: name.slice(0, 80) },
        external_reference: order.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: { order_id: order.id },
      }),
    });
  } catch (error) {
    console.error('Could not reach Mercado Pago to create PIX payment.', error);
    const { error: updateError } = await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    if (updateError) console.error('Could not mark unreachable PIX payment as failed.', updateError);
    return jsonResponse({ error: 'Não foi possível conectar ao Mercado Pago. Tente novamente.' }, 502);
  }
  let payment: MercadoPagoPayment;
  try {
    const responseBody: unknown = await paymentResponse.json();
    if (!responseBody || typeof responseBody !== 'object') throw new Error('Invalid Mercado Pago response body.');
    payment = responseBody as MercadoPagoPayment;
  } catch (error) {
    console.error('Mercado Pago returned an unreadable payment response.', error);
    const { error: updateError } = await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    if (updateError) console.error('Could not mark unreadable PIX payment as failed.', updateError);
    return jsonResponse({ error: 'O Mercado Pago retornou uma resposta inválida. Tente novamente.' }, 502);
  }
  const transaction = payment.point_of_interaction?.transaction_data;
  if (!paymentResponse.ok || !payment.id || payment.payment_method_id !== 'pix'
    || !transaction?.qr_code) {
    console.error('Mercado Pago did not create the PIX payment.', payment.status, payment.message);
    const { error: updateError } = await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    if (updateError) console.error('Could not mark rejected PIX payment as failed.', updateError);
    return jsonResponse({ error: 'O Mercado Pago não conseguiu gerar o Pix. Tente novamente.' }, 502);
  }

  const { error: updateError } = await admin
    .from('orders')
    .update({ payment_id: String(payment.id) })
    .eq('id', order.id);
  if (updateError) {
    console.error('Could not associate Mercado Pago payment to order.', updateError);
    return jsonResponse({ error: 'O Pix foi iniciado, mas não foi possível atualizar o pedido. Entre em contato com a loja.' }, 500);
  }

  return jsonResponse({
    orderId: order.id,
    paymentId: String(payment.id),
    total: Number(order.total),
    qrCode: transaction.qr_code,
    qrCodeBase64: transaction.qr_code_base64 || '',
    ticketUrl: transaction.ticket_url || '',
  });
});
