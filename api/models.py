from django.contrib.auth.models import User
from django.db import models


class FoodItem(models.Model):
    # Campos básicos del alimento
    name = models.CharField(max_length=255, unique=True,
                            verbose_name="Nombre del alimento")
    brand = models.CharField(max_length=255, blank=True,
                             null=True, verbose_name="Marca (Opcional)")
    portion_size_g = models.DecimalField(
        max_digits=7, decimal_places=2, default=100.00, verbose_name="Tamaño de porción (g)")
    portion_unit = models.CharField(
        max_length=50, default="g", verbose_name="Unidad de porción")

    # Información nutricional por la porción definida (ej. por 100g)
    calories = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, verbose_name="Calorías (kcal)")
    proteins = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, verbose_name="Proteínas (g)")
    fats = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, verbose_name="Grasas (g)")
    carbs = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, verbose_name="Carbohidratos (g)")

    # Campos adicionales (opcionales para el MVP, pero útiles para el futuro)
    sugars = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, blank=True, null=True, verbose_name="Azúcares (g)")
    fiber = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, blank=True, null=True, verbose_name="Fibra (g)")
    sodium = models.DecimalField(
        max_digits=7, decimal_places=2, default=0.00, blank=True, null=True, verbose_name="Sodio (mg)")

    # Relación para alimentos creados por el usuario (puede ser NULL si es un alimento de la base de datos general)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_food_items', verbose_name="Creado por")
    is_custom = models.BooleanField(
        default=False, verbose_name="¿Es un alimento personalizado?")

    class Meta:
        verbose_name = "Alimento"
        verbose_name_plural = "Alimentos"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.portion_size_g}{self.portion_unit}) - {self.calories} kcal"

    def save(self, *args, **kwargs):
        # Asegurarse de que si tiene un 'created_by', 'is_custom' sea True
        if self.created_by and not self.is_custom:
            self.is_custom = True
        super().save(*args, **kwargs)


class Meal(models.Model):
    MEAL_TYPES = [
        ('desayuno', 'Desayuno'),
        ('media_manana', 'Media Mañana'),
        ('almuerzo', 'Almuerzo'),
        ('merienda', 'Merienda'),
        ('cena', 'Cena'),
        ('snack', 'Snack'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='meals', verbose_name="Usuario")
    date = models.DateField(verbose_name="Fecha")
    meal_type = models.CharField(
        max_length=20, choices=MEAL_TYPES, verbose_name="Tipo de Comida")

    # Relación de muchos a muchos con FoodItem a través de MealFoodItem
    food_items = models.ManyToManyField(
        FoodItem, through='MealFoodItem', related_name='meals_included', verbose_name="Alimentos")

    class Meta:
        verbose_name = "Comida"
        verbose_name_plural = "Comidas"
        # Un usuario solo puede tener un tipo de comida por día
        unique_together = ('user', 'date', 'meal_type')
        ordering = ['date', 'meal_type']

    def __str__(self):
        return f"{self.get_meal_type_display()} de {self.user.username} en {self.date}"

    # Propiedades calculadas para sumar los macros de la comida
    @property
    def total_calories(self):
        return sum(item.calculated_calories for item in self.meal_food_items.all())

    @property
    def total_proteins(self):
        return sum(item.calculated_proteins for item in self.meal_food_items.all())

    @property
    def total_fats(self):
        return sum(item.calculated_fats for item in self.meal_food_items.all())

    @property
    def total_carbs(self):
        return sum(item.calculated_carbs for item in self.meal_food_items.all())


class MealFoodItem(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE,
                             related_name='meal_food_items', verbose_name="Comida")
    food_item = models.ForeignKey(
        FoodItem, on_delete=models.CASCADE, related_name='meal_entries', verbose_name="Alimento")
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Cantidad Consumida")

    class Meta:
        verbose_name = "Alimento en Comida"
        verbose_name_plural = "Alimentos en Comidas"
        unique_together = ('meal', 'food_item')

    def __str__(self):
        return f"{self.quantity} {self.food_item.portion_unit} of {self.food_item.name} in {self.meal}"

    # Propiedades calculadas para este alimento en esta cantidad
    @property
    def calculated_calories(self):
        if self.food_item.portion_size_g:
            return (self.food_item.calories / self.food_item.portion_size_g) * self.quantity
        return 0

    @property
    def calculated_proteins(self):
        if self.food_item.portion_size_g:
            return (self.food_item.proteins / self.food_item.portion_size_g) * self.quantity
        return 0

    @property
    def calculated_fats(self):
        if self.food_item.portion_size_g:
            return (self.food_item.fats / self.food_item.portion_size_g) * self.quantity
        return 0

    @property
    def calculated_carbs(self):
        if self.food_item.portion_size_g:
            return (self.food_item.carbs / self.food_item.portion_size_g) * self.quantity
        return 0
