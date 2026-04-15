import time
import requests
import random
from datetime import datetime

# WEBHOOK_URL = "https://unatrophied-ornerily-tequila.ngrok-free.dev/webhook/controlflota-events"
WEBHOOK_URL = "https://unatrophied-ornerily-tequila.ngrok-free.dev/webhook-test/controlflota-events"




operators = [
    "Juan Perez", "Maria Gomez", "Carlos Rodriguez", "Ana Lopez", 
    "Pedro Martinez", "Laura Sanchez", "Luis Torres", "Sofia Diaz"
]

units = [
    "Unidad 01 - Nissan", "Unidad 02 - Ford", "Unidad 03 - Chevrolet", 
    "Unidad 04 - Toyota", "Unidad 05 - Hyundai", "Unidad 06 - Renault", 
    "Unidad 07 - Ram", "Unidad 08 - VW"
]

destinations = ["Ruta Norte", "Centro", "Planta 2", "Distribuidor Sur", "Taller", "Ruta Foranea"]

def run_simulation():
    print("Iniciando simulacion nocturna de eventos (App Web -> n8n)...")
    base_km = random.randint(50000, 150000)
    
    while True:
        # 1. Hacer Check-out
        op = random.choice(operators)
        unit = random.choice(units)
        dest = random.choice(destinations)
        base_km += random.randint(10, 50)
        
        now = datetime.now()
        date_str = now.strftime("%d/%m/%Y")
        time_str = now.strftime("%H:%M")
        
        checkout_payload = {
            "source": "Control Flota",
            "app_id": "control-flota-pro",
            "organization": "Oramix & Co",
            "event": "unit_checkout",
            "severity": "info",
            "timestamp": now.isoformat(),
            "date": date_str,
            "time": time_str,
            "unit": unit,
            "operator": op,
            "destination": dest,
            "km_out": base_km,
            "fuel": random.choice(["Lleno", "3/4", "Medio"]),
            "notes": "Salida automatica nocturna"
        }
        
        print(f"[{time_str}] Habilitando checkout para {unit} por {op}...")
        try:
            res = requests.post(WEBHOOK_URL, json=checkout_payload)
            print("Checkout enviado:", res.status_code)
        except Exception as e:
            print("Error:", e)
            
        # Esperar entre 2 y 5 minutos para simular trayecto
        sleep_time = random.randint(120, 300)
        print(f"Simulando en ruta. Esperando {sleep_time} segundos...")
        time.sleep(sleep_time)
        
        # 2. Hacer Check-in (Regreso)
        base_km += random.randint(15, 100)
        now = datetime.now()
        date_str_in = now.strftime("%d/%m/%Y")
        time_str_in = now.strftime("%H:%M")
        
        checkin_payload = {
            "source": "Control Flota",
            "app_id": "control-flota-pro",
            "organization": "Oramix & Co",
            "event": "unit_checkin",
            "severity": "info",
            "timestamp": now.isoformat(),
            "date": date_str_in,
            "time": time_str_in,
            "unit": unit,
            "operator": op,
            "km_in": base_km,
            "fuel": random.choice(["Medio", "1/4", "Reserva"]),
            "notes": random.choice(["Sin novedades", "Sin novedades", "Lluvia intensa", "Trafico pesado"])
        }
        
        print(f"[{time_str_in}] Recibiendo checkin para {unit}...")
        try:
            res = requests.post(WEBHOOK_URL, json=checkin_payload)
            print("Checkin enviado:", res.status_code)
        except Exception as e:
            print("Error:", e)
            
        # Descanso antes de otra corrida
        delay = random.randint(300, 900)
        print(f"Unidad lista. Siguiente recorrido en {delay} segundos...\n")
        time.sleep(delay)

if __name__ == "__main__":
    run_simulation()
