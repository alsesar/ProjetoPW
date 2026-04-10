import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/app-config';
import { fallbackPartners } from '../mocks/fallback-data';
import createCrudService from './create-crud-service';

const partnersCrudService = createCrudService({
  baseUrl: API_ENDPOINTS.partners,
  storageKey: STORAGE_KEYS.partnersStore,
  seedData: fallbackPartners,
});

const ParceirosService = {
  getParceiros: partnersCrudService.list,
  getParceiroById: partnersCrudService.getById,
  postParceiro: partnersCrudService.create,
  putParceiro: partnersCrudService.update,
  deleteParceiroById: partnersCrudService.remove,
};

export default ParceirosService;
