# Prueba automatizada del material AI1-AI2. Uso: python tests/test_page.py RUTA_DE_LA_CARPETA [CARPETA_CAPTURAS]
import sys, os, tempfile
from playwright.sync_api import sync_playwright
root = sys.argv[1]
shots = sys.argv[2] if len(sys.argv) > 2 else tempfile.mkdtemp()
errors, fails = [], []
def check(cond, msg):
    (print("OK  ", msg) if cond else (fails.append(msg), print("FAIL", msg)))
num = lambda s: float(s.replace('\xa0','').replace(' ','').replace('$','').replace('%','').replace(',',''))
VV=[48200,53900,58700,66400,73800]; CA=[31500,36100,41900,46200,52600]
rate=lambda v,k:(v[k+1]-v[k])/v[k]
with sync_playwright() as p:
    exe = os.environ.get("CHROME_PATH")
    b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    for vw in [(1280,900),(390,844)]:
        pg = b.new_page(viewport={"width":vw[0],"height":vw[1]})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"file://{root}/index.html"); pg.wait_for_timeout(300)
        print(f"--- viewport {vw}")
        txt = lambda s: pg.text_content(s).replace('\xa0',' ').strip()
        check(pg.is_visible("#act1") and not pg.is_visible("#act2"), "AI1 visible por defecto")
        # lineal vs exponencial
        rows = pg.locator("#tIdea tbody tr")
        check(rows.nth(0).locator("td").nth(8).text_content()=="45" and num(rows.nth(1).locator("td").nth(8).text_content())==6561, "tabla lineal 45 y exponencial 6 561 en semana 7")
        # tabla exponencial
        check(pg.evaluate("()=>[...document.getElementById('p0').options].every(o=>o.value!=='4')") and pg.evaluate("()=>[...document.getElementById('bf').options].every(o=>o.value!=='2')"), "no se puede elegir P0 = 4 ni factor 2")
        for _ in range(3): pg.click("#eNext")
        r = pg.locator("#eBody tr").nth(2).locator("td").all_text_contents()
        check(r[0]=="2" and "3 · 32 = 3 · 9" in r[1].replace('\xa0',' ') and r[2]=="27", f"semana 2: sustitución y resultado ({r})")
        check("Primero la potencia" in txt("#eExplain") and "3 × 3 = 9" in txt("#eExplain"), "explica la potencia primero")
        pg.click("#eAll")
        check(pg.locator("#eBody tr").count()==8 and num(pg.locator("#eBody tr").nth(7).locator("td").nth(2).text_content())==3*3**7, "8 semanas, semana 7 = 6 561")
        check(pg.locator("#cExp rect").count()==8 and "NaN" not in pg.inner_html("#cExp"), "gráfica con 8 columnas")
        pg.select_option("#p0","6"); pg.select_option("#bf","5"); pg.click("#eAll")
        check(num(pg.locator("#eBody tr").nth(7).locator("td").nth(2).text_content())==6*5**7, "P0 6, factor 5")
        # límite
        pg.select_option("#p0","3"); pg.select_option("#bf","3"); pg.select_option("#lim","500")
        check("semana 5" in txt("#limMsg") and "229" in txt("#limMsg"), f"límite 500: semana 5, exceso 229 ({txt('#limMsg')[:90]})")
        check(pg.locator("#tLim tr.over").count()==1, "resalta la primera semana que rebasa")
        check(pg.evaluate("()=>[...document.getElementById('lim').options].every(o=>o.value!=='300')"), "no hay límite de 300")
        pg.select_option("#p0","3"); pg.select_option("#bf","3"); pg.select_option("#lim","5000")
        check("semana 7" in txt("#limMsg") and "1 561" in txt("#limMsg"), "límite 5 000: semana 7, exceso 1 561")
        empty = pg.evaluate("""()=>[...document.querySelectorAll('#sheet1 td.f')].filter(td=>{td.click();return !document.getElementById('fexp1').textContent}).map(t=>t.textContent)""")
        check(not empty, f"fórmulas AI1 con explicación {empty}")
        pg.locator("#qz1 .q").nth(2).locator("button").nth(1).click()
        check("Correcto" in pg.locator("#qz1 .fb").nth(2).text_content(), "quiz AI1")
        for c in pg.locator("#lista1 .check input").all(): c.check()
        check("Listo" in txt("#lista1 .ptext"), "lista AI1")
        ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(ov<=1, f"AI1 sin desbordamiento ({ov}px)")
        pg.screenshot(path=f"{shots}/ai1_{vw[0]}.png", full_page=True)
        # ===== AI2
        pg.click("#sw-ai2"); pg.wait_for_timeout(150)
        check(pg.is_visible("#act2") and not pg.is_visible("#act1") and pg.evaluate("scrollY")==0, "selector muestra AI2 arriba")
        check(f"{rate(VV,0)*100:.2f} %" in txt("#tSteps"), "tasa paso a paso 2000-2005")
        pg.select_option("#tp","2")
        check(f"{rate(VV,2)*100:.2f} %" in txt("#tSteps") and "7 700" in txt("#tSteps"), "tasa 2010-2015")
        check("—" in txt("#tData"), "tasas ocultas antes de calcular")
        pg.click("#rCalc")
        cells = [c.replace('\xa0',' ') for c in pg.locator("#tData tbody td").all_text_contents()]
        for k in range(4):
            check(f"{rate(VV,k)*100:.2f} %" in cells and f"{rate(CA,k)*100:.2f} %" in cells, f"tasas periodo {k}")
        check(pg.locator("#tData td.low").count()==2, "periodo de menor crecimiento resaltado en cada municipio")
        check("Valle Verde" in txt("#rMsg").split("fue")[1][:20] and "2005–2010" in txt("#rMsg") and "2010–2015" in txt("#rMsg"), "mensaje de comparación")
        pg.click("#gTabs button[data-g='tasa']")
        check(pg.locator("#cViv rect").count()==8 and "NaN" not in pg.inner_html("#cViv"), "gráfica de tasas")
        pg.click("#gTabs button[data-g='viv']")
        check(pg.locator("#cViv polyline").count()==2, "gráfica de viviendas")
        # proyección
        r3 = rate(VV,3); V = 73800*(1+r3)**6
        pg.click("#pAll")
        check(pg.locator("#pBody tr").count()==7, "proyección 2025-2050")
        check(abs(num(pg.locator("#pBody tr").nth(6).locator("td").nth(2).text_content())-round(V))<=1, f"2050 Valle Verde ({V:.0f})")
        check(f"{round(73800*(1+6*r3)):,}".replace(',',' ') in txt("#pWrong"), "error común lineal")
        pg.select_option("#pm","1"); pg.click("#pAll")
        V2 = 52600*(1+rate(CA,3))**6
        check(abs(num(pg.locator("#pBody tr").nth(6).locator("td").nth(2).text_content())-round(V2))<=1, "2050 Costa Azul")
        check(f"{round(V2):,}".replace(',',' ') in txt("#docModel"), "modelo de documento coincide")
        empty = pg.evaluate("""()=>[...document.querySelectorAll('#sheet2 td.f')].filter(td=>{td.click();return !document.getElementById('fexp2').textContent}).map(t=>t.textContent)""")
        check(not empty, f"fórmulas AI2 con explicación {empty}")
        pg.locator("#qz2 .q").nth(2).locator("button").nth(2).click()
        check("Correcto" in pg.locator("#qz2 .fb").nth(2).text_content(), "quiz AI2")
        for c in pg.locator("#lista2 .check input").all(): c.check()
        check("Listo" in txt("#lista2 .ptext"), "lista AI2")
        ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(ov<=1, f"AI2 sin desbordamiento ({ov}px)")
        pg.screenshot(path=f"{shots}/ai2_{vw[0]}.png", full_page=True)
        pg.goto(f"file://{root}/index.html#proyeccion"); pg.wait_for_timeout(200)
        check(pg.is_visible("#act2"), "enlace directo a sección de AI2")
        pg.goto(f"file://{root}/index.html#ai1"); pg.wait_for_timeout(300)
        check(pg.is_visible("#act1") and pg.evaluate("scrollY")==0, "enlace #ai1 abre arriba")
        dup = pg.evaluate("()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.keys(c).filter(k=>c[k]>1)}")
        broken = pg.evaluate("()=>[...document.querySelectorAll('a[href^=\"#\"]')].map(a=>a.getAttribute('href').slice(1)).filter(h=>!document.getElementById(h)&&!['ai1','ai2'].includes(h))")
        check(not dup and not broken, f"sin IDs duplicados ni enlaces rotos {dup} {broken}")
        pg.close()
    b.close()
print("\nErrores JS:", errors or "ninguno")
print("Fallas:", fails or "ninguna")
sys.exit(1 if (errors or fails) else 0)
