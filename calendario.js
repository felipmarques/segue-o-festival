function createCalendar(container, inputElement) {
  container.innerHTML = ''; // Limpa o calendário existente (se houver)

  const calendar = document.createElement('div');
  calendar.className = 'calendar-container'; // Classe do calendário

  const header = document.createElement('div');
  header.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '‹'; // Botão de navegação para o mês anterior
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '›'; // Botão de navegação para o próximo mês

  const monthYear = document.createElement('div');
  monthYear.className = 'calendar-month-year'; // Adiciona a data do mês e ano

  header.appendChild(prevBtn);
  header.appendChild(monthYear);
  header.appendChild(nextBtn);

  const weekdays = document.createElement('div');
  weekdays.className = 'calendar-weekdays'; // Classe para os dias da semana
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(dia => {
    const div = document.createElement('div');
    div.textContent = dia;
    weekdays.appendChild(div);
  });

  const dates = document.createElement('div');
  dates.className = 'calendar-dates'; // Classe para os dias do mês

  calendar.appendChild(header);
  calendar.appendChild(weekdays);
  calendar.appendChild(dates);
  container.appendChild(calendar);

  let currentDate = new Date(); // Data atual

  // Função para atualizar o calendário
  function updateCalendar() {
    dates.innerHTML = ''; // Limpa os dias atuais

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Dia da semana do 1º dia do mês
    const totalDays = new Date(year, month + 1, 0).getDate(); // Total de dias no mês
    const lastDay = new Date(year, month + 1, 0).getDay(); // Último dia do mês

    // Exibe o mês e ano no cabeçalho
    monthYear.textContent = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Preenche os dias do mês anterior
    for (let i = firstDay; i > 0; i--) {
      const prevDate = new Date(year, month, 0 - i + 1);
      const div = document.createElement('div');
      div.className = 'date inactive';
      div.textContent = prevDate.getDate();
      dates.appendChild(div);
    }

    // Preenche os dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const div = document.createElement('div');
      div.className = 'date';
      if (date.toDateString() === new Date().toDateString()) {
        div.classList.add('today'); // Marca o dia de hoje
      }
      div.textContent = i;
      div.addEventListener('click', () => {
        inputElement.value = date.toLocaleDateString('pt-BR'); // Preenche o campo de input com a data selecionada
        container.remove(); // Remove o calendário
      });
      dates.appendChild(div);
    }

    // Preenche os dias do mês seguinte (caso haja espaços vazios no final)
    for (let i = 1; i <= 6 - lastDay; i++) {
      const nextDate = new Date(year, month + 1, i);
      const div = document.createElement('div');
      div.className = 'date inactive';
      div.textContent = nextDate.getDate();
      dates.appendChild(div);
    }
  }

  // Botão de navegação para o mês anterior
  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar(); // Atualiza o calendário
  });

  // Botão de navegação para o próximo mês
  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar(); // Atualiza o calendário
  });

  updateCalendar(); // Inicializa o calendário

  // Fecha o calendário quando clica fora dele
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && e.target !== inputElement) {
      container.remove(); // Remove o calendário se clicar fora
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('dataInput'); // Identificando o campo de input

  input.addEventListener('focus', () => {
    const existing = document.querySelector('.calendar-container');
    if (existing) existing.remove(); // Remove o calendário existente, se houver

    // Criação do novo elemento de calendário
    const calendarDiv = document.createElement('div');
    calendarDiv.style.position = 'absolute';
    calendarDiv.style.zIndex = 1000;

    const rect = input.getBoundingClientRect(); // Obtém as coordenadas do input
    calendarDiv.style.top = `${rect.bottom + window.scrollY}px`; // Ajusta a posição do calendário
    calendarDiv.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(calendarDiv); // Adiciona o calendário ao corpo da página
    createCalendar(calendarDiv, input); // Chama a função que cria o calendário
  });
});
