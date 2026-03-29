import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CanvasBackground from './components/CanvasBackground';
import Acts from './components/Acts';
import { useVoiceAI } from './hooks/useVoiceAI';

gsap.registerPlugin(ScrollTrigger);

export const globalScrollState = {
  progress: 0,
  velocity: 0,
  act: 0
};

function App() {
  const {
    statusText, heardText, isAwaitingCommand, forceCommandCapture, askKreo, systemHealth, testBackendConnection
  } = useVoiceAI();

  const [threeJSHealth, setThreeJSHealth] = useState('PENDING');
  const [logs, setLogs] = useState([]);

  // Capture console logs for the debug panel
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const pushLog = (msg, type) => {
      setLogs(prev => [...prev.slice(-4), { msg: String(msg), type }]);
    };

    console.log = (...args) => { pushLog(args.join(' '), 'info'); originalLog(...args); };
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('THREE.Clock') || msg.includes('THREE.Timer')) return originalWarn(...args); // Keep in devtools, hide from UI
      pushLog(msg, 'warn');
      originalWarn(...args);
    };
    console.error = (...args) => { pushLog(args.join(' '), 'error'); originalError(...args); };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Listen to CanvasBackground explicit mount event
  useEffect(() => {
    const handleThreeHealth = (e) => setThreeJSHealth(e.detail);
    window.addEventListener('threejs-health', handleThreeHealth);
    return () => window.removeEventListener('threejs-health', handleThreeHealth);
  }, []);

  // GSAP absolute scroll mapping
  useEffect(() => {
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        globalScrollState.progress = self.progress;
        globalScrollState.velocity = self.getVelocity();
        globalScrollState.act = Math.floor(self.progress * 8.99);
      }
    });
  }, []);

  const getHealthColor = (status) => {
    if (status === 'OK') return '#0f0';
    if (status === 'FAIL') return '#f00';
    if (status === 'STANDBY') return '#0ff';
    return '#ff0'; // PENDING
  };

  return (
    <>
      {/* SYSTEM STATUS PANEL (DEBUG MODE) */}
      <div style={{
        position: 'fixed', top: '10px', right: '10px', width: '320px',
        background: 'rgba(0,0,0,0.85)', border: '1px solid #444',
        color: '#fff', padding: '15px', borderRadius: '4px',
        zIndex: 9999, fontFamily: 'monospace', fontSize: '11px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px', color: '#ff00ff' }}>
          SYSTEM DEBUG MODE
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '15px' }}>
          <div>MIC / WEBRTC:</div><div style={{ color: getHealthColor(systemHealth.mic), textAlign: 'right' }}>[{systemHealth.mic}]</div>
          <div>SPEECH API:</div><div style={{ color: getHealthColor(systemHealth.speechRec), textAlign: 'right' }}>[{systemHealth.speechRec}]</div>
          <div>NODE BACKEND:</div><div style={{ color: getHealthColor(systemHealth.backend), textAlign: 'right' }}>[{systemHealth.backend}]</div>
          <div>AI / OPENROUTER:</div><div style={{ color: getHealthColor(systemHealth.openai), textAlign: 'right' }}>[{systemHealth.openai}]</div>
          <div>THREE.JS CORE:</div><div style={{ color: getHealthColor(threeJSHealth), textAlign: 'right' }}>[{threeJSHealth}]</div>
        </div>

        <div style={{ marginBottom: '15px', padding: '10px', background: '#111', border: '1px solid #333', color: isAwaitingCommand ? '#f0f' : '#0ff' }}>
          <strong>STATE:</strong> {statusText}<br />
          <strong>HEARD:</strong> {heardText || "—"}
        </div>

        <div style={{ fontSize: '10px', color: '#888', maxHeight: '100px', overflowY: 'auto', borderTop: '1px solid #333', paddingTop: '5px' }}>
          {logs.map((L, i) => (
            <div key={i} style={{ color: L.type === 'error' ? '#f55' : L.type === 'warn' ? '#fd0' : '#888' }}>
              {L.msg}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
          <button onClick={() => testBackendConnection()} style={{ flex: 1, padding: '5px', background: '#222', color: '#fff', border: '1px solid #555', cursor: 'pointer', pointerEvents: 'auto' }}>TEST BACKEND</button>
          <button onClick={() => { try { forceCommandCapture(); } catch (e) { console.error(e); } }} style={{ flex: 1, padding: '5px', background: '#222', color: '#f0f', border: '1px solid #f0f', cursor: 'pointer', pointerEvents: 'auto' }}>FORCE MIC</button>
          <button onClick={() => askKreo("Hello KREO, are you online?")} style={{ flex: 1, padding: '5px', background: '#222', color: '#0ff', border: '1px solid #0ff', cursor: 'pointer', pointerEvents: 'auto' }}>TEST AI</button>
        </div>
      </div>

      <div style={{ width: '100%', height: '900vh', position: 'relative' }}>
        <div className="canvas-container">
          <CanvasBackground />
        </div>

        <div className="ui-layer">
          <Acts />
        </div>
      </div>
    </>
  );
}

export default App;
