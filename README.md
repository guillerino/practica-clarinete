# 🎵 Práctica de notas · Clarinete

Web sencilla para que alumnos de primer año (8-9 años) practiquen:

- **Lectura del pentagrama** (clave de Sol)
- **Digitación de clarinete** (diagrama gráfico, sistema Boehm)
- **Nombre de la nota** en notación latina (Do, Re, Mi...)

Se le da a **▶ Play** y van apareciendo notas automáticamente. Cada bloque
(pentagrama / digitación / nombre) se puede activar o desactivar por separado,
así el profe decide qué ejercicio toca: ver el pentagrama y decir la digitación,
ver la digitación y decir el nombre, etc.

## Características

- Toggle independiente para pentagrama, digitación y nombre.
- Velocidad ajustable de 1 a 5 segundos por nota.
- Orden **aleatorio**, **ascendente** o **descendente**.
- **Rango de notas seleccionable** (Desde / Hasta) con atajos: Principiante,
  Primer año y Completo.
- **Botón "Siguiente"** para ir a mano sin cronómetro (o barra espaciadora en ordenador).
- **Sonido de referencia** opcional de cada nota (apagado por defecto).
- **Mantener pantalla encendida** en móvil mientras se practica (Wake Lock API).
- Diseño grande, simple y pensado para móvil.
- Los ajustes se guardan en el navegador.

## Cómo usarla en local

Abre `index.html` en el navegador. Para que funcione el sonido y el bloqueo de
pantalla conviene abrirla desde un servidor o directamente desde la web publicada.

## Publicar gratis en GitHub Pages

1. Crea una cuenta en https://github.com (si no la tienes).
2. Crea un repositorio nuevo, por ejemplo `practica-clarinete`, y márcalo como **Public**.
3. Sube todos estos archivos al repositorio (puedes arrastrarlos en la web de GitHub
   con el botón **Add file → Upload files**):
   - `index.html`
   - `styles.css`
   - `app.js`
   - `notes.js`
   - `fingering.js`
4. En el repositorio ve a **Settings → Pages**.
5. En **Source** elige la rama `main` y la carpeta `/ (root)`. Guarda.
6. Espera un minuto. GitHub te dará una URL del tipo:
   `https://TU-USUARIO.github.io/practica-clarinete/`
7. Esa es la URL que le pasas a tu primo. La puede abrir y compartir desde cualquier móvil u ordenador.

### Alternativa aún más rápida: Netlify Drop

Si prefieres no usar Git: entra en https://app.netlify.com/drop y arrastra la
carpeta con todos los archivos. Te da una URL pública al instante (gratis).

## Nota sobre las digitaciones

Las digitaciones usan el sistema Boehm estándar en una versión simplificada y
clara para principiantes. Si tu primo quiere ajustar alguna nota concreta a
como la enseña él, se edita en el archivo `fingering.js` (cada nota tiene
sus llaves marcadas como `true`/`false`).
