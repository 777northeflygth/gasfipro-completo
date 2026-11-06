# api/adapters.py
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

# ⚠️ CAMBIA esto por el correo de Google con el que TÚ vas a iniciar sesión
AUTHORIZED_EMAIL = "benjaminflandez510@gmail.com"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Adaptador que restringe el login social de Google a UNA sola cuenta.
    Si el email devuelto por Google no coincide con AUTHORIZED_EMAIL,
    se lanza ValidationError y el login se rechaza.
    Además, vincula automáticamente la cuenta si el correo ya existe en la base de datos.
    """

    def pre_social_login(self, request, sociallogin):
        # Este hook se ejecuta antes de crear/autenticar al usuario
        if sociallogin.account.provider == 'google':
            email = sociallogin.account.extra_data.get('email')
            if email != AUTHORIZED_EMAIL:
                raise ValidationError(
                    "Esta cuenta de Google no está autorizada para acceder."
                )
        
        # Si la cuenta social ya está vinculada a un usuario, dejar pasar
        if sociallogin.is_existing:
            return super().pre_social_login(request, sociallogin)

        # Si no está vinculada, pero el correo ya existe en la base de datos,
        # conectar automáticamente la cuenta de Google a ese usuario.
        User = get_user_model()
        try:
            user = User.objects.get(email=sociallogin.user.email)
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            # Si el usuario no existe, allauth seguirá su curso normal (crear uno nuevo)
            pass

        return super().pre_social_login(request, sociallogin)