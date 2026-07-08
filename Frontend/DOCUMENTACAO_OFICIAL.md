# DOCUMENTAÇÃO OFICIAL COMPLETA – SIGI ERP
## SISTEMA INTEGRADO DE GESTÃO INTELIGENTE – SABOR IMBATÍVEL, S.A.

Este documento unificado contém toda a documentação corporativa, manuais operacionais, especificações técnicas e planos estratégicos de infraestrutura do **SIGI ERP** da **Sabor Imbatível, S.A.** Cada secção foi desenhada para atender aos critérios mais rigorosos de auditoria, validação de fluxo e futura exportação automática em formato Microsoft Word ou PDF.

---

# CONTEÚDO DA DOCUMENTAÇÃO

- **DOCUMENTO 1:** Manual do Administrador (Gestão de Perfis, Auditoria, Parâmetros)
- **DOCUMENTO 2:** Manual do Atendimento / Operações de Frente de Caixa (POS e Pedidos)
- **DOCUMENTO 3:** Manual da Cozinha (Produção de Salgados e Catering)
- **DOCUMENTO 4:** Manual da Pastelaria (Produção de Bolos e Doces Decorados)
- **DOCUMENTO 5:** Manual do Armazém e Logística de Insumos (Controlo de Stock)
- **DOCUMENTO 6:** Manual do Controlador de Materiais (Equipamento de Eventos e Locação)
- **DOCUMENTO 7:** Manual do Motorista e Distribuição (Logística Externa)
- **DOCUMENTO 8:** Manual Financeiro (Fluxo de Caixa, Contas a Pagar/Receber, DRE)
- **DOCUMENTO 9:** Manual Técnico (Arquitetura, Endpoints, APIs, Modelo Relacional, DTOs)
- **DOCUMENTO 10:** Plano de Salvaguarda (Políticas e Execução de Backups)
- **DOCUMENTO 11:** Plano de Recuperação de Desastres (DRP e Mitigação Operacional)
- **DOCUMENTO 12:** Guia de Implantação e Provisionamento do Sistema
- **DOCUMENTO 13:** Checklist de Go-Live e Entrada em Produção (Homologação)

---

## DOCUMENTO 1 – MANUAL DO ADMINISTRADOR

**Destinatários:** Administradores de Sistemas, Diretores de Operações e Gestores de TI.
**Objetivo:** Regular, parametrizar e auditar todas as atividades operacionais dentro do SIGI ERP, salvaguardando a integridade dos dados e o controlo de acesso baseado em perfis funcionais (RBAC).

### 1. FLUXO DE AUTENTICAÇÃO E LOGIN SEGURO
A entrada no sistema é rigidamente controlada através de criptografia de ponta a ponta. O administrador utiliza as suas credenciais cadastradas corporativamente. No primeiro acesso, o sistema força a alteração da password padrão para uma password complexa (letra maiúscula, número e caracter especial). A sessão possui um tempo de vida padrão de 8 horas para garantir a integridade.

### 2. GESTÃO DE UTILIZADORES
O ecrã de Gestão de Utilizadores permite:
* **Criação de Conta:** Registo de Nome Completo, E-mail Institucional (formato `@saborimbativel.com` ou `@sigi.com`), Contacto Telefónico, Perfil de Acesso e Sector.
* **Modificação:** Alteração de status (Ativo / Inativo), redefinição de palavra-passe e atualização de dados de contacto.
* **Bloqueio Temporário:** Detetados 3 acessos mal-sucedidos seguidos, o perfil do utilizador é automaticamente inativado e requer intervenção de um Administrador.

### 3. CONTROLO DE ACESSO BASEADO EM FUNÇÕES (RBAC - ROLE-BASED ACCESS CONTROL)
O SIGI ERP implementa regras estritas de controlo de acesso. Cada utilizador está associado a uma função específica:

| Perfil / Role | Módulos e Funcionalidades Permitidas | Permissões Específicas |
| :--- | :--- | :--- |
| **Administrador** | Todos os módulos sem restrição (Full Access). | Criar/Editar Utilizadores, Auditar Logs, Configurar Alíquotas Fiscais, Reset da DB. |
| **Atendimento** | Caixa POS, Inventário (Consulta de Stock), Pedidos, Clientes, Calendário. | Registar Venda, Iniciar Turno de Caixa, Fechar Caixa, Criar Clientes, Agendar Pedidos. |
| **Cozinha** | Produção, Requisições de Receitas, Turnos (Setor), Inventário de Matérias Primas. | Alterar estado de ordens (Produção), Pedir Ingredientes Complementares, Registar Desperdício. |
| **Pastelaria** | Produção de Pastelaria, Requisições, Inventário, Turnos. | Registar consumo e quebra de insumos de doçaria, Visualizar fichas técnicas de decoração. |
| **Armazém** | Inventário, Fornecedores, Produtos, Requisições (Aprovação e Entrega), Logística. | Confirmar guias de entrega externa, Ajustar Inventário Físico, Mudar local de arrumação. |
| **Motorista** | Logística (Minhas Entrega), Veículos, Calendário de Rotas. | Declarar saída para trânsito, Declarar entrega feita ao cliente final, Registar danos em trânsito. |

### 4. DASHBOARD EXECUTIVO
O Painel Principal consolida instantaneamente os indicadores operacionais da Sabor Imbatível:
* **Pedidos do Dia:** Número de faturas e encomendas emitidas no ciclo atual.
* **Pedidos Pendentes:** Filtra ordens aguardando validação ou entrega.
* **Produção em Curso:** Número de ordens de produção ativas na Cozinha e Pastelaria.
* **Faturação do Dia:** Receita total acumulada das vendas e catering.
* **Eventos Confirmados:** Listagem de decorações e serviços de aluguer marcados em calendário.
* **Alertas de Stock Crítico:** Identificação rápida de produtos/ingredientes abaixo do stock de segurança.

