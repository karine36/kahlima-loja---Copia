(() => {
  const { escapeHtml, digitsOnly, formatCpf, isValidCpf, formatPhone } = window.KahLimaUtils;

  function render(context) {
    const { state, app, goTo, storePath, setAuthenticatedUser } = context;
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
            <button type="button" class="auth-back-store" id="browse-store">Voltar à loja</button>
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
        render(context);
        app.querySelector(`[name="${state.mode === 'signup' ? 'name' : 'email'}"]`)?.focus();
      });
    });
    app.querySelector('#forgot-password')?.addEventListener('click', () => {
      state.authScreen = 'forgot';
      state.error = '';
      state.successMessage = '';
      render(context);
      app.querySelector('[name="email"]')?.focus();
    });
    app.querySelector('#back-to-login')?.addEventListener('click', () => {
      state.authScreen = 'login';
      state.mode = 'login';
      state.error = '';
      state.successMessage = '';
      render(context);
      app.querySelector('[name="email"]')?.focus();
    });
    app.querySelector('#browse-store')?.addEventListener('click', () => {
      state.authReturnToCheckout = false;
      state.authReturnHash = '';
      state.authScreen = 'login';
      state.mode = 'login';
      state.error = '';
      goTo(storePath);
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
        render(context);
        return;
      }
      if (state.authScreen === 'signup' && ![10, 11].includes(digitsOnly(phone).length)) {
        state.error = 'Digite um telefone com DDD e 10 ou 11 números.';
        state.authPhone = phone;
        render(context);
        return;
      }
      if (state.authScreen === 'signup' && !isValidCpf(cpf)) {
        state.error = 'Digite um CPF válido.';
        state.authCpf = cpf;
        render(context);
        return;
      }
      if (state.authScreen !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        state.error = 'Confira o formato do seu e-mail.';
        render(context);
        return;
      }
      if (state.authScreen !== 'forgot' && password.length < 8) {
        state.error = 'Sua senha precisa ter pelo menos 8 caracteres.';
        render(context);
        return;
      }
      if (state.authScreen === 'reset' && password !== passwordConfirmation) {
        state.error = 'As senhas não coincidem.';
        render(context);
        return;
      }

      const mode = state.mode;
      const supabase = window.KahLimaSupabase?.client;
      if (!supabase) {
        state.error = window.KahLimaSupabase?.configured
          ? 'Não foi possível iniciar o serviço de contas. Atualize a página e tente novamente.'
          : 'A conexão da conta ainda não está configurada.';
        render(context);
        return;
      }

      state.authPending = true;
      state.error = '';
      state.successMessage = '';
      render(context);

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
          setAuthenticatedUser(result.data.session.user, { showStoreOpening: true });
          return;
        } else {
          state.error = 'Não foi possível iniciar sua sessão. Tente novamente.';
        }
      } catch (error) {
        console.error('Supabase authentication request failed.', error);
        state.error = 'Não foi possível conectar ao serviço de contas. Tente novamente.';
      }

      state.authPending = false;
      render(context);
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

  window.KahLimaAuthView = { render, getAuthErrorMessage };
})();
