# backend/modbus_reader/views_diag.py
from django.http import JsonResponse
import sys, os, importlib, inspect
# from .modbus import read_modbus, last_values



# def status(request):
#     read_modbus()
#     return JsonResponse(last_values)


def diag(request):
    info = {}
    try:
        import django, pymodbus
        from modbus_reader import modbus as modbus_module
        info["django_version"] = django.get_version()
        info["pymodbus_version"] = getattr(pymodbus, "__version__", "unknown")
        info["python_executable"] = sys.executable
        info["python_version"] = sys.version
        info["modbus_module_file"] = inspect.getfile(modbus_module)
        info["cwd"] = os.getcwd()
        info["env_hint"] = os.environ.get("VIRTUAL_ENV", "(not set)")
    except Exception as e:
        info["error"] = str(e)
    return JsonResponse(info)
