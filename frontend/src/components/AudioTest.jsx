// frontend/src/components/AudioTest.jsx
// Componente de prueba para el sistema de audio

import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { generarAudio, VOCES } from '../services/audioService';

function AudioTest() {
    const { t } = useTranslation();
    const [cargando, setCargando] = useState(false);
    const [texto, setTexto] = useState(t('nav.brand'));

    const handleReproducir = async () => {
        setCargando(true);
        try {
            await generarAudio(texto, VOCES.NOVA);
        } catch (error) {
            alert(t('chatbot.errorProcessing'));
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h2>🎙️ {t('audioTest.title')}</h2>
            
            <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                style={{ width: '100%', height: '100px', marginBottom: '10px' }}
                placeholder={t('audioTest.placeholder')}
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
                {cargando ? t('audioTest.generating') : `▶️ ${t('audioTest.play')}`}
            </button>
        </div>
    );
}

export default AudioTest;