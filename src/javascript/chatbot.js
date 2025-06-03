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
    // Aqui depois puxar da API  do bando de dados
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
    addMessage("Escolha o estado", "bot");
  
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
    addMessage("Escolha a cidade", "bot");
  
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
    addMessage(`Palestras em ${cidade} - ${estado}:`, "bot");
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
  


  //CALENDÁRIO

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
  
  

//EVENTO POR LOCAL

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


//BOTÕES DE MINIMIZAR/FECHAR O CHATBOT

const closeButton = document.getElementById("minimize-chat");

closeButton.onclick = () => {
  document.getElementById("chatbot-window").style.display = "none";
  document.getElementById("chatbot-balloon").style.display = "block";

};


const minimizeButton = document.getElementById("minimize-chat");
  minimizeButton.onclick = () => {
    document.getElementById("chatbot-window").style.display = "none";
    document.getElementById("chatbot-balloon").style.display = "block";
  };




  //MENSAGENS
  document.addEventListener("DOMContentLoaded", function () {
    const sendMessageButton = document.getElementById("send-message");
    const messageInput = document.getElementById("message-input");
    const chatbox = document.getElementById("chatbox");
  
   
    function addMessage(text, sender) {
      const msg = document.createElement("div");
      msg.className = `msg ${sender}`;
      msg.textContent = text;
      chatbox.appendChild(msg);
      chatbox.scrollTop = chatbox.scrollHeight; 
    }
  

    sendMessageButton.onclick = () => {
      const userMessage = messageInput.value;
      if (userMessage.trim() !== "") {
        addMessage(userMessage, "user"); 
        messageInput.value = ""; 
      }
    };
  

    messageInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        sendMessageButton.click();
      }
    });
  });

  

//IMAGEM
  let pendingImage = null;

document.getElementById('upload-button').addEventListener('click', () => {
  document.getElementById('image-input').click();
});

document.getElementById('image-input').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const maxSizeMB = 10;
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      alert('Imagem muito grande. O limite é 10MB.');
      this.value = '';
    } else {
      pendingImage = file; 
    }
  }
});

document.getElementById('send-message').addEventListener('click', () => {
  const message = document.getElementById('message-input').value.trim();
  const chatbox = document.getElementById('chatbox');

  if (message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user';
    msgDiv.textContent = message;
    chatbox.appendChild(msgDiv);
    document.getElementById('message-input').value = '';
  }

  if (pendingImage) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'chat-image';
      chatbox.appendChild(img);
    };
    reader.readAsDataURL(pendingImage);
    pendingImage = null;
    document.getElementById('image-input').value = ''; 
  }

  chatbox.scrollTop = chatbox.scrollHeight;
});


