-- SIGI canonical schema (generated from backend/app/models).
-- Install on an empty MySQL 8+ database before starting the API.
-- The API performs no DDL or automatic migrations at runtime.
CREATE DATABASE IF NOT EXISTS sigi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sigi_db;


CREATE TABLE armazens (
	codigo VARCHAR(50) NOT NULL,
	nome VARCHAR(100) NOT NULL,
	localizacao VARCHAR(255),
	descricao TEXT,
	principal BOOL NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_armazens PRIMARY KEY (id),
	CONSTRAINT uq_armazens_codigo UNIQUE (codigo)
)

;


CREATE TABLE auditoria (
	id INTEGER NOT NULL AUTO_INCREMENT,
	utilizador_id INTEGER,
	ip VARCHAR(45),
	modulo VARCHAR(100),
	entidade VARCHAR(100),
	registo_id INTEGER,
	operacao VARCHAR(50) NOT NULL,
	valor_anterior JSON,
	valor_novo JSON,
	justificativa TEXT,
	data_hora DATETIME NOT NULL,
	CONSTRAINT pk_auditoria PRIMARY KEY (id)
)

;


CREATE TABLE caixas (
	numero VARCHAR(50) NOT NULL,
	data_abertura DATETIME NOT NULL,
	data_fecho DATETIME,
	valor_inicial NUMERIC(12, 2),
	valor_final NUMERIC(12, 2),
	utilizador_abertura_id INTEGER NOT NULL,
	utilizador_fecho_id INTEGER,
	estado ENUM('ABERTO','FECHADO'),
	valor_declarado_dinheiro NUMERIC(12, 2),
	valor_declarado_transferencia NUMERIC(12, 2),
	valor_declarado_pos NUMERIC(12, 2),
	valor_esperado_dinheiro NUMERIC(12, 2),
	valor_esperado_transferencia NUMERIC(12, 2),
	valor_esperado_pos NUMERIC(12, 2),
	diferenca_dinheiro NUMERIC(12, 2),
	diferenca_transferencia NUMERIC(12, 2),
	diferenca_pos NUMERIC(12, 2),
	explicacao_divergencia TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_caixas PRIMARY KEY (id),
	CONSTRAINT uq_caixas_numero UNIQUE (numero)
)

;


CREATE TABLE categorias_produto (
	nome VARCHAR(100) NOT NULL,
	descricao TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_categorias_produto PRIMARY KEY (id)
)

;


CREATE TABLE centros_custo (
	nome VARCHAR(100) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_centros_custo PRIMARY KEY (id),
	CONSTRAINT uq_centros_custo_nome UNIQUE (nome)
)

;


CREATE TABLE checklists_entregas (
	id INTEGER NOT NULL AUTO_INCREMENT,
	entrega_id INTEGER NOT NULL,
	tipo VARCHAR(50) NOT NULL,
	item VARCHAR(255) NOT NULL,
	validado BOOL,
	observacao TEXT,
	CONSTRAINT pk_checklists_entregas PRIMARY KEY (id)
)

;


CREATE TABLE clientes (
	nome VARCHAR(100) NOT NULL,
	empresa VARCHAR(100),
	nif VARCHAR(20),
	telefone VARCHAR(20),
	whatsapp VARCHAR(20),
	email VARCHAR(100),
	morada TEXT,
	observacoes TEXT,
	percentagem_desconto_padrao NUMERIC(5, 2),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_clientes PRIMARY KEY (id),
	CONSTRAINT uq_clientes_nif UNIQUE (nif)
)

;


CREATE TABLE consumos_ingredientes (
	id INTEGER NOT NULL AUTO_INCREMENT,
	ordem_producao_id INTEGER NOT NULL,
	ingrediente_id INTEGER,
	produto_consumivel_id INTEGER,
	quantidade_prevista NUMERIC(10, 3) NOT NULL,
	quantidade_consumida NUMERIC(10, 3),
	data_consumo DATETIME,
	CONSTRAINT pk_consumos_ingredientes PRIMARY KEY (id)
)

;


