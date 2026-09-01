# La Posada del Hechicero

Prototipo comercial y funcional para la tienda de juegos de mesa y TCG de Valdivia. Incluye sitio público, calendario conectado a InsForge y un portal completo de torneos de Magic: The Gathering.

## Funcionalidades

- Vitrinas para juegos de mesa y Magic: The Gathering.
- Eventos, ubicación y contacto directo por Instagram.
- Panel privado para crear torneos con código y enlace compartible.
- Inscripción sin cuenta para jugadores y enlace privado de edición.
- Historial de versiones de cada decklist.
- Parser compatible con Moxfield, ManaBox, Arena, MTGO, MTGTop8 y texto simple.
- Validación carta por carta mediante Scryfall para Standard, Pioneer, Modern y Pauper.
- Control de mazo principal, sideboard, límite de copias y legalidad/baneos.
- Ingreso de standings y exportación ZIP preparada para el formulario de MTGTop8.

## Stack

- Next.js 16, React 19, TypeScript y Tailwind CSS.
- InsForge para PostgreSQL, autenticación y almacenamiento de imágenes.
- Scryfall como fuente de datos y legalidad de cartas.
- Despliegue previsto en Vercel.

## Configuración local

1. Copia `.env.example` a `.env.local` y completa las credenciales.
2. Instala dependencias con `pnpm install`.
3. Inicia el proyecto con `pnpm dev`.
4. Abre `http://localhost:3000`.

Variables requeridas:

```text
NEXT_PUBLIC_INSFORGE_URL=
NEXT_PUBLIC_INSFORGE_ANON_KEY=
INSFORGE_URL=
INSFORGE_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/posada.delhechicero/
PDH_ADMIN_EMAILS=admin@example.com,otro-admin@example.com
```

El panel usa el SSO de Google de InsForge. `PDH_ADMIN_EMAILS` es una lista privada, separada por comas, punto y coma o espacios, y es la autoridad para conceder acceso: una cuenta autenticada solo entra si su correo verificado aparece allí. Al autorizarse por primera vez se registra automáticamente en `pdh_admins`; si deja de estar permitida, su registro se revoca al siguiente acceso. Las claves privadas solo se usan en el servidor y `.env.local` no se versiona.

## InsForge

El proyecto está vinculado a **DieGui Dev**. Todo el dominio de esta aplicación está aislado con el prefijo `pdh_`.

Las migraciones reproducibles están en `migrations/`:

- `20260830213000_pdh-initial-schema.sql`: catálogo, eventos, torneos, jugadores, decklists, cartas, standings y políticas RLS.
- `20260830224000_pdh-site-settings.sql`: contenido editable e imagen principal.
- `20260830233000_pdh-public-demo-content.sql`: evento público confirmado usado en la demostración.

La imagen principal está en el bucket público `pdh_media`, clave `site/posada-hero.png`. Cada registro multimedia guarda URL y clave para poder migrarlo después.

## Verificación

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Antes de desplegar en Vercel, copia las mismas variables de entorno, cambia `NEXT_PUBLIC_APP_URL` por el dominio definitivo y autoriza `<dominio>/api/auth/callback` como URL de retorno en la configuración de autenticación de InsForge.
