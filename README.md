# Plataforma de Analytics para Performance Esportiva

> Projeto de Pós-Graduação — Business Intelligence e Analytics com dados do Strava

Solução completa de BI/Analytics que consome dados da API do Strava, realiza processos ETL automatizados, modela os dados dimensionalmente em PostgreSQL, expõe APIs via FastAPI e apresenta dashboards interativos em React com Machine Learning para análises de clustering de treinos.

## Arquitetura

```
Strava API → ETL (Python/Pandas) → PostgreSQL (Star Schema) → FastAPI → React Dashboard
                                                              ↓
                                                       ML Engine (scikit-learn)
```

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts, shadcn/ui, TanStack Query |
| Backend | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Uvicorn |
| ETL | Pandas, NumPy, httpx, APScheduler, loguru, tenacity |
| Banco de Dados | PostgreSQL 15, psycopg2-binary |
| Machine Learning | scikit-learn, KMeans, StandardScaler, joblib |
| Deploy | Vercel (frontend), Railway (backend + PostgreSQL), GitHub Actions |

## Estrutura do Projeto

```
strava-analytics-platform/
├── frontend/          # React + Vite + Tailwind
├── backend/           # FastAPI + SQLAlchemy
├── etl/               # Pipeline ETL Python
├── database/          # Scripts SQL (DDL + seeds)
└── docs/              # Documentação e diagramas
```

## Início Rápido (Desenvolvimento Local)

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- Conta no [Strava Developers](https://www.strava.com/settings/api)

### 1. Clonar e configurar variáveis

```bash
git clone https://github.com/mhnakashima/strava-analytics-platform.git
cd strava-analytics-platform
cp .env.example .env
# Edite .env com suas credenciais Strava e banco
```

### 2. Subir o banco com Docker

```bash
docker-compose up -d postgres
```

### 3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
# API disponível em http://localhost:8000
# Docs em http://localhost:8000/docs
```

### 4. ETL

```bash
cd etl
pip install -r requirements.txt
python scheduler.py          # Inicia o cron job
python -m runner --once      # Execução única manual
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:5173
```

## Autenticação Strava

1. Acesse `http://localhost:5173` e clique em **Conectar com Strava**
2. Autorize o app no Strava (escopo: `read_all,activity:read_all`)
3. Você será redirecionado de volta ao app autenticado
4. O ETL sincronizará suas atividades automaticamente

## Deploy

- **Frontend**: Push para `main` → deploy automático no Vercel
- **Backend**: Dockerfile incluído → deploy no Railway
- **PostgreSQL**: Serviço gerenciado no Railway
- **ETL Scheduler**: Serviço separado no Railway com cron diário

## Dashboards

| Dashboard | Descrição |
|-----------|-----------|
| Estratégico | KPIs globais, evolução de pace, volume anual, ranking |
| Tático | Heatmap de atividades, radar de performance, zonas cardíacas |
| Operacional | Tabelas de atividades, segmentos, leaderboards |
| ML | Clusters de treino (leve/moderado/intenso), perfil de intensidade |

## Modelos de Machine Learning

- **KMeans (k=3)**: Clusterização de treinos por pace, distância, FC e elevação
- **Futuro**: Previsão de fadiga (XGBoost), pace-alvo (Random Forest), anomalias (Isolation Forest)

## Licença

GPL-3.0 — veja [LICENSE](LICENSE)
