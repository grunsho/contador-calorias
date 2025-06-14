// src/components/Dashboard.jsx

import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Fecha actual por defecto
  const [dailyMeals, setDailyMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estados para los totales diarios
  const [totalDailyCalories, setTotalDailyCalories] = useState(0)
  const [totalDailyProteins, setTotalDailyProteins] = useState(0)
  const [totalDailyFats, setTotalDailyFats] = useState(0)
  const [totalDailyCarbs, setTotalDailyCarbs] = useState(0)

  // Map de tipos de comida para mostrar nombres legibles
  const MEAL_TYPES_DISPLAY = {
    desayuno: 'Desayuno',
    media_manana: 'Media Mañana',
    almuerzo: 'Almuerzo',
    merienda: 'Merienda',
    cena: 'Cena',
    snack: 'Snack',
  }

  const getAccessToken = () => {
    return localStorage.getItem('accessToken')
  }

  const fetchDailyMeals = async (date) => {
    setLoading(true)
    setError('')
    setDailyMeals([]) // Limpiar meals anteriores
    setTotalDailyCalories(0) // Resetear totales
    setTotalDailyProteins(0)
    setTotalDailyFats(0)
    setTotalDailyCarbs(0)

    try {
      const token = getAccessToken()
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.')
        navigate('/login')
        return
      }

      // Endpoint para obtener comidas por fecha (necesitará un filtro en el backend)
      // Por ahora, traemos todas y filtramos en frontend, pero lo ideal es filtrar en backend
      const response = await axios.get(`http://localhost:8000/api/meals/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Filtrar las comidas por la fecha seleccionada en el frontend
      const filteredMeals = response.data.filter((meal) => meal.date === date)
      setDailyMeals(filteredMeals)

      // Calcular los totales diarios
      let calories = 0
      let proteins = 0
      let fats = 0
      let carbs = 0

      filteredMeals.forEach((meal) => {
        calories += parseFloat(meal.total_calories || 0)
        proteins += parseFloat(meal.total_proteins || 0)
        fats += parseFloat(meal.total_fats || 0)
        carbs += parseFloat(meal.total_carbs || 0)
      })

      setTotalDailyCalories(calories.toFixed(2))
      setTotalDailyProteins(proteins.toFixed(2))
      setTotalDailyFats(fats.toFixed(2))
      setTotalDailyCarbs(carbs.toFixed(2))
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
      } else {
        setError('Error al cargar las comidas diarias.')
        console.error('Error fetching daily meals:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Recuperar el nombre de usuario de localStorage o token si es necesario
    const storedUsername = localStorage.getItem('username') // Asumiendo que guardaste el username al loguear
    if (storedUsername) {
      setUsername(storedUsername)
    } else {
      // Si no hay username, intentar obtenerlo de una API de usuario o redirigir
      // Por ahora, si no hay username, lo dejamos en blanco o redirigimos si no hay token
      if (!getAccessToken()) {
        navigate('/login') // Redirigir si no hay token al montar
      }
    }

    // Cargar comidas para la fecha seleccionada al montar el componente o cambiar la fecha
    fetchDailyMeals(selectedDate)
  }, [selectedDate, navigate]) // Dependencias: recargar si cambia la fecha o navigate (aunque navigate es constante)

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.welcomeHeading}>Bienvenido, {username || 'Usuario'}</h2>
      <h3 style={styles.sectionHeading}>Resumen Nutricional Diario</h3>

      {/* Selector de Fecha */}
      <div style={styles.dateSelector}>
        <label htmlFor="dashboardDate" style={styles.label}>
          Ver resumen para:
        </label>
        <input
          type="date"
          id="dashboardDate"
          value={selectedDate}
          onChange={handleDateChange}
          style={styles.dateInput}
          max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
        />
      </div>

      {loading && <p style={styles.message}>Cargando resumen diario...</p>}
      {error && <p style={styles.errorMessage}>{error}</p>}

      {!loading && !error && (
        <div style={styles.summaryBox}>
          <p style={styles.summaryItem}>
            <strong>Calorías Totales:</strong> {totalDailyCalories} kcal
          </p>
          <p style={styles.summaryItem}>
            <strong>Proteínas Totales:</strong> {totalDailyProteins} g
          </p>
          <p style={styles.summaryItem}>
            <strong>Grasas Totales:</strong> {totalDailyFats} g
          </p>
          <p style={styles.summaryItem}>
            <strong>Carbohidratos Totales:</strong> {totalDailyCarbs} g
          </p>
        </div>
      )}

      <h3 style={styles.sectionHeading}>Tus Comidas Registradas del Día</h3>
      {!loading && !error && dailyMeals.length === 0 && (
        <p style={styles.message}>
          No hay comidas registradas para esta fecha. ¡Comienza a añadir en "Registrar Comida"!
        </p>
      )}

      {!loading && !error && dailyMeals.length > 0 && (
        <div style={styles.mealsListContainer}>
          {dailyMeals.map((meal) => (
            <div key={meal.id} style={styles.mealCard}>
              <h4 style={styles.mealCardTitle}>{MEAL_TYPES_DISPLAY[meal.meal_type] || meal.meal_type}</h4>
              <p style={styles.mealCardDate}>{meal.date}</p>
              <p>
                Calorías: <strong>{parseFloat(meal.total_calories).toFixed(2)}</strong> kcal
              </p>
              <p>
                Proteínas: <strong>{parseFloat(meal.total_proteins).toFixed(2)}</strong> g
              </p>
              <p>
                Grasas: <strong>{parseFloat(meal.total_fats).toFixed(2)}</strong> g
              </p>
              <p>
                Carbohidratos: <strong>{parseFloat(meal.total_carbs).toFixed(2)}</strong> g
              </p>

              <details style={styles.mealDetails}>
                <summary style={styles.mealSummary}>Ver Alimentos</summary>
                <ul style={styles.mealFoodItemsList}>
                  {meal.meal_food_items.map((foodItem) => (
                    <li key={foodItem.id} style={styles.mealFoodItem}>
                      {foodItem.food_item_name} ({foodItem.food_item_brand || 'Sin marca'}) - {foodItem.quantity}
                      {foodItem.food_item_portion_unit}
                      <br />
                      <span style={styles.foodItemMacros}>
                        Cal: {parseFloat(foodItem.calculated_calories).toFixed(2)} | Prot:{' '}
                        {parseFloat(foodItem.calculated_proteins).toFixed(2)}g | Gra:{' '}
                        {parseFloat(foodItem.calculated_fats).toFixed(2)}g | Carb:{' '}
                        {parseFloat(foodItem.calculated_carbs).toFixed(2)}g
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    minHeight: 'calc(100vh - 60px)',
    color: '#333',
  },
  welcomeHeading: {
    color: '#007bff',
    marginBottom: '30px',
    fontSize: '2.5em',
    textAlign: 'center',
  },
  sectionHeading: {
    color: '#555',
    marginBottom: '20px',
    fontSize: '1.8em',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
    width: '100%',
    maxWidth: '800px',
    textAlign: 'center',
    marginTop: '30px',
  },
  dateSelector: {
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    padding: '15px 25px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: '1.1em',
  },
  dateInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  summaryBox: {
    backgroundColor: '#e9f7ef',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    marginBottom: '40px',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center',
    borderLeft: '8px solid #28a745',
  },
  summaryItem: {
    fontSize: '1.2em',
    margin: '8px 0',
    color: '#333',
  },
  message: {
    fontSize: '1.1em',
    color: '#555',
    textAlign: 'center',
    marginTop: '20px',
  },
  errorMessage: {
    color: 'red',
    backgroundColor: '#ffe0e0',
    border: '1px solid red',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  mealsListContainer: {
    width: '100%',
    maxWidth: '800px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  mealCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    borderLeft: '5px solid #007bff',
    display: 'flex',
    flexDirection: 'column',
  },
  mealCardTitle: {
    color: '#007bff',
    marginBottom: '10px',
    fontSize: '1.4em',
  },
  mealCardDate: {
    fontSize: '0.9em',
    color: '#888',
    marginBottom: '15px',
  },
  mealDetails: {
    marginTop: '15px',
    borderTop: '1px dashed #eee',
    paddingTop: '10px',
  },
  mealSummary: {
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#007bff',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  mealFoodItemsList: {
    listStyle: 'none',
    paddingLeft: '10px',
    marginTop: '10px',
  },
  mealFoodItem: {
    backgroundColor: '#f9f9f9',
    padding: '8px 12px',
    borderRadius: '4px',
    marginBottom: '5px',
    border: '1px solid #f0f0f0',
  },
  foodItemMacros: {
    fontSize: '0.85em',
    color: '#666',
  },
}

export default Dashboard
