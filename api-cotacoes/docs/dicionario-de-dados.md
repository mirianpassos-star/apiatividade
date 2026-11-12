# Dicionário de dados

Este catálogo descreve os campos exibidos no Prisma Studio. Os nomes foram
traduzidos para português brasileiro; os campos `identificador` preservam as
chaves e os relacionamentos existentes no PostgreSQL.

## Cliente

| Nome do campo | Precisa de tradução | Descrição |
|---|---|---|
| `identificador` | Não | Identificador único do cliente. |
| `nome` | Não | Nome completo ou nome de contato. |
| `email` | Não | E-mail exclusivo do cliente. |
| `telefone` | Não | Telefone para contato. |
| `regiao` | Não | Região de atendimento do cliente. |
| `dataCadastro` | Não | Data e hora do cadastro. |
| `cotacoes` | Não | Cotações solicitadas por este cliente. Relacionamento, não uma coluna. |

## Produto

| Nome do campo | Precisa de tradução | Descrição |
|---|---|---|
| `identificador` | Não | Identificador único do produto. |
| `nome` | Não | Nome exibido no catálogo. |
| `descricao` | Não | Descrição do produto. |
| `precoBase` | Não | Preço base utilizado para iniciar uma cotação. |
| `ativo` | Não | Indica se o produto está disponível no catálogo. |
| `dataCadastro` | Não | Data e hora do cadastro. |
| `itens` | Não | Itens de cotação que fazem referência ao produto. Relacionamento. |

## PontoDeVenda

| Nome do campo | Precisa de tradução | Descrição |
|---|---|---|
| `identificador` | Não | Identificador único do ponto de venda. |
| `nome` | Não | Nome do estabelecimento ou unidade. |
| `endereco` | Não | Endereço físico. |
| `latitude` | Não | Coordenada de latitude. |
| `longitude` | Não | Coordenada de longitude. |
| `regiao` | Não | Região atendida pelo ponto de venda. |
| `cotacoes` | Não | Cotações direcionadas ao ponto de venda. Relacionamento. |

## Cotacao

| Nome do campo | Precisa de tradução | Descrição |
|---|---|---|
| `identificador` | Não | Identificador único da cotação. |
| `dataCriacao` | Não | Data e hora em que a cotação foi criada. |
| `status` | Não | Situação da cotação; começa como `PENDENTE`. |
| `mensagem` | Não | Mensagem opcional enviada pelo cliente. |
| `identificadorCliente` | Não | Identificador do cliente que solicitou a cotação. |
| `identificadorPontoDeVenda` | Não | Identificador do ponto de venda responsável. |
| `cliente` | Não | Cliente que solicitou a cotação. Relacionamento. |
| `pontoDeVenda` | Não | Ponto de venda responsável. Relacionamento. |
| `itens` | Não | Produtos e quantidades solicitados. Relacionamento. |

## ItemCotacao

| Nome do campo | Precisa de tradução | Descrição |
|---|---|---|
| `identificador` | Não | Identificador único do item da cotação. |
| `identificadorCotacao` | Não | Identificador da cotação à qual o item pertence. |
| `identificadorProduto` | Não | Identificador do produto solicitado. |
| `cotacao` | Não | Cotação à qual o item pertence. Relacionamento. |
| `produto` | Não | Produto solicitado. Relacionamento. |
| `quantidade` | Não | Quantidade solicitada. |
| `precoUnitario` | Não | Preço unitário registrado para esta cotação. |

## Compatibilidade

O banco continua armazenando as colunas originais, como `id`, `clienteId`,
`produtoId` e `createdAt`. O Prisma Studio exibe os nomes em português definidos
no schema. As rotas da API continuam aceitando os identificadores do cliente,
do ponto de venda e do produto nos campos atuais das requisições.
