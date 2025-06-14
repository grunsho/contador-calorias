from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import FoodItem, Meal, MealFoodItem


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


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = '__all__'


class MealFoodItemSerializer(serializers.ModelSerializer):
    # Para GET: Queremos el nombre del alimento, no solo su ID
    food_item_name = serializers.CharField(
        source='food_item.name', read_only=True)
    food_item_brand = serializers.CharField(
        source='food_item.brand', read_only=True)
    food_item_portion_unit = serializers.CharField(
        source='food_item.portion_unit', read_only=True)

    # Campos calculados, solo lectura
    calculated_calories = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    calculated_proteins = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    calculated_fats = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    calculated_carbs = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = MealFoodItem
        fields = [
            'id', 'food_item', 'food_item_name', 'food_item_brand', 'food_item_portion_unit', 'quantity',
            'calculated_calories', 'calculated_proteins', 'calculated_fats', 'calculated_carbs'
        ]
        # Para POST: Solo necesitamos food_item (ID) y quantity
        extra_kwargs = {
            'food_item': {'write_only': True}
        }


class MealSerializer(serializers.ModelSerializer):
    # Permite anidar los MealFoodItems para la creación/visualización
    meal_food_items = MealFoodItemSerializer(many=True)

    # Campos calculados de solo lectura para la suma total de la comida
    total_calories = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    total_proteins = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    total_fats = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    total_carbs = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Meal
        fields = [
            'id', 'user', 'date', 'meal_type', 'meal_food_items',
            'total_calories', 'total_proteins', 'total_fats', 'total_carbs'
        ]
        # El usuario se asignará automáticamente en la vista
        read_only_fields = ['user']

    def create(self, validated_data):
        # Extrae los alimentos de la comida
        meal_food_items_data = validated_data.pop('meal_food_items')

        # Crea la instancia de Meal
        meal = Meal.objects.create(**validated_data)

        # Crea las instancias de MealFoodItem
        for item_data in meal_food_items_data:
            MealFoodItem.objects.create(meal=meal, **item_data)

        return meal

    def update(self, instance, validated_data):
        # Actualiza campos básicos de la comida
        instance.date = validated_data.get('date', instance.date)
        instance.meal_type = validated_data.get(
            'meal_type', instance.meal_type)
        instance.save()

        # Lógica para actualizar los alimentos en la comida (más compleja)
        # Para el MVP, simplificaremos asumiendo que para actualizar, se podría borrar y recrear los meal_food_items
        # o manejar adiciones/eliminaciones/modificaciones de forma granular.
        # Por ahora, solo nos enfocaremos en la creación para el MVP.

        # Para un MVP, se podría decir que una vez creada la comida, los alimentos se manejan por separado o se reconstruyen.
        # Una implementación más robusta implicaría:
        # 1. Obtener los IDs de los MealFoodItems existentes.
        # 2. Iterar sobre meal_food_items_data:
        #    - Si un item_data tiene un ID, intentar actualizarlo.
        #    - Si no tiene ID, crearlo.
        # 3. Eliminar los MealFoodItems existentes que no estén en meal_food_items_data.

        return instance
