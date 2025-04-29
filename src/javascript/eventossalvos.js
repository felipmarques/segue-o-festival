document.getElementById('open_btn').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open-sidebar');
});


  function toggleLista(id) {
    const lista = document.getElementById(id);
    lista.style.display = (lista.style.display === "block") ? "none" : "block";
  }


  