CREATE TABLE contas_pagar (
	fornecedor_id INTEGER,
	descricao VARCHAR(255) NOT NULL,
	valor NUMERIC(12, 2) NOT NULL,
	vencimento DATE NOT NULL,
	estado ENUM('ABERTA','PARCIAL','PAGA','ATRASADA'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_contas_pagar PRIMARY KEY (id)
)

;


CREATE TABLE contas_receber (
	cliente_id INTEGER,
	pedido_id INTEGER,
	evento_id INTEGER,
	venda_id INTEGER,
	valor_original NUMERIC(12, 2) NOT NULL,
	valor_pago NUMERIC(12, 2),
	saldo NUMERIC(12, 2) NOT NULL,
	vencimento DATE NOT NULL,
	estado ENUM('ABERTA','PARCIAL','PAGA','ATRASADA'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_contas_receber PRIMARY KEY (id)
)

;


CREATE TABLE despesas (
	categoria ENUM('FORNECEDOR','COMBUSTIVEL','SALARIO','ENERGIA','AGUA','INTERNET','MANUTENCAO','OUTROS') NOT NULL,
	valor NUMERIC(12, 2) NOT NULL,
	descricao VARCHAR(255),
	data_despesa DATE NOT NULL,
	centro_custo_id INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_despesas PRIMARY KEY (id)
)

;


CREATE TABLE devolucoes_materiais (
	id INTEGER NOT NULL AUTO_INCREMENT,
	requisicao_id INTEGER NOT NULL,
	material_id INTEGER NOT NULL,
	quantidade_entregue NUMERIC(10, 3) NOT NULL,
	quantidade_devolvida NUMERIC(10, 3),
	quantidade_danificada NUMERIC(10, 3),
	quantidade_perdida NUMERIC(10, 3),
	data_devolucao DATETIME NOT NULL,
	observacao TEXT,
	CONSTRAINT pk_devolucoes_materiais PRIMARY KEY (id)
)

;


CREATE TABLE empresa (
	nome VARCHAR(150) NOT NULL,
	nif VARCHAR(50),
	licenca_empresa VARCHAR(100),
	licenca_aplicacao VARCHAR(100),
	endereco_web VARCHAR(150),
	utiliza_iva BOOL,
	correio_eletronico VARCHAR(150),
	telefone VARCHAR(50),
	telemoveis VARCHAR(100),
	localizacao VARCHAR(255),
	logo VARCHAR(255),
	moeda VARCHAR(10),
	tipo_formato_impressao VARCHAR(50),
	numero_whatsapp VARCHAR(50),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_empresa PRIMARY KEY (id)
)

;


CREATE TABLE entregas (
	numero VARCHAR(50) NOT NULL,
	pedido_id INTEGER,
	evento_id INTEGER,
	motorista_id INTEGER NOT NULL,
	viatura_id INTEGER NOT NULL,
	data_saida DATE,
	hora_saida TIME,
	data_entrega DATE,
	hora_entrega TIME,
	estado ENUM('AGENDADA','EM_TRANSITO','ENTREGUE','RECOLHIDA','CANCELADA'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_entregas PRIMARY KEY (id),
	CONSTRAINT uq_entregas_numero UNIQUE (numero)
)

;


CREATE TABLE entregas_requisicao (
	id INTEGER NOT NULL AUTO_INCREMENT,
	requisicao_id INTEGER NOT NULL,
	armazem_responsavel_id INTEGER NOT NULL,
	data_entrega DATE NOT NULL,
	hora_entrega TIME NOT NULL,
	observacao TEXT,
	CONSTRAINT pk_entregas_requisicao PRIMARY KEY (id)
)

;


CREATE TABLE equipas_cadastro (
	nome VARCHAR(100) NOT NULL,
	departamento VARCHAR(100),
	descricao TEXT,
	custo_sugerido NUMERIC(10, 2),
	preco_sugerido NUMERIC(10, 2),
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_equipas_cadastro PRIMARY KEY (id)
)

;


CREATE TABLE espacos (
	nome VARCHAR(100) NOT NULL,
	capacidade INTEGER NOT NULL,
	localizacao VARCHAR(255),
	descricao TEXT,
	preco_aluguer NUMERIC(10, 2),
	estado ENUM('Ativo','Inativo'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_espacos PRIMARY KEY (id)
)

;


CREATE TABLE eventos (
	numero VARCHAR(50) NOT NULL,
	cliente_id INTEGER,
	pedido_id INTEGER,
	responsavel_id INTEGER,
	tipo_evento VARCHAR(100) NOT NULL,
	titulo VARCHAR(100) NOT NULL,
	descricao TEXT,
	local_evento VARCHAR(255),
	data_evento DATE NOT NULL,
	hora_inicio TIME NOT NULL,
	hora_fim TIME NOT NULL,
	numero_convidados INTEGER NOT NULL,
	numero_convidados_confirmados INTEGER,
	estado VARCHAR(50),
	observacoes TEXT,
	cobrar_iva_servicos BOOL,
	taxa_iva_servicos NUMERIC(10, 2),
	desconto_total NUMERIC(10, 2),
	valor_deslocacao NUMERIC(10, 2),
	outros_encargos NUMERIC(10, 2),
	valor_total NUMERIC(10, 2),
	valor_pago NUMERIC(10, 2),
	saldo NUMERIC(10, 2),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_eventos PRIMARY KEY (id),
	CONSTRAINT uq_eventos_numero UNIQUE (numero)
)

;


CREATE TABLE eventos_equipas (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	utilizador_id INTEGER NOT NULL,
	funcao ENUM('Chefe Cozinha','Cozinheiro','Pasteleiro','Atendimento','Bar','Motorista','Supervisor') NOT NULL,
	estado VARCHAR(50),
	CONSTRAINT pk_eventos_equipas PRIMARY KEY (id)
)

;


CREATE TABLE eventos_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	tipo_item VARCHAR(50) NOT NULL,
	referencia_id INTEGER,
	produto_id INTEGER,
	descricao VARCHAR(255) NOT NULL,
	quantidade NUMERIC(10, 2) NOT NULL,
	unidade VARCHAR(50),
	preco_unitario NUMERIC(10, 2) NOT NULL,
	percentual_desconto NUMERIC(10, 2),
	valor_desconto NUMERIC(10, 2),
	taxa_iva NUMERIC(10, 2),
	valor_iva NUMERIC(10, 2),
	subtotal NUMERIC(10, 2),
	total NUMERIC(10, 2),
	observacoes TEXT,
	sugestao_politica_id INTEGER,
	sugestao_origem VARCHAR(255),
	CONSTRAINT pk_eventos_itens PRIMARY KEY (id)
)

;


CREATE TABLE eventos_servicos (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	tipo ENUM('Cozinha','Pastelaria','Bar','Logistica','Aluguer','Limpeza','Seguranca','Ornamentacao','Decoracao','Empregados de mesa','Bartenders','Cozinheiros','Motoristas','Outro') NOT NULL,
	descricao VARCHAR(255),
	quantidade NUMERIC(10, 2) NOT NULL,
	valor_unitario NUMERIC(10, 2) NOT NULL,
	deslocacao NUMERIC(10, 2),
	subtotal NUMERIC(10, 2) NOT NULL,
	observacoes TEXT,
	CONSTRAINT pk_eventos_servicos PRIMARY KEY (id)
)

;


CREATE TABLE fechos_diarios (
	data DATE NOT NULL,
	total_vendas NUMERIC(12, 2),
	total_recebido NUMERIC(12, 2),
	total_despesas NUMERIC(12, 2),
	total_caixas NUMERIC(12, 2),
	observacoes TEXT,
	criado_por INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_fechos_diarios PRIMARY KEY (id),
	CONSTRAINT uq_fechos_diarios_data UNIQUE (data)
)

;


CREATE TABLE fichas_tecnicas (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	descricao TEXT,
	tipo ENUM('COZINHA','PASTELARIA') NOT NULL,
	produto_acabado_id INTEGER NOT NULL,
	tempo_producao_minutos INTEGER,
	rendimento NUMERIC(10, 2),
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_fichas_tecnicas PRIMARY KEY (id),
	CONSTRAINT uq_fichas_tecnicas_codigo UNIQUE (codigo)
)

;


CREATE TABLE fichas_tecnicas_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	ficha_tecnica_id INTEGER NOT NULL,
	ingrediente_id INTEGER NOT NULL,
	quantidade NUMERIC(10, 3) NOT NULL,
	unidade VARCHAR(20) NOT NULL,
	observacao VARCHAR(255),
	CONSTRAINT pk_fichas_tecnicas_itens PRIMARY KEY (id)
)

;


CREATE TABLE formas_pagamento (
	nome VARCHAR(100) NOT NULL,
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_formas_pagamento PRIMARY KEY (id),
	CONSTRAINT uq_formas_pagamento_nome UNIQUE (nome)
)

;


CREATE TABLE fornecedores (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	nif VARCHAR(20),
	email VARCHAR(100),
	telefone VARCHAR(20),
	morada TEXT,
	contacto_principal VARCHAR(100),
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_fornecedores PRIMARY KEY (id),
	CONSTRAINT uq_fornecedores_codigo UNIQUE (codigo),
	CONSTRAINT uq_fornecedores_nif UNIQUE (nif)
)

;


CREATE TABLE ingrediente_stock_armazem (
	ingrediente_id INTEGER NOT NULL,
	armazem_id INTEGER NOT NULL,
	stock_atual NUMERIC(10, 3) NOT NULL,
	stock_minimo NUMERIC(10, 3) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_ingrediente_stock_armazem PRIMARY KEY (id),
	CONSTRAINT uq_ingrediente_armazem_stock UNIQUE (ingrediente_id, armazem_id)
)

;


CREATE TABLE ingredientes (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	categoria VARCHAR(100),
	unidade_medida VARCHAR(20) NOT NULL,
	stock_atual NUMERIC(10, 3),
	stock_minimo NUMERIC(10, 3),
	stock_maximo NUMERIC(10, 3),
	validade DATE,
	preco_compra NUMERIC(10, 2),
	observacoes TEXT,
	fornecedor_id INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_ingredientes PRIMARY KEY (id),
	CONSTRAINT uq_ingredientes_codigo UNIQUE (codigo)
)

;


CREATE TABLE inventario_contagem_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	inventario_id INTEGER NOT NULL,
	produto_id INTEGER NOT NULL,
	stock_sistema NUMERIC(10, 3) NOT NULL,
	stock_real NUMERIC(10, 3) NOT NULL,
	diferenca NUMERIC(10, 3) NOT NULL,
	justificativa TEXT,
	CONSTRAINT pk_inventario_contagem_itens PRIMARY KEY (id)
)

;


CREATE TABLE inventario_items (
	id INTEGER NOT NULL AUTO_INCREMENT,
	inventario_id INTEGER NOT NULL,
	tipo_item ENUM('INGREDIENTE','MATERIAL','PRODUTO') NOT NULL,
	referencia_id INTEGER NOT NULL,
	quantidade_sistema NUMERIC(12, 2) NOT NULL,
	quantidade_contada NUMERIC(12, 2) NOT NULL,
	diferenca NUMERIC(12, 2) NOT NULL,
	justificativa VARCHAR(255),
	CONSTRAINT pk_inventario_items PRIMARY KEY (id)
)

;


CREATE TABLE inventarios (
	numero VARCHAR(50) NOT NULL,
	tipo ENUM('GERAL','PARCIAL') NOT NULL,
	estado ENUM('RASCUNHO','CONCLUIDO','CANCELADO'),
	data_inicio DATETIME NOT NULL,
	data_fim DATETIME,
	observacoes TEXT,
	utilizador_id INTEGER NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_inventarios PRIMARY KEY (id),
	CONSTRAINT uq_inventarios_numero UNIQUE (numero)
)

;


CREATE TABLE inventarios_contagem (
	data_contagem DATETIME NOT NULL,
	responsavel_id INTEGER NOT NULL,
	estado ENUM('RASCUNHO','CONCLUIDO','CANCELADO'),
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_inventarios_contagem PRIMARY KEY (id)
)

;


CREATE TABLE itens_pedido (
	pedido_id INTEGER NOT NULL,
	tipo_item VARCHAR(50) NOT NULL,
	produto_id INTEGER,
	descricao VARCHAR(255),
	quantidade NUMERIC(10, 2) NOT NULL,
	preco_unitario NUMERIC(10, 2) NOT NULL,
	desconto NUMERIC(10, 2),
	taxa_iva_id INTEGER,
	taxa_iva NUMERIC(5, 2),
	valor_iva NUMERIC(10, 2),
	subtotal NUMERIC(10, 2) NOT NULL,
	total NUMERIC(10, 2) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_itens_pedido PRIMARY KEY (id)
)

;


CREATE TABLE log_acessos (
	id INTEGER NOT NULL AUTO_INCREMENT,
	utilizador_id INTEGER,
	ip VARCHAR(45),
	user_agent VARCHAR(255),
	data_login DATETIME NOT NULL,
	data_logout DATETIME,
	sucesso BOOL,
	CONSTRAINT pk_log_acessos PRIMARY KEY (id)
)

;


CREATE TABLE log_erros (
	id INTEGER NOT NULL AUTO_INCREMENT,
	tipo VARCHAR(100) NOT NULL,
	mensagem TEXT NOT NULL,
	stacktrace TEXT,
	rota VARCHAR(255),
	utilizador_id INTEGER,
	data_hora DATETIME NOT NULL,
	CONSTRAINT pk_log_erros PRIMARY KEY (id)
)

;


CREATE TABLE materiais (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	categoria VARCHAR(100),
	tipo ENUM('REUTILIZAVEL','CONSUMIVEL') NOT NULL,
	quantidade_total NUMERIC(10, 2),
	quantidade_disponivel NUMERIC(10, 2),
	quantidade_reservada NUMERIC(10, 2),
	estado ENUM('DISPONIVEL','RESERVADO','EM_USO','DANIFICADO','MANUTENCAO'),
	ativo BOOL,
	valor_unitario NUMERIC(10, 2),
	unidade_medida_id INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_materiais PRIMARY KEY (id),
	CONSTRAINT uq_materiais_codigo UNIQUE (codigo)
)

;


CREATE TABLE material_stock_armazem (
	material_id INTEGER NOT NULL,
	armazem_id INTEGER NOT NULL,
	stock_atual NUMERIC(10, 3) NOT NULL,
	stock_minimo NUMERIC(10, 3) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_material_stock_armazem PRIMARY KEY (id),
	CONSTRAINT uq_material_armazem_stock UNIQUE (material_id, armazem_id)
)

;


CREATE TABLE motoristas (
	nome VARCHAR(100) NOT NULL,
	telefone VARCHAR(20),
	carta_conducao VARCHAR(50),
	validade_carta DATE,
	estado ENUM('ATIVO','INATIVO'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_motoristas PRIMARY KEY (id)
)

;


CREATE TABLE movimentacoes_armazem (
	tipo ENUM('ENTRADA','SAIDA','AJUSTE','DEVOLUCAO','PERDA','DANIFICADO') NOT NULL,
	origem ENUM('ARMAZEM','REQUISICAO','DEVOLUCAO','COMPRA','AJUSTE','VENDA') NOT NULL,
	entidade_tipo ENUM('INGREDIENTE','PRODUTO','MATERIAL') NOT NULL,
	referencia_id INTEGER NOT NULL,
	armazem_id INTEGER,
	quantidade NUMERIC(10, 3) NOT NULL,
	quantidade_antes NUMERIC(10, 3),
	quantidade_depois NUMERIC(10, 3),
	justificacao VARCHAR(255),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_movimentacoes_armazem PRIMARY KEY (id)
)

;


CREATE TABLE movimentos_caixa (
	id INTEGER NOT NULL AUTO_INCREMENT,
	caixa_id INTEGER NOT NULL,
	tipo ENUM('ABERTURA','VENDA','RECEBIMENTO','REFORCO','SANGRIA','DEVOLUCAO','AJUSTE') NOT NULL,
	valor NUMERIC(12, 2) NOT NULL,
	descricao VARCHAR(255),
	data_movimento DATETIME NOT NULL,
	utilizador_id INTEGER NOT NULL,
	codigo_transferencia VARCHAR(100),
	emissor VARCHAR(100),
	forma_pagamento VARCHAR(100),
	CONSTRAINT pk_movimentos_caixa PRIMARY KEY (id)
)

;


CREATE TABLE movimentos_stock (
	produto_id INTEGER NOT NULL,
	tipo_movimento ENUM('ENTRADA','SAIDA','COMPRA','VENDA','REQUISICAO','PRODUCAO','AJUSTE','INVENTARIO','PERDA','QUEBRA','TRANSFERENCIA') NOT NULL,
	quantidade NUMERIC(10, 3) NOT NULL,
	stock_anterior NUMERIC(10, 3) NOT NULL,
	stock_atual NUMERIC(10, 3) NOT NULL,
	motivo VARCHAR(255),
	numero_fatura VARCHAR(100),
	fornecedor_id INTEGER,
	referencia VARCHAR(100),
	utilizador_id INTEGER NOT NULL,
	observacao TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_movimentos_stock PRIMARY KEY (id)
)

;


CREATE TABLE ocorrencias_logisticas (
	id INTEGER NOT NULL AUTO_INCREMENT,
	entrega_id INTEGER NOT NULL,
	tipo ENUM('ATRASO','ACIDENTE','PERDA','DANO','OUTRO') NOT NULL,
	justificacao TEXT NOT NULL,
	data_ocorrencia DATETIME,
	CONSTRAINT pk_ocorrencias_logisticas PRIMARY KEY (id)
)

;


CREATE TABLE ocorrencias_materiais (
	numero VARCHAR(50) NOT NULL,
	material_id INTEGER NOT NULL,
	responsavel_id INTEGER NOT NULL,
	tipo ENUM('Perda','Danificado','Nao Devolvido') NOT NULL,
	quantidade NUMERIC(10, 3) NOT NULL,
	valor_estimado NUMERIC(10, 2),
	justificacao TEXT NOT NULL,
	data_ocorrencia DATETIME NOT NULL,
	estado ENUM('Aberta','Analise','Resolvida'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_ocorrencias_materiais PRIMARY KEY (id),
	CONSTRAINT uq_ocorrencias_materiais_numero UNIQUE (numero)
)

;


CREATE TABLE ordem_producao_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	ordem_producao_id INTEGER NOT NULL,
	produto_id INTEGER NOT NULL,
	quantidade NUMERIC(10, 2) NOT NULL,
	observacoes TEXT,
	CONSTRAINT pk_ordem_producao_itens PRIMARY KEY (id)
)

;


CREATE TABLE ordens_producao (
	numero VARCHAR(50) NOT NULL,
	pedido_id INTEGER NOT NULL,
	produto_id INTEGER,
	quantidade NUMERIC(10, 2),
	sector VARCHAR(50) NOT NULL,
	turno VARCHAR(50),
	responsavel_id INTEGER,
	data_producao DATE,
	hora_inicio DATETIME,
	hora_fim DATETIME,
	prioridade VARCHAR(50),
	estado VARCHAR(50),
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_ordens_producao PRIMARY KEY (id),
	CONSTRAINT uq_ordens_producao_numero UNIQUE (numero)
)

;


CREATE TABLE pagamentos (
	pedido_id INTEGER,
	evento_id INTEGER,
	venda_id INTEGER,
	valor NUMERIC(12, 2) NOT NULL,
	forma_pagamento_id INTEGER NOT NULL,
	estado ENUM('PENDENTE','PARCIAL','PAGO','CANCELADO'),
	data_pagamento DATETIME,
	referencia VARCHAR(100),
	observacoes TEXT,
	codigo_transferencia VARCHAR(100),
	emissor VARCHAR(100),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_pagamentos PRIMARY KEY (id)
)

;


CREATE TABLE pedidos (
	numero VARCHAR(50) NOT NULL,
	cliente_id INTEGER,
	evento_id INTEGER,
	tipo VARCHAR(50) NOT NULL,
	origem VARCHAR(50) NOT NULL,
	data_pedido DATETIME NOT NULL,
	data_entrega DATE,
	hora_entrega TIME,
	estado VARCHAR(50),
	observacoes TEXT,
	justificativa_cancelamento TEXT,
	valor_total NUMERIC(10, 2),
	valor_pago NUMERIC(10, 2),
	saldo NUMERIC(10, 2),
	forma_pagamento VARCHAR(50),
	estado_pagamento VARCHAR(50),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_pedidos PRIMARY KEY (id),
	CONSTRAINT uq_pedidos_numero UNIQUE (numero)
)

;


CREATE TABLE politica_comercial_regras (
	politica_id INTEGER NOT NULL,
	tipo_item VARCHAR(50) NOT NULL,
	referencia_id INTEGER,
	nome_item VARCHAR(255),
	min_participantes INTEGER,
	max_participantes INTEGER,
	valor_sugerido NUMERIC(10, 2) NOT NULL,
	tipo_calculo ENUM('Fixo','Por Participante','Por Hora','Por Dia','Por Unidade'),
	prioridade INTEGER,
	mensagem_sugestao VARCHAR(255),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_politica_comercial_regras PRIMARY KEY (id)
)

;


CREATE TABLE politicas_comerciais_eventos (
	codigo VARCHAR(50) NOT NULL,
	nome VARCHAR(100) NOT NULL,
	tipo_evento VARCHAR(100) NOT NULL,
	estado VARCHAR(20),
	data_inicio DATE,
	data_fim DATE,
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_politicas_comerciais_eventos PRIMARY KEY (id),
	CONSTRAINT uq_politicas_comerciais_eventos_codigo UNIQUE (codigo)
)

;


CREATE TABLE producao_desvios (
	producao_id INTEGER NOT NULL,
	produto_consumivel_id INTEGER NOT NULL,
	quantidade_prevista NUMERIC(10, 3) NOT NULL,
	quantidade_real NUMERIC(10, 3) NOT NULL,
	diferenca NUMERIC(10, 3) NOT NULL,
	justificativa TEXT NOT NULL,
	utilizador_id INTEGER NOT NULL,
	data DATETIME,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_producao_desvios PRIMARY KEY (id)
)

;


CREATE TABLE producao_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	producao_id INTEGER NOT NULL,
	produto_consumivel_id INTEGER NOT NULL,
	quantidade_prevista NUMERIC(10, 3) NOT NULL,
	quantidade_real NUMERIC(10, 3) NOT NULL,
	CONSTRAINT pk_producao_itens PRIMARY KEY (id)
)

;


CREATE TABLE producoes (
	numero VARCHAR(50) NOT NULL,
	produto_id INTEGER NOT NULL,
	quantidade_produzida NUMERIC(10, 2) NOT NULL,
	responsavel_id INTEGER NOT NULL,
	turno VARCHAR(50),
	data_producao DATETIME,
	estado VARCHAR(50),
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_producoes PRIMARY KEY (id),
	CONSTRAINT uq_producoes_numero UNIQUE (numero)
)

;


CREATE TABLE produto_stock_armazem (
	produto_id INTEGER NOT NULL,
	armazem_id INTEGER NOT NULL,
	stock_atual NUMERIC(10, 3) NOT NULL,
	stock_minimo NUMERIC(10, 3) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_produto_stock_armazem PRIMARY KEY (id),
	CONSTRAINT uq_produto_armazem_stock UNIQUE (produto_id, armazem_id)
)

;


CREATE TABLE produtos (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	tipo ENUM('ACABADO','REVENDA','CONSUMIVEL') NOT NULL,
	servico ENUM('ABASTECIMENTO','COZINHA','PASTELARIA','BAR'),
	categoria VARCHAR(100),
	categoria_id INTEGER,
	unidade_medida_id INTEGER,
	tempo_producao INTEGER,
	preco_venda NUMERIC(10, 2) NOT NULL,
	preco_compra NUMERIC(10, 2),
	descricao TEXT,
	stock_atual NUMERIC(10, 3),
	stock_minimo NUMERIC(10, 3),
	taxa_iva_id INTEGER,
	ativo BOOL,
	data_validade DATE,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_produtos PRIMARY KEY (id),
	CONSTRAINT uq_produtos_codigo UNIQUE (codigo)
)

;


CREATE TABLE receita_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	receita_id INTEGER NOT NULL,
	produto_consumivel_id INTEGER NOT NULL,
	quantidade NUMERIC(10, 3) NOT NULL,
	custo_calculado NUMERIC(10, 2),
	observacao VARCHAR(255),
	CONSTRAINT pk_receita_itens PRIMARY KEY (id)
)

