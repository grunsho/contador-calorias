from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import FoodItem, Meal, MealFoodItem
from .serializers import (FoodItemSerializer, MealFoodItemSerialazer,
                          MealSerializer, UserRegisterSerializer,
                          UserSerializer)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Si quieres una vista de login personalizada (aunque TokenObtainPairView es suficiente)
# class LoginView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         serializer = LoginSerializer(data=request.data, context={'request': request})
#         serializer.is_valid(raise_exception=True)
#         user = serializer.validated_data['user']
#         refresh = RefreshToken.for_user(user)
#         return Response({
#             "user": UserSerializer(user).data,
#             "refresh": str(refresh),
#             "access": str(refresh.access_token),
#         }, status=status.HTTP_200_OK)


class FoodItemListViewCreate(generics.ListCreateAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', None)
        if search_query is not None:
            queryset = queryset.filter(name__icontains=search_query) | \
                queryset.filter(brand__icontains=search_query)
        return queryset


class MealListCreateView(generics.ListCreateAPIView):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    # Solo usuarios autenticados
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo muestra las comidas del usuario autenticado
        return Meal.objects.filter(user=self.request.user).order_by('-date', 'meal_type')

    def perform_create(self, serializer):
        # Asigna automáticamente el usuario autenticado a la comida
        serializer.save(user=self.request.user)


class MealRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo permite al usuario acceder a sus propias comidas
        return Meal.objects.filter(user=self.request.user)
