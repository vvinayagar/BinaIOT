from django.urls import path
from .views import status, write_pcs_zero, write_set_zero
from .views_diag import diag  # TEMP

urlpatterns = [
    path('status/', status, name='modbus_status'),
    path("diag/", diag, name="diag"),  # TEMP
       path("reset-psc/", write_pcs_zero, name="write_zero_psc"),
       path("reset-set/", write_set_zero, name="write_zero_set"),

]