;


CREATE TABLE receitas (
	categoria ENUM('VENDA','EVENTO','ALUGUER','SERVICO','OUTROS') NOT NULL,
	valor NUMERIC(12, 2) NOT NULL,
	descricao VARCHAR(255),
	data_receita DATE NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_receitas PRIMARY KEY (id)
)

;


CREATE TABLE receitas_producao (
	produto_acabado_id INTEGER NOT NULL,
	descricao TEXT,
	tempo_preparacao INTEGER,
	rendimento_unidades NUMERIC(10, 2),
	setor VARCHAR(50) NOT NULL,
	custo_gas NUMERIC(10, 2),
	custo_energia NUMERIC(10, 2),
	custo_pessoal NUMERIC(10, 2),
	custo_outros NUMERIC(10, 2),
	custo_total NUMERIC(10, 2),
	custo_unitario NUMERIC(10, 2),
	margem_lucro NUMERIC(10, 2),
	rentabilidade NUMERIC(10, 2),
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_receitas_producao PRIMARY KEY (id),
	CONSTRAINT uq_receitas_producao_produto_acabado_id UNIQUE (produto_acabado_id)
)

;


CREATE TABLE requisicoes (
	numero VARCHAR(50) NOT NULL,
	tipo VARCHAR(50) NOT NULL,
	sector VARCHAR(50) NOT NULL,
	turno_id INTEGER,
	responsavel_id INTEGER NOT NULL,
	evento_id INTEGER,
	data_requisicao DATETIME NOT NULL,
	estado VARCHAR(50),
	motivo TEXT,
	observacoes TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_requisicoes PRIMARY KEY (id),
	CONSTRAINT uq_requisicoes_numero UNIQUE (numero)
)

