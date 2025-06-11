import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Limpiar errores previos

    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        // Endpoint de JWT
        username,
        password,
      })
      // Guarda los tokens (access y refresh) en localStorage o sessionStorage
      localStorage.setItem('accessToken', response.data.access)
      localStorage.setItem('refreshToken', response.data.refresh)

      console.log('Inicio de sesión exitoso:', response.data)
      // Redirige al dashboard o a una página protegida
      navigate('/dashboard') // Tendremos que crear esta ruta después
    } catch (err) {
      if (err.response && err.response.data) {
        setError('Error de inicio de sesión: Credenciales inválidas.') // Mensaje genérico para credenciales
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.')
      }
      console.error('Error de inicio de sesión:', err)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Inicio de Sesión</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>
            Usuario:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            Contraseña:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>
          Iniciar Sesión
        </button>
      </form>
      <p style={styles.linkText}>
        ¿No tienes una cuenta?{' '}
        <Link to="/register" style={styles.link}>
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}

// Usamos los mismos estilos que en Register.jsx por simplicidad
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    padding: '20px',
  },
  heading: {
    color: '#333',
    marginBottom: '20px',
  },
  form: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    color: 'red',
    backgroundColor: '#ffe0e0',
    border: '1px solid red',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  linkText: {
    marginTop: '20px',
    color: '#555',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
}

export default Login
