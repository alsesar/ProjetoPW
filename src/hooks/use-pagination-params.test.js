import { DEFAULT_ROWS_PER_PAGE } from '../constants/app-config';
import { normalizePaginationParams } from './use-pagination-params';

describe('normalizePaginationParams', () => {
  it('usa os valores padrao quando os parametros sao invalidos', () => {
    expect(normalizePaginationParams('?page=-4&rows=999')).toEqual({
      page: 0,
      rows: DEFAULT_ROWS_PER_PAGE,
      first: 0,
    });
  });

  it('aceita apenas quantidades de linhas previstas pela interface', () => {
    expect(normalizePaginationParams('?page=3&rows=25')).toEqual({
      page: 2,
      rows: 25,
      first: 50,
    });
  });

  it('normaliza strings vazias e valores nao numericos', () => {
    expect(normalizePaginationParams('?page=abc&rows=')).toEqual({
      page: 0,
      rows: DEFAULT_ROWS_PER_PAGE,
      first: 0,
    });
  });
});
