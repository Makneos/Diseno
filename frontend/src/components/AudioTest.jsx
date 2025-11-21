// frontend/src/components/AudioTest.jsx
// Componente de prueba para el sistema de audio

import React, { useState } from 'react';
import { generarAudio, VOCES } from '../services/audioService';

function AudioTest() {
    const [cargando, setCargando] = useState(false);
    const [texto, setTexto] = useState('Bienvenido a Farmafia');

    const handleReproducir = async () => {
        setCargando(true);
        try {
            await generarAudio(texto, VOCES.NOVA);
        } catch (error) {
            alert('Error al generar audio. Verifica que el servidor esté corriendo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h2>🎙️ Test Audio - Farmafia</h2>
            
            <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                style={{ width: '100%', height: '100px', marginBottom: '10px' }}
                placeholder="Escribe el texto a convertir..."
            />

            <button 
                onClick={handleReproducir} 
                disabled={cargando}
                style={{
                    padding: '10px 20px',
                    backgroundColor: cargando ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: cargando ? 'not-allowed' : 'pointer'
                }}
            >
                {cargando ? 'Generando...' : '▶️ Reproducir Audio'}
            </button>
        </div>
    );
}

export default AudioTest;