// frontend/src/services/chatbotService.js
// Servicio para el chatbot médico de Farmafia

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Envía un mensaje al chatbot médico
 * @param {string} mensaje - Mensaje/síntoma del usuario
 * @param {Array} historial - Historial de conversación (opcional)
 * @returns {Promise<Object>} - Respuesta del chatbot
 */
export async function consultarChatbot(mensaje, historial = []) {
    try {
        const response = await fetch(`${API_URL}/api/chatbot-medico`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                mensaje, 
                historial 
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ Error al consultar chatbot:', error);
        throw error;
    }
}

/**
 * Consulta al chatbot y recibe respuesta con audio
 * @param {string} mensaje - Mensaje/síntoma del usuario
 * @param {Array} historial - Historial de conversación
 * @param {boolean} incluirAudio - Si debe generar audio
 * @returns {Promise<Object>} - Respuesta con texto y audio
 */
export async function consultarChatbotConAudio(mensaje, historial = [], incluirAudio = true) {
    try {
        const response = await fetch(`${API_URL}/api/chatbot-medico-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                mensaje, 
                historial,
                incluirAudio 
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Si hay audio, convertirlo a URL reproducible
        if (data.audio) {
            const audioBlob = base64ToBlob(data.audio, 'audio/mpeg');
            data.audioUrl = URL.createObjectURL(audioBlob);
        }

        return data;

    } catch (error) {
        console.error('❌ Error al consultar chatbot con audio:', error);
        throw error;
    }
}

/**
 * Convierte base64 a Blob
 */
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * Reproduce el audio de una respuesta
 */
export function reproducirRespuesta(audioUrl) {
    if (!audioUrl) {
        console.warn('No hay audio para reproducir');
        return null;
    }
    
    const audio = new Audio(audioUrl);
    audio.play();
    return audio;
}