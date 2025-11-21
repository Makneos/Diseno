// frontend/src/services/audioService.js
// Servicio para generar audio con OpenAI TTS para Farmafia

// URL de tu backend - ajusta según tu entorno
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Genera y reproduce audio desde texto
 * @param {string} texto - El texto a convertir en audio
 * @param {string} voz - La voz a usar (nova, alloy, echo, fable, onyx, shimmer)
 * @returns {Promise<HTMLAudioElement>} - El elemento de audio creado
 */
export async function generarAudio(texto, voz = 'nova') {
    try {
        console.log('🎙️  Generando audio...');

        const response = await fetch(`${API_URL}/api/generar-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texto, voz })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        await audio.play();

        console.log('✅ Audio reproducido');
        return audio;

    } catch (error) {
        console.error('❌ Error al generar audio:', error);
        throw error;
    }
}

/**
 * Genera audio sin reproducirlo automáticamente
 * @param {string} texto - El texto a convertir
 * @param {string} voz - La voz a usar
 * @returns {Promise<string>} - URL del audio generado
 */
export async function generarAudioURL(texto, voz = 'nova') {
    try {
        const response = await fetch(`${API_URL}/api/generar-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texto, voz })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Voces disponibles para referencia
export const VOCES = {
    NOVA: 'nova',       // Femenina, energética (recomendada para Farmafia)
    ALLOY: 'alloy',     // Neutral
    ECHO: 'echo',       // Masculina
    FABLE: 'fable',     // Masculina, británica (buena para jefes)
    ONYX: 'onyx',       // Masculina, profunda (buena para narrador)
    SHIMMER: 'shimmer'  // Femenina, suave
};