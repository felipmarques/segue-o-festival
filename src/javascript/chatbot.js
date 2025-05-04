document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbox = document.getElementById("chatbox");
  const options = document.getElementById("options");
  const balloon = document.getElementById("chatbot-balloon");

  toggleButton.onclick = () => {
    const isVisible = chatbotWindow.style.display === "flex";
    if (isVisible) {
      chatbotWindow.style.display = "none";
      balloon.style.display = "block";
    } else {
      chatbotWindow.style.display = "flex";
      balloon.style.display = "none";
    }
  };

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `msg ${sender}`;
    msg.textContent = text;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function setOptions(buttons) {
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "option-buttons";
  
    buttons.forEach(btn => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.onclick = () => {
        addMessage(btn.text, "user"); 
        btn.action(); 
        optionsContainer.remove(); 
      };
      optionsContainer.appendChild(button);
    });
  
    chatbox.appendChild(optionsContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
  }
  

  function startChat() {
    chatbox.innerHTML = "";
    addMessage("Olá! Bem-vindo ao Segue o Festival!", "bot");
    setOptions([
      { text: "Recomendação", action: showRecommendations },
      { text: "Falar com atendente", action: () => addMessage("Direcionando ao atendente...", "bot") },
      { text: "Comprar ingresso", action: buyTicket },
      { text: "Evento por localidade", action: searchByLocation }
    ]);
  }

  function showRecommendations() {
    addMessage("O que você está buscando hoje?", "bot");
    setOptions([
      { text: "Festival", action: handleFestival },
      { text: "Show", action: handleShow },
      { text: "Palestra", action: handlePalestra },
      { text: "Cultural", action: handleCultural }
    ]);
  }
  
  // FESTIVAL
  function handleFestival() {
    addMessage("Qual estilo de festival você prefere?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showFestivalOptions("Eletrônica") },
      { text: "Sertanejo", action: () => showFestivalOptions("Pop") },
      { text: "Rock", action: () => showFestivalOptions("Rock") },
      { text: "Rap", action: () => showFestivalOptions("Rap") },
      { text: "Funk", action: () => showFestivalOptions("Funk") }
    ]);
  }
  
  function showFestivalOptions(style) {
    addMessage(`Festivais de ${style} disponíveis:`, "bot");
    // Aqui você pode depois puxar da API
  }
  
  // SHOW
  function handleShow() {
    addMessage("Qual estilo de show você procura?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showShowOptions("Eletrônica") },
      { text: "Sertanejo", action: () => showShowOptions("Pop") },
      { text: "Rock", action: () => showShowOptions("Rock") },
      { text: "Rap", action: () => showShowOptions("Rap") },
      { text: "Funk", action: () => showShowOptions("Funk") }
    ]);
  }
  
  function showShowOptions(style) {
    addMessage(`Shows de ${style} disponíveis:`, "bot");
  }
  
  // PALESTRA
  function handlePalestra() {
    addMessage("Escolha o estado:", "bot");
  
    const selectContainer = document.createElement("div");
    selectContainer.className = "select-container";
  
    const select = document.createElement("select");
    select.className = "chat-select";
    select.innerHTML = `<option disabled selected>Selecione um estado</option>`;
  
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then(res => res.json())
      .then(estados => {
        estados
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .forEach(estado => {
            const option = document.createElement("option");
            option.value = estado.id;
            option.textContent = estado.nome;
            select.appendChild(option);
          });
  
        select.onchange = () => {
          const estadoId = select.value;
          const estadoNome = select.options[select.selectedIndex].text;
          selectCidadeDropdown(estadoId, estadoNome);
          selectContainer.remove(); 
        };
  
        selectContainer.appendChild(select);
        chatbox.appendChild(selectContainer);
        chatbox.scrollTop = chatbox.scrollHeight;
      });
  }
  
  function selectCidadeDropdown(estadoId, estadoNome) {
    addMessage(`Estado selecionado: ${estadoNome}`, "bot");
    addMessage("Agora escolha a cidade:", "bot");
  
    const selectContainer = document.createElement("div");
    selectContainer.className = "select-container";
  
    const select = document.createElement("select");
    select.className = "chat-select";
    select.innerHTML = `<option disabled selected>Selecione uma cidade</option>`;
  
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`)
      .then(res => res.json())
      .then(cidades => {
        cidades.forEach(cidade => {
          const option = document.createElement("option");
          option.value = cidade.nome;
          option.textContent = cidade.nome;
          select.appendChild(option);
        });
  
        select.onchange = () => {
          const cidade = select.value;
          selectContainer.remove(); 
          showPalestrasCidade(cidade, estadoNome);
        };
  
        selectContainer.appendChild(select);
        chatbox.appendChild(selectContainer);
        chatbox.scrollTop = chatbox.scrollHeight;
      });
  }


  
  function showPalestrasCidade(cidade, estado) {
    addMessage(`📍 Palestras em ${cidade} - ${estado}:`, "bot");
  }
  
  
  
  // CULTURAL
  function handleCultural() {
    addMessage("Escolha uma festa ou tradição cultural:", "bot");
    setOptions([
      { text: "Ano Novo", action: () => showCulturalOptions("Ano Novo") },
      { text: "Carnaval", action: () => showCulturalOptions("Carnaval") },
      { text: "Festa Junina", action: () => showCulturalOptions("Festa Junina") },
      { text: "Natal", action: () => showCulturalOptions("Natal") },
    ]);
  }
  
  function showCulturalOptions(eventName) {
    addMessage(`🎊 Eventos culturais de ${eventName}:`, "bot");
  }
  

  function buyTicket() {
    addMessage("Escolha uma data:", "bot");
  
    const dateContainer = document.createElement("div");
    dateContainer.className = "calendar-container";
  
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.style.opacity = "0";
    hiddenInput.style.height = "0";
    hiddenInput.style.position = "absolute";
    hiddenInput.style.pointerEvents = "none";
  
    dateContainer.appendChild(hiddenInput);
    chatbox.appendChild(dateContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
  
    flatpickr(hiddenInput, {
      inline: true,
      minDate: "2025-08-01",
      maxDate: "2025-08-31",
      dateFormat: "d/m",
      onChange: function (selectedDates, dateStr) {
        if (dateStr) {
          addMessage(`Eventos disponíveis em ${dateStr}:`, "bot");
          selectEvent(dateStr);
          dateContainer.remove();
        }
      }
    });
  }
  

  function showCalendar() {
    addMessage("Escolha uma data:", "bot");
  
    // Cria container se ainda não existir
    const calendarContainer = document.createElement("div");
    calendarContainer.id = "calendar-container";
    document.getElementById("chat-messages").appendChild(calendarContainer);
  
    const input = document.createElement("input");
    input.type = "text";
    input.style.display = "none";
    calendarContainer.appendChild(input);
  
    flatpickr(input, {
      inline: true,
      minDate: "today",
      onChange: function(selectedDates, dateStr) {
        calendarContainer.remove(); // remove calendário depois de escolher
        addMessage(`Eventos disponíveis em ${dateStr}:`, "bot");
        setOptions([
          { text: "Festival de Música", action: () => addMessage("Redirecionando para a página do evento!", "bot") },
          { text: "Feira Literária", action: () => addMessage("Redirecionando para a página do evento!", "bot") }
        ]);
      }
    });
  }
  

  function selectEvent(date) {
    setOptions([
      { text: "Festival de Música", action: () => addMessage("Redirecionando para a página do evento!", "bot") },
      { text: "Feira Literária", action: () => addMessage("Redirecionando para a página do evento!", "bot") }
    ]);
  }
  
  

  // 🔹 NOVA VERSÃO: Estados reais via IBGE
  async function searchByLocation() {
    addMessage("Selecione o estado:", "bot");

    const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await response.json();
    estados.sort((a, b) => a.nome.localeCompare(b.nome));

    const options = estados.map(estado => ({
      text: estado.sigla,
      action: () => selectMunicipio(estado.id, estado.nome)
    }));

    setOptions(options);
  }

  // 🔹 Buscar municípios do estado selecionado
  async function selectMunicipio(ufId, ufNome) {
    addMessage(`Municípios em ${ufNome}:`, "bot");

    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`);
    const municipios = await response.json();
    municipios.sort((a, b) => a.nome.localeCompare(b.nome));

    const options = municipios.slice(0, 10).map(m => ({
      text: m.nome,
      action: () => showLocalEvents(m.nome)
    }));

    options.push({
      text: "🔍 Ver todos",
      action: () => showAllMunicipios(municipios)
    });

    setOptions(options);
  }

  function showAllMunicipios(municipios) {
    const options = municipios.map(m => ({
      text: m.nome,
      action: () => showLocalEvents(m.nome)
    }));
    setOptions(options);
  }

  function showLocalEvents(city) {
    addMessage(`Eventos em ${city}:`, "bot");
    setOptions([
      { text: "Evento A", action: () => addMessage("Redirecionando para o Evento A...", "bot") },
      { text: "Evento B", action: () => addMessage("Redirecionando para o Evento B...", "bot") }
    ]);
  }

  startChat();
});


const closeButton = document.getElementById("close-chat");

closeButton.onclick = () => {
  document.getElementById("chatbot-window").style.display = "none";
  document.getElementById("chatbot-balloon").style.display = "block";

};


 