import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'

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

  // Estado para controlar la cantidad de un alimento que se quiere añadir a la comida
  const [foodToAddQuantity, setFoodToAddQuantity] = useState('')
  // Estado para el alimento "seleccionado" de la búsqueda para añadir a la comida
  const [foodToAddToMeal, setFoodToAddToMeal] = useState(null)

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
    setFoodToAddToMeal(null)

    if (query.length < 3) {
      setLoadingSearch(false)
      return
    }

    const token = getAccessToken()

    if (!token) {
      setSearchError('Por favor, inicia sesión para buscar alimentos.')
      setLoadingSearch(false)
      navigate('/login')
      return
    }

    setLoadingSearch(true)

    try {
      const response = await axios.get(`http://localhost:8000/api/foods/?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSearchResults(response.data)
      if (response.data === 0) {
        setSearchError('No se encontraron alimentos con ese término de búsqueda')
      }
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

  // Seleccionar un alimento de los resultados de búsqueda para añadir
  const handleSelectedFoodForAdd = (foodItem) => {
    setFoodToAddToMeal(foodItem)
    setFoodToAddQuantity(foodItem.portion_size_g || '0')
    setSearchResults([])
    setSearchTerm('')
    setSearchError('')
  }

  // Añadir el alimento seleccionado con su cantidad a la comida actual
  const handleAddFoodToMealList = () => {
    if (!foodToAddToMeal || !foodToAddQuantity || parseFloat(foodToAddQuantity) <= 0) {
      setSearchError('Por favor, ingrese una cantidad válida.')
      return
    }

    // Revisa si el alimento ya está en la comida
    const existingItemIndex = mealFoodItems.findIndex((item) => item.food_item.id === foodToAddToMeal.id)
    if (existingItemIndex > -1) {
      setSearchError('Este alimento ya está en tu comida. Edita la cantidad directamente en la comida.')
      return
    }

    const calculated = calculateMacros(foodToAddToMeal, foodToAddQuantity)

    setMealFoodItems((prevItems) => [
      ...prevItems,
      {
        // Necesitamos una key única si se añade el mismo alimento varias veces
        // O si el backend espera un array de objetos sin IDs duplicados para el mismo item.
        // Para evitar conflictos de key en React si se añade el mismo alimento:
        uniqueId: `<span class="math-inline">{foodToAddToMeal.id}-</span>{Date.now()}`, // Añadir un uniqueId para React Key
        food_item: foodToAddToMeal,
        quantity: parseFloat(foodToAddQuantity),
        calculated_calories: calculated.calories,
        calculated_proteins: calculated.proteins,
        calculated_fats: calculated.fats,
        calculated_carbs: calculated.carbs, // Usar 'carbs'
      },
    ])

    // Limpieza
    setFoodToAddToMeal(null)
    setFoodToAddQuantity('')
    setSearchError('')
  }

  const updateFoodQuantity = (uniqueId, newQuantity) => {
    const parsedQuantity = parseFloat(newQuantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      // Mostrar error o no hacer nada
      return
    }

    setMealFoodItems((prevItems) =>
      prevItems.map((item) => {
        if (item.uniqueId === uniqueId) {
          const calculated = calculateMacros(item.food_item, parsedQuantity)
          return {
            ...item,
            quantity: parsedQuantity,
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

  const removeFoodFromMeal = (uniqueId) => {
    setMealFoodItems((prevItems) => prevItems.filter((item) => item.uniqueId !== uniqueId))
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
      navigate('/login')
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
      // Limpiar el formulario después de guardar
      setMealFoodItems([])
      setSearchTerm('')
      setSearchResults([])
      setFoodToAddToMeal(null)
      setFoodToAddQuantity('')
      setSaveError('') // Limpiar cualquier error previo
      setSearchError('') // Limpiar errores de búsqueda
      // Puedes optar por no resetear la fecha y el tipo de comida
      // setSelectedDate(new Date().toISOString().split('T')[0]);
      // setMealType('desayuno');
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
          maxWidth: { xs: '95%', sm: '700px', md: '800px' }, // Adaptable a diferentes tamaños
          width: '100%',
          borderRadius: '8px',
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Registrar nueva comida
        </Typography>

        {/* Mensajes de éxito y error globales */}
        {(saveError || searchError) && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {saveError || searchError}
          </Alert>
        )}
        {saveSuccess && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            {saveSuccess}
          </Alert>
        )}

        {/* Selección de fecha y tipo de comida */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: '20px',
            mb: 2,
            justifyContent: 'center',
          }}
        >
          <TextField
            label="Fecha"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: '200px' } }}
            max={new Date().toISOString().split('T')[0]}
          />
          <FormControl sx={{ width: { xs: '100%', sm: '200px' } }}>
            <InputLabel id="meal-type-label">Tipo de Comida</InputLabel>
            <Select
              labelId="meal-type-label"
              id="mealType"
              value={mealType}
              label="Tipo de Comida"
              onChange={(e) => setMealType(e.target.value)}
            >
              {MEAL_TYPES_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Sección de búsqueda de alimentos */}
        <Typography variant="h5" compoent="h2" sx={{ mt: 2, mb: 1, color: 'text.primary' }}>
          Añadir alimentos
        </Typography>
        <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ display: 'flex', gap: '10px', width: '100%' }}>
          <TextField
            label="Buscar alimento por nombre o marca..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {loadingSearch && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, width: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Buscando...</Typography>
          </Box>
        )}

        {/* Resultados de la Búsqueda - solo si no hay alimento para añadir seleccionado */}
        <Collapse in={searchResults.length > 0 && !loadingSearch && foodToAddToMeal === null} unmountOnExit>
          <Paper elevation={1} sx={{ mt: 2, width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
            <List>
              {searchResults.map((food, index) => (
                <React.Fragment key={food.id}>
                  <ListItem button onClick={() => handleSelectedFoodForAdd(food)} alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="h6" color="text.primary">
                          {food.name} ({food.brand || 'Sin marca'})
                        </Typography>
                      }
                      secondary={
                        <Typography component="span" variant="body2" color="text.secondary">
                          {`${food.portion_size_g}${food.portion_unit} (${food.calories} kcal) - P: ${food.proteins}g, G: ${food.fats}g, C: ${food.carbs}g`}
                        </Typography>
                      }
                    />
                    <IconButton edge="end" aria-label="añadir" onClick={() => handleSelectedFoodForAdd(food)}>
                      <AddCircleOutlineIcon color="primary" />
                    </IconButton>
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Collapse>

        {/* Formulario para Añadir Alimento a la Comida (después de seleccionar de la búsqueda) */}
        <Collapse in={foodToAddToMeal !== null} unmountOnExit>
          {foodToAddToMeal && (
            <Paper
              elevation={2}
              sx={{ padding: '30px', mt: 3, width: '100%', textAlign: 'left', bgcolor: 'background.paper' }}
            >
              <Typography variant="h6" gutterBottom>
                Añadir a la Comida: {foodToAddToMeal.name} ({foodToAddToMeal.brand || 'Sin marca'})
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: '10px',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <TextField
                  label={`Cantidad en ${foodToAddToMeal.portion_unit || 'g'}`}
                  type="number"
                  variant="outlined"
                  value={foodToAddQuantity}
                  onChange={(e) => setFoodToAddQuantity(e.target.value)}
                  slotProps={{
                    input: { min: '0', step: '0.1' },
                  }}
                  sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAddFoodToMealList}
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Añadir a la Comida
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setFoodToAddToMeal(null)
                    setFoodToAddQuantity('')
                    setSearchError('')
                  }}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancelar
                </Button>
              </Box>
            </Paper>
          )}
        </Collapse>

        {/* Alimentos en la Comida Actual */}
        <Typography variant="h5" component="h2" sx={{ mt: 3, mb: 1, color: 'text.primary' }}>
          Alimentos en esta {MEAL_TYPES_OPTIONS.find((mt) => mt.value === mealType)?.label} (
          {format(new Date(selectedDate), 'PPPP', { locale: es })})
        </Typography>
        {mealFoodItems.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            No has añadido alimentos a esta comida aún.
          </Typography>
        ) : (
          <Paper elevation={1} sx={{ mt: 2, width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
            <List>
              {mealFoodItems.map((item, index) => (
                <React.Fragment key={item.uniqueId}>
                  {' '}
                  {/* Usar uniqueId */}
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" aria-label="eliminar" onClick={() => removeFoodFromMeal(item.uniqueId)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    }
                    alignItems="flex-start"
                    sx={{ py: 1.5 }} // Padding vertical para los items
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" color="text.primary">
                          {item.food_item.name} {item.food_item.brand ? `(${item.food_item.brand})` : ''}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            flexWrap: 'wrap',
                            gap: { xs: 0.5, sm: 2 },
                            mt: 0.5,
                          }}
                        >
                          <Typography component="span" variant="body2" color="text.secondary">
                            Kcal: {item.calculated_calories}
                          </Typography>
                          <Typography component="span" variant="body2" color="text.secondary">
                            Prot: {item.calculated_proteins}g
                          </Typography>
                          <Typography component="span" variant="body2" color="text.secondary">
                            Gra: {item.calculated_fats}g
                          </Typography>
                          <Typography component="span" variant="body2" color="text.secondary">
                            Carb: {item.calculated_carbs}g
                          </Typography>
                        </Box>
                      }
                    />
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateFoodQuantity(item.uniqueId, e.target.value)}
                      slotProps={{
                        input: { min: '0.1', step: '0.1' },
                      }}
                      sx={{ width: '80px', ml: 2, flexShrink: 0 }} // mL para espacio, flexShrink para que no se encoja
                      size="small" // Tamaño más pequeño
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {item.food_item.portion_unit}
                    </Typography>
                  </ListItem>
                  {mealFoodItems.length > 0 && index < mealFoodItems.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* Totales de la Comida */}
        {mealFoodItems.length > 0 && (
          <Paper
            elevation={2}
            sx={{ padding: '20px', mt: 3, width: '100%', textAlign: 'left', bgcolor: 'primary.light', color: 'white' }}
          >
            <Typography variant="h5" gutterBottom>
              Totales de la Comida
            </Typography>
            <Typography variant="body1">
              <strong>Calorías Totales:</strong> {mealTotals.totalCalories} kcal
            </Typography>
            <Typography variant="body1">
              <strong>Proteínas Totales:</strong> {mealTotals.totalProteins} g
            </Typography>
            <Typography variant="body1">
              <strong>Grasas Totales:</strong> {mealTotals.totalFats} g
            </Typography>
            <Typography variant="body1">
              <strong>Carbohidratos Totales:</strong> {mealTotals.totalCarbs} g
            </Typography>
          </Paper>
        )}

        {/* Botón Guardar */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveMeal}
          disabled={mealFoodItems.length === 0 || loadingSave}
          sx={{ mt: 3, padding: '15px 30px' }}
        >
          {loadingSave ? <CircularProgress size={24} color="inherit" /> : 'Guardar Comida'}
        </Button>
      </Paper>
    </Box>
  )
  //   return (
  //     <div style={styles.container}>
  //       <h2 style={styles.heading}>Registrar Nueva Comida</h2>

  //       {/* Selección de Fecha y Tipo de Comida */}
  //       <div style={styles.formSection}>
  //         <div style={styles.formGroup}>
  //           <label htmlFor="date" style={styles.label}>
  //             Fecha:
  //           </label>
  //           <input
  //             type="date"
  //             id="date"
  //             value={selectedDate}
  //             onChange={(e) => setSelectedDate(e.target.value)}
  //             style={styles.input}
  //             max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
  //           />
  //         </div>
  //         <div style={styles.formGroup}>
  //           <label htmlFor="mealType" style={styles.label}>
  //             Tipo de Comida:
  //           </label>
  //           <select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} style={styles.select}>
  //             {MEAL_TYPES_OPTIONS.map((option) => (
  //               <option key={option.value} value={option.value}>
  //                 {option.label}
  //               </option>
  //             ))}
  //           </select>
  //         </div>
  //       </div>

  //       {/* Búsqueda de Alimentos */}
  //       <div style={styles.searchSection}>
  //         <h3 style={styles.subHeading}>Añadir Alimentos</h3>
  //         <input
  //           type="text"
  //           placeholder="Buscar alimento..."
  //           value={searchTerm}
  //           onChange={handleSearchChange}
  //           style={styles.searchInput}
  //         />
  //         {loadingSearch && <p style={styles.message}>Buscando...</p>}
  //         {searchError && <p style={styles.errorMessage}>{searchError}</p>}
  //         {searchResults.length > 0 && (
  //           <ul style={styles.searchResultsList}>
  //             {searchResults.map((food) => (
  //               <li key={food.id} style={styles.searchResultItem}>
  //                 <span>
  //                   {food.name} {food.brand ? `(${food.brand})` : ''}
  //                 </span>
  //                 <button onClick={() => addFoodToMeal(food)} style={styles.addFoodButton}>
  //                   Añadir
  //                 </button>
  //               </li>
  //             ))}
  //           </ul>
  //         )}
  //       </div>

  //       {/* Alimentos en la Comida Actual */}
  //       <div style={styles.currentMealSection}>
  //         <h3 style={styles.subHeading}>
  //           Alimentos en esta {MEAL_TYPES_OPTIONS.find((mt) => mt.value === mealType)?.label}
  //         </h3>
  //         {mealFoodItems.length === 0 ? (
  //           <p style={styles.message}>No has añadido alimentos a esta comida aún.</p>
  //         ) : (
  //           <ul style={styles.mealFoodList}>
  //             {mealFoodItems.map((item) => (
  //               <li key={item.food_item.id} style={styles.mealFoodListItem}>
  //                 <div style={styles.mealFoodItemInfo}>
  //                   <span>
  //                     {item.food_item.name} {item.food_item.brand ? `(${item.food_item.brand})` : ''}
  //                   </span>
  //                   <input
  //                     type="number"
  //                     value={item.quantity}
  //                     onChange={(e) => updateFoodQuantity(item.food_item.id, e.target.value)}
  //                     min="0.1"
  //                     step="0.1"
  //                     style={styles.quantityInput}
  //                   />
  //                   <span> {item.food_item.portion_unit}</span>
  //                   <button onClick={() => removeFoodFromMeal(item.food_item.id)} style={styles.removeFoodButton}>
  //                     X
  //                   </button>
  //                 </div>
  //                 <div style={styles.mealFoodItemMacros}>
  //                   <span>Cal: {item.calculated_calories}</span>
  //                   <span>Prot: {item.calculated_proteins}g</span>
  //                   <span>Gra: {item.calculated_fats}g</span>
  //                   <span>Carb: {item.calculated_carbs}g</span>
  //                 </div>
  //               </li>
  //             ))}
  //           </ul>
  //         )}
  //       </div>

  //       {/* Totales de la Comida */}
  //       <div style={styles.totalsSection}>
  //         <h3 style={styles.subHeading}>Totales de la Comida</h3>
  //         <p>
  //           <strong>Calorías:</strong> {mealTotals.totalCalories} kcal
  //         </p>
  //         <p>
  //           <strong>Proteínas:</strong> {mealTotals.totalProteins} g
  //         </p>
  //         <p>
  //           <strong>Grasas:</strong> {mealTotals.totalFats} g
  //         </p>
  //         <p>
  //           <strong>Carbohidratos:</strong> {mealTotals.totalCarbs} g
  //         </p>
  //       </div>

  //       {/* Botón Guardar */}
  //       <div style={styles.saveSection}>
  //         {saveError && <p style={styles.errorMessage}>{saveError}</p>}
  //         {saveSuccess && <p style={styles.successMessage}>{saveSuccess}</p>}
  //         <button onClick={handleSaveMeal} disabled={loadingSave} style={styles.saveButton}>
  //           {loadingSave ? 'Guardando...' : 'Guardar Comida'}
  //         </button>
  //       </div>
  //     </div>
  //   )
  // }

  // const styles = {
  //   container: {
  //     display: 'flex',
  //     flexDirection: 'column',
  //     alignItems: 'center',
  //     padding: '20px',
  //     fontFamily: 'Arial, sans-serif',
  //     backgroundColor: '#f4f4f4',
  //     minHeight: 'calc(100vh - 60px)',
  //     color: '#333',
  //   },
  //   heading: {
  //     color: '#007bff',
  //     marginBottom: '25px',
  //     fontSize: '2.2em',
  //   },
  //   subHeading: {
  //     color: '#555',
  //     marginBottom: '15px',
  //     fontSize: '1.5em',
  //     borderBottom: '1px solid #eee',
  //     paddingBottom: '5px',
  //     width: '100%',
  //     textAlign: 'center',
  //   },
  //   formSection: {
  //     display: 'flex',
  //     gap: '20px',
  //     marginBottom: '30px',
  //     backgroundColor: 'white',
  //     padding: '20px',
  //     borderRadius: '8px',
  //     boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  //     width: '100%',
  //     maxWidth: '600px',
  //     justifyContent: 'center',
  //   },
  //   formGroup: {
  //     display: 'flex',
  //     flexDirection: 'column',
  //   },
  //   label: {
  //     marginBottom: '8px',
  //     fontWeight: 'bold',
  //     color: '#555',
  //   },
  //   input: {
  //     padding: '10px',
  //     border: '1px solid #ddd',
  //     borderRadius: '4px',
  //     fontSize: '16px',
  //   },
  //   select: {
  //     padding: '10px',
  //     border: '1px solid #ddd',
  //     borderRadius: '4px',
  //     fontSize: '16px',
  //     backgroundColor: 'white',
  //   },
  //   searchSection: {
  //     backgroundColor: 'white',
  //     padding: '20px',
  //     borderRadius: '8px',
  //     boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  //     marginBottom: '30px',
  //     width: '100%',
  //     maxWidth: '600px',
  //     position: 'relative', // Para posicionar la lista de resultados
  //   },
  //   searchInput: {
  //     width: 'calc(100% - 20px)',
  //     padding: '12px',
  //     border: '1px solid #ccc',
  //     borderRadius: '5px',
  //     fontSize: '16px',
  //     marginBottom: '10px',
  //   },
  //   searchResultsList: {
  //     listStyle: 'none',
  //     padding: 0,
  //     margin: 0,
  //     border: '1px solid #eee',
  //     borderRadius: '5px',
  //     maxHeight: '200px',
  //     overflowY: 'auto',
  //     position: 'absolute',
  //     width: 'calc(100% - 40px)', // Ajustar al padding del contenedor
  //     backgroundColor: 'white',
  //     zIndex: 100,
  //     boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  //     left: '20px',
  //     top: 'calc(100% - 10px)', // Para que aparezca debajo del input
  //   },
  //   searchResultItem: {
  //     padding: '10px 15px',
  //     borderBottom: '1px solid #eee',
  //     display: 'flex',
  //     justifyContent: 'space-between',
  //     alignItems: 'center',
  //     cursor: 'pointer',
  //     transition: 'background-color 0.2s',
  //   },
  //   searchResultItemHover: {
  //     backgroundColor: '#f9f9f9',
  //   },
  //   addFoodButton: {
  //     padding: '5px 10px',
  //     backgroundColor: '#28a745',
  //     color: 'white',
  //     border: 'none',
  //     borderRadius: '4px',
  //     cursor: 'pointer',
  //     fontSize: '0.9em',
  //   },
  //   currentMealSection: {
  //     backgroundColor: 'white',
  //     padding: '20px',
  //     borderRadius: '8px',
  //     boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  //     marginBottom: '30px',
  //     width: '100%',
  //     maxWidth: '600px',
  //   },
  //   mealFoodList: {
  //     listStyle: 'none',
  //     padding: 0,
  //     margin: 0,
  //   },
  //   mealFoodListItem: {
  //     border: '1px solid #eee',
  //     borderRadius: '5px',
  //     padding: '10px 15px',
  //     marginBottom: '10px',
  //     backgroundColor: '#fdfdfd',
  //   },
  //   mealFoodItemInfo: {
  //     display: 'flex',
  //     alignItems: 'center',
  //     gap: '10px',
  //     marginBottom: '5px',
  //     flexWrap: 'wrap',
  //   },
  //   quantityInput: {
  //     width: '60px',
  //     padding: '5px',
  //     border: '1px solid #ddd',
  //     borderRadius: '4px',
  //     textAlign: 'center',
  //     fontSize: '0.9em',
  //   },
  //   removeFoodButton: {
  //     backgroundColor: '#dc3545',
  //     color: 'white',
  //     border: 'none',
  //     borderRadius: '50%',
  //     width: '25px',
  //     height: '25px',
  //     display: 'flex',
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     cursor: 'pointer',
  //     fontSize: '0.8em',
  //     marginLeft: 'auto', // Alinea a la derecha
  //   },
  //   mealFoodItemMacros: {
  //     display: 'flex',
  //     gap: '15px',
  //     fontSize: '0.9em',
  //     color: '#666',
  //     marginTop: '5px',
  //     flexWrap: 'wrap',
  //   },
  //   totalsSection: {
  //     backgroundColor: '#e9f7ef',
  //     padding: '20px',
  //     borderRadius: '8px',
  //     boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  //     marginBottom: '30px',
  //     width: '100%',
  //     maxWidth: '600px',
  //     borderLeft: '5px solid #28a745',
  //   },
  //   saveSection: {
  //     width: '100%',
  //     maxWidth: '600px',
  //     textAlign: 'center',
  //   },
  //   saveButton: {
  //     padding: '15px 30px',
  //     backgroundColor: '#007bff',
  //     color: 'white',
  //     border: 'none',
  //     borderRadius: '8px',
  //     fontSize: '1.2em',
  //     cursor: 'pointer',
  //     transition: 'background-color 0.2s',
  //   },
  //   saveButtonDisabled: {
  //     backgroundColor: '#cccccc',
  //     cursor: 'not-allowed',
  //   },
  //   message: {
  //     color: '#555',
  //     marginTop: '10px',
  //     textAlign: 'center',
  //   },
  //   errorMessage: {
  //     color: 'red',
  //     backgroundColor: '#ffe0e0',
  //     border: '1px solid red',
  //     padding: '10px',
  //     borderRadius: '4px',
  //     marginBottom: '15px',
  //     textAlign: 'center',
  //     width: '100%',
  //     maxWidth: '600px',
  //   },
  //   successMessage: {
  //     color: 'green',
  //     backgroundColor: '#e0ffe0',
  //     border: '1px solid green',
  //     padding: '10px',
  //     borderRadius: '4px',
  //     marginBottom: '15px',
  //     textAlign: 'center',
  //     width: '100%',
  //     maxWidth: '600px',
  //   },
}

export default MealLogger
