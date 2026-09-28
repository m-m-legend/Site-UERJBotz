// Inicialização

document.addEventListener("DOMContentLoaded", async () => {
  inicializarMenuMobile();
  inicializarHeader();
  atualizarAno();
  inicializarReveal(); // O conteúdo estático independe dos JSONs

  const secoes = [
    ["membros", "members-container", renderizarMembros],
    ["projetos", "projects-container", renderizarProjetos],
    ["conquistas", "achievements-container", renderizarConquistas],
    ["parceiros", "partners-container", renderizarParceiros]
  ];
  secoes.forEach(([, id]) => mostrarMensagem(id, "Carregando…"));
  const dados = await carregarDados();
  secoes.forEach(([chave, id, renderizar]) => {
    try {
      if (dados[chave] === null) throw new Error("Dados indisponíveis");
      renderizar(dados[chave]);
      if (chave === "membros") inicializarTabs();
    } catch {
      mostrarMensagem(id, "Informações temporariamente indisponíveis.");
    }
  });
  renderizarEstatisticas(dados);
});

// Todos estes arquivos são públicos: não inclua cadastros internos
async function carregarDados() {
  const chaves = ["equipe", "membros", "projetos", "conquistas", "parceiros"];
  const resultados = await Promise.allSettled(chaves.map(async chave => {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 10000);
    try {
      const resposta = await fetch(`data/${chave}.json`, { signal: controle.signal });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const dados = await resposta.json();
      validarDados(chave, dados);
      return dados;
    } finally { clearTimeout(timer); }
  }));
  return Object.fromEntries(chaves.map((chave, i) => [
    chave, resultados[i].status === "fulfilled" ? resultados[i].value : null
  ]));
}

function validarDados(chave, dados) {
  const objeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);
  const lista = valor => Array.isArray(valor) && valor.every(objeto);
  let valido;
  if (chave === "equipe") valido = objeto(dados) && ["string", "number"].includes(typeof dados.fundacao);
  else if (chave === "membros") {
    valido = objeto(dados) && lista(dados.areas) && lista(dados.membros)
      && dados.areas.every(a => typeof a.id === "string" && typeof a.nome === "string")
      && new Set(dados.areas.map(a => a.id)).size === dados.areas.length
      && dados.membros.every(m => typeof m.nome === "string" && typeof m.area === "string" && typeof m.ativo === "boolean");
  } else {
    valido = lista(dados);
    if (valido && chave === "projetos") valido = dados.every(p => typeof p.nome === "string" && Array.isArray(p.tags));
    if (valido && chave === "parceiros") valido = dados.every(p => typeof p.nome === "string" && typeof p.ativo === "boolean");
  }
  if (!valido) throw new Error(`Formato inválido: ${chave}`);
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// Aceita caminhos relativos e URLs HTTPS, mas não aceita javascript:, data: ou file:
function urlImagem(valor) {
  if (typeof valor !== "string" || !valor.trim()) return "";
  try {
    const url = new URL(valor, document.baseURI);
    if (url.username || url.password) return "";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === location.origin)) return "";
    return escaparHTML(url.href);
  } catch { return ""; }
}

function mostrarMensagem(id, texto) {
  const container = document.getElementById(id);
  if (!container) return;
  const mensagem = document.createElement("p");
  mensagem.className = "data-message";
  mensagem.setAttribute("role", "status");
  mensagem.textContent = texto;
  container.replaceChildren(mensagem);
}

// Estatísticas

function renderizarEstatisticas(dados) {

  const container = document.getElementById("team-stats");

  if (!container) return;

  const membrosAtivos = dados.membros?.membros.filter(membro => membro.ativo).length ?? "—";

  const numeroAreas = dados.membros?.areas.length ?? "—";

  const numeroConquistas = dados.conquistas?.length ?? "—";

  container.innerHTML = `
    <div class="stat">
      <div class="num">
        ${escaparHTML(dados.equipe?.fundacao ?? "—")}
      </div>
      <div class="label">
        Fundação
      </div>
    </div>

    <div class="stat">
      <div class="num">
        ${membrosAtivos}
      </div>
      <div class="label">
        Membros ativos
      </div>
    </div>

    <div class="stat">
      <div class="num">
        ${numeroAreas}
      </div>
      <div class="label">
        Áreas técnicas
      </div>
    </div>

    <div class="stat">
      <div class="num">
        ${numeroConquistas}
      </div>
      <div class="label">
        Conquistas registradas
      </div>
    </div>
  `;
}


// Membros

