const API_URL = 'http://localhost:3000/api';

let consultas = [];
let medicos = [];
let pacientes = [];

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', function() {
  carregarConsultas();
  carregarMedicos();
  carregarPacientes();
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

  tbody.innerHTML = consultas.map(consulta => `
    <tr>
      <td>${consulta.paciente.nome}</td>
      <td>${consulta.medico.nome} - ${consulta.medico.especialidade}</td>
      <td>${new Date(consulta.dataHora).toLocaleString('pt-BR')}</td>
      <td>
        <span class="badge ${getBadgeClass(consulta.status)}">${consulta.status}</span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editarConsulta('${consulta.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="cancelarConsulta('${consulta.id}')">
          <i class="bi bi-x-circle"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Atualizar selects
function atualizarSelectMedicos() {
  const selectMedico = document.getElementById('medicoId');
  const filtroMedico = document.getElementById('filtroMedico');
  
  const options = medicos.map(medico => 
    `<option value="${medico.id}">${medico.nome} - ${medico.especialidade}</option>`
  ).join('');
  
  selectMedico.innerHTML = '<option value="">Selecione um médico</option>' + options;
  filtroMedico.innerHTML = '<option value="">Todos os médicos</option>' + options;
}

function atualizarSelectPacientes() {
  const selectPaciente = document.getElementById('pacienteId');
  
  const options = pacientes.map(paciente => 
    `<option value="${paciente.id}">${paciente.nome} - ${paciente.cpf}</option>`
  ).join('');
  
  selectPaciente.innerHTML = '<option value="">Selecione um paciente</option>' + options;
}

// Carregar horários disponíveis
async function carregarHorariosDisponiveis() {
  const medicoId = document.getElementById('medicoId').value;
  const data = document.getElementById('dataConsulta').value;
  
  if (!medicoId || !data) {
    document.getElementById('horarioConsulta').innerHTML = '<option value="">Selecione médico e data</option>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/consultas/horarios-disponiveis/${medicoId}/${data}`);
    const horarios = await response.json();
    
    const selectHorario = document.getElementById('horarioConsulta');
    selectHorario.innerHTML = horarios.map(horario => 
      `<option value="${horario}">${horario}</option>`
    ).join('');
    
    if (horarios.length === 0) {
      selectHorario.innerHTML = '<option value="">Nenhum horário disponível</option>';
    }
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
  }
}

// Agendar consulta
async function agendarConsulta() {
  const form = document.getElementById('formConsulta');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const dataConsulta = document.getElementById('dataConsulta').value;
  const horarioSelecionado = document.getElementById('horarioConsulta').value;
  
  // Calcular dataHora e dataFim (assumindo 1 hora de duração)
  const dataHora = new Date(`${dataConsulta}T${horarioSelecionado}:00`);
  const dataFim = new Date(dataHora.getTime() + 60 * 60 * 1000); // +1 hora

  const consultaData = {
    pacienteId: document.getElementById('pacienteId').value,
    medicoId: document.getElementById('medicoId').value,
    dataHora: dataHora.toISOString(),
    dataFim: dataFim.toISOString(), // NOVO
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

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('consultaModal'));
      modal.hide();
      form.reset();
      carregarConsultas();
      alert('Consulta agendada com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao agendar consulta: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao agendar consulta');
  }
}

// Utilitários
function getBadgeClass(status) {
  const classes = {
    'AGENDADA': 'bg-warning',
    'CONFIRMADA': 'bg-primary',
    'REALIZADA': 'bg-success',
    'CANCELADA': 'bg-danger'
  };
  return classes[status] || 'bg-secondary';
}

// Event listeners
document.getElementById('medicoId').addEventListener('change', carregarHorariosDisponiveis);
document.getElementById('dataConsulta').addEventListener('change', carregarHorariosDisponiveis);