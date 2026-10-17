import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type MercadoPagoPayment = {
  id?: string | number;
  status?: string;
  message?: string;
  external_reference?: string;
  metadata?: { order_id?: string };
  transaction_amount?: number;
  payment_method_id?: string;
  currency_id?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !accessToken || !webhookSecret) {
    console.error('Webhook function secrets are not configured.');
    return jsonResponse({ error: 'Webhook não configurado.' }, 503);
  }

  const url = new URL(request.url);
  const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
  const requestId = request.headers.get('x-request-id');
  const signatureHeader = request.headers.get('x-signature');
  const signatureParts: Record<string, string> = {};
  for (const part of (signatureHeader || '').split(',')) {
    const [key, value] = part.trim().split('=').map((entry) => entry.trim());
    if (key && value) signatureParts[key] = value;
  }
  const timestamp = signatureParts.ts;
  const suppliedSignature = signatureParts.v1;
  if (!paymentId || !requestId || !timestamp || !suppliedSignature) {
    return jsonResponse({ error: 'Assinatura ou identificador de pagamento ausente.' }, 401);
  }

  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const signingKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', signingKey, new TextEncoder().encode(manifest));
  const expectedSignature = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (!constantTimeEquals(expectedSignature, suppliedSignature.toLowerCase())) {
    return jsonResponse({ error: 'Assinatura inválida.' }, 401);
  }

  let paymentResponse: Response;
  try {
    paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error('Could not reach Mercado Pago to verify webhook payment.', error);
    return jsonResponse({ error: 'Não foi possível validar o pagamento.' }, 502);
  }
  let payment: MercadoPagoPayment;
  try {
    const responseBody: unknown = await paymentResponse.json();
    if (!responseBody || typeof responseBody !== 'object') throw new Error('Invalid Mercado Pago response body.');
    payment = responseBody as MercadoPagoPayment;
  } catch (error) {
    console.error('Mercado Pago returned an unreadable webhook payment response.', error);
    return jsonResponse({ error: 'O Mercado Pago retornou uma resposta inválida.' }, 502);
  }
  if (!paymentResponse.ok) {
    console.error('Could not fetch Mercado Pago payment.', payment.status, payment.message);
    return jsonResponse({ error: 'Não foi possível validar o pagamento.' }, 502);
  }
  if (payment.status !== 'approved') return jsonResponse({ received: true, status: payment.status });

  const orderId = payment.external_reference || payment.metadata?.order_id;
  const amount = Number(payment.transaction_amount);
  if (!orderId || !Number.isFinite(amount) || payment.payment_method_id !== 'pix'
    || payment.currency_id !== 'BRL') {
    console.error('Approved Mercado Pago payment has invalid order metadata.', paymentId);
    return jsonResponse({ error: 'Dados do pagamento inválidos.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc('confirm_mercadopago_payment', {
    p_order_id: orderId,
    p_payment_id: String(payment.id),
    p_amount: amount,
  });
  if (error || data !== true) {
    console.error('Could not confirm Mercado Pago payment in Supabase.', error);
    return jsonResponse({ error: 'Não foi possível registrar a confirmação do pagamento.' }, 500);
  }

  return jsonResponse({ received: true, status: 'approved' });
});
