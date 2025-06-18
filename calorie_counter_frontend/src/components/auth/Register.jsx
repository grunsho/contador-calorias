import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Box, Button, Paper, TextField, Typography } from '@mui/material'

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
          maxWidth: '400px',
          width: '100%',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Registrarse
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre de Usuario"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Correo Electrónico"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Repita la Contraseña"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" sx={{ mt: 2, mb: 1 }}>
              {success}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2 }}>
            Registrarse
          </Button>
        </form>
        <Typography>
          ¿Ya tienes una cuenta?{' '}<Link to="/login">Inicia sesión aquí</Link>
        </Typography>
      </Paper>
    </Box>
  )
}

export default Register
