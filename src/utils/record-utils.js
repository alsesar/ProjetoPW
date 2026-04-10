import { INVALID_LIST_SENTINELS } from '../constants/app-config';

export function normalizeText(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

export function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmedValue = normalizeText(value);

    if (!trimmedValue || INVALID_LIST_SENTINELS.has(trimmedValue)) {
      return [];
    }

    if (trimmedValue.includes(',')) {
      return trimmedValue
        .split(',')
        .map((item) => normalizeText(item))
        .filter(Boolean);
    }

    return [trimmedValue];
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [normalizeText(value)].filter(Boolean);
}

export function normalizePartner(partnerData = {}) {
  return {
    ...partnerData,
    name: normalizeText(partnerData.name),
    description: normalizeText(partnerData.description),
    clients: normalizeStringList(partnerData.clients),
    projects: normalizeStringList(partnerData.projects),
  };
}

export function buildPartnerPayload(partnerData = {}) {
  const payload = {
    ...partnerData,
    name: normalizeText(partnerData.name),
    description: normalizeText(partnerData.description),
    clients: [partnerData.client, partnerData.client2]
      .map((item) => normalizeText(item))
      .filter(Boolean),
    projects: [partnerData.project, partnerData.project2]
      .map((item) => normalizeText(item))
      .filter(Boolean),
  };

  delete payload.client;
  delete payload.client2;
  delete payload.project;
  delete payload.project2;

  return payload;
}

export function normalizeCompanyStatus(value) {
  return value === true || value === 'Ativa' || value === 'ativa' || value === 'true' || value === 1 || value === '1';
}

export function getCompanyStatusLabel(value) {
  return normalizeCompanyStatus(value) ? 'Ativa' : 'Inativa';
}

export function normalizeCompany(companyData = {}) {
  const companyName = normalizeText(companyData.companyName);
  const name = normalizeText(companyData.name) || companyName || 'Sem nome';

  return {
    ...companyData,
    name,
    companyName,
    collaboratorsCount: normalizeText(companyData.collaboratorsCount),
    isActive: normalizeCompanyStatus(companyData.isActive ?? companyData.active),
  };
}

export function buildCompanyPayload(companyData = {}) {
  const companyName = normalizeText(companyData.companyName);
  const isActive = normalizeCompanyStatus(companyData.isActive);

  return {
    ...companyData,
    name: normalizeText(companyData.name) || companyName,
    companyName,
    collaboratorsCount: normalizeText(companyData.collaboratorsCount),
    isActive,
    active: isActive,
  };
}
