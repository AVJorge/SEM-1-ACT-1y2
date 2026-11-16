# Crecer, medir y proyectar · Módulo 13

Material interactivo de apoyo para las **Actividades integradoras 1 y 2 del Módulo 13** de Prepa en Línea-SEP. Explica los procedimientos con datos de ejemplo, sin dar los resultados de las actividades. Un selector en la parte superior cambia entre las dos actividades; cada una tiene su propio enlace (`#ai1` y `#ai2`).

## Actividad integradora 1 · Crecimiento en la isla

| Sección | Qué hace el estudiante |
|---|---|
| 1. Sumar o multiplicar | Compara el crecimiento lineal con el exponencial en una tabla y una gráfica. |
| 2. La fórmula | Interpreta P = P₀ · bᵗ y aprende a resolver primero la potencia. |
| 3. Tabla y sustitución | Construye la tabla semana por semana (semana, sustitución en t, resultado) y su gráfica. Los valores disponibles (P₀ = 3, 5 o 6; b = 3, 4 o 5) no coinciden con los de la actividad. |
| 4. ¿Cuándo se rebasa el límite? | Identifica la primera semana que rebasa un límite y calcula el exceso. No hay límite de 300. |
| 5. Hoja de cálculo | Consulta las fórmulas con `^`, `&` y `SI`. |
| 6. Consecuencias | Analiza recursos, ecosistema, salud y personas, con una estructura para el ejemplo de la hoja 2. |
| 7–8 | Tres preguntas con retroalimentación y lista de revisión. |

## Actividad integradora 2 · ¿Cuántas casas más?

| Sección | Qué hace el estudiante |
|---|---|
| 1. ¿Qué es una tasa? | Calcula la tasa de crecimiento paso a paso con un municipio ficticio. |
| 2. Comparar dos lugares | Compara las tasas de dos municipios ficticios y distingue el aumento en viviendas del aumento en porcentaje. |
| 3. Leer las gráficas | Interpreta una gráfica de líneas (viviendas) y una de columnas (tasas). |
| 4. Proyectar a 2050 | Proyecta con 6 periodos de 5 años y lo compara con el error común de multiplicar la tasa por 6. |
| 5. Tu estado | Sigue los pasos para usar el archivo Viviendas_INEGI. |
| 6. Tu documento | Ve un modelo de cómo presentar fórmula, sustitución y resultado en el procesador de textos, y las fórmulas si usa hoja de cálculo. |
| 7–8 | Tres preguntas con retroalimentación y lista de revisión. |

Los datos de Valle Verde y Costa Azul son **ficticios** y solo sirven para practicar.

## Estructura

```
index.html          Página principal
assets/styles.css   Estilos
assets/app.js       Lógica interactiva (sin dependencias)
.nojekyll           Evita que GitHub Pages procese los archivos con Jekyll
tests/test_page.py  Prueba automatizada (opcional)
```

## Publicar en GitHub Pages

1. Crea un repositorio público (por ejemplo, `AI-1-Y-2--MODULO-13-PL`).
2. Sube el contenido de esta carpeta. Verifica que `styles.css` y `app.js` queden dentro de la carpeta `assets`.
3. Ve a **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. Comparte la dirección con `#ai1` o `#ai2` al final.

## Prueba automatizada (opcional)

```
pip install playwright
python -m playwright install chromium
python tests/test_page.py "$(pwd)"
```
