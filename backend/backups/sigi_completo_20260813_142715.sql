-- MySQL dump 10.13  Distrib 8.0.37, for Win64 (x86_64)
--
-- Host: localhost    Database: sigi_db
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `armazens`
--

DROP TABLE IF EXISTS `armazens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `armazens` (
  `codigo` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `localizacao` varchar(255) DEFAULT NULL,
  `descricao` text,
  `principal` tinyint(1) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_armazens_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `armazens`
--

LOCK TABLES `armazens` WRITE;
/*!40000 ALTER TABLE `armazens` DISABLE KEYS */;
INSERT INTO `armazens` VALUES ('Arm0002','Armazém  Nº1','Morado','Armazém de género alimentares',1,1,'2026-07-07 16:51:15','2026-07-07 16:51:15',NULL,NULL,1,NULL),('Armm1','Armazen de Roupas','Sabor imbetivel','',0,2,'2026-07-15 14:27:12','2026-07-15 14:27:12',NULL,NULL,1,NULL),('ARM000003','Armi','dsrereersr','',0,4,'2026-07-15 15:33:21','2026-07-15 15:33:21',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `armazens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilizador_id` int DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `modulo` varchar(100) DEFAULT NULL,
  `entidade` varchar(100) DEFAULT NULL,
  `registo_id` int DEFAULT NULL,
  `operacao` varchar(50) NOT NULL,
  `valor_anterior` json DEFAULT NULL,
  `valor_novo` json DEFAULT NULL,
  `justificativa` text,
  `data_hora` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_auditoria_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_auditoria_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=469 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (445,1,'192.168.100.141',NULL,'users',1,'LOGIN','null','null',NULL,'2026-08-13 11:35:37'),(446,1,'192.168.100.141',NULL,'caixas',10,'ABRIR','null','null',NULL,'2026-08-13 11:39:29'),(447,1,'192.168.100.141',NULL,'vendas',49,'ADD_PAGAMENTO','null','{\"troco\": 13.71374999999989, \"valor\": 2073.86125}',NULL,'2026-08-13 12:01:39'),(448,1,'192.168.100.141',NULL,'movimentacoes_armazem',70,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 10.0, \"justificacao\": \"Venda FR 2026/000001\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 12:01:39'),(449,1,'192.168.100.141',NULL,'movimentacoes_armazem',71,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 5.0, \"justificacao\": \"Venda FR 2026/000001\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 31}',NULL,'2026-08-13 12:01:39'),(450,1,'192.168.100.141',NULL,'movimentacoes_armazem',72,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 6.0, \"justificacao\": \"Venda FR 2026/000001\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 19}',NULL,'2026-08-13 12:01:39'),(451,1,'192.168.100.141',NULL,'movimentacoes_armazem',73,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 2.0, \"justificacao\": \"Venda FR 2026/000001\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 5}',NULL,'2026-08-13 12:01:39'),(452,1,'192.168.100.141','COMERCIAL','vendas',49,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000001\"}',NULL,'2026-08-13 12:01:39'),(453,1,'192.168.100.141',NULL,'vendas',50,'ADD_PAGAMENTO','null','{\"troco\": 2.9299999999999784, \"valor\": 173.02}',NULL,'2026-08-13 13:47:06'),(454,1,'192.168.100.141',NULL,'movimentacoes_armazem',74,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 10.0, \"justificacao\": \"Venda FR 2026/000002\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 13:47:06'),(455,1,'192.168.100.141','COMERCIAL','vendas',50,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000002\"}',NULL,'2026-08-13 13:47:06'),(456,1,'192.168.100.141',NULL,'vendas',51,'ADD_PAGAMENTO','null','{\"troco\": 0.0, \"valor\": 8.05}',NULL,'2026-08-13 13:51:19'),(457,1,'192.168.100.141',NULL,'movimentacoes_armazem',75,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 1.0, \"justificacao\": \"Venda FR 2026/000003\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 13:51:19'),(458,1,'192.168.100.141','COMERCIAL','vendas',51,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000003\"}',NULL,'2026-08-13 13:51:19'),(459,1,'192.168.100.141',NULL,'vendas',52,'ADD_PAGAMENTO','null','{\"troco\": 0.3499999999999943, \"valor\": 248.0}',NULL,'2026-08-13 13:58:20'),(460,1,'192.168.100.141',NULL,'movimentacoes_armazem',76,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 4.0, \"justificacao\": \"Venda FR 2026/000004\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 13:58:20'),(461,1,'192.168.100.141',NULL,'movimentacoes_armazem',77,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 3.0, \"justificacao\": \"Venda FR 2026/000004\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 31}',NULL,'2026-08-13 13:58:20'),(462,1,'192.168.100.141','COMERCIAL','vendas',52,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000004\"}',NULL,'2026-08-13 13:58:20'),(463,1,'192.168.100.141',NULL,'vendas',53,'ADD_PAGAMENTO','null','{\"troco\": 0.0, \"valor\": 78.2}',NULL,'2026-08-13 14:09:19'),(464,1,'192.168.100.141',NULL,'movimentacoes_armazem',78,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 4.0, \"justificacao\": \"Venda FR 2026/000005\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 14:09:19'),(465,1,'192.168.100.141','COMERCIAL','vendas',53,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000005\"}',NULL,'2026-08-13 14:09:19'),(466,1,'192.168.100.141',NULL,'vendas',54,'ADD_PAGAMENTO','null','{\"troco\": 0.0, \"valor\": 66.7}',NULL,'2026-08-13 14:13:28'),(467,1,'192.168.100.141',NULL,'movimentacoes_armazem',79,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 4.0, \"justificacao\": \"Venda FR 2026/000006\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 44}',NULL,'2026-08-13 14:13:28'),(468,1,'192.168.100.141','COMERCIAL','vendas',54,'CREATE_VENDA','null','{\"numero\": \"FR 2026/000006\"}',NULL,'2026-08-13 14:13:28');
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caixas`
--

