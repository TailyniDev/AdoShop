// URL base do JSON Server
const API_URL = "http://localhost:3000";

/*ajustar caminho de imagem se o db.json vier como "imgs/..." */
function resolveImagePath(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("assets/")) return path;
  //usa "imgs/rose.png", mas arquivos ficam em assets/imgs/*
  if (path.startsWith("imgs/")) return `assets/${path}`;
  return path;
}

/* --------- VERIFICAÇÃO DE LOGIN E ATUALIZAÇÃO UI --------- */
function verificarLogin() {
    try {
        const usuarioData = localStorage.getItem('usuarioLogado');
        return usuarioData ? JSON.parse(usuarioData) : null;
    } catch (e) {
        console.error('Erro ao verificar login:', e);
        return null;
    }
}

function atualizarUIUsuario() {
    try {
        const usuarioData = localStorage.getItem('usuarioLogado');
        const usuario = usuarioData ? JSON.parse(usuarioData) : null;
        
        const userDisplay = document.getElementById('user-display');
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        console.log("Usuario no localStorage:", usuario);
        console.log("Elementos encontrados:", { userDisplay, authButtons, userMenu });

        if (userDisplay && authButtons && userMenu) {
            if (usuario && usuario.user) {
                console.log("Usuário logado detectado:", usuario.user);
                userDisplay.textContent = `Olá, ${usuario.user}`;
                authButtons.style.display = 'none';
                userMenu.style.display = 'flex';
            } else {
                console.log("Nenhum usuário logado");
                userDisplay.textContent = 'Visitante';
                authButtons.style.display = 'flex';
                userMenu.style.display = 'none';
            }
        } else {
            console.log("Elementos do header não encontrados");
        }
    } catch (error) {
        console.error("Erro ao atualizar UI:", error);
    }
}

function redirecionarSeLogado() {
    const usuario = verificarLogin();
    const currentPage = window.location.pathname;
    
    if (usuario && (currentPage.includes('login.html') || currentPage.includes('registro.html'))) {
        window.location.href = usuario.tipo === 'adm' ? 'admin.html' : 'index.html';
    }
}

/* --------- LOGOUT --------- */
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        alert('Até logo! Você saiu da sua conta.');
        atualizarUIUsuario();
        window.location.href = 'index.html';
    }
}

/* --------- PROTEGER PÁGINA --------- */
function protegerPagina(tipoNecessario = null) {
    const usuario = verificarLogin();
    
    if (!usuario) {
        alert("Você precisa fazer login para acessar esta página!");
        window.location.href = "login.html";
        return null;
    }

    if (tipoNecessario && usuario.tipo !== tipoNecessario) {
        alert("Acesso restrito! Esta área é apenas para administradores.");
        window.location.href = "index.html";
        return null;
    }
    
    return usuario;
}

/* ------------- LOGIN / REGISTRO ------------- */
function login(user = null, senha = null, event = null) {
    if (event) event.preventDefault();
    
    console.log("Função login chamada");
    
    // Se os parâmetros não foram passados, busca dos campos
    if (!user || !senha) {
        user = document.getElementById("login-user")?.value?.trim() || 
               document.getElementById("user")?.value?.trim();
        senha = document.getElementById("login-senha")?.value || 
                document.getElementById("senha")?.value;
    }

    console.log("Tentando login com:", user, senha);

    if (!user || !senha) {
        alert("Preencha usuário e senha.");
        return false;
    }

    // Verifica ADM
    fetch(`${API_URL}/adms`)
        .then(res => {
            console.log("Resposta ADMs:", res.status);
            if (!res.ok) throw new Error("Erro ao buscar ADMs");
            return res.json();
        })
        .then(adms => {
            console.log("ADMs encontrados:", adms);
            const adm = adms.find(a => a.user === user && a.senha === senha);
            if (adm) {
                console.log("ADM encontrado:", adm);
                localStorage.setItem("usuarioLogado", JSON.stringify({ ...adm, tipo: "adm" }));
                console.log("Usuário salvo no localStorage");
                window.location.href = "admin.html";
                return;
            }

            // Verifica Usuário
            fetch(`${API_URL}/logins`)
                .then(res => {
                    console.log("Resposta logins:", res.status);
                    if (!res.ok) throw new Error("Erro ao buscar usuários");
                    return res.json();
                })
                .then(users => {
                    console.log("Usuários encontrados:", users);
                    const usuario = users.find(u => u.user === user && u.senha === senha);
                    if (usuario) {
                        console.log("Usuário encontrado:", usuario);
                        localStorage.setItem("usuarioLogado", JSON.stringify({ ...usuario, tipo: "usuario" }));
                        console.log("Usuário salvo no localStorage");
                        window.location.href = "index.html";
                    } else {
                        console.log("Usuário não encontrado");
                        alert("Usuário ou senha inválidos!");
                    }
                })
                .catch((e) => {
                    console.error("Erro ao buscar usuários:", e);
                    alert("Erro ao verificar usuário.");
                });
        })
        .catch((e) => {
            console.error("Erro no login:", e);
            alert("Não foi possível realizar o login.");
        });
        
    return false;
}

