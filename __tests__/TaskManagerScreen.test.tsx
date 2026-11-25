import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TaskManagerScreen from '../app/(app)/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

// El primer render de la pantalla completa puede tardar en frío (carga de módulos).
jest.setTimeout(20000);

describe('TaskManagerScreen (matriz manual automatizada)', () => {
  it('caso A: buscar "VALIDAR" encuentra "Validar login"', async () => {
    const { findByText, getByTestId, queryByText } = render(<TaskManagerScreen />);
    await findByText('Validar login');
    fireEvent.changeText(getByTestId('search-input'), 'VALIDAR');
    await waitFor(() => expect(queryByText('Corregir navegación')).toBeNull());
    expect(queryByText('Validar login')).toBeTruthy();
  });

  it('caso C: marcar una tarea cambia su estado de inmediato', async () => {
    const { findByText, getByTestId, getAllByText } = render(<TaskManagerScreen />);
    await findByText('Validar login');
    const pendientesAntes = getAllByText('Pendiente').length;
    fireEvent.press(getByTestId('toggle-t01'));
    await waitFor(() => expect(getAllByText('Pendiente').length).toBe(pendientesAntes - 1));
  });

  it('caso D: simular error muestra el mensaje y termina la carga', async () => {
    const { findByText, getByTestId, queryByText } = render(<TaskManagerScreen />);
    await findByText('Validar login');
    fireEvent.press(getByTestId('simulate-error-button'));
    expect(await findByText(/HTTP 503/)).toBeTruthy();
    expect(queryByText('Consultando tareas…')).toBeNull();
  });

  it('caso E: crear una tarea con solo espacios se rechaza', async () => {
    const { findByText, getByTestId, queryByText } = render(<TaskManagerScreen />);
    await findByText('Validar login');
    fireEvent.changeText(getByTestId('new-task-input'), '   ');
    fireEvent.press(getByTestId('add-task-button'));
    expect(await findByText('Ingresá un nombre válido para continuar.')).toBeTruthy();
    expect(queryByText('Tarea agregada.')).toBeNull();
  });
});
