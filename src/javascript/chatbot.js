document.addEventListener("DOMContentLoaded", function () {
  // Elementos DOM
  const elements = {
    toggleButton: document.getElementById("chatbot-toggle"),
    chatbotWindow: document.getElementById("chatbot-window"),
    chatbox: document.getElementById("chatbox"),
    options: document.getElementById("options"),
    balloon: document.getElementById("chatbot-balloon"),
    closeButton: document.getElementById("minimize-chat"),
    sendMessageButton: document.getElementById("send-message"),
    messageInput: document.getElementById("message-input"),
    uploadButton: document.getElementById("upload-button"),
    imageInput: document.getElementById("image-input")
  };

  // Estado do chat
  let chatState = {
    pendingImage: null,
    chatOpen: false,
    minimized: false
  };

  // Funções básicas do chat
  const chatFunctions = {
    toggleChat: () => {
      const isVisible = elements.chatbotWindow.style.display === "flex";
      elements.chatbotWindow.style.display = isVisible ? "none" : "flex";
      elements.balloon.style.display = isVisible ? "block" : "none";
      chatState.chatOpen = !isVisible;
    },
    
    addMessage: (text, sender) => {
      const msg = document.createElement("div");
      msg.className = `msg ${sender}`;
      msg.textContent = text;
      elements.chatbox.appendChild(msg);
      elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
    },
    
    setOptions: (buttons) => {
      const optionsContainer = document.createElement("div");
      optionsContainer.className = "option-buttons";
    
      buttons.forEach(btn => {
        const button = document.createElement("button");
        button.textContent = btn.text;
        button.onclick = () => {
          chatFunctions.addMessage(btn.text, "user"); 
          btn.action(); 
          optionsContainer.remove(); 
        };
        optionsContainer.appendChild(button);
      });
    
      elements.chatbox.appendChild(optionsContainer);
      elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
    },
    
    handleImageUpload: () => {
      const file = elements.imageInput.files[0];
      if (file) {
        const maxSizeMB = 10;
        const sizeMB = file.size / (1024 * 1024);
        
        if (sizeMB > maxSizeMB) {
          alert('Imagem muito grande. O limite é 10MB.');
          elements.imageInput.value = '';
        } else {
          chatState.pendingImage = file;
        }
      }
    },
    
    sendMessage: () => {
      const message = elements.messageInput.value.trim();
      if (message) {
        chatFunctions.addMessage(message, "user");
        elements.messageInput.value = '';
      }
      
      if (chatState.pendingImage) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'chat-image';
          elements.chatbox.appendChild(img);
        };
        reader.readAsDataURL(chatState.pendingImage);
        chatState.pendingImage = null;
        elements.imageInput.value = '';
      }
      
      elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
    }
  };

  // Fluxos de conversa
  const conversationFlows = {
    startChat: () => {
      elements.chatbox.innerHTML = "";
      chatFunctions.addMessage("Olá! Bem-vindo ao Segue o Festival!", "bot");
      chatFunctions.setOptions([
        { text: "Recomendação", action: conversationFlows.showRecommendations },
        { text: "Falar com atendente", action: () => chatFunctions.addMessage("Direcionando ao atendente...", "bot") },
        { text: "Comprar ingresso", action: conversationFlows.buyTicket },
        { text: "Evento por localidade", action: conversationFlows.searchByLocation }
      ]);
    },
    
    showRecommendations: () => {
      chatFunctions.addMessage("O que você está buscando hoje?", "bot");
      chatFunctions.setOptions([
        { text: "Festival", action: conversationFlows.handleFestival },
        { text: "Show", action: conversationFlows.handleShow },
        { text: "Palestra", action: conversationFlows.handlePalestra },
        { text: "Cultural", action: conversationFlows.handleCultural }
      ]);
    },
    
    handleFestival: () => {
      chatFunctions.addMessage("Qual estilo de festival você prefere?", "bot");
      chatFunctions.setOptions([
        { text: "Eletrônica", action: () => conversationFlows.showOptions("Festival", "Eletrônica") },
        { text: "Sertanejo", action: () => conversationFlows.showOptions("Festival", "Pop") },
        { text: "Rock", action: () => conversationFlows.showOptions("Festival", "Rock") },
        { text: "Rap", action: () => conversationFlows.showOptions("Festival", "Rap") },
        { text: "Funk", action: () => conversationFlows.showOptions("Festival", "Funk") }
      ]);
    },
    
    handleShow: () => {
      chatFunctions.addMessage("Qual estilo de show você procura?", "bot");
      chatFunctions.setOptions([
        { text: "Eletrônica", action: () => conversationFlows.showOptions("Show", "Eletrônica") },
        { text: "Sertanejo", action: () => conversationFlows.showOptions("Show", "Pop") },
        { text: "Rock", action: () => conversationFlows.showOptions("Show", "Rock") },
        { text: "Rap", action: () => conversationFlows.showOptions("Show", "Rap") },
        { text: "Funk", action: () => conversationFlows.showOptions("Show", "Funk") }
      ]);
    },
    
    showOptions: (type, style) => {
      chatFunctions.addMessage(`${type}s de ${style} disponíveis:`, "bot");
      // Aqui você pode adicionar a lógica para buscar os eventos específicos
    },
    
    handlePalestra: () => {
      chatFunctions.addMessage("Escolha o estado", "bot");
    
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
            conversationFlows.selectCidadeDropdown(estadoId, estadoNome);
            selectContainer.remove();
          };
    
          selectContainer.appendChild(select);
          elements.chatbox.appendChild(selectContainer);
          elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
        });
    },
    
    selectCidadeDropdown: (estadoId, estadoNome) => {
      chatFunctions.addMessage("Escolha a cidade", "bot");
    
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
            chatFunctions.addMessage(`Palestras em ${cidade} - ${estadoNome}:`, "bot");
          };
    
          selectContainer.appendChild(select);
          elements.chatbox.appendChild(selectContainer);
          elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
        });
    },
    
    handleCultural: () => {
      chatFunctions.addMessage("Escolha uma festa ou tradição cultural:", "bot");
      chatFunctions.setOptions([
        { text: "Ano Novo", action: () => conversationFlows.showOptions("Cultural", "Ano Novo") },
        { text: "Carnaval", action: () => conversationFlows.showOptions("Cultural", "Carnaval") },
        { text: "Festa Junina", action: () => conversationFlows.showOptions("Cultural", "Festa Junina") },
        { text: "Natal", action: () => conversationFlows.showOptions("Cultural", "Natal") },
      ]);
    },
    
    buyTicket: () => {
      chatFunctions.addMessage("Escolha uma data:", "bot");
    
      const dateContainer = document.createElement("div");
      dateContainer.className = "calendar-container";
    
      const hiddenInput = document.createElement("input");
      hiddenInput.type = "text";
      hiddenInput.style.opacity = "0";
      hiddenInput.style.height = "0";
      hiddenInput.style.position = "absolute";
      hiddenInput.style.pointerEvents = "none";
    
      dateContainer.appendChild(hiddenInput);
      elements.chatbox.appendChild(dateContainer);
      elements.chatbox.scrollTop = elements.chatbox.scrollHeight;
    
      flatpickr(hiddenInput, {
        inline: true,
        minDate: "2025-08-01",
        maxDate: "2025-08-31",
        dateFormat: "d/m",
        onChange: function (selectedDates, dateStr) {
          if (dateStr) {
            chatFunctions.addMessage(`Eventos disponíveis em ${dateStr}:`, "bot");
            conversationFlows.selectEvent(dateStr);
            dateContainer.remove();
          }
        }
      });
    },
    
    selectEvent: (date) => {
      chatFunctions.setOptions([
        { text: "Festival de Música", action: () => chatFunctions.addMessage("Redirecionando para a página do evento!", "bot") },
        { text: "Feira Literária", action: () => chatFunctions.addMessage("Redirecionando para a página do evento!", "bot") }
      ]);
    },
    
    searchByLocation: async () => {
      chatFunctions.addMessage("Selecione o estado:", "bot");
    
      const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
      const estados = await response.json();
      estados.sort((a, b) => a.nome.localeCompare(b.nome));
    
      const options = estados.map(estado => ({
        text: estado.sigla,
        action: () => conversationFlows.selectMunicipio(estado.id, estado.nome)
      }));
    
      chatFunctions.setOptions(options);
    },
    
    selectMunicipio: async (ufId, ufNome) => {
      chatFunctions.addMessage(`Municípios em ${ufNome}:`, "bot");
    
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`);
      const municipios = await response.json();
      municipios.sort((a, b) => a.nome.localeCompare(b.nome));
    
      const options = municipios.slice(0, 10).map(m => ({
        text: m.nome,
        action: () => chatFunctions.addMessage(`Eventos em ${m.nome}:`, "bot")
      }));
    
      options.push({
        text: "🔍 Ver todos",
        action: () => {
          const allOptions = municipios.map(m => ({
            text: m.nome,
            action: () => chatFunctions.addMessage(`Eventos em ${m.nome}:`, "bot")
          }));
          chatFunctions.setOptions(allOptions);
        }
      });
    
      chatFunctions.setOptions(options);
    }
  };

  // Event listeners
  elements.toggleButton.onclick = chatFunctions.toggleChat;
  elements.closeButton.onclick = chatFunctions.toggleChat;
  elements.sendMessageButton.onclick = chatFunctions.sendMessage;
  elements.messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      chatFunctions.sendMessage();
    }
  });
  elements.uploadButton.onclick = () => elements.imageInput.click();
  elements.imageInput.addEventListener("change", chatFunctions.handleImageUpload);

  // Iniciar chat
  conversationFlows.startChat();
});


 
