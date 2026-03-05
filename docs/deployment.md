# Deployment

## 1. Requisitos

- Docker y Docker Compose plugin
- Puerto `3000` y `5432` libres

## 2. Configurar variables

1. Copia `.env.example` a `.env`.
2. Ajusta al menos:
   - `AUTH_SECRET`
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL` (local CLI)

## 3. Levantar entorno development

```bash
docker compose up --build
```

Esto levanta:
- `db` (Postgres)
- `app` (Next.js en modo dev)

La app queda en `http://localhost:3000`.

## 4. Migraciones y seed

Dentro del contenedor de app:

```bash
docker compose exec app npm run migrate
docker compose exec app npm run seed
```

## 5. Crear usuario administrador

```bash
docker compose exec \
  -e ADMIN_EMAIL=admin@draxton.local \
  -e ADMIN_PASSWORD=StrongPassword123 \
  app npm run create-admin
```

## 6. Entorno producción (compose profile)

```bash
docker compose --profile prod up --build
```

Usa:
- `app-prod` (Next.js `npm run start`)
- `db`

