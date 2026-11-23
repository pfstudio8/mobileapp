import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthScreen } from '../src/components/AuthScreen';

describe('AuthScreen (Login y Register)', () => {
  it('muestra el modo Iniciar sesión por defecto con sus textos motivadores', () => {
    const { getByText, getByTestId } = render(<AuthScreen />);

    expect(getByText(/TU ESPACIO DE ENFOQUE/)).toBeTruthy();
    expect(getByText(/Convertí cada día en una victoria personal/)).toBeTruthy();
    expect(getByText(/Foco total y sin distracciones/)).toBeTruthy();
    expect(getByTestId('auth-email-input')).toBeTruthy();
    expect(getByTestId('auth-password-input')).toBeTruthy();
    expect(getByTestId('auth-submit-button')).toBeTruthy();
  });

  it('permite alternar a Crear cuenta con textos motivadores y campos de registro', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<AuthScreen />);

    // Alternar con el botón/tab de registro
    fireEvent.press(getByText('Crear cuenta'));

    await waitFor(() => {
      expect(getByText(/COMIENZO DE TUS METAS/)).toBeTruthy();
      expect(getByText(/Desbloqueá tu máximo potencial/)).toBeTruthy();
      expect(getByText(/Diseñado para impulsarte/)).toBeTruthy();
      expect(getByTestId('register-name-input')).toBeTruthy();
      expect(getByTestId('register-confirm-password-input')).toBeTruthy();
    });
  });

  it('valida campos obligatorios en el formulario de inicio de sesión', () => {
    const { getByTestId, getByText } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-submit-button'));
    expect(getByText(/Por favor ingresá tu correo o usuario/)).toBeTruthy();
  });

  it('permite continuar como invitado o ingresar al gestor', () => {
    const onGuest = jest.fn();
    const { getByTestId } = render(<AuthScreen onContinueAsGuest={onGuest} />);

    fireEvent.press(getByTestId('auth-guest-button'));
    expect(onGuest).toHaveBeenCalled();
  });
});
