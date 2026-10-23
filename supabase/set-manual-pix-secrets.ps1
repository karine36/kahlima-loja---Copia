$ErrorActionPreference = 'Stop'
Write-Host 'Configurador Pix manual v2 (aceita chave aleatoria EVP).'

function ConvertTo-PlainText([System.Security.SecureString]$Secret) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Read-PixKeySecurely {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Configurar chave Pix'
  $form.StartPosition = 'CenterScreen'
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.ClientSize = New-Object System.Drawing.Size(460, 145)
  $form.TopMost = $true

  $label = New-Object System.Windows.Forms.Label
  $label.Text = 'Cole a chave Pix aleatoria (EVP). O valor ficara oculto.'
  $label.AutoSize = $true
  $label.Location = New-Object System.Drawing.Point(15, 18)
  $form.Controls.Add($label)

  $keyTextBox = New-Object System.Windows.Forms.TextBox
  $keyTextBox.Location = New-Object System.Drawing.Point(18, 48)
  $keyTextBox.Size = New-Object System.Drawing.Size(424, 25)
  $keyTextBox.UseSystemPasswordChar = $true
  $form.Controls.Add($keyTextBox)

  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Continuar'
  $ok.Location = New-Object System.Drawing.Point(260, 94)
  $ok.Size = New-Object System.Drawing.Size(85, 30)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)

  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Cancelar'
  $cancel.Location = New-Object System.Drawing.Point(355, 94)
  $cancel.Size = New-Object System.Drawing.Size(85, 30)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)

  $form.AcceptButton = $ok
  $form.CancelButton = $cancel
  $form.Add_Shown({ $keyTextBox.Focus() })
  $result = $form.ShowDialog()
  $secureKey = $null
  if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $secureKey = ConvertTo-SecureString $keyTextBox.Text -AsPlainText -Force
  }
  $keyTextBox.Clear()
  $form.Dispose()
  return $secureKey
}

$pixKey = Read-PixKeySecurely
if (-not $pixKey) {
  throw 'A janela da chave Pix foi cancelada ou ficou vazia. Rode o script novamente e cole a chave no campo mascarado.'
}
$merchantName = Read-Host 'Nome que aparecera no QR (Enter para KAHLIMA VENDAS)'
$merchantCity = Read-Host 'Cidade do recebedor (Enter para SAO PAULO)'
$pixKeyText = [regex]::Replace((ConvertTo-PlainText $pixKey).Trim(), '[\s\p{Cf}\p{Cc}]', '')
if ([string]::IsNullOrWhiteSpace($merchantName)) { $merchantName = 'KAHLIMA VENDAS' }
if ([string]::IsNullOrWhiteSpace($merchantCity)) { $merchantCity = 'SAO PAULO' }
$envPath = Join-Path ([IO.Path]::GetTempPath()) ("kah-lima-manual-pix-{0}.env" -f [Guid]::NewGuid())
$encoding = New-Object System.Text.UTF8Encoding($false)

try {
  if ([string]::IsNullOrWhiteSpace($pixKeyText)) {
    throw 'A chave Pix ficou vazia. Rode o script novamente e cole a chave aleatoria completa.'
  }
  if ($pixKeyText -notmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
    throw "A chave nao esta no formato de chave aleatoria EVP (UUID 8-4-4-4-12). Rode o configurador Pix manual v2. Nenhum conteudo da chave foi exibido."
  }
  $pixKeyText = $pixKeyText.ToLowerInvariant()

  $contents = "MANUAL_PIX_KEY=$pixKeyText`nMANUAL_PIX_MERCHANT=$merchantName`nMANUAL_PIX_CITY=$merchantCity"
  [IO.File]::WriteAllText($envPath, $contents, $encoding)
  & npx --yes supabase secrets set --env-file $envPath
  if ($LASTEXITCODE -ne 0) {
    throw 'Nao foi possivel cadastrar a configuracao do Pix manual no Supabase.'
  }
  Write-Host 'Configuracao do Pix manual cadastrada no Supabase.'
} finally {
  if (Test-Path -LiteralPath $envPath) {
    Remove-Item -LiteralPath $envPath -Force
  }
  $pixKeyText = $null
  $pixKey = $null
}
