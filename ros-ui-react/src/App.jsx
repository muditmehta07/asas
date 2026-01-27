import React from 'react';
import RobotCamera from './components/RobotCamera';
import Connection from './components/Connection';

function App() {
  return (
    <div className="App">
      <Connection url="ws://localhost:9090" />

      <header style={{ marginBottom: '4rem', marginTop: '2rem' }}>
        <h1>Robot Dashboard</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2em' }}>Control Center & Telemetry</p>
      </header>

      <main className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Camera Feed */}
        <RobotCamera topic="/camera/image_raw" />

        {/* Info / Controls Placeholder */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>System Status</h2>
          <div style={{ textAlign: 'left', color: '#cbd5e1' }}>
            <p><strong>Mode:</strong> Autonomous</p>
            <p><strong>Battery:</strong> 85%</p>
            <p><strong>Wifi Signal:</strong> Strong</p>
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1em', marginBottom: '0.5em' }}>Diagnostics</h3>
              <p style={{ fontSize: '0.9em', color: '#4ade80' }}>All systems nominal.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
