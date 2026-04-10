import Cookies from 'js-cookie';
import { STORAGE_KEYS } from '../constants/app-config';
import { clearSession, getStoredUsername, hasActiveSession, persistUsername } from './session';

describe('session utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearSession();
  });

  it('persiste usuario no sessionStorage quando rememberMe for falso', () => {
    expect(persistUsername('  kaya  ', false)).toBe('kaya');
    expect(sessionStorage.getItem(STORAGE_KEYS.username)).toBe('kaya');
    expect(localStorage.getItem(STORAGE_KEYS.username)).toBeNull();
    expect(Cookies.get(STORAGE_KEYS.username)).toBeUndefined();
    expect(getStoredUsername()).toBe('kaya');
    expect(hasActiveSession()).toBe(true);
  });

  it('persiste usuario em cookie quando rememberMe for verdadeiro', () => {
    sessionStorage.setItem(STORAGE_KEYS.username, 'antigo');

    expect(persistUsername('  teddy  ', true)).toBe('teddy');
    expect(sessionStorage.getItem(STORAGE_KEYS.username)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.username)).toBeNull();
    expect(Cookies.get(STORAGE_KEYS.username)).toBe('teddy');
    expect(getStoredUsername()).toBe('teddy');
  });

  it('limpa a sessao corretamente', () => {
    persistUsername('teste', true);
    clearSession();

    expect(sessionStorage.getItem(STORAGE_KEYS.username)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.username)).toBeNull();
    expect(Cookies.get(STORAGE_KEYS.username)).toBeUndefined();
    expect(hasActiveSession()).toBe(false);
  });

  it('retorna string vazia ao tentar persistir usuario vazio', () => {
    expect(persistUsername('   ', false)).toBe('');
    expect(hasActiveSession()).toBe(false);
  });

  it('usa memoria como fallback quando sessionStorage estiver indisponivel', () => {
    vi.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(persistUsername('offline', false)).toBe('offline');
    expect(getStoredUsername()).toBe('offline');
    expect(hasActiveSession()).toBe(true);
  });

  it('usa localStorage como fallback quando cookie estiver indisponivel', () => {
    vi.spyOn(Cookies, 'set').mockImplementation(() => {
      throw new Error('cookies blocked');
    });

    expect(persistUsername('persistido', true)).toBe('persistido');
    expect(localStorage.getItem(STORAGE_KEYS.username)).toBe('persistido');
    expect(getStoredUsername()).toBe('persistido');
  });
});
