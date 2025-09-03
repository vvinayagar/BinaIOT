import os
from django.http import JsonResponse
from .modbus import read_modbus, last_values
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .modbus_utils import write_zero_and_verify

# Environment overrides (optional)
MODBUS_HOST = os.getenv("MODBUS_HOST", "192.168.1.20")
MODBUS_PORT = int(os.getenv("MODBUS_PORT", "502"))
MODBUS_SLAVE_ID = int(os.getenv("MODBUS_SLAVE_ID", "1"))
MODBUS_REG_ADDR = int(os.getenv("MODBUS_REG_ADDR", "125"))  # holding register 125
MODBUS_REG_ADDR_2 = int(os.getenv("MODBUS_REG_ADDR", "127"))  # holding register 127


def status(request):
    read_modbus()
    return JsonResponse(last_values)

@csrf_exempt                 # remove if you handle CSRF from your React app
@require_http_methods(["POST","GET"])
def write_pcs_zero(request):
    ok, data = write_zero_and_verify(
        host=MODBUS_HOST,
        port=MODBUS_PORT,
        slave_id=MODBUS_SLAVE_ID,
        address=MODBUS_REG_ADDR
    )
    if ok:
        return JsonResponse({
            "ok": True,
            "address": MODBUS_REG_ADDR,
            "value_written": 0,
            "verify": data,
        })
    return JsonResponse({"ok": False, "error": data}, status=502)


@csrf_exempt                 # remove if you handle CSRF from your React app
@require_http_methods(["POST","GET"])
def write_set_zero(request):
    ok, data = write_zero_and_verify(
        host=MODBUS_HOST,
        port=MODBUS_PORT,
        slave_id=MODBUS_SLAVE_ID,
        address=MODBUS_REG_ADDR_2
    )
    if ok:
        return JsonResponse({
            "ok": True,
            "address": MODBUS_REG_ADDR,
            "value_written": 0,
            "verify": data,
        })
    return JsonResponse({"ok": False, "error": data}, status=502)
