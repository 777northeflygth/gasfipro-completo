"""
URL configuration for gasfipro_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ✅ NUEVO - Importar la vista de login con Google
from api.views import GoogleLogin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Rutas de la API (crearemos el archivo urls.py dentro de api/)

    # ✅ NUEVO - Endpoint específico para Login social con Google
    # IMPORTANTE: Debe ir ANTES de los includes generales de dj_rest_auth para evitar conflictos
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),

    # ✅ NUEVO - Autenticación social (django-allauth + dj-rest-auth)
    path('api/auth/', include('dj_rest_auth.urls')),              # login, logout, user, etc.
    path('api/auth/', include('dj_rest_auth.registration.urls')), # registro / login social
    path('accounts/', include('allauth.urls')),                   # flujo interno de allauth
]

# Servir archivos media en desarrollo (evidencias)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)