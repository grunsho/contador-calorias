# Generated by Django 5.2.3 on 2025-06-13 03:07

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Meal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(verbose_name='Fecha')),
                ('meal_type', models.CharField(choices=[('desayuno', 'Desayuno'), ('media_manana', 'Media Mañana'), ('almuerzo', 'Almuerzo'), ('merienda', 'Merienda'), ('cena', 'Cena'), ('snack', 'Snack')], max_length=20, verbose_name='Tipo de Comida')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meals', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Comida',
                'verbose_name_plural': 'Comidas',
                'ordering': ['date', 'meal_type'],
            },
        ),
        migrations.CreateModel(
            name='MealFoodItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Cantidad Consumida')),
                ('food_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meal_entries', to='api.fooditem', verbose_name='Alimento')),
                ('meal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meal_food_items', to='api.meal', verbose_name='Comida')),
            ],
            options={
                'verbose_name': 'Alimento en Comida',
                'verbose_name_plural': 'Alimentos en Comidas',
                'unique_together': {('meal', 'food_item')},
            },
        ),
        migrations.AddField(
            model_name='meal',
            name='food_items',
            field=models.ManyToManyField(related_name='meals_included', through='api.MealFoodItem', to='api.fooditem', verbose_name='Alimentos'),
        ),
        migrations.AlterUniqueTogether(
            name='meal',
            unique_together={('user', 'date', 'meal_type')},
        ),
    ]
