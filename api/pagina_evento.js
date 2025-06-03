const { Pool } = require('pg');

// Conexão com o banco de dados Neon usando a string de conexão do ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.method);

  if (req.method === 'GET') {
    const { id_evento } = req.query;

    if (!id_evento) {
      return res.status(400).json({ erro: 'Parâmetro id_evento é obrigatório' });
    }

    try {
      const query = `
        SELECT 
          nome,
          descricao,
          cep,
          endereco,
          link_ingresso,
          line_up,
          estado,
          tipo_evento,
          encode(imagem, 'base64') AS imagem,
          TO_CHAR(data, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data
        FROM eventos
        WHERE id_evento = $1
      `;

      console.log('Executando query com id_evento:', id_evento);
      const result = await pool.query(query, [id_evento]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Evento não encontrado' });
      }

      const evento = result.rows[0];

      res.status(200).json(evento);
    } catch (err) {
      console.error('Erro ao buscar evento:', err);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};




    const params = new URLSearchParams(window.location.search);
    const id_evento = params.get("id");
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const btnSalvarEvento = document.getElementById('btn-salvar-evento');
    const btnTexto = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    let coordenadasEvento = {};
    let eventoSalvo = false;

    // Funções para salvar evento - VERSÃO CORRIGIDA
    async function verificarEventoSalvo() {
      if (!usuarioLogado?.cpf) return false;
      
      try {
        const response = await fetch(`/api/eventos-salvos-usuario?cpf=${usuarioLogado.cpf}`);
        
        if (!response.ok) throw new Error('Erro ao verificar evento salvo');
        
        const eventosSalvos = await response.json();
        return eventosSalvos.some(evento => evento.id_evento == id_evento);
      } catch (error) {
        console.error('Erro ao verificar evento salvo:', error);
        mostrarToast('Erro ao verificar evento salvo', 'error');
        return false;
      }
    }

    async function alternarSalvarEvento() {
      if (!usuarioLogado?.cpf) {
        mostrarToast('Você precisa estar logado para salvar eventos', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
      }
      
      // Mostrar estado de carregamento
      btnSalvarEvento.disabled = true;
      spinner.style.display = 'inline-block';
      btnTexto.textContent = eventoSalvo ? 'Removendo...' : 'Salvando...';
      
      try {
        let response;
        let url = '/api/eventos-salvos-usuario';
        
        if (eventoSalvo) {
          // REMOVER evento salvo
          response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usuario_cpf: usuarioLogado.cpf,
              evento_id: id_evento
            })
          });
        } else {
          // SALVAR novo evento
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usuario_cpf: usuarioLogado.cpf,
              evento_id: id_evento
            })
          });
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro na operação');
        }
        
        // Atualizar estado local
        eventoSalvo = !eventoSalvo;
        atualizarBotaoSalvar();
        
        // Feedback visual
        mostrarToast(
          eventoSalvo ? 'Evento salvo com sucesso!' : 'Evento removido dos salvos',
          eventoSalvo ? 'success' : 'error'
        );
        
      } catch (error) {
        console.error('Erro ao alternar evento salvo:', error);
        mostrarToast(error.message || 'Erro na operação', 'error');
      } finally {
        // Restaurar estado do botão
        btnSalvarEvento.disabled = false;
        spinner.style.display = 'none';
        atualizarBotaoSalvar();
      }
    }

    function atualizarBotaoSalvar() {
      if (eventoSalvo) {
        btnTexto.textContent = '✔ Evento Salvo';
        btnSalvarEvento.classList.add('salvo');
      } else {
        btnTexto.textContent = 'Salvar Evento';
        btnSalvarEvento.classList.remove('salvo');
      }
    }

    function mostrarToast(mensagem, tipo) {
      const toast = document.createElement('div');
      toast.className = `toast ${tipo}`;
      toast.textContent = mensagem;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
      }, 3000);
    }

    // Carregar informações do evento
    async function carregarPaginaEvento() {
      // Verificar login e estado do evento
      if (!usuarioLogado?.cpf) {
        btnTexto.textContent = 'Login para Salvar';
        btnSalvarEvento.onclick = () => window.location.href = 'login.html';
      } else {
        try {
          eventoSalvo = await verificarEventoSalvo();
          atualizarBotaoSalvar();
          btnSalvarEvento.onclick = alternarSalvarEvento;
        } catch (error) {
          console.error('Erro ao verificar evento salvo:', error);
          mostrarToast('Erro ao verificar eventos salvos', 'error');
        }
      }
      
      // Carregar dados do evento
      try {
        const response = await fetch(`/api/pagina_evento?id_evento=${id_evento}`);
        if (!response.ok) throw new Error('Erro ao carregar evento');
        
        const evento = await response.json();
        
        document.getElementById('imagem').src = `data:image/jpeg;base64,${evento.imagem}`;
        document.getElementById('titulo').textContent = evento.nome;
        document.getElementById('lineup').textContent = evento.line_up;
        document.getElementById('data').textContent = new Date(evento.data).toLocaleString('pt-BR');
        document.getElementById('endereco').textContent = evento.endereco;
        document.getElementById('descricao').textContent = evento.descricao;
        document.getElementById('link_ingresso').href = evento.link_ingresso;

        // Obter coordenadas do evento
        const locationsResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(evento.endereco)}, Brasil`);
        const locations = await locationsResponse.json();
        
        if (locations.length > 0) {
          coordenadasEvento.lat = parseFloat(locations[0].lat);
          coordenadasEvento.lon = parseFloat(locations[0].lon);

          // Inicializar mapa
          const map = L.map('map').setView([coordenadasEvento.lat, coordenadasEvento.lon], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          L.marker([coordenadasEvento.lat, coordenadasEvento.lon]).addTo(map)
            .bindPopup(evento.nome)
            .openPopup();

          // Links dinâmicos
          document.getElementById("link_uber").href = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${coordenadasEvento.lat}&dropoff[longitude]=${coordenadasEvento.lon}`;
          document.getElementById("link_99").href = `https://99app.com/`;
          document.getElementById("link_airbnb").href = `https://www.airbnb.com.br/s/homes?lat=${coordenadasEvento.lat}&lng=${coordenadasEvento.lon}`;
        }
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
        document.getElementById('titulo').textContent = "Evento não encontrado";
        mostrarToast('Erro ao carregar detalhes do evento', 'error');
      }
    }

    // Função para calcular distância
    async function calcularDistancia() {
      const endereco = document.getElementById("endereco_usuario").value;
      if (!endereco) {
        mostrarToast('Por favor, informe seu endereço', 'warning');
        return;
      }

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}, Brasil`);
        const result = await response.json();
        
        if (result.length === 0) {
          mostrarToast('Endereço não encontrado', 'error');
          return;
        }

        const latUsuario = parseFloat(result[0].lat);
        const lonUsuario = parseFloat(result[0].lon);

        const distancia = calcularDistanciaEmKm(
          latUsuario, lonUsuario,
          coordenadasEvento.lat, coordenadasEvento.lon
        );

        document.getElementById("resultado_distancia").textContent = 
          `Você está a aproximadamente ${distancia.toFixed(2)} km do evento.`;
      } catch (err) {
        console.error(err);
        mostrarToast('Erro ao calcular distância', 'error');
      }
    }

    function calcularDistanciaEmKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Event listeners
    document.getElementById("calcular_distancia").addEventListener("click", calcularDistancia);
    document.getElementById('btn-voltar').addEventListener('click', () => {
      if (document.referrer) {
        history.back();
      } else {
        window.location.href = 'index.html';
      }
    });

    // Iniciar
    carregarPaginaEvento();
