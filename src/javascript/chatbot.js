// CHATBOT

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbox = document.getElementById("chatbox");
  const balloon = document.getElementById("chatbot-balloon");
  const sendMessageButton = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");

  toggleButton.onclick = () => {
    const isVisible = chatbotWindow.style.display === "flex";
    chatbotWindow.style.display = isVisible ? "none" : "flex";
    balloon.style.display = isVisible ? "block" : "none";
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

  // Festival, Show, Cultural Handlers
  function handleFestival() {
    addMessage("Qual estilo de festival você prefere?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showFestivalOptions("Eletrônica") },
      { text: "Sertanejo", action: () => showFestivalOptions("Sertanejo") },
      { text: "Rock", action: () => showFestivalOptions("Rock") },
      { text: "Rap", action: () => showFestivalOptions("Rap") },
      { text: "Funk", action: () => showFestivalOptions("Funk") }
    ]);
  }

  function showFestivalOptions(style) {
    addMessage(`Festivais de ${style} disponíveis:`, "bot");
  }

  function handleShow() {
    addMessage("Qual estilo de show você procura?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showShowOptions("Eletrônica") },
      { text: "Sertanejo", action: () => showShowOptions("Sertanejo") },
      { text: "Rock", action: () => showShowOptions("Rock") },
      { text: "Rap", action: () => showShowOptions("Rap") },
      { text: "Funk", action: () => showShowOptions("Funk") }
    ]);
  }

  function showShowOptions(style) {
    addMessage(`Shows de ${style} disponíveis:`, "bot");
  }

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

  // Palestra
  function handlePalestra() {
    addMessage("Escolha o estado", "bot");
    const container = document.createElement("div");
    const select = document.createElement("select");
    select.className = "chat-select";
    select.innerHTML = `<option disabled selected>Selecione um estado</option>`;

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then(res => res.json())
      .then(estados => {
        estados.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(estado => {
          const option = document.createElement("option");
          option.value = estado.id;
          option.textContent = estado.nome;
          select.appendChild(option);
        });

        select.onchange = () => {
          const estadoId = select.value;
          const estadoNome = select.options[select.selectedIndex].text;
          container.remove();
          selectCidadeDropdown(estadoId, estadoNome);
        };

        container.appendChild(select);
        chatbox.appendChild(container);
        chatbox.scrollTop = chatbox.scrollHeight;
      });
  }

  function selectCidadeDropdown(estadoId, estadoNome) {
    addMessage("Escolha a cidade", "bot");
    const container = document.createElement("div");
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
          container.remove();
          showPalestrasCidade(cidade, estadoNome);
        };

        container.appendChild(select);
        chatbox.appendChild(container);
        chatbox.scrollTop = chatbox.scrollHeight;
      });
  }

  function showPalestrasCidade(cidade, estado) {
    addMessage(`Palestras em ${cidade} - ${estado}:`, "bot");
  }

  // Comprar ingresso com calendário
  function buyTicket() {
    addMessage("Escolha uma data:", "bot");
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    input.style.opacity = "0";
    input.style.position = "absolute";

    container.appendChild(input);
    chatbox.appendChild(container);

    flatpickr(input, {
      inline: true,
      minDate: "2025-08-01",
      maxDate: "2025-08-31",
      dateFormat: "d/m",
      onChange: function (_, dateStr) {
        if (dateStr) {
          addMessage(`Eventos disponíveis em ${dateStr}:`, "bot");
          container.remove();
          setOptions([
            { text: "Festival de Música", action: () => addMessage("Redirecionando para a página do evento!", "bot") },
            { text: "Feira Literária", action: () => addMessage("Redirecionando para a página do evento!", "bot") }
          ]);
        }
      }
    });
  }

  // Evento por localidade
  async function searchByLocation() {
    addMessage("Selecione o estado:", "bot");
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await res.json();
    estados.sort((a, b) => a.nome.localeCompare(b.nome));

    const options = estados.map(estado => ({
      text: estado.sigla,
      action: () => selectMunicipio(estado.id, estado.nome)
    }));

    setOptions(options);
  }

  async function selectMunicipio(ufId, ufNome) {
    addMessage(`Municípios em ${ufNome}:`, "bot");
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`);
    const municipios = await res.json();
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

  // Entrada de mensagens de texto e imagem
  sendMessageButton.onclick = () => {
    const msg = messageInput.value.trim();
    if (msg) {
      addMessage(msg, "user");
      messageInput.value = "";
    }
    if (pendingImage) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "chat-image";
        chatbox.appendChild(img);
        chatbox.scrollTop = chatbox.scrollHeight;
      };
      reader.readAsDataURL(pendingImage);
      pendingImage = null;
      document.getElementById('image-input').value = '';
    }
  };

  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") sendMessageButton.click();
  });

  // Upload de imagem
  let pendingImage = null;
  document.getElementById('upload-button').addEventListener('click', () => {
    document.getElementById('image-input').click();
  });

  document.getElementById('image-input').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 10) {
        alert('Imagem muito grande. O limite é 10MB.');
        this.value = '';
      } else {
        pendingImage = file;
      }
    }
  });

  // Botões de minimizar/fechar
  document.getElementById("minimize-chat").onclick = () => {
    chatbotWindow.style.display = "none";
    balloon.style.display = "block";
  };

  startChat();
});
