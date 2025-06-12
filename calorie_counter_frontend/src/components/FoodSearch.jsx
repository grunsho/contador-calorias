import axios from 'axios'
import { useEffect, useState } from 'react'

function FoodSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [foodItems, setFoodItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)

  // Función para obtener el token de acceso desdee localStorage
  const getAccessToken = () => {
    return localStorage.getItem('accessToken')
  }

  const fetchFoodItems = async (query = '') => {
    setLoading(true)
    setError('')
    setFoodItems([])
    setSelectedFood(null)

    try {
      const token = getAccessToken()
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.')
        setLoading(false)
        return
      }

      const response = await axios.get(`http://localhost:8000/api/foods/?search=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setFoodItems(response.data)
    } catch (err) {
      if (err.response && err.response.status == 401) {
        setError('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.')
        // Considerar implementar lógica de refresco de token aquí
      } else if (err.response && err.response.data) {
        setError(`Error al buscar alimentos: ${Object.values(err.response.data).flat().join(' ')}`)
      } else {
        setError('Error fetching food item: ', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar todos los alimentos al inicio o cuando el componente se monta
  useEffect(() => {
    fetchFoodItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Se ejecuta una vez al montar

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchFoodItems(searchTerm)
  }

  const handleFoodClick = (food) => {
    setSelectedFood(food)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Buscar y Explorar Alimentos</h2>
      <form onSubmit={handleSearchSubmit} style={styles.searchButton}>
        <input
          type="text"
          placeholder="Buscar por nombre o marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchTerm('')
            fetchFoodItems()
          }}
          style={styles.resetButton}
        >
          Mostrar Todos
        </button>
      </form>

      {loading && <p style={styles.message}>Cargando alimentos...</p>}
      {error && <p style={styles.errorMessage}>{error}</p>}

      {selectedFood ? (
        <div style={styles.selectedFoodDetail}>
          <h3>
            {selectedFood.name} {selectedFood.brand ? `(${selectedFood.brand})` : ''}
          </h3>
          <p>
            <strong>Porción:</strong> {selectedFood.portion_size_g} {selectedFood.portion_unit}
          </p>
          <p>
            <strong>Calorías:</strong> {selectedFood.calories} kcal
          </p>
          <p>
            <strong>Proteínas:</strong> {selectedFood.proteins} g
          </p>
          <p>
            <strong>Grasas:</strong> {selectedFood.fats} g
          </p>
          <p>
            <strong>Carbohidratos:</strong> {selectedFood.carbohydrates} g
          </p>
          {selectedFood.sugars && (
            <p>
              <strong>Azúcares:</strong> {selectedFood.sugars} g
            </p>
          )}
          {selectedFood.fiber && (
            <p>
              <strong>Fibra:</strong> {selectedFood.fiber} g
            </p>
          )}
          {selectedFood.sodium && (
            <p>
              <strong>Sodio:</strong> {selectedFood.sodium} mg
            </p>
          )}
          <button onClick={() => setSelectedFood(null)} style={styles.backButton}>
            Volver a la lista
          </button>
        </div>
      ) : foodItems.length > 0 ? (
        <ul style={styles.foodList}>
          {foodItems.map((food) => (
            <li key={food.id} style={styles.foodListItem} onClick={() => handleFoodClick(food)}>
              {food.name} {food.brand ? `(${food.brand})` : ''} - {food.calories} kcal
              <span style={styles.viewDetails}>Ver detalles</span>
            </li>
          ))}
        </ul>
      ) : (
        !loading &&
        !error && (
          <p style={styles.message}>
            No se encontraron alimentos. Intenta buscar otra cosa o agrega algunos en el admin de Django.
          </p>
        )
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
    minHeight: 'calc(100vh - 60px)', // Resta la altura de la barra de navegación
    color: '#333',
  },
  heading: {
    color: '#007bff',
    marginBottom: '25px',
    fontSize: '2.2em',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '600px',
    justifyContent: 'center',
  },
  searchInput: {
    flexGrow: 1,
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
  },
  searchButton: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  searchButtonHover: {
    backgroundColor: '#218838',
  },
  resetButton: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
    marginLeft: '5px',
  },
  resetButtonHover: {
    backgroundColor: '#5a6268',
  },
  message: {
    fontSize: '1.1em',
    color: '#555',
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
  foodList: {
    listStyle: 'none',
    padding: 0,
    width: '100%',
    maxWidth: '600px',
  },
  foodListItem: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '15px 20px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  foodListItemHover: {
    backgroundColor: '#e9e9e9',
    transform: 'translateY(-2px)',
  },
  viewDetails: {
    fontSize: '0.9em',
    color: '#007bff',
    textDecoration: 'underline',
  },
  selectedFoodDetail: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '30px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'left',
  },
  backButton: {
    marginTop: '20px',
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
}

export default FoodSearch
