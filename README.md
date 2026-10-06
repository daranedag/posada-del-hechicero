# La Posada del Hechicero

Prototipo comercial y funcional para la tienda de juegos de mesa y TCG de Valdivia. Incluye sitio público, calendario conectado a InsForge y un portal completo de torneos de Magic: The Gathering.

## Funcionalidades

- Vitrinas para juegos de mesa y Magic: The Gathering.
- Eventos, ubicación y contacto directo por Instagram.
- Portada administrable con redes sociales, dirección, horarios, búsqueda de juegos y formulario que copia la consulta y abre el chat de Instagram.
- Gestión de textos, enlaces y fotografías desde `/admin/sitio`.
- Historial privado de consultas anteriores en `/admin/consultas`.
- Panel privado para crear torneos con código y enlace compartible.
- Inscripción sin cuenta para jugadores y enlace privado de edición.
- Historial de versiones de cada decklist.
- Parser compatible con Moxfield, ManaBox, Arena, MTGO, MTGTop8 y texto simple.
- Validación carta por carta mediante Scryfall para Standard, Pioneer, Modern y Pauper.
- Control de mazo principal, sideboard, límite de copias y legalidad/baneos.
- Ingreso de standings y exportación ZIP preparada para el formulario de MTGTop8.

## Stack

- Next.js 16, React 19, TypeScript y Tailwind CSS.
- InsForge para PostgreSQL y autenticación; ImageKit para las nuevas imágenes.
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
- `20260904010000_pdh-site-content.sql`: secciones de la portada, textos repetibles, fotografías, consultas y políticas RLS.
- `20260909010000_allow-deadline-after-start.sql`: permite definir el cierre de listas antes o después del inicio del torneo.

El modelo editorial usa exclusivamente tablas con prefijo `pdh_`:

- `pdh_site_sections`: encabezado, título, descripción, orden y visibilidad de cada sección.
- `pdh_site_items`: textos y enlaces repetibles, como redes, dirección y filas de horario.
- `pdh_site_media`: fotografías por sección; conserva URL y clave de almacenamiento para poder eliminarlas correctamente.
- `pdh_contact_submissions`: historial de consultas privadas anteriores; el formulario actual no guarda mensajes en la base de datos.

Las imágenes existentes en InsForge siguen funcionando. Las nuevas imágenes se suben a ImageKit y se vinculan en `pdh_site_media`: `image_url` contiene la URL pública y `image_key` guarda `imagekit:<fileId>`. No se necesita una migración. Quitar o reemplazar una imagen de ImageKit en el sitio conserva el archivo en la biblioteca, porque puede estar usado en otras secciones. Los archivos subidos que todavía no se guardaron también quedan disponibles allí.

## ImageKit en local

Completa estas variables en `.env.local` (ya están documentadas en `.env.example`):

```dotenv
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/tu_imagekit_id
IMAGEKIT_UPLOAD_FOLDER=/posada-del-hechicero
```

