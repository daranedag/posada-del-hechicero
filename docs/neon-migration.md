# Migración de InsForge a Neon — 9 de noviembre de 2026

Destino: proyecto `posada-del-hechicero` (`aged-glitter-54886997`), base `neondb`, región `aws-sa-east-1`.

El respaldo `20261109_030829.sql.gz` contiene varios proyectos. Se extraen exclusivamente las 15 tablas `public.pdh_*`, sus datos, claves, restricciones, índices, triggers y funciones. SHA-256 del archivo: `ec4384e9196ccacade6cd683e93aee8c0d7581ab5f5b1af2fb5a7f6398aa9054`.

| Tabla | Registros |
| --- | ---: |
| pdh_admins | 3 |
| pdh_contact_submissions | 0 |
| pdh_deck_cards | 715 |
| pdh_deck_submissions | 23 |
| pdh_event_exceptions | 1 |
| pdh_events | 2 |
| pdh_formats | 4 |
| pdh_players | 19 |
| pdh_products | 0 |
| pdh_site_items | 10 |
| pdh_site_media | 4 |
| pdh_site_sections | 6 |
| pdh_site_settings | 1 |
| pdh_standings | 11 |
| pdh_tournaments | 6 |
| **Total original** | **805** |

Se agregan **3 identidades** en `pdh_users`: únicamente los usuarios referenciados por administradores o propietarios de torneos. Se conservan UUID, correo, verificación, perfil y fechas. No se importan contraseñas, tokens, sesiones ni cuentas de otros proyectos. Las dos claves foráneas a `auth.users` pasan a `pdh_users`. Las sesiones anteriores requieren iniciar sesión nuevamente con Google en Neon Auth; el primer acceso con correo verificado autorizado enlaza el nuevo identificador de Neon con el UUID original. Una identidad ya enlazada no se puede reasignar a otra cuenta.

Se conservan las funciones `pdh_save_calendar_event`, `pdh_save_calendar_event_with_registration`, `pdh_event_is_public` y `pdh_clear_deleted_tournament_link`. `system.update_updated_at` se reemplaza por `public.pdh_update_updated_at`, sin importar tablas internas de InsForge.

Las lecturas públicas usan una transacción con `SET LOCAL ROLE pdh_reader`. RLS conserva los filtros de publicación y visibilidad; las tablas privadas no tienen políticas públicas. Las funciones de escritura no son ejecutables por este rol. Las escrituras administrativas validan la sesión de Neon y `PDH_ADMIN_EMAILS` en el servidor. Las inscripciones públicas mantienen la validación de sus datos y tokens privados.

Las fotografías actuales de `pdh_site_media` ya apuntan a ImageKit o archivos locales. El único objeto histórico de InsForge es `pdh_media/site/posada-hero.png`, referenciado por `pdh_site_settings`. Ese servicio ya no responde; la consulta de configuración resuelve esa URL a la copia existente `public/images/posada-hero.png`. El valor original en la base se conserva para verificar el respaldo exactamente. No se necesita importar las tablas internas de almacenamiento.

## Importación reproducible

La migración de esquema revisable está en `migrations/neon/20261109_pdh.sql`. Los datos permanecen en el respaldo privado y nunca se incluyen en esa migración ni en Git. Las migraciones SQL antiguas en la raíz de `migrations/` son históricas y no deben ejecutarse contra Neon.

```sh
# Inspección local y generación del esquema, sin conexión:
pnpm exec node scripts/neon-backup.mjs prepare 20261109_030829.sql.gz

# Primero en una rama nueva y vacía:
neon checkout migration-insforge-20261109 --create --no-env-pull
neon env pull --file .env.neon-migration.local
pnpm exec node --env-file=.env.neon-migration.local scripts/neon-backup.mjs import

# Pruebas con fixtures, exclusivamente en la rama migration-*:
pnpm exec node --conditions=react-server --import tsx --env-file=.env.neon-migration.local tests/neon-integration.ts

# Verificación de todos los datos, sin modificaciones:
pnpm exec node --env-file=.env.neon-migration.local scripts/neon-backup.mjs verify
```

El importador exige una conexión directa, rechaza destinos que ya tienen tablas `pdh_` y ejecuta esquema, importación y comprobación en una sola transacción. Cualquier error revierte la operación. Compara el contenido completo de cada tabla mediante COPY de ida y vuelta y SHA-256 de las filas ordenadas, además de verificar los seis campos migrados de los usuarios. El informe privado queda en `.migration/<rama>-verification.json`. La verificación contra el respaldo original corresponde al momento de migración: escrituras reales posteriores cambiarán legítimamente los resultados.

La rama de ensayo se conserva para revisión. El origen y el respaldo permanecen disponibles; no se elimina la base de InsForge. Para volver al código anterior, también hay que restaurar sus variables de entorno anteriores desde el respaldo local privado y desplegar esa versión de la aplicación. No ejecutar otra importación sobre datos de producción existentes.

## Configuración de la aplicación

`DATABASE_URL` es agrupada; `DATABASE_URL_UNPOOLED` es directa. `NEON_AUTH_BASE_URL` corresponde a la misma rama. `NEON_AUTH_COOKIE_SECRET` es un secreto privado aleatorio de al menos 32 caracteres. `PDH_ADMIN_EMAILS`, las credenciales de ImageKit y el token de Instagram mantienen sus funciones. `.env.local`, `.neon`, el archivo comprimido y `.migration/` están excluidos de Git.

Antes de desplegar el sitio, configurar estas variables en el alojamiento y registrar el origen HTTPS definitivo con `neon neon-auth domain add https://tu-dominio`. Google compartido de Neon está habilitado para desarrollo; para producción configurar el proveedor Google con credenciales propias en Neon Auth y copiar desde su configuración la URL de retorno que debe registrarse en Google. Con el proveedor compartido actual, la comprobación real del login devuelve a `https://neonauth.c-2.sa-east-1.aws.neon.tech/auth/oauth/callback/google`. El retorno final a esta aplicación es `<NEXT_PUBLIC_APP_URL>/api/auth/callback`.

La configuración del agente utiliza Neon CLI y el plugin oficial `neon-postgres` para Codex (skills y MCP). Reiniciar Codex carga el MCP recién instalado. La CLI permite trabajar en la sesión actual.

## Resultado de la ejecución

La importación y la comparación completa con el respaldo se completaron tanto en `migration-insforge-20261109` como en `production`. `.neon` y `.env.local` quedaron apuntando a `production`.

Pasaron las 48 pruebas existentes, las pruebas de integración contra la rama de ensayo, TypeScript, ESLint y la compilación de producción. Se comprobaron en el navegador la portada, el calendario con datos reales, los seis torneos y la redirección del panel al acceso. El botón de Google llegó al selector de cuentas de Google mediante Neon Auth. El regreso desde una cuenta real, la sesión después de recargar y el cierre de sesión quedan pendientes de comprobación manual. No se inició sesión en nombre del usuario ni se desplegó el sitio al alojamiento.
