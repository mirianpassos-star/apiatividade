# Cotação regional e HelpDesk JRS

Este repositório reúne dois projetos independentes desenvolvidos para estudo:
uma aplicação web de cotação de materiais de construção e uma API HelpDesk
local criada com JSON REST Server (JRS).

## Projetos

### `api-cotacoes` — catálogo e solicitação de cotações

Aplicação web para consultar produtos e pontos de venda regionais, criar uma
conta de cliente e organizar uma solicitação de cotação. O catálogo oferece
busca, filtros por categoria e faixa de preço e um carrinho de produtos para
montar o pedido.

- **Front-end:** React e Vite.
- **API:** Node.js, Express e TypeScript.
- **Dados:** PostgreSQL, acessado com Prisma.
- **Recursos:** cadastro e login de clientes, catálogo com imagens, pontos de
  venda e criação de cotações com itens e quantidades.

O front-end consome a API de cotações. Para executar o sistema, inicie a API e
o front-end em terminais separados.

#### Requisitos

Node.js, npm e PostgreSQL.

#### Configurar e executar a API

No PowerShell, a partir da raiz do repositório:

```powershell
cd api-cotacoes
npm install
Copy-Item .env.example .env
```

Edite `api-cotacoes/.env` com a URL do banco PostgreSQL e defina um segredo
JWT aleatório. Depois, gere o cliente Prisma, sincronize o esquema e carregue
os dados de demonstração:

```powershell
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

A API fica disponível em `http://localhost:3000`.

#### Executar o front-end

Abra outro terminal na raiz do repositório:

```powershell
cd api-cotacoes/frontend
npm install
npm run dev
```

Abra no navegador o endereço local exibido pelo Vite.

### `helpdesk-jrs` — API didática de chamados

Exercício independente para praticar uma API REST com armazenamento
persistente em JSON, autenticação JWT e operações de consulta e CRUD de
chamados. Inclui exemplos de configuração e uma coleção de requisições para
Postman.

Este projeto é uma simulação local para fins didáticos; não é integrado ao
front-end de cotações e não deve ser usado em produção nem exposto à internet.

#### Requisitos e execução

Instale o Dart SDK. No PowerShell, a partir da raiz do repositório:

```powershell
cd helpdesk-jrs
Copy-Item config.example.yaml config.yaml
Copy-Item database.example.json database.json
dart pub global activate json_rest_server
json_rest_server run
```

Confira `config.yaml` antes de iniciar e mantenha o servidor vinculado a
`127.0.0.1`. Os dados e as contas de exemplo são fictícios e devem ser usados
somente em testes locais. Consulte [helpdesk-jrs/README.md](./helpdesk-jrs/README.md)
para detalhes de instalação, rotas, testes e limitações conhecidas do JRS.

## Segurança e arquivos locais

Arquivos de ambiente, configurações ativas, bancos locais, dependências e
artefatos de build são excluídos pelo `.gitignore`. Os arquivos de exemplo
servem como modelos; configure valores próprios localmente e nunca publique
segredos, senhas reais ou dados pessoais.

O HelpDesk JRS guarda credenciais de exemplo em texto puro e tem limitações de
autorização documentadas. Use-o apenas como exercício local, nunca com dados
reais.