function registrar(user = null, senha = null, email = null, event = null) {
    if (event) event.preventDefault();
    
    // Se os parâmetros não foram passados, busca dos campos
    if (!user || !senha || !email) {
        user = document.getElementById("registro-user")?.value?.trim() || 
               document.getElementById("user")?.value?.trim();
        senha = document.getElementById("registro-senha")?.value || 
                document.getElementById("senha")?.value;
        email = document.getElementById("registro-email")?.value?.trim() || 
                document.getElementById("email")?.value?.trim();
    }

    if (!user || !senha || !email) {
        alert("Preencha usuário, senha e email.");
        return false;
    }

    fetch(`${API_URL}/logins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, senha, email })
    })
        .then(res => {
            if (!res.ok) throw new Error("Falha ao cadastrar");
            alert("Cadastro realizado! Faça login.");
            window.location.href = "login.html";
        })
        .catch((e) => {
            console.error("Erro no cadastro:", e);
            alert("Não foi possível realizar o cadastro.");
        });
        
    return false;
}

/* --------- PRODUTOS (SHOP & PRODUTO) --------- */
function carregarProdutos() {
  const container = document.getElementById("produtos");
  if (!container) return;

  fetch(`${API_URL}/produtos`)
    .then(res => res.json())
    .then(produtos => {
      container.innerHTML = "";
      produtos.forEach(p => {
        const img = resolveImagePath(p.imagem);
        container.innerHTML += `
          <div class="produto-card">
            <a href="produto.html?id=${p.id}">
              <img src="${img}" alt="${p.nome}">
              <h3>${p.nome}</h3>
              <p>R$ ${Number(p.preco).toFixed(2)}</p>
              ${p.limited ? `<p>🔥 Edição Limitada</p>` : ``}
            </a>
            <button onclick="adicionarCarrinho(${p.id})">Comprar</button>
          </div>
        `;
      });
    })
    .catch((e) => {
      console.error("Erro ao carregar produtos:", e);
      container.innerHTML = `<p style="color:white">Não foi possível carregar os produtos.</p>`;
    });
}

function carregarProdutoDetalhe() {
  const container = document.getElementById("produto-detalhes");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    container.innerHTML = `<p style="color:white; text-align:center;">Produto não encontrado.</p>`;
    return;
  }

  fetch(`${API_URL}/produtos/${id}`)
    .then(res => {
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json();
    })
    .then(p => {
      const img = resolveImagePath(p.imagem);
      container.innerHTML = `
        <div class="produto-imagem">
          <img src="${img}" alt="${p.nome}">
        </div>
        <div class="detalhes-texto">
          <h1>${p.nome}</h1>
          <p class="preco">R$ ${Number(p.preco).toFixed(2)}</p>
          ${p.limited ? `<p class="limited-badge">🔥 Produto Limitado</p>` : ``}
          
          <!-- NOVOS CAMPOS ADICIONADOS -->
          <div class="produto-info">
            <p><strong>Descrição:</strong> ${p.descrição || 'Não informada'}</p>
            <p><strong>Categoria:</strong> ${p.categoria || 'Não informada'}</p>
            <p><strong>Quantidade disponível:</strong> ${p.quantidade || 0}</p>
            <p><strong>Peso:</strong> ${p.peso || 'Não informado'} kg</p>
            <p><strong>Disponibilidade:</strong> ${p.quantidade > 0 ? 'Disponível' : 'Indisponível'}</p>
          </div>
          
          <button class="btn-comprar" onclick="adicionarCarrinho('${p.id}')">Adicionar ao Carrinho</button>
        </div>
      `;
    })
    .catch(() => {
      container.innerHTML = `<p style="color:white; text-align:center;">Produto não encontrado.</p>`;
    });
}

function adicionarCarrinho(id) {
  alert("Produto " + id + " adicionado ao carrinho!");
}

/* ------------------- ADMIN (PRODUTOS) ------------------- */
function carregarProdutosAdmin() {
  const lista = document.getElementById("produtos-lista");
  if (!lista) return;

  fetch(`${API_URL}/produtos`)
    .then(res => res.json())
    .then(produtos => {
      lista.innerHTML = "";
      produtos.forEach(p => {
        const img = resolveImagePath(p.imagem);
        const card = document.createElement("div");
        card.className = "produto-card";
        card.innerHTML = `
          <img src="${img}" alt="${p.nome}">
          <h3>${p.nome}</h3>
          <p>R$ ${Number(p.preco).toFixed(2)}</p>
          <p><strong>Descrição:</strong> ${p.descrição || 'N/A'}</p>
          <p><strong>Categoria:</strong> ${p.categoria || 'N/A'}</p>
          <p><strong>Quantidade:</strong> ${p.quantidade || 0}</p>
          <p><strong>Peso:</strong> ${p.peso || 'N/A'} kg</p>
          <p><strong>Disponível:</strong> ${p.quantidade > 0 ? 'Sim' : 'Não'}</p>
          <p><strong>Limitado:</strong> ${p.limited ? 'Sim' : 'Não'}</p>
          <div class="acoes">
            <button class="edit" onclick="editarProduto('${p.id}')">✏ Editar</button>
            <button class="delete" onclick="excluirProduto('${p.id}')">🗑 Excluir</button>
          </div>
        `;
        lista.appendChild(card);
      });
    })
    .catch((e) => {
      console.error("Erro ao carregar produtos (admin):", e);
      lista.innerHTML = `<p>Não foi possível carregar os produtos.</p>`;
    });
}

function salvarProduto(event) {
  if (event) event.preventDefault();

  const id = document.getElementById("produto-id").value;
  const nome = document.getElementById("produto-nome").value.trim();
  const preco = Number(document.getElementById("produto-preco").value);
  const imagem = document.getElementById("produto-imagem").value.trim();
  const descrição = document.getElementById("descrição").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade").value);
  const categoria = document.getElementById("categoria").value.trim();
  const peso = parseFloat(document.getElementById("peso").value);
  const disponibilidade = document.getElementById("disponibilidade").checked;
  const limited = document.getElementById("produto-limited").checked;

  if (!nome || isNaN(preco) || !imagem || !descrição || isNaN(quantidade) || !categoria || isNaN(peso)) {
    alert("Preencha todos os campos obrigatórios corretamente.");
    return;
  }

  const produto = { 
    nome, 
    preco, 
    imagem, 
    descrição,
    quantidade,
    categoria,
    peso,
    limited 
  };

  const req = id
    ? fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produto)
      })
    : fetch(`${API_URL}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produto)
      });

  req
    .then(res => {
      if (!res.ok) throw new Error("Falha ao salvar");
      alert(id ? "Produto atualizado!" : "Produto adicionado!");
      document.getElementById("form-produto").reset();
      document.getElementById("produto-id").value = "";
      carregarProdutosAdmin();
    })
    .catch((e) => {
      console.error("Erro ao salvar produto:", e);
      alert("Não foi possível salvar o produto.");
    });
}

