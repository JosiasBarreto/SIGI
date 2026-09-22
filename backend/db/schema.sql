-- =====================================================
-- SIGI ERP - Esquema Completo da Base de Dados MySQL
-- Versão Atualizada com Todos os Módulos e Relações
-- =====================================================

CREATE DATABASE IF NOT EXISTS sigi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sigi_db;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- TABLE: empresa (Configurações da Empresa / Emitente)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nif VARCHAR(50) NULL,
    licenca_empresa VARCHAR(100) NULL,
    licenca_aplicacao VARCHAR(100) NULL,
    endereco_web VARCHAR(150) NULL,
    utiliza_iva BOOLEAN DEFAULT TRUE,
    correio_eletronico VARCHAR(150) NULL,
    telefone VARCHAR(50) NULL,
    telemoveis VARCHAR(100) NULL,
    localizacao VARCHAR(255) NULL,
    logo VARCHAR(255) NULL,
    moeda VARCHAR(10) DEFAULT 'STN',
    tipo_formato_impressao VARCHAR(50) DEFAULT 'A4',
    numero_whatsapp VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: perfis (roles)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    perfil_id INT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Atendimento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_users_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: token_blocklist
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS token_blocklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: auditoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NULL,
    operacao VARCHAR(20) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    registo_id INT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    ip_origem VARCHAR(45),
    user_agent VARCHAR(255),
    modulo VARCHAR(50),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_user FOREIGN KEY (utilizador_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: log_acessos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS log_acessos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NULL,
    tipo VARCHAR(20) NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    sucesso BOOLEAN DEFAULT TRUE,
    detalhes TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_acessos_user FOREIGN KEY (utilizador_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: log_erros
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS log_erros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NULL,
    tipo_erro VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    stack_trace TEXT,
    rota VARCHAR(255),
    metodo VARCHAR(10),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_erros_user FOREIGN KEY (utilizador_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    morada TEXT,
    endereco TEXT,
    limite_credito DECIMAL(12,2) DEFAULT 0,
    saldo_conta_corrente DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: fornecedores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    morada TEXT,
    endereco TEXT,
    tipo_entidade VARCHAR(50) DEFAULT 'Fornecedor',
    prazo_pagamento_dias INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: taxas_iva
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS taxas_iva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL,
    percentagem DECIMAL(5,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: categorias_produto
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: unidades_medida
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS unidades_medida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ingredientes (Matérias-primas / Produção)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Secos',
    unidade_medida VARCHAR(20) NOT NULL DEFAULT 'Kg',
    stock_atual DECIMAL(12,3) DEFAULT 0,
    stock_minimo DECIMAL(12,3) DEFAULT 0,
    preco_compra DECIMAL(12,2) DEFAULT 0,
    preco_medio DECIMAL(12,2) DEFAULT 0,
    fornecedor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_ingrediente_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: produtos (Acabados, Revenda e Consumíveis)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('Acabado', 'Revenda', 'Consumivel') NOT NULL,
    servico ENUM('ABASTECIMENTO', 'COZINHA', 'PASTELARIA', 'BAR') NULL,
    categoria VARCHAR(100) NULL,
    categoria_id INT NULL,
    unidade_medida_id INT NULL,
    tempo_producao INT NULL,
    preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    preco_compra DECIMAL(12,2) NULL DEFAULT 0.00,
    descricao TEXT,
    stock_atual DECIMAL(12,3) DEFAULT 0,
    stock_minimo DECIMAL(12,3) DEFAULT 0,
    taxa_iva_id INT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_produto_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id) ON DELETE SET NULL,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_produto(id) ON DELETE SET NULL,
    CONSTRAINT fk_produto_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: materiais (Equipamentos Reutilizáveis e Consumíveis)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Geral',
    tipo ENUM('Reutilizavel', 'Consumivel') NOT NULL,
    quantidade_total INT DEFAULT 0,
    quantidade_disponivel INT DEFAULT 0,
    stock_atual DECIMAL(10,2) DEFAULT 0,
    a_ser_devolvido DECIMAL(10,2) DEFAULT 0,
    estado ENUM('Disponivel', 'Em_Uso', 'Manutencao', 'Danificado') DEFAULT 'Disponivel',
    custo_aquisicao DECIMAL(12,2) DEFAULT 0,
    fornecedor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_material_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: armazens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS armazens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'Principal',
    localizacao VARCHAR(255) NULL,
    capacidade_m3 DECIMAL(10,2) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: produto_stock_armazem
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS produto_stock_armazem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    armazem_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_psa_armazem FOREIGN KEY (armazem_id) REFERENCES armazens(id) ON DELETE CASCADE,
    CONSTRAINT fk_psa_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_armazem_produto (armazem_id, produto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ingrediente_stock_armazem
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ingrediente_stock_armazem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    armazem_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_isa_armazem FOREIGN KEY (armazem_id) REFERENCES armazens(id) ON DELETE CASCADE,
    CONSTRAINT fk_isa_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_armazem_ingrediente (armazem_id, ingrediente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: material_stock_armazem
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS material_stock_armazem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    armazem_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_msa_armazem FOREIGN KEY (armazem_id) REFERENCES armazens(id) ON DELETE CASCADE,
    CONSTRAINT fk_msa_material FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    UNIQUE KEY uq_armazem_material (armazem_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: movimentos_stock
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    armazem_origem_id INT NULL,
    armazem_destino_id INT NULL,
    tipo VARCHAR(30) NOT NULL, -- 'Entrada', 'Saida', 'Transferencia', 'Ajuste'
    item_tipo VARCHAR(30) NOT NULL, -- 'Produto', 'Ingrediente', 'Material'
    item_id INT NOT NULL,
    quantidade DECIMAL(12,3) NOT NULL,
    motivo VARCHAR(255) NULL,
    custo_unitario DECIMAL(12,2) NULL,
    documento_ref VARCHAR(100) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_armazem_orig FOREIGN KEY (armazem_origem_id) REFERENCES armazens(id) ON DELETE SET NULL,
    CONSTRAINT fk_mov_armazem_dest FOREIGN KEY (armazem_destino_id) REFERENCES armazens(id) ON DELETE SET NULL,
    CONSTRAINT fk_mov_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: movimentacoes_armazem (compatibilidade)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes_armazem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    referencia_id INT NULL,
    entidade_tipo VARCHAR(30) NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    CONSTRAINT fk_mov_armazem_legacy_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: turnos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: fichas_tecnicas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_ficha VARCHAR(100) NOT NULL,
    produto_id INT NOT NULL,
    tipo_ficha ENUM('PRODUCAO', 'SUBRECEITA') DEFAULT 'PRODUCAO',
    rendimento DECIMAL(10,2) DEFAULT 1,
    tempo_preparacao INT DEFAULT 0,
    custo_total DECIMAL(10,2) DEFAULT 0,
    valido_desde DATE NULL,
    valido_ate DATE NULL,
    instrucoes_preparacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_ficha_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: fichas_tecnicas_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_tecnicas_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ficha_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    quebra DECIMAL(5,2) DEFAULT 0,
    custo_item DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fitem_ficha FOREIGN KEY (ficha_id) REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
    CONSTRAINT fk_fitem_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: receitas_producao
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS receitas_producao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NULL,
    produto_id INT NULL,
    rendimento_esperado DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    unidade_medida VARCHAR(20) NOT NULL DEFAULT 'un',
    tempo_preparo_minutos INT NOT NULL DEFAULT 0,
    setor ENUM('PASTELARIA', 'COZINHA', 'PADARIA', 'OUTRO') NOT NULL DEFAULT 'PASTELARIA',
    instrucoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_receita_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: receita_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS receita_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receita_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    unidade VARCHAR(20) NOT NULL DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ritem_receita FOREIGN KEY (receita_id) REFERENCES receitas_producao(id) ON DELETE CASCADE,
    CONSTRAINT fk_ritem_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: caixas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS caixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL,
    data_abertura DATETIME NOT NULL,
    data_fecho DATETIME NULL,
    saldo_inicial DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_final_esperado DECIMAL(12,2) NULL,
    saldo_final_real DECIMAL(12,2) NULL,
    diferenca DECIMAL(12,2) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Aberto',
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_caixa_user FOREIGN KEY (utilizador_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: movimentos_caixa
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentos_caixa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caixa_id INT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'Suprimento', 'Sangria', 'Venda', 'Recebimento', 'Estorno'
    valor DECIMAL(12,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    utilizador_id INT NOT NULL,
    codigo_transferencia VARCHAR(100) NULL,
    emissor VARCHAR(150) NULL,
    forma_pagamento VARCHAR(100) NULL,
    data_movimento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_caixa_caixa FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE CASCADE,
    CONSTRAINT fk_mov_caixa_user FOREIGN KEY (utilizador_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: pedidos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NULL,
    tipo ENUM('Simples', 'Composto') NOT NULL DEFAULT 'Simples',
    origem ENUM('Balcao', 'WhatsApp', 'Email', 'Telefone', 'Outro') DEFAULT 'Balcao',
    estado ENUM('Pendente', 'Confirmado', 'Em_Producao', 'Pronto', 'Entregue', 'Concluido', 'Cancelado') DEFAULT 'Pendente',
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_entrega DATE NULL,
    hora_entrega TIME NULL,
    valor_total DECIMAL(12,2) DEFAULT 0,
    valor_pago DECIMAL(12,2) DEFAULT 0,
    estado_pagamento ENUM('Pendente', 'Parcial', 'Pago') DEFAULT 'Pendente',
    forma_pagamento ENUM('Dinheiro', 'Multicaixa', 'Transferencia', 'Cheque') DEFAULT 'Dinheiro',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: itens_pedido
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    tipo_item ENUM('Produto', 'Produto Acabado', 'Produto Revenda', 'Servico', 'Aluguer') NOT NULL DEFAULT 'Produto',
    referencia_id INT NULL,
    produto_id INT NULL,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    desconto DECIMAL(12,2) DEFAULT 0,
    taxa_iva_id INT NULL,
    taxa_iva DECIMAL(5,2) DEFAULT 0,
    valor_iva DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_pedido_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_pedido_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    CONSTRAINT fk_item_pedido_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: espacos (Espaços de Eventos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS espacos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    capacidade INT NOT NULL DEFAULT 50,
    valor_aluguer DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: servicos_cadastro
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS servicos_cadastro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    preco_padrao DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: tipos_evento_cadastro
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_evento_cadastro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: equipas_cadastro
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS equipas_cadastro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    funcao VARCHAR(100) NOT NULL,
    custo_hora DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: politicas_comerciais_eventos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS politicas_comerciais_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    desconto_global_percentual DECIMAL(5,2) DEFAULT 0.00,
    cobrar_iva_produtos BOOLEAN DEFAULT TRUE,
    cobrar_iva_servicos BOOLEAN DEFAULT TRUE,
    taxa_iva_servicos DECIMAL(5,2) DEFAULT 14.00,
    margem_padrao DECIMAL(5,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: politica_comercial_regras
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS politica_comercial_regras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    politica_id INT NOT NULL,
    tipo_item VARCHAR(50) NOT NULL,
    categoria_id INT NULL,
    desconto_percentual DECIMAL(5,2) DEFAULT 0.00,
    margem_adicional DECIMAL(5,2) DEFAULT 0.00,
    is_isento_iva BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_pcr_politica FOREIGN KEY (politica_id) REFERENCES politicas_comerciais_eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: eventos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    cliente_id INT NOT NULL,
    pedido_id INT NULL,
    venda_id INT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'Outro',
    data_evento DATETIME NOT NULL,
    data_fim DATETIME NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Rascunho',
    numero_convidados INT DEFAULT 0,
    localizacao VARCHAR(255),
    espaco_id INT NULL,
    valor_total DECIMAL(12,2) DEFAULT 0.00,
    valor_pago DECIMAL(12,2) DEFAULT 0.00,
    saldo DECIMAL(12,2) DEFAULT 0.00,
    valor_deslocacao DECIMAL(12,2) DEFAULT 0.00,
    distancia_km DECIMAL(10,2) DEFAULT 0.00,
    taxa_por_km DECIMAL(10,2) DEFAULT 0.00,
    mao_obra_extra DECIMAL(12,2) DEFAULT 0.00,
    outros_encargos DECIMAL(12,2) DEFAULT 0.00,
    desconto_total DECIMAL(12,2) DEFAULT 0.00,
    politica_comercial_id INT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_evento_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evento_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    CONSTRAINT fk_evento_espaco FOREIGN KEY (espaco_id) REFERENCES espacos(id) ON DELETE SET NULL,
    CONSTRAINT fk_evento_politica FOREIGN KEY (politica_comercial_id) REFERENCES politicas_comerciais_eventos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: eventos_itens (Linhas de Produtos/Serviços no Evento)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    tipo_item VARCHAR(50) NOT NULL DEFAULT 'PRODUTO',
    referencia_id INT NULL,
    produto_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    desconto_percentual DECIMAL(5,2) DEFAULT 0.00,
    valor_desconto DECIMAL(12,2) DEFAULT 0.00,
    taxa_iva DECIMAL(5,2) DEFAULT 0.00,
    valor_iva DECIMAL(12,2) DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    observacoes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eitem_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_eitem_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: eventos_servicos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos_servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    tipo ENUM('Buffet', 'Decoracao', 'Som_Luz', 'Fotografia', 'Animacao', 'Outro') NOT NULL,
    descricao VARCHAR(255),
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    fornecedor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eserv_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_eserv_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: reservas_espacos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas_espacos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    espaco_id INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    valor_aluguer DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resp_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_resp_espaco FOREIGN KEY (espaco_id) REFERENCES espacos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: reservas_materiais
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas_materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_reserva DATETIME NOT NULL,
    data_devolucao DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rmat_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_rmat_material FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: eventos_equipas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos_equipas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    nome_membro VARCHAR(100) NOT NULL,
    funcao VARCHAR(100) NOT NULL,
    horas_previstas DECIMAL(6,2) DEFAULT 0.00,
    custo_hora DECIMAL(12,2) DEFAULT 0.00,
    custo_total DECIMAL(12,2) DEFAULT 0.00,
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eequipa_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_eequipa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: series_documento
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS series_documento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('FT', 'FR', 'PROFORMA', 'NC', 'ND') NOT NULL,
    ano INT NOT NULL,
    ultimo_numero INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY uq_serie_ano (tipo_documento, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: vendas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    tipo_documento ENUM('FT', 'FR', 'PROFORMA', 'NC', 'ND') NOT NULL,
    cliente_id INT NULL,
    pedido_id INT NULL,
    evento_id INT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    desconto_total DECIMAL(12,2) DEFAULT 0,
    base_tributavel DECIMAL(12,2) DEFAULT 0,
    total_iva DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    valor_pago DECIMAL(12,2) DEFAULT 0,
    saldo DECIMAL(12,2) DEFAULT 0,
    estado ENUM('Pendente', 'Parcialmente Pago', 'Pago', 'Cancelado') DEFAULT 'Pendente',
    observacoes TEXT,
    criado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_venda_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    CONSTRAINT fk_venda_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
    CONSTRAINT fk_venda_user FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Atualização da chave estrangeira eventos -> vendas
ALTER TABLE eventos ADD CONSTRAINT fk_evento_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL;

-- -----------------------------------------------------
-- TABLE: venda_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS venda_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    item_tipo VARCHAR(50) NOT NULL,
    item_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    desconto DECIMAL(12,2) DEFAULT 0,
    taxa_iva_id INT NULL,
    taxa_iva DECIMAL(5,2) DEFAULT 0,
    valor_iva DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_venda_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: proformas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS proformas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NULL,
    pedido_id INT NULL,
    origem VARCHAR(20) NOT NULL DEFAULT 'POS',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    desconto_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'Emitida',
    observacoes TEXT NULL,
    criado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_proforma_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_proforma_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    CONSTRAINT fk_proforma_user FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: proforma_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS proforma_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_id INT NOT NULL,
    item_tipo VARCHAR(50) NOT NULL DEFAULT 'Produto',
    item_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxa_iva DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    valor_iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_proforma_item_proforma FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: fechos_diarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fechos_diarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL UNIQUE,
    total_vendas DECIMAL(12,2) DEFAULT 0,
    total_recebido DECIMAL(12,2) DEFAULT 0,
    total_despesas DECIMAL(12,2) DEFAULT 0,
    total_caixas DECIMAL(12,2) DEFAULT 0,
    observacoes TEXT,
    criado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_fecho_user FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: formas_pagamento
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS formas_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: pagamentos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NULL,
    evento_id INT NULL,
    venda_id INT NULL,
    valor DECIMAL(12,2) NOT NULL,
    forma_pagamento_id INT NOT NULL,
    estado ENUM('Pendente', 'Parcial', 'Pago', 'Cancelado') DEFAULT 'Pendente',
    data_pagamento DATETIME NULL,
    codigo_transferencia VARCHAR(100) NULL,
    emissor VARCHAR(150) NULL,
    referencia VARCHAR(100) NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pagamento_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    CONSTRAINT fk_pagamento_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
    CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL,
    CONSTRAINT fk_pagamento_forma FOREIGN KEY (forma_pagamento_id) REFERENCES formas_pagamento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: contas_receber
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_receber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NULL,
    pedido_id INT NULL,
    evento_id INT NULL,
    venda_id INT NULL,
    valor_original DECIMAL(12,2) NOT NULL,
    valor_pago DECIMAL(12,2) DEFAULT 0,
    saldo DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    estado ENUM('Aberta', 'Parcial', 'Paga', 'Atrasada') DEFAULT 'Aberta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_contar_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_contar_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    CONSTRAINT fk_contar_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
    CONSTRAINT fk_contar_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: centros_custo
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_custo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: contas_pagar
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_pagar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    estado ENUM('Aberta', 'Parcial', 'Paga', 'Atrasada') DEFAULT 'Aberta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_contap_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: receitas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS receitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria ENUM('Venda', 'Evento', 'Aluguer', 'Servico', 'Outros') NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    descricao VARCHAR(255),
    data_receita DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: despesas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria ENUM('Fornecedor', 'Combustivel', 'Salario', 'Energia', 'Agua', 'Internet', 'Manutencao', 'Outros') NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    descricao VARCHAR(255),
    data_despesa DATE NOT NULL,
    centro_custo_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_despesa_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ordens_producao
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ordens_producao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    data_ordem DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_prevista DATE NOT NULL,
    sector ENUM('COZINHA', 'PASTELARIA') NOT NULL,
    prioridade ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') DEFAULT 'MEDIA',
    estado ENUM('PLANEADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') DEFAULT 'PLANEADA',
    produto_id INT NOT NULL,
    pedido_id INT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    custo_total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_op_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_op_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ordem_producao_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ordem_producao_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Pendente',
    CONSTRAINT fk_opi_ordem FOREIGN KEY (ordem_id) REFERENCES ordens_producao(id) ON DELETE CASCADE,
    CONSTRAINT fk_opi_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: consumos_ingredientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS consumos_ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade_planeada DECIMAL(10,3) NOT NULL,
    quantidade_real DECIMAL(10,3) DEFAULT 0,
    custo_unitario DECIMAL(10,2) DEFAULT 0,
    CONSTRAINT fk_cing_ordem FOREIGN KEY (ordem_id) REFERENCES ordens_producao(id) ON DELETE CASCADE,
    CONSTRAINT fk_cing_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: producoes (Módulo Novo de Produção por Lote)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS producoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote VARCHAR(50) NOT NULL UNIQUE,
    data DATE NOT NULL,
    turno_id INT NOT NULL,
    responsavel_id INT NOT NULL,
    estado ENUM('Rascunho', 'Planeada', 'Em_Execucao', 'Finalizada', 'Cancelada') NOT NULL DEFAULT 'Rascunho',
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_producao_turno FOREIGN KEY (turno_id) REFERENCES turnos(id),
    CONSTRAINT fk_producao_resp FOREIGN KEY (responsavel_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: producao_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS producao_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producao_id INT NOT NULL,
    produto_id INT NOT NULL,
    receita_id INT NULL,
    quantidade_planeada DECIMAL(10,2) NOT NULL,
    quantidade_produzida DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rendimento_esperado DECIMAL(10,2) NULL,
    rendimento_real DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pitem_producao FOREIGN KEY (producao_id) REFERENCES producoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pitem_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pitem_receita FOREIGN KEY (receita_id) REFERENCES receitas_producao(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: producao_desvios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS producao_desvios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producao_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade_esperada DECIMAL(10,3) NOT NULL,
    quantidade_real DECIMAL(10,3) NOT NULL,
    diferenca DECIMAL(10,3) NOT NULL,
    motivo VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pdesv_producao FOREIGN KEY (producao_id) REFERENCES producoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pdesv_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: inventarios_contagem
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventarios_contagem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    data_inicio DATETIME NOT NULL,
    data_fecho DATETIME NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Geral', 'Rotativo', 'Ingredientes', 'Produtos'
    estado VARCHAR(30) NOT NULL DEFAULT 'Aberto',
    armazem_id INT NULL,
    responsavel_id INT NOT NULL,
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_inv_armazem FOREIGN KEY (armazem_id) REFERENCES armazens(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_resp FOREIGN KEY (responsavel_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: inventario_contagem_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_contagem_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventario_id INT NOT NULL,
    tipo_item VARCHAR(30) NOT NULL, -- 'Ingrediente', 'Produto', 'Material'
    item_id INT NOT NULL,
    stock_sistema DECIMAL(12,3) NOT NULL,
    stock_contado DECIMAL(12,3) NOT NULL,
    diferenca DECIMAL(12,3) NOT NULL,
    custo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impacto_financeiro DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    justificacao TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invitem_inv FOREIGN KEY (inventario_id) REFERENCES inventarios_contagem(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: requisicoes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS requisicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    data_requisicao DATETIME DEFAULT CURRENT_TIMESTAMP,
    sector_requisitante ENUM('COZINHA', 'PASTELARIA', 'ATENDIMENTO', 'LIMPEZA', 'LOGISTICA') NOT NULL,
    tipo_requisicao ENUM('CONSUMO', 'MATERIAL_REUTILIZAVEL') NOT NULL,
    estado ENUM('PENDENTE', 'APROVADA', 'EM_SEPARACAO', 'ENTREGUE', 'CANCELADA') DEFAULT 'PENDENTE',
    ordem_producao_id INT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_req_op FOREIGN KEY (ordem_producao_id) REFERENCES ordens_producao(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: requisicoes_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS requisicoes_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisicao_id INT NOT NULL,
    tipo_item ENUM('INGREDIENTE', 'MATERIAL', 'OUTRO') NOT NULL,
    item_id INT NOT NULL,
    quantidade_solicitada DECIMAL(10,3) NOT NULL,
    quantidade_entregue DECIMAL(10,3) DEFAULT 0,
    quantidade_devolvida DECIMAL(10,3) DEFAULT 0,
    observacoes TEXT,
    CONSTRAINT fk_ritem_req FOREIGN KEY (requisicao_id) REFERENCES requisicoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: entregas_requisicao
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas_requisicao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisicao_id INT NOT NULL,
    data_entrega DATETIME DEFAULT CURRENT_TIMESTAMP,
    entregue_por INT NOT NULL,
    recebido_por INT NOT NULL,
    observacoes TEXT,
    CONSTRAINT fk_ereq_req FOREIGN KEY (requisicao_id) REFERENCES requisicoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ereq_entregue FOREIGN KEY (entregue_por) REFERENCES users(id),
    CONSTRAINT fk_ereq_recebido FOREIGN KEY (recebido_por) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: devolucoes_materiais
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS devolucoes_materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisicao_id INT NOT NULL,
    data_devolucao DATETIME DEFAULT CURRENT_TIMESTAMP,
    devolvido_por INT NOT NULL,
    recebido_por INT NOT NULL,
    estado_conservacao ENUM('BOM', 'DANIFICADO', 'EXTRAVIADO') DEFAULT 'BOM',
    observacoes TEXT,
    CONSTRAINT fk_dev_req FOREIGN KEY (requisicao_id) REFERENCES requisicoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_dev_devolvido FOREIGN KEY (devolvido_por) REFERENCES users(id),
    CONSTRAINT fk_dev_recebido FOREIGN KEY (recebido_por) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ocorrencias_materiais
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ocorrencias_materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    tipo ENUM('DANIFICADO', 'EXTRAVIADO', 'MANUTENCAO') NOT NULL,
    quantidade INT NOT NULL,
    descricao TEXT NOT NULL,
    data_ocorrencia DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor_prejuizo DECIMAL(10,2) DEFAULT 0,
    responsavel_id INT NULL,
    CONSTRAINT fk_ocor_material FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ocor_resp FOREIGN KEY (responsavel_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: motoristas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS motoristas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    carta_conducao VARCHAR(50) NOT NULL,
    validade_carta DATE NULL,
    estado ENUM('Disponivel', 'Em_Servico', 'Ausente', 'Inativo') DEFAULT 'Disponivel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: viaturas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS viaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    capacidade_kg DECIMAL(10,2) DEFAULT 0,
    capacidade_m3 DECIMAL(10,2) DEFAULT 0,
    estado ENUM('Operacional', 'Em_Uso', 'Manutencao', 'Inoperacional') DEFAULT 'Operacional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: entregas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    motorista_id INT NULL,
    viatura_id INT NULL,
    data_prevista DATE NOT NULL,
    hora_prevista TIME NULL,
    data_saida DATETIME NULL,
    data_entrega DATETIME NULL,
    estado ENUM('Agendada', 'Em_Transito', 'Entregue', 'Falhada', 'Cancelada') DEFAULT 'Agendada',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_entrega_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_entrega_motorista FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE SET NULL,
    CONSTRAINT fk_entrega_viatura FOREIGN KEY (viatura_id) REFERENCES viaturas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: reservas_viaturas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas_viaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    viatura_id INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rviatura_viatura FOREIGN KEY (viatura_id) REFERENCES viaturas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ocorrencias_logisticas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ocorrencias_logisticas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrega_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    data_ocorrencia DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_olog_entrega FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: checklists_entregas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS checklists_entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrega_id INT NOT NULL,
    item VARCHAR(255) NOT NULL,
    conforme BOOLEAN DEFAULT TRUE,
    observacao VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_check_entrega FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: configuracoes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: inventarios (Módulo de Inventário Oficial)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    armazem_id INT NOT NULL,
    tipo ENUM('COMPLETO', 'PARCIAL') NOT NULL DEFAULT 'COMPLETO',
    estado ENUM('RASCUNHO', 'EM_CONTAGEM', 'EM_CONFERENCIA', 'APROVADO', 'APLICADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    data_inventario DATE NOT NULL,
    responsavel_id INT NOT NULL,
    observacao TEXT NULL,
    iniciado_em DATETIME NULL,
    finalizado_em DATETIME NULL,
    aprovado_em DATETIME NULL,
    aprovado_por INT NULL,
    aplicado_em DATETIME NULL,
    aplicado_por INT NULL,
    cancelado_em DATETIME NULL,
    cancelado_por INT NULL,
    motivo_cancelamento VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_inventarios_armazem FOREIGN KEY (armazem_id) REFERENCES armazens(id),
    CONSTRAINT fk_inventarios_resp FOREIGN KEY (responsavel_id) REFERENCES users(id),
    CONSTRAINT fk_inventarios_aprov FOREIGN KEY (aprovado_por) REFERENCES users(id),
    CONSTRAINT fk_inventarios_aplic FOREIGN KEY (aplicado_por) REFERENCES users(id),
    CONSTRAINT fk_inventarios_canc FOREIGN KEY (cancelado_por) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: inventario_items (Itens de Contagem do Inventário)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventario_id INT NOT NULL,
    produto_id INT NULL,
    material_id INT NULL,
    unidade_medida_id INT NULL,
    quantidade_sistema DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    quantidade_contada DECIMAL(12,3) NULL,
    diferenca DECIMAL(12,3) NULL,
    situacao ENUM('SEM_DIVERGENCIA', 'FALTA', 'SOBRA', 'NAO_CONTADO') NOT NULL DEFAULT 'NAO_CONTADO',
    motivo_ajuste ENUM('QUEBRA', 'PERDA', 'DANIFICADO', 'CONSUMO_NAO_REGISTADO', 'ERRO_CONTAGEM', 'ERRO_REGISTO', 'VALIDACAO_INVENTARIO', 'OUTRO') NULL,
    observacao TEXT NULL,
    contado_por INT NULL,
    contado_em DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_inv_items_inventario FOREIGN KEY (inventario_id) REFERENCES inventarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_items_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_material FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_um FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id) ON DELETE SET NULL,
    CONSTRAINT fk_inv_items_contador FOREIGN KEY (contado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIM DO ESQUEMA DE BASE DE DADOS
-- =====================================================
