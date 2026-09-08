# PWA de Himnos — estado del catálogo

Implementado: manifest, iconos PNG de 192 y 512 px, icono maskable, icono Apple de 180 px, caché de los 13 recursos de la aplicación, verificación de integridad SHA-256, estado de descarga, reintento explícito e instalación cuando el navegador ofrece el diálogo. Las instrucciones para iPhone y Android aparecen al final de la app.

El catálogo contiene 340 himnos y 37 categorías. Sus rutas son #himno/numero y funcionan en hosting estático sin reglas de reescritura.

## Verificación realizada

- 14 pruebas automatizadas aprobadas: búsqueda, preferencias, recientes, tolerancia a almacenamiento bloqueado, recursos e integridad del caché, descarga fallida, respuesta sin red y activación explícita.
- Actualización real en el navegador: se detectó una nueva versión, se aplicó desde el botón y se conservó el favorito existente.
- Se apagó el servidor local y se confirmó que no respondía. Con él apagado, la aplicación se recargó, buscó «aumentame», abrió los himnos 21 y 22, guardó y retiró un favorito de prueba y abrió el 336 en una pestaña nueva.
- El servidor local se volvió a iniciar al finalizar.

## Pendiente antes de declarar producción

La instalación real y la reapertura en modo avión en iPhone/Safari y Android/Chrome aún no se han probado. La dirección 127.0.0.1 solo sirve en esta computadora. Para esas pruebas se necesita publicar por HTTPS; no se ha contratado ni publicado ningún servicio.

El almacenamiento del navegador puede ser eliminado por el usuario o por políticas de espacio del dispositivo. No se promete conservación indefinida de los datos locales. Véase la [política de almacenamiento de WebKit](https://www.webkit.org/blog/14403/updates-to-storage-policy/).

## Preparación técnica de versiones

Desde esta carpeta ejecutar `npm run build` después de cada cambio de código o datos, seguido de `npm test`. No requiere instalar dependencias. El comando genera sw.js con una versión derivada del contenido y las huellas de los recursos. Publicar el conjunto completo de archivos de una versión de forma atómica. No publicar sw-template.js en lugar de sw.js.

La nueva versión espera antes de sustituir a la activa; el botón Actualizar aplicación aplica el cambio y recarga las ventanas controladas. Los favoritos y preferencias se mantienen en localStorage, fuera del caché versionado. Referencia: [ciclo de vida de Service Worker](https://web.dev/articles/service-worker-lifecycle).

La descarga incompleta no activa la nueva versión. La reparación manual verifica las huellas de la versión activa, para evitar mezclar recursos de dos versiones. Si hay una versión nueva disponible, se ofrece actualizar.
