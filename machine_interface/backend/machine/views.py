from rest_framework import viewsets
from .models import MachineSetting
from .serializers import MachineSettingSerializer

class MachineSettingViewSet(viewsets.ModelViewSet):
    queryset = MachineSetting.objects.all()
    serializer_class = MachineSettingSerializer
