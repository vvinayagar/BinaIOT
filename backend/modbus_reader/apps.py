from django.apps import AppConfig
import threading
import time
from . import modbus

class ModbusReaderConfig(AppConfig):
    name = 'modbus_reader'

    def ready(self):
        def poll_loop():
            while True:
                modbus.read_modbus()
                time.sleep(5)
        threading.Thread(target=poll_loop, daemon=True).start()