;


CREATE TABLE requisicoes_itens (
	id INTEGER NOT NULL AUTO_INCREMENT,
	requisicao_id INTEGER NOT NULL,
	tipo_item VARCHAR(50) NOT NULL,
	item_id INTEGER NOT NULL,
	quantidade_solicitada NUMERIC(10, 3) NOT NULL,
	quantidade_aprovada NUMERIC(10, 3),
	quantidade_entregue NUMERIC(10, 3),
	quantidade_devolvida NUMERIC(10, 3),
	quantidade_danificada NUMERIC(10, 3),
	quantidade_perdida NUMERIC(10, 3),
	observacao VARCHAR(255),
	CONSTRAINT pk_requisicoes_itens PRIMARY KEY (id)
)

;


CREATE TABLE reservas_espacos (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	espaco_id INTEGER NOT NULL,
	data_inicio DATETIME NOT NULL,
	data_fim DATETIME NOT NULL,
	valor_aluguer NUMERIC(10, 2),
	estado ENUM('Reservado','Utilizado','Finalizado','Cancelado'),
	CONSTRAINT pk_reservas_espacos PRIMARY KEY (id)
)

;


CREATE TABLE reservas_ingredientes (
	id INTEGER NOT NULL AUTO_INCREMENT,
	ingrediente_id INTEGER NOT NULL,
	pedido_id INTEGER NOT NULL,
	quantidade NUMERIC(10, 3) NOT NULL,
	data_reserva DATETIME NOT NULL,
	estado ENUM('ATIVA','UTILIZADA','CANCELADA'),
	CONSTRAINT pk_reservas_ingredientes PRIMARY KEY (id)
)

