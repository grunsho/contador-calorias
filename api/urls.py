from django.urls import path
from rest_framework_simplejwt.views import (TokenObtainPairView,
                                            TokenRefreshView)

from .views import (FoodItemListViewCreate, MealListCreateView,
                    MealRetrieveUpdateDestroyView, RegisterView)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('foods/', FoodItemListViewCreate.as_view(), name='food_list_create'),
    path('meals/', MealListCreateView.as_view(), name='meal_list_create'),
    path('meals/<int:pk>', MealRetrieveUpdateDestroyView.as_view(),
         name='meal_retrieve_update_destroy')
]
