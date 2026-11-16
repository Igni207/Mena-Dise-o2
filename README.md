# Casa Carmín — sitio de presentación

Página de una sola pantalla larga para presentar el proyecto final **Casa Carmín**.
Es un sitio estático: HTML, CSS y JavaScript, sin instalar nada. Las librerías ya vienen en `vendor/`.

## Estructura

```
index.html          la página (todas las secciones, en orden)
css/styles.css      estilos: variables, plano, piezas, secciones, responsive
js/main.js          construcción de láminas + escenas con scroll (GSAP)
js/ink.js           la tinta que sigue al mouse
js/model3d.js       visor 3D del modelo (Three.js)
js/gallery.js       galería ampliada y video
vendor/             gsap, ScrollTrigger, Lenis, Three.js
media/              fotos, renders, modelo y video
vercel.json         configuración de caché para Vercel
```

## Archivos que faltan en `media/`

Cuando una imagen no existe, la página muestra el recuadro con su nombre. Al agregar el archivo con **ese nombre exacto**, aparece sola.

| Archivo | Dónde va | Formato sugerido |
|---|---|---|
| `00-portada.jpg` / `.webp` | Portada (ya está) | 1600–2000 px de ancho |
| `02-implantacion.jpg` | 02 Implantación | horizontal 16:9 |
| `03-cruce.jpg` | 03 Volumetría | render o isometría |
| `04-celosia-detalle.jpg` | 04 Celosías, chica | vertical u horizontal |
| `04-celosia.jpg` | 04 Celosías, grande | vertical |
| `06-doble-altura.jpg` | 05 Interior | vertical 4:5 |
| `05-pasarela.jpg` | 06 Tubo carmín (pantalla completa) | horizontal, 2000 px |
| `g1.jpg` … `g6.jpg` | 08 Galería | variados |
| `recorrido.mp4` | 09 Recorrido | H.264, 1080p, idealmente < 50 MB |
| `09-final.jpg` | 10 Epílogo | horizontal panorámica |
| `casa-carmin.glb` | 07 Modelo 3D | ver abajo |

**Peso:** fotos en JPG calidad ~80, 300–600 KB cada una (2000 px de ancho como máximo).
Si el video pesa más de 100 MB, GitHub no lo acepta: subilo a YouTube o Vimeo y pegá el enlace de
inserción en `data-embed` de la sección Recorrido (`index.html`, busca `data-embed=""`).

## Modelo 3D

El visor está en la sección Memoria (`js/model3d.js`, hecho con Three.js; la librería está en `vendor/three-casa.min.js`).
Carga `media/casa-carmin.glb`, que trae la animación de despiece exportada de Revit: las piezas caen, quedan
separadas por niveles y se arman. Esa animación avanza con el scroll. Se gira arrastrando; en celular, con el botón «Girar».

Para reemplazar el modelo por una versión nueva:

1. Exportar el `.glb` (con o sin animación).
2. Comprimirlo: `npx gltfpack -i modelo.glb -o media/casa-carmin.glb -cc -kn -km -ke -af 0`
3. Listo: el encuadre y las vistas se calculan solos. Los textos de cada vista están al principio de `js/model3d.js`.

> El modelo no trae normales: el visor dibuja caras planas. El modelo solo se ve con la página servida
> (Vercel o `npx serve .`), no abriendo el archivo con doble clic.

## Probar en la compu

Abrir `index.html` con doble clic funciona para casi todo. Para probar igual que en Vercel (incluido el modelo 3D):

```
npx serve .
```

y abrir la dirección que aparece (por ejemplo `http://localhost:3000`). También sirve la extensión **Live Server** de VS Code.

## Publicar: GitHub + Vercel

1. Crear un repositorio nuevo en GitHub (por ejemplo `casa-carmin`).
2. Subir el contenido de esta carpeta. Con Git:
   ```
   git init
   git add .
   git commit -m "Casa Carmín"
   git branch -M main
   git remote add origin https://github.com/USUARIO/casa-carmin.git
   git push -u origin main
   ```
   O con **GitHub Desktop**, o arrastrando los archivos en la web de GitHub (archivos de hasta 25 MB por la web).
3. En [vercel.com](https://vercel.com) → **Add New → Project** → importar el repositorio.
   Framework: **Other**. Sin comando de build. Directorio: la raíz. **Deploy**.
4. Cada vez que se sube un cambio a GitHub, Vercel actualiza la página sola.

## Al reemplazar una imagen (importante)

Todos los archivos se piden con un número de versión, por ejemplo `media/03-cruce.jpg?v=20261116b`.
Así ningún navegador muestra una copia vieja guardada. **Cada vez que reemplaces una imagen, un estilo o un script
conservando el mismo nombre**, cambiá ese número en `index.html` (buscar `v=20261116b` y reemplazar todo por uno nuevo,
por ejemplo `v=20261120a`). Si la imagen tiene un nombre nuevo, no hace falta.

## Dónde cambiar cosas

- **Colores y medidas:** `css/styles.css`, sección 1 (variables).
- **Textos:** directamente en `index.html`.
- **Créditos:** en `index.html`, busca `[Autor]`.
- **Tinta:** grosor, duración y colores al principio de `js/ink.js`.
- **Animaciones:** `js/main.js`, sección 4.3 (una escena por sección) y 4.4 (cursor, botones magnéticos, sello, títulos).

Respeta “reducir movimiento” del sistema: con esa opción la página se muestra completa, sin animaciones ni tinta.
