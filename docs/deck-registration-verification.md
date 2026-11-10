# Verificación de inscripción de decks — 10 de noviembre de 2026

Se probó el manejador real de `POST /api/tournaments/[code]/submit` con consultas reales a Scryfall y escrituras en la rama `migration-insforge-20261109` de Neon. Los jugadores, torneos y decks usados como fixtures se eliminaron al terminar. Las consultas a producción fueron exclusivamente de lectura.

## Problemas encontrados y corregidos

| Problema reproducido | Corrección |
| --- | --- |
| «Isla» se rechazaba porque Scryfall devolvía tanto Island como una impresión de Plains con ese nombre español. | La búsqueda de tierras básicas españolas utiliza su nombre canónico y comprueba el nombre impreso de la respuesta. Los demás nombres ambiguos siguen sin elegirse automáticamente. |
| Las líneas sin cantidad, con cantidad cero o con un formato incorrecto se omitían; el resto del deck podía inscribirse. | Se rechaza la lista indicando las líneas que deben corregirse. Se conservan los encabezados, categorías y comentarios reconocidos. |
| Una lista con «Opt» y «Optar» validaba correctamente, pero Neon rechazaba el guardado por repetir el nombre canónico en una misma zona. | Se suman las cantidades de los alias antes de guardar. Mazo y sideboard permanecen separados; el límite de copias se comprueba entre ambos. |

## Evidencia

- **23 comprobaciones de integración aprobadas:** inscripción en inglés, edición en español con historial, guardado del nombre y apellido, arquetipo, cantidades, nombres canónicos, identificadores Scryfall/Oracle y legalidad. También se comprobaron rechazos por datos vacíos, email incorrecto, cartas inexistentes o mal escritas, cartas prohibidas o no legales en Pioneer, exceso de copias, tamaño del mazo y sideboard, token incorrecto, plazo vencido y torneo cerrado. Un fallo simulado de Scryfall impide guardar. RLS oculta los datos privados.
- Los rechazos comprobados no agregaron jugadores, versiones ni cartas. Al terminar quedaron cero registros de los fixtures.
- **55 pruebas locales aprobadas**, incluidas regresiones de los tres fallos, nombres de varias caras y consultas en lotes de hasta 75 cartas.
- TypeScript, ESLint y compilación de producción aprobados.
- Producción y ensayo tienen las mismas columnas, restricciones y configuración de formatos en las tablas de inscripción. Los formatos configurados son Modern, Standard, Pauper y Pioneer.
- En producción se revisaron las **23 versiones existentes**: todas tienen cantidades de mazo y sideboard coherentes con su detalle guardado. Esto comprueba integridad de cantidades; no revalida su legalidad histórica contra las prohibiciones actuales.

## Repetir la comprobación

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:decks:neon
```

La integración exige el archivo privado `.env.neon-migration.local` y verifica la identidad de la rama de ensayo antes de crear fixtures. No debe apuntarse a producción.

Los cambios están en el código local. No se modificó el esquema de Neon ni se desplegó una nueva versión del sitio. La prueba de inscripción se ejecutó mediante el manejador del servidor; no constituye una prueba del formulario en el navegador del sitio publicado.
