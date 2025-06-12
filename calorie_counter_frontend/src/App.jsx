import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/Dashboard'
import FoodSearch from './components/FoodSearch'

function App() {
  return (
    <Router>
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          <li style={styles.navItem}>
            <Link to="/register" style={styles.navLink}>
              Registrarse
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link to="/login" style={styles.navLink}>
              Iniciar Sesión
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link to="/dashboard" style={styles.navLink}>
              Dashboard (Provisional)
            </Link>
          </li>
          <li style={styles.navItem}>
            <Link to="/foods" style={styles.navLink}>
              Buscar Alimentos
            </Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* Ruta protegida en el futuro */}
        <Route path="/foods" element={<FoodSearch />} />
        <Route path="/" element={<Login />} /> {/* Redirige a login por defecto */}
      </Routes>
    </Router>
  )
}

// Estilos básicos para la barra de navegación
const styles = {
  nav: {
    backgroundColor: '#333',
    padding: '10px 0',
    textAlign: 'center',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  navItem: {
    display: 'inline-block',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '18px',
    padding: '8px 15px',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  navLinkHover: {
    backgroundColor: '#555',
  },
}

export default App
