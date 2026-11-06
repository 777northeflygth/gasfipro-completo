from django.db import models
from django.utils import timezone

class Booking(models.Model):
    # Opciones para sexo y estado
    SEXO_CHOICES = [
        ('masculino', 'Masculino'),
        ('femenino', 'Femenino'),
        ('otro', 'Otro'),
    ]
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('agendado', 'Agendado'),
        ('en_proceso', 'En proceso'),
        ('resuelto', 'Resuelto'),
    ]

    # Información personal
    rut = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField()
    telefono = models.CharField(max_length=20)
    sexo = models.CharField(max_length=10, choices=SEXO_CHOICES, default='masculino')
    
    # ✅ NUEVO - Campo de dirección
    direccion = models.CharField(max_length=255, null=True, blank=True, verbose_name="Dirección")

    # Servicio y descripción
    service = models.CharField(max_length=200, blank=True, default='')  # Nombre del servicio
    descripcion = models.TextField()  # Descripción del problema

    # Evidencia (archivo adjunto)
    evidencia = models.FileField(upload_to='evidencias/', null=True, blank=True)

    # Agenda (fecha y hora agendadas)
    fecha_agenda = models.DateField(null=True, blank=True)
    hora_agenda = models.TimeField(null=True, blank=True)

    # Estado
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente')

    # Boleta (16 dígitos, único)
    boleta = models.CharField(max_length=16, unique=True, null=True, blank=True)

    # Financiero
    ganancia = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)  # en CLP
    motivo_cobro = models.TextField(blank=True, default='')

    # Fechas de creación y actualización (automáticas)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # Más reciente primero

    def __str__(self):
        return f"{self.rut} - {self.nombre} {self.apellido}"

    # Método para obtener el nombre completo
    def full_name(self):
        return f"{self.nombre} {self.apellido}"