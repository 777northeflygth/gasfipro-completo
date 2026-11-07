# api/views.py

import os
# ✅ CLAVE: Permitir que Google devuelva los scopes en distinto orden o con nombres extendidos
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from .serializers import BookingSerializer
import secrets  # ✅ NUEVO: Reemplaza a 'random' para seguridad
import logging   # ✅ NUEVO: Para logs seguros

# ✅ Imports para Google Calendar
from allauth.socialaccount.models import SocialToken
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
import datetime

# ✅ NUEVOS Imports para el Login Manual con Google (Auth-Code)
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Configurar logger
logger = logging.getLogger(__name__)

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
        Y la sincroniza con Google Calendar.
        """
        boleta = self._generate_unique_boleta()
        booking = serializer.save(boleta=boleta)
        
        # ✅ NUEVO - Intentar sincronizar con Google Calendar
        self._sync_with_google_calendar(booking)

    def _generate_unique_boleta(self):
        """Genera una boleta de 16 dígitos que no exista en la base de datos."""
        while True:
            # ✅ CORRECCIÓN SONARCLOUD: Usar secrets en lugar de random
            boleta = ''.join(secrets.choice('0123456789') for _ in range(16))
            if not Booking.objects.filter(boleta=boleta).exists():
                return boleta

    def _sync_with_google_calendar(self, booking):
        """
        Crea un evento en el Google Calendar del administrador logueado.
        """
        try:
            # Obtenemos el token de Google del usuario que está haciendo la petición
            if not self.request.user.is_authenticated:
                return

            # Buscamos el token guardado por django-allauth
            social_token = SocialToken.objects.filter(
                account__user=self.request.user, 
                account__provider='google'
            ).first()

            if not social_token:
                logger.warning("No se encontró token de Google para este usuario.")
                return

            # Configuramos las credenciales de Google
            creds = Credentials(
                token=social_token.token,
                refresh_token=social_token.token_secret,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=settings.SOCIALACCOUNT_PROVIDERS['google']['APPS'][0]['client_id'],
                client_secret=settings.SOCIALACCOUNT_PROVIDERS['google']['APPS'][0]['secret']
            )

            # Construimos el servicio de Google Calendar
            service = build('calendar', 'v3', credentials=creds)

            # Formatear la fecha y hora de inicio para Google Calendar (formato ISO)
            hora_inicio = booking.hora_agenda.strftime('%H:%M:%S') if booking.hora_agenda else '09:00:00'
            fecha_inicio = booking.fecha_agenda.strftime('%Y-%m-%d')
            
            start_datetime = f"{fecha_inicio}T{hora_inicio}"
            
            # Calcular hora de fin (1 hora después por defecto)
            start_dt = datetime.datetime.fromisoformat(start_datetime)
            end_dt = start_dt + datetime.timedelta(hours=1)
            end_datetime = end_dt.isoformat()

            # Crear el evento
            event = {
                'summary': f'Gasfipro: {booking.nombre} {booking.apellido}',
                'location': booking.direccion,
                'description': f"Servicio: {booking.service}\nProblema: {booking.descripcion}\nTeléfono: {booking.telefono}\nBoleta: {booking.boleta}",
                'start': {
                    'dateTime': start_datetime,
                    'timeZone': 'America/Santiago',
                },
                'end': {
                    'dateTime': end_datetime,
                    'timeZone': 'America/Santiago',
                },
            }

            # Insertar el evento
            created_event = service.events().insert(calendarId='primary', body=event).execute()
            # ✅ CORRECCIÓN SONARCLOUD: Usar logger.info en lugar de print
            logger.info(f"✅ Evento creado en Google Calendar: {created_event.get('htmlLink')}")

        except Exception as e:
            # ✅ CORRECCIÓN SONARCLOUD: Usar logger.error en lugar de print
            logger.error(f"❌ Error al crear evento en Google Calendar: {e}")

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
                    'direccion': booking.direccion, # ✅ NUEVO - Agregado aquí
                    'bookings': 1,
                }
            else:
                clients_map[rut]['bookings'] += 1
                clients_map[rut]['nombre'] = booking.nombre
                clients_map[rut]['apellido'] = booking.apellido
                clients_map[rut]['email'] = booking.email or clients_map[rut]['email']
                clients_map[rut]['telefono'] = booking.telefono or clients_map[rut]['telefono']
                # ✅ NUEVO - Actualizamos a la dirección más reciente si tiene una
                clients_map[rut]['direccion'] = booking.direccion or clients_map[rut]['direccion']

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

    # ✅ NUEVO - Acción para sincronizar manualmente desde el botón del frontend
    @action(detail=True, methods=['post'], url_path='sync-calendar')
    def sync_calendar(self, request, pk=None):
        """
        Sincroniza manualmente una reserva existente con Google Calendar.
        Se activa al presionar el botón 📅 en el panel de Admin.
        """
        booking = self.get_object()
        
        if not booking.fecha_agenda or not booking.hora_agenda:
            return Response(
                {'error': 'La reserva debe tener fecha y hora de agenda para sincronizarse.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Llamamos a la función auxiliar que ya creamos
            self._sync_with_google_calendar(booking)
            return Response({'message': 'Reserva sincronizada exitosamente con Google Calendar.'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            'direccion': booking.direccion, # ✅ NUEVO - Agregado aquí
            'service': booking.service,
            'descripcion': booking.descripcion,
            'evidencia': booking.evidencia.url if booking.evidencia else None,
        }

# ============================================================
# ✅ NUEVO - Vista personalizada para Login con Google (Auth Code)
# ============================================================
class GoogleLogin(APIView):
    """
    Vista personalizada que recibe el código de autorización, lo intercambia
    por un access_token y refresh_token, y devuelve el JWT de Django.
    """
    # ✅ CLAVE: Permitir el acceso a esta vista sin estar autenticado
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Se requiere el código de autorización.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Configurar el flujo de Google
            client_config = {
                "web": {
                    "client_id": settings.SOCIALACCOUNT_PROVIDERS['google']['APPS'][0]['client_id'],
                    "client_secret": settings.SOCIALACCOUNT_PROVIDERS['google']['APPS'][0]['secret'],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            }
            flow = Flow.from_client_config(
                client_config,
                scopes=['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'],
                redirect_uri="postmessage" # Requerido para el flujo de popup de React
            )
            
            # 2. Intercambiar el código por las credenciales (aquí obtenemos el refresh_token)
            flow.fetch_token(code=code)
            credentials = flow.credentials

            # 3. Verificar el ID Token para saber quién es el usuario
            id_info = id_token.verify_oauth2_token(
                credentials.id_token, google_requests.Request(), client_config['web']['client_id']
            )
            email = id_info.get('email')
            
            # 4. Buscar o crear el usuario en Django
            User = get_user_model()
            user, created = User.objects.get_or_create(email=email, defaults={'username': email})

            # 5. Guardar los tokens en la base de datos (allauth)
            social_account, _ = SocialAccount.objects.get_or_create(
                user=user, provider='google', defaults={'uid': id_info.get('sub')}
            )
            
            SocialToken.objects.update_or_create(
                account=social_account,
                defaults={
                    'token': credentials.token,
                    'token_secret': credentials.refresh_token # ✅ AQUÍ GUARDAMOS EL REFRESH TOKEN
                }
            )

            # 6. Generar los JWT para que React inicie sesión
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })

        except Exception as e:
            logger.error(f"❌ Error en login manual de Google: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)