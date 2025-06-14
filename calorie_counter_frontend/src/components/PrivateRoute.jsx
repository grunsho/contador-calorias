import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('accessToken') // Verifica si existe un token

  // Podrías añadir lógica más sofisticada aquí para validar el token (ej. si está expirado)
  // Para JWT, esto implicaría decodificar el token y comprobar la fecha de expiración (exp claim)
  // const token = localStorage.getItem('accessToken');
  // if (token) {
  //     try {
  //         const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificar JWT (parte media)
  //         if (decodedToken.exp * 1000 < Date.now()) { // Comprobar si expiró
  //             localStorage.removeItem('accessToken');
  //             localStorage.removeItem('refreshToken');
  //             return <Navigate to="/login" replace />;
  //         }
  //     } catch (e) {
  //         // Si hay un error al decodificar, el token es inválido
  //         localStorage.removeItem('accessToken');
  //         localStorage.removeItem('refreshToken');
  //         return <Navigate to="/login" replace />;
  //     }
  // }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
