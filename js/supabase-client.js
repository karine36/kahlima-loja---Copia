(() => {
  const config = window.KAH_LIMA_SUPABASE_CONFIG;
  const url = config?.url?.trim();
  const publishableKey = config?.publishableKey?.trim();
  const configured = Boolean(
    url
      && publishableKey
      && (/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
        || /^http:\/\/(localhost|127\.0\.0\.1):54321$/i.test(url))
      && !publishableKey.includes('YOUR_'),
  );

  window.KahLimaSupabase = {
    client: configured && window.supabase?.createClient
      ? window.supabase.createClient(url, publishableKey)
      : null,
    configured,
  };
})();
