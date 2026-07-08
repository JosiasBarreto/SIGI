# RELATÓRIO DE IMPLEMENTAÇÃO DO MÓDULO COMERCIAL E FISCAL - SIGI ERP

Este relatório técnico documenta a implementação aprofundada das funcionalidades de Vendas, Fiscalidade (IVA), Faturação e Tesouraria, integrando-as no ecossistema atual do SIGI ERP sem introduzir quebras (breaking changes) ou duplicar domínios já existentes. A implementação cumpriu o rigor do padrão SOLID transacional associado a arquiteturas Python/Flask.

## 1. Relatório Módulo por Módulo

### Módulo Comercial & Faturação
- **Motor de Venda**: Lógica de cálculo rigorosa e processada inteiramente no backend (`ComercialService`). Assegura a integridade de todas as faturas (FT, FR, PROFORMA).
- **Numeração Automática**: Algoritmo que gere de forma transacional `(lock for_update)` a sequência serial anual por tipo de documento (ex: `FT 2026/000001`).
- **Geração PDF**: Implementado através da biblioteca `reportlab` para criação em *buffer* e distribuição direta pelo endpoint PDF. 

### Módulo Fiscal (IVA)
- **Motor de Impostos**: Estrutura abstrata de taxas dinâmicas (`6%`, `13%`, `23%`, `Isento`).
- **Lógica de Absorção de Impostos nas Vendas**: Cálculo independente da dedução de descontos (Subtotal → Desconto → Base Tributável → IVA → Total).

### Módulo Financeiro
- **Pagamentos e Recibos**: Foi gerado um vínculo entre o pagamento das faturas e a `Venda`. O pagamento total ou parcial de uma venda reflete de imediato sobre o seu saldo, mudando o estado da mesma.
- **Fechos de Caixa Diário**: Otimizado para consolidar fluxos unificados (Data de referência).

### Módulo de Auditoria
- **Registo Seguro:** Através do `AuditService`, todas as transações, emissões, pagamentos e cancelamentos de documentos geram logs estáticos (que impedem a quebra de sequência).

---

## 2. Novas Tabelas Criadas (Modelos)

Ficheiro central: `/backend/app/models/comercial.py`

1. **`taxas_iva`**: (`id`, `descricao`, `percentagem`, `ativo`)
2. **`series_documento`**: (`id`, `tipo_documento`, `ano`, `ultimo_numero`)
3. **`vendas`**: (`id`, `numero_documento`, `tipo_documento`, `cliente_id`, `pedido_id`, `subtotal`, `desconto_total`, `base_tributavel`, `total_iva`, `total`, `valor_pago`, `saldo`, `estado`, `observacoes`, `criado_por`)
4. **`venda_itens`**: (`id`, `venda_id`, `item_tipo`, `item_id`, `descricao`, `quantidade`, `preco_unitario`, `desconto`, `taxa_iva_id`, `taxa_iva`, `valor_iva`, `subtotal`, `total`)
5. **`fechos_diarios`**: (`id`, `data`, `total_vendas`, `total_recebido`, `total_despesas`, `total_caixas`, `observacoes`)

---

## 3. Endpoints Criados

Foi registado um novo Blueprint focado a 100% no motor comercial.

**Documentos Comerciais (Vendas)**
- `GET /api/v1/vendas/`: Listar documentos.
- `GET /api/v1/vendas/{id}`: Obter detalhes rigorosos.
- `POST /api/v1/vendas/`: Emitir um novo documento (Venda, Fatura, Proforma).
- `POST /api/v1/vendas/{id}/cancelar`: Anular um documento (Auditoria forçada).
- `GET /api/v1/vendas/{id}/pdf`: Gerar e transferir versão em PDF da venda (ReportLab).

**Pagamentos das Vendas**
- `POST /api/v1/vendas/{id}/pagamentos`: Injetar pagamento a um documento; deduz o saldo, muda para Parcial ou Pago.
- `GET /api/v1/vendas/{id}/pagamentos`: Ver extrato de pagamentos liquidados numa venda.

**Imposto e IVA (Fiscal)**
- `GET /api/v1/fiscal/iva`: Lista as taxas de impostos.
- `POST /api/v1/fiscal/iva`: Inicia uma série nova de taxa.

**Financeiro Tesouraria**
- `POST /api/v1/financeiro/fecho-diario`: Efetua a consolidação transversal de todos os fundos de maneio e faturação de um determinado dia.

---

