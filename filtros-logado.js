// filtros-logado.js
let todosEventos = [];
let estadoSelecionado = null;
let tipoSelecionado = null;
let dataSelecionada = null;

async function buscarEventos() {
  try {
    const response = await fetch('/api/buscaeventos');
    if (!response.ok) throw new Error(`Erro: ${response.status}`);

    todosEventos = await response.json();
    exibirEventosFiltrados();
    exibirCarrossel(todosEventos);
  } catch (error) {
    document.getElementById('eventos-lista').innerHTML = 'Erro ao carregar eventos.';
    console.error(error);
  }
}

function filtrarEventos(tipo, valor) {
  if (tipo === 'estado') estadoSelecionado = valor;
  if (tipo === 'tipo') tipoSelecionado = valor;
  exibirEventosFiltrados();
}

function limparFiltros() {
  estadoSelecionado = null;
  tipoSelecionado = null;
  dataSelecionada = null;
  document.getElementById('dataInput').value = '';
  exibirEventosFiltrados();
}

function exibirEventosFiltrados() {
  const container = document.getElementById('eventos-lista');
  container.innerHTML = '';

  const eventosFiltrados = todosEventos.filter(evento => {
    const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
    return (!estadoSelecionado || evento.estado === estadoSelecionado) &&
           (!tipoSelecionado || evento.tipo_evento === tipoSelecionado) &&
           (!dataSelecionada || dataSelecionada === dataFormatada);
  });

  if (eventosFiltrados.length === 0) {
    container.innerHTML = '<p>Nenhum evento encontrado.</p>';
    return;
  }

  eventosFiltrados.forEach(evento => {
    const div = document.createElement('div');
    div.className = 'conteudo-secundario-item';
    div.style.cursor = 'pointer';
    div.setAttribute("data-id", evento.id_evento);
    div.onclick = () => {
      window.location.href = `pagina_evento.html?id=${evento.id_evento}`;
    };

    const imagem = document.createElement('img');
    imagem.src = evento.imagem ? `data:image/jpeg;base64,${evento.imagem}` : '/img/default.jpg';
    imagem.alt = evento.nome;

    const titulo = document.createElement('h3');
    titulo.textContent = evento.nome;

    const data = document.createElement('p');
    if (evento.data) {
      const dataEvento = new Date(evento.data);
      const dataFormatada = dataEvento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const diaSemana = dataEvento.toLocaleDateString('pt-BR', { weekday: 'long' });
      data.textContent = `${dataFormatada} - ${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}`;
    } else {
      data.textContent = 'Data não informada';
    }

    const local = document.createElement('p');
    local.textContent = evento.endereco || 'Local não informado';

    const botaoSalvar = document.createElement('button');
    botaoSalvar.className = 'botao-salvar';
    botaoSalvar.textContent = verificarEventoSalvo(evento.id_evento) ? 'Salvo' : 'Salvar';
    if (verificarEventoSalvo(evento.id_evento)) {
      botaoSalvar.classList.add('botao-salvo');
    }
    botaoSalvar.onclick = (e) => {
      e.stopPropagation();
      alternarSalvarEvento(evento.id_evento, botaoSalvar);
    };

    div.appendChild(imagem);
    div.appendChild(titulo);
    div.appendChild(data);
    div.appendChild(local);
    div.appendChild(botaoSalvar);
    container.appendChild(div);
  });
}

function verificarEventoSalvo(idEvento) {
  const salvos = JSON.parse(localStorage.getItem("eventosSalvos") || "[]");
  return salvos.includes(idEvento);
}

function alternarSalvarEvento(idEvento, botao) {
  let salvos = JSON.parse(localStorage.getItem("eventosSalvos") || "[]");
  const index = salvos.indexOf(idEvento);
  if (index > -1) {
    salvos.splice(index, 1);
    botao.textContent = 'Salvar';
    botao.classList.remove('botao-salvo');
  } else {
    salvos.push(idEvento);
    botao.textContent = 'Salvo';
    botao.classList.add('botao-salvo');
  }
  localStorage.setItem("eventosSalvos", JSON.stringify(salvos));
}

function exibirCarrossel(eventos) {
  const carrossel = document.getElementById("carrossel");
  carrossel.innerHTML = '';

  eventos.forEach(evento => {
    const img = document.createElement("img");
    img.src = evento.imagem ? `data:image/jpeg;base64,${evento.imagem}` : '/img/default.jpg';
    img.alt = evento.nome;
    carrossel.appendChild(img);
  });
  index = 0;
  atualizarCarrossel();
}

function atualizarCarrossel() {
  const carrossel = document.getElementById("carrossel");
  carrossel.style.transform = `translateX(-${index * 100}%)`;
}

function avancar() {
  const total = document.querySelectorAll('#carrossel img').length;
  index = (index + 1) % total;
  atualizarCarrossel();
}

function voltar() {
  const total = document.querySelectorAll('#carrossel img').length;
  index = (index - 1 + total) % total;
  atualizarCarrossel();
}

// Calendário integração
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('dataInput');
  input.addEventListener('focus', () => {
    const existing = document.querySelector('.calendar-container');
    if (existing) existing.remove();
    const calendarDiv = document.createElement('div');
    calendarDiv.style.position = 'absolute';
    calendarDiv.style.zIndex = 1000;
    const rect = input.getBoundingClientRect();
    calendarDiv.style.top = `${rect.bottom + window.scrollY}px`;
    calendarDiv.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(calendarDiv);
    createCalendar(calendarDiv, input);
  });
  input.addEventListener('change', () => {
    dataSelecionada = input.value;
    exibirEventosFiltrados();
  });
});

buscarEventos();
