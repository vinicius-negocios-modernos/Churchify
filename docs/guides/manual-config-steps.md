# Configuracao Manual — Churchify

## 1. Google OAuth no Supabase

### Pre-requisitos
- Conta Google Cloud Console com projeto criado
- Supabase dashboard acessivel

### Passos

1. **Google Cloud Console** (https://console.cloud.google.com)
   - APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://dlhkosrnyhccvgvxkvip.supabase.co/auth/v1/callback`
   - Copiar **Client ID** e **Client Secret**

2. **Supabase Dashboard** (https://supabase.com/dashboard)
   - Settings > Auth > Providers > Google
   - Enabled: ON
   - Client ID: colar o ID do passo anterior
   - Client Secret: colar o secret do passo anterior
   - Save

3. **Verificar**
   - Acessar a app e clicar em "Login com Google"
   - Deve redirecionar para Google e retornar autenticado

## 2. GEMINI_API_KEY no Supabase Edge Functions

### Pre-requisitos
- Chave de API do Google Gemini (https://aistudio.google.com/apikey)
- Supabase CLI instalado e linkado

### Passos

```bash
# Definir o secret
supabase secrets set GEMINI_API_KEY=sua-chave-aqui

# Verificar que foi definido
supabase secrets list
```

### Verificar
- Criar um episodio na app e gerar conteudo
- A Edge Function `generate-content` deve retornar resultados do Gemini

## 3. Branch Protection (Informativo)

O push direto para `main` funciona porque o usuario e admin do repositorio. Para PRs de terceiros, os required checks (lint, typecheck, test, build) funcionam corretamente.

Para bloquear push direto mesmo para admins:
- GitHub > Settings > Branches > main > Edit
- Marcar "Do not allow bypassing the above settings"
