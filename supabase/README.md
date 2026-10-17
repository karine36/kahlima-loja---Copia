# Supabase, pedidos e Mercado Pago

A autenticação de clientes usa o Supabase Auth. A tabela `profiles` guarda apenas o
nome e o telefone; e-mails e senhas ficam sob responsabilidade do Supabase Auth.

## Conectar um projeto

1. Crie um projeto no Supabase.
2. Copie a URL do projeto e a chave **Publishable** para `js/supabase-config.js`.
   Essa chave é pública e pode estar no navegador. Nunca use `service_role` ou uma
   chave secreta no frontend.
3. Instale o Supabase CLI e vincule o projeto:

   ```sh
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```

4. Em **Authentication → URL Configuration**, configure a URL do site e as URLs de
   redirecionamento HTTPS usadas pela loja. Autorize também o endereço HTTPS exato
   da loja para o fluxo de recuperação de senha. Ative a confirmação de e-mail.
5. Sirva o site por HTTP/HTTPS; abrir `index.html` diretamente como arquivo não é uma
   configuração de hospedagem.

Para desenvolvimento local, inicie o Supabase CLI com Docker (`supabase start`) e
aplique a migration com `supabase db reset`. Use a URL local e a chave pública exibidas
por `supabase status`.

## Contas e perfis

As migrations em `migrations/` criam automaticamente um perfil quando uma conta é
registrada. A migration `20261005222000_add_cpf_to_profiles.sql` adiciona CPF único e
obrigatório para novas contas; aplique-a em projetos que já aplicaram a migration
inicial. Perfis existentes podem continuar sem CPF até que seus dados sejam atualizados.
As políticas de Row Level Security permitem que cada cliente leia e atualize somente o
próprio perfil. A senha nunca é copiada para a tabela `profiles`.

Clientes que esquecerem a senha devem usar **Esqueci minha senha** na tela de login.
O Supabase envia um link temporário ao e-mail cadastrado; o cliente abre o link e define
uma nova senha. Configure um provedor SMTP de produção em **Authentication → SMTP
Settings** para garantir a entrega dos e-mails de recuperação. Senhas existentes não
podem ser consultadas pelo lojista.

O Supabase JS é carregado pelo CDN oficial antes da aplicação; a configuração pública
do frontend fica em `js/supabase-config.js`. Nunca coloque tokens do Mercado Pago ou
chaves `service_role` nesse arquivo.

## Mercado Pago (PIX)

1. No painel do Mercado Pago, crie uma aplicação e obtenha primeiro as credenciais de
   **teste**. Configure o webhook para o evento de pagamentos e copie o segredo de
   assinatura exibido pelo Mercado Pago.
2. Aplique as migrations pendentes no projeto vinculado:

   ```sh
   supabase db push
   ```

   A migration `20261006010000_add_orders_and_pix.sql` cria o catálogo de preços
   validado pelo servidor, pedidos e itens, políticas RLS e a função que registra os
   itens somente após a confirmação. Os preços iniciais do catálogo precisam acompanhar
   os preços de `js/products.js`; mantenha ambos sincronizados ao alterar o catálogo.
3. Cadastre os segredos no Supabase, sem aspas ao redor dos valores:

   ```sh
   supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN
   supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET=SEU_SEGREDO_DO_WEBHOOK
   ```

   O Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY` às Edge Functions. Não publique nem compartilhe a chave
   `service_role` ou os tokens do Mercado Pago.
4. Publique as funções:

   ```sh
   supabase functions deploy create-pix-payment
   supabase functions deploy mercadopago-webhook --no-verify-jwt
   ```

   A primeira função exige uma sessão Supabase válida e cria uma cobrança PIX com valor
   calculado no servidor. O webhook é público por necessidade, mas valida a assinatura
   HMAC do Mercado Pago e consulta a cobrança diretamente na API antes de confirmar.
5. Faça um pedido de teste com as credenciais de teste e conclua o pagamento pelo meio
   de pagamento de teste indicado pelo Mercado Pago. Para produção, troque o token pelas
   credenciais de produção, publique novamente as funções e confirme a URL de notificação
   de pagamentos no painel Mercado Pago.

Os pedidos são criados como pendentes para associar a cobrança. Somente depois de o
webhook confirmar um pagamento aprovado em BRL, os registros de `order_items` são
gravados. O cliente autenticado pode consultar apenas os próprios pedidos e itens; a
chave secreta e a confirmação de pagamento permanecem no servidor. A tela atualiza o
status do Pix automaticamente e mostra os produtos pagos na seção **Pedidos**.

## Retomada da configuração da loja

Estado registrado em 06/10/2026:

- Supabase CLI autenticado via `npx` e projeto `mogljohafdvxeeazhwwh` vinculado.
- As migrations de perfil já existiam no banco, então foram conferidas e marcadas como
  aplicadas no histórico. A estrutura de pedidos/PIX também já existia e foi verificada
  (tabelas, RLS, políticas, função protegida e 10 produtos); a migration
  `20261006010000_add_orders_and_pix.sql` foi marcada como aplicada sem recriar objetos.
- Webhook de teste criado no Mercado Pago com evento **Pagamentos (legacy)**. O URL de
  teste configurado é `https://mogljohafdvxeeazhwwh.supabase.co/functions/v1/mercadopago-webhook`.
  A assinatura secreta e o Access Token de teste estão com a responsável; nunca registrar
  seus valores neste repositório, no frontend ou em mensagens.
- O catálogo local agora contém 23 produtos com IDs únicos. As sugestões de preço
  preenchidas para os produtos novos são provisórias e ainda precisam ser comparadas
  com custo, embalagem, frete e margem antes de ativar vendas.
- Duas migrations de catálogo foram criadas depois da última sincronização:
  `20261006231700_update_sewing_kit_price.sql` e
  `20261006233000_sync_product_catalog.sql`. Elas atualizam o preço do kit de costura
  e sincronizam nomes/preços/IDs em `public.products`; aplique-as com `supabase db push`
  somente depois de aprovar os preços.
- Ainda pendente: cadastrar `MERCADO_PAGO_ACCESS_TOKEN` e
  `MERCADO_PAGO_WEBHOOK_SECRET` como secrets no Supabase; publicar as duas Edge
  Functions; testar uma compra PIX completa e confirmar o registro do pagamento e
  dos produtos em `orders`/`order_items`.
- Antes da publicação para clientes: revisar que frete e estoque ainda não são
  calculados/reservados no servidor; confirmar SMTP e URL de recuperação de senha;
  configurar credenciais e webhook de produção após os testes.

Ao retomar, confira primeiro os preços finais em `js/products.js` e compare cada ID e
preço com `public.products`. Não reutilize IDs: eles também são referências dos itens
de pedidos já gravados. Só depois de aprovar e sincronizar o catálogo, continue com os
secrets e o deploy descritos na seção Mercado Pago acima. Não rode `db reset`: o
histórico remoto já registra as três migrations iniciais como aplicadas.
