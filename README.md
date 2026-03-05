# Draxton Project Manager

Aplicación interna para gestión de proyectos, tareas y riesgos.

## Stack

- Next.js (App Router)
- Prisma ORM
- PostgreSQL
- Docker / Docker Compose

## Configuración inicial

1. Copiar variables:
```bash
cp .env.example .env
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar migraciones:
```bash
npm run migrate
```

4. Seed opcional:
```bash
npm run seed
```

5. Crear admin:
```bash
ADMIN_EMAIL=admin@draxton.local ADMIN_PASSWORD=StrongPassword123 npm run create-admin
```

6. Levantar app:
```bash
npm run dev
```

## Uso con Docker (recomendado para equipo)

### Desarrollo

```bash
docker compose up --build
```

Servicios:
- app: `http://localhost:3000`
- db: `localhost:5432`

### Producción (profile)

```bash
docker compose --profile prod up --build
```

## Comandos operativos

- Migraciones: `npm run migrate`
- Seed: `npm run seed`
- Crear admin: `npm run create-admin`

## Documentación adicional

- `docs/deployment.md`
- `docs/operations.md`

## Notas de seguridad / repositorio

- No commitear `.env`.
- No commitear `prisma/dev.db` (legacy SQLite local).

