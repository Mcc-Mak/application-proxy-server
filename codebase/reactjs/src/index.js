import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [health, setHealth] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(e => setHealth({ status: 'error', message: e.message }));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Prototype Application Proxy</h1>
      <p>ReactJS frontend is up.</p>
      <h2>Backend health</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