### 5. CONFIGURAÇÕES GERAIS E PARAMETRIZAÇÃO DO SISTEMA
Todas as variáveis administrativas essenciais estão consolidadas no Menu Configurações:
* **Parâmetros Fiscais:** Taxas de IVA aplicadas conforme legislação angolana em vigor (Taxas Isenta, Reduzida a 7% ou Geral a 14%).
* **Preferências de Impressão:** Configuração do driver térmico 80mm para faturas simplificadas POS e formato PDF A4 standard para orçamentos e relatórios corporativos.
* **Integração de Notificações:** Configuração de thresholds de aviso para stock crítico (Ex.: Alerta gerado quando um ingrediente desce de 20kg).
* **Backups Automáticos:** Definição da janela de backup diário (Padrão: 23:59h).

### 6. GESTÃO DE AUDITORIA (LOGS OPERACIONAIS)
O ecrã de Auditoria regista de forma indelével cada ação realizada:
* **Dados gravados:** ID do utilizador, Tipo de Operação (Criação, Atualização, Exclusão), Entidade Alvo, Timestamp Preciso e Conteúdo do Payload pré/pós alteração.
* **Inviolabilidade:** Os logs de auditoria são de apenas leitura, sendo estritamente proibida qualquer ação de alteração ou apagamento de logs, mesmo por administradores.

### 7. GESTÃO DE TURNOS E CALENDÁRIO OPERACIONAL
* **Controlo de Turnos:** Definição do plano de turnos diário para equipas de produção (Cozinha e Pastelaria). Registo de horas reais trabalhadas e chefia responsável.
* **Calendário Geral:** Mapeamento visual das entregas de catering encomendadas e reservas de estruturas (tendas, cadeiras tiffany). Ajuda a evitar sobreposição de locação de infraestrutura.

---

## DOCUMENTO 2 – MANUAL DO ATENDIMENTO

**Destinatários:** Operadores de Caixa, Atendentes, Gestores de Eventos.
**Objetivo:** Operacionalizar frentes de loja, recepção de encomendas, emissão de faturas e processamento de pagamentos.

### 1. ABERTURA E FECHO DE CAIXA NO POS
* **Abertura de Caixa:** Ao iniciar o turno, o atendente deve registar no ecrã "Caixa POS" o fundo de maneio inicial em numerário físico presente na gaveta (Exemplo padrão: 15.000 Kz para trocos).
* **Movimentos Intermédios:** Devem ser lançados reforços de caixa (suprimentos) ou saídas autorizadas (sangrias).
* **Processamento de Fecho:** No final do expediente, o atendente introduz as quantidades de notas e moedas reais contabilizadas. O sistema cruza com os pagamentos digitais (TPA / Multicaixa) e eletrónicos (Express, Transferências), exibindo uma consola com desvios (Quebra ou Sobra).

### 2. REGISTO E SEGMENTAÇÃO DE CLIENTES
Antes de iniciar uma venda ou encomenda de catering, o atendente pode associar a transação a um cliente:
* **Campos Obrigatórios:** Nome do Cliente, NIF (Número de Identificação Fiscal), Contacto Telefónico Principal e Distrito de Luanda.
* **Segurança de Contacto:** Ativar o botão de contacto directo via WhatsApp para notificações em tempo real do estado da encomenda.

### 3. GESTÃO DE PEDIDOS NO POS (SIMPLES, COMPOSTOS E AGENDADOS)
* **Pedido Simples:** Venda imediata de produtos acabados ou bebidas revenda em stock (Exemplo: Água Mineral, Cerveja Cuca). O débito de stock é automático e imediato.
* **Pedido Composto:** Encomendas personalizadas ou de confeção por encomenda (Exemplo: Bolo de Casamento de 3 andares ou Travessa de Bacalhau com Natas). Estes pedidos originam automaticamente uma **Ordem de Produção (OP)** na respetiva cozinha.
* **Pedido Agendado (Eventos Futuros):** Registado para data futura selecionável. O sistema cria e associa um evento correspondente no "Calendário" com o número de convidados, localização de montagem (Ex: Talatona Convention) e dados do catering.

### 4. ALUGUER DE MATERIAIS E ESPAÇOS E SERVIÇOS
No próprio ecrã de criação de faturas, ao selecionar bens do tipo de categoria "Eventos" (Exemplo: Tendas Cristal, Cadeiras Tiffany, Toalhas), o atendente define o período de aluguer. O sistema valida se há quantidade suficiente livre de reservas de outros eventos naquelas datas de agendamento.

### 5. SISTEMA DE PAGAMENTO FLEXÍVEL (PARCIAL E TOTAL)
O sistema aceita múltiplos métodos de pagamento para facilitar a operação de eventos de catering corporativo:
* **Pagamento Total:** Liquidação na hora (Numerário, Cartão TPA ou Transferência com Upload de Comprovativo Bancário). O estado do pedido passa a "Pago" e é encaminhado para faturação definitiva.
* **Pagamento Parcial:** Permite entrada de sinal de adjudicação (Ex: 50% na aprovação e 50% na semana do evento). O sistema cria um registo automático no **Contas a Receber** com o valor pendente associado e data limite de liquidação.

### 6. EMISSÃO DE COMPROVATIVOS E TALÕES
* O sistema gera o recibo estruturado que exibe de forma clara e limpa o cabeçalho comercial da Sabor Imbatível, NIF, Discriminação de Produtos,IVA detalhado, dados do cliente e QR Code descritivo parametrizável.

---

## DOCUMENTO 3 – MANUAL DA COZINHA

**Destinatários:** Chefe de Cozinha, Cozinheiros, Ajudantes de Cozinha.
**Objetivo:** Organizar a produção diária de salgados, refeições quentes e catering para eventos sazonais.