function renderizarMembros(dadosMembros) {

  const tabsContainer = document.getElementById("area-tabs");
  const membersContainer = document.getElementById("members-container");

  if (!tabsContainer || !membersContainer) return;

  const areas = dadosMembros.areas;
  const membros = dadosMembros.membros;

  window.uerjbotzAreas = areas;
  if (!areas.length) {
    tabsContainer.replaceChildren();
    mostrarMensagem("members-container", "Membros em atualização.");
    return;
  }

  // Tabs

  tabsContainer.innerHTML = areas.map((area, index) => `
    <button
      class="tab-btn ${index === 0 ? "active" : ""}"
      data-area="${escaparHTML(area.id)}"
      id="area-tab-${index}"
      aria-controls="area-panel-${index}"
      tabindex="${index === 0 ? 0 : -1}"
      role="tab"
      aria-selected="${index === 0}"
      type="button"
    >
      <span class="code">${escaparHTML(area.codigo)}</span>
      ${escaparHTML(area.nome)}
    </button>
  `).join("");


  // Painéis

  membersContainer.innerHTML = areas.map((area, index) => {

    const membrosDaArea = membros.filter(
      membro => membro.area === area.id && membro.ativo
    );

    return `
      <div
        class="area-panel ${index === 0 ? "active" : ""}"
        id="area-panel-${index}"
        role="tabpanel"
        aria-labelledby="area-tab-${index}"
        tabindex="0"
        ${index === 0 ? "" : "hidden"}
        data-area="${escaparHTML(area.id)}"
      >

        <div class="area-panel-head">

          <h3>${escaparHTML(area.nome)}</h3>

          <span class="meta">
            ${escaparHTML(area.descricao)} ·
            <span class="count">
              ${membrosDaArea.length} membros
            </span>
          </span>

        </div>

        <div class="members-grid">

          ${membrosDaArea.map(renderizarCardMembro).join("")}

        </div>

      </div>
    `;
  }).join("");
}


function renderizarCardMembro(membro) {

  const iniciais = gerarIniciais(membro.nome);

  const foto = urlImagem(membro.foto)
    ? `
      <img
        src="${urlImagem(membro.foto)}"
        alt="Foto de ${escaparHTML(membro.nome)}"
        loading="lazy"
      >
    `
    : `
      <span class="initials">
        ${escaparHTML(iniciais)}
      </span>
    `;

  const badge = membro.subarea
    ? `
      <span class="badge">
        ${escaparHTML(obterNomeArea(membro.subarea))}
      </span>
    `
    : "";

  return `
    <article class="member-card">

      <div class="member-photo">

        ${badge}

        ${foto}

      </div>

      <div class="member-info">

        <div class="name">
          ${escaparHTML(membro.nome)}
        </div>

        <div class="role ${membro.lideranca ? "lead" : ""}">
          ${escaparHTML(membro.cargo)}
        </div>

      </div>

    </article>
  `;
}


function gerarIniciais(nome) {

  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte.charAt(0))
    .join("")
    .toUpperCase();
}


function obterNomeArea(id) {

  const areas = window.uerjbotzAreas || [];

  const area = areas.find(area => area.id === id);

  return area ? area.nome : "";
}


// Inicializar tabs

function inicializarTabs() {
  const botoes = [...document.querySelectorAll(".tab-btn")];
  const paineis = [...document.querySelectorAll(".area-panel")];
  const ativar = (botao, foco = false) => {
    botoes.forEach((atual, i) => {
      const ativo = atual === botao;
      atual.classList.toggle("active", ativo);
      atual.setAttribute("aria-selected", String(ativo));
      atual.tabIndex = ativo ? 0 : -1;
      paineis[i].classList.toggle("active", ativo);
      paineis[i].hidden = !ativo;
    });
    if (foco) botao.focus();
  };
  botoes.forEach((botao, i) => {
    botao.addEventListener("click", () => ativar(botao));
    botao.addEventListener("keydown", evento => {
      let proximo;
      if (evento.key === "ArrowRight") proximo = (i + 1) % botoes.length;
      if (evento.key === "ArrowLeft") proximo = (i - 1 + botoes.length) % botoes.length;
      if (evento.key === "Home") proximo = 0;
      if (evento.key === "End") proximo = botoes.length - 1;
      if (proximo !== undefined) { evento.preventDefault(); ativar(botoes[proximo], true); }
    });
  });
}

// Projetos

