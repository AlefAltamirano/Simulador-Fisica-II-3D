# Informe técnico del simulador de Física II versión 1.1.0

## Objetivo y cobertura

El laboratorio permite explorar cargas puntuales, capacitores, redes resistivas y fuerza de Lorentz mediante modelos numéricos y visualización 3D. Este informe es una base técnica; el equipo debe añadir integrantes, resultados propios, capturas y conclusiones antes de entregarlo.

La unidad 1 incorpora hasta diez cargas, campo y potencial en una sonda, líneas de campo, equipotenciales 2D, una superficie de potencial constante y trayectoria eléctrica. La unidad 2 calcula capacitancia, carga y energía según geometría, voltaje y dieléctrico parcialmente insertado. La unidad 3 incorpora resistencias en serie, paralelo y mixto, valores individuales y gráfica I–V. La unidad 4 integra trayectorias en E y B uniformes.

Queda pendiente calcular campos no uniformes a partir de imanes y corrientes. Los anillos magnéticos son referencias visuales. Las redes resistivas son predefinidas: no hay editor libre ni transitorios RC. El repositorio remoto, el video y la defensa deben completarse por el equipo.

## Fundamentos físicos

La sonda usa Coulomb por superposición: E = k Σ qᵢ(P − rᵢ)/|P − rᵢ|³ y V = k Σ qᵢ/|P − rᵢ|. Convierte μC a C y muestra unidades SI. La posición exacta de una carga puntual es singular.

Para la visualización se usa k = 1 y se suaviza la distancia mediante √(r² + ε²), con ε = 0.18. Las líneas, curvas, superficies y trayectoria eléctrica están en escala normalizada. No se deben presentar esos niveles como voltios SI. La trayectoria usa masa normalizada igual a uno. Lejos de las cargas, una unidad visual de potencial equivale aproximadamente a 8987.55 V en la escala μC y m empleada.

El capacitor usa C = ε₀ A [1 + (κ − 1)f]/d para una fracción de área f ocupada por dieléctrico; se aproximan las regiones como capacitores en paralelo. Q = CV, U = CV²/2 y E = V/d. La fuente conserva V. Se ignoran pérdidas, ruptura dieléctrica y corrección de bordes; la aproximación de placas pierde precisión si la separación es comparable con su tamaño.

Para resistencias: Rserie = R1 + R2 + R3; 1/Rparalelo = 1/R1 + 1/R2 + 1/R3; Rmixto = R1 + R2R3/(R2 + R3). Se aplica I = V/Req y P = VI. Las corrientes y voltajes individuales satisfacen Kirchhoff. La velocidad de las esferas es ilustrativa.

Para Lorentz: F = q(E + v × B), a = F/m. La carga está en C y la masa en kg, con parámetros didácticos. Para B arbitrario se calcula v⊥² = |v|² − (v·B/|B|)². El radio m v⊥/(|q||B|) es una referencia de giro circular en B uniforme sin E.

## Arquitectura y algoritmos

`index.html` define navegación, canvas, telemetría y modal. `css/light.css` aclara el diseño y adapta los paneles. `js/main.js` crea escena, cámara y luces y selecciona las unidades. La telemetría se actualiza aproximadamente diez veces por segundo. El paso temporal se limita a 0.05 s para evitar grandes saltos tras inactividad.

`physicsEngine.js` contiene fórmulas e integración RK4. Los módulos originales encapsulan electrostática, capacitores y magnetismo. `resistorNetwork.js` reemplaza el circuito único por redes predefinidas. `learningTools.js` añade las equipotenciales, trayectoria eléctrica, experimentos guiados, gráfica I–V y CSV. Vite empaqueta Three.js y lil-gui para evitar imports de CDN durante la ejecución compilada.

Las líneas de campo siguen la dirección normalizada de E en pasos pequeños; terminan al aproximarse a una carga opuesta o salir del dominio. Las equipotenciales 2D usan marching triangles en 64 × 64 celdas del plano [−6,6]². La superficie usa marching tetrahedra en 22³ celdas del volumen [−5,5]³. Se interpolan cruces con el nivel seleccionado. Son aproximaciones de resolución finita y dominio acotado.

La trayectoria eléctrica usa velocity Verlet con cuatro subpasos, evaluando E en cada posición. Magnetismo usa RK4 con tres subpasos por frame y el tiempo realmente transcurrido. RK4 introduce error y no conserva exactamente la energía en integraciones arbitrariamente largas.

Se corrigió el signo de Ey en el selector: v = (3,0,0), B = (0,0,1.5) y E = (0,4.5,0). Así v × B = (0,−4.5,0) y la fuerza neta se anula. También se corrigió el cálculo de v⊥ para una dirección arbitraria de B.

## Validación reproducible

Ejecuta `npm test`. Las pruebas cubren Coulomb SI, simetría del dipolo, fórmulas del capacitor, potencia y Kirchhoff de las redes, fuerza nula del selector, cierre orbital y rapidez con RK4, radio con carga elemental, inicio de módulos 3D, límite de diez cargas, aviso de singularidad, inserción parcial del dieléctrico y generación de geometrías finitas para equipotenciales y trayectoria eléctrica.

Ejecuta `npm run build` para generar `dist`. Comprueba en el navegador las cuatro unidades, equipotenciales y superficie, lanzamiento eléctrico, retiro del dieléctrico, conexión mixta, interruptor abierto y descarga CSV. Las pruebas físicas no sustituyen esa revisión de interfaz.

## Guion del video de 5 a 10 minutos

1. Minuto 0–1: objetivo y cuatro unidades.
2. Minuto 1–3: dipolo, sonda, equipotenciales y trayectoria eléctrica; explica V = 0 con E distinto de cero.
3. Minuto 3–4: área, separación e inserción del dieléctrico; interpreta C y U.
4. Minuto 4–6: compara serie, paralelo y mixto con un ejemplo numérico.
5. Minuto 6–8: ciclotrón, hélice y selector; explica la fuerza vectorial.
6. Minuto 8–9: exporta resultados y presenta pruebas y limitaciones.

Para cada experimento registra parámetros, predicción teórica, resultado y diferencia. Identifica las escalas normalizadas y las funciones pendientes con claridad.
