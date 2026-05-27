# Velozty - Supabase Auth Email Templates

Use estes templates no Supabase Dashboard:

1. `Authentication` -> `Email Templates`
2. Cole o HTML no template correspondente
3. Ajuste os assuntos sugeridos

## 1) Confirm Signup

Suggested subject:

`Confirme seu cadastro na Velozty`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirme seu cadastro - Velozty</title>
  </head>
  <body style="margin:0;padding:0;background:#06070d;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06070d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1020;border:1px solid #22263d;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 8px 24px;text-align:center;">
                <div style="font-size:28px;font-weight:900;letter-spacing:0.5px;color:#ffffff;">
                  VELO<span style="color:#c6ff00;">ZTY</span>
                </div>
                <p style="margin:10px 0 0 0;color:#9ea3b4;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                  Crie corridas. Desafie amigos. Chegue primeiro.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">Confirme seu e-mail</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <p style="margin:0;color:#c5c9d8;font-size:15px;line-height:1.6;">
                  Recebemos seu cadastro na Velozty. Para ativar sua conta e entrar no app, confirme seu endereço de e-mail no botão abaixo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 8px 24px;" align="center">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#ff2bd6;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:12px;">
                  Confirmar cadastro
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 20px 24px;">
                <p style="margin:0;color:#8d93a8;font-size:12px;line-height:1.6;">
                  Se o botão não funcionar, copie e cole este link no navegador:<br />
                  <span style="word-break:break-all;color:#b3b8ca;">{{ .ConfirmationURL }}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#0a0c18;border-top:1px solid #1a1f35;">
                <p style="margin:0;color:#7d8397;font-size:11px;line-height:1.5;">
                  Você recebeu este e-mail porque foi feito um cadastro com este endereço em Velozty.
                  Se não foi você, ignore esta mensagem.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 2) Magic Link (Sign In)

Suggested subject:

`Seu acesso rápido à Velozty`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Entrar na Velozty</title>
  </head>
  <body style="margin:0;padding:0;background:#06070d;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06070d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1020;border:1px solid #22263d;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 8px 24px;text-align:center;">
                <div style="font-size:28px;font-weight:900;letter-spacing:0.5px;color:#ffffff;">
                  VELO<span style="color:#c6ff00;">ZTY</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">Acesso rápido</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <p style="margin:0;color:#c5c9d8;font-size:15px;line-height:1.6;">
                  Use o botão abaixo para entrar na sua conta Velozty.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 8px 24px;" align="center">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c6ff00;color:#0a0c18;text-decoration:none;font-weight:800;font-size:15px;padding:14px 24px;border-radius:12px;">
                  Entrar na Velozty
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 20px 24px;">
                <p style="margin:0;color:#8d93a8;font-size:12px;line-height:1.6;">
                  Se não foi você quem solicitou acesso, ignore este e-mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 3) Reset Password

Suggested subject:

`Redefina sua senha na Velozty`

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redefinir senha - Velozty</title>
  </head>
  <body style="margin:0;padding:0;background:#06070d;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06070d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1020;border:1px solid #22263d;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 8px 24px;text-align:center;">
                <div style="font-size:28px;font-weight:900;letter-spacing:0.5px;color:#ffffff;">
                  VELO<span style="color:#c6ff00;">ZTY</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 8px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">Redefinir senha</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <p style="margin:0;color:#c5c9d8;font-size:15px;line-height:1.6;">
                  Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 8px 24px;" align="center">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#ff2bd6;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:12px;">
                  Redefinir senha
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 20px 24px;">
                <p style="margin:0;color:#8d93a8;font-size:12px;line-height:1.6;">
                  Se você não solicitou essa alteração, ignore este e-mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Observações rápidas

- Variável principal de link no Supabase Auth templates: `{{ .ConfirmationURL }}`.
- Mantenha `Site URL` e `Redirect URLs` corretos em `Authentication` -> `URL Configuration`.
- Como o app já usa redirects para `/login`, os links de confirmação/reset voltam para o fluxo certo.
