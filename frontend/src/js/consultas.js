const API_URL = 'http://localhost:3000/api';

let consultas = [];
let medicos = [];
let pacientes = [];

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', function() {
  carregarConsultas();
  carregarMedicos();
  carregarPacientes();
  
  // Event listeners
  document.getElementById('medicoId').addEventListener('change', carregarHorariosDisponiveis);
  document.getElementById('dataConsulta').addEventListener('change', carregarHorariosDisponiveis);
  
  // Definir data mínima como hoje
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataConsulta').min = hoje;
});

// Carregar consultas
async function carregarConsultas() {
  try {
    const response = await fetch(`${API_URL}/consultas`);
    const data = await response.json();
    
    consultas = data.data;
    atualizarTabelaConsultas();
  } catch (error) {
    console.error('Erro ao carregar consultas:', error);
    showAlert('Erro ao carregar consultas', 'danger');
  }
}

// Carregar médicos
async function carregarMedicos() {
  try {
    const response = await fetch(`${API_URL}/medicos`);
    const data = await response.json();
    
    medicos = data.data;
    atualizarSelectMedicos();
  } catch (error) {
    console.error('Erro ao carregar médicos:', error);
  }
}

// Carregar pacientes
async function carregarPacientes() {
  try {
    const response = await fetch(`${API_URL}/pacientes`);
    const data = await response.json();
    
    pacientes = data.data;
    atualizarSelectPacientes();
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
  }
}

// Atualizar tabela de consultas
function atualizarTabelaConsultas() {
  const tbody = document.getElementById('tabelaConsultas');
  
  if (consultas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma consulta agendada</td></tr>';
    return;
  }

  tbody.innerHTML = consultas.map(consulta => {
    const dataString = consulta.horario.data.split('T')[0]; // Pega só "2025-11-24"
    const [ano, mes, dia] = dataString.split('-');
    
    const dataFormatada = `${dia}/${mes}/${ano}`
    const horaFormatada = consulta.horario.horaInicio;
    
    return `
      <tr>
        <td>${consulta.paciente.nome}</td>
        <td>${consulta.medico.nome} - ${consulta.medico.especialidade}</td>
        <td>${dataFormatada} às ${horaFormatada}</td>
        <td>
          <span class="badge ${getBadgeClass(consulta.status)}">${consulta.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-warning" onclick="editarConsulta('${consulta.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="cancelarConsulta('${consulta.id}')">
            <i class="bi bi-x-circle"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Atualizar selects
function atualizarSelectMedicos() {
  const selectMedico = document.getElementById('medicoId');
  const filtroMedico = document.getElementById('filtroMedico');
  
  const options = medicos.map(medico => 
    `<option value="${medico.id}">${medico.nome} - ${medico.especialidade}</option>`
  ).join('');
  
  selectMedico.innerHTML = '<option value="">Selecione um médico</option>' + options;
  if (filtroMedico) {
    filtroMedico.innerHTML = '<option value="">Todos os médicos</option>' + options;
  }
}

function atualizarSelectPacientes() {
  const selectPaciente = document.getElementById('pacienteId');
  
  const options = pacientes.map(paciente => 
    `<option value="${paciente.id}">${paciente.nome} - ${paciente.cpf}</option>`
  ).join('');
  
  selectPaciente.innerHTML = '<option value="">Selecione um paciente</option>' + options;
}

// Carregar horários disponíveis (slots de 30min)
async function carregarHorariosDisponiveis() {
  const medicoId = document.getElementById('medicoId').value;
  const data = document.getElementById('dataConsulta').value;
  
  const selectHorario = document.getElementById('horarioConsulta');
  
  if (!medicoId || !data) {
    selectHorario.innerHTML = '<option value="">Selecione médico e data</option>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/horarios/disponiveis/${medicoId}/${data}`);
    const horarios = await response.json();
    
    if (horarios.length === 0) {
      selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>';
      return;
    }
    
    // Cada horário retornado é um objeto com id, horaInicio, horaFim
    selectHorario.innerHTML = horarios.map(horario => 
      `<option value="${horario.id}">${horario.horaInicio} - ${horario.horaFim}</option>`
    ).join('');
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
  }
}

// Agendar consulta
async function agendarConsulta() {
  const form = document.getElementById('formConsulta');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const consultaData = {
    pacienteId: document.getElementById('pacienteId').value,
    medicoId: document.getElementById('medicoId').value,
    horarioId: document.getElementById('horarioConsulta').value, // Agora é o ID do slot
    observacoes: document.getElementById('observacoes').value
  };

  try {
    const response = await fetch(`${API_URL}/consultas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consultaData)
    });

    const result = await response.json();

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('consultaModal'));
      modal.hide();
      form.reset();
      carregarConsultas();
      showAlert('Consulta agendada com sucesso!', 'success');
    } else {
      showAlert('Erro ao agendar consulta: ' + result.error, 'danger');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('Erro ao agendar consulta', 'danger');
  }
}

// Editar consulta
async function editarConsulta(id) {
  try {
    const response = await fetch(`${API_URL}/consultas/${id}`);
    const consulta = await response.json();
    
    // Preencher modal com dados da consulta
    document.getElementById('consultaId').value = consulta.id;
    document.getElementById('pacienteId').value = consulta.pacienteId;
    document.getElementById('medicoId').value = consulta.medicoId;
    document.getElementById('statusConsulta').value = consulta.status;
    document.getElementById('observacoesEdit').value = consulta.observacoes || '';
    
    // Mostrar modal de edição
    const modalEdit = new bootstrap.Modal(document.getElementById('editarConsultaModal'));
    modalEdit.show();
  } catch (error) {
    showAlert('Erro ao carregar dados da consulta', 'danger');
  }
}

// Salvar edição da consulta
async function salvarEdicaoConsulta() {
  const id = document.getElementById('consultaId').value;
  const status = document.getElementById('statusConsulta').value;
  const observacoes = document.getElementById('observacoesEdit').value;

  try {
    const response = await fetch(`${API_URL}/consultas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, observacoes })
    });

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editarConsultaModal'));
      modal.hide();
      carregarConsultas();
      showAlert('Consulta atualizada com sucesso!', 'success');
    } else {
      const result = await response.json();
      showAlert('Erro ao atualizar consulta: ' + result.error, 'danger');
    }
  } catch (error) {
    showAlert('Erro ao atualizar consulta', 'danger');
  }
}

// Cancelar consulta
async function cancelarConsulta(id) {
  if (!confirm('Deseja realmente cancelar esta consulta?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/consultas/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      carregarConsultas();
      showAlert('Consulta cancelada com sucesso!', 'success');
    } else {
      const result = await response.json();
      showAlert('Erro ao cancelar consulta: ' + result.error, 'danger');
    }
  } catch (error) {
    showAlert('Erro ao cancelar consulta', 'danger');
  }
}

// Utilitários
function getBadgeClass(status) {
  const classes = {
    'AGENDADA': 'bg-warning text-dark',
    'CONFIRMADA': 'bg-primary',
    'REALIZADA': 'bg-success',
    'CANCELADA': 'bg-danger'
  };
  return classes[status] || 'bg-secondary';
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}