function Dashboard() {
  // En el futuro, aquí es donde cargarás los datos del usuario, historial, etc.
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>¡Bienvenido al Dashboard de Calorías!</h2>
      <p style={styles.text}>Esta es la página de inicio para usuarios autenticados.</p>
      <p style={styles.text}>Aquí verás tu historial de comidas, resúmenes de macros y metas.</p>
      <p style={styles.smallText}>(Esta página será mucho más interactiva en el futuro)</p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    padding: '20px',
    textAlign: 'center',
  },
  heading: {
    color: '#28a745',
    marginBottom: '15px',
    fontSize: '2.5em',
  },
  text: {
    color: '#444',
    fontSize: '1.2em',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  smallText: {
    color: '#777',
    fontSize: '0.9em',
    marginTop: '20px',
  },
}

export default Dashboard
