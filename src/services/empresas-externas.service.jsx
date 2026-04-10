import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/app-config';
import { fallbackExternalCompanies } from '../mocks/fallback-data';
import createCrudService from './create-crud-service';

const externalCompaniesCrudService = createCrudService({
  baseUrl: API_ENDPOINTS.externalCompanies,
  storageKey: STORAGE_KEYS.externalCompaniesStore,
  seedData: fallbackExternalCompanies,
});

const EmpresasExternasService = {
  getEmpresasExternas: externalCompaniesCrudService.list,
  getEmpresaExternaById: externalCompaniesCrudService.getById,
  postEmpresaExterna: externalCompaniesCrudService.create,
  putEmpresaExterna: externalCompaniesCrudService.update,
  deleteEmpresaExternaById: externalCompaniesCrudService.remove,
};

export default EmpresasExternasService;
