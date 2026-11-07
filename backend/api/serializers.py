# api/serializers.py
from rest_framework import serializers
from .models import Booking
import base64
from django.core.files.base import ContentFile
import uuid
from django.conf import settings

class BookingSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Booking.
    Incluye campos adicionales de solo lectura como status_display y full_name.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.SerializerMethodField()
    evidencia_url = serializers.SerializerMethodField(read_only=True)

    # Campos adicionales para recibir la evidencia en base64
    evidenciaBase64 = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    evidenciaNombre = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Booking
        fields = '__all__'  # Incluye todos los campos del modelo (incluido 'direccion' automáticamente)
        read_only_fields = ['id', 'created_at', 'updated_at', 'boleta']

    def get_full_name(self, obj):
        """Devuelve el nombre completo del cliente."""
        return f"{obj.nombre} {obj.apellido}"

    def get_evidencia_url(self, obj):
        """Devuelve la URL completa de la evidencia si existe."""
        if obj.evidencia:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.evidencia.url)
            return obj.evidencia.url
        return None

    def validate_fecha_agenda(self, value):
        """Valida que la fecha de agenda no sea pasada."""
        from django.utils import timezone
        if value and value < timezone.now().date():
            raise serializers.ValidationError("La fecha de agenda no puede ser en el pasado.")
        return value

    # ✅ NUEVO - Validación para asegurar que la dirección no venga vacía
    def validate_direccion(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("La dirección es obligatoria para agendar la visita.")
        return value

    def _procesar_evidencia(self, instance, evidencia_base64, evidencia_nombre):
        """Método auxiliar para procesar y guardar la evidencia."""
        if not evidencia_base64 or not evidencia_nombre:
            return instance

        try:
            # Decodificar base64
            # El base64 viene como "data:image/png;base64,iVBORw0KGgo..."
            format, imgstr = evidencia_base64.split(';base64,')
            # Asegurarse de que el nombre tenga extensión
            ext = evidencia_nombre.split('.')[-1] if '.' in evidencia_nombre else 'bin'
            # Generar un nombre único para evitar colisiones
            nombre_unico = f"{instance.id}_{uuid.uuid4().hex[:8]}_{evidencia_nombre}"
            # Crear ContentFile
            data = ContentFile(base64.b64decode(imgstr), name=nombre_unico)
            # Asignar al campo evidencia
            instance.evidencia = data
            instance.save()
        except Exception as e:
            # Si falla la decodificación, logueamos el error pero no fallamos la creación
            print(f"Error al procesar evidencia: {e}")
            # Opcional: podrías lanzar una excepción para que falle la creación
            # raise serializers.ValidationError(f"Error al procesar la evidencia: {e}")

        return instance

    def create(self, validated_data):
        # Extraer los campos de base64 y nombre del archivo
        evidencia_base64 = validated_data.pop('evidenciaBase64', None)
        evidencia_nombre = validated_data.pop('evidenciaNombre', None)

        # Crear la instancia sin la evidencia (por ahora)
        booking = Booking.objects.create(**validated_data)

        # Procesar la evidencia si se proporcionó
        if evidencia_base64 and evidencia_nombre:
            self._procesar_evidencia(booking, evidencia_base64, evidencia_nombre)

        return booking

    def update(self, instance, validated_data):
        # Extraer los campos de base64 y nombre del archivo
        evidencia_base64 = validated_data.pop('evidenciaBase64', None)
        evidencia_nombre = validated_data.pop('evidenciaNombre', None)

        # Actualizar los campos del modelo (excepto la evidencia)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Procesar la evidencia si se proporcionó
        if evidencia_base64 and evidencia_nombre:
            self._procesar_evidencia(instance, evidencia_base64, evidencia_nombre)

        return instance