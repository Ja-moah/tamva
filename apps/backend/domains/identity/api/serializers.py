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
