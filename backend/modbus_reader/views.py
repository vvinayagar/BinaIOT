from django.http import JsonResponse
from .modbus import read_modbus, last_values

def status(request):
    read_modbus()
    return JsonResponse(last_values)
