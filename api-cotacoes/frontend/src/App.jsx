import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3000/api";
const CHAVE_SESSAO = "api-cotacoes-sessao";

const secoes = [
  { id: "inicio", nome: "Visão geral", icone: "⌂" },
  { id: "clientes", nome: "Clientes", icone: "◉" },
  { id: "produtos", nome: "Produtos", icone: "◇" },
  { id: "pontos", nome: "Pontos de venda", icone: "⌖" },
  { id: "cotacoes", nome: "Cotações", icone: "▤" },
];

const clienteInicial = {
  nome: "",
  email: "",
  telefone: "",
  regiao: "",
};

const categoriasCatalogo = [
  { id: "todas", nome: "Todos" },
  { id: "construcao", nome: "Construção" },
  { id: "acabamento", nome: "Acabamento" },
  { id: "hidraulica", nome: "Hidráulica" },
  { id: "outros", nome: "Diversos" },
];

function obterCategoriaProduto(nome) {
  const texto = String(nome ?? "").toLowerCase();
  if (
    texto.includes("cimento") ||
    texto.includes("bloco") ||
    texto.includes("areia") ||
    texto.includes("brita")
  ) {
    return "construcao";
  }
  if (
    texto.includes("tinta") ||
    texto.includes("piso") ||
    texto.includes("argamassa") ||
    texto.includes("cerâmico")
  ) {
    return "acabamento";
  }
  if (
    texto.includes("tubo") ||
    texto.includes("torneira") ||
    texto.includes("caixa") ||
    texto.includes("agua") ||
    texto.includes("hidra")
  ) {
    return "hidraulica";
  }
  return "outros";
}

async function requisitar(caminho, opcoes, token) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        ...opcoes?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Inicie o back-end com npm.cmd run dev.",
    );
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(dados?.error ?? "Não foi possível concluir a solicitação.");
  }
  return dados;
}

