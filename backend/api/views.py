# api/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from .serializers import BookingSerializer
import random

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar reservas (CRUD + acciones personalizadas).
    Todas las operaciones requieren autenticación, excepto la consulta de estado por boleta.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Genera un número de boleta único de 16 dígitos al crear una reserva.
        """
        boleta = self._generate_unique_boleta()
        serializer.save(boleta=boleta)

    def _generate_unique_boleta(self):
        """Genera una boleta de 16 dígitos que no exista en la base de datos."""
        while True:
            boleta = ''.join(str(random.randint(0, 9)) for _ in range(16))
            if not Booking.objects.filter(boleta=boleta).exists():
                return boleta

    # ----- ACCIONES PERSONALIZADAS -----

    @action(detail=False, methods=['get'], url_path='earnings')
    def earnings(self, request):
        """
        Resumen de ganancias: hoy, semana, mes y total general.
        Solo considera reservas con estado 'resuelto'.
        """
        today = timezone.now().date()
        start_week = today - timedelta(days=today.weekday())  # lunes
        start_month = today.replace(day=1)

        resueltos = Booking.objects.filter(status='resuelto')

        earnings_today = resueltos.filter(fecha_agenda=today).aggregate(total=Sum('ganancia'))['total'] or 0
        earnings_week = resueltos.filter(fecha_agenda__gte=start_week).aggregate(total=Sum('ganancia'))['total'] or 0
        earnings_month = resueltos.filter(fecha_agenda__gte=start_month).aggregate(total=Sum('ganancia'))['total'] or 0
        earnings_total = resueltos.aggregate(total=Sum('ganancia'))['total'] or 0

        service_stats = resueltos.values('service').annotate(
            count=Count('id'),
            total=Sum('ganancia')
        ).order_by('service')

        data = {
            'today': earnings_today,
            'week': earnings_week,
            'month': earnings_month,
            'total': earnings_total,
            'by_service': service_stats,
        }
        return Response(data)

    @action(detail=False, methods=['get'], url_path='clients')
    def clients(self, request):
        """
        Lista de clientes agrupados por RUT con conteo de reservas.
        """
        clients_map = {}
        for booking in Booking.objects.all().order_by('-created_at'):
            rut = booking.rut
            if rut not in clients_map:
                clients_map[rut] = {
                    'rut': rut,
                    'nombre': booking.nombre,
                    'apellido': booking.apellido,
                    'email': booking.email,
                    'telefono': booking.telefono,
                    'bookings': 1,
                }
            else:
                clients_map[rut]['bookings'] += 1
                clients_map[rut]['nombre'] = booking.nombre
                clients_map[rut]['apellido'] = booking.apellido
                clients_map[rut]['email'] = booking.email or clients_map[rut]['email']
                clients_map[rut]['telefono'] = booking.telefono or clients_map[rut]['telefono']

        return Response(list(clients_map.values()))

    @action(detail=False, methods=['get'], url_path='solicitudes')
    def solicitudes(self, request):
        """
        Lista todas las solicitudes ordenadas por fecha de creación descendente,
        incluyendo información de evidencia.
        """
        bookings = Booking.objects.all().order_by('-created_at')
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Actualiza solo el estado de una reserva.
        """
        booking = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Booking.STATUS_CHOICES):
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = new_status
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    # ----- ACCIÓN PÚBLICA: Consultar estado (por boleta, RUT o nombre+apellido) -----
    @action(
        detail=False,
        methods=['get'],
        url_path='estado',
        permission_classes=[permissions.AllowAny]  # 🔓 Pública
    )
    def estado(self, request):
        """
        Consulta el estado de una reserva utilizando:
        - boleta (16 dígitos)
        - rut (con dígito verificador)
        - nombre y apellido (coincidencia exacta o parcial)
        
        Siempre devuelve una lista de reservas en el campo 'reservas'.
        """
        boleta = request.query_params.get('boleta')
        rut = request.query_params.get('rut')
        nombre = request.query_params.get('nombre')
        apellido = request.query_params.get('apellido')

        # Validar que al menos un parámetro esté presente
        if not any([boleta, rut, (nombre and apellido)]):
            return Response(
                {'error': 'Debes proporcionar boleta, RUT o nombre y apellido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Búsqueda por boleta
        if boleta:
            try:
                booking = Booking.objects.get(boleta=boleta)
                return Response({'reservas': [self._serialize_booking(booking)]})
            except Booking.DoesNotExist:
                return Response(
                    {'error': 'No se encontró ninguna reserva con ese número de boleta'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Búsqueda por RUT
        if rut:
            rut_limpio = rut.replace('.', '').replace(' ', '').upper()
            bookings = Booking.objects.filter(rut=rut_limpio)
            if not bookings.exists():
                return Response(
                    {'error': 'No se encontraron reservas con ese RUT'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response({'reservas': [self._serialize_booking(b) for b in bookings]})

        # Búsqueda por nombre y apellido
        if nombre and apellido:
            # Intentar coincidencia exacta (case-insensitive)
            bookings = Booking.objects.filter(
                nombre__iexact=nombre,
                apellido__iexact=apellido
            )
            if not bookings.exists():
                # Si no hay exacta, buscar coincidencia parcial
                bookings = Booking.objects.filter(
                    Q(nombre__icontains=nombre) & Q(apellido__icontains=apellido)
                )
            if not bookings.exists():
                return Response(
                    {'error': 'No se encontraron reservas con ese nombre y apellido'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response({'reservas': [self._serialize_booking(b) for b in bookings]})

        # Si llegamos aquí, es que no se cumplió ninguna condición
        return Response(
            {'error': 'Parámetros inválidos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def _serialize_booking(self, booking):
        """
        Método auxiliar para formatear los datos de una reserva.
        """
        return {
            'boleta': booking.boleta,
            'estado': booking.get_status_display(),
            'estado_codigo': booking.status,
            'fecha_solicitud': booking.created_at,
            'fecha_agenda': booking.fecha_agenda,
            'hora_agenda': booking.hora_agenda,
            'nombre': booking.nombre,
            'apellido': booking.apellido,
            'rut': booking.rut,
            'service': booking.service,
            'descripcion': booking.descripcion,
            'evidencia': booking.evidencia.url if booking.evidencia else None,
        }