## 4. Alterações Exigidas na Base de Dados (Migrations/DDL)

Deverá correr o pacote de migrações (`flask db migrate && flask db upgrade`) para repercutir no PostgreSQL/MySQL as seguintes *Foreign Keys*:

- `produtos`.`taxa_iva_id` (Adicionado relacionamento `taxas_iva` aos produtos globais).
- `pagamentos`.`venda_id` (Atualizado para refletir o comportamento Financeiro ↔ Venda).
- `contas_receber`.`venda_id` (Permitirá conversões de fiado baseadas noutra modelagem).
- Criação integral das cinco novas tabelas presentes nos Modelos listados no Ponto 2.

---

## 5. DTOs Criados e/ou Presumidos

A integração destas APIs irá pressupor as tipagens que se seguem no frontend (exemplo via Zod Scheme ou DTO):

- `CriarVendaDTO` (Necessita de `tipo_documento_id`, `cliente_id`, array de `CriarVendaItemDTO` com identificadores explícitos - QTD e Preço).
- `TaxaIvaDTO`
- `PagamentoVendaDTO`

*(Para poupar verbosidade, focamo-nos na representação em JSON validada internamente pelo Service/Controller).*

---

## 6. Impactos no Frontend Existente

Esta atualização afeta múltiplos vetores estruturais do ecrã do ERP.

1. **Catálogo de Produtos:** Todos os itens e formulários passaram a carregar compulsoriamente a *Taxa de IVA* aplicada (Ex: 14% vs 23%).
2. **Caixa (POS):** O pagamento "mudo" antigo cai em redundância obrigando à associação com tipos documentais Fatura-Recibo ou Fatura-Simplificada, enviando também os arrays detalhados em vez do total manipulado.
3. **Tesouraria/Extratos:** Terá que migrar da visão global baseada nos pedidos para uma hierarquia Fatura -> Venda -> Liquidações.

---

## 7. Plano Detalhado para Integração Frontend ↔ Backend

**Semana 1:**
- **Atualizar Modelos TS**: Consumir endpoint `/api/v1/fiscal/iva` e tipar (`ITaxaIVA`). Injetar o state com Context/Redux e ligar ao dropdown "Imposto" no formulário de Novo Produto.
- **Formulário Produto**: Mapear erro se `taxa_iva_id` falhar. Obrigatório no Update/Create (`PUT /v1/produtos/{id}`).

**Semana 2:**
- **Telas POS e Pagamento de Pedidos**: 
  1. Alterar payload de fecho. Enviar um `POST` para `api/v1/vendas/` contendo a serialização integral do que que o utilizador escolheu no carrinho (`itens` com suas devidas Qtd e Descontos p/linha). O backend passa a responder com a numeração (`FT 2026/000`).
  2. Implementar modal para preenchimento extra "Como pagou? (Referência, Método)". Que desencadeia `POST` à rota `/v1/vendas/{id}/pagamentos`. 

**Semana 3:**
- **Visualizador Comercial:** Criar Dashboard Vendas (Tabela Listagem Vendas). Consome `/v1/vendas`, permite Filtros de Datatable.
- **Botões Ação (Grid):**
  - Botão de Imprimir PDF: Bind para abir URL em formato *Blob* via a rota GET `/v1/vendas/{id}/pdf`.
  - Botão de "Anular Fatura": Bind associado ao Endpoint POST `cancelar`. Exige Auth admin.

---

## 8. Ecrãs React a serem Substituídos / Alterados (Identificados)

- `src/pages/Produtos/ProdutoForm.tsx`: Adicionar a `<Select>` com Mapeamento das taxas de IVA.
- `src/pages/Pedidos/PedidoDetalhes.tsx`: Botões de Faturação/Converter Pedido em FT e Recebimentos (Parcial).
- `src/pages/POS/Caixa.tsx`: Lógica do carrinho. Em vez de calcular no frontend o total real, o `Cart` deve basear os subtotais, mas ceder inteiramente o cálculo final tributário ao JSON response do Invoice Creation.
- `src/pages/Financeiro/ContasReceber.tsx`: Incorporar ligação e hiperlink para clicar e abrir PDF da respetiva fatura em `/pdf`. Associar as datas de vencimento via modelo comercial.
- `src/pages/Financeiro/ResumoDiario.tsx` (Novo Dashboard): Ecrã de Fecho diário (`/v1/financeiro/fecho-diario`) substituindo lógicas antigas manuais, com apresentação de receitas tributárias, e totais em carteira.
