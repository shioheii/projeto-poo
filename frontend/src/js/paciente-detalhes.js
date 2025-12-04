const API_URL = 'http://localhost:3000/api';

let pacienteId = null;
let pacienteData = null;
let paginaAtual = 1;
const itensPorPagina = 10;
let totalConsultas = 0;

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', function() {
  // Pegar ID da URL
  const urlParams = new URLSearchParams(window.location.search);
  pacienteId = urlParams.get('id');

  if (!pacienteId) {
    alert('Paciente não encontrado');
    window.history.back();
    return;
  }

  carregarDadosPaciente();
  carregarConsultasPaciente(1);
});

// Carregar dados do paciente
async function carregarDadosPaciente() {
  try {
    const response = await fetch(`${API_URL}/pacientes/${pacienteId}`);
    pacienteData = await response.json();

    document.getElementById('nomePaciente').textContent = pacienteData.nome;
    document.getElementById('cpfPaciente').textContent = formatarCPF(pacienteData.cpf);
    document.getElementById('telefonePaciente').textContent = formatarTelefone(pacienteData.telefone);
    document.getElementById('emailPaciente').textContent = pacienteData.email;
    document.getElementById('nascimentoPaciente').textContent = formatarData(pacienteData.dataNascimento);
  } catch (error) {
    console.error('Erro ao carregar dados do paciente:', error);
    alert('Erro ao carregar dados do paciente');
  }
}

// Carregar consultas do paciente com paginação
async function carregarConsultasPaciente(pagina = 1) {
  try {
    paginaAtual = pagina;
    
    document.getElementById('loadingConsultas').classList.remove('d-none');
    document.getElementById('listaConsultas').classList.add('d-none');
    document.getElementById('paginacao').classList.add('d-none');

    const dataFiltro = document.getElementById('filtroData').value;
    const statusFiltro = document.getElementById('filtroStatus').value;

    // Construir URL com filtros
    let url = `${API_URL}/consultas/paciente/${pacienteId}?`;
    const params = new URLSearchParams();
    
    if (dataFiltro) params.append('data', dataFiltro);
    if (statusFiltro) params.append('status', statusFiltro);
    
    params.append('pagina', pagina);
    params.append('limite', itensPorPagina);

    url += params.toString();

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao carregar consultas');
    }

    totalConsultas = result.total;
    exibirConsultas(result.consultas);
    atualizarPaginacao(result.total, result.paginas);

  } catch (error) {
    console.error('Erro ao carregar consultas:', error);
    document.getElementById('loadingConsultas').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Erro ao carregar consultas: ${error.message}
      </div>
    `;
  }
}

// Exibir consultas na lista
function exibirConsultas(consultas) {
  const listaConsultas = document.getElementById('listaConsultas');
  const totalConsultasElement = document.getElementById('totalConsultas');
  
  totalConsultasElement.textContent = `${totalConsultas} consulta(s)`;

  if (consultas.length === 0) {
    listaConsultas.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
        <p class="mt-2">Nenhuma consulta encontrada</p>
      </div>
    `;
  } else {
    let html = '';
    
    consultas.forEach(consulta => {
      const horaFormatada = consulta.horario.horaInicio;
      
      const statusClass = {
        'AGENDADA': 'badge-agendada',
        'REALIZADA': 'badge-realizada',
        'CANCELADA': 'badge-cancelada'
      }[consulta.status] || 'badge-secondary';

      const statusText = {
        'AGENDADA': 'Agendada',
        'REALIZADA': 'Realizada', 
        'CANCELADA': 'Cancelada'
      }[consulta.status] || consulta.status;

      html += `
        <div class="card consulta-item mb-3">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h6 class="card-title">Consulta com Dr. ${consulta.medico.nome}</h6>
                <p class="card-text mb-1">
                  <i class="bi bi-calendar-event"></i> ${formatarData(consulta.horario.data)} às ${horaFormatada}
                </p>
                <p class="card-text mb-1">
                  <i class="bi bi-person-badge"></i> ${consulta.medico.especialidade}
                </p>
                <p class="card-text mb-0">
                  <i class="bi bi-geo-alt"></i> CRM: ${consulta.medico.crm}
                </p>
              </div>
              <div class="col-md-4 text-end">
                <span class="badge ${statusClass} mb-2">${statusText}</span>
                <div class="mt-2">
                  <button class="btn btn-sm btn-outline-primary" onclick="detalhesConsulta('${consulta.id}')">
                    <i class="bi bi-eye"></i> Detalhes
                  </button>
                  ${consulta.status === 'AGENDADA' ? `
                    <button class="btn btn-sm btn-outline-warning ms-1" onclick="editarConsulta('${consulta.id}')">
                      <i class="bi bi-pencil"></i> Editar
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    listaConsultas.innerHTML = html;
  }

  document.getElementById('loadingConsultas').classList.add('d-none');
  listaConsultas.classList.remove('d-none');
}

// Atualizar paginação
function atualizarPaginacao(total = totalConsultas, totalPaginas = null) {
  const paginacaoContainer = document.getElementById('paginacao');
  const paginationList = document.getElementById('paginationList');
  
  if (total <= itensPorPagina) {
    paginacaoContainer.classList.add('d-none');
    return;
  }

  totalPaginas = totalPaginas || Math.ceil(total / itensPorPagina);
  
  let html = '';
  
  // Botão anterior
  if (paginaAtual > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="carregarConsultasPaciente(${paginaAtual - 1}); return false;">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;
  }

  // Números das páginas
  const inicio = Math.max(1, paginaAtual - 2);
  const fim = Math.min(totalPaginas, paginaAtual + 2);
  
  for (let i = inicio; i <= fim; i++) {
    html += `
      <li class="page-item ${i === paginaAtual ? 'active' : ''}">
        <a class="page-link" href="#" onclick="carregarConsultasPaciente(${i}); return false;">${i}</a>
      </li>
    `;
  }

  // Botão próximo
  if (paginaAtual < totalPaginas) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="carregarConsultasPaciente(${paginaAtual + 1}); return false;">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;
  }

  paginationList.innerHTML = html;
  paginacaoContainer.classList.remove('d-none');
}

// Detalhes da consulta
function detalhesConsulta(consultaId) {
  // Implementar modal de detalhes da consulta
  alert(`Detalhes da consulta ${consultaId} - Implementar modal de detalhes`);
}

// Utilitários
function formatarCPF(cpf) {
  if (!cpf) return '-';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel) {
  if (!tel) return '-';
  if (tel.length === 11) {
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

function formatarData(dataString) {
  const data = dataString.split('T')[0];
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}