DROP TABLE IF EXISTS `caixas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caixas` (
  `numero` varchar(50) NOT NULL,
  `data_abertura` datetime NOT NULL,
  `data_fecho` datetime DEFAULT NULL,
  `valor_inicial` decimal(12,2) DEFAULT NULL,
  `valor_final` decimal(12,2) DEFAULT NULL,
  `utilizador_abertura_id` int NOT NULL,
  `utilizador_fecho_id` int DEFAULT NULL,
  `estado` enum('ABERTO','FECHADO') DEFAULT NULL,
  `valor_declarado_dinheiro` decimal(12,2) DEFAULT NULL,
  `valor_declarado_transferencia` decimal(12,2) DEFAULT NULL,
  `valor_declarado_pos` decimal(12,2) DEFAULT NULL,
  `valor_esperado_dinheiro` decimal(12,2) DEFAULT NULL,
  `valor_esperado_transferencia` decimal(12,2) DEFAULT NULL,
  `valor_esperado_pos` decimal(12,2) DEFAULT NULL,
  `diferenca_dinheiro` decimal(12,2) DEFAULT NULL,
  `diferenca_transferencia` decimal(12,2) DEFAULT NULL,
  `diferenca_pos` decimal(12,2) DEFAULT NULL,
  `explicacao_divergencia` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_caixas_numero` (`numero`),
  KEY `fk_caixas_utilizador_abertura_id_users` (`utilizador_abertura_id`),
  KEY `fk_caixas_utilizador_fecho_id_users` (`utilizador_fecho_id`),
  CONSTRAINT `fk_caixas_utilizador_abertura_id_users` FOREIGN KEY (`utilizador_abertura_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_caixas_utilizador_fecho_id_users` FOREIGN KEY (`utilizador_fecho_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caixas`
--

LOCK TABLES `caixas` WRITE;
/*!40000 ALTER TABLE `caixas` DISABLE KEYS */;
INSERT INTO `caixas` VALUES ('CX-20260813113929','2026-08-13 11:39:29',NULL,100.00,0.00,1,NULL,'ABERTO',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,10,'2026-08-13 11:39:29','2026-08-13 11:39:29',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `caixas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_produto`
--

DROP TABLE IF EXISTS `categorias_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_produto` (
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_produto`
--

LOCK TABLES `categorias_produto` WRITE;
/*!40000 ALTER TABLE `categorias_produto` DISABLE KEYS */;
INSERT INTO `categorias_produto` VALUES ('Alimentares','',1,'2026-07-07 16:45:25','2026-07-07 16:45:25',1,NULL,1,NULL),('Frescos','',2,'2026-07-07 16:46:11','2026-07-07 16:46:11',1,NULL,1,NULL),('Bebidas','',3,'2026-07-07 16:46:17','2026-07-07 16:46:17',1,NULL,1,NULL),('Alcolicas','',4,'2026-07-07 16:46:27','2026-07-07 16:46:27',1,NULL,1,NULL);
/*!40000 ALTER TABLE `categorias_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `centros_custo`
--

DROP TABLE IF EXISTS `centros_custo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `centros_custo` (
  `nome` varchar(100) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_centros_custo_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `centros_custo`
--

LOCK TABLES `centros_custo` WRITE;
/*!40000 ALTER TABLE `centros_custo` DISABLE KEYS */;
/*!40000 ALTER TABLE `centros_custo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checklists_entregas`
--

DROP TABLE IF EXISTS `checklists_entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklists_entregas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entrega_id` int NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `item` varchar(255) NOT NULL,
  `validado` tinyint(1) DEFAULT NULL,
  `observacao` text,
  PRIMARY KEY (`id`),
  KEY `fk_checklists_entregas_entrega_id_entregas` (`entrega_id`),
  CONSTRAINT `fk_checklists_entregas_entrega_id_entregas` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklists_entregas`
--

LOCK TABLES `checklists_entregas` WRITE;
/*!40000 ALTER TABLE `checklists_entregas` DISABLE KEYS */;
/*!40000 ALTER TABLE `checklists_entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `nome` varchar(100) NOT NULL,
  `empresa` varchar(100) DEFAULT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `morada` text,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `percentagem_desconto_padrao` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clientes_nif` (`nif`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES ('Pereira Barreto','CFP STP','093839000332','9087876','+2399012576','tl80207@gmail.com','Trás Cadeia','Cliente VIP',1,'2026-07-08 13:41:31','2026-07-08 16:19:19',1,NULL,1,NULL,0.00),('Josias Vaz Pereira Barreto','FCT STP','0938390003212121','9087876','+2399956478','josiasbarreto11@gmail.com','Trás Cadeia','ddss',2,'2026-07-08 16:05:21','2026-08-04 11:08:56',1,NULL,1,NULL,0.00),('João',NULL,'999',NULL,NULL,NULL,NULL,NULL,3,'2026-07-10 15:28:43','2026-07-23 12:39:22',2,NULL,0,NULL,0.00),('António Assunção','FCT STP','093839000332222','9916658','+2399916658','stptic@gmail.com','Trás Cadeia','',4,'2026-08-04 12:12:49','2026-08-04 12:12:49',1,NULL,1,NULL,0.00),('E2E Client',NULL,'888888888',NULL,NULL,NULL,NULL,NULL,5,'2026-08-12 13:54:39','2026-08-12 13:54:39',NULL,NULL,1,NULL,0.00);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consumos_ingredientes`
--

DROP TABLE IF EXISTS `consumos_ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumos_ingredientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem_producao_id` int NOT NULL,
  `ingrediente_id` int DEFAULT NULL,
  `quantidade_prevista` decimal(10,3) NOT NULL,
  `quantidade_consumida` decimal(10,3) DEFAULT NULL,
  `data_consumo` datetime DEFAULT NULL,
  `produto_consumivel_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_consumos_ingredientes_ordem_producao_id_ordens_producao` (`ordem_producao_id`),
  KEY `fk_consumos_ingredientes_ingrediente_id_ingredientes` (`ingrediente_id`),
  CONSTRAINT `fk_consumos_ingredientes_ingrediente_id_ingredientes` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`),
  CONSTRAINT `fk_consumos_ingredientes_ordem_producao_id_ordens_producao` FOREIGN KEY (`ordem_producao_id`) REFERENCES `ordens_producao` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consumos_ingredientes`
--

LOCK TABLES `consumos_ingredientes` WRITE;
/*!40000 ALTER TABLE `consumos_ingredientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `consumos_ingredientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contas_pagar`
--

DROP TABLE IF EXISTS `contas_pagar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_pagar` (
  `fornecedor_id` int DEFAULT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `vencimento` date NOT NULL,
  `estado` enum('ABERTA','PARCIAL','PAGA','ATRASADA') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_contas_pagar_fornecedor_id_fornecedores` (`fornecedor_id`),
  CONSTRAINT `fk_contas_pagar_fornecedor_id_fornecedores` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contas_pagar`
--

LOCK TABLES `contas_pagar` WRITE;
/*!40000 ALTER TABLE `contas_pagar` DISABLE KEYS */;
/*!40000 ALTER TABLE `contas_pagar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contas_receber`
--

DROP TABLE IF EXISTS `contas_receber`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_receber` (
  `cliente_id` int DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  `venda_id` int DEFAULT NULL,
  `valor_original` decimal(12,2) NOT NULL,
  `valor_pago` decimal(12,2) DEFAULT NULL,
  `saldo` decimal(12,2) NOT NULL,
  `vencimento` date NOT NULL,
  `estado` enum('ABERTA','PARCIAL','PAGA','ATRASADA') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_contas_receber_cliente_id_clientes` (`cliente_id`),
  KEY `fk_contas_receber_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_contas_receber_evento_id_eventos` (`evento_id`),
  KEY `fk_contas_receber_venda_id_vendas` (`venda_id`),
  CONSTRAINT `fk_contas_receber_cliente_id_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_contas_receber_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_contas_receber_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_contas_receber_venda_id_vendas` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contas_receber`
--

LOCK TABLES `contas_receber` WRITE;
/*!40000 ALTER TABLE `contas_receber` DISABLE KEYS */;
/*!40000 ALTER TABLE `contas_receber` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despesas`
--

DROP TABLE IF EXISTS `despesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despesas` (
  `categoria` enum('FORNECEDOR','COMBUSTIVEL','SALARIO','ENERGIA','AGUA','INTERNET','MANUTENCAO','OUTROS') NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `data_despesa` date NOT NULL,
  `centro_custo_id` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_despesas_centro_custo_id_centros_custo` (`centro_custo_id`),
  CONSTRAINT `fk_despesas_centro_custo_id_centros_custo` FOREIGN KEY (`centro_custo_id`) REFERENCES `centros_custo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despesas`
--

LOCK TABLES `despesas` WRITE;
/*!40000 ALTER TABLE `despesas` DISABLE KEYS */;
/*!40000 ALTER TABLE `despesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devolucoes_materiais`
--

DROP TABLE IF EXISTS `devolucoes_materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devolucoes_materiais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisicao_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantidade_entregue` decimal(10,3) NOT NULL,
  `quantidade_devolvida` decimal(10,3) DEFAULT NULL,
  `quantidade_danificada` decimal(10,3) DEFAULT NULL,
  `quantidade_perdida` decimal(10,3) DEFAULT NULL,
  `data_devolucao` datetime NOT NULL,
  `observacao` text,
  PRIMARY KEY (`id`),
  KEY `fk_devolucoes_materiais_requisicao_id_requisicoes` (`requisicao_id`),
  KEY `fk_devolucoes_materiais_material_id_materiais` (`material_id`),
  CONSTRAINT `fk_devolucoes_materiais_material_id_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais` (`id`),
  CONSTRAINT `fk_devolucoes_materiais_requisicao_id_requisicoes` FOREIGN KEY (`requisicao_id`) REFERENCES `requisicoes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devolucoes_materiais`
--

LOCK TABLES `devolucoes_materiais` WRITE;
/*!40000 ALTER TABLE `devolucoes_materiais` DISABLE KEYS */;
/*!40000 ALTER TABLE `devolucoes_materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `nome` varchar(150) NOT NULL,
  `nif` varchar(50) DEFAULT NULL,
  `licenca_empresa` varchar(100) DEFAULT NULL,
  `licenca_aplicacao` varchar(100) DEFAULT NULL,
  `endereco_web` varchar(150) DEFAULT NULL,
  `utiliza_iva` tinyint(1) DEFAULT NULL,
  `correio_eletronico` varchar(150) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `telemoveis` varchar(100) DEFAULT NULL,
  `localizacao` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `moeda` varchar(10) DEFAULT NULL,
  `tipo_formato_impressao` varchar(50) DEFAULT NULL,
  `numero_whatsapp` varchar(50) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa`
--

LOCK TABLES `empresa` WRITE;
/*!40000 ALTER TABLE `empresa` DISABLE KEYS */;
INSERT INTO `empresa` VALUES ('Sabor Imbativel. LDA','093839000332','CERT-2026-SX','APP-2026-SX','https://aistudio.google.com/apps/4c80d4c1-c279-4683-9018-66015f60baf9?showAssistant=true&showCode=true',1,'josiasbarreto11@gmail.com','9956478','9912586','Correia/Água Grande-São Tomé','','STN','Talão 80mm','+2399956478',1,'2026-07-07 16:24:53','2026-08-13 14:26:27',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas`
--

DROP TABLE IF EXISTS `entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas` (
  `numero` varchar(50) NOT NULL,
  `pedido_id` int DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  `motorista_id` int NOT NULL,
  `viatura_id` int NOT NULL,
  `data_saida` date DEFAULT NULL,
  `hora_saida` time DEFAULT NULL,
  `data_entrega` date DEFAULT NULL,
  `hora_entrega` time DEFAULT NULL,
  `estado` enum('AGENDADA','EM_TRANSITO','ENTREGUE','RECOLHIDA','CANCELADA') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entregas_numero` (`numero`),
  KEY `fk_entregas_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_entregas_evento_id_eventos` (`evento_id`),
  KEY `fk_entregas_motorista_id_motoristas` (`motorista_id`),
  KEY `fk_entregas_viatura_id_viaturas` (`viatura_id`),
  CONSTRAINT `fk_entregas_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_entregas_motorista_id_motoristas` FOREIGN KEY (`motorista_id`) REFERENCES `motoristas` (`id`),
  CONSTRAINT `fk_entregas_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_entregas_viatura_id_viaturas` FOREIGN KEY (`viatura_id`) REFERENCES `viaturas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas`
--

LOCK TABLES `entregas` WRITE;
/*!40000 ALTER TABLE `entregas` DISABLE KEYS */;
/*!40000 ALTER TABLE `entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas_requisicao`
--

DROP TABLE IF EXISTS `entregas_requisicao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas_requisicao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisicao_id` int NOT NULL,
  `armazem_responsavel_id` int NOT NULL,
  `data_entrega` date NOT NULL,
  `hora_entrega` time NOT NULL,
  `observacao` text,
  PRIMARY KEY (`id`),
  KEY `fk_entregas_requisicao_requisicao_id_requisicoes` (`requisicao_id`),
  KEY `fk_entregas_requisicao_armazem_responsavel_id_users` (`armazem_responsavel_id`),
  CONSTRAINT `fk_entregas_requisicao_armazem_responsavel_id_users` FOREIGN KEY (`armazem_responsavel_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_entregas_requisicao_requisicao_id_requisicoes` FOREIGN KEY (`requisicao_id`) REFERENCES `requisicoes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas_requisicao`
--

LOCK TABLES `entregas_requisicao` WRITE;
/*!40000 ALTER TABLE `entregas_requisicao` DISABLE KEYS */;
/*!40000 ALTER TABLE `entregas_requisicao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipas_cadastro`
--

DROP TABLE IF EXISTS `equipas_cadastro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipas_cadastro` (
  `nome` varchar(100) NOT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `descricao` text,
  `custo_sugerido` decimal(10,2) DEFAULT NULL,
  `preco_sugerido` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipas_cadastro`
--

LOCK TABLES `equipas_cadastro` WRITE;
/*!40000 ALTER TABLE `equipas_cadastro` DISABLE KEYS */;
INSERT INTO `equipas_cadastro` VALUES ('Chefe de Cozinha','Cozinha','Cargo de Chefe de Cozinha na equipa de Cozinha',35.00,70.00,1,1,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Cozinheiro','Cozinha','Cargo de Cozinheiro na equipa de Cozinha',20.00,45.00,1,2,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Pasteleiro','Pastelaria','Cargo de Pasteleiro na equipa de Pastelaria',20.00,45.00,1,3,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Empregado de Mesa','Atendimento','Cargo de Empregado de Mesa na equipa de Atendimento',15.00,30.00,1,4,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Bartender','Bar','Cargo de Bartender na equipa de Bar',18.00,35.00,1,5,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Motorista / Logistica','Logistica','Cargo de Motorista / Logistica na equipa de Logistica',15.00,30.00,1,6,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Supervisor de Evento','Gestao','Cargo de Supervisor de Evento na equipa de Gestao',30.00,60.00,1,7,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `equipas_cadastro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `espacos`
--

DROP TABLE IF EXISTS `espacos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `espacos` (
  `nome` varchar(100) NOT NULL,
  `capacidade` int NOT NULL,
  `descricao` text,
  `estado` enum('ATIVO','INATIVO') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `preco_aluguer` decimal(10,2) DEFAULT '0.00',
  `localizacao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `espacos`
--

LOCK TABLES `espacos` WRITE;
/*!40000 ALTER TABLE `espacos` DISABLE KEYS */;
INSERT INTO `espacos` VALUES ('Salão Nobre Principal',350,'Salão climatizado com palco e pista','ATIVO',1,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL,500.00,'Piso 1'),('Jardim de Eventos',200,'Área verde para cerimónias e cocktails ao ar livre','ATIVO',2,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL,350.00,'Exterior'),('Área VIP Lounge',80,'Espaço reservado para pequenos eventos e recepções','ATIVO',3,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL,250.00,'Piso 2'),('Sala de Conferências',120,'Aparelhagem audiovisual e projetores','ATIVO',4,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL,200.00,'Bloco B');
/*!40000 ALTER TABLE `espacos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `numero` varchar(50) NOT NULL,
  `cliente_id` int NOT NULL,
  `tipo_evento` enum('CASAMENTO','ANIVERSARIO','BATIZADO','EMPRESARIAL','CATERING','FORMATURA','OUTRO') NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descricao` text,
  `local_evento` varchar(255) DEFAULT NULL,
  `data_evento` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `numero_convidados` int NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `valor_pago` decimal(10,2) DEFAULT NULL,
  `saldo` decimal(10,2) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `responsavel_id` int DEFAULT NULL,
  `cronograma` json DEFAULT NULL,
  `checklist` json DEFAULT NULL,
  `equipamentos` json DEFAULT NULL,
  `cobrar_iva_servicos` tinyint(1) DEFAULT '1',
  `taxa_iva_servicos` decimal(10,2) DEFAULT '15.00',
  `desconto_total` decimal(10,2) DEFAULT '0.00',
  `valor_deslocacao` decimal(10,2) DEFAULT '0.00',
  `outros_encargos` decimal(10,2) DEFAULT '0.00',
  `numero_convidados_confirmados` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eventos_numero` (`numero`),
  KEY `fk_eventos_cliente_id_clientes` (`cliente_id`),
  KEY `fk_evento_pedido` (`pedido_id`),
  CONSTRAINT `fk_evento_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos_equipas`
--

DROP TABLE IF EXISTS `eventos_equipas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_equipas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `utilizador_id` int NOT NULL,
  `funcao` enum('CHEFE_COZINHA','COZINHEIRO','PASTELEIRO','ATENDIMENTO','BAR','MOTORISTA','SUPERVISOR') NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eventos_equipas_evento_id_eventos` (`evento_id`),
  KEY `fk_eventos_equipas_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_eventos_equipas_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_eventos_equipas_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos_equipas`
--

LOCK TABLES `eventos_equipas` WRITE;
/*!40000 ALTER TABLE `eventos_equipas` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventos_equipas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos_itens`
--

DROP TABLE IF EXISTS `eventos_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `tipo_item` varchar(50) NOT NULL,
  `referencia_id` int DEFAULT NULL,
  `produto_id` int DEFAULT NULL,
  `descricao` varchar(255) NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `unidade` varchar(50) DEFAULT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  `percentual_desconto` decimal(10,2) DEFAULT NULL,
  `valor_desconto` decimal(10,2) DEFAULT NULL,
  `taxa_iva` decimal(10,2) DEFAULT NULL,
  `valor_iva` decimal(10,2) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `observacoes` text,
  `sugestao_politica_id` int DEFAULT NULL,
  `sugestao_origem` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eventos_itens_evento_id_eventos` (`evento_id`),
  KEY `fk_eventos_itens_produto_id_produtos` (`produto_id`),
  CONSTRAINT `fk_eventos_itens_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_eventos_itens_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos_itens`
--

LOCK TABLES `eventos_itens` WRITE;
/*!40000 ALTER TABLE `eventos_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventos_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos_servicos`
--

DROP TABLE IF EXISTS `eventos_servicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_servicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `tipo` enum('COZINHA','PASTELARIA','BAR','LOGISTICA','ALUGUER','LIMPEZA','SEGURANCA') NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `deslocacao` decimal(10,2) DEFAULT '0.00',
  `observacoes` text,
  PRIMARY KEY (`id`),
  KEY `fk_eventos_servicos_evento_id_eventos` (`evento_id`),
  CONSTRAINT `fk_eventos_servicos_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos_servicos`
--

LOCK TABLES `eventos_servicos` WRITE;
/*!40000 ALTER TABLE `eventos_servicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventos_servicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fechos_diarios`
--

DROP TABLE IF EXISTS `fechos_diarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fechos_diarios` (
  `data` date NOT NULL,
  `total_vendas` decimal(12,2) DEFAULT NULL,
  `total_recebido` decimal(12,2) DEFAULT NULL,
  `total_despesas` decimal(12,2) DEFAULT NULL,
  `total_caixas` decimal(12,2) DEFAULT NULL,
  `observacoes` text,
  `criado_por` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fechos_diarios_data` (`data`),
  KEY `fk_fechos_diarios_criado_por_users` (`criado_por`),
  CONSTRAINT `fk_fechos_diarios_criado_por_users` FOREIGN KEY (`criado_por`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fechos_diarios`
--

LOCK TABLES `fechos_diarios` WRITE;
/*!40000 ALTER TABLE `fechos_diarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `fechos_diarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fichas_tecnicas`
--

DROP TABLE IF EXISTS `fichas_tecnicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas_tecnicas` (
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `tipo` enum('COZINHA','PASTELARIA') NOT NULL,
  `produto_acabado_id` int NOT NULL,
  `tempo_producao_minutos` int DEFAULT NULL,
  `rendimento` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fichas_tecnicas_codigo` (`codigo`),
  KEY `fk_fichas_tecnicas_produto_acabado_id_produtos` (`produto_acabado_id`),
  CONSTRAINT `fk_fichas_tecnicas_produto_acabado_id_produtos` FOREIGN KEY (`produto_acabado_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fichas_tecnicas`
--

LOCK TABLES `fichas_tecnicas` WRITE;
/*!40000 ALTER TABLE `fichas_tecnicas` DISABLE KEYS */;
/*!40000 ALTER TABLE `fichas_tecnicas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fichas_tecnicas_itens`
--

DROP TABLE IF EXISTS `fichas_tecnicas_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas_tecnicas_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ficha_tecnica_id` int NOT NULL,
  `ingrediente_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `unidade` varchar(20) NOT NULL,
  `observacao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_fichas_tecnicas_itens_ficha_tecnica_id_fichas_tecnicas` (`ficha_tecnica_id`),
  KEY `fk_fichas_tecnicas_itens_ingrediente_id_ingredientes` (`ingrediente_id`),
  CONSTRAINT `fk_fichas_tecnicas_itens_ficha_tecnica_id_fichas_tecnicas` FOREIGN KEY (`ficha_tecnica_id`) REFERENCES `fichas_tecnicas` (`id`),
  CONSTRAINT `fk_fichas_tecnicas_itens_ingrediente_id_ingredientes` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fichas_tecnicas_itens`
--

LOCK TABLES `fichas_tecnicas_itens` WRITE;
/*!40000 ALTER TABLE `fichas_tecnicas_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `fichas_tecnicas_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formas_pagamento`
--

DROP TABLE IF EXISTS `formas_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formas_pagamento` (
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_formas_pagamento_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formas_pagamento`
--

LOCK TABLES `formas_pagamento` WRITE;
/*!40000 ALTER TABLE `formas_pagamento` DISABLE KEYS */;
INSERT INTO `formas_pagamento` VALUES ('Dinheiro',1,1,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('Transferência',1,2,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('POS',1,3,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('Mixto',1,4,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `formas_pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fornecedores`
--

DROP TABLE IF EXISTS `fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedores` (
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `morada` text,
  `contacto_principal` varchar(100) DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fornecedores_codigo` (`codigo`),
  UNIQUE KEY `uq_fornecedores_nif` (`nif`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fornecedores`
--

LOCK TABLES `fornecedores` WRITE;
/*!40000 ALTER TABLE `fornecedores` DISABLE KEYS */;
INSERT INTO `fornecedores` VALUES (NULL,'Fornecedor Teste','123456789',NULL,NULL,NULL,NULL,NULL,1,'2026-08-12 13:54:35','2026-08-12 13:54:35',12,NULL,1,NULL);
/*!40000 ALTER TABLE `fornecedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_reservas_materiais`
--

DROP TABLE IF EXISTS `historico_reservas_materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_reservas_materiais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reserva_material_id` int NOT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `estado_novo` varchar(50) NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `observacoes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_historico_reservas_materiais_reserva_material_id_rese_a2e3` (`reserva_material_id`),
  KEY `fk_historico_reservas_materiais_created_by_users` (`created_by`),
  CONSTRAINT `fk_historico_reservas_materiais_created_by_users` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_historico_reservas_materiais_reserva_material_id_rese_a2e3` FOREIGN KEY (`reserva_material_id`) REFERENCES `reservas_materiais` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_reservas_materiais`
--

LOCK TABLES `historico_reservas_materiais` WRITE;
/*!40000 ALTER TABLE `historico_reservas_materiais` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_reservas_materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingrediente_stock_armazem`
--

DROP TABLE IF EXISTS `ingrediente_stock_armazem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingrediente_stock_armazem` (
  `ingrediente_id` int NOT NULL,
  `armazem_id` int NOT NULL,
  `stock_atual` decimal(10,3) NOT NULL,
  `stock_minimo` decimal(10,3) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ingrediente_armazem_stock` (`ingrediente_id`,`armazem_id`),
  KEY `fk_ingrediente_stock_armazem_armazem_id_armazens` (`armazem_id`),
  CONSTRAINT `fk_ingrediente_stock_armazem_armazem_id_armazens` FOREIGN KEY (`armazem_id`) REFERENCES `armazens` (`id`),
  CONSTRAINT `fk_ingrediente_stock_armazem_ingrediente_id_ingredientes` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingrediente_stock_armazem`
--

LOCK TABLES `ingrediente_stock_armazem` WRITE;
/*!40000 ALTER TABLE `ingrediente_stock_armazem` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingrediente_stock_armazem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredientes`
--

DROP TABLE IF EXISTS `ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredientes` (
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `unidade_medida` varchar(20) NOT NULL,
  `stock_atual` decimal(10,3) DEFAULT NULL,
  `stock_minimo` decimal(10,3) DEFAULT NULL,
  `stock_maximo` decimal(10,3) DEFAULT NULL,
  `validade` date DEFAULT NULL,
  `preco_compra` decimal(10,2) DEFAULT NULL,
  `observacoes` text,
  `fornecedor_id` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ingredientes_codigo` (`codigo`),
  KEY `fk_ingredientes_fornecedor_id_fornecedores` (`fornecedor_id`),
  CONSTRAINT `fk_ingredientes_fornecedor_id_fornecedores` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredientes`
--

LOCK TABLES `ingredientes` WRITE;
/*!40000 ALTER TABLE `ingredientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario_contagem_itens`
--

DROP TABLE IF EXISTS `inventario_contagem_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario_contagem_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventario_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `stock_sistema` decimal(10,3) NOT NULL,
  `stock_real` decimal(10,3) NOT NULL,
  `diferenca` decimal(10,3) NOT NULL,
  `justificativa` text,
  PRIMARY KEY (`id`),
  KEY `fk_inventario_contagem_itens_inventario_id_inventarios_contagem` (`inventario_id`),
  KEY `fk_inventario_contagem_itens_produto_id_produtos` (`produto_id`),
  CONSTRAINT `fk_inventario_contagem_itens_inventario_id_inventarios_contagem` FOREIGN KEY (`inventario_id`) REFERENCES `inventarios_contagem` (`id`),
  CONSTRAINT `fk_inventario_contagem_itens_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario_contagem_itens`
--

LOCK TABLES `inventario_contagem_itens` WRITE;
/*!40000 ALTER TABLE `inventario_contagem_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventario_contagem_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario_items`
--

DROP TABLE IF EXISTS `inventario_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventario_id` int NOT NULL,
  `tipo_item` enum('INGREDIENTE','MATERIAL','PRODUTO') NOT NULL,
  `referencia_id` int NOT NULL,
  `quantidade_sistema` decimal(12,2) NOT NULL,
  `quantidade_contada` decimal(12,2) NOT NULL,
  `diferenca` decimal(12,2) NOT NULL,
  `justificativa` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_inventario_items_inventario_id_inventarios` (`inventario_id`),
  CONSTRAINT `fk_inventario_items_inventario_id_inventarios` FOREIGN KEY (`inventario_id`) REFERENCES `inventarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario_items`
--

LOCK TABLES `inventario_items` WRITE;
/*!40000 ALTER TABLE `inventario_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventario_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventarios`
--

DROP TABLE IF EXISTS `inventarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventarios` (
  `numero` varchar(50) NOT NULL,
  `tipo` enum('GERAL','PARCIAL') NOT NULL,
  `estado` enum('RASCUNHO','CONCLUIDO','CANCELADO') DEFAULT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime DEFAULT NULL,
  `observacoes` text,
  `utilizador_id` int NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventarios_numero` (`numero`),
  KEY `fk_inventarios_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_inventarios_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventarios`
--

LOCK TABLES `inventarios` WRITE;
/*!40000 ALTER TABLE `inventarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventarios_contagem`
--

DROP TABLE IF EXISTS `inventarios_contagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventarios_contagem` (
  `data_contagem` datetime NOT NULL,
  `responsavel_id` int NOT NULL,
  `estado` enum('RASCUNHO','CONCLUIDO','CANCELADO') DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_inventarios_contagem_responsavel_id_users` (`responsavel_id`),
  CONSTRAINT `fk_inventarios_contagem_responsavel_id_users` FOREIGN KEY (`responsavel_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventarios_contagem`
--

LOCK TABLES `inventarios_contagem` WRITE;
/*!40000 ALTER TABLE `inventarios_contagem` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventarios_contagem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens_pedido`
--

DROP TABLE IF EXISTS `itens_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_pedido` (
  `pedido_id` int NOT NULL,
  `tipo_item` varchar(50) NOT NULL,
  `produto_id` int DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  `desconto` decimal(10,2) DEFAULT '0.00',
  `taxa_iva_id` int DEFAULT NULL,
  `taxa_iva` decimal(5,2) DEFAULT '0.00',
  `valor_iva` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_itens_pedido_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_itens_pedido_produto_id_produtos` (`produto_id`),
  CONSTRAINT `fk_itens_pedido_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_itens_pedido_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_pedido`
--

LOCK TABLES `itens_pedido` WRITE;
/*!40000 ALTER TABLE `itens_pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `itens_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_acessos`
--

DROP TABLE IF EXISTS `log_acessos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_acessos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilizador_id` int DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `data_login` datetime NOT NULL,
  `data_logout` datetime DEFAULT NULL,
  `sucesso` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_acessos_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_log_acessos_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_acessos`
--

LOCK TABLES `log_acessos` WRITE;
/*!40000 ALTER TABLE `log_acessos` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_acessos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_erros`
--

DROP TABLE IF EXISTS `log_erros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_erros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(100) NOT NULL,
  `mensagem` text NOT NULL,
  `stacktrace` text,
  `rota` varchar(255) DEFAULT NULL,
  `utilizador_id` int DEFAULT NULL,
  `data_hora` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_erros_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_log_erros_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=849 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_erros`
--

LOCK TABLES `log_erros` WRITE;
/*!40000 ALTER TABLE `log_erros` DISABLE KEYS */;
INSERT INTO `log_erros` VALUES (815,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:35:37'),(816,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:35:38'),(817,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:35:40'),(818,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:35:44'),(819,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:36:18'),(820,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:36:19'),(821,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 11:36:40'),(822,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 11:36:40'),(823,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 11:36:41'),(824,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 11:36:42'),(825,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 11:36:42'),(826,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 11:36:42'),(827,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 11:36:44'),(828,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 11:36:44'),(829,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 11:36:44'),(830,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:37:08'),(831,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000002D095759490>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 11:37:09'),(832,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 11:37:29'),(833,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 11:37:29'),(834,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 11:37:29'),(835,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 11:37:30'),(836,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 11:37:30'),(837,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 11:37:30'),(838,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 13:42:16'),(839,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 13:42:17'),(840,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 13:42:19'),(841,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 13:42:20'),(842,'Exception','Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\relatorios_controller.py\", line 26, in get_dashboard\n    recent_pedidos = db.session.query(Venda.created_at, Venda.total).filter(Venda.created_at >= six_months_ago, Venda.estado != EstadoVenda.CANCELADO).all()\n                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\scoping.py\", line 1683, in query\n    return self._proxied.query(*entities, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\session.py\", line 2896, in query\n    return self._query_cls(entities, self, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 275, in __init__\n    self._set_entities(entities)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 288, in _set_entities\n    coercions.expect(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 396, in expect\n    resolved = impl._literal_coercion(\n               ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 634, in _literal_coercion\n    self._raise_for_expected(element, argname)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 1122, in _raise_for_expected\n    return super()._raise_for_expected(\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 693, in _raise_for_expected\n    super()._raise_for_expected(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\coercions.py\", line 518, in _raise_for_expected\n    raise exc.ArgumentError(msg, code=code) from err\nsqlalchemy.exc.ArgumentError: Column expression, FROM clause, or other columns clause element expected, got <property object at 0x000001B5353D95D0>.\n','/api/v1/relatorios/dashboard',1,'2026-08-13 13:42:22'),(843,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 14:26:34'),(844,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 14:26:34'),(845,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 14:26:34'),(846,'Exception','\'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'POR_PARTICIPANTE\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 68, in get_politicas_comerciais\n    politicas = query.all()\n                ^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 246, in chunks\n    post_load.invoke(context, path)\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 1543, in invoke\n    loader(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3212, in _load_for_path\n    self._load_via_parent(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\strategies.py\", line 3287, in _load_via_parent\n    for k, v in itertools.groupby(\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 512, in iterrows\n    for raw_row in self._fetchiter_impl():\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'POR_PARTICIPANTE\' is not among the defined enum values. Enum name: tipocalculopolitica. Possible values: Fixo, Por Partici.., Por Hora, ..., Por Unidade\n','/api/v1/eventos/politicas-comerciais',1,'2026-08-13 14:26:35'),(847,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-08-13 14:26:35'),(848,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-08-13 14:26:35');
/*!40000 ALTER TABLE `log_erros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materiais`
--

DROP TABLE IF EXISTS `materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiais` (
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `tipo` enum('REUTILIZAVEL','CONSUMIVEL') NOT NULL,
  `quantidade_total` decimal(10,2) DEFAULT NULL,
  `quantidade_disponivel` decimal(10,2) DEFAULT NULL,
  `quantidade_reservada` decimal(10,2) DEFAULT NULL,
  `estado` enum('DISPONIVEL','RESERVA','EM USO','DEVOLVIDO','DANIFICADO','MANUTENCAO','CANCELADO') DEFAULT 'DISPONIVEL',
  `valor_unitario` decimal(10,2) DEFAULT NULL,
  `unidade_medida_id` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materiais_codigo` (`codigo`),
  KEY `fk_material_unidade` (`unidade_medida_id`),
  CONSTRAINT `fk_materiais_unidade_medida_id_unidades_medida` FOREIGN KEY (`unidade_medida_id`) REFERENCES `unidades_medida` (`id`),
  CONSTRAINT `fk_material_unidade` FOREIGN KEY (`unidade_medida_id`) REFERENCES `unidades_medida` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materiais`
--

LOCK TABLES `materiais` WRITE;
/*!40000 ALTER TABLE `materiais` DISABLE KEYS */;
INSERT INTO `materiais` VALUES ('MAT-0001','Mesa Redonda','Reutilizagem','REUTILIZAVEL',90.00,0.00,0.00,'DISPONIVEL',1500.00,4,1,'2026-07-07 17:35:38','2026-07-23 13:03:00',1,1,1,NULL,0),('MAT-0002','Panelas de 12 litros','Cozinha','REUTILIZAVEL',100.00,100.00,0.00,'DISPONIVEL',1200.00,4,2,'2026-07-09 13:49:26','2026-07-29 14:49:22',1,NULL,1,NULL,1),('MAT-0003','Colheres de Cozinha','Mesa','REUTILIZAVEL',99.00,99.00,0.00,'DISPONIVEL',10.00,4,3,'2026-07-09 13:50:18','2026-07-09 14:21:06',1,NULL,1,NULL,1),('MAT-0004','Garfos de Peixe','Talheres de Mesa','REUTILIZAVEL',99.00,99.00,0.00,'DISPONIVEL',10.00,4,4,'2026-07-09 13:50:56','2026-07-23 12:30:58',1,NULL,1,NULL,1),('MAT-0005','Cadeiras Almofadadas','Salas','REUTILIZAVEL',1000.00,1000.00,0.00,'DISPONIVEL',150.00,4,5,'2026-07-29 13:31:24','2026-07-29 13:31:24',1,NULL,1,NULL,1),('MAT-0006','Toalhas de Mesa de 4 metros','Salas','REUTILIZAVEL',1206.00,1206.00,0.00,'DISPONIVEL',150.00,4,6,'2026-07-29 13:32:19','2026-07-29 15:58:19',1,NULL,1,NULL,1);
/*!40000 ALTER TABLE `materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_stock_armazem`
--

DROP TABLE IF EXISTS `material_stock_armazem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_stock_armazem` (
  `material_id` int NOT NULL,
  `armazem_id` int NOT NULL,
  `stock_atual` decimal(10,3) NOT NULL,
  `stock_minimo` decimal(10,3) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_armazem_stock` (`material_id`,`armazem_id`),
  KEY `fk_material_stock_armazem_armazem_id_armazens` (`armazem_id`),
  CONSTRAINT `fk_material_stock_armazem_armazem_id_armazens` FOREIGN KEY (`armazem_id`) REFERENCES `armazens` (`id`),
  CONSTRAINT `fk_material_stock_armazem_material_id_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_stock_armazem`
--

LOCK TABLES `material_stock_armazem` WRITE;
/*!40000 ALTER TABLE `material_stock_armazem` DISABLE KEYS */;
INSERT INTO `material_stock_armazem` VALUES (1,1,0.000,0.000,1,'2026-07-07 17:35:38','2026-07-23 11:56:23',NULL,NULL,1,NULL),(2,1,100.000,0.000,2,'2026-07-09 13:49:26','2026-07-29 14:49:22',NULL,NULL,1,NULL),(3,1,100.000,0.000,3,'2026-07-09 13:50:18','2026-07-09 13:50:18',NULL,NULL,1,NULL),(4,1,99.000,0.000,4,'2026-07-09 13:50:56','2026-07-23 12:30:58',NULL,NULL,1,NULL),(5,1,1000.000,0.000,5,'2026-07-29 13:31:24','2026-07-29 13:31:24',NULL,NULL,1,NULL),(6,1,1210.000,0.000,6,'2026-07-29 13:32:19','2026-07-29 15:58:19',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `material_stock_armazem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motoristas`
--

DROP TABLE IF EXISTS `motoristas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motoristas` (
  `nome` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `carta_conducao` varchar(50) DEFAULT NULL,
  `validade_carta` date DEFAULT NULL,
  `estado` enum('ATIVO','INATIVO') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motoristas`
--

LOCK TABLES `motoristas` WRITE;
/*!40000 ALTER TABLE `motoristas` DISABLE KEYS */;
INSERT INTO `motoristas` VALUES ('Carlos Silva',NULL,NULL,NULL,'ATIVO',1,'2026-08-12 13:54:43','2026-08-12 13:54:43',19,NULL,1,NULL);
/*!40000 ALTER TABLE `motoristas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentacoes_armazem`
--

DROP TABLE IF EXISTS `movimentacoes_armazem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentacoes_armazem` (
  `tipo` varchar(50) DEFAULT NULL,
  `origem` varchar(50) DEFAULT NULL,
  `entidade_tipo` varchar(50) DEFAULT NULL,
  `referencia_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `justificacao` varchar(255) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `quantidade_antes` decimal(10,3) DEFAULT '0.000',
  `quantidade_depois` decimal(10,3) DEFAULT '0.000',
  `armazem_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacoes_armazem`
--

LOCK TABLES `movimentacoes_armazem` WRITE;
/*!40000 ALTER TABLE `movimentacoes_armazem` DISABLE KEYS */;
INSERT INTO `movimentacoes_armazem` VALUES ('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000023',60,'2026-08-12 14:46:33','2026-08-12 14:46:33',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000024',61,'2026-08-12 14:46:48','2026-08-12 14:46:48',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FR 2026/000030',62,'2026-08-13 09:27:19','2026-08-13 09:27:19',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',26,1.000,'Venda FR 2026/000030',63,'2026-08-13 09:27:19','2026-08-13 09:27:19',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',29,1.000,'Venda FR 2026/000031',64,'2026-08-13 09:58:24','2026-08-13 09:58:24',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000031',65,'2026-08-13 09:58:24','2026-08-13 09:58:24',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,1.000,'Venda FR 2026/000031',66,'2026-08-13 09:58:24','2026-08-13 09:58:24',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000032',67,'2026-08-13 10:02:34','2026-08-13 10:02:34',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000032',68,'2026-08-13 10:02:34','2026-08-13 10:02:34',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,1.000,'Venda FR 2026/000032',69,'2026-08-13 10:02:34','2026-08-13 10:02:34',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,10.000,'Venda FR 2026/000001',70,'2026-08-13 12:01:39','2026-08-13 12:01:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,5.000,'Venda FR 2026/000001',71,'2026-08-13 12:01:39','2026-08-13 12:01:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,6.000,'Venda FR 2026/000001',72,'2026-08-13 12:01:39','2026-08-13 12:01:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,2.000,'Venda FR 2026/000001',73,'2026-08-13 12:01:39','2026-08-13 12:01:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,10.000,'Venda FR 2026/000002',74,'2026-08-13 13:47:06','2026-08-13 13:47:06',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,1.000,'Venda FR 2026/000003',75,'2026-08-13 13:51:19','2026-08-13 13:51:19',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,4.000,'Venda FR 2026/000004',76,'2026-08-13 13:58:20','2026-08-13 13:58:20',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,3.000,'Venda FR 2026/000004',77,'2026-08-13 13:58:20','2026-08-13 13:58:20',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,4.000,'Venda FR 2026/000005',78,'2026-08-13 14:09:19','2026-08-13 14:09:19',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,4.000,'Venda FR 2026/000006',79,'2026-08-13 14:13:28','2026-08-13 14:13:28',1,NULL,1,NULL,0.000,0.000,NULL);
/*!40000 ALTER TABLE `movimentacoes_armazem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentos_caixa`
--

DROP TABLE IF EXISTS `movimentos_caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentos_caixa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caixa_id` int NOT NULL,
  `tipo` enum('ABERTURA','VENDA','RECEBIMENTO','REFORCO','SANGRIA','DEVOLUCAO','AJUSTE') NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `data_movimento` datetime NOT NULL,
  `utilizador_id` int NOT NULL,
  `codigo_transferencia` varchar(100) DEFAULT NULL,
  `emissor` varchar(100) DEFAULT NULL,
  `forma_pagamento` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimentos_caixa_caixa_id_caixas` (`caixa_id`),
  KEY `fk_movimentos_caixa_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_movimentos_caixa_caixa_id_caixas` FOREIGN KEY (`caixa_id`) REFERENCES `caixas` (`id`),
  CONSTRAINT `fk_movimentos_caixa_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentos_caixa`
--

LOCK TABLES `movimentos_caixa` WRITE;
/*!40000 ALTER TABLE `movimentos_caixa` DISABLE KEYS */;
INSERT INTO `movimentos_caixa` VALUES (44,10,'ABERTURA',100.00,'Abertura de Caixa','2026-08-13 11:39:29',1,NULL,NULL,NULL),(45,10,'RECEBIMENTO',2073.86,'Recebimento de Venda FR 2026/000001. Troco: 13.71374999999989','2026-08-13 12:01:39',1,NULL,NULL,'Dinheiro'),(46,10,'RECEBIMENTO',173.02,'Recebimento de Venda FR 2026/000002. Troco: 2.9299999999999784','2026-08-13 13:47:06',1,NULL,NULL,'Dinheiro'),(47,10,'RECEBIMENTO',8.05,'Recebimento de Venda FR 2026/000003. Troco: 0.0','2026-08-13 13:51:19',1,NULL,NULL,'Dinheiro'),(48,10,'RECEBIMENTO',248.00,'Recebimento de Venda FR 2026/000004. Troco: 0.3499999999999943','2026-08-13 13:58:20',1,NULL,NULL,'Dinheiro'),(49,10,'RECEBIMENTO',78.20,'Recebimento de Venda FR 2026/000005. Troco: 0.0','2026-08-13 14:09:19',1,NULL,NULL,'Dinheiro'),(50,10,'RECEBIMENTO',66.70,'Recebimento de Venda FR 2026/000006. Troco: 0.0','2026-08-13 14:13:28',1,NULL,NULL,'Dinheiro');
/*!40000 ALTER TABLE `movimentos_caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentos_stock`
--

DROP TABLE IF EXISTS `movimentos_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentos_stock` (
  `produto_id` int NOT NULL,
  `tipo_movimento` enum('ENTRADA','SAIDA','COMPRA','VENDA','REQUISICAO','PRODUCAO','AJUSTE','INVENTARIO','PERDA','QUEBRA','TRANSFERENCIA') NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `stock_anterior` decimal(10,3) NOT NULL,
  `stock_atual` decimal(10,3) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `numero_fatura` varchar(100) DEFAULT NULL,
  `fornecedor_id` int DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `utilizador_id` int NOT NULL,
  `observacao` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimentos_stock_produto_id_produtos` (`produto_id`),
  KEY `fk_movimentos_stock_fornecedor_id_fornecedores` (`fornecedor_id`),
  KEY `fk_movimentos_stock_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_movimentos_stock_fornecedor_id_fornecedores` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`),
  CONSTRAINT `fk_movimentos_stock_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  CONSTRAINT `fk_movimentos_stock_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentos_stock`
--

LOCK TABLES `movimentos_stock` WRITE;
/*!40000 ALTER TABLE `movimentos_stock` DISABLE KEYS */;
INSERT INTO `movimentos_stock` VALUES (43,'ENTRADA',100.000,0.000,100.000,NULL,NULL,NULL,NULL,1,'',26,'2026-08-13 09:17:04','2026-08-13 09:17:04',1,NULL,1,NULL),(44,'ENTRADA',100.000,0.000,100.000,NULL,NULL,NULL,NULL,1,'',27,'2026-08-13 09:18:14','2026-08-13 09:18:14',1,NULL,1,NULL);
/*!40000 ALTER TABLE `movimentos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocorrencias_logisticas`
--

DROP TABLE IF EXISTS `ocorrencias_logisticas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocorrencias_logisticas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entrega_id` int NOT NULL,
  `tipo` enum('ATRASO','ACIDENTE','PERDA','DANO','OUTRO') NOT NULL,
  `justificacao` text NOT NULL,
  `data_ocorrencia` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ocorrencias_logisticas_entrega_id_entregas` (`entrega_id`),
  CONSTRAINT `fk_ocorrencias_logisticas_entrega_id_entregas` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocorrencias_logisticas`
--

LOCK TABLES `ocorrencias_logisticas` WRITE;
/*!40000 ALTER TABLE `ocorrencias_logisticas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocorrencias_logisticas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocorrencias_materiais`
--

DROP TABLE IF EXISTS `ocorrencias_materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocorrencias_materiais` (
  `numero` varchar(50) NOT NULL,
  `material_id` int NOT NULL,
  `responsavel_id` int NOT NULL,
  `tipo` enum('PERDA','DANIFICADO','NAO_DEVOLVIDO') NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_estimado` decimal(10,2) DEFAULT NULL,
  `justificacao` text NOT NULL,
  `data_ocorrencia` datetime NOT NULL,
  `estado` enum('ABERTA','ANALISE','RESOLVIDA') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ocorrencias_materiais_numero` (`numero`),
  KEY `fk_ocorrencias_materiais_material_id_materiais` (`material_id`),
  KEY `fk_ocorrencias_materiais_responsavel_id_users` (`responsavel_id`),
  CONSTRAINT `fk_ocorrencias_materiais_material_id_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais` (`id`),
  CONSTRAINT `fk_ocorrencias_materiais_responsavel_id_users` FOREIGN KEY (`responsavel_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocorrencias_materiais`
--

LOCK TABLES `ocorrencias_materiais` WRITE;
/*!40000 ALTER TABLE `ocorrencias_materiais` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocorrencias_materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordem_producao_itens`
--

DROP TABLE IF EXISTS `ordem_producao_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordem_producao_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem_producao_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `observacoes` text,
  PRIMARY KEY (`id`),
  KEY `fk_ordem_producao_itens_ordem_producao_id_ordens_producao` (`ordem_producao_id`),
  KEY `fk_ordem_producao_itens_produto_id_produtos` (`produto_id`),
  CONSTRAINT `fk_ordem_producao_itens_ordem_producao_id_ordens_producao` FOREIGN KEY (`ordem_producao_id`) REFERENCES `ordens_producao` (`id`),
  CONSTRAINT `fk_ordem_producao_itens_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordem_producao_itens`
--

LOCK TABLES `ordem_producao_itens` WRITE;
/*!40000 ALTER TABLE `ordem_producao_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordem_producao_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordens_producao`
--

DROP TABLE IF EXISTS `ordens_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordens_producao` (
  `numero` varchar(50) NOT NULL,
  `pedido_id` int NOT NULL,
  `produto_id` int DEFAULT NULL,
  `quantidade` decimal(10,2) DEFAULT NULL,
  `sector` varchar(50) NOT NULL,
  `turno` enum('MANHA','TARDE','NOITE') DEFAULT NULL,
  `data_producao` date DEFAULT NULL,
  `hora_inicio` datetime DEFAULT NULL,
  `hora_fim` datetime DEFAULT NULL,
  `prioridade` varchar(50) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `responsavel_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ordens_producao_numero` (`numero`),
  KEY `fk_ordens_producao_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_ordens_producao_produto_id_produtos` (`produto_id`),
  CONSTRAINT `fk_ordens_producao_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_ordens_producao_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordens_producao`
--

LOCK TABLES `ordens_producao` WRITE;
/*!40000 ALTER TABLE `ordens_producao` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordens_producao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagamentos`
--

DROP TABLE IF EXISTS `pagamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagamentos` (
  `pedido_id` int DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  `venda_id` int DEFAULT NULL,
  `valor` decimal(12,2) NOT NULL,
  `forma_pagamento_id` int NOT NULL,
  `estado` enum('PENDENTE','PARCIAL','PAGO','CANCELADO') DEFAULT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `observacoes` text,
  `codigo_transferencia` varchar(100) DEFAULT NULL,
  `emissor` varchar(100) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pagamentos_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_pagamentos_evento_id_eventos` (`evento_id`),
  KEY `fk_pagamentos_venda_id_vendas` (`venda_id`),
  KEY `fk_pagamentos_forma_pagamento_id_formas_pagamento` (`forma_pagamento_id`),
  CONSTRAINT `fk_pagamentos_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_pagamentos_forma_pagamento_id_formas_pagamento` FOREIGN KEY (`forma_pagamento_id`) REFERENCES `formas_pagamento` (`id`),
  CONSTRAINT `fk_pagamentos_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_pagamentos_venda_id_vendas` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamentos`
--

LOCK TABLES `pagamentos` WRITE;
/*!40000 ALTER TABLE `pagamentos` DISABLE KEYS */;
INSERT INTO `pagamentos` VALUES (NULL,NULL,49,2087.58,1,'PAGO','2026-08-13 12:01:39',NULL,'Pagamento. Troco: 13.71374999999989. ',NULL,NULL,35,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL),(NULL,NULL,50,175.95,1,'PAGO','2026-08-13 13:47:06',NULL,'Pagamento. Troco: 2.9299999999999784. ',NULL,NULL,36,'2026-08-13 13:47:06','2026-08-13 13:47:06',NULL,NULL,1,NULL),(NULL,NULL,51,8.05,1,'PAGO','2026-08-13 13:51:19',NULL,'Pagamento. Troco: 0.0. ',NULL,NULL,37,'2026-08-13 13:51:19','2026-08-13 13:51:19',NULL,NULL,1,NULL),(NULL,NULL,52,248.35,1,'PAGO','2026-08-13 13:58:20',NULL,'Pagamento. Troco: 0.3499999999999943. ',NULL,NULL,38,'2026-08-13 13:58:20','2026-08-13 13:58:20',NULL,NULL,1,NULL),(NULL,NULL,53,78.20,1,'PAGO','2026-08-13 14:09:19',NULL,'Pagamento. Troco: 0.0. ',NULL,NULL,39,'2026-08-13 14:09:19','2026-08-13 14:09:19',NULL,NULL,1,NULL),(NULL,NULL,54,66.70,1,'PAGO','2026-08-13 14:13:28',NULL,'Pagamento. Troco: 0.0. ',NULL,NULL,40,'2026-08-13 14:13:28','2026-08-13 14:13:28',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `pagamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `numero` varchar(50) NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `origem` varchar(50) NOT NULL,
  `data_pedido` datetime NOT NULL,
  `data_entrega` date DEFAULT NULL,
  `hora_entrega` time DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `justificativa_cancelamento` text,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `valor_pago` decimal(10,2) DEFAULT NULL,
  `saldo` decimal(10,2) DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `estado_pagamento` varchar(50) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pedidos_numero` (`numero`),
  KEY `fk_pedidos_cliente_id_clientes` (`cliente_id`),
  KEY `fk_pedido_evento` (`evento_id`),
  CONSTRAINT `fk_pedido_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_pedidos_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `politica_comercial_regras`
--

DROP TABLE IF EXISTS `politica_comercial_regras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `politica_comercial_regras` (
  `politica_id` int NOT NULL,
  `tipo_item` varchar(50) NOT NULL,
  `referencia_id` int DEFAULT NULL,
  `nome_item` varchar(255) DEFAULT NULL,
  `min_participantes` int DEFAULT NULL,
  `max_participantes` int DEFAULT NULL,
  `valor_sugerido` decimal(10,2) NOT NULL,
  `tipo_calculo` enum('FIXO','POR_PARTICIPANTE','POR_HORA','POR_DIA','POR_UNIDADE') DEFAULT NULL,
  `prioridade` int DEFAULT NULL,
  `mensagem_sugestao` varchar(255) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_politica_comercial_regras_politica_id_politicas_comer_eb4f` (`politica_id`),
  CONSTRAINT `fk_politica_comercial_regras_politica_id_politicas_comer_eb4f` FOREIGN KEY (`politica_id`) REFERENCES `politicas_comerciais_eventos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `politica_comercial_regras`
--

LOCK TABLES `politica_comercial_regras` WRITE;
/*!40000 ALTER TABLE `politica_comercial_regras` DISABLE KEYS */;
INSERT INTO `politica_comercial_regras` VALUES (1,'SERVICO',1,'Cozinha',1,500,25.00,'POR_PARTICIPANTE',1,'Preço sugerido de refeição/cozinha por convidado para Casamentos.',1,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL),(1,'SERVICO',3,'Bar & Bebidas',1,500,12.00,'POR_PARTICIPANTE',1,'Open Bar e Bebidas por convidado.',2,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL),(1,'ESPACO',1,'Salão Nobre Principal',50,350,500.00,'FIXO',1,'Taxa fixa de aluguer do Salão Nobre Principal.',3,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL),(1,'MAO_DE_OBRA',1,'Chefe de Cozinha',1,500,80.00,'FIXO',1,'Taxa fixa de chefia de cozinha por evento.',4,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `politica_comercial_regras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `politicas_comerciais_eventos`
--

DROP TABLE IF EXISTS `politicas_comerciais_eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `politicas_comerciais_eventos` (
  `codigo` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tipo_evento` varchar(100) NOT NULL,
  `estado` varchar(20) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_politicas_comerciais_eventos_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `politicas_comerciais_eventos`
--

LOCK TABLES `politicas_comerciais_eventos` WRITE;
/*!40000 ALTER TABLE `politicas_comerciais_eventos` DISABLE KEYS */;
INSERT INTO `politicas_comerciais_eventos` VALUES ('POL-2026-001','Tabela Comercial Padrão - Eventos','Casamento','Ativa',NULL,NULL,'Tabela de preços sugeridos por participante e fixo para casamentos e banquetes.',1,'2026-07-29 09:41:41','2026-07-29 09:41:41',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `politicas_comerciais_eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producao_desvios`
--

DROP TABLE IF EXISTS `producao_desvios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producao_desvios` (
  `producao_id` int NOT NULL,
  `produto_consumivel_id` int NOT NULL,
  `quantidade_prevista` decimal(10,3) NOT NULL,
  `quantidade_real` decimal(10,3) NOT NULL,
  `diferenca` decimal(10,3) NOT NULL,
  `justificativa` text NOT NULL,
  `utilizador_id` int NOT NULL,
  `data` datetime DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_producao_desvios_producao_id_producoes` (`producao_id`),
  KEY `fk_producao_desvios_produto_consumivel_id_produtos` (`produto_consumivel_id`),
  KEY `fk_producao_desvios_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_producao_desvios_producao_id_producoes` FOREIGN KEY (`producao_id`) REFERENCES `producoes` (`id`),
  CONSTRAINT `fk_producao_desvios_produto_consumivel_id_produtos` FOREIGN KEY (`produto_consumivel_id`) REFERENCES `produtos` (`id`),
  CONSTRAINT `fk_producao_desvios_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producao_desvios`
--

LOCK TABLES `producao_desvios` WRITE;
/*!40000 ALTER TABLE `producao_desvios` DISABLE KEYS */;
/*!40000 ALTER TABLE `producao_desvios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producao_itens`
--

DROP TABLE IF EXISTS `producao_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producao_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producao_id` int NOT NULL,
  `produto_consumivel_id` int NOT NULL,
  `quantidade_prevista` decimal(10,3) NOT NULL,
  `quantidade_real` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_producao_itens_producao_id_producoes` (`producao_id`),
  KEY `fk_producao_itens_produto_consumivel_id_produtos` (`produto_consumivel_id`),
  CONSTRAINT `fk_producao_itens_producao_id_producoes` FOREIGN KEY (`producao_id`) REFERENCES `producoes` (`id`),
  CONSTRAINT `fk_producao_itens_produto_consumivel_id_produtos` FOREIGN KEY (`produto_consumivel_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producao_itens`
--

LOCK TABLES `producao_itens` WRITE;
/*!40000 ALTER TABLE `producao_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `producao_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producoes`
--

DROP TABLE IF EXISTS `producoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producoes` (
  `numero` varchar(50) NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade_produzida` decimal(10,2) NOT NULL,
  `responsavel_id` int NOT NULL,
  `turno` varchar(50) DEFAULT NULL,
  `data_producao` datetime DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producoes_numero` (`numero`),
  KEY `fk_producoes_produto_id_produtos` (`produto_id`),
  KEY `fk_producoes_responsavel_id_users` (`responsavel_id`),
  CONSTRAINT `fk_producoes_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  CONSTRAINT `fk_producoes_responsavel_id_users` FOREIGN KEY (`responsavel_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producoes`
--

LOCK TABLES `producoes` WRITE;
/*!40000 ALTER TABLE `producoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `producoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produto_stock_armazem`
--

DROP TABLE IF EXISTS `produto_stock_armazem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produto_stock_armazem` (
  `produto_id` int NOT NULL,
  `armazem_id` int NOT NULL,
  `stock_atual` decimal(10,3) NOT NULL,
  `stock_minimo` decimal(10,3) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_produto_armazem_stock` (`produto_id`,`armazem_id`),
  KEY `fk_produto_stock_armazem_armazem_id_armazens` (`armazem_id`),
  CONSTRAINT `fk_produto_stock_armazem_armazem_id_armazens` FOREIGN KEY (`armazem_id`) REFERENCES `armazens` (`id`),
  CONSTRAINT `fk_produto_stock_armazem_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produto_stock_armazem`
--

LOCK TABLES `produto_stock_armazem` WRITE;
/*!40000 ALTER TABLE `produto_stock_armazem` DISABLE KEYS */;
INSERT INTO `produto_stock_armazem` VALUES (2,1,10.000,0.000,1,'2026-07-07 16:53:02','2026-07-07 16:54:13',NULL,NULL,1,NULL),(3,1,100.000,0.000,2,'2026-07-07 16:58:41','2026-07-07 17:03:55',NULL,NULL,1,NULL),(4,1,0.000,0.000,3,'2026-07-07 17:09:42','2026-07-07 17:09:42',NULL,NULL,1,NULL),(5,1,20.000,10.000,4,'2026-07-07 17:18:58','2026-07-10 16:43:13',NULL,NULL,1,NULL),(6,1,100.000,0.000,5,'2026-07-08 07:49:27','2026-07-29 13:33:04',NULL,NULL,1,NULL),(7,1,10.000,0.000,6,'2026-07-08 07:49:48','2026-07-08 10:58:29',NULL,NULL,1,NULL),(8,1,0.000,0.000,7,'2026-07-08 07:50:19','2026-07-08 07:50:19',NULL,NULL,1,NULL),(9,1,0.000,0.000,8,'2026-07-08 07:50:47','2026-07-08 07:50:47',NULL,NULL,1,NULL),(10,1,0.000,0.000,9,'2026-07-08 07:51:18','2026-07-08 07:51:18',NULL,NULL,1,NULL),(11,1,100.000,0.000,10,'2026-07-08 07:51:45','2026-07-08 11:25:10',NULL,NULL,1,NULL),(12,1,0.000,0.000,11,'2026-07-08 07:52:17','2026-07-08 07:52:17',NULL,NULL,1,NULL),(13,1,20.000,0.000,12,'2026-07-08 07:52:56','2026-07-09 08:40:18',NULL,NULL,1,NULL),(14,1,0.000,0.000,13,'2026-07-08 07:53:33','2026-07-08 07:53:33',NULL,NULL,1,NULL),(15,1,90.000,0.000,14,'2026-07-08 10:27:33','2026-07-08 13:39:40',NULL,NULL,1,NULL),(16,1,0.000,0.000,15,'2026-07-08 10:34:54','2026-07-08 10:34:54',NULL,NULL,1,NULL),(17,1,20.000,15.000,16,'2026-07-08 10:36:42','2026-07-10 16:43:07',NULL,NULL,1,NULL),(18,1,110.000,10.000,17,'2026-07-08 10:56:56','2026-07-31 11:41:54',NULL,NULL,1,NULL),(19,1,100.000,10.000,18,'2026-07-08 13:33:18','2026-07-31 11:41:54',NULL,NULL,1,NULL),(24,1,0.000,0.000,19,'2026-07-23 09:21:43','2026-07-23 09:21:43',NULL,NULL,1,NULL),(25,4,0.000,0.000,20,'2026-07-23 09:24:23','2026-07-23 09:24:23',NULL,NULL,1,NULL),(26,4,0.000,0.000,21,'2026-07-23 09:25:58','2026-07-23 09:25:58',NULL,NULL,1,NULL),(27,1,0.000,0.000,22,'2026-07-23 09:29:34','2026-07-23 09:29:34',NULL,NULL,1,NULL),(28,1,0.000,0.000,23,'2026-07-23 09:31:25','2026-07-23 09:31:25',NULL,NULL,1,NULL),(29,4,20.000,10.000,24,'2026-07-23 09:32:45','2026-07-23 09:35:52',NULL,NULL,1,NULL),(30,4,20.000,6.000,25,'2026-07-23 09:33:48','2026-07-23 09:35:47',NULL,NULL,1,NULL),(31,4,20.000,10.000,26,'2026-07-23 09:34:39','2026-07-23 09:35:40',NULL,NULL,1,NULL),(3,4,100.000,0.000,27,'2026-07-31 11:48:19','2026-07-31 11:48:19',NULL,NULL,1,NULL),(32,1,100.000,0.000,28,'2026-08-04 16:55:25','2026-08-04 16:55:44',NULL,NULL,1,NULL),(37,1,100.000,0.000,29,'2026-08-12 11:59:24','2026-08-12 11:59:36',NULL,NULL,1,NULL),(43,1,100.000,10.000,30,'2026-08-13 09:16:55','2026-08-13 09:17:04',NULL,NULL,1,NULL),(44,1,100.000,10.000,31,'2026-08-13 09:18:06','2026-08-13 09:18:14',NULL,NULL,1,NULL),(45,1,0.000,10.000,32,'2026-08-13 10:27:20','2026-08-13 10:27:20',NULL,NULL,1,NULL),(46,1,0.000,10.000,33,'2026-08-13 10:27:54','2026-08-13 10:27:54',NULL,NULL,1,NULL),(47,1,0.000,10.000,34,'2026-08-13 10:28:34','2026-08-13 10:28:34',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `produto_stock_armazem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `tipo` enum('ACABADO','REVENDA','CONSUMIVEL') NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  `unidade_medida_id` int DEFAULT NULL,
  `tempo_producao` int DEFAULT NULL,
  `preco_venda` decimal(10,2) NOT NULL,
  `preco_compra` decimal(10,2) DEFAULT NULL,
  `descricao` text,
  `stock_atual` decimal(10,3) DEFAULT NULL,
  `stock_minimo` decimal(10,3) DEFAULT NULL,
  `taxa_iva_id` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `data_validade` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `servico` enum('ABASTECIMENTO','COZINHA','PASTELARIA','BAR') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_produtos_codigo` (`codigo`),
  KEY `fk_produto_iva` (`taxa_iva_id`),
  KEY `fk_produto_unidade` (`unidade_medida_id`),
  KEY `idx_produtos_codigo` (`codigo`),
  KEY `idx_produtos_nome` (`nome`),
  KEY `idx_produtos_categoria` (`categoria_id`),
  KEY `idx_produtos_tipo` (`tipo`),
  KEY `idx_produtos_ativo` (`ativo`),
  CONSTRAINT `fk_produto_iva` FOREIGN KEY (`taxa_iva_id`) REFERENCES `taxas_iva` (`id`),
  CONSTRAINT `fk_produto_unidade` FOREIGN KEY (`unidade_medida_id`) REFERENCES `unidades_medida` (`id`),
  CONSTRAINT `fk_produtos_categoria_id_categorias_produto` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_produto` (`id`),
  CONSTRAINT `fk_produtos_taxa_iva_id_taxas_iva` FOREIGN KEY (`taxa_iva_id`) REFERENCES `taxas_iva` (`id`),
  CONSTRAINT `fk_produtos_unidade_medida_id_unidades_medida` FOREIGN KEY (`unidade_medida_id`) REFERENCES `unidades_medida` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (1,'ING000001','Ovos de Galinha','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-07 16:51:42','2026-07-07 16:53:34',1,1,0,'2026-07-07 16:53:34','ABASTECIMENTO'),(2,'ING000002','Ovos de Galinha','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,10.000,0.000,NULL,1,NULL,'2026-07-07 16:53:02','2026-07-07 16:54:13',1,NULL,1,NULL,'ABASTECIMENTO'),(3,'ING000003','ARROZ CATAPLANA','CONSUMIVEL',NULL,1,1,NULL,0.00,35.00,NULL,200.000,0.000,NULL,1,NULL,'2026-07-07 16:58:41','2026-07-31 11:48:19',1,NULL,1,NULL,'ABASTECIMENTO'),(4,'PAC000001','Bolo de Chocolate Decorado','ACABADO',NULL,1,4,100,470.00,40.00,'Bolo de Chocolate Decoração com Chocolate Marron ',0.000,0.000,1,1,NULL,'2026-07-07 17:09:42','2026-07-31 09:42:05',1,1,1,NULL,'PASTELARIA'),(5,'REV000001','Sumol de Manga ','REVENDA',NULL,3,4,NULL,20.00,18.00,NULL,15.000,10.000,NULL,1,NULL,'2026-07-07 17:18:58','2026-08-13 12:01:39',1,NULL,1,NULL,'BAR'),(6,'ING000004','Açucar Fino','CONSUMIVEL',NULL,1,1,NULL,0.00,25.00,NULL,100.000,0.000,NULL,1,NULL,'2026-07-08 07:49:27','2026-07-29 13:33:04',1,1,1,NULL,'ABASTECIMENTO'),(7,'ING000005','Açucar de Cana','CONSUMIVEL',NULL,1,1,NULL,0.00,22.00,NULL,7.000,10.000,NULL,1,'2029-10-10','2026-07-08 07:49:48','2026-07-22 16:46:04',1,1,1,NULL,'ABASTECIMENTO'),(8,'ING000006','Lata de Milho','CONSUMIVEL',NULL,1,4,NULL,0.00,30.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:50:19','2026-07-08 07:50:19',1,NULL,1,NULL,'ABASTECIMENTO'),(9,'ING000007','Sal Grosso','CONSUMIVEL',NULL,1,1,NULL,0.00,12.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:50:47','2026-07-23 13:11:36',1,1,1,NULL,'ABASTECIMENTO'),(10,'ING000008','Lata de Massa Tomate','CONSUMIVEL',NULL,1,4,NULL,0.00,35.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:51:18','2026-07-08 07:51:18',1,NULL,1,NULL,'ABASTECIMENTO'),(11,'ING000009','Farinha de Trigo','CONSUMIVEL',NULL,1,1,NULL,0.00,18.00,NULL,90.000,0.000,NULL,1,NULL,'2026-07-08 07:51:45','2026-07-09 10:06:11',1,NULL,1,NULL,'ABASTECIMENTO'),(12,'ING000010','Óleo Fringe','CONSUMIVEL',NULL,1,2,NULL,0.00,55.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:52:17','2026-07-23 13:08:59',1,1,0,'2026-07-23 13:08:59','ABASTECIMENTO'),(13,'ING000011','Azeite Dose Vegetal','CONSUMIVEL',NULL,1,2,NULL,0.00,1000.00,NULL,12.000,0.000,NULL,1,NULL,'2026-07-08 07:52:56','2026-07-23 13:11:34',1,1,1,NULL,'ABASTECIMENTO'),(14,'ING000012','Manteiga Evita','CONSUMIVEL',NULL,1,4,NULL,0.00,10.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:53:33','2026-07-08 07:53:33',1,NULL,1,NULL,'ABASTECIMENTO'),(15,'ING000013','Bacalhau Portugês','CONSUMIVEL',NULL,1,1,NULL,0.00,150.00,NULL,90.000,10.000,NULL,1,NULL,'2026-07-08 10:27:33','2026-07-08 14:50:31',1,1,0,'2026-07-08 14:50:31','ABASTECIMENTO'),(16,'PAC000002','Bolo de Laranja','ACABADO',NULL,1,4,120,450.00,89.00,NULL,0.000,0.000,1,1,NULL,'2026-07-08 10:34:54','2026-08-13 10:45:42',1,1,1,NULL,'PASTELARIA'),(17,'REV000002','Sumol de Maracúja ','REVENDA',NULL,3,4,NULL,20.00,18.00,NULL,20.000,15.000,NULL,1,NULL,'2026-07-08 10:36:42','2026-08-13 10:02:34',1,NULL,1,NULL,'BAR'),(18,'ING000014','Esparguete ','CONSUMIVEL',NULL,1,4,NULL,0.00,15.00,'esparguete de portugal',110.000,10.000,NULL,1,'2029-10-10','2026-07-08 10:56:56','2026-07-31 11:41:54',1,1,1,NULL,'ABASTECIMENTO'),(19,'REV000003','Vinho de Porto','REVENDA',NULL,4,2,NULL,240.00,180.00,NULL,90.000,10.000,1,1,'2090-10-10','2026-07-08 13:33:18','2026-08-13 12:01:39',1,1,1,NULL,'BAR'),(24,'PAC000003','Bolo de Banana','ACABADO',NULL,1,4,120,550.00,319.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:21:43','2026-08-13 10:46:48',1,1,1,NULL,'PASTELARIA'),(25,'PAC000004','Arroz de Cenoura Frango','ACABADO',NULL,1,4,350,280.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:24:23','2026-07-23 09:24:23',1,NULL,1,NULL,NULL),(26,'PAC000005','Banana Cozida Molho de Peixe Atum','ACABADO',NULL,1,4,120,300.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:25:58','2026-07-23 09:25:58',1,NULL,1,NULL,NULL),(27,'PAC000006','Feijoada da Terra Recheada','ACABADO',NULL,1,4,450,450.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:29:34','2026-07-23 09:29:34',1,NULL,1,NULL,NULL),(28,'PAC000007','Feijoada de Peixe ','ACABADO',NULL,1,4,120,430.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:31:25','2026-07-23 12:58:43',1,1,1,NULL,NULL),(29,'REV000004','Água Mineral Bom Sucesso','REVENDA',NULL,3,4,NULL,20.00,8.00,NULL,12.000,10.000,NULL,1,'2026-07-24','2026-07-23 09:32:45','2026-08-13 09:58:24',1,NULL,1,NULL,'BAR'),(30,'REV000005','Água Mineral Cristal','REVENDA',NULL,3,4,NULL,15.00,12.00,NULL,8.000,6.000,1,1,'2026-07-24','2026-07-23 09:33:48','2026-08-13 09:58:24',1,NULL,1,NULL,'BAR'),(31,'REV000006','Sumo Natural ','REVENDA',NULL,3,4,NULL,50.00,45.00,NULL,3.000,10.000,1,1,'2026-07-25','2026-07-23 09:34:39','2026-08-13 13:58:20',1,NULL,1,NULL,'BAR'),(32,'ING000015','Sal magro','CONSUMIVEL',NULL,1,1,NULL,0.00,23.00,NULL,100.000,0.000,NULL,1,'2030-02-02','2026-08-04 16:55:25','2026-08-04 16:55:44',1,NULL,1,NULL,'ABASTECIMENTO'),(37,'ING000016','Laranja ','CONSUMIVEL',NULL,1,1,NULL,0.00,130.00,NULL,100.000,0.000,NULL,1,'2026-08-27','2026-08-12 11:59:24','2026-08-12 11:59:36',1,NULL,1,NULL,'ABASTECIMENTO'),(38,NULL,'Produto E2E','ACABADO',NULL,NULL,NULL,NULL,100.00,0.00,NULL,0.000,0.000,NULL,1,NULL,'2026-08-12 13:54:39','2026-08-12 13:54:39',NULL,NULL,1,NULL,NULL),(43,'ING000017','Caldo Mage','CONSUMIVEL',NULL,2,4,NULL,0.00,12.00,NULL,100.000,10.000,NULL,1,'2028-09-09','2026-08-13 09:16:55','2026-08-13 09:17:04',1,NULL,1,NULL,'ABASTECIMENTO'),(44,'REV000007','Coca-Cola 1L','REVENDA',NULL,1,4,NULL,17.00,14.00,NULL,67.000,10.000,1,1,'2028-09-03','2026-08-13 09:18:06','2026-08-13 14:13:28',1,NULL,1,NULL,'BAR'),(45,'ING000018','Banana Prata Madura','CONSUMIVEL',NULL,1,4,NULL,0.00,1.00,NULL,0.000,10.000,NULL,1,NULL,'2026-08-13 10:27:20','2026-08-13 10:27:20',1,NULL,1,NULL,'ABASTECIMENTO'),(46,'ING000019','ovos de Galinha podeira','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,0.000,10.000,NULL,1,'2026-09-05','2026-08-13 10:27:54','2026-08-13 10:27:54',1,NULL,1,NULL,'ABASTECIMENTO'),(47,'ING000020','Fermento de Bolo','CONSUMIVEL',NULL,1,1,NULL,0.00,100.00,NULL,0.000,10.000,NULL,1,'2029-09-09','2026-08-13 10:28:34','2026-08-13 10:28:34',1,NULL,1,NULL,'ABASTECIMENTO');
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receita_itens`
--

DROP TABLE IF EXISTS `receita_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receita_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receita_id` int NOT NULL,
  `produto_consumivel_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `custo_calculado` decimal(10,2) DEFAULT NULL,
  `observacao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_receita_itens_receita_id_receitas_producao` (`receita_id`),
  KEY `fk_receita_itens_produto_consumivel_id_produtos` (`produto_consumivel_id`),
  CONSTRAINT `fk_receita_itens_produto_consumivel_id_produtos` FOREIGN KEY (`produto_consumivel_id`) REFERENCES `produtos` (`id`),
  CONSTRAINT `fk_receita_itens_receita_id_receitas_producao` FOREIGN KEY (`receita_id`) REFERENCES `receitas_producao` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receita_itens`
--

LOCK TABLES `receita_itens` WRITE;
/*!40000 ALTER TABLE `receita_itens` DISABLE KEYS */;
INSERT INTO `receita_itens` VALUES (9,4,11,1.500,27.00,''),(10,4,14,1.000,10.00,''),(11,4,2,4.000,32.00,''),(12,5,45,20.000,20.00,''),(13,5,11,1.500,27.00,''),(14,5,14,1.000,10.00,''),(15,5,2,4.000,32.00,''),(17,4,37,1.000,130.00,'');
/*!40000 ALTER TABLE `receita_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receitas`
--

DROP TABLE IF EXISTS `receitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receitas` (
  `categoria` enum('VENDA','EVENTO','ALUGUER','SERVICO','OUTROS') NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `data_receita` date NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receitas`
--

LOCK TABLES `receitas` WRITE;
/*!40000 ALTER TABLE `receitas` DISABLE KEYS */;
/*!40000 ALTER TABLE `receitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receitas_producao`
--

DROP TABLE IF EXISTS `receitas_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receitas_producao` (
  `produto_acabado_id` int NOT NULL,
  `descricao` text,
  `tempo_preparacao` int DEFAULT NULL,
  `rendimento_unidades` decimal(10,2) DEFAULT NULL,
  `custo_total` decimal(10,2) DEFAULT NULL,
  `custo_unitario` decimal(10,2) DEFAULT NULL,
  `margem_lucro` decimal(10,2) DEFAULT NULL,
  `rentabilidade` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `custo_gas` decimal(10,2) DEFAULT '0.00',
  `custo_energia` decimal(10,2) DEFAULT '0.00',
  `custo_pessoal` decimal(10,2) DEFAULT '0.00',
  `custo_outros` decimal(10,2) DEFAULT '0.00',
  `setor` varchar(50) NOT NULL DEFAULT 'Cozinha',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_receitas_producao_produto_acabado_id` (`produto_acabado_id`),
  CONSTRAINT `fk_receitas_producao_produto_acabado_id_produtos` FOREIGN KEY (`produto_acabado_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receitas_producao`
--

LOCK TABLES `receitas_producao` WRITE;
/*!40000 ALTER TABLE `receitas_producao` DISABLE KEYS */;
INSERT INTO `receitas_producao` VALUES (24,'Receita de Bolo de Banana simples',45,1.00,319.00,319.00,231.00,42.00,1,4,'2026-08-13 10:30:36','2026-08-13 10:46:48',NULL,NULL,1,NULL,20.00,50.00,50.00,0.00,'Cozinha'),(16,'Cópia de Receita de Bolo de Banana simples',45,1.00,89.00,89.00,361.00,80.22,1,5,'2026-08-13 10:45:42','2026-08-13 10:45:42',NULL,NULL,1,NULL,0.00,0.00,0.00,0.00,'Cozinha');
/*!40000 ALTER TABLE `receitas_producao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisicoes`
--

DROP TABLE IF EXISTS `requisicoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisicoes` (
  `numero` varchar(50) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `sector` varchar(50) NOT NULL,
  `turno_id` int DEFAULT NULL,
  `responsavel_id` int NOT NULL,
  `data_requisicao` datetime NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `motivo` text,
  `evento_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_requisicoes_numero` (`numero`),
  KEY `fk_requisicoes_turno_id_turnos` (`turno_id`),
  KEY `fk_requisicoes_responsavel_id_users` (`responsavel_id`),
  CONSTRAINT `fk_requisicoes_responsavel_id_users` FOREIGN KEY (`responsavel_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_requisicoes_turno_id_turnos` FOREIGN KEY (`turno_id`) REFERENCES `turnos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisicoes`
--

LOCK TABLES `requisicoes` WRITE;
/*!40000 ALTER TABLE `requisicoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `requisicoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisicoes_itens`
--

DROP TABLE IF EXISTS `requisicoes_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisicoes_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisicao_id` int NOT NULL,
  `tipo_item` varchar(50) NOT NULL,
  `item_id` int NOT NULL,
  `quantidade_solicitada` decimal(10,3) NOT NULL,
  `quantidade_aprovada` decimal(10,3) DEFAULT NULL,
  `quantidade_entregue` decimal(10,3) DEFAULT NULL,
  `quantidade_devolvida` decimal(10,3) DEFAULT NULL,
  `quantidade_danificada` decimal(10,3) DEFAULT NULL,
  `quantidade_perdida` decimal(10,3) DEFAULT NULL,
  `observacao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_requisicoes_itens_requisicao_id_requisicoes` (`requisicao_id`),
  CONSTRAINT `fk_requisicoes_itens_requisicao_id_requisicoes` FOREIGN KEY (`requisicao_id`) REFERENCES `requisicoes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisicoes_itens`
--

LOCK TABLES `requisicoes_itens` WRITE;
/*!40000 ALTER TABLE `requisicoes_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `requisicoes_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_espacos`
--

DROP TABLE IF EXISTS `reservas_espacos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas_espacos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `espaco_id` int NOT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `estado` enum('RESERVADO','UTILIZADO','FINALIZADO','CANCELADO') DEFAULT NULL,
  `valor` decimal(12,2) DEFAULT '0.00',
  `valor_aluguer` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_reservas_espacos_evento_id_eventos` (`evento_id`),
  KEY `fk_reservas_espacos_espaco_id_espacos` (`espaco_id`),
  CONSTRAINT `fk_reservas_espacos_espaco_id_espacos` FOREIGN KEY (`espaco_id`) REFERENCES `espacos` (`id`),
  CONSTRAINT `fk_reservas_espacos_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_espacos`
--

LOCK TABLES `reservas_espacos` WRITE;
/*!40000 ALTER TABLE `reservas_espacos` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas_espacos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_ingredientes`
--

DROP TABLE IF EXISTS `reservas_ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas_ingredientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ingrediente_id` int NOT NULL,
  `pedido_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `data_reserva` datetime NOT NULL,
  `estado` enum('ATIVA','UTILIZADA','CANCELADA') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reservas_ingredientes_ingrediente_id_ingredientes` (`ingrediente_id`),
  KEY `fk_reservas_ingredientes_pedido_id_pedidos` (`pedido_id`),
  CONSTRAINT `fk_reservas_ingredientes_ingrediente_id_ingredientes` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`),
  CONSTRAINT `fk_reservas_ingredientes_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_ingredientes`
--

LOCK TABLES `reservas_ingredientes` WRITE;
/*!40000 ALTER TABLE `reservas_ingredientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas_ingredientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_materiais`
--

DROP TABLE IF EXISTS `reservas_materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas_materiais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `valor_unitario` decimal(12,2) DEFAULT '0.00',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_reservas_materiais_evento_id_eventos` (`evento_id`),
  KEY `fk_reservas_materiais_material_id_materiais` (`material_id`),
  CONSTRAINT `fk_reservas_materiais_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_reservas_materiais_material_id_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_materiais`
--

LOCK TABLES `reservas_materiais` WRITE;
/*!40000 ALTER TABLE `reservas_materiais` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas_materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_viaturas`
--

DROP TABLE IF EXISTS `reservas_viaturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas_viaturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evento_id` int NOT NULL,
  `viatura_id` int NOT NULL,
  `motorista_id` int NOT NULL,
  `data_saida` datetime NOT NULL,
  `data_retorno` datetime NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reservas_viaturas_evento_id_eventos` (`evento_id`),
  KEY `fk_reservas_viaturas_viatura_id_viaturas` (`viatura_id`),
  KEY `fk_reservas_viaturas_motorista_id_motoristas` (`motorista_id`),
  CONSTRAINT `fk_reservas_viaturas_evento_id_eventos` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_reservas_viaturas_motorista_id_motoristas` FOREIGN KEY (`motorista_id`) REFERENCES `motoristas` (`id`),
  CONSTRAINT `fk_reservas_viaturas_viatura_id_viaturas` FOREIGN KEY (`viatura_id`) REFERENCES `viaturas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_viaturas`
--

LOCK TABLES `reservas_viaturas` WRITE;
/*!40000 ALTER TABLE `reservas_viaturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas_viaturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `series_documento`
--

DROP TABLE IF EXISTS `series_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `series_documento` (
  `tipo_documento` enum('FT','FR','PROFORMA','NC','ND') NOT NULL,
  `ano` int NOT NULL,
  `ultimo_numero` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `series_documento`
--

LOCK TABLES `series_documento` WRITE;
/*!40000 ALTER TABLE `series_documento` DISABLE KEYS */;
INSERT INTO `series_documento` VALUES ('FR',2026,6,7,'2026-07-23 16:38:01','2026-08-13 14:13:28',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `series_documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicos_cadastro`
--

DROP TABLE IF EXISTS `servicos_cadastro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicos_cadastro` (
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descricao` text,
  `unidade_padrao` varchar(50) DEFAULT NULL,
  `preco_sugerido` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_servicos_cadastro_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicos_cadastro`
--

LOCK TABLES `servicos_cadastro` WRITE;
/*!40000 ALTER TABLE `servicos_cadastro` DISABLE KEYS */;
INSERT INTO `servicos_cadastro` VALUES ('SERV-001','Cozinha','Gastronomia','Serviço especializado de Cozinha','Unidade',150.00,1,1,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-002','Pastelaria','Gastronomia','Serviço especializado de Pastelaria','Unidade',80.00,1,2,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-003','Bar & Bebidas','Bebidas','Serviço especializado de Bar & Bebidas','Unidade',100.00,1,3,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-004','Logistica & Transporte','Logistica','Serviço especializado de Logistica & Transporte','Unidade',50.00,1,4,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-005','Aluguer de Equipamentos','Equipamento','Serviço especializado de Aluguer de Equipamentos','Unidade',75.00,1,5,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-006','Limpeza & Higienizacao','Operacional','Serviço especializado de Limpeza & Higienizacao','Unidade',40.00,1,6,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-007','Seguranca','Operacional','Serviço especializado de Seguranca','Unidade',60.00,1,7,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-008','Decoracao & Ornamentacao','Decoracao','Serviço especializado de Decoracao & Ornamentacao','Unidade',120.00,1,8,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-009','Empregados de Mesa','Servico','Serviço especializado de Empregados de Mesa','Unidade',35.00,1,9,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-010','Bartenders','Servico','Serviço especializado de Bartenders','Unidade',45.00,1,10,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-011','Cozinheiros de Apoio','Servico','Serviço especializado de Cozinheiros de Apoio','Unidade',50.00,1,11,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('SERV-012','Som & Iluminacao','Tecnico','Serviço especializado de Som & Iluminacao','Unidade',200.00,1,12,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `servicos_cadastro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taxas_iva`
--

DROP TABLE IF EXISTS `taxas_iva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taxas_iva` (
  `descricao` varchar(50) NOT NULL,
  `percentagem` decimal(5,2) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taxas_iva`
--

LOCK TABLES `taxas_iva` WRITE;
/*!40000 ALTER TABLE `taxas_iva` DISABLE KEYS */;
INSERT INTO `taxas_iva` VALUES ('IVA',15.00,1,1,'2026-07-07 16:49:13','2026-07-07 16:49:13',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `taxas_iva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_evento_cadastro`
--

DROP TABLE IF EXISTS `tipos_evento_cadastro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_evento_cadastro` (
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_evento_cadastro_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_evento_cadastro`
--

LOCK TABLES `tipos_evento_cadastro` WRITE;
/*!40000 ALTER TABLE `tipos_evento_cadastro` DISABLE KEYS */;
INSERT INTO `tipos_evento_cadastro` VALUES ('Casamento','Tipo de evento Casamento',1,1,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Aniversario','Tipo de evento Aniversario',1,2,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Batizado','Tipo de evento Batizado',1,3,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Empresarial','Tipo de evento Empresarial',1,4,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Catering','Tipo de evento Catering',1,5,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Formatura','Tipo de evento Formatura',1,6,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Conferencia','Tipo de evento Conferencia',1,7,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Cocktail','Tipo de evento Cocktail',1,8,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Funeral','Tipo de evento Funeral',1,9,'2026-07-28 17:06:56','2026-07-28 17:06:56',NULL,NULL,1,NULL),('Noivado','Cerimonia matrimonial',0,10,'2026-07-29 11:47:07','2026-07-29 11:49:18',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `tipos_evento_cadastro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blocklist`
--

DROP TABLE IF EXISTS `token_blocklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blocklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jti` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_token_blocklist_jti` (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blocklist`
--

LOCK TABLES `token_blocklist` WRITE;
/*!40000 ALTER TABLE `token_blocklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_blocklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `turnos`
--

DROP TABLE IF EXISTS `turnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos` (
  `nome` varchar(50) NOT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fim` time DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_turnos_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turnos`
--

LOCK TABLES `turnos` WRITE;
/*!40000 ALTER TABLE `turnos` DISABLE KEYS */;
INSERT INTO `turnos` VALUES ('Manhã','06:00:00','14:00:00',1,1,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('Tarde','14:00:00','22:00:00',1,2,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('Noite','22:00:00','06:00:00',1,3,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `turnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades_medida`
--

DROP TABLE IF EXISTS `unidades_medida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_medida` (
  `nome` varchar(50) NOT NULL,
  `sigla` varchar(10) NOT NULL,
  `descricao` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_unidades_medida_sigla` (`sigla`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_medida`
--

LOCK TABLES `unidades_medida` WRITE;
/*!40000 ALTER TABLE `unidades_medida` DISABLE KEYS */;
INSERT INTO `unidades_medida` VALUES ('quilogramas','kl','',1,'2026-07-07 16:47:00','2026-07-07 16:47:00',1,NULL,1,NULL),('Litros','l','',2,'2026-07-07 16:47:09','2026-07-07 16:47:09',1,NULL,1,NULL),('Caixa','cx','',3,'2026-07-07 16:47:18','2026-07-07 16:47:18',1,NULL,1,NULL),('Unidade','un','',4,'2026-07-07 16:47:31','2026-07-07 16:47:31',1,NULL,1,NULL);
/*!40000 ALTER TABLE `unidades_medida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMINISTRADOR','ATENDIMENTO','COZINHA','PASTELARIA','ARMAZEM','MOTORISTA','CONTROLADOR_MATERIAIS','FINANCEIRO') NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('Josias Barreto','josiasbarreto11@gmail.com','scrypt:32768:8:1$7xOJfNShgnImKxjD$4fd5160a6b78b0c2b6be7fd5525ed15e2c6556801b2186fb711034cf768c69a6f3321c1d5042e7cc02e486f5132fef63e0497fd9e6772ac95657aea31d3805fb','ADMINISTRADOR',1,'2026-07-07 16:24:53','2026-08-04 12:10:40',NULL,NULL,1,NULL),('Admin Atendimento','atendimento@test.com','scrypt:32768:8:1$oBquuxWbsKpbfn6B$0d3657d2da89207c8f796ed79a100511991625652bdf6797f319fb3d8e2aa67848d18fb6bf2f625f3b82ad5366612fd695a43877a6e50f2da78dd72d365cf337','ARMAZEM',2,'2026-07-10 15:28:42','2026-07-10 15:28:42',NULL,NULL,1,NULL),('Maura Barreto','tl80207@gmail.com','scrypt:32768:8:1$oBquuxWbsKpbfn6B$0d3657d2da89207c8f796ed79a100511991625652bdf6797f319fb3d8e2aa67848d18fb6bf2f625f3b82ad5366612fd695a43877a6e50f2da78dd72d365cf337','PASTELARIA',6,'2026-07-20 16:48:38','2026-07-20 16:48:38',1,NULL,1,NULL),('Garçon boss','equipatecnicacfp@gmail.com','scrypt:32768:8:1$2JvJrXIJ2Bcw7KPZ$119fa1b242e71a018aabd570c3010a635a640650b4293a07530240f470c48630c9b11c5829dc2d00db8d958726ab964aa6a54dbf7ada0d257ffc40a33c637830','PASTELARIA',7,'2026-08-04 11:04:24','2026-08-04 11:04:24',1,NULL,1,NULL),('Admin Armazem','armazem@test.com','scrypt:32768:8:1$XmIO1n9ugxLJEMj8$7abd074564d5689a883465d627aa8d856a9faf232bb7c473138a9a5ad19e85317c0fecadafafd4824613c8e0f62725de9633c34e633c40073da42efc89f0755c','ADMINISTRADOR',12,'2026-08-12 13:54:35','2026-08-12 13:54:35',NULL,NULL,1,NULL),('Test Admin','admin@test.com','scrypt:32768:8:1$m8MocL8o8aHkqZWh$b7942bd607a647d6b2d742c55829141d3efc2b3d0a6fdb3a165bb052829eaf11ac55a826c2e5c1c7da87726a6fd60de7a373c3b988582028eac380a0eaa655ab','ADMINISTRADOR',16,'2026-08-12 13:54:38','2026-08-12 13:54:38',NULL,NULL,1,NULL),('Admin Logistica','logistica@test.com','scrypt:32768:8:1$eNEaRfKZsXgCHbis$a21952e4493f3618cd0d59b5671e098b2c255a6ff7dd975c4f06adb415c48363b6519c9c4aea856fc82591db1af0661f2a06978fe2634d6f6b62fed9725662a9','ADMINISTRADOR',19,'2026-08-12 13:54:43','2026-08-12 13:54:43',NULL,NULL,1,NULL),('Admin Relatorios','rel@test.com','scrypt:32768:8:1$MuSZwizhCw8IrpCM$77424c4b31ec21fb810d8dd6f23a87186be7568d63ac18d620a13f635d2e5e87d0fdb49d7ea973f752a8c3f12dee48dd1723832386df69f551e6c5a520e0196d','ADMINISTRADOR',25,'2026-08-12 13:54:49','2026-08-12 13:54:49',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda_itens`
--

DROP TABLE IF EXISTS `venda_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venda_itens` (
  `venda_id` int NOT NULL,
  `item_tipo` varchar(50) NOT NULL,
  `item_id` int DEFAULT NULL,
  `descricao` varchar(255) NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `preco_unitario` decimal(12,2) NOT NULL,
  `desconto` decimal(12,2) DEFAULT NULL,
  `taxa_iva_id` int DEFAULT NULL,
  `taxa_iva` decimal(5,2) DEFAULT NULL,
  `valor_iva` decimal(12,2) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_venda_itens_venda_id_vendas` (`venda_id`),
  KEY `fk_venda_itens_taxa_iva_id_taxas_iva` (`taxa_iva_id`),
  CONSTRAINT `fk_venda_itens_taxa_iva_id_taxas_iva` FOREIGN KEY (`taxa_iva_id`) REFERENCES `taxas_iva` (`id`),
  CONSTRAINT `fk_venda_itens_venda_id_vendas` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda_itens`
--

LOCK TABLES `venda_itens` WRITE;
/*!40000 ALTER TABLE `venda_itens` DISABLE KEYS */;
INSERT INTO `venda_itens` VALUES (49,'Produto',44,'Coca-Cola 1L',10.00,17.00,0.00,1,15.00,25.50,170.00,195.50,75,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL),(49,'Produto',31,'Sumo Natural ',5.00,50.00,8.63,1,15.00,36.21,250.00,277.58,76,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL),(49,'Produto',19,'Vinho de Porto',6.00,240.00,82.80,1,15.00,203.58,1440.00,1560.78,77,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL),(49,'Produto',5,'Sumol de Manga ',2.00,20.00,0.00,NULL,0.00,0.00,40.00,40.00,78,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL),(50,'Produto',44,'Coca-Cola 1L',10.00,17.00,19.55,1,15.00,22.57,170.00,173.02,79,'2026-08-13 13:47:06','2026-08-13 13:47:06',NULL,NULL,1,NULL),(51,'Produto',44,'Coca-Cola 1L',1.00,17.00,10.00,1,15.00,1.05,17.00,8.05,80,'2026-08-13 13:51:19','2026-08-13 13:51:19',NULL,NULL,1,NULL),(52,'Produto',44,'Coca-Cola 1L',4.00,17.00,2.35,1,15.00,9.85,68.00,75.50,81,'2026-08-13 13:58:20','2026-08-13 13:58:20',NULL,NULL,1,NULL),(52,'Produto',31,'Sumo Natural ',3.00,50.00,0.00,1,15.00,22.50,150.00,172.50,82,'2026-08-13 13:58:20','2026-08-13 13:58:20',NULL,NULL,1,NULL),(53,'Produto',44,'Coca-Cola 1L',4.00,17.00,0.00,1,15.00,10.20,68.00,78.20,83,'2026-08-13 14:09:19','2026-08-13 14:09:19',NULL,NULL,1,NULL),(54,'Produto',44,'Coca-Cola 1L',4.00,17.00,10.00,1,15.00,8.70,68.00,66.70,84,'2026-08-13 14:13:28','2026-08-13 14:13:28',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `venda_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendas`
--

DROP TABLE IF EXISTS `vendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendas` (
  `numero_documento` varchar(50) NOT NULL,
  `tipo_documento` enum('FT','FR','PROFORMA','NC','ND') NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT NULL,
  `desconto_total` decimal(12,2) DEFAULT NULL,
  `base_tributavel` decimal(12,2) DEFAULT NULL,
  `total_iva` decimal(12,2) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `valor_pago` decimal(12,2) DEFAULT NULL,
  `saldo` decimal(12,2) DEFAULT NULL,
  `estado` enum('PENDENTE','PARCIALMENTE_PAGO','PAGO','CANCELADO') DEFAULT NULL,
  `observacoes` text,
  `criado_por` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `evento_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vendas_numero_documento` (`numero_documento`),
  KEY `fk_vendas_cliente_id_clientes` (`cliente_id`),
  KEY `fk_vendas_pedido_id_pedidos` (`pedido_id`),
  KEY `fk_vendas_criado_por_users` (`criado_por`),
  KEY `fk_venda_evento` (`evento_id`),
  CONSTRAINT `fk_venda_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_vendas_cliente_id_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_vendas_criado_por_users` FOREIGN KEY (`criado_por`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_vendas_pedido_id_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendas`
--

LOCK TABLES `vendas` WRITE;
/*!40000 ALTER TABLE `vendas` DISABLE KEYS */;
INSERT INTO `vendas` VALUES ('FR 2026/000001','FR',NULL,NULL,1900.00,91.43,1808.58,265.29,2073.86,2073.86,0.00,'PAGO','Venda direta via POS',1,49,'2026-08-13 12:01:39','2026-08-13 12:01:39',NULL,NULL,1,NULL,NULL),('FR 2026/000002','FR',NULL,NULL,170.00,19.55,150.45,22.57,173.02,173.02,0.00,'PAGO','Venda direta via POS',1,50,'2026-08-13 13:47:06','2026-08-13 13:47:06',NULL,NULL,1,NULL,NULL),('FR 2026/000003','FR',NULL,NULL,17.00,10.00,7.00,1.05,8.05,8.05,0.00,'PAGO','Venda direta via POS',1,51,'2026-08-13 13:51:19','2026-08-13 13:51:19',NULL,NULL,1,NULL,NULL),('FR 2026/000004','FR',NULL,NULL,218.00,2.35,215.65,32.35,248.00,248.00,0.00,'PAGO','Venda direta via POS',1,52,'2026-08-13 13:58:20','2026-08-13 13:58:20',NULL,NULL,1,NULL,NULL),('FR 2026/000005','FR',NULL,NULL,68.00,0.00,68.00,10.20,78.20,78.20,0.00,'PAGO','Venda direta via POS',1,53,'2026-08-13 14:09:19','2026-08-13 14:09:19',NULL,NULL,1,NULL,NULL),('FR 2026/000006','FR',NULL,NULL,68.00,10.00,58.00,8.70,66.70,66.70,0.00,'PAGO','Venda direta via POS',1,54,'2026-08-13 14:13:28','2026-08-13 14:13:28',NULL,NULL,1,NULL,NULL);
/*!40000 ALTER TABLE `vendas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `viaturas`
--

DROP TABLE IF EXISTS `viaturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `viaturas` (
  `matricula` varchar(20) NOT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `ano` int DEFAULT NULL,
  `capacidade` decimal(10,2) DEFAULT NULL,
  `quilometragem` decimal(10,2) DEFAULT NULL,
  `estado` enum('DISPONIVEL','EM_SERVICO','MANUTENCAO','INATIVA') DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_viaturas_matricula` (`matricula`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `viaturas`
--

LOCK TABLES `viaturas` WRITE;
/*!40000 ALTER TABLE `viaturas` DISABLE KEYS */;
INSERT INTO `viaturas` VALUES ('AA-00-BB',NULL,NULL,NULL,NULL,0.00,'DISPONIVEL',1,'2026-08-12 13:54:43','2026-08-12 13:54:43',19,NULL,1,NULL);
/*!40000 ALTER TABLE `viaturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'sigi_db'
--

--
-- Dumping routines for database 'sigi_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-13 14:27:15
