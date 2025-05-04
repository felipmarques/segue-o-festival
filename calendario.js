function createCalendar(container, inputElement) {
  container.innerHTML = '';

  const calendar = document.createElement('div');
  calendar.className = 'calendar-container';

  const header = document.createElement('div');
  header.className = 'calendar-header';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '‹';
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '›';

  const monthYear = document.createElement('div');
  header.appendChild(prevBtn);
  header.appendChild(monthYear);
  header.appendChild(nextBtn);

  const weekdays = document.createElement('div');
  weekdays.className = 'calendar-days'; // Corrigido: era calendar-weekdays
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(dia => {
    const div = document.createElement('div');
    div.textContent = dia;
    weekdays.appendChild(div);
  });

  const dates = document.createElement('div');
  dates.className = 'calendar-dates';

  calendar.appendChild(header);
  calendar.appendChild(weekdays);
  calendar.appendChild(dates);
  container.appendChild(calendar);

  let currentDate = new Date();

  function updateCalendar() {
    dates.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month + 1, 0).getDay();

    monthYear.textContent = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Dias do mês anterior
    for (let i = firstDay; i > 0; i--) {
      const prevDate = new Date(year, month, 0 - i + 1);
      const btn = document.createElement('button');
      btn.className = 'inactive';
      btn.textContent = prevDate.getDate();
      btn.disabled = true;
      dates.appendChild(btn);
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const btn = document.createElement('button');
      if (date.toDateString() === new Date().toDateString()) {
        btn.classList.add('today');
      }
      btn.textContent = i;
      btn.addEventListener('click', () => {
        inputElement.value = date.toLocaleDateString('pt-BR');
        container.remove();
      });
      dates.appendChild(btn);
    }

    // Dias do mês seguinte
    for (let i = 1; i <= 6 - lastDay; i++) {
      const nextDate = new Date(year, month + 1, i);
      const btn = document.createElement('button');
      btn.className = 'inactive';
      btn.textContent = nextDate.getDate();
      btn.disabled = true;
      dates.appendChild(btn);
    }
  }

  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });

  updateCalendar();

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && e.target !== inputElement) {
      container.remove();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
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
});