function renderizarProjetos(projetos) {

  const container = document.getElementById("projects-container");

  if (!container) return;

  if (!projetos.length) return mostrarMensagem("projects-container", "Projetos em atualização.");

  container.innerHTML = projetos.map(projeto => {

    const imagem = urlImagem(projeto.imagem)
      ? `
        <img
          src="${urlImagem(projeto.imagem)}"
          alt="${escaparHTML(projeto.nome)}"
          loading="lazy"
        >
      `
      : "";

    return `
      <article class="project-card">

        <div
          class="project-thumb"
          ${!urlImagem(projeto.imagem) ? 'data-placeholder="// FOTO DO ROBÔ"' : ""}
        >

          ${imagem}

          <span class="corner">
            ${escaparHTML(projeto.codigo)}
          </span>

        </div>

        <div class="project-body">

          <span class="cat">
            ${escaparHTML(projeto.categoria)}
          </span>

          <h4>
            ${escaparHTML(projeto.nome)}
          </h4>

          <p>
            ${escaparHTML(projeto.descricao)}
          </p>

          <div class="tags">

            ${projeto.tags.map(tag => `
              <span class="tag">
                ${escaparHTML(tag)}
              </span>
            `).join("")}

          </div>

        </div>

      </article>
    `;

  }).join("");
}


// Conquistas

function renderizarConquistas(conquistas) {

  const container = document.getElementById(
    "achievements-container"
  );

  if (!container) return;

  if (!conquistas.length) return mostrarMensagem("achievements-container", "Conquistas em atualização.");

  container.innerHTML = conquistas.map(conquista => {

    const colocacao = formatarColocacao(
      conquista.colocacao
    );

    return `
      <div class="ach">

        <div class="year">
          ${escaparHTML(conquista.ano)}
        </div>

        <div class="info">

          <h4>
            ${escaparHTML(conquista.competicao)}
          </h4>

          <p>
            ${escaparHTML(conquista.categoria)}
            — ${escaparHTML(conquista.descricao)}
          </p>

        </div>

        <div class="place">
          ${escaparHTML(colocacao)}
        </div>

      </div>
    `;

  }).join("");
}


function formatarColocacao(colocacao) {

  if (!colocacao) {
    return "Menção";
  }

  return `${colocacao}º Lugar`;
}


// Parceiros

function renderizarParceiros(parceiros) {

  const container = document.getElementById(
    "partners-container"
  );

  if (!container) return;

  const parceirosAtivos = parceiros.filter(
    parceiro => parceiro.ativo
  );

  if (!parceirosAtivos.length) return mostrarMensagem("partners-container", "Parceiros em atualização.");

  container.innerHTML = parceirosAtivos.map(parceiro => {

    if (urlImagem(parceiro.logo)) {

      return `
        <div class="partner">

          <img
            src="${urlImagem(parceiro.logo)}"
            alt="${escaparHTML(parceiro.nome)}"
            loading="lazy"
          >

        </div>
      `;

    }

    return `
      <div class="partner">
        <span class="name">
          ${escaparHTML(parceiro.nome)}
        </span>
      </div>
    `;

  }).join("");
}


// Menu mobile

function inicializarMenuMobile() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".header nav");
  if (!hamburger || !nav) return;
  const definirAberto = aberto => {
    nav.classList.toggle("open", aberto);
    hamburger.setAttribute("aria-expanded", String(aberto));
    hamburger.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };
  hamburger.addEventListener("click", () => definirAberto(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => definirAberto(false)));
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && nav.classList.contains("open")) {
      definirAberto(false); hamburger.focus();
    }
  });
  document.addEventListener("click", evento => {
    if (!evento.target.closest(".header")) definirAberto(false);
  });
  matchMedia("(max-width: 1150px)").addEventListener("change", () => definirAberto(false));
}

// Header

function inicializarHeader() {

  const header = document.querySelector(".header");

  if (!header) return;

  let lastScroll = 0;

  window.addEventListener(
    "scroll",
    () => {

      const y = window.scrollY;

      if (y > 200 && y > lastScroll && !header.contains(document.activeElement) && !header.querySelector("nav.open")) {
        header.style.transform = "translateY(-100%)";
      } else {
        header.style.transform = "translateY(0)";
      }

      lastScroll = y;

    },
    { passive: true }
  );
}


// Reveal on scroll (revelar ao "scrolar")

function inicializarReveal() {

  const elementos = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {

    elementos.forEach(elemento => {
      elemento.classList.add("in");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries, observerAtual) => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.classList.add("in");

          observerAtual.unobserve(entry.target);

        }

      });

    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -80px 0px"
    }
  );

  elementos.forEach(elemento => {
    observer.observe(elemento);
  });
}


// Ano do Rodapé

function atualizarAno() {

  const elemento = document.getElementById("year");

  if (elemento) {
    elemento.textContent = new Date().getFullYear();
  }
}