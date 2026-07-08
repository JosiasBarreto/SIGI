CREATE DATABASE IF NOT EXISTS sigi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sigi_db;

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
    CONSTRAINT fk_users_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: audit_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
    endereco TEXT,
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
    endereco TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: ingredientes (Raw Materials - not for sale)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    stock_atual DECIMAL(10,3) DEFAULT 0,
    stock_minimo DECIMAL(10,3) DEFAULT 0,
    preco_medio DECIMAL(10,2) DEFAULT 0,
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
-- TABLE: produtos (Acabados e Revenda)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    tipo ENUM('Acabado', 'Revenda', 'Consumivel') NOT NULL,
    categoria VARCHAR(100) NULL,
    categoria_id INT NULL,
    unidade_medida_id INT NULL,
    tempo_producao INT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_compra DECIMAL(10,2) NULL DEFAULT 0,
    descricao TEXT,
    stock_atual DECIMAL(10,3) DEFAULT 0,
    stock_minimo DECIMAL(10,3) DEFAULT 0,
    taxa_iva_id INT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_produto_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id),
    CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_produto(id),
    CONSTRAINT fk_produto_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: fichas_tecnicas (Recipes linking product to ingredients)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ficha_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT fk_ficha_ingrediente FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: materiais (Reutilizáveis e Consumíveis)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('Reutilizavel', 'Consumivel') NOT NULL,
    stock_atual DECIMAL(10,2) DEFAULT 0,
    a_ser_devolvido DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: pedidos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NULL,
    tipo ENUM('Simples', 'Composto') NOT NULL,
    estado ENUM('Pendente', 'Producao', 'Pronto', 'Entregue', 'Cancelado') DEFAULT 'Pendente',
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_entrega DATETIME NULL,
    total DECIMAL(10,2) DEFAULT 0,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: itens_pedido
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: movimentacoes_armazem
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes_armazem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Entrada', 'Saida', 'Ajuste') NOT NULL,
    referencia_id INT NULL, -- ID of the ingredient/product/material
    entidade_tipo ENUM('Ingrediente', 'Produto', 'Material') NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    CONSTRAINT fk_mov_armazem_user FOREIGN KEY (created_by) REFERENCES users(id)
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
    deleted_at TIMESTAMP NULL
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
    CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_venda_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TABLE: venda_itens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS venda_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    item_tipo VARCHAR(50) NOT NULL,
    item_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(12,2) DEFAULT 0,
    taxa_iva_id INT NULL,
    taxa_iva DECIMAL(5,2) DEFAULT 0,
    valor_iva DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_venda_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id)
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
    deleted_at TIMESTAMP NULL
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
    referencia VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES vendas(id),
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
    CONSTRAINT fk_contar_venda FOREIGN KEY (venda_id) REFERENCES vendas(id)
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
    deleted_at TIMESTAMP NULL
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
    CONSTRAINT fk_despesa_centro FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------
DELIMITER //

CREATE TRIGGER after_item_pedido_insert
AFTER INSERT ON itens_pedido
FOR EACH ROW
BEGIN
    UPDATE pedidos SET total = total + NEW.subtotal WHERE id = NEW.pedido_id;
END; //

CREATE TRIGGER after_item_pedido_delete
AFTER DELETE ON itens_pedido
FOR EACH ROW
BEGIN
    UPDATE pedidos SET total = total - OLD.subtotal WHERE id = OLD.pedido_id;
END; //

DELIMITER ;

-- -----------------------------------------------------
-- VIEWS
-- -----------------------------------------------------
CREATE OR REPLACE VIEW view_stock_critico AS
SELECT id, nome, stock_atual, stock_minimo, 'Ingrediente' AS tipo 
FROM ingredientes WHERE stock_atual <= stock_minimo AND is_active = TRUE
UNION ALL
SELECT id, nome, stock_atual, stock_minimo, 'Produto' AS tipo 
FROM produtos WHERE stock_atual <= stock_minimo AND is_active = TRUE;

-- -----------------------------------------------------
-- PROCEDURES
-- -----------------------------------------------------
DELIMITER //
CREATE PROCEDURE registrar_movimento_armazem(
    IN p_entidade_tipo VARCHAR(50),
    IN p_referencia_id INT,
    IN p_tipo VARCHAR(20),
    IN p_quantidade DECIMAL(10,3),
    IN p_motivo VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    -- This procedure registers movement and updates stock automatically
    INSERT INTO movimentacoes_armazem (tipo, referencia_id, entidade_tipo, quantidade, motivo, created_by)
    VALUES (p_tipo, p_referencia_id, p_entidade_tipo, p_quantidade, p_motivo, p_user_id);
    
    IF p_entidade_tipo = 'Ingrediente' THEN
        IF p_tipo = 'Entrada' THEN
            UPDATE ingredientes SET stock_atual = stock_atual + p_quantidade WHERE id = p_referencia_id;
        ELSEIF p_tipo = 'Saida' THEN
            UPDATE ingredientes SET stock_atual = stock_atual - p_quantidade WHERE id = p_referencia_id;
        END IF;
    ELSEIF p_entidade_tipo = 'Produto' THEN
        IF p_tipo = 'Entrada' THEN
            UPDATE produtos SET stock_atual = stock_atual + p_quantidade WHERE id = p_referencia_id;
        ELSEIF p_tipo = 'Saida' THEN
            UPDATE produtos SET stock_atual = stock_atual - p_quantidade WHERE id = p_referencia_id;
        END IF;
    ELSEIF p_entidade_tipo = 'Material' THEN
        IF p_tipo = 'Entrada' THEN
            UPDATE materiais SET stock_atual = stock_atual + p_quantidade WHERE id = p_referencia_id;
        ELSEIF p_tipo = 'Saida' THEN
            UPDATE materiais SET stock_atual = stock_atual - p_quantidade WHERE id = p_referencia_id;
        END IF;
    END IF;
END; //
DELIMITER ;
