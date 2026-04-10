import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS } from '../constants/app-config';

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function normalizePaginationParams(search) {
  const params = new URLSearchParams(search);
  const rawPage = parsePositiveInteger(params.get('page'));
  const rawRows = parsePositiveInteger(params.get('rows'));
  const rows = ROWS_PER_PAGE_OPTIONS.includes(rawRows) ? rawRows : DEFAULT_ROWS_PER_PAGE;
  const page = Math.max((rawPage || 1) - 1, 0);

  return {
    page,
    rows,
    first: page * rows,
  };
}

export function usePaginationParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const pagination = useMemo(() => normalizePaginationParams(location.search), [location.search]);

  const updatePagination = useCallback((page, rows) => {
    const params = new URLSearchParams(location.search);
    params.set('page', String(page + 1));
    params.set(
      'rows',
      String(ROWS_PER_PAGE_OPTIONS.includes(rows) ? rows : DEFAULT_ROWS_PER_PAGE)
    );

    navigate(
      {
        pathname: location.pathname,
        search: params.toString(),
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  return {
    ...pagination,
    updatePagination,
  };
}
