const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function gerarImagemProduto(nome, cor, corDetalhe) {
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
          <stop offset="0%" stop-color="${cor}"/>
          <stop offset="100%" stop-color="${corDetalhe}"/>
        </linearGradient>
      </defs>
      <rect width="960" height="620" fill="url(#bg)" rx="36"/>
      <circle cx="190" cy="130" r="120" fill="rgba(255,255,255,0.14)"/>
      <circle cx="760" cy="500" r="150" fill="rgba(255,255,255,0.12)"/>
      <rect x="130" y="220" width="700" height="200" rx="28" fill="rgba(255,255,255,0.14)"/>
      <text x="480" y="324" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="700" fill="white" letter-spacing="6">${label}</text>
      <text x="480" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="rgba(255,255,255,0.9)" letter-spacing="3">${nome.slice(0, 24).toUpperCase()}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const produtosExemplo = [
  {
    nome: "Cimento CP-II — saco 50 kg",
    descricao: "Cimento para uso geral em obras e reformas.",
    imagem: gerarImagemProduto("Cimento", "#2f6f4d", "#93c8a1"),
    precoBase: 39.9,
  },
  {
    nome: "Argamassa AC-II — saco 20 kg",
    descricao: "Argamassa para assentamento de revestimentos.",
    imagem: gerarImagemProduto("Argamassa", "#b56e3d", "#efc59f"),
    precoBase: 28.5,
  },
  {
    nome: "Tinta acrílica — lata 18 L",
    descricao: "Tinta para acabamento de paredes internas e externas.",
    imagem: gerarImagemProduto("Tinta", "#4467a5", "#b6cde8"),
    precoBase: 289.9,
  },
  {
    nome: "Piso cerâmico — m²",
    descricao: "Revestimento cerâmico para ambientes residenciais.",
    imagem: gerarImagemProduto("Piso", "#a14e63", "#e8b8c3"),
    precoBase: 49.9,
  },
  {
    nome: "Bloco cerâmico — unidade",
    descricao: "Bloco de vedação para alvenaria.",
    imagem: gerarImagemProduto("Bloco", "#6a6f4f", "#d6d9ae"),
    precoBase: 2.75,
  },
  {
    nome: "Areia média — m³",
    descricao: "Areia média para preparo de argamassa e concreto.",
    imagem: gerarImagemProduto("Areia", "#6f8e8a", "#d8ecea"),
    precoBase: 165,
  },
  {
    nome: "Brita nº 1 — m³",
    descricao: "Agregado graúdo para concreto e drenagem.",
    imagem: gerarImagemProduto("Brita", "#5c6b7f", "#c5d2e7"),
    precoBase: 185,
  },
  {
    nome: "Tubo PVC — barra de 6 m",
    descricao: "Tubo para instalações hidráulicas residenciais.",
    imagem: gerarImagemProduto("PVC", "#3d6d7a", "#b5d4dd"),
    precoBase: 42.9,
  },
  {
    nome: "Caixa-d'água — 500 L",
    descricao: "Reservatório de água para uso residencial.",
    imagem: gerarImagemProduto("Água", "#4879a9", "#c7dff7"),
    precoBase: 319.9,
  },
  {
    nome: "Torneira metálica",
    descricao: "Torneira para instalação em cozinha ou banheiro.",
    imagem: gerarImagemProduto("Torneira", "#7f7f85", "#d9d9df"),
    precoBase: 89.9,
  },
];

const pontosExemplo = [
  {
    nome: "Unidade Centro — São João da Boa Vista",
    endereco: "Endereço demonstrativo, Centro, São João da Boa Vista — SP",
    latitude: -21.9692,
    longitude: -46.7981,
    regiao: "São João da Boa Vista",
  },
  {
    nome: "Unidade Centro — Aguaí",
    endereco: "Endereço demonstrativo, Centro, Aguaí — SP",
    latitude: -22.0572,
    longitude: -46.9735,
    regiao: "Aguaí",
  },
  {
    nome: "Unidade Centro — Espírito Santo do Pinhal",
    endereco: "Endereço demonstrativo, Centro, Espírito Santo do Pinhal — SP",
    latitude: -22.1156,
    longitude: -46.6825,
    regiao: "Espírito Santo do Pinhal",
  },
  {
    nome: "Unidade Centro — Vargem Grande do Sul",
    endereco: "Endereço demonstrativo, Centro, Vargem Grande do Sul — SP",
    latitude: -21.8322,
    longitude: -46.8936,
    regiao: "Vargem Grande do Sul",
  },
  {
    nome: "Unidade Centro — Casa Branca",
    endereco: "Endereço demonstrativo, Centro, Casa Branca — SP",
    latitude: -21.7739,
    longitude: -47.0858,
    regiao: "Casa Branca",
  },
];

async function criarSeFaltar(model, exemplos, campoUnico) {
  const existentes = await model.findMany({
    select: { [campoUnico]: true },
  });
  const nomesExistentes = new Set(
    existentes.map((registro) => registro[campoUnico].toLocaleLowerCase("pt-BR")),
  );
  const restantes = Math.max(0, exemplos.length - existentes.length);
  const paraCriar = exemplos
    .filter((registro) => !nomesExistentes.has(registro[campoUnico].toLocaleLowerCase("pt-BR")))
    .slice(0, restantes);

  if (paraCriar.length > 0) {
    await model.createMany({ data: paraCriar });
  }
}

async function main() {
  const [quantidadeProdutos, quantidadePontos, clientes] = await Promise.all([
    prisma.produto.count(),
    prisma.pontoDeVenda.count(),
    prisma.cliente.findMany({
      where: { email: { endsWith: "@example.com" } },
      orderBy: { email: "asc" },
      take: 5,
    }),
  ]);

  if (quantidadeProdutos > 10) {
    throw new Error(
      `Já existem ${quantidadeProdutos} produtos. O limite de demonstração é 10; nenhum dado existente foi removido.`,
    );
  }

  const produtosExistentes = await prisma.produto.findMany();
  for (const produto of produtosExistentes) {
    if (!produto.imagem) {
      await prisma.produto.update({
        where: { identificador: produto.identificador },
        data: {
          imagem: gerarImagemProduto(produto.nome, "#2f6f4d", "#93c8a1"),
        },
      });
    }
  }
  if (quantidadePontos > 5) {
    throw new Error(
      `Já existem ${quantidadePontos} pontos de venda. O limite de demonstração é 5; nenhum dado existente foi removido.`,
    );
  }
  if (clientes.length < 5) {
    throw new Error(
      "São necessários cinco clientes de demonstração (@example.com) para criar as cotações de exemplo.",
    );
  }

  await criarSeFaltar(prisma.produto, produtosExemplo, "nome");
  await criarSeFaltar(prisma.pontoDeVenda, pontosExemplo, "nome");

  const [produtos, pontos] = await Promise.all([
    prisma.produto.findMany({ orderBy: { nome: "asc" } }),
    prisma.pontoDeVenda.findMany({ orderBy: { regiao: "asc" } }),
  ]);

  const produtoPorNome = new Map(produtos.map((produto) => [produto.nome, produto]));
  const pontoPorRegiao = new Map(pontos.map((ponto) => [ponto.regiao, ponto]));
  const exemplosCotacao = [
    {
      mensagem: "[Demonstração] Solicitação de materiais para reforma da cozinha.",
      itens: [
        ["Cimento CP-II — saco 50 kg", 4],
        ["Argamassa AC-II — saco 20 kg", 6],
        ["Piso cerâmico — m²", 18],
      ],
    },
    {
      mensagem: "[Demonstração] Orçamento para pintura de residência.",
      itens: [
        ["Tinta acrílica — lata 18 L", 3],
        ["Argamassa AC-II — saco 20 kg", 2],
      ],
    },
    {
      mensagem: "[Demonstração] Materiais para construção de um muro.",
      itens: [
        ["Bloco cerâmico — unidade", 500],
        ["Cimento CP-II — saco 50 kg", 20],
        ["Areia média — m³", 3],
      ],
    },
    {
      mensagem: "[Demonstração] Orçamento de instalação hidráulica.",
      itens: [
        ["Tubo PVC — barra de 6 m", 8],
        ["Torneira metálica", 3],
        ["Caixa-d'água — 500 L", 1],
      ],
    },
    {
      mensagem: "[Demonstração] Cotação de agregado para concretagem.",
      itens: [
        ["Brita nº 1 — m³", 4],
        ["Areia média — m³", 4],
        ["Cimento CP-II — saco 50 kg", 25],
      ],
    },
  ];

  const mensagensExistentes = new Set(
    (
      await prisma.cotacao.findMany({
        where: { mensagem: { startsWith: "[Demonstração]" } },
        select: { mensagem: true },
      })
    ).map((cotacao) => cotacao.mensagem),
  );

  for (let indice = 0; indice < exemplosCotacao.length; indice += 1) {
    const exemplo = exemplosCotacao[indice];
    if (mensagensExistentes.has(exemplo.mensagem)) continue;

    const cliente = clientes[indice];
    const ponto = cliente ? pontoPorRegiao.get(cliente.regiao) : undefined;
    if (!cliente || !ponto) {
      throw new Error(
        `Não foi possível relacionar o cliente de demonstração à região ${cliente?.regiao ?? "(desconhecida)"}.`,
      );
    }

    const itens = exemplo.itens.map(([nome, quantidade]) => {
      const produto = produtoPorNome.get(nome);
      if (!produto) {
        throw new Error(`Produto de demonstração não encontrado: ${nome}.`);
      }

      return {
        quantidade,
        precoUnitario: produto.precoBase,
        produto: { connect: { identificador: produto.identificador } },
      };
    });

    await prisma.cotacao.create({
      data: {
        identificadorCliente: cliente.identificador,
        identificadorPontoDeVenda: ponto.identificador,
        mensagem: exemplo.mensagem,
        itens: { create: itens },
      },
    });
  }

  const [totalProdutos, totalPontos, totalPendentes] = await Promise.all([
    prisma.produto.count(),
    prisma.pontoDeVenda.count(),
    prisma.cotacao.count({ where: { status: "PENDENTE" } }),
  ]);

  console.log(
    JSON.stringify(
      {
        produtos: totalProdutos,
        pontosDeVenda: totalPontos,
        cotacoesPendentes: totalPendentes,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Falha ao carregar dados de demonstração:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
