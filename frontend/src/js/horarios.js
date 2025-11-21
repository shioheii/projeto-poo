const API_URL = 'http://localhost:3000/api';

let horarios = [];
let medicos = [];

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', function() {
  carregarHorarios();
  carregarMedicos();
  configurarFiltros();
});

// Carregar horários
async function carregarHorarios() {
  try {
    const medicoId = document.getElementById('filtroMedico').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const ativo = document.getElementById('filtroAtivo').value;

    let url = `${API_URL}/horarios`;
    
    if (medicoId) {
      url = `${API_URL}/horarios/medico/${medicoId}`;
      
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetch(url);
    const data = await response.json();
    
    horarios = Array.isArray(data) ? data : [];
    
    // Aplicar filtro de status se selecionado
    if (ativo !== '') {
      horarios = horarios.filter(horario => 
        horario.ativo === (ativo === 'true')
      );
    }
    
    atualizarTabelaHorarios();
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    horarios = [];
    atualizarTabelaHorarios();
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

// Atualizar tabela de horários
function atualizarTabelaHorarios() {
  const tbody = document.getElementById('tabelaHorarios');
  
  if (horarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum horário cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = horarios.map(horario => `
    <tr class="horario-item">
      <td>${horario.medico ? horario.medico.nome : 'N/A'}</td>
      <td>${new Date(horario.data).toLocaleDateString('pt-BR')}</td>
      <td>${horario.horaInicio} - ${horario.horaFim}</td>
      <td>
        <span class="badge ${horario.ativo ? 'badge-disponivel' : 'badge-indisponivel'}">
          ${horario.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarHorario('${horario.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirHorario('${horario.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Atualizar selects de médicos
function atualizarSelectMedicos() {
  const selectMedico = document.getElementById('medicoId');
  const selectMedicoRecorrente = document.getElementById('medicoIdRecorrente');
  const filtroMedico = document.getElementById('filtroMedico');
  
  const options = medicos.map(medico => 
    `<option value="${medico.id}">${medico.nome} - ${medico.especialidade}</option>`
  ).join('');
  
  const baseOption = '<option value="">Selecione um médico</option>';
  
  selectMedico.innerHTML = baseOption + options;
  selectMedicoRecorrente.innerHTML = baseOption + options;
  filtroMedico.innerHTML = '<option value="">Todos os médicos</option>' + options;
}

// Salvar horário individual
async function salvarHorario() {
  const form = document.getElementById('formHorario');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const horarioData = {
    medicoId: document.getElementById('medicoId').value,
    data: document.getElementById('dataHorario').value,
    horaInicio: document.getElementById('horaInicio').value,
    horaFim: document.getElementById('horaFim').value,
    ativo: document.getElementById('ativo').checked
  };

  try {
    const response = await fetch(`${API_URL}/horarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(horarioData)
    });

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('horarioModal'));
      modal.hide();
      form.reset();
      carregarHorarios();
      alert('Horário cadastrado com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao cadastrar horário: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao cadastrar horário');
  }
}

// Salvar horários recorrentes
async function salvarHorariosRecorrentes() {
  const form = document.getElementById('formHorarioRecorrente');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Coletar dias da semana selecionados
  const diasDaSemana = [];
  for (let i = 0; i <= 6; i++) {
    const checkbox = document.getElementById(getNomeDiaSemana(i));
    if (checkbox && checkbox.checked) {
      diasDaSemana.push(i);
    }
  }

  if (diasDaSemana.length === 0) {
    alert('Selecione pelo menos um dia da semana');
    return;
  }

  const horarioData = {
    medicoId: document.getElementById('medicoIdRecorrente').value,
    dataInicio: document.getElementById('dataInicioRecorrente').value,
    dataFim: document.getElementById('dataFimRecorrente').value,
    horaInicio: document.getElementById('horaInicioRecorrente').value,
    horaFim: document.getElementById('horaFimRecorrente').value,
    diasDaSemana: diasDaSemana
  };

  try {
    const response = await fetch(`${API_URL}/horarios/recorrentes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(horarioData)
    });

    if (response.ok) {
      const result = await response.json();
      const modal = bootstrap.Modal.getInstance(document.getElementById('horarioRecorrenteModal'));
      modal.hide();
      form.reset();
      carregarHorarios();
      alert(`${result.message}`);
    } else {
      const error = await response.json();
      alert('Erro ao gerar horários: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao gerar horários');
  }
}

// Editar horário
async function editarHorario(id) {
  const horario = horarios.find(h => h.id === id);
  if (!horario) return;

  // Preencher modal de edição (poderia ser um modal separado)
  document.getElementById('medicoId').value = horario.medicoId;
  document.getElementById('dataHorario').value = horario.data.split('T')[0];
  document.getElementById('horaInicio').value = horario.horaInicio;
  document.getElementById('horaFim').value = horario.horaFim;
  document.getElementById('ativo').checked = horario.ativo;

  // Aqui você poderia abrir um modal de edição ou usar o mesmo modal
  // Para simplificar, vou mostrar um prompt de confirmação
  const novoHoraInicio = prompt('Nova hora de início:', horario.horaInicio);
  const novoHoraFim = prompt('Nova hora de fim:', horario.horaFim);
  const novoAtivo = confirm('Horário ativo?');

  if (novoHoraInicio && novoHoraFim) {
    try {
      const response = await fetch(`${API_URL}/horarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          horaInicio: novoHoraInicio,
          horaFim: novoHoraFim,
          ativo: novoAtivo
        })
      });

      if (response.ok) {
        carregarHorarios();
        alert('Horário atualizado com sucesso!');
      } else {
        const error = await response.json();
        alert('Erro ao atualizar horário: ' + error.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar horário');
    }
  }
}

// Excluir horário
async function excluirHorario(id) {
  if (!confirm('Tem certeza que deseja excluir este horário?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/horarios/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      carregarHorarios();
      alert('Horário excluído com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao excluir horário: ' + error.error);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao excluir horário');
  }
}

// Configurar filtros
function configurarFiltros() {
  document.getElementById('filtroMedico').addEventListener('change', carregarHorarios);
  document.getElementById('filtroDataInicio').addEventListener('change', carregarHorarios);
  document.getElementById('filtroDataFim').addEventListener('change', carregarHorarios);
  document.getElementById('filtroAtivo').addEventListener('change', carregarHorarios);
}

// Utilitários
function getNomeDiaSemana(numero) {
  const nomes = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return nomes[numero];
}

// Configurar data mínima para os date inputs
document.addEventListener('DOMContentLoaded', function() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataHorario').min = hoje;
  document.getElementById('dataInicioRecorrente').min = hoje;
  document.getElementById('dataFimRecorrente').min = hoje;
  document.getElementById('filtroDataInicio').max = hoje;
  document.getElementById('filtroDataFim').max = hoje;
});