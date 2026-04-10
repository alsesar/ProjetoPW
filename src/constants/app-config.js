export const ROUTES = {
  login: '/',
  partners: '/ListarParceiros',
  externalCompanies: '/ListarEmpresasExternas',
  about: '/Sobre',
};

export const STORAGE_KEYS = {
  username: 'username',
  partnersStore: 'teddy:partners-store',
  externalCompaniesStore: 'teddy:external-companies-store',
};

export const API_ENDPOINTS = {
  partners: 'https://644060ba792fe886a88de1b9.mockapi.io/v1/test/partners',
  externalCompanies: 'https://655cf25525b76d9884fe3153.mockapi.io/v1/external-companies',
};

export const DEFAULT_ROWS_PER_PAGE = 10;

export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export const INVALID_LIST_SENTINELS = new Set([
  'Invalid faker method - datatype.array',
]);
