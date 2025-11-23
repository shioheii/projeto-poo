const API_URL = 'http://localhost:3000/api';
let paginaAtual = 1;
let modalBootstrap;

document.addEventListener('DOMContentLoaded', () => {
  modalBootstrap = new bootstrap.Modal(document.getElementById('pacienteModal'));
  carregarPacientes(paginaAtual);
});

async function carregarPacientes(pagina) {
  try {
    const response = await fetch(`${API_URL}/pacientes?page=${pagina}`);
    const data = await response.json();

    renderizarTabela(data.data);
    renderizarPaginacao(data.pagination);
    paginaAtual = pagina;
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
    document.getElementById('tabelaPacientes').innerHTML = `
      <tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>
    `;
  }
}

function renderizarTabela(pacientes) {
  const tbody = document.getElementById('tabelaPacientes');

  if (pacientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum paciente cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = pacientes.map(p => `
    <tr>
      <td>${p.nome}</td>
      <td>${formatarCPF(p.cpf)}</td>
      <td>${formatarData(p.dataNascimento)}</td>
      <td>${formatarTelefone(p.telefone)}</td>
      <td>${p.email}</td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" onclick="editarPaciente('${p.id}')">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarPaciente('${p.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirPaciente('${p.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderizarPaginacao(pagination) {
  const ul = document.getElementById('paginacao');
  const { page, totalPages } = pagination;

  let html = '';

  // Botão anterior
  html += `
    <li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="carregarPacientes(${page - 1}); return false;">Anterior</a>
    </li>
  `;

  // Páginas
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="carregarPacientes(${i}); return false;">${i}</a>
      </li>
    `;
  }

  // Botão próximo
  html += `
    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="carregarPacientes(${page + 1}); return false;">Próximo</a>
    </li>
  `;

  ul.innerHTML = html;
}

function abrirModalNovo() {
  document.getElementById('modalTitle').textContent = 'Novo Paciente';
  document.getElementById('formPaciente').reset();
  document.getElementById('pacienteId').value = '';
}

async function editarPaciente(id) {
  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`);
    const paciente = await response.json();

    document.getElementById('modalTitle').textContent = 'Editar Paciente';
    document.getElementById('pacienteId').value = paciente.id;
    document.getElementById('nome').value = paciente.nome;
    document.getElementById('cpf').value = formatarCPF(paciente.cpf);
    document.getElementById('dataNascimento').value = paciente.dataNascimento.split('T')[0];
    document.getElementById('telefone').value = formatarTelefone(paciente.telefone);
    document.getElementById('email').value = paciente.email;
    document.getElementById('endereco').value = paciente.endereco || '';

    modalBootstrap.show();
  } catch (error) {
    alert('Erro ao carregar dados do paciente');
  }
}

async function salvarPaciente() {
  const form = document.getElementById('formPaciente');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const id = document.getElementById('pacienteId').value;
  const dados = {
    nome: document.getElementById('nome').value,
    cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
    dataNascimento: document.getElementById('dataNascimento').value,
    telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
    email: document.getElementById('email').value,
    endereco: document.getElementById('endereco').value || null
  };

  try {
    const url = id ? `${API_URL}/pacientes/${id}` : `${API_URL}/pacientes`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao salvar');
    }

    modalBootstrap.hide();
    carregarPacientes(paginaAtual);
    alert('Paciente salvo com sucesso!');
  } catch (error) {
    alert(error.message);
  }
}

async function excluirPaciente(id) {
  if (!confirm('Deseja realmente excluir este paciente?')) return;

  try {
    const response = await fetch(`${API_URL}/pacientes/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Erro ao excluir');

    carregarPacientes(paginaAtual);
    alert('Paciente excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir paciente');
  }
}

function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel) {
  if (tel.length === 11) {
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR');
}

// Máscaras de input
document.addEventListener('DOMContentLoaded', () => {
  const cpfInput = document.getElementById('cpf');
  const telefoneInput = document.getElementById('telefone');

  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
      }
    });
  }

  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
      }
    });
  }
});