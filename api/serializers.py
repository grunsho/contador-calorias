from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={
        'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={
                                      'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError(
                {"pasword": "Las dos contraseñas no coinciden."})
        return data

    def create(self, validated_data):
        # Elimina password2 antes de crear el usuario
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class LoginSerailizer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if username and password:
            from django.contrib.auth import authenticate
            user = authenticate(request=self.context.get(
                'request'), username=username, password=password)
            if not user:
                raise serializers.ValidationError("Credenciales inválidas.")
        else:
            raise serializers.ValidationError(
                "Debe introducir un nomnbre de usuario y una contraseña.")

        data['user'] = user
        return data
