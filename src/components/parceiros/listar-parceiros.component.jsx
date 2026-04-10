import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ROWS_PER_PAGE_OPTIONS } from '../../constants/app-config';
import { usePaginationParams } from '../../hooks/use-pagination-params';
import ParceirosService from '../../services/parceiros.service';
import { buildPartnerPayload, normalizePartner, normalizeStringList } from '../../utils/record-utils';

const EMPTY_PARTNER = {
  name: '',
  description: '',
  client: '',
  client2: '',
  project: '',
  project2: '',
};

export default function ListarParceiros() {
  const toast = useRef(null);
  const [partners, setPartners] = useState([]);
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [deletePartnerDialog, setDeletePartnerDialog] = useState(false);
  const [partner, setPartner] = useState(EMPTY_PARTNER);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { first, rows, updatePagination } = usePaginationParams();

  const loadPartners = useCallback(async () => {
    setLoading(true);

    try {
      const response = await ParceirosService.getParceiros();
      setPartners((response.data || []).map(normalizePartner));
    } catch {
      setPartners([]);
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel carregar os parceiros.',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const resetPartnerForm = () => {
    setPartner(EMPTY_PARTNER);
    setSubmitted(false);
  };

  const openNew = () => {
    resetPartnerForm();
    setPartnerDialog(true);
  };

  const hideDialog = () => {
    setPartnerDialog(false);
    resetPartnerForm();
  };

  const hideDeletePartnerDialog = () => {
    setDeletePartnerDialog(false);
  };

  const savePartner = async () => {
    setSubmitted(true);
    const payload = buildPartnerPayload(partner);

    if (!payload.name) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campos obrigatorios',
        detail: 'Informe o nome do parceiro.',
        life: 3000,
      });
      return;
    }

    setSaving(true);

    try {
      const response = partner.id
        ? await ParceirosService.putParceiro(partner.id, payload)
        : await ParceirosService.postParceiro(payload);

      const savedPartner = normalizePartner(response.data);

      setPartners((currentPartners) => {
        if (partner.id) {
          return currentPartners.map((currentPartner) => (
            currentPartner.id === savedPartner.id ? savedPartner : currentPartner
          ));
        }

        return [...currentPartners, savedPartner];
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: partner.id ? 'Parceiro atualizado.' : 'Parceiro cadastrado.',
        life: 3000,
      });

      setPartnerDialog(false);
      resetPartnerForm();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel salvar o parceiro.',
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const editPartner = (selectedPartner) => {
    const normalizedPartner = normalizePartner(selectedPartner);

    setPartner({
      ...normalizedPartner,
      client: normalizedPartner.clients[0] || '',
      client2: normalizedPartner.clients[1] || '',
      project: normalizedPartner.projects[0] || '',
      project2: normalizedPartner.projects[1] || '',
    });
    setSubmitted(false);
    setPartnerDialog(true);
  };

  const confirmDeletePartner = (selectedPartner) => {
    setPartner(normalizePartner(selectedPartner));
    setDeletePartnerDialog(true);
  };

  const deletePartner = async () => {
    if (!partner.id) {
      return;
    }

    setDeleting(true);

    try {
      await ParceirosService.deleteParceiroById(partner.id);
      setPartners((currentPartners) => currentPartners.filter((currentPartner) => currentPartner.id !== partner.id));
      setDeletePartnerDialog(false);
      resetPartnerForm();
      toast.current?.show({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Parceiro deletado.',
        life: 3000,
      });
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nao foi possivel deletar o parceiro.',
        life: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (name, value) => {
    setPartner((currentPartner) => ({
      ...currentPartner,
      [name]: value,
    }));
  };

  const actionBodyTemplate = (rowData) => (
    <React.Fragment>
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="mr-2"
        severity="warning"
        onClick={() => editPartner(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => confirmDeletePartner(rowData)}
      />
    </React.Fragment>
  );

  const formatList = (value) => {
    const items = normalizeStringList(value);

    if (!items.length) {
      return <span className="muted-value">-</span>;
    }

    return (
      <div className="table-cell-list">
        {items.map((item, index) => (
          <div key={`${item}-${index}`}>{item}</div>
        ))}
      </div>
    );
  };

  const header = (
    <div className="page-toolbar">
      <div>
        <h2 className="page-title">Parceiros</h2>
        <span className="muted-value">Cadastro, consulta e manutencao dos parceiros.</span>
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
        <Button label="Adicionar Parceiro" icon="pi pi-plus" severity="success" onClick={openNew} />
      </div>
    </div>
  );

  const partnerDialogFooter = (
    <React.Fragment>
      <Button label="Cancelar" icon="pi pi-times" outlined onClick={hideDialog} className="btn-red-not-bg" />
      <Button
        label="Confirmar"
        icon="pi pi-check"
        onClick={savePartner}
        className="btn-orange"
        loading={saving}
      />
    </React.Fragment>
  );

  const deletePartnerDialogFooter = (
    <React.Fragment>
      <Button
        label="Nao"
        icon="pi pi-times"
        outlined
        className="btn-orange-not-bg"
        onClick={hideDeletePartnerDialog}
      />
      <Button
        label="Sim"
        icon="pi pi-check"
        severity="danger"
        onClick={deletePartner}
        loading={deleting}
      />
    </React.Fragment>
  );

  const partnerNameInvalid = submitted && !partner.name.trim();

  return (
    <div className="data-page">
      <Toast ref={toast} />

      <div className="content-card">
        <DataTable
          value={partners}
          header={header}
          dataKey="id"
          paginator
          first={first}
          rows={rows}
          loading={loading}
          globalFilter={globalFilter}
          globalFilterFields={['id', 'name', 'description', 'clients', 'projects']}
          onPage={(event) => updatePagination(event.page, event.rows)}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} ao {last} de {totalRecords} parceiros"
          emptyMessage="Nenhum parceiro encontrado."
          responsiveLayout="scroll"
          stripedRows
        >
          <Column field="id" header="Codigo" sortable style={{ minWidth: '8rem' }} />
          <Column field="name" header="Nome" sortable style={{ minWidth: '16rem' }} />
          <Column field="description" header="Descricao" sortable style={{ minWidth: '14rem' }} />
          <Column header="Clientes" body={(rowData) => formatList(rowData.clients)} style={{ minWidth: '12rem' }} />
          <Column header="Projetos" body={(rowData) => formatList(rowData.projects)} style={{ minWidth: '12rem' }} />
          <Column body={actionBodyTemplate} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={partnerDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={partner.id ? 'Editar Parceiro' : 'Novo Parceiro'}
        modal
        className="p-fluid"
        footer={partnerDialogFooter}
        onHide={hideDialog}
      >
        <div className="dialog-grid">
          <div className="field">
            <label htmlFor="name" className="font-bold">Nome</label>
            <InputText
              id="name"
              value={partner.name}
              onChange={(event) => handleInputChange('name', event.target.value)}
              autoFocus
              className={partnerNameInvalid ? 'p-invalid' : ''}
            />
            {partnerNameInvalid && <small className="p-error">Informe o nome do parceiro.</small>}
          </div>

          <div className="field">
            <label htmlFor="description" className="font-bold">Descricao</label>
            <InputTextarea
              id="description"
              value={partner.description}
              onChange={(event) => handleInputChange('description', event.target.value)}
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="client" className="font-bold">Cliente</label>
            <InputText
              id="client"
              value={partner.client}
              onChange={(event) => handleInputChange('client', event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="client2" className="font-bold">Cliente 2</label>
            <InputText
              id="client2"
              value={partner.client2}
              onChange={(event) => handleInputChange('client2', event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="project" className="font-bold">Projeto</label>
            <InputText
              id="project"
              value={partner.project}
              onChange={(event) => handleInputChange('project', event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="project2" className="font-bold">Projeto 2</label>
            <InputText
              id="project2"
              value={partner.project2}
              onChange={(event) => handleInputChange('project2', event.target.value)}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={deletePartnerDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header="Confirmar exclusao"
        modal
        footer={deletePartnerDialogFooter}
        onHide={hideDeletePartnerDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          <span>
            Tem certeza que deseja excluir o parceiro <b>{partner.name || '-'}</b>?
          </span>
        </div>
      </Dialog>
    </div>
  );
}
