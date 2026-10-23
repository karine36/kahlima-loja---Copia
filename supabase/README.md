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
2. A tabela `public.products` está sincronizada com o catálogo atual do site por meio
   da migration `20261017180000_sync_current_product_catalog.sql`. Ao alterar produtos
   ou preços, crie uma migration de sincronização com os mesmos IDs e valores antes de
   aceitar novas compras.

3. Cadastre os segredos no Supabase. No PowerShell, na pasta raiz do projeto, rode:

   ```sh
   .\supabase\set-mercadopago-secrets.ps1
   ```

   O script solicita os valores sem exibi-los e remove o arquivo temporário após o
   envio. Use o Access Token de teste e a assinatura do webhook já configurado. Os dois
   valores precisam ser diferentes: o Access Token é da aplicação do Mercado Pago, e a
   assinatura do webhook é outra credencial. O script remove espaços no começo e no fim
   dos valores; não cole quebras de linha junto com as credenciais. Nunca inclua essas
   credenciais no frontend, em arquivos commitados ou em mensagens. O Supabase fornece `SUPABASE_URL`,
   `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às Edge Functions.
4. Publique as funções:

   ```sh
   npx --yes supabase functions deploy create-pix-payment
   npx --yes supabase functions deploy mercadopago-webhook --no-verify-jwt
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

Estado registrado em 17/10/2026:

- Supabase CLI autenticado via `npx` e projeto `mogljohafdvxeeazhwwh` vinculado.
- As migrations de perfil já existiam no banco, então foram conferidas e marcadas como
  aplicadas no histórico. A estrutura de pedidos/PIX também já existia e foi verificada
  (tabelas, RLS, políticas, função protegida e 10 produtos); a migration
  `20261006010000_add_orders_and_pix.sql` foi marcada como aplicada sem recriar objetos.
- Webhook de teste criado no Mercado Pago com evento **Pagamentos (legacy)**. O URL de
  teste configurado é `https://mogljohafdvxeeazhwwh.supabase.co/functions/v1/mercadopago-webhook`.
  A assinatura secreta e o Access Token de teste estão com a responsável; nunca registrar
  seus valores neste repositório, no frontend ou em mensagens.
- A migration `20261017180000_sync_current_product_catalog.sql` foi aplicada ao banco
  remoto. Foram conferidos 27 produtos ativos com IDs, nomes e preços iguais aos do
  catálogo local. O SKU antigo `KL-508` está inativo; não foi excluído, para preservar
  referências históricas de pedidos.
- Os secrets `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` foram
  cadastrados no Supabase com o script `set-mercadopago-secrets.ps1`; não consultar,
  registrar ou compartilhar seus valores.
- As Edge Functions `create-pix-payment` (JWT obrigatório) e `mercadopago-webhook`
  (JWT desligado para receber notificações assinadas) estão publicadas e ativas.
  Uma chamada de smoke test sem assinatura retornou HTTP 401 como esperado.
- Ainda pendente: fazer uma compra de teste completa, confirmar a aprovação PIX e
  verificar que os itens aparecem em `orders`/`order_items`.
- Antes da publicação para clientes: revisar que frete e estoque ainda não são
  calculados/reservados no servidor; confirmar SMTP e URL de recuperação de senha;
  configurar credenciais e webhook de produção após os testes.

## Pix com conferência manual

Enquanto as credenciais do Mercado Pago não estiverem aceitando pagamentos, o checkout
pode usar uma chave Pix da loja diretamente. Isso não cria uma cobrança no Mercado Pago
nem confirma o pagamento automaticamente.

1. Aplique a migration que habilita o provedor manual:

   ```sh
   npx --yes supabase db push
   ```

2. Na raiz do projeto, cadastre a chave Pix da loja. A chave é solicitada como entrada
   oculta e não deve ser enviada em mensagens:

   ```powershell
   .\supabase\set-manual-pix-secrets.ps1
   ```

   O nome e a cidade são exibidos dentro do QR Pix; confirme-os antes de aceitar pedidos.
   A chave fica guardada como secret no Supabase, não no código do site.
3. Publique a função atualizada:

   ```sh
   npx --yes supabase functions deploy create-pix-payment
   ```

O QR contém o valor exato do pedido e um identificador. A cliente pode tocar em **Já
paguei**, o que apenas sinaliza a conferência; isso não altera o status para pago. A
responsável da loja confere o crédito no aplicativo do banco (não aceite apenas
comprovante) e confirma o pedido no painel administrativo. A confirmação insere os
produtos em `order_items`.

Para liberar o painel para a conta proprietária já cadastrada no Supabase Auth, aplique
a migration e execute uma vez no SQL Editor, substituindo o endereço pelo e-mail da
conta proprietária:

```sql
insert into public.store_admins (user_id)
select id
from auth.users
where email = 'EMAIL_DA_CONTA_PROPRIETARIA'
on conflict (user_id) do nothing;
```

Para os novos objetos do painel, aplique a migration:

```sh
npx --yes supabase db push
```

Depois entre novamente na loja. A opção **Conferir pagamentos** mostra os pedidos Pix,
contato, endereço/estação, produtos e quantidades. A função de confirmação valida a
permissão de administradora no banco; clientes não podem acessar dados de outros pedidos
nem confirmar pagamentos.

Na área administrativa, pedidos pendentes ou pagos podem ser cancelados com uma mensagem
personalizada de até 500 caracteres. O cliente verá o aviso em **Notificações** e no
resumo do pedido. Para pedidos já pagos, o total fica registrado como valor a devolver;
essa marcação não transfere dinheiro. A devolução deve ser realizada manualmente pelo
banco e conferida pela loja. Pedidos cancelados antes da confirmação do pagamento não
recebem um valor de devolução registrado.

Ao retomar, o catálogo, os secrets e as funções já estão no Supabase remoto. Faça
login na loja, gere um Pix de teste, conclua o pagamento pela conta compradora de teste
do Mercado Pago e confirme o pedido e os produtos nas tabelas `orders` e `order_items`.
Não rode `db reset`: as migrations e o catálogo já foram aplicados no projeto remoto.