### 1. INTERFACE DA FILA DE PRODUÇÃO DO CHEFE
O ecrã "Produção" atua como uma consola central para o Chefe de Cozinha:
* **Apresentação de Ordens de Produção (OP):** Apresentadas por ordem de prioridade temporal e nível de criticidade do evento.
* **Estados da Produção:**
  1. *Agendado/Pendente:* Ordem aguardando levantamento inicial e liberação de ingredientes.
  2. *Em Produção:* Chefia iniciou a preparação da receita.
  3. *Pronto:* Prato/Salgado finalizado, embalado, etiquetado e pronto para envio logístico ou recolha de balcão.
  4. *Entregue:* Processo de expedição concluído.

### 2. REQUISIÇÕES DE INGREDIENTES E MATÉRIAS PRIMAS
* **Requisição Inicial:** Ao transitar uma OP para "Em Produção", o sistema sugere a recolha padrão de matérias primas calculadas na ficha técnica (Exemplo: Travessa de Bacalhau pede 3kg de Bacalhau de Demolha, 2kg de Batata, óleo e natas).
* **Mecanismo de Aprovação:** A requisição é enviada ao perfil de **Armazém** que faz a validação e posterior entrega física no balcão da cozinha.
* **Requisição Complementar:** Caso ocorra algum desvio ou erro durante a confeção, o Chefe de Cozinha pode lançar diretamente uma requisição complementar justificando a inclusão de ingredientes adicionais (Ex: "Correção de densidade de molho - acrescidos 1kg de farinha e natas").

### 3. CONTROLO DE DESPERDÍCIOS, DEVULOCÕES E PERDAS
A cozinha deve manter o nível mais estrito de controlo de quebras para manter as margens saudáveis da Sabor Imbatível:
* **Devolução de Excedentes:** No fim da confeção das ordens, se houver pacotes fechados não utilizados de ingredientes reutilizáveis, reverte-se o saldo para o armazém através da devolução integrada de insumos.
* **Registo de Desperdício/Quebras:** Caso um lote de bacalhau apresente anomalias organolépticas ou caia ao solo, o cozinheiro deve registar a quebra descrevendo: ID do Produto descartado, quantidade exata, ID da OP afetada e justificação ("Matéria-prima queimada no forno" ou "Sabor inadequado").

---

## DOCUMENTO 4 – MANUAL DA PASTELARIA

**Destinatários:** Chefe de Pastelaria, Pasteleiros, Decoradores de Bolos.
**Objetivo:** Orientar a confeção de fatias, pastelaria fina de vitrine e a montagem e decoração de bolos artísticos de casamento e aniversário.

### 1. RECEÇÃO E PROCESSAMENTO DE ENCOMENDAS ESPECIAIS
Bolos decorados de casamento (Ex: modelo clássico de 3 andares) requerem minuciosidade redobrada e controlo temporal:
* O sistema disponibiliza no ecrã de ordem os pormenores decorativos introduzidos pelo atendimento (Ex: Tipo de recheio, cobertura, cor dos laços, texto da placa descritiva).
* A Pastelaria faz o agendamento de pão-de-ló e bases 24 horas antes do evento de decoração para garantir estabilidade estrutural.

### 2. CONTROLO E GESTÃO DE STOCK DE SECTOR
Diferente da cozinha, a pastelaria frequentemente manipula pequenos volumes de ingredientes caros e altamente perecíveis (morangos frescos, corantes alimentares especiais, natas vegetais batidas, chocolate de cobertura belga):
* O pasteleiro deve fazer a pesagem milimétrica dos ingredientes finos.
* Diariamente, o assistente do setor executa o consumo de insumos correspondente às fementações realizadas. Se ocorrer fusão de coberturas devido a humidade excessiva, o registo de quebra ambiental deve ser devidamente preenchido com a flag "Climatização Inadequada".

### 3. ENCERRAMENTO DE TURNO DA PASTELARIA
Ao fim do dia, as sobras de chantilly e cremes batidos não reaproveitáveis de acordo com a HACCP internacional devem ser contabilizadas como "perda térmica de processo", sendo declaradas na consola de registo de desperdícios para análise de custo real de produção.

---

## DOCUMENTO 5 – MANUAL DO ARMAZÉM

**Destinatários:** Responsáveis de Armazém, Fiel de Armazém, Inventariantes.
**Objetivo:** Garantir a exatidão física dos inventários alimentares e estruturas reutilizáveis de suporte, evitando perdas financeiras por rutura de stock ou deterioração de prazos de validade.

### 1. RECEÇÃO E DOCUMENTO DE ENTRADA DE INSUMOS
* Ao receber mercadoria de fornecedores externos, o Fiel do Armazém confere o artigo com a encomenda inicial da Sabor Imbatível.
* O sistema cria a entrada atualizando o stock no ERP. É obrigatório introduzir o lote correspondente, preço de custo ajustado, e a data de validade dos materiais que entram (Ex: Farinha de Trigo com expiração em 12/2026).

### 2. PROCESSO DE EXPEDIÇÃO E ATENDIMENTO DE REQUISIÇÕES
A principal função interna do armazém é servir os setores operacionais internos (Cozinha, Pastelaria e Logística de Eventos):
* **Fila de Requisições:** O ERP exibe no Menu "Requisições" todos os pedidos emanados pelos chefes de setor.
* **Validação Física:** O fiel recolhe os itens das prateleiras, verifica os lotes de acordo com a política **PEPS / FIFO** (Primeiro que Entra, Primeiro que Sai) para evitar vencimentos, e atualiza o estado para "Entregue". O stock físico na consola central sofre um decréscimo imediato.

### 3. INVENTÁRIO FÍSICO DIÁRIO E FECHO DE BALANÇO MENSAL
* No Menu "Inventário", a equipa do armazém tem acesso a folha para contagem física periódica cega.
* O sistema compara a contagem física anotada pelo fiel com o saldo teórico calculado pelo software de ERP SIGI.
* **Ajustes de Stock:** Se houver divergências justificáveis de perda volátil ou quebras menores, o operador clica em "Ajustar Stock" introduzindo a nova quantidade contada fisicamente. O sistema gerará o respetivo registo de desvio operacional para monitorização da gerência e auditoria de armazém.

