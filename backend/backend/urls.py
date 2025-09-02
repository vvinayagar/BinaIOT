from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from machine.views import MachineSettingViewSet

router = routers.DefaultRouter()
router.register(r'machine-settings', MachineSettingViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('', include('modbus_reader.urls')),
]
