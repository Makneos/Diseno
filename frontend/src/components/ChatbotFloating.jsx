// frontend/src/components/ChatbotFloating.jsx
// Botón flotante para el chatbot médico

import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import ChatbotMedico from './ChatbotMedico';
import './ChatbotFloating.css';

function ChatbotFloating() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Botón flotante */}
            <button 
                className="chatbot-floating-button"
                onClick={toggleChatbot}
                title={isOpen ? t('chatbotFloating.close') : t('chatbotFloating.open')}
                aria-label={isOpen ? t('chatbotFloating.close') : t('chatbotFloating.open')}
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Modal del chatbot */}
            {isOpen && (
                <div 
                    className="chatbot-modal-overlay"
                    onClick={toggleChatbot}
                >
                    <div 
                        className="chatbot-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ChatbotMedico />
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatbotFloating;