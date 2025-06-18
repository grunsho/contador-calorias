import axios from 'axios'
import React, { useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider, // Para animar la expansión de detalles
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'

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
    console.log('fetchFoodItems llamado con query:', query) //CONSOLE 1
    setLoading(true)
    setError('')
    setFoodItems([])
    setSelectedFood(null) // Limpiar selección al buscar/resetear

    try {
      const token = getAccessToken()
      console.log('Token obtenido:', token ? 'Sí' : 'No') // CONSOLE 2
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.')
        // Considerar redirigir al login si no hay token
        NavigationHistoryEntry('/login')
        setLoading(false)
        return
      }

      // // Validación de longitud mínima para búsqueda
      // if (query.length > 0 && query.length < 3) {
      //   setError('Ingresa al menos 3 caracteres para una búsqueda específica.')
      //   setLoading(false)
      //   return
      // }
      console.log('Realizando petición GET a:', `http://localhost:8000/api/foods/?search=${query}`) // CONSOLE 3

      const response = await axios.get(`http://localhost:8000/api/foods/?search=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log('Respuesta de la API:', response.data) // CONSOLE 4

      setFoodItems(response.data)
      if (response.data.length === 0 && query.length > 0) {
        setError('No se encontraron alimentos con ese término de búsqueda.')
      }
    } catch (err) {
      console.error('Error en fetchFoodItems:', err) // CONSOLE 5

      if (err.response && err.response.status == 401) {
        setError('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.')
        // Considerar implementar lógica de refresco de token aquí
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        NavigationHistoryEntry('/login')
      } else if (err.response && err.response.data) {
        setError(`Error al buscar alimentos: ${Object.values(err.response.data).flat().join(' ')}`)
      } else {
        setError('Error fetching food item: ', err)
      }
    } finally {
      console.log('fetchFoodItems finalizado. Loading:', false) // CONSOLE 6
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

  const handleBackToList = () => {
    setSelectedFood(null)
    // Si quieres que al volver se muestre la búsqueda anterior, no llames a fetchFoodItems()
    fetchFoodItems()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 128px)',
        padding: '20px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '800px', // Un poco más ancho para los resultados
          width: '100%',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Buscar y explorar alimentos
        </Typography>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <TextField
            label="Buscar por nombre o marca..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => {
              setSearchTerm('')
              fetchFoodItems('')
            }}
          >
            Mostrar todos
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Buscando...</Typography>
          </Box>
        )}

        {/* Contenido de alimentos: lista o detalles del seleccionado */}
        <Box sx={{ mt: 3, width: '100%', minHeight: '200px' }}>
          {' '}
          {/* Contenedor para manejar la altura mínima */}
          <Collapse in={selectedFood !== null} unmountOnExit>
            {selectedFood && (
              <Paper elevation={2} sx={{ padding: '30px', textAlign: 'left', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" component="h3" color="primary">
                    {selectedFood.name} {selectedFood.brand ? `(${selectedFood.brand})` : ''}
                  </Typography>
                  <IconButton onClick={handleBackToList} color="primary" aria-label="Volver a la lista">
                    <ArrowBackIcon />
                  </IconButton>
                </Box>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Porción:</strong> {selectedFood.portion_size_g} {selectedFood.portion_unit}
                </Typography>
                <Typography variant="body1">
                  <strong>Calorías:</strong> {selectedFood.calories} kcal
                </Typography>
                <Typography variant="body1">
                  <strong>Proteínas:</strong> {selectedFood.proteins} g
                </Typography>
                <Typography variant="body1">
                  <strong>Grasas:</strong> {selectedFood.fats} g
                </Typography>
                <Typography variant="body1">
                  <strong>Carbohidratos:</strong> {selectedFood.carbs} g
                </Typography>
                {selectedFood.sugars !== null && ( // Comprobar si el valor no es null
                  <Typography variant="body1">
                    <strong>Azúcares:</strong> {selectedFood.sugars} g
                  </Typography>
                )}
                {selectedFood.fiber !== null && (
                  <Typography variant="body1">
                    <strong>Fibra:</strong> {selectedFood.fiber} g
                  </Typography>
                )}
                {selectedFood.sodium !== null && (
                  <Typography variant="body1">
                    <strong>Sodio:</strong> {selectedFood.sodium} mg
                  </Typography>
                )}
              </Paper>
            )}
          </Collapse>
          <Collapse in={selectedFood === null && foodItems.length > 0 && !loading} unmountOnExit>
            <Paper elevation={1} sx={{ width: '100%', maxHeight: '500px', overflowY: 'auto' }}>
              <List>
                {foodItems.map((food, index) => (
                  <React.Fragment key={food.id}>
                    <ListItem
                      button // Hace que el ListItem sea clickable y muestre efecto ripple/hover
                      onClick={() => handleFoodClick(food)}
                      alignItems="flex-start"
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" color="text.primary">
                            {food.name} ({food.brand || 'Sin marca'})
                          </Typography>
                        }
                        secondary={
                          <Typography component="span" variant="body2" color="text.secondary">
                            {/* AHORA SÍ, UNA PLANTILLA DE CADENA DE JAVASCRIPT */}
                            {`${food.portion_size_g}${food.portion_unit} (${food.calories} kcal) - P: ${food.proteins}g, G: ${food.fats}g, C: ${food.carbs}g`}
                          </Typography>
                        }
                      />
                      {/* Puedes añadir un icono para indicar que es clickable */}
                      {/* <ChevronRightIcon /> */}
                    </ListItem>
                    {index < foodItems.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Collapse>
          {selectedFood === null && foodItems.length === 0 && !loading && !error && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
              No se encontraron alimentos. Intenta buscar otra cosa o agrega algunos en el admin de Django.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>

    // <div style={styles.container}>
    //   <h2 style={styles.heading}>Buscar y Explorar Alimentos</h2>
    //   <form onSubmit={handleSearchSubmit} style={styles.searchButton}>
    //     <input
    //       type="text"
    //       placeholder="Buscar por nombre o marca..."
    //       value={searchTerm}
    //       onChange={(e) => setSearchTerm(e.target.value)}
    //       style={styles.searchInput}
    //     />
    //     <button type="submit" style={styles.searchButton}>
    //       Buscar
    //     </button>
    //     <button
    //       type="button"
    //       onClick={() => {
    //         setSearchTerm('')
    //         fetchFoodItems()
    //       }}
    //       style={styles.resetButton}
    //     >
    //       Mostrar Todos
    //     </button>
    //   </form>

    //   {loading && <p style={styles.message}>Cargando alimentos...</p>}
    //   {error && <p style={styles.errorMessage}>{error}</p>}

    //   {selectedFood ? (
    //     <div style={styles.selectedFoodDetail}>
    //       <h3>
    //         {selectedFood.name} {selectedFood.brand ? `(${selectedFood.brand})` : ''}
    //       </h3>
    //       <p>
    //         <strong>Porción:</strong> {selectedFood.portion_size_g} {selectedFood.portion_unit}
    //       </p>
    //       <p>
    //         <strong>Calorías:</strong> {selectedFood.calories} kcal
    //       </p>
    //       <p>
    //         <strong>Proteínas:</strong> {selectedFood.proteins} g
    //       </p>
    //       <p>
    //         <strong>Grasas:</strong> {selectedFood.fats} g
    //       </p>
    //       <p>
    //         <strong>Carbohidratos:</strong> {selectedFood.carbohydrates} g
    //       </p>
    //       {selectedFood.sugars && (
    //         <p>
    //           <strong>Azúcares:</strong> {selectedFood.sugars} g
    //         </p>
    //       )}
    //       {selectedFood.fiber && (
    //         <p>
    //           <strong>Fibra:</strong> {selectedFood.fiber} g
    //         </p>
    //       )}
    //       {selectedFood.sodium && (
    //         <p>
    //           <strong>Sodio:</strong> {selectedFood.sodium} mg
    //         </p>
    //       )}
    //       <button onClick={() => setSelectedFood(null)} style={styles.backButton}>
    //         Volver a la lista
    //       </button>
    //     </div>
    //   ) : foodItems.length > 0 ? (
    //     <ul style={styles.foodList}>
    //       {foodItems.map((food) => (
    //         <li key={food.id} style={styles.foodListItem} onClick={() => handleFoodClick(food)}>
    //           {food.name} {food.brand ? `(${food.brand})` : ''} - {food.calories} kcal
    //           <span style={styles.viewDetails}>Ver detalles</span>
    //         </li>
    //       ))}
    //     </ul>
    //   ) : (
    //     !loading &&
    //     !error && (
    //       <p style={styles.message}>
    //         No se encontraron alimentos. Intenta buscar otra cosa o agrega algunos en el admin de Django.
    //       </p>
    //     )
    //   )}
    // </div>
  )
}

export default FoodSearch
