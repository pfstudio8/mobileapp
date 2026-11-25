import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthScreen } from '../src/components/AuthScreen';

describe('AuthScreen (Login y Register)', () => {
  it('muestra el modo Iniciar sesión por defecto con banner, hábito de hoy y controles', () => {
    const { getByText, getByTestId } = render(<AuthScreen />);

    expect(getByText('¡Bienvenido, volviste!')).toBeTruthy();
    expect(getByText(/Ingresá para seguir con tus victorias diarias/)).toBeTruthy();
    expect(getByText('HÁBITO DE HOY')).toBeTruthy();
    expect(getByText('Recordarme')).toBeTruthy();
    expect(getByTestId('auth-email-input')).toBeTruthy();
    expect(getByTestId('auth-password-input')).toBeTruthy();
    expect(getByTestId('toggle-password-visibility')).toBeTruthy();
    expect(getByTestId('auth-submit-button')).toBeTruthy();
  });

  it('permite alternar a Crear cuenta con slide, textos motivadores y confirmar contraseña', async () => {
    const { getByText, getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByText('Crear cuenta'));

    await waitFor(() => {
      expect(getByText('¡Creá tu cuenta gratis!')).toBeTruthy();
      expect(getByText('TU PRIMER PASO')).toBeTruthy();
      expect(getByTestId('register-confirm-password-input')).toBeTruthy();
    });
  });

  it('valida campos obligatorios en el formulario de inicio de sesión', () => {
    const { getByTestId, getByText } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-submit-button'));
    expect(getByText(/Por favor ingresá tu correo electrónico/)).toBeTruthy();
  });

  it('permite continuar como invitado o ingresar al gestor', () => {
    const onGuest = jest.fn();
    const { getByTestId } = render(<AuthScreen onContinueAsGuest={onGuest} />);

    fireEvent.press(getByTestId('auth-guest-button'));
    expect(onGuest).toHaveBeenCalled();
  });
});
