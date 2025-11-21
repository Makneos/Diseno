import React from 'react';
import ChatbotMedico from '../components/ChatbotMedico';

function ChatbotPage() {
    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f5f5f5',
            padding: '20px'
        }}>
            <ChatbotMedico />
        </div>
    );
}

export default ChatbotPage;