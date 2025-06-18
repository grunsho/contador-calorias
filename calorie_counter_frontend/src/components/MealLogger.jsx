import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function MealLogger() {
  const navigate = useNavigate()

  // Estados para la comida actual
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [mealType, setMealType] = useState('desayuno')
  const [mealFoodItems, setMealFoodItems] = useState([])

  // Estados para búsqueda de alimentos
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Estados para el manejo de la petición de guardado
  const [loadingSave, setLoadingSave] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const MEAL_TYPES_OPTIONS = [
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'media_manana', label: 'Media Mañana' },
    { value: 'almuerzo', label: 'Almuerzo' },
    { value: 'merienda', label: 'Merienda' },
    { value: 'cena', label: 'Cena' },
    { value: 'snack', label: 'Snack' },
  ]

  // Funciones de utilidad

  const getAccessToken = () => {
    return localStorage.getItem('accessToken')
  }

  const calculateMacros = (foodItem, quantity) => {
    if (!foodItem || !quantity || foodItem.portion_size_g === 0) {
      return { calories: 0, proteins: 0, fats: 0, carbs: 0 }
    }
    const ratio = parseFloat(quantity) / parseFloat(foodItem.portion_size_g)
    return {
      calories: (parseFloat(foodItem.calories) * ratio).toFixed(2),
      proteins: (parseFloat(foodItem.proteins) * ratio).toFixed(2),
      fats: (parseFloat(foodItem.fats) * ratio).toFixed(2),
      carbs: (parseFloat(foodItem.carbs) * ratio).toFixed(2),
    }
  }

  const calculateMealTotals = () => {
    let totalCalories = 0
    let totalProteins = 0
    let totalFats = 0
    let totalCarbs = 0

    mealFoodItems.forEach((item) => {
      totalCalories += parseFloat(item.calculated_calories || 0)
      totalProteins += parseFloat(item.calculated_proteins || 0)
      totalFats += parseFloat(item.calculated_fats || 0)
      totalCarbs += parseFloat(item.calculated_carbs || 0)
    })

    return {
      totalCalories: totalCalories.toFixed(2),
      totalProteins: totalProteins.toFixed(2),
      totalFats: totalFats.toFixed(2),
      totalCarbs: totalCarbs.toFixed(2),
    }
  }

  const mealTotals = calculateMealTotals()

  // Funciones de búsqueda de alimentos

  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchTerm(query)
    setSearchResults([]) // Limpiar resultados al cambiar la búsqueda
    setSearchError('')

    if (query.length < 3) {
      setLoadingSearch(false)
      return
    }

    const token = getAccessToken()

    if (!token) {
      setSearchError('Por favor, inicia sesión para buscar alimentos.')
      setLoadingSearch(false)
      return
    }

    setLoadingSearch(true)

    try {
      const response = await axios.get(`http://localhost:8000/api/foods/?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSearchResults(response.data)
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setSearchError('Sesión expirada. Inicia sesión de nuevo.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
      } else {
        setSearchError('Error al buscar alimentos. Intenta de nuevo.')
        console.error('Search error: ', err)
      }
    } finally {
      setLoadingSearch(false)
    }
  }

  // Funciones de manejo de alimentos en la comida

  const addFoodToMeal = (foodItem) => {
    // Revisa si el alimento ya está en la comida
    const existingItem = mealFoodItems.find((item) => item.food_item.id === foodItem.id)
    if (existingItem) {
      // Si ya existe, puede incrementar la cantidad o simplemente no añadirlo de nuevo
      alert('Este alimento ya ha sido añadido a la comida. Edita la cantidad si lo deseas')
      return
    }

    const initialQuantity = foodItem.portion_size_g
    const calculated = calculateMacros(foodItem, initialQuantity)

    setMealFoodItems((prevItems) => [
      ...prevItems,
      {
        food_item: foodItem,
        quantity: initialQuantity,
        calculated_calories: calculated.calories,
        calculated_proteins: calculated.proteins,
        calculated_fats: calculated.fats,
        calculated_carbs: calculated.carbs,
      },
    ])
    setSearchTerm('')
    setSearchResults([])
  }

  const updateFoodQuantity = (foodId, newQuantity) => {
    setMealFoodItems((prevItems) =>
      prevItems.map((item) => {
        if (item.food_item.id === foodId) {
          const calculated = calculateMacros(item.food_item, newQuantity)
          return {
            ...item,
            quantity: newQuantity,
            calculated_calories: calculated.calories,
            calculated_proteins: calculated.proteins,
            calculated_fats: calculated.fats,
            calculated_carbs: calculated.carbs,
          }
        }
        return item
      })
    )
  }

  const removeFoodFromMeal = (foodId) => {
    setMealFoodItems((prevItems) => prevItems.filter((item) => item.food_item.id !== foodId))
  }

  const handleSaveMeal = async () => {
    setLoadingSave(true)
    setSaveError('')
    setSaveSuccess('')

    if (mealFoodItems.length === 0) {
      setSaveError('Debe añadir al menos un alimento a la comida.')
      setLoadingSave(false)
      return
    }

    const token = getAccessToken()

    if (!token) {
      setSaveError('Por favor, inicia sesión para guardar la comida.')
      setLoadingSave(false)
      return
    }

    try {
      const payload = {
        date: selectedDate,
        meal_type: mealType,
        meal_food_items: mealFoodItems.map((item) => ({
          food_item: item.food_item.id,
          quantity: item.quantity,
        })),
      }

      const response = await axios.post('http://localhost:8000/api/meals/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSaveSuccess('¡Comida registrada con éxito!')
      console.log('Comida guardada: ', response.data)
      // Opcional: limpiar el formulario o redirigir
      setMealFoodItems([]) // Limpiar alimentos de la comida actual
      // setSelectedDate(new Date().toISOString().split('T')[0]) // Resetear fecha a hoy
      // setMealType('desayuno') // Resetear tipo de comida

      // Si tienes un Dashboard con una lista de comidas, podrías redirigir allí.
      // navigate('/dashboard')
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMessages = Object.values(err.response.data).flat().join(' ')
        setSaveError(`Error al guardar la comida: ${errorMessages}`)
      } else if (err.response && err.response.status === 401) {
        setSaveError('Sesión expirada. Inicie sesión de nuevo.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
      } else {
        setSaveError('Ocurrió un error inesperado al guardar la comida.')
      }
      console.error('Save meal error: ', err)
    } finally {
      setLoadingSave(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Registrar Nueva Comida</h2>

      {/* Selección de Fecha y Tipo de Comida */}
      <div style={styles.formSection}>
        <div style={styles.formGroup}>
          <label htmlFor="date" style={styles.label}>
            Fecha:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.input}
            max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="mealType" style={styles.label}>
            Tipo de Comida:
          </label>
          <select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} style={styles.select}>
            {MEAL_TYPES_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Búsqueda de Alimentos */}
      <div style={styles.searchSection}>
        <h3 style={styles.subHeading}>Añadir Alimentos</h3>
        <input
          type="text"
          placeholder="Buscar alimento..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
        {loadingSearch && <p style={styles.message}>Buscando...</p>}
        {searchError && <p style={styles.errorMessage}>{searchError}</p>}
        {searchResults.length > 0 && (
          <ul style={styles.searchResultsList}>
            {searchResults.map((food) => (
              <li key={food.id} style={styles.searchResultItem}>
                <span>
                  {food.name} {food.brand ? `(${food.brand})` : ''}
                </span>
                <button onClick={() => addFoodToMeal(food)} style={styles.addFoodButton}>
                  Añadir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alimentos en la Comida Actual */}
      <div style={styles.currentMealSection}>
        <h3 style={styles.subHeading}>
          Alimentos en esta {MEAL_TYPES_OPTIONS.find((mt) => mt.value === mealType)?.label}
        </h3>
        {mealFoodItems.length === 0 ? (
          <p style={styles.message}>No has añadido alimentos a esta comida aún.</p>
        ) : (
          <ul style={styles.mealFoodList}>
            {mealFoodItems.map((item) => (
              <li key={item.food_item.id} style={styles.mealFoodListItem}>
                <div style={styles.mealFoodItemInfo}>
                  <span>
                    {item.food_item.name} {item.food_item.brand ? `(${item.food_item.brand})` : ''}
                  </span>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateFoodQuantity(item.food_item.id, e.target.value)}
                    min="0.1"
                    step="0.1"
                    style={styles.quantityInput}
                  />
                  <span> {item.food_item.portion_unit}</span>
                  <button onClick={() => removeFoodFromMeal(item.food_item.id)} style={styles.removeFoodButton}>
                    X
                  </button>
                </div>
                <div style={styles.mealFoodItemMacros}>
                  <span>Cal: {item.calculated_calories}</span>
                  <span>Prot: {item.calculated_proteins}g</span>
                  <span>Gra: {item.calculated_fats}g</span>
                  <span>Carb: {item.calculated_carbs}g</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totales de la Comida */}
      <div style={styles.totalsSection}>
        <h3 style={styles.subHeading}>Totales de la Comida</h3>
        <p>
          <strong>Calorías:</strong> {mealTotals.totalCalories} kcal
        </p>
        <p>
          <strong>Proteínas:</strong> {mealTotals.totalProteins} g
        </p>
        <p>
          <strong>Grasas:</strong> {mealTotals.totalFats} g
        </p>
        <p>
          <strong>Carbohidratos:</strong> {mealTotals.totalCarbs} g
        </p>
      </div>

      {/* Botón Guardar */}
      <div style={styles.saveSection}>
        {saveError && <p style={styles.errorMessage}>{saveError}</p>}
        {saveSuccess && <p style={styles.successMessage}>{saveSuccess}</p>}
        <button onClick={handleSaveMeal} disabled={loadingSave} style={styles.saveButton}>
          {loadingSave ? 'Guardando...' : 'Guardar Comida'}
        </button>
      </div>
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
  heading: {
    color: '#007bff',
    marginBottom: '25px',
    fontSize: '2.2em',
  },
  subHeading: {
    color: '#555',
    marginBottom: '15px',
    fontSize: '1.5em',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
    width: '100%',
    textAlign: 'center',
  },
  formSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '600px',
    justifyContent: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  searchSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '600px',
    position: 'relative', // Para posicionar la lista de resultados
  },
  searchInput: {
    width: 'calc(100% - 20px)',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
    marginBottom: '10px',
  },
  searchResultsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    border: '1px solid #eee',
    borderRadius: '5px',
    maxHeight: '200px',
    overflowY: 'auto',
    position: 'absolute',
    width: 'calc(100% - 40px)', // Ajustar al padding del contenedor
    backgroundColor: 'white',
    zIndex: 100,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    left: '20px',
    top: 'calc(100% - 10px)', // Para que aparezca debajo del input
  },
  searchResultItem: {
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchResultItemHover: {
    backgroundColor: '#f9f9f9',
  },
  addFoodButton: {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  currentMealSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '600px',
  },
  mealFoodList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  mealFoodListItem: {
    border: '1px solid #eee',
    borderRadius: '5px',
    padding: '10px 15px',
    marginBottom: '10px',
    backgroundColor: '#fdfdfd',
  },
  mealFoodItemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px',
    flexWrap: 'wrap',
  },
  quantityInput: {
    width: '60px',
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '0.9em',
  },
  removeFoodButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '0.8em',
    marginLeft: 'auto', // Alinea a la derecha
  },
  mealFoodItemMacros: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.9em',
    color: '#666',
    marginTop: '5px',
    flexWrap: 'wrap',
  },
  totalsSection: {
    backgroundColor: '#e9f7ef',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '600px',
    borderLeft: '5px solid #28a745',
  },
  saveSection: {
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center',
  },
  saveButton: {
    padding: '15px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.2em',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  message: {
    color: '#555',
    marginTop: '10px',
    textAlign: 'center',
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
  successMessage: {
    color: 'green',
    backgroundColor: '#e0ffe0',
    border: '1px solid green',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
  },
}

export default MealLogger
