#!/usr/bin/env python3
"""
Prueba de carga de la API de Matemática Sin Estrés (gestión de capacidad y rendimiento, APF3).
Solo usa la biblioteca estándar de Python 3.9+.

Simula N usuarios concurrentes que recorren las rutas más usadas durante un tiempo fijo y reporta
peticiones por segundo, percentiles de latencia (p50, p95, p99) y porcentaje de errores, para compararlos
con el SLA (p95 < 2 s, errores < 1 %).

Ejemplos:
  python3 capacidad/carga.py --url http://localhost:8080 --usuarios 10 --duracion 30
  python3 capacidad/carga.py --url https://mse-backend.onrender.com --escalones 1,5,10,25 --duracion 20 --json resultados.json
  python3 capacidad/carga.py --url http://localhost:8080 --usuario alumno.demo --password '...'   # incluye rutas del aula
"""
import argparse
import json
import statistics
import threading
import time
import urllib.error
import urllib.request

RUTAS_PUBLICAS = [
    "/api/public/health",
    "/api/public/niveles",
    "/api/public/horarios",
    "/api/public/clases-recientes",
    "/api/public/estadisticas",
]
RUTAS_ALUMNO = ["/api/alumno/matriculas", "/api/alumno/clases"]


def pedir(url, token=None, metodo="GET", cuerpo=None, timeout=30):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo)
    req.add_header("Accept", "application/json")
    if datos is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    inicio = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            contenido = r.read()
            return r.status, (time.perf_counter() - inicio) * 1000, contenido
    except urllib.error.HTTPError as e:
        return e.code, (time.perf_counter() - inicio) * 1000, b""
    except Exception:
        return 0, (time.perf_counter() - inicio) * 1000, b""


def percentil(valores, p):
    if not valores:
        return 0.0
    ordenados = sorted(valores)
    k = max(0, min(len(ordenados) - 1, int(round(p / 100.0 * len(ordenados) + 0.5)) - 1))
    return ordenados[k]


def escalon(base, usuarios, duracion, rutas, token):
    resultados = []
    candado = threading.Lock()
    fin = time.time() + duracion

    def trabajador(indice):
        i = indice
        locales = []
        while time.time() < fin:
            ruta = rutas[i % len(rutas)]
            i += 1
            codigo, ms, _ = pedir(base + ruta, token if ruta.startswith("/api/alumno") else None)
            locales.append((ruta, codigo, ms))
        with candado:
            resultados.extend(locales)

    hilos = [threading.Thread(target=trabajador, args=(n,)) for n in range(usuarios)]
    inicio = time.time()
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    transcurrido = time.time() - inicio

    lat = [ms for _, _, ms in resultados]
    errores = sum(1 for _, c, _ in resultados if c == 0 or c >= 500)
    por_ruta = {}
    for ruta in rutas:
        l = [ms for r, _, ms in resultados if r == ruta]
        if l:
            por_ruta[ruta] = {"peticiones": len(l), "p50_ms": round(percentil(l, 50), 1), "p95_ms": round(percentil(l, 95), 1)}
    return {
        "usuarios": usuarios,
        "duracion_s": round(transcurrido, 1),
        "peticiones": len(resultados),
        "rps": round(len(resultados) / transcurrido, 1) if transcurrido else 0,
        "p50_ms": round(percentil(lat, 50), 1),
        "p95_ms": round(percentil(lat, 95), 1),
        "p99_ms": round(percentil(lat, 99), 1),
        "max_ms": round(max(lat), 1) if lat else 0,
        "promedio_ms": round(statistics.mean(lat), 1) if lat else 0,
        "errores": errores,
        "errores_pct": round(100.0 * errores / len(resultados), 2) if resultados else 0,
        "por_ruta": por_ruta,
    }


def main():
    p = argparse.ArgumentParser(description="Prueba de carga de la API (capacidad y rendimiento).")
    p.add_argument("--url", default="http://localhost:8080")
    p.add_argument("--usuarios", type=int, default=10, help="usuarios concurrentes (si no se usa --escalones)")
    p.add_argument("--escalones", default="", help="lista de usuarios concurrentes, p. ej. 1,5,10,25,50")
    p.add_argument("--duracion", type=int, default=30, help="segundos por escalón")
    p.add_argument("--usuario", help="usuario ALUMNO para incluir rutas autenticadas")
    p.add_argument("--password")
    p.add_argument("--json", help="guardar los resultados en este archivo JSON")
    a = p.parse_args()
    base = a.url.rstrip("/")

    codigo, _, _ = pedir(base + "/api/public/health", timeout=90)
    if codigo != 200:
        raise SystemExit(f"La API no responde en {base} (código {codigo}).")
    pedir(base + "/api/public/niveles")  # calentamiento

    rutas = list(RUTAS_PUBLICAS)
    token = None
    if a.usuario and a.password:
        c, _, cuerpo = pedir(base + "/api/auth/login", metodo="POST", cuerpo={"usuario": a.usuario, "password": a.password})
        if c != 200:
            raise SystemExit(f"No se pudo iniciar sesión como {a.usuario} (código {c}).")
        token = json.loads(cuerpo)["token"]
        rutas += RUTAS_ALUMNO

    escalones = [int(x) for x in a.escalones.split(",") if x.strip()] or [a.usuarios]
    salida = []
    print(f"API: {base} · {len(rutas)} rutas · {a.duracion} s por escalón\n")
    print(f"{'Usuarios':>8} {'Peticiones':>10} {'RPS':>8} {'p50 ms':>8} {'p95 ms':>8} {'p99 ms':>8} {'máx ms':>8} {'Errores':>8}  SLA p95<2000")
    for u in escalones:
        r = escalon(base, u, a.duracion, rutas, token)
        salida.append(r)
        cumple = "sí" if r["p95_ms"] < 2000 and r["errores_pct"] < 1 else "NO"
        print(f"{u:>8} {r['peticiones']:>10} {r['rps']:>8} {r['p50_ms']:>8} {r['p95_ms']:>8} {r['p99_ms']:>8} {r['max_ms']:>8} {r['errores_pct']:>7}%  {cumple}")
    if a.json:
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump({"url": base, "rutas": rutas, "escalones": salida}, f, ensure_ascii=False, indent=2)
        print(f"\nResultados guardados en {a.json}")


if __name__ == "__main__":
    main()
