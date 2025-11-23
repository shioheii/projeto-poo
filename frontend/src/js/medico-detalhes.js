const API_URL = 'http://localhost:3000/api';

let medicoId = null;
let medicoData = null;

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', function() {
  // Pegar ID da URL
  const urlParams = new URLSearchParams(window.location.search);
  medicoId = urlParams.get('id');

  if (!medicoId) {
    alert('Médico não encontrado');
    window.history.back();
    return;
  }

  carregarDadosMedico();
  carregarHorariosMedico();
  preencherSelectsHorarios();
  configurarDatasMinimas();
});

// Carregar dados do médico
async function carregarDadosMedico() {
  try {
    const response = await fetch(`${API_URL}/medicos/${medicoId}`);
    medicoData = await response.json();

    document.getElementById('nomeMedico').textContent = medicoData.nome;
    document.getElementById('crmMedico').textContent = medicoData.crm;
    document.getElementById('especialidadeMedico').textContent = medicoData.especialidade;
    document.getElementById('telefoneMedico').textContent = formatarTelefone(medicoData.telefone);
    document.getElementById('emailMedico').textContent = medicoData.email;
  } catch (error) {
    console.error('Erro ao carregar dados do médico:', error);
    alert('Erro ao carregar dados do médico');
  }
}

// Carregar horários do médico
async function carregarHorariosMedico() {
  try {
    document.getElementById('loadingHorarios').classList.remove('d-none');
    document.getElementById('listaHorarios').classList.add('d-none');

    const dataFiltro = document.getElementById('filtroData').value;
    const statusFiltro = document.getElementById('filtroStatus').value;

    let url = `${API_URL}/horarios/medico/${medicoId}`;
    
    if (dataFiltro) {
      url += `?dataInicio=${dataFiltro}&dataFim=${dataFiltro}`;
    }

    const response = await fetch(url);
    const horarios = await response.json();

    // Buscar consultas para verificar ocupação
    const consultasResponse = await fetch(`${API_URL}/consultas/medico/${medicoId}`);
    const consultas = await consultasResponse.json();

    exibirHorarios(horarios, consultas, statusFiltro);
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    document.getElementById('loadingHorarios').innerHTML = `
      <p class="text-danger">Erro ao carregar horários</p>
    `;
  }
}

// Exibir horários na lista
function exibirHorarios(horarios, consultas, statusFiltro) {
  const listaHorarios = document.getElementById('listaHorarios');
  
  if (horarios.length === 0) {
    listaHorarios.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
        <p class="mt-2">Nenhum horário cadastrado para este médico</p>
      </div>
    `;
  } else {
    let html = '<div class="row">';
    
    horarios.forEach(horario => {
      // Verificar se o horário está ocupado por alguma consulta
      const ocupado = horario.consulta !== null;
      
      const status = !horario.ativo ? 'indisponivel' : ocupado ? 'ocupado' : 'disponivel';
      // Aplicar filtro de status
      if (statusFiltro && statusFiltro !== status) {
        return;
      }

      const statusText = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'indisponivel': 'Indisponível'
      }[status];

      const statusClass = {
        'disponivel': 'badge-disponivel',
        'ocupado': 'badge-ocupado',
        'indisponivel': 'badge-indisponivel'
      }[status];

      const dataString = horario.data.split('T')[0]; // Pega só "2025-11-24"
      const [ano, mes, dia] = dataString.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`

      html += `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card horario-item">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="card-title">${dataFormatada}</h6>
                  <p class="card-text mb-1">${horario.horaInicio} - ${horario.horaFim}</p>
                  <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-warning" onclick="editarHorario('${horario.id}')">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="excluirHorario('${horario.id}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    listaHorarios.innerHTML = html;
  }

  document.getElementById('loadingHorarios').classList.add('d-none');
  listaHorarios.classList.remove('d-none');
}

// Preencher selects de horários
function preencherSelectsHorarios() {
  const horarios = [];
  
  // Gerar horários de 30 em 30 minutos das 8h às 18h
  for (let hora = 8; hora <= 18; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const horaStr = hora.toString().padStart(2, '0');
      const minutoStr = minuto.toString().padStart(2, '0');
      horarios.push(`${horaStr}:${minutoStr}`);
    }
  }

  const selects = [
    'horaInicio', 'horaFim', 'horaInicioRecorrente', 'horaFimRecorrente'
  ];

  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Selecione</option>' +
      horarios.map(hora => `<option value="${hora}">${hora}</option>`).join('');
  });
}

// Salvar horário individual
async function salvarHorarioIndividual() {
  const form = document.getElementById('formHorario');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const horarioData = {
    medicoId: medicoId,
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
      carregarHorariosMedico();
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
    medicoId: medicoId,
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
      carregarHorariosMedico();
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
  // Implementar edição de horário
  const novoStatus = confirm('Deseja ativar/desativar este horário?');
  
  try {
    const response = await fetch(`${API_URL}/horarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ativo: novoStatus
      })
    });

    if (response.ok) {
      carregarHorariosMedico();
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
      carregarHorariosMedico();
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

// Utilitários
function getNomeDiaSemana(numero) {
  const nomes = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return nomes[numero];
}

function formatarTelefone(tel) {
  if (!tel) return '-';
  if (tel.length === 11) {
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

function configurarDatasMinimas() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataHorario').min = hoje;
  document.getElementById('dataInicioRecorrente').min = hoje;
  document.getElementById('dataFimRecorrente').min = hoje;
  document.getElementById('filtroData').min = hoje;
}