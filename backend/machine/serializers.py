from rest_framework import serializers
from .models import MachineSetting

class MachineSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineSetting
        fields = '__all__'
