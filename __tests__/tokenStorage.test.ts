import { tokenStorage } from '../src/services/tokenStorage';

describe('tokenStorage (SecureStore / Memory)', () => {
  it('guarda, recupera y elimina un token correctamente', async () => {
    const testToken = 'token_test_12345';
    await tokenStorage.saveToken(testToken);

    const retrieved = await tokenStorage.getToken();
    expect(retrieved).toBe(testToken);

    await tokenStorage.deleteToken();
    const afterDelete = await tokenStorage.getToken();
    expect(afterDelete).toBeNull();
  });
});
