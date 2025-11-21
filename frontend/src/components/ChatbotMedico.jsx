// frontend/src/components/ChatbotMedico.jsx
// Chatbot médico para Farmafia

import React, { useState, useRef, useEffect } from 'react';
import { consultarChatbotConAudio, reproducirRespuesta } from '../services/chatbotService';
import './ChatbotMedico.css'; // Estilos opcionales

function ChatbotMedico() {
    const [mensajes, setMensajes] = useState([
        {
            rol: 'bot',
            texto: '¡Hola! Soy FarmaBot, tu asistente virtual de farmacia. ¿En qué puedo ayudarte hoy? Puedes contarme tus síntomas y te recomendaré medicamentos de venta libre. 💊',
            timestamp: new Date()
        }
    ]);
    const [inputMensaje, setInputMensaje] = useState('');
    const [cargando, setCargando] = useState(false);
    const [audioHabilitado, setAudioHabilitado] = useState(true);
    const [audioReproduciendose, setAudioReproduciendose] = useState(false);
    
    const chatEndRef = useRef(null);
    const audioRef = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // Enviar mensaje
    const enviarMensaje = async (e) => {
        e.preventDefault();
        
        if (!inputMensaje.trim() || cargando) return;

        // Agregar mensaje del usuario
        const mensajeUsuario = {
            rol: 'usuario',
            texto: inputMensaje,
            timestamp: new Date()
        };

        setMensajes(prev => [...prev, mensajeUsuario]);
        setInputMensaje('');
        setCargando(true);

        try {
            // Preparar historial para el API (excluir mensaje inicial de bienvenida)
            const historial = mensajes
                .slice(1) // Excluir el primer mensaje de bienvenida
                .map(m => ({
                    role: m.rol === 'usuario' ? 'user' : 'assistant',
                    content: m.texto
                }));

            // Consultar al chatbot
            const respuesta = await consultarChatbotConAudio(
                inputMensaje,
                historial,
                audioHabilitado
            );

            // Agregar respuesta del bot
            const mensajeBot = {
                rol: 'bot',
                texto: respuesta.respuesta,
                audioUrl: respuesta.audioUrl,
                timestamp: new Date()
            };

            setMensajes(prev => [...prev, mensajeBot]);

            // Reproducir audio automáticamente si está disponible
            if (audioHabilitado && respuesta.audioUrl) {
                const audio = reproducirRespuesta(respuesta.audioUrl);
                if (audio) {
                    audioRef.current = audio;
                    setAudioReproduciendose(true);
                    
                    audio.onended = () => {
                        setAudioReproduciendose(false);
                    };
                }
            }

        } catch (error) {
            console.error('Error:', error);
            setMensajes(prev => [...prev, {
                rol: 'bot',
                texto: '❌ Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente.',
                timestamp: new Date()
            }]);
        } finally {
            setCargando(false);
        }
    };

    // Reproducir audio de un mensaje específico
    const reproducirAudioMensaje = (mensaje) => {
        if (mensaje.audioUrl) {
            // Detener audio actual si está reproduciéndose
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            const audio = reproducirRespuesta(mensaje.audioUrl);
            if (audio) {
                audioRef.current = audio;
                setAudioReproduciendose(true);
                
                audio.onended = () => {
                    setAudioReproduciendose(false);
                };
            }
        }
    };

    // Sugerencias rápidas
    const sugerencias = [
        "Me duele la cabeza",
        "Tengo tos seca",
        "Dolor de estómago",
        "Tengo fiebre",
        "Dolor muscular"
    ];

    const usarSugerencia = (sugerencia) => {
        setInputMensaje(sugerencia);
    };

    // Limpiar chat
    const limpiarChat = () => {
        setMensajes([
            {
                rol: 'bot',
                texto: '¡Hola! Soy FarmaBot. ¿En qué puedo ayudarte hoy? 💊',
                timestamp: new Date()
            }
        ]);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    return (
        <div className="chatbot-container">
            {/* Header */}
            <div className="chatbot-header">
                <div className="header-info">
                    <h2>🤖 FarmaBot</h2>
                    <span className="subtitle">Asistente Virtual de Farmacia</span>
                </div>
                <div className="header-controls">
                    <button 
                        onClick={() => setAudioHabilitado(!audioHabilitado)}
                        className="control-btn"
                        title={audioHabilitado ? "Desactivar audio" : "Activar audio"}
                    >
                        {audioHabilitado ? '🔊' : '🔇'}
                    </button>
                    <button 
                        onClick={limpiarChat}
                        className="control-btn"
                        title="Limpiar chat"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="disclaimer">
                ⚠️ <strong>Importante:</strong> Este chatbot proporciona información general. 
                No reemplaza la consulta con un profesional de la salud.
            </div>

            {/* Área de mensajes */}
            <div className="chat-messages">
                {mensajes.map((mensaje, index) => (
                    <div 
                        key={index} 
                        className={`mensaje mensaje-${mensaje.rol}`}
                    >
                        <div className="mensaje-avatar">
                            {mensaje.rol === 'bot' ? '🤖' : '👤'}
                        </div>
                        <div className="mensaje-contenido">
                            <div className="mensaje-texto">
                                {mensaje.texto}
                            </div>
                            {mensaje.audioUrl && (
                                <button 
                                    onClick={() => reproducirAudioMensaje(mensaje)}
                                    className="btn-audio"
                                    disabled={audioReproduciendose}
                                >
                                    {audioReproduciendose ? '🔊' : '▶️'} Escuchar
                                </button>
                            )}
                            <span className="mensaje-hora">
                                {mensaje.timestamp.toLocaleTimeString('es-CL', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </span>
                        </div>
                    </div>
                ))}
                
                {cargando && (
                    <div className="mensaje mensaje-bot">
                        <div className="mensaje-avatar">🤖</div>
                        <div className="mensaje-contenido">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={chatEndRef} />
            </div>

            {/* Sugerencias rápidas */}
            {mensajes.length === 1 && (
                <div className="sugerencias">
                    <p>Sugerencias rápidas:</p>
                    <div className="sugerencias-botones">
                        {sugerencias.map((sug, index) => (
                            <button 
                                key={index}
                                onClick={() => usarSugerencia(sug)}
                                className="btn-sugerencia"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input de mensaje */}
            <form onSubmit={enviarMensaje} className="chat-input-form">
                <input
                    type="text"
                    value={inputMensaje}
                    onChange={(e) => setInputMensaje(e.target.value)}
                    placeholder="Describe tus síntomas..."
                    disabled={cargando}
                    className="chat-input"
                />
                <button 
                    type="submit" 
                    disabled={cargando || !inputMensaje.trim()}
                    className="btn-enviar"
                >
                    {cargando ? '⏳' : '📤'}
                </button>
            </form>
        </div>
    );
}

export default ChatbotMedico;