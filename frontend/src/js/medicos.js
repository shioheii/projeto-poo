const API_URL = 'http://localhost:3000/api';
let paginaAtualMedicos = 1;
let modalBootstrapMedicos;

document.addEventListener('DOMContentLoaded', () => {
  modalBootstrapMedicos = new bootstrap.Modal(document.getElementById('medicoModal'));
  carregarMedicos(paginaAtualMedicos);
});

async function carregarMedicos(pagina) {
  try {
    const response = await fetch(`${API_URL}/medicos?page=${pagina}`);
    const data = await response.json();

    renderizarTabelaMedicos(data.data);
    renderizarPaginacaoMedicos(data.pagination);
    paginaAtualMedicos = pagina;
  } catch (error) {
    console.error('Erro ao carregar médicos:', error);
    document.getElementById('tabelaMedicos').innerHTML = `
      <tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>
    `;
  }
}

function renderizarTabelaMedicos(medicos) {
  const tbody = document.getElementById('tabelaMedicos');

  if (medicos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum médico cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = medicos.map(m => `
    <tr>
      <td>${m.nome}</td>
      <td>${m.crm}</td>
      <td>${m.especialidade}</td>
      <td>${formatarTelefone(m.telefone)}</td>
      <td>${m.email}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarMedico('${m.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirMedico('${m.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderizarPaginacaoMedicos(pagination) {
  const ul = document.getElementById('paginacao');
  const { page, totalPages } = pagination;

  let html = '';

  html += `
    <li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="carregarMedicos(${page - 1}); return false;">Anterior</a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="carregarMedicos(${i}); return false;">${i}</a>
      </li>
    `;
  }

  html += `
    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="carregarMedicos(${page + 1}); return false;">Próximo</a>
    </li>
  `;

  ul.innerHTML = html;
}

function abrirModalNovo() {
  document.getElementById('modalTitle').textContent = 'Novo Médico';
  document.getElementById('formMedico').reset();
  document.getElementById('medicoId').value = '';
}

async function editarMedico(id) {
  try {
    const response = await fetch(`${API_URL}/medicos/${id}`);
    const medico = await response.json();

    document.getElementById('modalTitle').textContent = 'Editar Médico';
    document.getElementById('medicoId').value = medico.id;
    document.getElementById('nome').value = medico.nome;
    document.getElementById('crm').value = medico.crm;
    document.getElementById('especialidade').value = medico.especialidade;
    document.getElementById('telefone').value = formatarTelefone(medico.telefone);
    document.getElementById('email').value = medico.email;

    modalBootstrapMedicos.show();
  } catch (error) {
    alert('Erro ao carregar dados do médico');
  }
}

async function salvarMedico() {
  const form = document.getElementById('formMedico');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const id = document.getElementById('medicoId').value;
  const dados = {
    nome: document.getElementById('nome').value,
    crm: document.getElementById('crm').value,
    especialidade: document.getElementById('especialidade').value,
    telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
    email: document.getElementById('email').value
  };

  try {
    const url = id ? `${API_URL}/medicos/${id}` : `${API_URL}/medicos`;
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

    modalBootstrapMedicos.hide();
    carregarMedicos(paginaAtualMedicos);
    alert('Médico salvo com sucesso!');
  } catch (error) {
    alert(error.message);
  }
}

async function excluirMedico(id) {
  if (!confirm('Deseja realmente excluir este médico?')) return;

  try {
    const response = await fetch(`${API_URL}/medicos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Erro ao excluir');

    carregarMedicos(paginaAtualMedicos);
    alert('Médico excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir médico');
  }
}

function formatarTelefone(tel) {
  if (tel.length === 11) {
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

document.addEventListener('DOMContentLoaded', () => {
  const telefoneInput = document.getElementById('telefone');

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