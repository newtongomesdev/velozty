# Integração Strava

Este app já tem a base pronta para conectar uma conta Strava sem expor segredo no frontend.

## Variáveis

- `NEXT_PUBLIC_STRAVA_CLIENT_ID` ou `VITE_STRAVA_CLIENT_ID`: usado pelo app para abrir a tela de autorização.
- `STRAVA_CLIENT_SECRET`: deve existir apenas no servidor ou em uma Edge Function. Nunca use `VITE_` para esse segredo.

## Fluxo preparado

1. O usuário clica em `Conectar Strava` em Configurações.
2. O Strava redireciona para `/app/strava/callback` com um `code`.
3. Uma função de backend deve trocar esse `code` por tokens usando o `client_secret`.
4. Os tokens devem ser gravados em `public.strava_connections`.
5. Uploads futuros de atividade exigem escopo `activity:write`.

Referências:

- https://developers.strava.com/docs/authentication/
- https://developers.strava.com/docs/uploads/
- https://communityhub.strava.com/developers-knowledge-base-14
