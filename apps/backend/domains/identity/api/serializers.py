from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        identifier = attrs["identifier"]
        user = authenticate(
            request=self.context.get("request"),
            username=identifier,
            password=attrs["password"],
        )
        if user is None:
            user_by_email = User.objects.filter(email__iexact=identifier).first()
            if user_by_email:
                user = authenticate(
                    request=self.context.get("request"),
                    username=user_by_email.get_username(),
                    password=attrs["password"],
                )
        if user is None or not user.is_active or user.status != "ACTIVE":
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs


class TokenRequestSerializer(LoginSerializer):
    device_label = serializers.CharField(required=False, allow_blank=True, max_length=100)


class RefreshRequestSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(trim_whitespace=False)


class RevokeRequestSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=False, trim_whitespace=False)


class CustomerRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    accepted_terms = serializers.BooleanField()

    def validate_accepted_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("You must accept the terms to create an account.")
        return value


class RecoveryRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class RecoveryConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(trim_whitespace=False, max_length=256)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