function editarProduto(id) {
  fetch(`${API_URL}/produtos/${id}`)
    .then(res => res.json())
    .then(p => {
      document.getElementById("produto-id").value = p.id;
      document.getElementById("produto-nome").value = p.nome;
      document.getElementById("produto-preco").value = p.preco;
      document.getElementById("produto-imagem").value = p.imagem;
      document.getElementById("descrição").value = p.descrição || '';
      document.getElementById("quantidade").value = p.quantidade || '';
      document.getElementById("categoria").value = p.categoria || '';
      document.getElementById("peso").value = p.peso || '';
      document.getElementById("disponibilidade").checked = p.quantidade > 0;
      document.getElementById("produto-limited").checked = !!p.limited;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function excluirProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;
  fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error("Falha ao excluir");
      carregarProdutosAdmin();
    })
    .catch((e) => {
      console.error("Erro ao excluir produto:", e);
      alert("Não foi possível excluir o produto.");
    });
}

/* --------- SHOP.HTML --------- */
function carregarProdutosShop() {
    const container = document.getElementById("produtos-container");
    if (!container) {
        console.error("Container de produtos não encontrado!");
        return;
    }

    console.log("Carregando produtos para shop.html...");
    
    fetch(`${API_URL}/produtos`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao carregar produtos");
            return res.json();
        })
        .then(produtos => {
            console.log("Produtos carregados:", produtos);
            
            if (produtos.length === 0) {
                container.innerHTML = `<p style="color:white; text-align:center;">Nenhum produto encontrado.</p>`;
                return;
            }

            container.innerHTML = "";
            produtos.forEach(p => {
                const img = resolveImagePath(p.imagem);
                const produtoCard = `
                    <div class="produto-card">
                        <a href="produto.html?id=${p.id}">
                            <img src="${img}" alt="${p.nome}">
                            <h3>${p.nome}</h3>
                            <p class="preco">R$ ${Number(p.preco).toFixed(2)}</p>
                            ${p.limited ? `<span class="badge-limited">🔥 Edição Limitada</span>` : ''}
                        </a>
                        <button class="btn-comprar" onclick="adicionarCarrinho('${p.id}')">Comprar</button>
                    </div>
                `;
                container.innerHTML += produtoCard;
            });
        })
        .catch((e) => {
            console.error("Erro ao carregar produtos:", e);
            container.innerHTML = `
                <div style="color:white; text-align:center; padding: 50px;">
                    <p>Não foi possível carregar os produtos.</p>
                    <p>Verifique se o JSON Server está rodando na porta 3000</p>
                    <button onclick="carregarProdutosShop()" style="padding: 10px 20px; margin-top: 20px;">
                        Tentar Novamente
                    </button>
                </div>
            `;
        });
}

/* --------- INICIALIZAÇÃO --------- */
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM carregado - verificando usuário...");
    
    // Verificações de página específicas
    if (document.getElementById("produtos")) carregarProdutos();
    if (document.getElementById("produto-detalhes")) carregarProdutoDetalhe();
    if (document.getElementById("produtos-lista")) carregarProdutosAdmin();
    if (document.getElementById("produtos-container")) carregarProdutosShop();

    // Atualiza UI do usuário em todas as páginas
    setTimeout(atualizarUIUsuario, 100);
    
    // Redireciona se já estiver logado
    redirecionarSeLogado();

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.onsubmit = function(event) {
            login(null, null, event);
        };
        console.log("Formulário de login encontrado e configurado");
    }

    const formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        formRegistro.onsubmit = function(event) {
            registrar(null, null, null, event);
        };
        console.log("Formulário de registro encontrado e configurado");
    }

    // Proteção de página admin
    if (window.location.pathname.includes('admin.html')) {
        protegerPagina("adm");
    }
    
    console.log("Configuração inicial completa");
});




/* JavaScript para o menu hamburguer */
function toggleMenu() {
  const nav = document.querySelector('nav');
  nav.classList.toggle('active');
}

