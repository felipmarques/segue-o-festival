document.addEventListener("DOMContentLoaded", function () {
  // Elementos DOM
  const elements = {
    toggleButton: document.getElementById("chatbot-toggle"),
    chatbotWindow: document.getElementById("chatbot-window"),
    chatbox: document.getElementById("chatbox"),
    options: document.getElementById("options"),
    balloon: document.getElementById("chatbot-balloon"),
    messageInput: document.getElementById("message-input"),
    sendMessageBtn: document.getElementById("send-message"),
    minimizeBtn: document.getElementById("minimize-chat"),
    closeBtn: document.getElementById("close-chat"),
    uploadButton: document.getElementById("upload-button"),
    imageInput: document.getElementById("image-input")
  };

  // Estado do chat
  let chatState = {
    isOpen: false,
    isMinimized: false,
    pendingImage: null
  };

  // Inicialização
  function init() {
    setupEventListeners();
    startChat();
  }

  // Configura listeners
  function setupEventListeners() {
    // Toggle chat
    elements.toggleButton.addEventListener("click", toggleChat);
    
    // Minimizar/fechar
    elements.minimizeBtn.addEventListener("click", () => {
      elements.chatbotWindow.style.display = "none";
      elements.balloon.style.display = "block";
    });
    
    // Enviar mensagem
    elements.sendMessageBtn.addEventListener("click", sendUserMessage);
    elements.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendUserMessage();
    });
    
    // Upload de imagem
    elements.uploadButton.addEventListener("click", () => elements.imageInput.click());
    elements.imageInput.addEventListener("change", handleImageUpload);
  }

  // Controle do chat
  function toggleChat() {
    chatState.isOpen = !chatState.isOpen;
    elements.chatbotWindow.style.display = chatState.isOpen ? "flex" : "none";
    elements.balloon.style.display = chatState.isOpen ? "none" : "block";
    if (chatState.isOpen) scrollToBottom();
  }

  // Funções de mensagens
  function addMessage(text, sender = "bot") {
    const msg = document.createElement("div");
    msg.className = `msg ${sender}`;
    msg.textContent = text;
    elements.chatbox.appendChild(msg);
    scrollToBottom();
  }

  function sendUserMessage() {
    const message = elements.messageInput.value.trim();
    if (message) {
      addMessage(message, "user");
      elements.messageInput.value = "";
      // Aqui você pode adicionar lógica para responder à mensagem do usuário
    }
    
    if (chatState.pendingImage) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "chat-image";
        elements.chatbox.appendChild(img);
        scrollToBottom();
      };
      reader.readAsDataURL(chatState.pendingImage);
      chatState.pendingImage = null;
      elements.imageInput.value = "";
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const maxSizeMB = 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        addMessage("Imagem muito grande. O limite é 10MB.", "bot");
        return;
      }
      chatState.pendingImage = file;
    }
  }

  // Funções de opções
  function setOptions(buttons) {
    // Limpa opções anteriores
    elements.options.innerHTML = "";
    
    buttons.forEach(btn => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.className = "chat-option";
      button.addEventListener("click", () => {
        addMessage(btn.text, "user");
        btn.action();
      });
      elements.options.appendChild(button);
    });
  }

  // Fluxo da conversa
  function startChat() {
    elements.chatbox.innerHTML = "";
    addMessage("Olá! Bem-vindo ao Segue o Festival!", "bot");
    
    setOptions([
      { text: "Recomendação", action: showRecommendations },
      { text: "Falar com atendente", action: () => addMessage("Direcionando ao atendente...", "bot") },
      { text: "Comprar ingresso", action: showCalendar },
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

  // Funções específicas para cada tipo de evento
  function handleFestival() {
    addMessage("Qual estilo de festival você prefere?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showEventOptions("Festival", "Eletrônica") },
      { text: "Sertanejo", action: () => showEventOptions("Festival", "Sertanejo") },
      { text: "Rock", action: () => showEventOptions("Festival", "Rock") },
      { text: "Rap", action: () => showEventOptions("Festival", "Rap") },
      { text: "Funk", action: () => showEventOptions("Festival", "Funk") }
    ]);
  }

  function handleShow() {
    addMessage("Qual estilo de show você procura?", "bot");
    setOptions([
      { text: "Eletrônica", action: () => showEventOptions("Show", "Eletrônica") },
      { text: "Sertanejo", action: () => showEventOptions("Show", "Sertanejo") },
      { text: "Rock", action: () => showEventOptions("Show", "Rock") },
      { text: "Rap", action: () => showEventOptions("Show", "Rap") },
      { text: "Funk", action: () => showEventOptions("Show", "Funk") }
    ]);
  }

  function showEventOptions(eventType, style) {
    addMessage(`${eventType}s de ${style} disponíveis:`, "bot");
    // Aqui você implementaria a busca dos eventos no seu banco de dados
    // Por enquanto apenas mostra opções genéricas
    setOptions([
      { text: "Evento 1", action: () => addMessage("Redirecionando para o evento...", "bot") },
      { text: "Evento 2", action: () => addMessage("Redirecionando para o evento...", "bot") }
    ]);
  }

  // Funções para palestras
  function handlePalestra() {
    addMessage("Escolha o estado", "bot");
    
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then(res => res.json())
      .then(estados => {
        estados.sort((a, b) => a.nome.localeCompare(b.nome));
        
        const options = estados.map(estado => ({
          text: estado.nome,
          action: () => selectCidade(estado.id, estado.nome)
        }));
        
        setOptions(options);
      });
  }

  function selectCidade(estadoId, estadoNome) {
    addMessage(`Escolha a cidade em ${estadoNome}:`, "bot");
    
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`)
      .then(res => res.json())
      .then(cidades => {
        const options = cidades.map(cidade => ({
          text: cidade.nome,
          action: () => showPalestrasCidade(cidade.nome, estadoNome)
        }));
        
        setOptions(options);
      });
  }

  function showPalestrasCidade(cidade, estado) {
    addMessage(`Palestras em ${cidade} - ${estado}:`, "bot");
    // Implemente a busca real das palestras aqui
    setOptions([
      { text: "Palestra 1", action: () => addMessage("Redirecionando...", "bot") },
      { text: "Palestra 2", action: () => addMessage("Redirecionando...", "bot") }
    ]);
  }

  // Funções para eventos culturais
  function handleCultural() {
    addMessage("Escolha uma festa ou tradição cultural:", "bot");
    setOptions([
      { text: "Ano Novo", action: () => showCulturalOptions("Ano Novo") },
      { text: "Carnaval", action: () => showCulturalOptions("Carnaval") },
      { text: "Festa Junina", action: () => showCulturalOptions("Festa Junina") },
      { text: "Natal", action: () => showCulturalOptions("Natal") }
    ]);
  }

  function showCulturalOptions(eventName) {
    addMessage(`🎊 Eventos culturais de ${eventName}:`, "bot");
    setOptions([
      { text: "Evento A", action: () => addMessage("Redirecionando...", "bot") },
      { text: "Evento B", action: () => addMessage("Redirecionando...", "bot") }
    ]);
  }

  // Função para calendário
  function showCalendar() {
    addMessage("Escolha uma data:", "bot");
    
    const dateContainer = document.createElement("div");
    dateContainer.className = "calendar-container";
    
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.style.opacity = "0";
    hiddenInput.style.height = "0";
    hiddenInput.style.position = "absolute";
    
    dateContainer.appendChild(hiddenInput);
    elements.chatbox.appendChild(dateContainer);
    scrollToBottom();
    
    flatpickr(hiddenInput, {
      inline: true,
      minDate: "2025-08-01",
      maxDate: "2025-08-31",
      dateFormat: "d/m",
      onChange: function(selectedDates, dateStr) {
        if (dateStr) {
          addMessage(`Eventos disponíveis em ${dateStr}:`, "bot");
          dateContainer.remove();
          setOptions([
            { text: "Festival de Música", action: () => addMessage("Redirecionando...", "bot") },
            { text: "Feira Literária", action: () => addMessage("Redirecionando...", "bot") }
          ]);
        }
      }
    });
  }

  // Funções para busca por localidade
  function searchByLocation() {
    addMessage("Selecione o estado:", "bot");
    
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then(res => res.json())
      .then(estados => {
        estados.sort((a, b) => a.nome.localeCompare(b.nome));
        
        const options = estados.map(estado => ({
          text: estado.sigla,
          action: () => selectMunicipio(estado.id, estado.nome)
        }));
        
        setOptions(options);
      });
  }

  function selectMunicipio(ufId, ufNome) {
    addMessage(`Municípios em ${ufNome}:`, "bot");
    
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`)
      .then(res => res.json())
      .then(municipios => {
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
      });
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
      { text: "Evento A", action: () => addMessage("Redirecionando...", "bot") },
      { text: "Evento B", action: () => addMessage("Redirecionando...", "bot") }
    ]);
  }

  // Utilitários
  function scrollToBottom() {
    elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
  }

  // Inicia o chat
  init();
});


 
