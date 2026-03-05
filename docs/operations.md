# Operations

## Comandos principales

- Migrar schema:
```bash
npm run migrate
```

- Seed de datos:
```bash
npm run seed
```

- Crear/actualizar admin:
```bash
ADMIN_EMAIL=admin@draxton.local ADMIN_PASSWORD=StrongPassword123 npm run create-admin
```

## Flujo recomendado tras cambios de schema Prisma

1. Actualizar `prisma/schema.prisma`.
2. Crear migración (entorno local de desarrollo):
```bash
npx prisma migrate dev --name <cambio>
```
3. Subir cambios de `schema.prisma` y `prisma/migrations`.
4. En despliegue:
```bash
npm run migrate
```

## Backup / restore de Postgres (docker compose)

- Backup:
```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

- Restore:
```bash
cat backup.sql | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Resolución rápida de incidencias

- Error de conexión a DB:
  - Validar `DATABASE_URL`.
  - Confirmar `docker compose ps`.
  - Revisar logs: `docker compose logs db app`.

- Migración pendiente:
```bash
docker compose exec app npm run migrate
```

- Login falla:
  - Comprobar usuario en tabla `User`.
  - Regenerar admin con `npm run create-admin`.
  - Verificar `AUTH_SECRET` consistente entre reinicios.