;


CREATE TABLE reservas_materiais (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	material_id INTEGER NOT NULL,
	quantidade NUMERIC(10, 2) NOT NULL,
	valor_unitario NUMERIC(10, 2),
	subtotal NUMERIC(10, 2),
	data_inicio DATETIME NOT NULL,
	data_fim DATETIME NOT NULL,
	estado VARCHAR(50),
	CONSTRAINT pk_reservas_materiais PRIMARY KEY (id)
)

;


CREATE TABLE reservas_viaturas (
	id INTEGER NOT NULL AUTO_INCREMENT,
	evento_id INTEGER NOT NULL,
	viatura_id INTEGER NOT NULL,
	motorista_id INTEGER NOT NULL,
	data_saida DATETIME NOT NULL,
	data_retorno DATETIME NOT NULL,
	estado VARCHAR(50),
	CONSTRAINT pk_reservas_viaturas PRIMARY KEY (id)
)

;


CREATE TABLE series_documento (
	tipo_documento ENUM('FT','FR','PROFORMA','NC','ND') NOT NULL,
	ano INTEGER NOT NULL,
	ultimo_numero INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_series_documento PRIMARY KEY (id)
)

;


CREATE TABLE servicos_cadastro (
	codigo VARCHAR(50),
	nome VARCHAR(100) NOT NULL,
	categoria VARCHAR(100),
	descricao TEXT,
	unidade_padrao VARCHAR(50),
	preco_sugerido NUMERIC(10, 2),
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_servicos_cadastro PRIMARY KEY (id),
	CONSTRAINT uq_servicos_cadastro_codigo UNIQUE (codigo)
)

