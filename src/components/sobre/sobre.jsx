import React from 'react';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import Curriculo from '../../assets/Curriculo_Kaya_Haufe.pdf';
import profileImage from '../../assets/profile.jpeg';

export default function Sobre() {
  const footer = (
    <div className="flex flex-column align-items-center">
      <Avatar image={profileImage} size="xlarge" shape="circle" />
      <span className="mt-3">Desenvolvido por Kaya Haufe.</span>

      <div className="sobre-footer-actions">
        <a href="https://www.linkedin.com/in/kayahaufe" target="_blank" rel="noreferrer">
          <Button label="LinkedIn" icon="pi pi-linkedin" className="linkedin-button" />
        </a>

        <a href={Curriculo} download="Curriculo_Kaya_Haufe.pdf">
          <Button label="Curriculo" icon="pi pi-download" className="p-button-success" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="sobre flex justify-content-center align-items-center">
      <Card
        title="Aplicacao de Gestao de Empresas Externas e Parceiros"
        footer={footer}
      >
        <section>
          <h2>Visao Geral</h2>
          <p>
            A aplicacao de <strong>Gestao de Empresas Externas e Parceiros</strong> foi criada para
            organizar o cadastro e a manutencao de empresas externas e parceiros. O sistema oferece
            listagem, criacao, edicao, exclusao, busca e paginacao em uma interface unica.
          </p>
        </section>

        <section>
          <h2>Tecnologias Utilizadas</h2>
          <ul>
            <li>React para a construcao da interface do usuario</li>
            <li>PrimeReact e PrimeFlex para componentes e layout</li>
            <li>Axios para integracao com APIs REST</li>
            <li>Vite para desenvolvimento e build da aplicacao</li>
          </ul>
        </section>

        <section>
          <h2>Funcionalidades Principais</h2>
          <ul>
            <li>Cadastro e edicao de parceiros</li>
            <li>Cadastro e edicao de empresas externas</li>
            <li>Busca global nas listagens</li>
            <li>Paginacao para grandes volumes de dados</li>
          </ul>
        </section>
      </Card>
    </div>
  );
}
