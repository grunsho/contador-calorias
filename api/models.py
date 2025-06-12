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
