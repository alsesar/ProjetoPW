import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ROWS_PER_PAGE_OPTIONS } from '../../constants/app-config';
import { usePaginationParams } from '../../hooks/use-pagination-params';
import EmpresasExternasService from '../../services/empresas-externas.service';
import {
  buildCompanyPayload,
  getCompanyStatusLabel,
  normalizeCompany,
  normalizeCompanyStatus,
} from '../../utils/record-utils';

const EMPTY_COMPANY = {
  name: '',
  companyName: '',
  collaboratorsCount: '',
  isActive: true,
};

export default function ListarEmpresasExternas() {
  const toast = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [companyDialog, setCompanyDialog] = useState(false);
  const [deleteCompanyDialog, setDeleteCompanyDialog] = useState(false);
  const [company, setCompany] = useState(EMPTY_COMPANY);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { first, rows, updatePagination } = usePaginationParams();

  const loadCompanies = useCallback(async () => {
    setLoading(true);

    try {
      const response = await EmpresasExternasService.getEmpresasExternas();
      setCompanies((response.data || []).map(normalizeCompany));
    } catch {
      setCompanies([]);
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel carregar as empresas externas.',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const resetCompanyForm = () => {
    setCompany(EMPTY_COMPANY);
    setSubmitted(false);
  };

  const openNew = () => {
    resetCompanyForm();
    setCompanyDialog(true);
  };

  const hideDialog = () => {
    setCompanyDialog(false);
    resetCompanyForm();
  };

  const hideDeleteCompanyDialog = () => {
    setDeleteCompanyDialog(false);
  };

  const saveCompany = async () => {
    setSubmitted(true);
    const payload = buildCompanyPayload(company);

    if (!payload.companyName) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campos obrigatorios',
        detail: 'Informe o nome da empresa.',
        life: 3000,
      });
      return;
    }

    setSaving(true);

    try {
      const response = company.id
        ? await EmpresasExternasService.putEmpresaExterna(company.id, payload)
        : await EmpresasExternasService.postEmpresaExterna(payload);

      const savedCompany = normalizeCompany(response.data);

      setCompanies((currentCompanies) => {
        if (company.id) {
          return currentCompanies.map((currentCompany) => (
            currentCompany.id === savedCompany.id ? savedCompany : currentCompany
          ));
        }

        return [...currentCompanies, savedCompany];
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: company.id ? 'Empresa atualizada.' : 'Empresa cadastrada.',
        life: 3000,
      });

      setCompanyDialog(false);
      resetCompanyForm();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel salvar a empresa.',
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const editCompany = (selectedCompany) => {
    setCompany(normalizeCompany(selectedCompany));
    setSubmitted(false);
    setCompanyDialog(true);
  };

  const confirmDeleteCompany = (selectedCompany) => {
    setCompany(normalizeCompany(selectedCompany));
    setDeleteCompanyDialog(true);
  };

  const deleteCompany = async () => {
    if (!company.id) {
      return;
    }

    setDeleting(true);

    try {
      await EmpresasExternasService.deleteEmpresaExternaById(company.id);
      setCompanies((currentCompanies) => currentCompanies.filter((currentCompany) => currentCompany.id !== company.id));
      setDeleteCompanyDialog(false);
      resetCompanyForm();
      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Empresa deletada.',
        life: 3000,
      });
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel deletar a empresa.',
        life: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (name, value) => {
    setCompany((currentCompany) => ({
      ...currentCompany,
      [name]: value,
    }));
  };

  const handleCollaboratorsCountChange = (value) => {
    handleInputChange('collaboratorsCount', value.replace(/\D/g, ''));
  };

  const getSeverity = (isActive) => (normalizeCompanyStatus(isActive) ? 'success' : 'danger');

  const statusBodyTemplate = (rowData) => (
    <Tag value={getCompanyStatusLabel(rowData.isActive)} severity={getSeverity(rowData.isActive)} />
  );

  const actionBodyTemplate = (rowData) => (
    <React.Fragment>
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="mr-2"
        severity="warning"
        onClick={() => editCompany(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => confirmDeleteCompany(rowData)}
      />
    </React.Fragment>
  );

  const header = (
    <div className="page-toolbar">
      <div>
        <h2 className="page-title">Empresas Externas</h2>
        <span className="muted-value">Gerencie empresas externas e acompanhe o status delas.</span>
      </div>

      <div className="toolbar-actions">
        <span className="search-container">
          <InputText
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Buscar..."
          />
        </span>
        <Button label="Adicionar Empresa" icon="pi pi-plus" severity="success" onClick={openNew} />
      </div>
    </div>
  );

  const companyDialogFooter = (
    <React.Fragment>
      <Button label="Cancelar" icon="pi pi-times" outlined onClick={hideDialog} className="btn-red-not-bg" />
      <Button
        label="Confirmar"
        icon="pi pi-check"
        onClick={saveCompany}
        className="btn-orange"
        loading={saving}
      />
    </React.Fragment>
  );

  const deleteCompanyDialogFooter = (
    <React.Fragment>
      <Button
        label="Nao"
        icon="pi pi-times"
        outlined
        className="btn-orange-not-bg"
        onClick={hideDeleteCompanyDialog}
      />
      <Button
        label="Sim"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteCompany}
        loading={deleting}
      />
    </React.Fragment>
  );

  const companyNameInvalid = submitted && !company.companyName.trim();

  return (
    <div className="data-page">
      <Toast ref={toast} />

      <div className="content-card">
        <DataTable
          value={companies}
          header={header}
          dataKey="id"
          paginator
          first={first}
          rows={rows}
          loading={loading}
          globalFilter={globalFilter}
          globalFilterFields={['id', 'name', 'companyName', 'collaboratorsCount']}
          onPage={(event) => updatePagination(event.page, event.rows)}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} ao {last} de {totalRecords} empresas"
          emptyMessage="Nenhuma empresa encontrada."
          responsiveLayout="scroll"
          stripedRows
        >
          <Column field="id" header="Codigo" sortable style={{ minWidth: '8rem' }} />
          <Column field="name" header="Nome" sortable style={{ minWidth: '12rem' }} />
          <Column field="companyName" header="Empresa" sortable style={{ minWidth: '14rem' }} />
          <Column field="collaboratorsCount" header="N de Colaboradores" sortable style={{ minWidth: '12rem' }} />
          <Column field="isActive" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column body={actionBodyTemplate} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={companyDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={company.id ? 'Editar Empresa' : 'Nova Empresa'}
        modal
        className="p-fluid"
        footer={companyDialogFooter}
        onHide={hideDialog}
      >
        <div className="dialog-grid">
          <div className="field">
            <label htmlFor="name" className="font-bold">Nome</label>
            <InputText
              id="name"
              value={company.name}
              onChange={(event) => handleInputChange('name', event.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="companyName" className="font-bold">Nome da Empresa</label>
            <InputText
              id="companyName"
              value={company.companyName}
              onChange={(event) => handleInputChange('companyName', event.target.value)}
              className={companyNameInvalid ? 'p-invalid' : ''}
            />
            {companyNameInvalid && <small className="p-error">Informe o nome da empresa.</small>}
          </div>

          <div className="field">
            <label htmlFor="collaboratorsCount" className="font-bold">Numero de Colaboradores</label>
            <InputText
              id="collaboratorsCount"
              value={company.collaboratorsCount}
              onChange={(event) => handleCollaboratorsCountChange(event.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <label className="mb-3 font-bold">Status da Empresa</label>

            <div className="formgrid grid">
              <div className="field-radiobutton col-6">
                <RadioButton
                  inputId="status-active"
                  name="companyStatus"
                  value
                  onChange={() => handleInputChange('isActive', true)}
                  checked={company.isActive === true}
                />
                <label className="mb-0" htmlFor="status-active">Ativa</label>
              </div>

              <div className="field-radiobutton col-6">
                <RadioButton
                  inputId="status-inactive"
                  name="companyStatus"
                  value={false}
                  onChange={() => handleInputChange('isActive', false)}
                  checked={company.isActive === false}
                />
                <label className="mb-0" htmlFor="status-inactive">Inativa</label>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={deleteCompanyDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header="Confirmar exclusao"
        modal
        footer={deleteCompanyDialogFooter}
        onHide={hideDeleteCompanyDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          <span>
            Tem certeza que deseja excluir a empresa <b>{company.companyName || company.name || '-'}</b>?
          </span>
        </div>
      </Dialog>
    </div>
  );
}
