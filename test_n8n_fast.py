import requests
import time
from datetime import datetime

# URL configurada para modo de prueba en n8n
WEBHOOK_URL = "http://127.0.0.1:5678/webhook/controlflota-events"

def run_fast_test():
    print(f"🚀 Iniciando prueba rápida enviando a: {WEBHOOK_URL}")
    now = datetime.now()
    date_str = now.strftime("%d/%m/%Y")
    time_str = now.strftime("%H:%M")
    
    # 1. Simular Salida (Check-out)
    checkout_payload = {
        "event": "checkout",
        "unit": "Nissan NP300 - Prueba AI",
        "operator": "Oramyx Audit",
        "destination": "Auditoria de Sistema",
        "km_out": 120000,
        "date": date_str,
        "time": time_str,
        "fuel": "Lleno (100%)",
        "notes": "E2E Test: Verificando conexión de Salida"
    }
    
    print("\n📦 Enviando evento de SALIDA (Check-out)...")
    try:
        res = requests.post(WEBHOOK_URL, json=checkout_payload)
        print(f"Respuesta n8n: {res.status_code}")
        if res.status_code == 200:
            print("✅ Check-out recibido por n8n!")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return

    print("\n⏳ Esperando 5 segundos para simular el viaje...")
    time.sleep(5)
    
    # 2. Simular Regreso (Check-in)
    time_str_in = datetime.now().strftime("%H:%M:%S")
    checkin_payload = {
        "event": "checkin",
        "unit": "Nissan NP300 - Prueba AI",
        "operator": "Oramyx Audit",
        "km_in": 120055,
        "date": date_str,
        "time": time_str_in,
        "fuel": "50% (1/2)",
        "notes": "E2E Test: Retorno exitoso sin novedades. Verificando escritura en Google Sheets"
    }
    
    print("\n📦 Enviando evento de REGRESO (Check-in)...")
    try:
        res = requests.post(WEBHOOK_URL, json=checkin_payload)
        print(f"Respuesta n8n: {res.status_code}")
        if res.status_code == 200:
            print("✅ Check-in recibido por n8n!")
            print("\n🎉 Prueba finalizada. ¡Revisa tu Google Sheets y bandeja de entrada!")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    run_fast_test()