;


CREATE TABLE taxas_iva (
	descricao VARCHAR(50) NOT NULL,
	percentagem NUMERIC(5, 2) NOT NULL,
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_taxas_iva PRIMARY KEY (id)
)

;


CREATE TABLE tipos_evento_cadastro (
	nome VARCHAR(100) NOT NULL,
	descricao TEXT,
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_tipos_evento_cadastro PRIMARY KEY (id),
	CONSTRAINT uq_tipos_evento_cadastro_nome UNIQUE (nome)
)

;


CREATE TABLE token_blocklist (
	id INTEGER NOT NULL AUTO_INCREMENT,
	jti VARCHAR(36) NOT NULL,
	created_at DATETIME NOT NULL,
	CONSTRAINT pk_token_blocklist PRIMARY KEY (id)
)

;


CREATE TABLE turnos (
	nome VARCHAR(50) NOT NULL,
	hora_inicio TIME,
	hora_fim TIME,
	ativo BOOL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_turnos PRIMARY KEY (id),
	CONSTRAINT uq_turnos_nome UNIQUE (nome)
)

;


CREATE TABLE unidades_medida (
	nome VARCHAR(50) NOT NULL,
	sigla VARCHAR(10) NOT NULL,
	descricao TEXT,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_unidades_medida PRIMARY KEY (id),
	CONSTRAINT uq_unidades_medida_sigla UNIQUE (sigla)
)

;


CREATE TABLE users (
	name VARCHAR(100) NOT NULL,
	email VARCHAR(120) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	`role` ENUM('ADMINISTRADOR','ATENDIMENTO','COZINHA','PASTELARIA','ARMAZEM','MOTORISTA','CONTROLADOR_MATERIAIS','FINANCEIRO') NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_users PRIMARY KEY (id)
)

;


CREATE TABLE venda_itens (
	venda_id INTEGER NOT NULL,
	item_tipo VARCHAR(50) NOT NULL,
	item_id INTEGER,
	descricao VARCHAR(255) NOT NULL,
	quantidade NUMERIC(10, 2) NOT NULL,
	preco_unitario NUMERIC(12, 2) NOT NULL,
	desconto NUMERIC(12, 2),
	taxa_iva_id INTEGER,
	taxa_iva NUMERIC(5, 2),
	valor_iva NUMERIC(12, 2),
	subtotal NUMERIC(12, 2) NOT NULL,
	total NUMERIC(12, 2) NOT NULL,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_venda_itens PRIMARY KEY (id)
)

;


CREATE TABLE vendas (
	numero_documento VARCHAR(50) NOT NULL,
	tipo_documento ENUM('FT','FR','PROFORMA','NC','ND') NOT NULL,
	cliente_id INTEGER,
	pedido_id INTEGER,
	subtotal NUMERIC(12, 2),
	desconto_total NUMERIC(12, 2),
	base_tributavel NUMERIC(12, 2),
	total_iva NUMERIC(12, 2),
	total NUMERIC(12, 2),
	valor_pago NUMERIC(12, 2),
	saldo NUMERIC(12, 2),
	estado ENUM('PENDENTE','PARCIALMENTE_PAGO','PAGO','CANCELADO'),
	observacoes TEXT,
	criado_por INTEGER,
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_vendas PRIMARY KEY (id),
	CONSTRAINT uq_vendas_numero_documento UNIQUE (numero_documento)
)

;


CREATE TABLE viaturas (
	matricula VARCHAR(20) NOT NULL,
	marca VARCHAR(50),
	modelo VARCHAR(50),
	ano INTEGER,
	capacidade NUMERIC(10, 2),
	quilometragem NUMERIC(10, 2),
	estado ENUM('DISPONIVEL','EM_SERVICO','MANUTENCAO','INATIVA'),
	id INTEGER NOT NULL AUTO_INCREMENT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	created_by INTEGER,
	updated_by INTEGER,
	is_active BOOL NOT NULL,
	deleted_at DATETIME,
	CONSTRAINT pk_viaturas PRIMARY KEY (id),
	CONSTRAINT uq_viaturas_matricula UNIQUE (matricula)
)

;

