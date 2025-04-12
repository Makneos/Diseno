import React from 'react';
import { useToast } from '../context/ToastContext';

const ExampleComponent = () => {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  return (
    <div>
      <button onClick={() => showInfo('Esta es una notificación informativa')}>
        Mostrar Info
      </button>
      
      <button onClick={() => showSuccess('Operación completada con éxito')}>
        Mostrar Éxito
      </button>
      
      <button onClick={() => showWarning('Cuidado con esta acción')}>
        Mostrar Advertencia
      </button>
      
      <button onClick={() => showError('Ha ocurrido un error')}>
        Mostrar Error
      </button>
    </div>
  );
};

export default ExampleComponent;