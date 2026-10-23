$ErrorActionPreference = 'Stop'

function ConvertTo-PlainText([System.Security.SecureString]$Secret) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$accessToken = Read-Host 'Cole o Access Token de teste do Mercado Pago (nao sera exibido)' -AsSecureString
$webhookSecret = Read-Host 'Cole a assinatura secreta do webhook (nao sera exibida)' -AsSecureString
$accessTokenText = [regex]::Replace((ConvertTo-PlainText $accessToken), '[\s\p{Cf}\p{Cc}]', '')
$webhookSecretText = (ConvertTo-PlainText $webhookSecret).Trim()
$envPath = Join-Path ([IO.Path]::GetTempPath()) ("kah-lima-mp-secrets-{0}.env" -f [Guid]::NewGuid())
$encoding = New-Object System.Text.UTF8Encoding($false)

try {
  if ([string]::IsNullOrWhiteSpace($accessTokenText) -or [string]::IsNullOrWhiteSpace($webhookSecretText)) {
    throw 'Os dois valores são obrigatórios. Rode o script novamente e preencha ambos.'
  }
  if ($accessTokenText -notmatch '^[\x21-\x7E]+$') {
    throw 'O Access Token contém caracteres incompatíveis com cabeçalhos HTTP. Confira se copiou o Access Token de teste, não a Public Key ou o Client ID.'
  }

  $contents = "MERCADO_PAGO_ACCESS_TOKEN=$accessTokenText`nMERCADO_PAGO_WEBHOOK_SECRET=$webhookSecretText"
  [IO.File]::WriteAllText($envPath, $contents, $encoding)
  & npx --yes supabase secrets set --env-file $envPath
  if ($LASTEXITCODE -ne 0) {
    throw 'Nao foi possivel cadastrar os secrets no Supabase.'
  }
  Write-Host 'Secrets cadastrados no Supabase.'
} finally {
  if (Test-Path -LiteralPath $envPath) {
    Remove-Item -LiteralPath $envPath -Force
  }
  $accessTokenText = $null
  $webhookSecretText = $null
  $accessToken = $null
  $webhookSecret = $null
}
