import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate() // Hook para la navegación

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Limpiar errores previos
    setSuccess('') // Limpiar mensajes de éxito previos

    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      const response = await axios.post('http://localhost:8000/api/register/', {
        username,
        email,
        password,
        password2,
      })
      setSuccess('Registro exitoso. ¡Ahora puedes iniciar sesión!')
      // Opcional: Redirigir a la página de login después de un pequeño retraso
      setTimeout(() => {
        navigate('/login')
      }, 2000) // Redirige después de 2 segundos
      console.log('Registro exitoso:', response.data)
    } catch (err) {
      // Manejo de errores de la API
      if (err.response && err.response.data) {
        // Si Django devuelve errores de validación específicos
        const errorMessages = Object.values(err.response.data).flat().join(' ')
        setError(`Error de registro: ${errorMessages}`)
      } else {
        setError('Ocurrió un error inesperado al registrarse.')
      }
      console.error('Error de registro:', err)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Registro de Usuario</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
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
          <label htmlFor="email" style={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <div style={styles.formGroup}>
          <label htmlFor="password2" style={styles.label}>
            Confirmar Contraseña:
          </label>
          <input
            type="password"
            id="password2"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>
          Registrarse
        </button>
      </form>
      <p style={styles.linkText}>
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" style={styles.link}>
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  )
}

// Estilos básicos para este ejemplo (puedes usar CSS modules, Tailwind, etc.)
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
  success: {
    color: 'green',
    backgroundColor: '#e0ffe0',
    border: '1px solid green',
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

export default Register
