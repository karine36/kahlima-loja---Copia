(function () {
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
  }

  function formatPrice(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatCpf(value) {
    const digits = digitsOnly(value).slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  function isValidCpf(value) {
    const cpf = digitsOnly(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const digitAt = (length, weight) => {
      const sum = cpf
        .slice(0, length)
        .split('')
        .reduce((total, digit, index) => total + Number(digit) * (weight - index), 0);
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    return digitAt(9, 10) === Number(cpf[9]) && digitAt(10, 11) === Number(cpf[10]);
  }

  function formatPhone(value) {
    const digits = digitsOnly(value).slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase();
  }

  function avatarMarkup(profile, className = '') {
    return profile.photoUrl
      ? `<img class="profile-avatar ${className}" src="${escapeHtml(profile.photoUrl)}" alt="Foto de perfil de ${escapeHtml(profile.name)}">`
      : `<span class="profile-avatar ${className}" aria-label="Iniciais de ${escapeHtml(profile.name)}">${escapeHtml(initials(profile.name))}</span>`;
  }

  window.KahLimaUtils = { escapeHtml, formatPrice, digitsOnly, formatCpf, isValidCpf, formatPhone, initials, avatarMarkup };
})();