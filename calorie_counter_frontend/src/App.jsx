import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/Dashboard'
import FoodSearch from './components/FoodSearch'
import MealLogger from './components/MealLogger'
import PrivateRoute from './components/PrivateRoute'

import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff', // Azul Bootstrap
    },
    secondary: {
      main: '#28a745', // Verde éxito
    },
    error: {
      main: '#dc3545', // Rojo error
    },
    background: {
      default: '#f4f4f4', // Fondo general
      paper: '#ffffff', // Fondo de cards/forms
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppBar position="static" sx={{ bgcolor: theme.palette.primary.dark }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, color: 'white' }}
              >
                Calorie Counter
              </Typography>
              <Box>
                <Button color="inherit" component={Link} to="/register" sx={{ color: 'white' }}>
                  Registrarse
                </Button>
                <Button color="inherit" component={Link} to="/login" sx={{ color: 'white' }}>
                  Iniciar Sesión
                </Button>
                <Button color="inherit" component={Link} to="/dashboard" sx={{ color: 'white' }}>
                  Dashboard
                </Button>
                <Button color="inherit" component={Link} to="/foods" sx={{ color: 'white' }}>
                  Buscar Alimentos
                </Button>
                <Button color="inherit" component={Link} to="/log-meal" sx={{ color: 'white' }}>
                  Registrar Comida
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/foods"
              element={
                <PrivateRoute>
                  <FoodSearch />
                </PrivateRoute>
              }
            />
            <Route
              path="/log-meal"
              element={
                <PrivateRoute>
                  <MealLogger />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Login />} /> {/* Redirige a login por defecto */}
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  )
}

export default App
