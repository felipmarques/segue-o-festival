<script>
  const dataInput = document.getElementById('dataInput');
  const calendarContainer = document.getElementById('calendar');
  const monthYearElement = document.getElementById('monthYear');
  const datesElement = document.getElementById('dates');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let currentDate = new Date();

  function updateCalendar() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();

    const monthYearString = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    monthYearElement.textContent = monthYearString;

    let datesHTML = '';

    for (let i = firstDayIndex; i > 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
      datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const activeClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
      datesHTML += `<div class="date ${activeClass}" data-day="${i}">${i}</div>`;
    }

    for (let i = 1; i <= 6 - lastDayIndex; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
    }

    datesElement.innerHTML = datesHTML;

    // Evento para clicar e preencher o input
    document.querySelectorAll('.date:not(.inactive)').forEach(el => {
      el.addEventListener('click', () => {
        const selectedDate = new Date(currentYear, currentMonth, el.dataset.day);
        dataInput.value = selectedDate.toLocaleDateString('pt-BR');
        calendarContainer.style.display = 'none';
      });
    });
  }

  dataInput.addEventListener('focus', () => {
    const rect = dataInput.getBoundingClientRect();
    calendarContainer.style.top = `${rect.bottom + window.scrollY}px`;
    calendarContainer.style.left = `${rect.left + window.scrollX}px`;
    calendarContainer.style.display = 'block';
    updateCalendar();
  });

  document.addEventListener('click', (e) => {
    if (!calendarContainer.contains(e.target) && e.target !== dataInput) {
      calendarContainer.style.display = 'none';
    }
  });

  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });
</script>
