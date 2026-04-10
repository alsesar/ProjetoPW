import {
  buildCompanyPayload,
  buildPartnerPayload,
  getCompanyStatusLabel,
  normalizeCompany,
  normalizePartner,
  normalizeStringList,
} from './record-utils';

describe('record-utils', () => {
  it('ignora valores invalidos ao normalizar listas', () => {
    expect(normalizeStringList('Invalid faker method - datatype.array')).toEqual([]);
    expect(normalizeStringList(['  ACME  ', '', null, 'Beta'])).toEqual(['ACME', 'Beta']);
    expect(normalizeStringList('Cliente A, Cliente B')).toEqual(['Cliente A', 'Cliente B']);
  });

  it('normaliza parceiros vindos da API', () => {
    expect(normalizePartner({
      name: '  Parceiro X ',
      description: '  descricao ',
      clients: 'Cliente 1, Cliente 2',
      projects: '',
    })).toEqual({
      name: 'Parceiro X',
      description: 'descricao',
      clients: ['Cliente 1', 'Cliente 2'],
      projects: [],
    });
  });

  it('monta payload de parceiro a partir do formulario', () => {
    expect(buildPartnerPayload({
      name: ' Novo parceiro ',
      description: ' teste ',
      client: 'Cliente 1',
      client2: ' ',
      project: 'Projeto 1',
      project2: 'Projeto 2',
    })).toEqual({
      name: 'Novo parceiro',
      description: 'teste',
      clients: ['Cliente 1'],
      projects: ['Projeto 1', 'Projeto 2'],
    });
  });

  it('normaliza empresas e status corretamente', () => {
    expect(normalizeCompany({
      name: '',
      companyName: '  Teddy LTDA ',
      collaboratorsCount: 42,
      isActive: 'Ativa',
    })).toEqual({
      name: 'Teddy LTDA',
      companyName: 'Teddy LTDA',
      collaboratorsCount: '42',
      isActive: true,
    });

    expect(getCompanyStatusLabel(true)).toBe('Ativa');
    expect(getCompanyStatusLabel(false)).toBe('Inativa');
  });

  it('monta payload de empresa padronizado', () => {
    expect(buildCompanyPayload({
      name: '',
      companyName: '  Teddy LTDA ',
      collaboratorsCount: ' 12 ',
      isActive: 'Ativa',
    })).toEqual({
      name: 'Teddy LTDA',
      companyName: 'Teddy LTDA',
      collaboratorsCount: '12',
      isActive: true,
      active: true,
    });
  });
});