-- Foreign keys are applied after all tables, including cyclic Pedido/Eventos references.
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE caixas ADD CONSTRAINT fk_caixas_utilizador_fecho_id_users FOREIGN KEY(utilizador_fecho_id) REFERENCES users (id);
ALTER TABLE caixas ADD CONSTRAINT fk_caixas_utilizador_abertura_id_users FOREIGN KEY(utilizador_abertura_id) REFERENCES users (id);
ALTER TABLE checklists_entregas ADD CONSTRAINT fk_checklists_entregas_entrega_id_entregas FOREIGN KEY(entrega_id) REFERENCES entregas (id);
ALTER TABLE consumos_ingredientes ADD CONSTRAINT fk_consumos_ingredientes_ordem_producao_id_ordens_producao FOREIGN KEY(ordem_producao_id) REFERENCES ordens_producao (id);
ALTER TABLE consumos_ingredientes ADD CONSTRAINT fk_consumos_ingredientes_ingrediente_id_ingredientes FOREIGN KEY(ingrediente_id) REFERENCES ingredientes (id);
ALTER TABLE consumos_ingredientes ADD CONSTRAINT fk_consumos_ingredientes_produto_consumivel_id_produtos FOREIGN KEY(produto_consumivel_id) REFERENCES produtos (id);
ALTER TABLE contas_pagar ADD CONSTRAINT fk_contas_pagar_fornecedor_id_fornecedores FOREIGN KEY(fornecedor_id) REFERENCES fornecedores (id);
ALTER TABLE contas_receber ADD CONSTRAINT fk_contas_receber_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE contas_receber ADD CONSTRAINT fk_contas_receber_cliente_id_clientes FOREIGN KEY(cliente_id) REFERENCES clientes (id);
ALTER TABLE contas_receber ADD CONSTRAINT fk_contas_receber_venda_id_vendas FOREIGN KEY(venda_id) REFERENCES vendas (id);
ALTER TABLE contas_receber ADD CONSTRAINT fk_contas_receber_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE despesas ADD CONSTRAINT fk_despesas_centro_custo_id_centros_custo FOREIGN KEY(centro_custo_id) REFERENCES centros_custo (id);
ALTER TABLE devolucoes_materiais ADD CONSTRAINT fk_devolucoes_materiais_requisicao_id_requisicoes FOREIGN KEY(requisicao_id) REFERENCES requisicoes (id);
ALTER TABLE devolucoes_materiais ADD CONSTRAINT fk_devolucoes_materiais_material_id_materiais FOREIGN KEY(material_id) REFERENCES materiais (id);
ALTER TABLE entregas ADD CONSTRAINT fk_entregas_viatura_id_viaturas FOREIGN KEY(viatura_id) REFERENCES viaturas (id);
ALTER TABLE entregas ADD CONSTRAINT fk_entregas_motorista_id_motoristas FOREIGN KEY(motorista_id) REFERENCES motoristas (id);
ALTER TABLE entregas ADD CONSTRAINT fk_entregas_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE entregas ADD CONSTRAINT fk_entregas_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE entregas_requisicao ADD CONSTRAINT fk_entregas_requisicao_armazem_responsavel_id_users FOREIGN KEY(armazem_responsavel_id) REFERENCES users (id);
ALTER TABLE entregas_requisicao ADD CONSTRAINT fk_entregas_requisicao_requisicao_id_requisicoes FOREIGN KEY(requisicao_id) REFERENCES requisicoes (id);
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_cliente_id_clientes FOREIGN KEY(cliente_id) REFERENCES clientes (id);
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE eventos ADD CONSTRAINT fk_eventos_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE eventos_equipas ADD CONSTRAINT fk_eventos_equipas_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE eventos_equipas ADD CONSTRAINT fk_eventos_equipas_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE eventos_itens ADD CONSTRAINT fk_eventos_itens_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE eventos_itens ADD CONSTRAINT fk_eventos_itens_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE eventos_servicos ADD CONSTRAINT fk_eventos_servicos_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE fechos_diarios ADD CONSTRAINT fk_fechos_diarios_criado_por_users FOREIGN KEY(criado_por) REFERENCES users (id);
ALTER TABLE fichas_tecnicas ADD CONSTRAINT fk_fichas_tecnicas_produto_acabado_id_produtos FOREIGN KEY(produto_acabado_id) REFERENCES produtos (id);
ALTER TABLE fichas_tecnicas_itens ADD CONSTRAINT fk_fichas_tecnicas_itens_ingrediente_id_ingredientes FOREIGN KEY(ingrediente_id) REFERENCES ingredientes (id);
ALTER TABLE fichas_tecnicas_itens ADD CONSTRAINT fk_fichas_tecnicas_itens_ficha_tecnica_id_fichas_tecnicas FOREIGN KEY(ficha_tecnica_id) REFERENCES fichas_tecnicas (id);
ALTER TABLE ingrediente_stock_armazem ADD CONSTRAINT fk_ingrediente_stock_armazem_ingrediente_id_ingredientes FOREIGN KEY(ingrediente_id) REFERENCES ingredientes (id);
ALTER TABLE ingrediente_stock_armazem ADD CONSTRAINT fk_ingrediente_stock_armazem_armazem_id_armazens FOREIGN KEY(armazem_id) REFERENCES armazens (id);
ALTER TABLE ingredientes ADD CONSTRAINT fk_ingredientes_fornecedor_id_fornecedores FOREIGN KEY(fornecedor_id) REFERENCES fornecedores (id);
ALTER TABLE inventario_contagem_itens ADD CONSTRAINT fk_inventario_contagem_itens_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE inventario_contagem_itens ADD CONSTRAINT fk_inventario_contagem_itens_inventario_id_inventarios_contagem FOREIGN KEY(inventario_id) REFERENCES inventarios_contagem (id);
ALTER TABLE inventario_items ADD CONSTRAINT fk_inventario_items_inventario_id_inventarios FOREIGN KEY(inventario_id) REFERENCES inventarios (id);
ALTER TABLE inventarios ADD CONSTRAINT fk_inventarios_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE inventarios_contagem ADD CONSTRAINT fk_inventarios_contagem_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE itens_pedido ADD CONSTRAINT fk_itens_pedido_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE itens_pedido ADD CONSTRAINT fk_itens_pedido_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE itens_pedido ADD CONSTRAINT fk_itens_pedido_taxa_iva_id_taxas_iva FOREIGN KEY(taxa_iva_id) REFERENCES taxas_iva (id);
ALTER TABLE log_acessos ADD CONSTRAINT fk_log_acessos_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE log_erros ADD CONSTRAINT fk_log_erros_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE materiais ADD CONSTRAINT fk_materiais_unidade_medida_id_unidades_medida FOREIGN KEY(unidade_medida_id) REFERENCES unidades_medida (id);
ALTER TABLE material_stock_armazem ADD CONSTRAINT fk_material_stock_armazem_material_id_materiais FOREIGN KEY(material_id) REFERENCES materiais (id);
ALTER TABLE material_stock_armazem ADD CONSTRAINT fk_material_stock_armazem_armazem_id_armazens FOREIGN KEY(armazem_id) REFERENCES armazens (id);
ALTER TABLE movimentacoes_armazem ADD CONSTRAINT fk_movimentacoes_armazem_armazem_id_armazens FOREIGN KEY(armazem_id) REFERENCES armazens (id);
ALTER TABLE movimentos_caixa ADD CONSTRAINT fk_movimentos_caixa_caixa_id_caixas FOREIGN KEY(caixa_id) REFERENCES caixas (id);
ALTER TABLE movimentos_caixa ADD CONSTRAINT fk_movimentos_caixa_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE movimentos_stock ADD CONSTRAINT fk_movimentos_stock_fornecedor_id_fornecedores FOREIGN KEY(fornecedor_id) REFERENCES fornecedores (id);
ALTER TABLE movimentos_stock ADD CONSTRAINT fk_movimentos_stock_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE movimentos_stock ADD CONSTRAINT fk_movimentos_stock_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE ocorrencias_logisticas ADD CONSTRAINT fk_ocorrencias_logisticas_entrega_id_entregas FOREIGN KEY(entrega_id) REFERENCES entregas (id);
ALTER TABLE ocorrencias_materiais ADD CONSTRAINT fk_ocorrencias_materiais_material_id_materiais FOREIGN KEY(material_id) REFERENCES materiais (id);
ALTER TABLE ocorrencias_materiais ADD CONSTRAINT fk_ocorrencias_materiais_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE ordem_producao_itens ADD CONSTRAINT fk_ordem_producao_itens_ordem_producao_id_ordens_producao FOREIGN KEY(ordem_producao_id) REFERENCES ordens_producao (id);
ALTER TABLE ordem_producao_itens ADD CONSTRAINT fk_ordem_producao_itens_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE ordens_producao ADD CONSTRAINT fk_ordens_producao_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE ordens_producao ADD CONSTRAINT fk_ordens_producao_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE ordens_producao ADD CONSTRAINT fk_ordens_producao_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE pagamentos ADD CONSTRAINT fk_pagamentos_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE pagamentos ADD CONSTRAINT fk_pagamentos_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE pagamentos ADD CONSTRAINT fk_pagamentos_venda_id_vendas FOREIGN KEY(venda_id) REFERENCES vendas (id);
ALTER TABLE pagamentos ADD CONSTRAINT fk_pagamentos_forma_pagamento_id_formas_pagamento FOREIGN KEY(forma_pagamento_id) REFERENCES formas_pagamento (id);
ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_cliente_id_clientes FOREIGN KEY(cliente_id) REFERENCES clientes (id);
ALTER TABLE politica_comercial_regras ADD CONSTRAINT fk_politica_comercial_regras_politica_id_politicas_comer_eb4f FOREIGN KEY(politica_id) REFERENCES politicas_comerciais_eventos (id);
ALTER TABLE producao_desvios ADD CONSTRAINT fk_producao_desvios_produto_consumivel_id_produtos FOREIGN KEY(produto_consumivel_id) REFERENCES produtos (id);
ALTER TABLE producao_desvios ADD CONSTRAINT fk_producao_desvios_producao_id_producoes FOREIGN KEY(producao_id) REFERENCES producoes (id);
ALTER TABLE producao_desvios ADD CONSTRAINT fk_producao_desvios_utilizador_id_users FOREIGN KEY(utilizador_id) REFERENCES users (id);
ALTER TABLE producao_itens ADD CONSTRAINT fk_producao_itens_producao_id_producoes FOREIGN KEY(producao_id) REFERENCES producoes (id);
ALTER TABLE producao_itens ADD CONSTRAINT fk_producao_itens_produto_consumivel_id_produtos FOREIGN KEY(produto_consumivel_id) REFERENCES produtos (id);
ALTER TABLE producoes ADD CONSTRAINT fk_producoes_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE producoes ADD CONSTRAINT fk_producoes_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE produto_stock_armazem ADD CONSTRAINT fk_produto_stock_armazem_produto_id_produtos FOREIGN KEY(produto_id) REFERENCES produtos (id);
ALTER TABLE produto_stock_armazem ADD CONSTRAINT fk_produto_stock_armazem_armazem_id_armazens FOREIGN KEY(armazem_id) REFERENCES armazens (id);
ALTER TABLE produtos ADD CONSTRAINT fk_produtos_categoria_id_categorias_produto FOREIGN KEY(categoria_id) REFERENCES categorias_produto (id);
ALTER TABLE produtos ADD CONSTRAINT fk_produtos_unidade_medida_id_unidades_medida FOREIGN KEY(unidade_medida_id) REFERENCES unidades_medida (id);
ALTER TABLE produtos ADD CONSTRAINT fk_produtos_taxa_iva_id_taxas_iva FOREIGN KEY(taxa_iva_id) REFERENCES taxas_iva (id);
ALTER TABLE receita_itens ADD CONSTRAINT fk_receita_itens_receita_id_receitas_producao FOREIGN KEY(receita_id) REFERENCES receitas_producao (id);
ALTER TABLE receita_itens ADD CONSTRAINT fk_receita_itens_produto_consumivel_id_produtos FOREIGN KEY(produto_consumivel_id) REFERENCES produtos (id);
ALTER TABLE receitas_producao ADD CONSTRAINT fk_receitas_producao_produto_acabado_id_produtos FOREIGN KEY(produto_acabado_id) REFERENCES produtos (id);
ALTER TABLE requisicoes ADD CONSTRAINT fk_requisicoes_responsavel_id_users FOREIGN KEY(responsavel_id) REFERENCES users (id);
ALTER TABLE requisicoes ADD CONSTRAINT fk_requisicoes_turno_id_turnos FOREIGN KEY(turno_id) REFERENCES turnos (id);
ALTER TABLE requisicoes ADD CONSTRAINT fk_requisicoes_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE requisicoes_itens ADD CONSTRAINT fk_requisicoes_itens_requisicao_id_requisicoes FOREIGN KEY(requisicao_id) REFERENCES requisicoes (id);
ALTER TABLE reservas_espacos ADD CONSTRAINT fk_reservas_espacos_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE reservas_espacos ADD CONSTRAINT fk_reservas_espacos_espaco_id_espacos FOREIGN KEY(espaco_id) REFERENCES espacos (id);
ALTER TABLE reservas_ingredientes ADD CONSTRAINT fk_reservas_ingredientes_ingrediente_id_ingredientes FOREIGN KEY(ingrediente_id) REFERENCES ingredientes (id);
ALTER TABLE reservas_ingredientes ADD CONSTRAINT fk_reservas_ingredientes_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE reservas_materiais ADD CONSTRAINT fk_reservas_materiais_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE reservas_materiais ADD CONSTRAINT fk_reservas_materiais_material_id_materiais FOREIGN KEY(material_id) REFERENCES materiais (id);
ALTER TABLE reservas_viaturas ADD CONSTRAINT fk_reservas_viaturas_motorista_id_motoristas FOREIGN KEY(motorista_id) REFERENCES motoristas (id);
ALTER TABLE reservas_viaturas ADD CONSTRAINT fk_reservas_viaturas_evento_id_eventos FOREIGN KEY(evento_id) REFERENCES eventos (id);
ALTER TABLE reservas_viaturas ADD CONSTRAINT fk_reservas_viaturas_viatura_id_viaturas FOREIGN KEY(viatura_id) REFERENCES viaturas (id);
ALTER TABLE venda_itens ADD CONSTRAINT fk_venda_itens_venda_id_vendas FOREIGN KEY(venda_id) REFERENCES vendas (id);
ALTER TABLE venda_itens ADD CONSTRAINT fk_venda_itens_taxa_iva_id_taxas_iva FOREIGN KEY(taxa_iva_id) REFERENCES taxas_iva (id);
ALTER TABLE vendas ADD CONSTRAINT fk_vendas_pedido_id_pedidos FOREIGN KEY(pedido_id) REFERENCES pedidos (id);
ALTER TABLE vendas ADD CONSTRAINT fk_vendas_criado_por_users FOREIGN KEY(criado_por) REFERENCES users (id);
ALTER TABLE vendas ADD CONSTRAINT fk_vendas_cliente_id_clientes FOREIGN KEY(cliente_id) REFERENCES clientes (id);