### 4. GESTÃO DOS ITENS VENCIDOS E AVARIADOS (ZONA DE QUARENTENA)
* Qualquer produto que atinja o limite do prazo de expiração ou apresente deformação estrutural grave deve ser retirado imediatamente da prateleira ativa de expedição.
* O item é transferido informaticamente na consola para o status de "Quarentena / Danificado" gerando o bloqueio de movimentação. subsequentemente, é feita a conferência para descarte total via relatório de quebras extraordinárias.

---

## DOCUMENTO 6 – MANUAL DO CONTROLADOR DE MATERIAIS

**Destinatários:** Controladores de Equipamento, Gerentes de Logística de Catering.
**Objetivo:** Monitorizar, rastrear, salvaguardar e cobrar os equipamentos reutilizáveis de catering alugados para montagem de banquetes ao ar livre.

### 1. REGISTO DE RESPONSABILIZAÇÃO DE ENVIOS DE MATERIAIS
Todo o material reutilizável de valor patrimonial expressivo (Exemplo: Pratos de Porcelana Fina, Copos de Cristal, Tendas de Alumínio e Cadeiras Tiffany Douradas) é rastreado por ID próprio e lote de inventário:
* **Check-out do Armazém:** No carregamento da viatura de transporte de eventos pela manhã, o Controlador de Materiais regista na consola "Controlo de Materiais" a guia de saída.
* **Declaração de Responsabilidade:** O motorista encarregue assina eletronicamente a lista de material de trânsito.

### 2. MONITORIZAÇÃO DE DANOS, PERDAS E QUEBRAS EM CAMPO
No processo de desmontagem de eventos decorridos, frequentemente ocorrem sinistros com pratos lascados ou copos partidos:
* **Recolha e Inspeção Físicas:** Ao regressar ao Armazém Principal da Sabor Imbatível, o material decorativo é contado e lavado.
* **Lançamento de Ocorrência Técnica:** Se dos 500 copos Tiffany enviados apenas regressaram 480 intactos e 5 destruídos, o Controlador de Materiais abre a consola e cria uma Ocorrência de Inventário de Locação:
  * *Campos:* ID do Evento, ID do Artigo, Quantidade Danificada, Tipo de Dano ("Partilha mecânica em campo"), Estado Devolvido e Justificação.
  * *Ação Financeira:* Caso o sinistro exceda a percentagem de quebra contratual aceite, o sistema gera uma linha automática de faturação extra para imputar o custo de reposição ao cliente organizador do evento no módulo de Contas a Receber.

---

## DOCUMENTO 7 – MANUAL DO MOTORISTA

**Destinatários:** Motoristas Oficiais, Assistentes de Rota e Distribuidores Terrestres.
**Objetivo:** Regular frotas, percursos seguros de entrega de catering em Angola, montagens temporárias e devoluções físicas pós-evento.

### 1. CONSULTA DE ENTREGAS DIÁRIAS E CARREGAMENTO
Cada condutor credenciado tem acesso exclusivamente à sua agenda diária configurada no ecrã de Logística do SIGI ERP:
* **Controlo de Viatura:** O motorista inicia o dia ao verificar qual é o veículo escalonado (Ex: Mercedes Sprinter matrícula `LD-23-45-FG`). Ele anota visualmente o estado de limpeza e combustível do furgão frigorífico.
* **Inspeção de Carregamento:** Confronta a guia logística de carregamento emitida pela cozinha (comida em caixas térmicas celadas) e controlo de materiais (mesa e cadeiras), alterando o estado da entrega no sistema de "Pendente" para "Em Trânsito".

### 2. ROTAS E EXECUÇÃO DE ENTREGAS AO CLIENTE
Ao chegar ao destino da entrega de catering nos distritos de Luanda, Talatona, Benfica ou Viana:
* O motorista verifica os dados exatos de morada e contacto rápido introduzidos pelo atendimento.
* Efetua as descargas juntamente com a equipa operacional de montagem, garantindo a manipulação términa higiénica dos pratos da Sabor Imbatível.
* **Confirmação de Receção de Entrega:** O cliente final inspeciona o prato montado e assina no ecrã do ERP. O motorista fotografa o serviço executado, faz o upload na aplicação de suporte, e fecha o estado da ordem para "Entregue" em tempo real.

### 3. RECOLHAS DE RETORNO E RETORNO SEGURO AO ARMAZÉM
Terminado o banquete de catering agendado (frequentemente à noite ou madrugada):
* A equipa desmonta as tendas e as cadeiras, limpa o espaço do evento de forma irrepreensível e carrega a viatura.
* Ao regressar para a sede da Sabor Imbatível, S.A., o motorista preenche a ficha de chegada, finaliza as milhas, insere a Sprinter em parque e declara a devolução completa das caixas térmicas ao Armazém para o Fiel carimbar a receção operacional.

---

## DOCUMENTO 8 – MANUAL FINANCEIRO

**Destinatários:** Diretor Financeiro, Analistas de Contas, Tesoureiros, Contabilistas.
**Objetivo:** Manter a solvabilidade, controlo rígido de caixa diário, monitorização de faturação, cálculo de margem e elaboração de relatórios estatísticos e gerenciais para a administração.

### 1. FLUXO REGULAR DE CONTAS A RECEBER
* **Origem das Contas:** Todas as faturas criadas no ecrã de atendimento e faturas com pagamento diferido de clientes de catering corporativo geram um registo correspondente no "Contas a Receber".
* **Controlo de Saldos:** A tesouraria analisa as datas de vencimento de faturas para ações de aviso e cobrança de faturas corporativas.
* **Processamento de Liquidação:** Quando o cliente deposita ou efetua transferência multicaixa, o analista financeiro anexa o ficheiro comprovativo na consola, seleciona o registo e define o estado como "Paga" (ou liquidação parcial se houver acordo especial).

