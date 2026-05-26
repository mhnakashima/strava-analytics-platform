# Guia de Deploy — Railway + Vercel

## Visão Geral

```
GitHub ──push──▶ Railway (Backend + ETL + PostgreSQL)
             └──▶ Vercel  (Frontend React)
```

Todos os serviços fazem deploy automático a cada push em `main`.

---

## 1. PostgreSQL no Railway

1. Acesse [railway.app](https://railway.app) e crie um novo projeto
2. Clique em **New Service → Database → PostgreSQL**
3. Após criar, vá em **Variables** e copie o valor de `DATABASE_URL`
4. Guarde esse valor — você vai usá-lo nos outros serviços

**Após o banco subir, popule as dimensões:**

```bash
# Conecte via psql ou o painel do Railway
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f database/seeds/seed_dim_date.sql
psql "$DATABASE_URL" -f database/seeds/seed_dim_activity_type.sql
```

> No Railway, você pode executar esses scripts pela aba **Query** do serviço PostgreSQL.

---

## 2. Backend FastAPI no Railway

1. No mesmo projeto, clique em **New Service → GitHub Repo**
2. Selecione `mhnakashima/strava-analytics-platform`
3. Em **Settings → Source**, defina:
   - **Root Directory**: `backend`
   - **Watch Paths**: `backend/**`
4. Railway detecta o `Dockerfile` e `railway.toml` automaticamente
5. Vá em **Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência ao serviço) |
| `STRAVA_CLIENT_ID` | Seu client_id do Strava |
| `STRAVA_CLIENT_SECRET` | Seu client_secret do Strava |
| `STRAVA_REDIRECT_URI` | `https://<seu-dominio>.up.railway.app/auth/callback` |
| `JWT_SECRET` | String aleatória de 32+ chars |
| `JWT_EXPIRE_MINUTES` | `1440` |
| `CORS_ORIGINS` | `https://seu-app.vercel.app` |

> `PORT` é injetado automaticamente pelo Railway — **não defina manualmente**.

6. Após o deploy, copie o domínio gerado (ex: `strava-backend.up.railway.app`)

---

## 3. ETL Scheduler no Railway

1. No mesmo projeto, clique em **New Service → GitHub Repo** (mesmo repositório)
2. Em **Settings → Source**, defina:
   - **Root Directory**: `etl`
   - **Watch Paths**: `etl/**`
3. Railway usa o `Dockerfile` e `railway.toml` do diretório `etl/`
4. Vá em **Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `STRAVA_CLIENT_ID` | Seu client_id do Strava |
| `STRAVA_CLIENT_SECRET` | Seu client_secret do Strava |
| `ETL_SCHEDULE_HOUR` | `2` |
| `ETL_SCHEDULE_MINUTE` | `0` |
| `ETL_LOG_LEVEL` | `INFO` |

> O ETL não expõe porta HTTP — não precisa de domínio público.

---

## 4. Frontend React no Vercel

1. Acesse [vercel.com](https://vercel.com) e importe o repositório
2. Em **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Em **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://<dominio-railway-backend>.up.railway.app` |

4. Clique em **Deploy**

> O `vercel.json` já está configurado para SPA rewrite (`/* → /index.html`).

---

## 5. Configuração do Strava OAuth

Após ter os domínios definitivos, atualize em [strava.com/settings/api](https://www.strava.com/settings/api):

- **Authorization Callback Domain**: `<seu-dominio>.up.railway.app`

E atualize a variável `STRAVA_REDIRECT_URI` no Railway:
```
https://<seu-dominio>.up.railway.app/auth/callback
```

---

## 6. Verificação do Deploy

```bash
# Health check do backend
curl https://<backend>.up.railway.app/health
# → {"status":"ok","service":"strava-analytics-api"}

# Docs da API
https://<backend>.up.railway.app/docs
```

---

## Variáveis de Ambiente — Resumo

### Railway — Backend

```
DATABASE_URL         = ${{Postgres.DATABASE_URL}}
STRAVA_CLIENT_ID     = <do painel Strava>
STRAVA_CLIENT_SECRET = <do painel Strava>
STRAVA_REDIRECT_URI  = https://<backend>.up.railway.app/auth/callback
JWT_SECRET           = <string aleatória 32+ chars>
JWT_EXPIRE_MINUTES   = 1440
CORS_ORIGINS         = https://<seu-app>.vercel.app
```

### Railway — ETL

```
DATABASE_URL         = ${{Postgres.DATABASE_URL}}
STRAVA_CLIENT_ID     = <do painel Strava>
STRAVA_CLIENT_SECRET = <do painel Strava>
ETL_SCHEDULE_HOUR    = 2
ETL_SCHEDULE_MINUTE  = 0
ETL_LOG_LEVEL        = INFO
```

### Vercel — Frontend

```
VITE_API_URL = https://<backend>.up.railway.app
```

---

## Diagrama de Deploy

```
GitHub (main)
    │
    ├──▶ Railway ──▶ PostgreSQL (managed)
    │         ├──▶ Backend FastAPI  (Root: backend/)
    │         └──▶ ETL Scheduler    (Root: etl/)
    │
    └──▶ Vercel ──▶ Frontend React  (Root: frontend/)
```