// Variáveis globais
    let chatOpen = false;
    let minimized = false;
    let eventos = [];
    let estadosBrasileiros = [
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 
      'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 
      'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 
      'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 
      'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 
      'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
    ];

    // Elementos do DOM
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbox = document.getElementById('chatbox');
    const optionsContainer = document.getElementById('options');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message');
    const minimizeBtn = document.getElementById('minimize-chat');
    const closeBtn = document.getElementById('close-chat');
    const uploadButton = document.getElementById('upload-button');
    const imageInput = document.getElementById('image-input');
    const chatbotHeader = document.getElementById('chatbot-header');

    // Event Listeners
    chatbotToggle.addEventListener('click', toggleChat);
    minimizeBtn.addEventListener('click', toggleMinimize);
    closeBtn.addEventListener('click', closeChat);
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    uploadButton.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    chatbotHeader.addEventListener('click', () => {
      if (minimized) {
        toggleMinimize();
      }
    });

    // Inicialização
    document.addEventListener('DOMContentLoaded', () => {
      // Buscar eventos quando o chatbot é carregado
      fetchEventos();
      // Mostrar mensagem inicial
      setTimeout(() => {
        addBotMessage('Oiá! Bem-vindo ao Segue o Festival!');
        showMainOptions();
      }, 500);
    });

    // Funções do Chatbot
    function toggleChat() {
      chatOpen = !chatOpen;
      if (chatOpen) {
        chatbotWindow.style.display = 'flex';
        minimized = false;
        updateWindowState();
        scrollToBottom();
      } else {
        chatbotWindow.style.display = 'none';
      }
    }

    function toggleMinimize() {
      minimized = !minimized;
      updateWindowState();
      if (!minimized) {
        scrollToBottom();
      }
    }

    function updateWindowState() {
      if (minimized) {
        chatbotWindow.classList.add('minimized');
      } else {
        chatbotWindow.classList.remove('minimized');
      }
    }

    function closeChat() {
      chatOpen = false;
      chatbotWindow.style.display = 'none';
    }

    function scrollToBottom() {
      chatbox.scrollTop = chatbox.scrollHeight;
    }

    function addBotMessage(text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot-message';
      messageDiv.innerHTML = `<p>${text}</p>`;
      chatbox.appendChild(messageDiv);
      scrollToBottom();
    }

    function addUserMessage(text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message user-message';
      messageDiv.innerHTML = `<p>${text}</p>`;
      chatbox.appendChild(messageDiv);
      scrollToBottom();
    }

    function sendMessage() {
      const message = messageInput.value.trim();
      if (message) {
        addUserMessage(message);
        messageInput.value = '';
        handleUserMessage(message);
      }
    }

    function handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.maxWidth = '200px';
          img.style.maxHeight = '200px';
          img.style.borderRadius = '8px';
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message user-message';
          messageDiv.appendChild(img);
          chatbox.appendChild(messageDiv);
          scrollToBottom();
          
          addBotMessage('Obrigado pela imagem! Como posso te ajudar com ela?');
        };
        reader.readAsDataURL(file);
      }
    }

    function showMainOptions() {
      optionsContainer.innerHTML = '';
      
      const options = [
        { text: 'Recomendação', action: showRecommendationOptions },
        { text: 'Comprar ingresso', action: showAllEvents },
        { text: 'Falar com atendente', action: redirectToFAQ },
        { text: 'Evento por localidade', action: showStateOptions }
      ];
      
      options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.className = 'chat-option';
        button.addEventListener('click', option.action);
        optionsContainer.appendChild(button);
      });
    }

    function showRecommendationOptions() {
      addUserMessage('Recomendação');
      optionsContainer.innerHTML = '';
      
      const categories = ['Religioso', 'Música', 'Festival', 'Concerto'];
      
      categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.className = 'chat-option';
        button.addEventListener('click', () => filterEventsByType(category));
        optionsContainer.appendChild(button);
      });
      
      const backButton = document.createElement('button');
      backButton.textContent = 'Voltar';
      backButton.className = 'chat-option back-option';
      backButton.addEventListener('click', showMainOptions);
      optionsContainer.appendChild(backButton);
    }

    function showStateOptions() {
      addUserMessage('Evento por localidade');
      optionsContainer.innerHTML = '';
      
      estadosBrasileiros.forEach(state => {
        const button = document.createElement('button');
        button.textContent = state;
        button.className = 'chat-option';
        button.addEventListener('click', () => filterEventsByState(state));
        optionsContainer.appendChild(button);
      });
      
      const backButton = document.createElement('button');
      backButton.textContent = 'Voltar';
      backButton.className = 'chat-option back-option';
      backButton.addEventListener('click', showMainOptions);
      optionsContainer.appendChild(backButton);
    }

    function showAllEvents() {
      addUserMessage('Comprar ingresso');
      displayEvents(eventos);
    }

    function filterEventsByType(type) {
      addUserMessage(type);
      const filteredEvents = eventos.filter(evento => 
        evento.tipo_evento.toLowerCase().includes(type.toLowerCase())
      );
      displayEvents(filteredEvents);
    }

    function filterEventsByState(state) {
      addUserMessage(state);
      const filteredEvents = eventos.filter(evento => 
        evento.estado === state
      );
      displayEvents(filteredEvents);
    }

    function displayEvents(events) {
      optionsContainer.innerHTML = '';
      
      if (events.length === 0) {
        addBotMessage('Nenhum evento encontrado com esses critérios.');
        showMainOptions();
        return;
      }
      
      events.forEach(evento => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        
        const eventName = document.createElement('p');
        eventName.textContent = evento.nome;
        eventName.className = 'event-name';
        
        const eventLink = document.createElement('a');
        eventLink.textContent = 'Ver detalhes';
        eventLink.href = `pagina_evento.html?id=${evento.id_evento}`;
        eventLink.className = 'event-link';
        eventLink.target = '_blank';
        
        eventDiv.appendChild(eventName);
        eventDiv.appendChild(eventLink);
        optionsContainer.appendChild(eventDiv);
      });
      
      const backButton = document.createElement('button');
      backButton.textContent = 'Voltar';
      backButton.className = 'chat-option back-option';
      backButton.addEventListener('click', showMainOptions);
      optionsContainer.appendChild(backButton);
    }

    function redirectToFAQ() {
      addUserMessage('Falar com atendente');
      addBotMessage('Redirecionando você para nossa página de FAQ...');
      setTimeout(() => {
        window.open('faq.html', '_blank');
        showMainOptions();
      }, 1500);
    }

    function handleUserMessage(message) {
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('ola')) {
        setTimeout(() => {
          addBotMessage('Oiá! Como posso te ajudar hoje?');
          showMainOptions();
        }, 1000);
      } else if (lowerMsg.includes('obrigado') || lowerMsg.includes('obrigada')) {
        setTimeout(() => {
          addBotMessage('De nada! Estou aqui para ajudar. Precisa de mais alguma coisa?');
          showMainOptions();
        }, 1000);
      } else {
        setTimeout(() => {
          addBotMessage('Desculpe, não entendi. Poderia escolher uma das opções abaixo?');
          showMainOptions();
        }, 1000);
      }
    }

    async function fetchEventos() {
      try {
        // Simulando uma chamada à API - substitua pelo seu endpoint real
        const response = await fetch('/api/buscaeventos');
        if (!response.ok) throw new Error('Erro ao buscar eventos');
        
        eventos = await response.json();
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        // Caso a API não esteja disponível, use dados mockados para demonstração
        eventos = [
          {
            id_evento: 1,
            nome: 'Festival de Música Gospel',
            tipo_evento: 'Religioso',
            estado: 'São Paulo',
            data: '2023-12-25',
            imagem: ''
          },
          {
            id_evento: 2,
            nome: 'Rock in Rio',
            tipo_evento: 'Festival',
            estado: 'Rio de Janeiro',
            data: '2023-09-02',
            imagem: ''
          },
          {
            id_evento: 3,
            nome: 'Show de Sertanejo',
            tipo_evento: 'Música',
            estado: 'Minas Gerais',
            data: '2023-11-15',
            imagem: ''
          },
          {
            id_evento: 4,
            nome: 'Concerto Clássico',
            tipo_evento: 'Concerto',
            estado: 'Santa Catarina',
            data: '2023-10-10',
            imagem: ''
          }
        ];
      }
    }


 