### 2. REGISTO E FLUXO DE CONTAS A PAGAR
A saúde económica do ERP exige rastreabilidade fiável das faturas de fornecedores (Exemplo: Fornecedor de farinha Alfa Lda):
* **Lançamento de Despesa:** Lança-se no Menu Financeiro o custo das mercadorias, arrendamentos prediais, combustível ou salários de auxiliares.
* **Alocação de Custo:** Toda a despesa é associada a um Centro de Custo para análise correta do DRE (Exemplo: "Matéria Prima", "Frota de Veículos", "Recursos Humanos" ou "Marketing").

### 3. CONCILIAÇÃO BANCÁRIA E FECHO DE FLUXO DE CAIXA DIÁRIO
Ao final de todos os dias de movimento financeiro:
* O Tesoureiro cruza os extractos de caixa físicos (introduzidos pelos operadores POS de atendimento) com os relatórios fornecidos pelos bancos e TPAs.
* Trata de conciliar as transações eletrónicas com as vendas registadas, gerando correções imediatas de discrepâncias e encerrando o balanço financeiro do ciclo operário corrente.

### 4. GERADOR DE INDICADORES INTERNOS (DRE E FLUXO DE CAIXA)
O SIGI ERP disponibiliza os relatórios de resultados mais avançados:
* **Indicador de Margem de Contribuição:** Exibe a diferença real entre faturamento de prato e o custo da ficha de ingredientes.
* **Evoluções de Faturação Mensal:** Gráficos no Menu "Relatórios" que auxiliam a administração a projetar os meses de maior receita sazonal para casamentos e jantares corporativos.

---

## DOCUMENTO 9 – MANUAL TÉCNICO

**Destinatários:** Desenvolvedores React/Node, Engenheiros de DevOps e Integradores Corporativos.
**Objetivo:** Explicar a arquitetura técnica, modelo hierárquico, endpoints seguros e estrutura de persistência base do SIGI ERP.

### 1. ARQUITETURA GERAL DO SISTEMA
O SIGI ERP é uma aplicação moderna full-stack. O frontend comunica exclusivamente por RESTful JSON APIs com a cama de dados, existindo suporte de WebSocket para alertas instantâneos de stock crítico ou novas ordens recebidas.

```
       [ CLIENT SIDE ]                         [ SERVER SIDE - NODE.JS EXPRESS ]
 +--------------------------+                 +-----------------------------------+
 |   React Vite Application |                 |       Servidor Web Express        |
 |  - TanStack Query (Data) |   REST APIs     |  - Roteamento nativo e Middleware |
 |  - Tailwind CSS (Estilo) | --------------->|  - Servidor de WebSockets (WS)    |
 |  - Lucide (Ícones UI)    | (JSON Over HTTP)|  - Autenticação por JWT Securo    |
 |  - React Context (State) |                 |  - Resolução por ORM / Drizzle    |
 +--------------------------+                 +-----------------------------------+
                                                                |
                                                                v
                                              +-----------------------------------+
                                              |        BASE DE DADOS CLOUD        |
                                              |     - Firestore / PostgreSQL      |
                                              +-----------------------------------+
```

### 2. TECNOLOGIAS E MOTORES DO FRONTEND
* **Framework:** React 18+ gerido com Vite para otimização de bundles estáticos superleves.
* **Controlo de Tipagem:** TypeScript 100% estrito e de tipagem forte para prevenção de bugs e erros de runtime.
* **Gestão de Requests:** TanStack Query (`@tanstack/react-query`) para caching inteligente, invalidação ativa de dados e sincronização fluida pós-transação.
* **Estilização e Responsividade:** Tailwind CSS para flexibilidade de grelhas, media queries responsivas ajustadas para telefones Android e telas de grande dimensão.
* **Animações Fluidas:** Biblioteca `motion` do ecossistema React.
* **Mensagens e Toasts:** React-Toastify para alertas dinâmicos de sucesso/erro.

### 3. ARQUITETURA DE DADOS E PERSISTÊNCIA (FIRESTORE)
Para armazenamento fiável e escalável, o ERP SIGI utiliza uma base de dados estruturada que mimetiza um modelo relacional, em que as coleções base possuem esquemas de validação rígidos construídos na interface:

#### ESQUEMA DE ENTIDADES (TABELAS / COLEÇÕES)

```
                       +-------------------+
                       |    utilizadores   |
                       +-------------------+
                                 | 1
                                 |
                                 | 1..*
                       +-------------------+
                       |      pedidos      |
                       +-------------------+
                                 | 1
                                 |
                                 | 1..*
                       +-------------------+
                       |   itens_pedido    |
                       +-------------------+
                                 | *
                                 |
                                 | 1
                       +-------------------+
                       |  produtos/insumos |
                       +-------------------+
```

#### ESPECIFICAÇÃO COMPLETA DE DATA TRANSFER OBJECTS (DTOs)

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  role: "Administrador" | "Atendimento" | "Cozinha" | "Pastelaria" | "Armazém" | "Motorista";
  status: "Ativo" | "Inativo";
  lastAccess: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  nif: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  district: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  internalCode: string;
  barcode: string;
  category: "Produtos Acabados" | "Revenda" | "Ingredientes";
  subcategory: "Pastelaria" | "Salgados" | "Bebidas" | "Matéria Prima";
  supplier: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  purchasePrice: number;
  salePrice: number;
  registerDate: string;
  updateDate: string;
  status: "Ativo" | "Inativo";
  userId: string;
}

export interface Material {
  id: string;
  name: string;
  code: string;
  category: string;
  type: "Reutilizável" | "Descartável";
  quantity: number;
  available: number;
  reserved: number;
  status: "Disponível" | "Manutenção" | "Indisponível";
  location: string;
  unitValue: number;
  acquisitionDate: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  type: "Simples" | "Composto";
  status: "Agendado" | "Confirmado" | "Em Produção" | "Pronto" | "Entregue";
  items: OrderItem[];
  dueDate: string;
  total: number;
  notes?: string;
}