function gerarImagemProduto(nome) {
  const paleta = [
    ["#eaf6ee", "#2f6f4d", "#93c8a1"],
    ["#f8efe5", "#b56e3d", "#efc59f"],
    ["#ebf1ff", "#4467a5", "#b6cde8"],
    ["#f7ebef", "#a14e63", "#e8b8c3"],
    ["#f1f4d9", "#6a6f4f", "#d6d9ae"],
  ];

  const [fundo, cor, detalhe] = paleta[nome.length % paleta.length];
  const label = nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${fundo}"/>
          <stop offset="100%" stop-color="${cor}"/>
        </linearGradient>
      </defs>
      <rect width="960" height="620" fill="url(#bg)" rx="36"/>
      <circle cx="190" cy="130" r="120" fill="rgba(255,255,255,0.18)"/>
      <circle cx="760" cy="500" r="150" fill="rgba(255,255,255,0.14)"/>
      <rect x="120" y="220" width="720" height="200" rx="28" fill="rgba(255,255,255,0.16)"/>
      <text x="480" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="700" fill="${detalhe}" letter-spacing="6">${label}</text>
      <text x="480" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#ffffff" letter-spacing="3">${nome.slice(0, 24).toUpperCase()}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function moeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function dataHora(valor) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

export default function App() {
  const [pagina, setPagina] = useState("home");
  const [secao, setSecao] = useState("inicio");
  const [sessao, setSessao] = useState(() => {
    const armazenada = sessionStorage.getItem(CHAVE_SESSAO);
    if (!armazenada) return null;
    try {
      return JSON.parse(armazenada);
    } catch {
      sessionStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
  });
  const [mostrarAcesso, setMostrarAcesso] = useState(false);
  const [modoAcesso, setModoAcesso] = useState("login");
  const [acessoForm, setAcessoForm] = useState({ nome: "", email: "", senha: "" });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [dados, setDados] = useState({
    clientes: [],
    produtos: [],
    pontos: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [clienteForm, setClienteForm] = useState(clienteInicial);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [precoMinimo, setPrecoMinimo] = useState("");
  const [precoMaximo, setPrecoMaximo] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [cotacaoForm, setCotacaoForm] = useState({
    clienteId: "",
    pontoDeVendaId: "",
    mensagem: "",
    produtoId: "",
    quantidade: 1,
    itens: [],
  });
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [clientes, produtos, pontos] = await Promise.all([
        requisitar("/clientes"),
        requisitar("/produtos"),
        requisitar("/pontos-de-venda"),
      ]);
      setDados({ clientes, produtos, pontos });
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [sessao]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const tituloAtual = secoes.find((item) => item.id === secao)?.nome ?? "Visão geral";
  const produtosFiltrados = useMemo(() => {
    const termo = pesquisaProduto.trim().toLowerCase();
    const minimo = Number(precoMinimo || 0);
    const maximo = Number(precoMaximo || Number.POSITIVE_INFINITY);

    return dados.produtos.filter((produto) => {
      const categoriaOk =
        categoriaSelecionada === "todas" ||
        obterCategoriaProduto(produto.nome) === categoriaSelecionada;
      const termoOk =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo);
      const precoOk = produto.precoBase >= minimo && produto.precoBase <= maximo;
      return categoriaOk && termoOk && precoOk;
    });
  }, [categoriaSelecionada, dados.produtos, pesquisaProduto, precoMaximo, precoMinimo]);
  const produtosEmDestaque = useMemo(
    () => produtosFiltrados.slice(0, 3),
    [produtosFiltrados],
  );
  const totalItensCotacao = useMemo(
    () => cotacaoForm.itens.reduce((total, item) => total + item.quantidade, 0),
    [cotacaoForm.itens],
  );
  const totalCarrinho = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade * item.precoBase, 0),
    [carrinho],
  );
  const quantidadeCarrinho = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade, 0),
    [carrinho],
  );
  async function iniciarSessao(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const cadastro = modoAcesso === "cadastro";
      const resultado = await requisitar(
        cadastro ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            cadastro
              ? acessoForm
              : { email: acessoForm.email, senha: acessoForm.senha },
          ),
        },
      );
      if (typeof resultado.access_token !== "string" || !resultado.access_token) {
        throw new Error("A API não retornou o access_token esperado.");
      }
      const novaSessao = {
        token: resultado.access_token,
        usuario: resultado.usuario,
      };
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(novaSessao));
      setSessao(novaSessao);
      setAcessoForm({ nome: "", email: "", senha: "" });
      setMostrarAcesso(false);
      setPagina("home");
      setAviso(`Bem-vindo, ${resultado.usuario.nome}.`);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function encerrarSessao() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    setSessao(null);
    setPagina("home");
    setSecao("inicio");
    setAviso("Sessão encerrada.");
    setErro("");
  }

  function adicionarAoCarrinho(produto) {
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.identificador === produto.identificador);
      if (existente) {
        return atual.map((item) =>
          item.identificador === produto.identificador
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }
      return [...atual, { ...produto, quantidade: 1 }];
    });
    setMostrarCarrinho(true);
    setAviso(`${produto.nome} foi adicionado ao carrinho.`);
  }

  function removerDoCarrinho(identificador) {
    setCarrinho((atual) => atual.filter((item) => item.identificador !== identificador));
  }

  function ajustarQuantidadeCarrinho(identificador, delta) {
    setCarrinho((atual) =>
      atual
        .map((item) =>
          item.identificador === identificador
            ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
            : item,
        )
        .filter((item) => item.quantidade > 0),
    );
  }

  function renderAcesso() {
    const cadastro = modoAcesso === "cadastro";
    return (
      <main className="tela-acesso">
        <section className="acesso-apresentacao">
          <a className="marca marca-acesso" href="#inicio">
            <span className="marca-icone">C</span>
            <span>
              <strong>cotação</strong>
              <small>GESTÃO REGIONAL</small>
            </span>
          </a>
          <div className="acesso-mensagem">
            <span className="acesso-selo">COTAÇÕES COM MAIS AGILIDADE</span>
            <h1>Boas decisões começam com uma boa cotação.</h1>
            <p>
              Acesse sua conta para acompanhar solicitações, consultar produtos
              e encontrar pontos de venda.
            </p>
            <div className="acesso-destaque" aria-hidden="true">
              <div className="destaque-cabecalho">
                <span className="destaque-ponto" />
                <span className="destaque-ponto" />
                <span className="destaque-ponto" />
                <span className="destaque-titulo">Resumo de cotações</span>
              </div>
              <div className="destaque-conteudo">
                <span className="destaque-icone">↗</span>
                <span>
                  <small>Gestão simples e centralizada</small>
                  <strong>Mais controle para o seu dia</strong>
                </span>
              </div>
              <div className="destaque-linhas">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <p className="acesso-rodape">Cotação · Gestão regional</p>
        </section>

        <section className="acesso-formulario">
          <button
            className="acesso-voltar"
            onClick={() => {
              setMostrarAcesso(false);
              setPagina("home");
              setErro("");
            }}
            type="button"
          >
            <span aria-hidden="true">←</span> Voltar ao site
          </button>
          <div className="acesso-cartao">
            <p className="sobretitulo">{cadastro ? "CONTA DE CLIENTE" : "BEM-VINDO DE VOLTA"}</p>
            <h2>{cadastro ? "Criar conta de cliente" : "Entrar na sua conta"}</h2>
            <p className="acesso-descricao">
              {cadastro
                ? "Preencha seus dados para criar seu acesso de cliente."
                : "Informe seus dados para continuar."}
            </p>

            {erro && (
              <div aria-live="polite" className="acesso-erro" role="alert">
                {erro}
              </div>
            )}

            <form className="formulario-acesso" onSubmit={iniciarSessao}>
              {cadastro && (
                <label>
                  Nome
                  <input
                    autoComplete="name"
                    minLength="2"
                    onChange={(event) =>
                      setAcessoForm((atual) => ({ ...atual, nome: event.target.value }))
                    }
                    placeholder="Seu nome completo"
                    required
                    value={acessoForm.nome}
                  />
                </label>
              )}
              <label>
                E-mail
                <input
                  autoComplete="email"
                  onChange={(event) =>
                    setAcessoForm((atual) => ({ ...atual, email: event.target.value }))
                  }
                  placeholder="voce@exemplo.com"
                  required
                  type="email"
                  value={acessoForm.email}
                />
              </label>
              <label>
                Senha
                <span className="campo-senha">
                  <input
                    autoComplete={cadastro ? "new-password" : "current-password"}
                    minLength={cadastro ? 8 : undefined}
                    onChange={(event) =>
                      setAcessoForm((atual) => ({ ...atual, senha: event.target.value }))
                    }
                    placeholder={cadastro ? "Mínimo de 8 caracteres" : "Sua senha"}
                    required
                    type={mostrarSenha ? "text" : "password"}
                    value={acessoForm.senha}
                  />
                  <button
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={mostrarSenha}
                    className="alternar-senha"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    type="button"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </span>
              </label>
              <button className="botao-primario botao-acesso" disabled={salvando} type="submit">
                {salvando
                  ? "Aguarde..."
                  : cadastro
                    ? "Criar conta de cliente"
                    : "Entrar"}
                {!salvando && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="alternar-cadastro">
              {cadastro ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <button
                onClick={() => {
                  setModoAcesso(cadastro ? "login" : "cadastro");
                  setErro("");
                  setAcessoForm({ nome: "", email: "", senha: "" });
                }}
                type="button"
              >
                {cadastro ? "Entrar" : "Criar conta de cliente"}
              </button>
            </p>
            <p className="acesso-seguranca">
              <span aria-hidden="true">◆</span> Seus dados são enviados com segurança
            </p>
          </div>
        </section>
      </main>
    );
  }

  async function cadastrarCliente(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      await requisitar("/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteForm),
      });
      setClienteForm(clienteInicial);
      setMostrarCadastro(false);
      setAviso("Cliente cadastrado com sucesso.");
      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function adicionarItemCotacao(event) {
    event.preventDefault();
    if (!cotacaoForm.produtoId || Number(cotacaoForm.quantidade) < 1) return;
    const produto = dados.produtos.find(
      (item) => item.identificador === cotacaoForm.produtoId,
    );
    if (!produto) return;

    setCotacaoForm((atual) => {
      const existente = atual.itens.find(
        (item) => item.produtoId === produto.identificador,
      );
      const itens = existente
        ? atual.itens.map((item) =>
            item.produtoId === produto.identificador
              ? { ...item, quantidade: item.quantidade + Number(atual.quantidade) }
              : item,
          )
        : [
            ...atual.itens,
            {
              produtoId: produto.identificador,
              nome: produto.nome,
              precoBase: produto.precoBase,
              quantidade: Number(atual.quantidade),
            },
          ];
      return { ...atual, itens, quantidade: 1 };
    });
  }

  function removerItem(produtoId) {
    setCotacaoForm((atual) => ({
      ...atual,
      itens: atual.itens.filter((item) => item.produtoId !== produtoId),
    }));
  }

  async function criarCotacao(event) {
    event.preventDefault();
    if (cotacaoForm.itens.length === 0) {
      setErro("Adicione ao menos um produto à cotação.");
      return;
    }

    setSalvando(true);
    setErro("");
    setAviso("");
    setWhatsappUrl("");
    try {
      const resultado = await requisitar("/cotacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cotacaoForm.clienteId,
          pontoDeVendaId: cotacaoForm.pontoDeVendaId,
          mensagem: cotacaoForm.mensagem,
          itens: cotacaoForm.itens.map(({ produtoId, quantidade }) => ({
            produtoId,
            quantidade,
          })),
        }),
      }, sessao?.token);
      setAviso(`Cotação criada. ${resultado.mensagem}`);
      setWhatsappUrl(resultado.whatsappUrl);
      setCotacaoForm({
        clienteId: "",
        pontoDeVendaId: "",
        mensagem: "",
        produtoId: "",
        quantidade: 1,
        itens: [],
      });
      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function renderInicio() {
    return (
      <>
        <div className="boas-vindas">
          <div>
            <p className="sobretitulo">ACOMPANHAMENTO REGIONAL</p>
            <h1>Visão geral</h1>
            <p className="texto-secundario">
              Acompanhe clientes, catálogo, pontos de atendimento e cotações.
            </p>
          </div>
          <button className="botao-secundario" onClick={carregarDados} type="button">
            Atualizar dados
          </button>
        </div>

        <div className="grade-indicadores">
          <Indicador titulo="Clientes" valor={dados.clientes.length} icone="◉" />
          <Indicador titulo="Produtos ativos" valor={dados.produtos.length} icone="◇" />
          <Indicador titulo="Pontos de venda" valor={dados.pontos.length} icone="⌖" />
          <Indicador
            titulo="Acesso"
            valor={sessao ? "Ativo" : "Visitante"}
            icone="▤"
          />
        </div>

        <section className="painel">
          <div className="cabecalho-painel">
            <div>
              <p className="sobretitulo">PRÓXIMO PASSO</p>
              <h2>Monte sua cotação</h2>
              <p className="texto-secundario">
                Escolha um produto e envie sua solicitação aos pontos da sua região.
              </p>
            </div>
            <button
              className="botao-primario"
              onClick={() => setSecao("cotacoes")}
              type="button"
            >
              Criar cotação
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderClientes() {
    return (
      <>
        <CabecalhoSecao
          subtitulo="RELACIONAMENTO"
          titulo="Clientes"
          descricao="Cadastre e consulte as pessoas que solicitam cotações."
          acao={
            <button
              className="botao-primario"
              onClick={() => setMostrarCadastro((atual) => !atual)}
              type="button"
            >
              {mostrarCadastro ? "Fechar cadastro" : "+ Novo cliente"}
            </button>
          }
        />
        {mostrarCadastro && (
          <form className="painel formulario-grade" onSubmit={cadastrarCliente}>
            <label>
              Nome completo
              <input
                autoComplete="name"
                onChange={(event) =>
                  setClienteForm({ ...clienteForm, nome: event.target.value })
                }
                required
                value={clienteForm.nome}
              />
            </label>
            <label>
              E-mail
              <input
                autoComplete="email"
                onChange={(event) =>
                  setClienteForm({ ...clienteForm, email: event.target.value })
                }
                required
                type="email"
                value={clienteForm.email}
              />
            </label>
            <label>
              Telefone
              <input
                autoComplete="tel"
                onChange={(event) =>
                  setClienteForm({ ...clienteForm, telefone: event.target.value })
                }
                required
                value={clienteForm.telefone}
              />
            </label>
            <label>
              Região
              <input
                onChange={(event) =>
                  setClienteForm({ ...clienteForm, regiao: event.target.value })
                }
                required
                value={clienteForm.regiao}
              />
            </label>
            <button className="botao-primario" disabled={salvando} type="submit">
              {salvando ? "Salvando..." : "Salvar cliente"}
            </button>
          </form>
        )}
        <section className="painel">
          <div className="cabecalho-painel">
            <div>
              <h2>Todos os clientes</h2>
              <p className="texto-secundario">{dados.clientes.length} cadastrados</p>
            </div>
          </div>
          <div className="lista-cartoes">
            {dados.clientes.map((cliente) => (
              <article className="cartao-registro" key={cliente.identificador}>
                <div className="avatar">{iniciais(cliente.nome)}</div>
                <div className="registro-principal">
                  <strong>{cliente.nome}</strong>
                  <span>{cliente.email}</span>
                </div>
                <div className="registro-extra">
                  <span>{cliente.telefone}</span>
                  <span>{cliente.regiao}</span>
                </div>
                <span className="rotulo-suave">
                  {cliente.dataCadastro ? dataHora(cliente.dataCadastro) : "Cadastrado"}
                </span>
              </article>
            ))}
            {!dados.clientes.length && <Vazio mensagem="Nenhum cliente cadastrado ainda." />}
          </div>
        </section>
      </>
    );
  }

  function renderProdutos() {
    return (
      <>
        <CabecalhoSecao
          subtitulo="CATÁLOGO"
          titulo="Produtos"
          descricao="Produtos ativos disponíveis para entrar em uma cotação."
        />
        <div className="grade-registros">
          {dados.produtos.map((produto) => (
            <article className="cartao-produto" key={produto.identificador}>
              <div className="cartao-produto-imagem">
                <img
                  alt={produto.nome}
                  src={produto.imagem || gerarImagemProduto(produto.nome)}
                />
              </div>
              <span className="etiqueta">ATIVO</span>
              <h2>{produto.nome}</h2>
              <p>{produto.descricao}</p>
              <strong>{moeda(produto.precoBase)}</strong>
            </article>
          ))}
          {!dados.produtos.length && (
            <Vazio mensagem="Nenhum produto ativo no catálogo. Cadastre produtos pelo Prisma Studio para disponibilizá-los nas cotações." />
          )}
        </div>
      </>
    );
  }

  function renderPontos() {
    return (
      <>
        <CabecalhoSecao
          subtitulo="ATENDIMENTO REGIONAL"
          titulo="Pontos de venda"
          descricao="Locais que podem receber e atender as cotações."
        />
        <div className="grade-registros">
          {dados.pontos.map((ponto) => (
            <article className="cartao-ponto" key={ponto.identificador}>
              <span className="icone-grande">⌖</span>
              <span className="etiqueta">{ponto.regiao}</span>
              <h2>{ponto.nome}</h2>
              <p>{ponto.endereco}</p>
              <span className="coordenadas">
                {ponto.latitude}, {ponto.longitude}
              </span>
            </article>
          ))}
          {!dados.pontos.length && (
            <Vazio mensagem="Nenhum ponto de venda cadastrado. Cadastre um ponto pelo Prisma Studio para direcionar cotações." />
          )}
        </div>
      </>
    );
  }

  function renderCotacoes() {
    const total = cotacaoForm.itens.reduce(
      (soma, item) => soma + item.precoBase * item.quantidade,
      0,
    );
    const podeCriar =
      dados.clientes.length > 0 &&
      dados.pontos.length > 0 &&
      dados.produtos.length > 0;

    return (
      <>
        <CabecalhoSecao
          subtitulo="SOLICITAÇÃO DE ORÇAMENTO"
          titulo="Nova cotação"
          descricao="Selecione o cliente, o ponto de venda e os produtos solicitados."
        />
        {!sessao ? (
          <section className="painel aviso-configuracao">
            <span className="icone-grande">▤</span>
            <h2>Entre para enviar uma cotação</h2>
            <p>
              Crie uma conta ou entre com sua conta para receber um token de acesso
              e enviar a solicitação com segurança.
            </p>
            <button
              className="botao-primario"
              onClick={() => setMostrarAcesso(true)}
              type="button"
            >
              Entrar ou criar conta
            </button>
          </section>
        ) : !podeCriar ? (
          <section className="painel aviso-configuracao">
            <span className="icone-grande">▤</span>
            <h2>Complete os cadastros antes de cotar</h2>
            <p>
              Para criar uma cotação, é necessário ter ao menos um cliente, um
              produto ativo e um ponto de venda cadastrado.
            </p>
            <div className="lista-pre-requisitos">
              <span className={dados.clientes.length ? "concluido" : ""}>
                {dados.clientes.length ? "✓" : "○"} Clientes ({dados.clientes.length})
              </span>
              <span className={dados.produtos.length ? "concluido" : ""}>
                {dados.produtos.length ? "✓" : "○"} Produtos ({dados.produtos.length})
              </span>
              <span className={dados.pontos.length ? "concluido" : ""}>
                {dados.pontos.length ? "✓" : "○"} Pontos ({dados.pontos.length})
              </span>
            </div>
          </section>
        ) : (
          <form className="painel formulario-cotacao" onSubmit={criarCotacao}>
            <div className="formulario-grade">
              <label>
                Cliente
                <select
                  onChange={(event) =>
                    setCotacaoForm({ ...cotacaoForm, clienteId: event.target.value })
                  }
                  required
                  value={cotacaoForm.clienteId}
                >
                  <option value="">Selecione um cliente</option>
                  {dados.clientes.map((cliente) => (
                    <option key={cliente.identificador} value={cliente.identificador}>
                      {cliente.nome} — {cliente.regiao}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ponto de venda
                <select
                  onChange={(event) =>
                    setCotacaoForm({
                      ...cotacaoForm,
                      pontoDeVendaId: event.target.value,
                    })
                  }
                  required
                  value={cotacaoForm.pontoDeVendaId}
                >
                  <option value="">Selecione um ponto de venda</option>
                  {dados.pontos.map((ponto) => (
                    <option key={ponto.identificador} value={ponto.identificador}>
                      {ponto.nome} — {ponto.regiao}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section aria-labelledby="titulo-adicionar-produto" className="seletor-produtos">
              <div className="seletor-produtos-cabecalho">
                <h2 id="titulo-adicionar-produto">Adicionar produtos</h2>
                <p>Escolha um produto e a quantidade para incluir na cotação.</p>
              </div>
              <div className="adicionar-produto">
                <label>
                  Produto
                  <select
                    onChange={(event) =>
                      setCotacaoForm((atual) => ({
                        ...atual,
                        produtoId: event.target.value,
                      }))
                    }
                    value={cotacaoForm.produtoId}
                  >
                    <option value="">Escolha um produto...</option>
                    {dados.produtos.map((produto) => (
                      <option key={produto.identificador} value={produto.identificador}>
                        {produto.nome} — {moeda(produto.precoBase)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo-quantidade">
                  Quantidade
                  <input
                    min="1"
                    onChange={(event) =>
                      setCotacaoForm((atual) => ({
                        ...atual,
                        quantidade: event.target.value,
                      }))
                    }
                    type="number"
                    value={cotacaoForm.quantidade}
                  />
                </label>
                <button
                  className="botao-primario botao-adicionar"
                  disabled={!cotacaoForm.produtoId}
                  onClick={adicionarItemCotacao}
                  type="button"
                >
                  <span aria-hidden="true">+</span> Adicionar produto
                </button>
              </div>
              {!cotacaoForm.produtoId && (
                <p className="seletor-produtos-ajuda">
                  Selecione um produto para habilitar o botão.
                </p>
              )}
            </section>

            <div className="itens-cotacao">
              <div className="cabecalho-lista">
                <strong>Itens da cotação</strong>
                <span>{totalItensCotacao} unidades</span>
              </div>
              {cotacaoForm.itens.map((item) => (
                <div className="linha-item" key={item.produtoId}>
                  <span>{item.nome}</span>
                  <span>{item.quantidade} × {moeda(item.precoBase)}</span>
                  <strong>{moeda(item.quantidade * item.precoBase)}</strong>
                  <button
                    aria-label={`Remover ${item.nome}`}
                    className="botao-remover"
                    onClick={() => removerItem(item.produtoId)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
              {!cotacaoForm.itens.length && (
                <p className="texto-secundario">Adicione um produto para continuar.</p>
              )}
              <div className="total-cotacao">
                <span>Total estimado</span>
                <strong>{moeda(total)}</strong>
              </div>
            </div>

            <label>
              Mensagem (opcional)
              <textarea
                onChange={(event) =>
                  setCotacaoForm({ ...cotacaoForm, mensagem: event.target.value })
                }
                placeholder="Observações sobre a solicitação"
                rows="3"
                value={cotacaoForm.mensagem}
              />
            </label>
            <button
              className="botao-primario"
              disabled={
                salvando ||
                !cotacaoForm.clienteId ||
                !cotacaoForm.pontoDeVendaId ||
                !cotacaoForm.itens.length
              }
              type="submit"
            >
              {salvando ? "Enviando cotação..." : "Enviar cotação"}
            </button>
          </form>
        )}
      </>
    );
  }

  function renderHome() {
    const pontosEmDestaque = dados.pontos.slice(0, 3);
    const avaliacoes = [
      {
        nome: "Ana Lúcia",
        cargo: "Construtora residencial",
        texto: "Compramos materiais em duas oportunidades e a experiência foi clara, rápida e profissional. O catálogo ajudou bastante na escolha dos itens.",
        nota: 5,
      },
      {
        nome: "Mateus R.",
        cargo: "Diretor de obra",
        texto: "A cotação ficou organizada e a comunicação com o ponto de venda foi muito mais ágil. Excelente para acompanhar compras em região.",
        nota: 5,
      },
      {
        nome: "Renata S.",
        cargo: "Proprietária de reforma",
        texto: "O atendimento foi direto e o processo de compra ficou muito simples. A organização do catálogo faz toda a diferença.",
        nota: 5,
      },
    ];

    return (
      <div className="home-loja">
        <header className="home-cabecalho">
          <a
            aria-label="Cotação, página inicial"
            className="marca"
            href="#inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="marca-icone">C</span>
            <span>
              <strong>cotação</strong>
              <small>GESTÃO REGIONAL</small>
            </span>
          </a>
          <nav aria-label="Navegação da página inicial" className="home-links">
            <a href="#produtos">Produtos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#atendimento">Atendimento</a>
          </nav>
          <div className="home-acoes">
            <button
              className="home-carrinho-btn"
              onClick={() => setMostrarCarrinho((atual) => !atual)}
              type="button"
            >
              Carrinho {quantidadeCarrinho > 0 ? `(${quantidadeCarrinho})` : ""}
            </button>
            {sessao ? (
              <>
                <button
                  className="home-entrar"
                  onClick={() => setPagina("painel")}
                  type="button"
                >
                  Meu painel
                </button>
                <button className="botao-primario home-criar" onClick={encerrarSessao} type="button">
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  className="home-entrar"
                  onClick={() => {
                    setModoAcesso("login");
                    setMostrarAcesso(true);
                    setErro("");
                  }}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  className="botao-primario home-criar"
                  onClick={() => {
                    setModoAcesso("cadastro");
                    setMostrarAcesso(true);
                    setErro("");
                  }}
                  type="button"
                >
                  Criar conta
                </button>
              </>
            )}
          </div>
        </header>

        {mostrarCarrinho && (
          <aside className="carrinho-flutuante" aria-live="polite">
            <div className="carrinho-cabecalho">
              <div>
                <p className="sobretitulo">SEU PEDIDO</p>
                <h3>Carrinho</h3>
              </div>
              <button onClick={() => setMostrarCarrinho(false)} type="button">✕</button>
            </div>
            {carrinho.length ? (
              <>
                <div className="carrinho-lista">
                  {carrinho.map((item) => (
                    <div className="carrinho-item" key={item.identificador}>
                      <div>
                        <strong>{item.nome}</strong>
                        <span>{moeda(item.precoBase)} cada</span>
                      </div>
                      <div className="carrinho-controles">
                        <button onClick={() => ajustarQuantidadeCarrinho(item.identificador, -1)} type="button">−</button>
                        <span>{item.quantidade}</span>
                        <button onClick={() => ajustarQuantidadeCarrinho(item.identificador, 1)} type="button">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="carrinho-rodape">
                  <span>Total</span>
                  <strong>{moeda(totalCarrinho)}</strong>
                </div>
              </>
            ) : (
              <p className="carrinho-vazio">Seu carrinho está vazio. Adicione alguns materiais para continuar.</p>
            )}
          </aside>
        )}

        <main>
          {aviso && (
            <div aria-live="polite" className="home-aviso" role="status">
              <span>{aviso}</span>
              <button aria-label="Fechar aviso" onClick={() => setAviso("")} type="button">
                ×
              </button>
            </div>
          )}
          <section aria-labelledby="home-titulo" className="home-hero" id="inicio">
            <div className="home-hero-texto">
              <span className="home-etiqueta">
                <span aria-hidden="true">✦</span> COTAÇÕES REGIONAIS, SEM COMPLICAÇÃO
              </span>
              <h1 id="home-titulo">
                Encontre o que precisa. <span>Compare com confiança.</span>
              </h1>
              <p>
                Consulte produtos, encontre pontos de venda da sua região e
                solicite uma cotação em poucos passos.
              </p>
              <div className="home-hero-acoes">
                <a className="botao-primario home-cta" href="#produtos">
                  Explorar produtos <span aria-hidden="true">→</span>
                </a>
                <a className="home-link-secundario" href="#como-funciona">
                  Como funciona
                </a>
              </div>
              <div className="home-confianca">
                <span aria-hidden="true">✓</span> Processo simples
                <span aria-hidden="true">✓</span> Atendimento regional
              </div>
            </div>
            <div aria-hidden="true" className="home-hero-visual">
              <div className="home-orbita home-orbita-externa" />
              <div className="home-orbita home-orbita-interna" />
              <div className="home-visual-selo home-selo-superior">
                <span>⌖</span>
                <span><small>Pontos próximos</small><strong>Atendimento regional</strong></span>
              </div>
              <div className="home-visual-cartao">
                <div className="home-visual-cabecalho">
                  <span className="home-visual-icone">C</span>
                  <span><small>CATÁLOGO REGIONAL</small><strong>Boas escolhas começam aqui</strong></span>
                </div>
                <div className="home-visual-produto home-produto-um"><span>◇</span><i /><b /></div>
                <div className="home-visual-produto home-produto-dois"><span>⌖</span><i /><b /></div>
                <div className="home-visual-produto home-produto-tres"><span>▤</span><i /><b /></div>
                <div className="home-visual-rodape"><span /> Compare opções e solicite sua cotação</div>
              </div>
              <div className="home-visual-selo home-selo-inferior">
                <span className="home-selo-check">✓</span>
                <span><small>Fácil de acompanhar</small><strong>Do catálogo à cotação</strong></span>
              </div>
            </div>
          </section>

          <section aria-label="Vantagens" className="home-beneficios">
            <article><span>◇</span><div><strong>Catálogo em um só lugar</strong><small>Veja os produtos disponíveis</small></div></article>
            <article><span>⌖</span><div><strong>Atendimento próximo</strong><small>Encontre pontos na sua região</small></div></article>
            <article><span>▤</span><div><strong>Cotação organizada</strong><small>Envie sua solicitação com clareza</small></div></article>
          </section>

          <section className="home-oferta">
            <div className="home-oferta-texto">
              <span className="home-oferta-tag">OFERTA DO MÊS</span>
              <h2>Economize até 18% em materiais de acabamento.</h2>
              <p>Kit completo para reforma residencial com tinta, argamassa e piso, com entregas rápidas e atendimento regional.</p>
            </div>
            <div className="home-oferta-meta">
              <strong>Até 18% OFF</strong>
              <span>Entrega em 48h</span>
            </div>
          </section>

          <section aria-labelledby="produtos-titulo" className="home-secao" id="produtos">
            <div className="home-secao-cabecalho">
              <div>
                <p className="sobretitulo">SELEÇÃO REGIONAL</p>
                <h2 id="produtos-titulo">Explore nosso catálogo</h2>
                <p className="texto-secundario">Consulte os produtos disponíveis e peça uma cotação quando estiver pronto.</p>
              </div>
              <button
                className="home-ver-todos"
                onClick={() => {
                  setPagina("painel");
                  setSecao("produtos");
                }}
                type="button"
              >
                Ver catálogo completo <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="home-filtros-categorias" aria-label="Filtros de categoria">
              {categoriasCatalogo.map((categoria) => (
                <button
                  key={categoria.id}
                  className={categoriaSelecionada === categoria.id ? "filtro-categoria ativo" : "filtro-categoria"}
                  onClick={() => setCategoriaSelecionada(categoria.id)}
                  type="button"
                >
                  {categoria.nome}
                </button>
              ))}
            </div>

            <div className="home-filtros-busca">
              <label className="campo-busca">
                <span>Buscar produto</span>
                <input
                  onChange={(event) => setPesquisaProduto(event.target.value)}
                  placeholder="Ex.: cimento, tinta, tubo..."
                  type="search"
                  value={pesquisaProduto}
                />
              </label>
              <label className="campo-preco">
                <span>Preço mínimo</span>
                <input
                  min="0"
                  onChange={(event) => setPrecoMinimo(event.target.value)}
                  placeholder="0"
                  type="number"
                  value={precoMinimo}
                />
              </label>
              <label className="campo-preco">
                <span>Preço máximo</span>
                <input
                  min="0"
                  onChange={(event) => setPrecoMaximo(event.target.value)}
                  placeholder="5000"
                  type="number"
                  value={precoMaximo}
                />
              </label>
            </div>

            {carregando ? (
              <p className="home-estado">Carregando produtos...</p>
            ) : produtosFiltrados.length ? (
              <div className="home-produtos-grade">
                {produtosFiltrados.slice(0, 6).map((produto, indice) => (
                  <article className="home-produto-card" key={produto.identificador}>
                    <div className="home-produto-imagem">
                      <img
                        alt={produto.nome}
                        src={produto.imagem || gerarImagemProduto(produto.nome)}
                      />
                      <small>{indice < 3 ? "Destaque" : "Disponível"}</small>
                    </div>
                    <div className="home-produto-info">
                      <p>{obterCategoriaProduto(produto.nome).toUpperCase()}</p>
                      <h3>{produto.nome}</h3>
                      <span>{produto.descricao}</span>
                      <div className="home-produto-rodape">
                        <strong>{moeda(produto.precoBase)}</strong>
                        <small>preço base</small>
                      </div>
                      <button
                        className="botao-primario botao-carrinho"
                        onClick={() => adicionarAoCarrinho(produto)}
                        type="button"
                      >
                        Adicionar ao carrinho
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="home-vazio">
                {erro || "Nenhum produto encontrado com os filtros aplicados."}
              </div>
            )}
          </section>

          <section aria-labelledby="avaliacoes-titulo" className="home-avaliacoes">
            <div className="home-secao-cabecalho avaliacao-cabecalho">
              <div>
                <p className="sobretitulo">CLIENTES SATISFEITOS</p>
                <h2 id="avaliacoes-titulo">Avaliações que inspiram confiança</h2>
              </div>
            </div>
            <div className="home-avaliacoes-grid">
              {avaliacoes.map((avaliacao) => (
                <article className="home-avaliacao-card" key={avaliacao.nome}>
                  <div className="home-avaliacao-topo">
                    <div className="home-avaliacao-avatar">{avaliacao.nome.slice(0, 1)}</div>
                    <div>
                      <strong>{avaliacao.nome}</strong>
                      <small>{avaliacao.cargo}</small>
                    </div>
                  </div>
                  <div className="home-avaliacao-nota" aria-label={`${avaliacao.nota} de 5 estrelas`}>
                    {Array.from({ length: avaliacao.nota }, (_, index) => (
                      <span key={`${avaliacao.nome}-${index}`}>★</span>
                    ))}
                  </div>
                  <p>{avaliacao.texto}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="como-funciona-titulo" className="home-como" id="como-funciona">
            <div className="home-como-intro">
              <p className="sobretitulo">SEM COMPLICAÇÃO</p>
              <h2 id="como-funciona-titulo">Sua cotação em três passos</h2>
              <p>Informação organizada para você decidir com tranquilidade.</p>
            </div>
            <div className="home-passos">
              <article><span>01</span><h3>Explore</h3><p>Consulte o catálogo e encontre o que procura.</p></article>
              <article><span>02</span><h3>Escolha</h3><p>Selecione os produtos e o ponto de venda.</p></article>
              <article><span>03</span><h3>Solicite</h3><p>Entre na sua conta e envie sua cotação.</p></article>
            </div>
          </section>

          <section aria-labelledby="atendimento-titulo" className="home-atendimento" id="atendimento">
            <div>
              <p className="sobretitulo">PERTO DE VOCÊ</p>
              <h2 id="atendimento-titulo">Atendimento que conhece sua região.</h2>
              <p>Consulte os pontos de venda participantes e descubra onde solicitar sua cotação.</p>
            </div>
            <div className="home-pontos">
              {pontosEmDestaque.length ? pontosEmDestaque.map((ponto) => (
                <article key={ponto.identificador}><span>⌖</span><div><strong>{ponto.nome}</strong><small>{ponto.regiao} · {ponto.endereco}</small></div></article>
              )) : <p>{carregando ? "Carregando pontos de atendimento..." : "Novos pontos de atendimento serão exibidos aqui."}</p>}
              <button
                className="home-ver-todos"
                onClick={() => {
                  setPagina("painel");
                  setSecao("pontos");
                }}
                type="button"
              >
                Ver todos os pontos <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="home-convite">
            <div><h2>Pronto para pedir sua cotação?</h2><p>Crie sua conta grátis ou entre para continuar.</p></div>
            <button
              className="botao-primario home-cta"
              onClick={() => {
                if (sessao) {
                  setPagina("painel");
                  setSecao("cotacoes");
                } else {
                  setModoAcesso("cadastro");
                  setMostrarAcesso(true);
                  setErro("");
                }
              }}
              type="button"
            >
              {sessao ? "Solicitar cotação" : "Criar minha conta"} <span aria-hidden="true">→</span>
            </button>
          </section>
        </main>

        <footer className="home-rodape">
          <a className="marca" href="#inicio">
            <span className="marca-icone">C</span>
            <span><strong>cotação</strong><small>GESTÃO REGIONAL</small></span>
          </a>
          <span>Informação clara para boas decisões.</span>
          <button
            onClick={() => {
              if (sessao) {
                setPagina("painel");
              } else {
                setModoAcesso("login");
                setMostrarAcesso(true);
                setErro("");
              }
            }}
            type="button"
          >
            {sessao ? "Abrir meu painel" : "Acessar minha conta"}
          </button>
        </footer>
      </div>
    );
  }

  function renderConteudo() {
    if (carregando) {
      return <div className="estado-carregamento">Carregando dados do sistema...</div>;
    }

    switch (secao) {
      case "clientes":
        return renderClientes();
      case "produtos":
        return renderProdutos();
      case "pontos":
        return renderPontos();
      case "cotacoes":
        return renderCotacoes();
      default:
        return renderInicio();
    }
  }

  if (mostrarAcesso && !sessao) {
    return renderAcesso();
  }

  if (pagina === "home") {
    return renderHome();
  }

  return (
    <div className="aplicacao">
      <aside className="barra-lateral">
        <a
          aria-label="Cotações, início"
          className="marca"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            setPagina("home");
            setSecao("inicio");
          }}
        >
          <span className="marca-icone">C</span>
          <span>
            <strong>cotação</strong>
            <small>GESTÃO REGIONAL</small>
          </span>
        </a>

        <p className="nav-titulo">MENU PRINCIPAL</p>
        <nav aria-label="Navegação principal">
          {secoes.map((item) => (
              <button
                aria-current={secao === item.id ? "page" : undefined}
                className={`item-nav ${secao === item.id ? "ativo" : ""}`}
                key={item.id}
                onClick={() => {
                  setPagina("painel");
                  setSecao(item.id);
                  setErro("");
                  setAviso("");
                }}
                type="button"
              >
                <span className="nav-icone">{item.icone}</span>
                {item.nome}
              </button>
            ))}
        </nav>

        <div className="lateral-rodape">
          <span className="avatar">
            {sessao ? iniciais(sessao.usuario.nome) : "?"}
          </span>
          <span className="perfil-texto">
            <strong>{sessao?.usuario?.nome ?? "Visitante"}</strong>
            <small>
              {sessao ? "Conta autenticada" : "Não autenticado"}
            </small>
          </span>
        </div>
      </aside>

      <main className="area-principal">
        <header className="barra-superior">
          <div className="caminho">
            <span>Painel</span>
            <span className="separador">/</span>
            <strong>{tituloAtual}</strong>
          </div>
          <div className="acoes-superiores">
            <span className="conexao">
              <span className="indicador-ponto" />
              API conectada
            </span>
            {sessao ? (
              <button className="botao-secundario" onClick={encerrarSessao} type="button">
                Sair
              </button>
            ) : (
              <button
                className="botao-secundario"
                onClick={() => setMostrarAcesso((atual) => !atual)}
                type="button"
              >
                Entrar
              </button>
            )}
          </div>
        </header>

        <section className="conteudo">
          {erro && (
            <div aria-live="polite" className="banner banner-erro" role="alert">
              <span>{erro}</span>
              <button onClick={carregarDados} type="button">Tentar novamente</button>
            </div>
          )}
          {aviso && (
            <div aria-live="polite" className="banner banner-sucesso" role="status">
              <span>{aviso}</span>
              {whatsappUrl && (
                <a href={whatsappUrl} rel="noreferrer" target="_blank">
                  Abrir WhatsApp
                </a>
              )}
              <button onClick={() => setAviso("")} type="button" aria-label="Fechar aviso">
                ×
              </button>
            </div>
          )}
          {renderConteudo()}
        </section>
      </main>
    </div>
  );
}

function Indicador({ titulo, valor, icone }) {
  return (
    <article className="cartao-indicador">
      <span className="indicador-icone">{icone}</span>
      <span className="indicador-titulo">{titulo}</span>
      <strong>{valor}</strong>
      <span className="indicador-legenda">registros no sistema</span>
    </article>
  );
}

function CabecalhoSecao({ subtitulo, titulo, descricao, acao }) {
  return (
    <div className="cabecalho-secao">
      <div>
        <p className="sobretitulo">{subtitulo}</p>
        <h1>{titulo}</h1>
        <p className="texto-secundario">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}

function Vazio({ mensagem }) {
  return (
    <div className="vazio">
      <span>◇</span>
      <p>{mensagem}</p>
    </div>
  );
}

function iniciais(nome = "") {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
