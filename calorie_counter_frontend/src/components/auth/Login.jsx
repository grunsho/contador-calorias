import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, Button, Paper, TextField, Typography } from '@mui/material'

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 128px)',
        padding: '20px',
        boxSizing: 'border-box',
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
          Iniciar Sesión
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre de Usuario"
            variant="outlined"
            fullWidth
            margin="normal" // Espaciado vertical
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2 }}>
            Iniciar Sesión
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default Login