export interface Event {
  id: string;
  name: string;
  clientId: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  status: "Agendado" | "Em Andamento" | "Concluído" | "Cancelado";
  notes?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  eventId?: string;
  driverId: string;
  vehicleId: string;
  departureDate?: string;
  arrivalDate?: string;
  status: "Pendente" | "Em Trânsito" | "Entregue";
}

export interface Requisition {
  id: string;
  sector: "Cozinha" | "Pastelaria" | "Armazém";
  manager: string;
  type: "Inicial" | "Complementar";
  status: "Pendente" | "Aprovada" | "Entregue" | "Concluída";
  date: string;
  notes?: string;
}

export interface FinancialRecord {
  id: string;
  type: "Receita" | "Despesa";
  category: string;
  amount: number;
  date: string;
  status: "Pendente" | "Pago";
  description: string;
  referenceId?: string; // Link para Order ID, Requisition ID, etc.
}

export interface AuditLog {
  id: string;
  userId: string;
  date: string;
  action: string;
  entity: string;
  details?: string;
}
```

### 4. ENDPOINTS E APIS SEGUROS DO BACKEND (PROXIED REST)
O servidor expõe unicamente recursos através de endpoints seguros `/api/*`. No ambiente de produção, todas as rotas de escrita exigem cabeçalho `Authorization: Bearer <JWT_TOKEN>`.

#### UTULIZADORES & AUTENTICAÇÃO
* `POST /api/auth/login`: Autentica utilizador, gera token de acesso JWT e inicia sessão de cookies seguros.
* `POST /api/auth/logout`: Revoga token de segurança atual, expira cookies e regista atividade no log de auditoria.
* `GET /api/users`: Lista todos os colaboradores (Exige perfilAdministrador).
* `POST /api/users`: Cria novo colaborador.

#### FLUXO COMERCIAL & PEDIDOS (POS)
* `GET /api/orders`: Obtém a lista consolidada de faturas e encomendas emitidas. Suporta paginação, ordenação e filtros por status e cliente.
* `POST /api/orders`: Submete um novo pedido composto ou simples. Se for composto, lança a Ordem de Produção de forma assíncrona.
* `PUT /api/orders/:id`: Corrige dados de faturação ou muda estado (Pronto, Confirmado).
* `PUT /api/orders/:id/status`: Rota restrita para kitchen displays mudarem estado de confecção rápida.

#### INVENTÁRIO & STOCK DE INSUMOS
* `GET /api/products`: Lista de insumos e produtos para venda.
* `POST /api/products`: Registo de novas fementações ou lotes de matéria prima.
* `PUT /api/products/:id`: Atualização física de balanços por inventário manual.

#### REQUISIÇÕES DE RECEITUÁRIOS
* `GET /api/requisitions`: Lista requisições de ingredientes.
* `POST /api/requisitions`: Cozinha ou Pastelaria solicita trigo, açúcar ou ovos ao armazém central.
* `PUT /api/requisitions/:id/status`: Transita status para "Entregue" descarregando do stock real do armazém.

---

## DOCUMENTO 10 – PLANO DE SALVAGUARDA (BACKUP)

**Destinatários:** Administradores de Sistemas, DBA, Diretor de TI.
**Objetivo:** Proteger a integridade absoluta de transações comerciais, dados fiscais e inventário físico face a corrupções de disco ou exclusões acidentais.

### 1. POLÍTICA GERAL DE RETENÇÃO E COPÓLOGOS
Qualquer operação executada no SIGI ERP da Sabor Imbatível é considerada de alta prioridade corporativa. A política estabelece três níveis de salvaguarda de dados:

```
                  +----------------------------------------------+
                  |         ESTRATEGIA POLÍTICA DE BACKUPS       |
                  +----------------------------------------------+
                                         |
                  +----------------------+----------------------+
                  |                      |                      |
                  v                      v                      v
        [ DIÁRIOS (INCREMENTAL) ]    [ SEMANAIS (COMPLETOS) ] [ MENSAL (ETERNOS/FRIO) ]
        - Retenção: 30 dias          - Retenção: 90 dias      - Retenção: 7 anos (Fiscl)
        - Local: Cloud Hot Storage   - Local: Cloud Storage   - Local: Cold Vault/Offline
```

* **Backups Diários (Incrementais):** Armazenamento em Cloud Hot Storage, executado automaticamente às 23:59:00h de Luanda. Retenção ativa de 30 dias.
* **Backups Semanais (Completos):** Executado aos domingos às 02h da manhã. Retenção ativa de 90 dias.
* **Backups Mensais / Históricos:** Executados no dia 1 de cada mês. Retenção fiscal obrigatória de 7 anos em Armazenamento Frio (Cold Vault/Glacier e cópia em disco físico offline na sede administrativa).

### 2. MECANISMOS DE EXECUÇÃO AUTOMÁTICA
O processo de backup é orquestrado por tarefas cron agendadas no container de aplicação. O script realiza:
1. Bloqueio temporário de transações de escrita (Janela de 2 segundos).
2. Exportação integral das coleções correspondentes do Firestore em arquivo JSON estruturado / PostgreSQL dump.
3. Compactação do arquivo resultante usando compressão GZIP de alta eficiência (`gzip -9`).
4. Criptografia simétrica com chave pública AES-256.
5. Upload do ficheiro criptografado para o bucket seguro da GCP Cloud Storage com autenticação baseada em Service Accounts exclusivas de cópia de segurança.
6. Notificação automática via Webhook para o Administrador declarando sucesso ou falha da rotina diária.

### 3. PROTOCOLO DE RECUPERAÇÃO DE INFORMAÇÕES (RESTORE)
Se for identificada uma falha crítica ou exclusão indevida de registos cruciais:
1. O Administrador identifica o último ponto seguro no histórico de backups (RPO - Recovery Point Objective de no máximo 24 horas).
2. Clona o bucket de salvaguarda temporariamente num ambiente isolado sandbox.
3. Descomprime e decodifica o payload de segurança com a chave privada mestre custodiada offline.
4. Executa o utilitário de restauro de bases de dados do SIGI ERP para reconstituir os dados corrompidos.
5. Invalida as caches ativas da aplicação React (`TanStack Query`) forçando o recarregamento imediato de todos os utilizadores ligados para evitar falsas leituras em memória cache anterior.

### 4. TESTES PERIÓDICOS DE RESTAURO (SIMULACROS)
A cada trimestre, no primeiro sábado útil às 14:00h, a equipa de TI executa obrigatoriamente um simulacro completo de catástrofe com recuperação total dos dados em ambiente isolado de testes. O sucesso do restauro deve ser documentado em relatório interno, avaliando o tempo decorrido do processo de reativação de rotinas comerciais.

---

## DOCUMENTO 11 – PLANO DE RECUPERAÇÃO DE DESASTRES

**Destinatários:** Administradores de Sistemas, Diretores Executivos, Líderes de Turno.
**Objetivo:** Manter a resiliência operacional contínua e garantir a rápida restauração dos serviços da Sabor Imbatível perante falhas graves de hardware, conectividade de internet, energia elétrica ou avarias de infraestrutura.

### 1. MATRIZ DE AVALIAÇÃO DE CRITICIDADE E TEMPOS DE REAÇÃO (RTO/RPO)

| Categoria do Desastre | RTO Máximo (Tempo de Recuperação) | RPO Máximo (Perda Aceitável de Dados) | Procedimento de Mitigação Inicial Primário |
| :--- | :--- | :--- | :--- |
| **Falha Total Cloud Run / Servidor** | 15 minutos | 0 minutos | Redirecionamento de DNS Automático / Failover Ativo de Container. |
| **Queda de Conectividade Internet** | Instantâneo | 0 minutos | Ativação automática de Router Móvel 4G/5G de Backup (Unitel/Movicel). |
| **Queda de Energia Elétrica Sede** | 2 minutos | 0 minutos | Ativação do Gerador de Emergência a Diesel & Unidades de UPS de Lojas. |
| **Corrupção Crítica de Dados** | 30 minutos | 24 horas | Execução de Protocolo de Restauro Completo do Backup da Noite Anterior. |
| **Falha Física de Balanças / TPA**| 5 minutos | 0 minutos | Ativação imediata de aparelhos de substituição pré-configurados do armazém. |

### 2. PROTOCOLO DE FLUXO ALTERNATIVO DE FALHA DE INTERNET (OFFLINE TEMPORÁRIO)
Se o sistema web central ou o serviço cloud ficarem indisponíveis face a roturas de comunicações em Luanda:
1. **Registo em Bloco Físico Emergencial:** O Atendimento do Caixa POS e a Cozinha utilizam blocos físicos de faturas de contingência devidamente tipificados nos procedimentos internos.
2. Todas as horas de entrega e pagamentos em numerário ou comprovativos de TPA físicos são anotados com carimbo temporal.
3. **Mecanismo de Sincronização Posterior:** Reestabelecida a conectividade física de internet fibra/rede móvel, o Chefe de Turno de Caixa procede ao lançamento manual retroativo de faturamentos e deduções de produtos, ajustando os stocks físicos para garantir a auditoria de fim de ciclo de caixa.

### 3. PLANO DE FALHA ELÉTRICA E SALVAGUARDA DE COZINHAS FRIGORÍFICAS
Mais de metade do património operacional da Sabor Imbatível é mantido sob refrigeração de frio de conservação no armazém (matérias primas refrigeradas, recheios finos de bolo):
1. **Gerador Automático:** A Sede possui um sistema autocarregável a diesel de 100kVA que arranca automaticamente após 10 segundos de interrupção de fornecimento da rede pública.
2. **UPS Dedicadas:** Todos os computadores do POS de atendimento e controladores de cozinha estão acoplados a UPS ativas que aguentam as consolas ligadas sem quebra por 20 minutos, tempo mais do que suficiente para gravação segura e logout ordenado por utilizadores.

---

## DOCUMENTO 12 – GUIA DE IMPLANTAÇÃO DA PLATAFORMA

**Destinatários:** DevOps Engineers, SysAdmins, Integradores.
**Objetivo:** Fornecer o roteiro e comandos exatificados para instalar, testar e publicar a infraestrutura do SIGI ERP em ambiente produtivo.

### 1. PRÉ-REQUISITOS AMBIENTAIS DE SISTEMA LINUX/CLOUD
A plataforma foi modularizada para fácil implantação em containers escaláveis do ecossistema Linux Moderno:
* **Sistema de Containers:** Docker versão 24.0+ e Docker Compose V2.
* **Ambiente de Runtime:** Node.js v18.18+ LTS (para bundlers de Frontend / Express / TypeScript backend).
* **Motor de Base de Dados:** Instância Cloud Firestore ou cluster PostgreSQL redundante.
* **Servidor Reversivo / Proxy de Entrada:** Nginx 1.25+ com certificados de segurança SSL Let's Encrypt geridos.

### 2. VARIÁVEIS DE AMBIENTE OPERACIONAIS (`.env`)
Antes de iniciar o build da infraestrutura, crie o arquivo `.env` na raiz respeitando a seguinte nomenclatura de produção:

```env
# CONFIGURAÇÕES DA REDE E INGRESSO DO CONTAINER
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# SECRETS DE SEGURANÇA E JWT (MUDAR AMBIENTE EM PRODUÇÃO)
JWT_SECRET=Sabor_Imbativel_Secured_2026_ERP_Mestre@777
TOKEN_EXPIRATION_HOURS=8

# INSTÂNCIAS DAS CONTAS CLOUD FIREBASE / FIRESTORE (Se Aplicável)
FIREBASE_PROJECT_ID=sigi-erp-sabor-imbativel
FIREBASE_CLIENT_EMAIL=sigi-admin@sigi-erp-sabor-imbativel.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n"

# VARIÁVEIS PUBLICAS DO COMPILADOR DE FRONTEND VITE (CLIENT)
VITE_API_BASE_URL=https://sigi-api.saborimbativel.com
VITE_COMPANY_NAME="Sabor Imbatível, S.A."
VITE_CONTROLE_NOTIFICACOES_SECS=30
```

### 3. ROTINA PASSO A PASSO DE COMPILAÇÃO E DOCKERIZAÇÃO
Para colocar o sistema online em ambiente corporativo a partir do terminal de comando seguro:

```bash
# 1. Obter código fonte do repositório estável de homologação
git clone https://github.com/saborimbativel/sigi-erp.git /opt/sigi-erp
cd /opt/sigi-erp

# 2. Instalação e verificação de integridade de dependências npm
npm ci

# 3. Compilação das rotinas e interfaces estáticas com bundler Vite
# Isso criará a árvore optimizada e compactada dentro da pasta /dist
npm run build

# 4. Construção e subida em segundo plano das instâncias por Docker Compose
docker-compose up --build -d

# 5. Validação se o container está a escutar perfeitamente na porta 3000
curl -f http://localhost:3000/api/health
```

### 4. CONFIGURAÇÃO HTTPS NGINX COM ROTEAMENTO REVERSIVO
Abaixo está o arquivo de configuração `/etc/nginx/sites-available/sigi-erp.conf` para redirecionamento SSL seguro obrigatório:

```nginx
server {
    listen 80;
    server_name sigi-erp.saborimbativel.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sigi-erp.saborimbativel.com;

    ssl_certificate /etc/letsencrypt/live/sigi-erp.saborimbativel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sigi-erp.saborimbativel.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Compressão de payloads estatísticos para aumento de velocidade de carregamento
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## DOCUMENTO 13 – CHECKLIST DE GO-LIVE

**Destinatários:** Diretores do Projeto, Gestores de TI, Chefia Operacional.
**Objetivo:** Roteiro formal de checkpoints de homologação crítica a concluir antes da migração final de entrada em produção para as equipas operacionais com transações financeiras reais da Sabor Imbatível.

### QUADRO DE HOMOLOGAÇÃO CRÍTICA (CONFORMIDADE)

```
[INFRAESTRUTURA] ---> [BASE DE DADOS] ---> [SEGURANÇA RBAC] ---> [PLANO DE RESTAUR] ---> GO-LIVE!
   (Concluída)           (Sincronizada)          (Bloqueada)           (Validado)
```

O Go-Live do SIGI ERP exige o cumprimento militar das fases de validação abaixo descritas sem falhas toleradas:

### **FASE A: CHECKLIST DE INFRAESTRUTURA E CONECTIVIDADE**
* [ ] **A.1:** Domínio corporativo `sigi-erp.saborimbativel.com` devidamente apontado para os IPs públicos da Cloud Run / Servidor Produtivo.
* [ ] **A.2:** Certificados digitais SSL Let's Encrypt ativados e validados no navegador (Cadeado azul / Sem avisos de conteúdo misto).
* [ ] **A.3:** Velocidade média de carregamento da aplicação em Luanda em redes 4G abaixo de 3 segundos de resposta inicial.
* [ ] **A.4:** Roteadores de contingência Unitel 4G configurados e testados no balcão de atendimento e POS de Luanda.

### **FASE B: CHECKLIST DE BASE DE DADOS E CONFIGURAÇÕES INICIAIS**
* [ ] **B.1:** Execução do reset completo das coleções da DB contendo dados fictícios ou simulações anteriores para garantir base limpa de operação.
* [ ] **B.2:** Loteamento ativo e carregamento de fichas técnicas de produtos de Pastelaria e Salgados revisados pelos respetivos chefes.
* [ ] **B.3:** Entrada física inicial de todos os equipamentos de locação (cadeiras, tendas) de acordo com o inventário carimbado pelo Controlador de Materiais.
* [ ] **B.4:** Configuração da alíquota padrão de IVA atualizada de acordo com o regime fiscal em vigor em Angola.

### **FASE C: VALIDAÇÃO DE SEGURANÇA E ACESSOS OPERACIONAIS**
* [ ] **C.1:** Cadastro de e-mails oficiais de toda a equipa (Ana Atendimento, Carlos Chefe, Marta Pasteleira, João Armazém, Pedro Motorista) com alteração obrigatória de pass padrão no primeiro acesso.
* [ ] **C.2:** Proteção ativa de rotas: validação manual em browser simulando motorista tentando aceder ao menu Financeiro (Acesso bloqueado com aviso ou redirecionamento de tela automático).
* [ ] **C.3:** Encerramento automático de sessão sem atividade inativa superior a 60 minutos ativado.

### **FASE D: CHECKLIST DE SAÚDE FINANCEIRA E AUDITORIA**
* [ ] **D.1:** Fluxo de sangria e suprimentos do ecrã de "Caixa POS" verificado para evitar corrupção de fechamento operacional.
* [ ] **D.2:** Linhas de registo automático no Contas a Receber gerando status correspondentes após adjudicação fictícia inicial na tesouraria.
* [ ] **D.3:** Logs de auditoria acumulando todas as modificações nas entidades críticas por data, hora e de caráter imutável.

### **FASE E: COMISSÃO DE GO-LIVE E CONFORTO DE PESSOAL (FORMAÇÃO)**
* [ ] **E.1:** Formação técnica com avaliação prática das equipas de atendimento sobre registo de pedidos compostos e locações.
* [ ] **E.2:** Formação do setor de armazém sobre recepção PEPS/FIFO e reconciliação de contagens divergentes de inventário.
* [ ] **E.3:** Termo de aprovação final do Go-Live assinado formalmente pela Administração Executiva da **Sabor Imbatível, S.A.** libertando o sistema para utilização em produção real de comércio.
