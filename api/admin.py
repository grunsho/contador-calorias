from django.contrib import admin

from .models import FoodItem


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'calories', 'fats', 'proteins',  'carbs', 'portion_size_g',
                    'portion_unit', 'is_custom', 'created_by')
    search_fields = ('name', 'brand')
    list_filter = ('is_custom', 'brand')

    fieldsets = (
        (None, {
            'fields': ('name', 'brand', 'portion_size_g', 'portion_unit')
        }),
        ('Información Nutricional (por la porción definida)', {
            'fields': ('calories', 'proteins', 'fats', 'carbs', 'sugars', 'fiber', 'sodium')
        }),
        ('Detalles Adicionales', {
            'fields': ('created_by', 'is_custom')
        }),
    )
