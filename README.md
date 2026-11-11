# Laboratorio de Física II versión 1.1.0

Abre **INICIAR.cmd** con doble clic y entra a la dirección Local que indique la ventana (normalmente http://127.0.0.1:3000). Mantén esa ventana abierta mientras usas el simulador. Necesitas Node.js instalado; no necesitas clave de Gemini ni cuenta.

También puedes abrir esta carpeta en Visual Studio Code y ejecutar:

```powershell
npm install
npm run dev
```

Para validar o compilar:

```powershell
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

No abras index.html con doble clic: el simulador necesita un servidor HTTP.

## Mejoras recuperadas

- Fondo azul grisáceo claro y paneles blancos, con mejor contraste.
- Hasta diez cargas puntuales, líneas de campo, equipotenciales 2D, superficie de potencial constante y sonda SI.
- Lanzamiento de carga de prueba en campo eléctrico no uniforme, con escala normalizada.
- Capacitancia dependiente de la inserción parcial del dieléctrico.
- Redes de resistencias en serie, paralelo y mixtas, valores por resistencia y gráfica I–V.
- Corrección del selector de velocidades, paso temporal y radio de giro para una dirección arbitraria de B.
- Exportación de mediciones a CSV y experimentos guiados.
- Bibliotecas 3D empaquetadas en la compilación, sin depender de un CDN para ejecutarlas.

El manual se abre desde el simulador o desde `manual.html`. Consulta `INFORME-TECNICO.md` para arquitectura, algoritmos, validación y guion del video.

## Alcance

Los campos magnéticos son uniformes. Los anillos son referencias visuales: todavía no se calcula el campo espacial de imanes o cables. Los circuitos son redes resistivas predefinidas, sin editor libre ni transitorios RC. Para completar los entregables del profesor faltan publicar el repositorio, grabar el video de 5 a 10 minutos y realizar la defensa. El informe debe completarse con integrantes y resultados propios antes de entregarlo.
