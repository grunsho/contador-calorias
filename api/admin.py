from django.contrib import admin

from .models import FoodItem, Meal, MealFoodItem


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

class MealFoodItemInline(admin.TabularInline):
    model = MealFoodItem
    extra = 1
    readonly_fields = ('calculated_calories', 'calculated_proteins', 'calculated_fats', 'calculated_carbs')

@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'meal_type', 'total_calories', 'total_proteins', 'total_fats', 'total_carbs')
    list_filter = ('date', 'meal_type', 'user')
    search_fields = ('user__username', 'food_items__name')
    date_hierarchy = 'date'
    inlines = [MealFoodItemInline]
    
    # Permite ver los campos calculados en la lista de comidas
    def total_calories(self, obj):
        return round(obj.total_calories, 2)
    total_calories.short_description = 'Calorías Totales'

    def total_proteins(self, obj):
        return round(obj.total_proteins, 2)
    total_proteins.short_description = 'Proteínas Totales'

    def total_fats(self, obj):
        return round(obj.total_fats, 2)
    total_fats.short_description = 'Grasas Totales'

    def total_carbs(self, obj):
        return round(obj.total_carbs, 2)
    total_carbs.short_description = 'Carbohidratos Totales'