Obtén las claves en [ImageKit > Developer options > API keys](https://imagekit.io/docs/api-keys) y copia el URL endpoint de tu cuenta. La clave debe permitir listar, consultar y subir archivos. `IMAGEKIT_UPLOAD_FOLDER` es opcional y usa `/posada-del-hechicero` si no se define. La clave privada nunca se envía al navegador; el servidor autoriza cada subida con una firma temporal de diez minutos. No agregues el prefijo `NEXT_PUBLIC_` a la clave privada.

Reinicia `pnpm dev` después de cambiar las variables: Next.js permite las imágenes del dominio y la ruta de `IMAGEKIT_URL_ENDPOINT`. También admite un dominio personalizado HTTPS configurado en ImageKit.

Para probar:

1. Inicia sesión con un correo de `PDH_ADMIN_EMAILS` y abre `/admin/sitio`.
2. En Fotografías de una sección, usa **Subir imagen** (JPG, PNG, WebP, AVIF o GIF de hasta 5 MB) o **Explorar ImageKit**. La biblioteca muestra imágenes públicas de toda la cuenta, con búsqueda por nombre y paginación.
3. Selecciona una imagen y revisa su vista previa y URL. Completa el texto alternativo, pie y orden; pulsa **Guardar foto** para vincularla en la base de datos y verla en la portada.
4. En una foto existente, selecciona otra imagen y guarda para reemplazarla. **Cancelar selección** conserva la imagen previa.
5. Comprueba la reutilización en dos secciones: quitarla de una no debe romper la otra.

La subida es directa desde el navegador a ImageKit para evitar el límite de cuerpo de las funciones del alojamiento. Antes de guardar, el servidor vuelve a consultar el archivo por su ID y comprueba que sea una imagen pública compatible; no confía en una URL enviada por el formulario. Si falta configuración o falla ImageKit, la biblioteca muestra el error y permite reintentar.

## Verificación

### Publicaciones de Instagram

La sección Redes muestra hasta tres publicaciones recientes de `@posada.delhechicero`
cuando `IG_TOKEN` está configurado en `.env.local` o en las variables privadas del
alojamiento. El token se usa únicamente en el servidor y no debe tener el prefijo
`NEXT_PUBLIC_`. Los resultados se almacenan en la caché de Next.js y se revalidan
al recibir visitas, con un intervalo de 15 minutos. No es una tarea programada.
Las tarjetas muestran portadas de carruseles o miniaturas de video y enlazan a
Instagram. Si no hay token, falla la consulta, la respuesta está vacía o pertenece
a otra cuenta, se conserva la galería configurada en `/admin/sitio`.

Esta integración todavía no renueva el token automáticamente. Antes de su
vencimiento debe renovarse y actualizarse en el alojamiento. La renovación
automática requiere guardar el token vigente y su vencimiento en almacenamiento
privado modificable y ejecutar una tarea programada; una variable de entorno no
se actualiza por sí sola. La cuenta personal de prueba no se utiliza.

Prueba específica: `pnpm exec node --experimental-strip-types --test tests/instagram-posts.test.ts`.

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Antes de desplegar en Vercel, copia las mismas variables de entorno, cambia `NEXT_PUBLIC_APP_URL` por el dominio definitivo y autoriza `<dominio>/api/auth/callback` como URL de retorno en la configuración de autenticación de InsForge.

## Calendario de eventos

- `/eventos`: calendario mensual con hoy destacado, detalle por día, actividades habituales y especiales. Los estados se calculan con la hora de Chile. Las consultas copian un mensaje con el nombre, fecha y hora del evento y abren Instagram; el visitante lo pega y envía.
- `/admin/eventos`: calendario de administración y lista paginada de programaciones, incluidos borradores, historial y cancelaciones. Los eventos son independientes de los torneos y no gestionan inscripciones ni cupos.
- **Nuevo evento** permite definir fecha, inicio, término (mismo día o siguiente), categoría, descripción, ubicación e imagen opcional mediante la biblioteca de ImageKit. Al duplicar se crea un borrador para revisar antes de publicar.
- **Repetir semanalmente** admite varios días y una fecha de término opcional. El horario se conserva en `America/Santiago`, incluso al cambiar el horario de verano. Si una hora recurrente no existe durante el cambio de hora, se adelanta una hora; los formularios avisan si se intenta programar directamente una hora inexistente.
- Al editar una fecha semanal, **Solo esta fecha** crea una excepción; **Esta fecha y las siguientes** divide la programación sin cambiar su historial. Las excepciones posteriores se conservan si todavía pertenecen a la nueva programación. Cancelar una sesión la marca como cancelada; cancelar un evento especial o una programación la retira de la vista pública.

La migración `20260915010000_pdh-event-calendar.sql` agrega campos de repetición a `pdh_events`, la tabla `pdh_event_exceptions` y la función transaccional `pdh_save_calendar_event`. Las escrituras se realizan exclusivamente desde acciones de servidor que verifican al administrador. Los visitantes solo pueden leer información publicada. No se modifican las tablas de torneos.

El backend vinculado usa InsForge 2.0.2: no dispone de ramas ni del gestor nuevo de migraciones. Esta migración se aplicó mediante la CLI con `scripts/insforge-sql.mjs`, después de un ensayo SQL reversible. El script ejecuta todo como una única operación atómica; `--rehearse` revierte tanto esquema como datos de prueba. No vuelvas a aplicar una migración ya aplicada.

Validación:

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm build
# Integración con el backend configurado, sin cambios persistentes:
pnpm exec node --env-file=.env.local tests/event-calendar-access.mjs
pnpm exec node scripts/insforge-sql.mjs --rehearse tests/event-calendar-db.sql
# Con pnpm dev --hostname 127.0.0.1 --port 3100 activo y Chrome en macOS:
pnpm exec node tests/event-calendar-browser.mjs
```

La prueba de navegador crea una ruta local temporal con fixtures, comprueba el calendario y el editor sin enviar formularios y la elimina al terminar. Las capturas se guardan en `/tmp/pdh-calendar-*.png`. No crea eventos ni envía mensajes a Instagram.
