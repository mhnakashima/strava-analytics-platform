# Guia de Deploy — Vercel + Render + Neon (Free Tier)

## Stack Recomendada — 100% Gratuita

```
GitHub (main)
    │
    ├──▶ Vercel     → Frontend React
    ├──▶ Render     → Backend FastAPI
    ├──▶ Neon       → PostgreSQL (serverless)
    └──▶ GitHub Actions (cron 02:00 UTC) → ETL Scheduler
```

| Serviço | Plano | Limites relevantes |
|---------|-------|-------------------|
| [Vercel](https://vercel.com) | Hobby (free) | Ilimitado para SPAs |
| [Render](https://render.com) | Free | 512MB RAM, dorme após 15min ocioso |
| [Neon](https://neon.tech) | Free | 0.5GB storage, 10 conexões simultâneas |
| GitHub Actions | Free | 2.000 min/mês (mais que suficiente) |

> **Alternativa ao Neon**: [Supabase](https://supabase.com) (free tier: 500MB, também PostgreSQL).  
> **Alternativa ao Render**: [Fly.io](https://fly.io) free tier (3 VMs compartilhadas).

---

## 1. PostgreSQL — Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. **New Project** → escolha região (ex: `us-east-1`)
3. Após criar, vá em **Connection Details** e copie a connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
4. Popule o schema — use o **SQL Editor** do Neon ou qualquer cliente:
   ```sql
   -- Cole o conteúdo de database/migrations/001_initial_schema.sql
   -- Cole o conteúdo de database/seeds/seed_dim_date.sql
   -- Cole o conteúdo de database/seeds/seed_dim_activity_type.sql
   ```

> O `sslmode=require` já está incluso na connection string do Neon. O código detecta automaticamente e habilita SSL.

---

## 2. Backend FastAPI — Render

1. Acesse [render.com](https://render.com) e conecte sua conta GitHub
2. **New → Web Service**
3. Selecione o repositório `strava-analytics-platform`
4. Configure:

   | Campo | Valor |
   |-------|-------|
   | **Root Directory** | `backend` |
   | **Environment** | Docker |
   | **Instance Type** | Free |
   | **Health Check Path** | `/health` |

5. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |----------|-------|
   | `DATABASE_URL` | Connection string do Neon (com `?sslmode=require`) |
   | `STRAVA_CLIENT_ID` | Seu client_id do Strava |
   | `STRAVA_CLIENT_SECRET` | Seu client_secret do Strava |
   | `STRAVA_REDIRECT_URI` | `https://<seu-app>.onrender.com/auth/callback` |
   | `JWT_SECRET` | String aleatória 32+ chars |
   | `CORS_ORIGINS` | `https://<seu-app>.vercel.app` |

6. Deploy → copie o domínio gerado (`https://xxx.onrender.com`)

> **Atenção free tier**: o Render dorme após 15 minutos sem requisições e demora ~30s para acordar na primeira chamada. Para um projeto pessoal/acadêmico é aceitável. Se quiser evitar, use o [UptimeRobot](https://uptimerobot.com) (free) para pingar `/health` a cada 10min.

---

## 3. ETL Scheduler — GitHub Actions

O ETL roda como um **workflow agendado** no GitHub Actions — sem servidor adicional.

### Configurar Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|--------|-------|
| `DATABASE_URL` | Connection string do Neon |
| `STRAVA_CLIENT_ID` | Seu client_id do Strava |
| `STRAVA_CLIENT_SECRET` | Seu client_secret do Strava |

O workflow `.github/workflows/etl.yml` já está configurado:
- Executa automaticamente às **02:00 UTC** todos os dias
- Pode ser acionado manualmente pelo painel do GitHub (**Actions → ETL — Daily Strava Sync → Run workflow**)
- Logs ficam disponíveis por 14 dias em **Artifacts**

### Verificar execução

```
GitHub → Actions → ETL — Daily Strava Sync
```

---

## 4. Frontend — Vercel

1. Acesse [vercel.com](https://vercel.com) e importe o repositório
2. Configure:

   | Campo | Valor |
   |-------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

3. Em **Environment Variables**:

   | Variável | Valor |
   |----------|-------|
   | `VITE_API_URL` | `https://<seu-backend>.onrender.com` |

4. Deploy → seu app está em `https://<projeto>.vercel.app`

> O `vercel.json` já configura o SPA rewrite para o React Router funcionar corretamente.

---

## 5. Strava OAuth — Configuração final

Após ter os domínios definitivos, atualize em [strava.com/settings/api](https://www.strava.com/settings/api):

- **Authorization Callback Domain**: `<seu-backend>.onrender.com`

E atualize a variável no Render:
```
STRAVA_REDIRECT_URI = https://<seu-backend>.onrender.com/auth/callback
```

---

## 6. Verificação

```bash
# Health check
curl https://<backend>.onrender.com/health
# → {"status":"ok","service":"strava-analytics-api"}

# Swagger docs
https://<backend>.onrender.com/docs

# Trigger ETL manual
https://github.com/mhnakashima/strava-analytics-platform/actions
```

---

## Alternativa — Supabase no lugar do Neon

[Supabase](https://supabase.com) também oferece PostgreSQL gratuito e tem um dashboard mais completo:

1. **New Project** no Supabase
2. Vá em **Settings → Database → Connection string → URI**
3. A string tem o formato:
   ```
   postgresql://postgres:<senha>@db.<id>.supabase.co:5432/postgres
   ```
4. Use exatamente essa string como `DATABASE_URL` — o SSL é detectado automaticamente

---

## Resumo de Variáveis por Serviço

### GitHub Actions Secrets
```
DATABASE_URL          → neon/supabase connection string
STRAVA_CLIENT_ID      → do painel strava.com/settings/api
STRAVA_CLIENT_SECRET  → do painel strava.com/settings/api
```

### Render (Backend)
```
DATABASE_URL          → neon/supabase connection string
STRAVA_CLIENT_ID      → igual ao GitHub Actions
STRAVA_CLIENT_SECRET  → igual ao GitHub Actions
STRAVA_REDIRECT_URI   → https://<render-url>/auth/callback
JWT_SECRET            → gerado com: python -c "import secrets; print(secrets.token_hex(32))"
CORS_ORIGINS          → https://<vercel-url>.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL          → https://<render-url>.onrender.com
```
