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
) ENGINE=InnoDB AUTO_INCREMENT=1240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (1147,1,'192.168.100.141',NULL,'users',1,'LOGIN','null','null',NULL,'2026-09-25 15:16:00'),(1148,7,'192.168.100.91',NULL,'users',7,'LOGIN','null','null',NULL,'2026-09-25 15:16:43'),(1149,1,'192.168.100.141',NULL,'caixas',34,'ABRIR','null','null',NULL,'2026-09-25 15:16:58'),(1150,1,'192.168.100.141',NULL,'ordens_producao',155,'CREATE','null','null',NULL,'2026-09-25 15:18:19'),(1151,1,'192.168.100.141',NULL,'pedidos',109,'CREATE','null','{\"numero\": \"PED-2618-B9C0C5\"}',NULL,'2026-09-25 15:18:19'),(1152,1,'192.168.100.141',NULL,'movimentacoes_armazem',212,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 4.0, \"justificacao\": \"Venda FR 2026/000052\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 38}',NULL,'2026-09-25 15:18:19'),(1153,1,'192.168.100.141',NULL,'movimentacoes_armazem',213,'MOVIMENTO_STOCK','null','{\"tipo\": \"Saida\", \"origem\": \"Venda\", \"quantidade\": 6.0, \"justificacao\": \"Venda FR 2026/000052\", \"entidade_tipo\": \"Produto\", \"referencia_id\": 27}',NULL,'2026-09-25 15:18:19'),(1154,7,'192.168.100.91',NULL,'ordens_producao',155,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:21:11'),(1155,7,'192.168.100.91',NULL,'pedidos',109,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Pronto\"}',NULL,'2026-09-25 15:21:12'),(1156,7,'192.168.100.91',NULL,'ordens_producao',155,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:21:40'),(1157,7,'192.168.100.91',NULL,'pedidos',109,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Entregue\"}',NULL,'2026-09-25 15:21:40'),(1158,7,'192.168.100.91',NULL,'users',7,'LOGIN','null','null',NULL,'2026-09-25 15:22:35'),(1159,1,'192.168.100.141',NULL,'pedidos',109,'UPDATE_ESTADO','{\"estado\": \"Entregue\"}','{\"estado\": \"Concluido\"}',NULL,'2026-09-25 15:23:19'),(1160,1,'192.168.100.141',NULL,'ordens_producao',156,'CREATE','null','null',NULL,'2026-09-25 15:24:41'),(1161,1,'192.168.100.141',NULL,'pedidos',110,'CREATE','null','{\"numero\": \"PED-2624-D9C7B7\"}',NULL,'2026-09-25 15:24:41'),(1162,1,'192.168.100.141',NULL,'eventos',14,'CREATE','null','{\"total\": 1733.0, \"numero\": \"EVT-202609-CDF207\"}',NULL,'2026-09-25 15:24:41'),(1163,7,'192.168.100.91',NULL,'ordens_producao',156,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:25:03'),(1164,7,'192.168.100.91',NULL,'pedidos',110,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Pronto\"}',NULL,'2026-09-25 15:25:04'),(1165,7,'192.168.100.91',NULL,'ordens_producao',156,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:25:05'),(1166,7,'192.168.100.91',NULL,'pedidos',110,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Entregue\"}',NULL,'2026-09-25 15:25:05'),(1167,7,'192.168.100.91',NULL,'ordens_producao',156,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:25:11'),(1168,7,'192.168.100.91',NULL,'pedidos',110,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Pronto\"}',NULL,'2026-09-25 15:25:11'),(1169,7,'192.168.100.91',NULL,'ordens_producao',156,'UPDATE_ESTADO_OP','null','null',NULL,'2026-09-25 15:25:13'),(1170,7,'192.168.100.91',NULL,'pedidos',110,'UPDATE_ESTADO','{\"estado\": \"Pronto\"}','{\"estado\": \"Entregue\"}',NULL,'2026-09-25 15:25:13'),(1171,7,'192.168.100.91',NULL,'users',7,'LOGIN','null','null',NULL,'2026-09-25 15:46:17'),(1172,1,'192.168.100.141','ARMAPE','inventarios',1,'CRIAR_INVENTARIO','null','{\"id\": 1, \"tipo\": \"COMPLETO\", \"estado\": \"RASCUNHO\", \"numero\": \"INV-2026-00001\", \"armazem\": \"Armazém  Nº1\", \"armazem_id\": 1, \"created_at\": \"2026-09-25T15:50:36\", \"observacao\": \"mjjnjnjjkc\", \"updated_at\": \"2026-09-25T15:50:36\", \"aplicado_em\": null, \"aprovado_em\": null, \"iniciado_em\": null, \"responsavel\": \"Josias Barreto\", \"aplicado_por\": null, \"aprovado_por\": null, \"cancelado_em\": null, \"cancelado_por\": null, \"finalizado_em\": null, \"armazem_codigo\": \"Arm0002\", \"responsavel_id\": 1, \"data_inventario\": \"2026-09-25\", \"motivo_cancelamento\": null}',NULL,'2026-09-25 15:50:36'),(1173,1,'192.168.100.141','ARMAPE','inventarios',1,'INICIAR_INVENTARIO','null','{\"estado\": \"EM_CONTAGEM\", \"iniciado_em\": \"2026-09-25T15:50:41\"}',NULL,'2026-09-25 15:50:41'),(1174,1,'192.168.100.141','ARMAPE','inventario_items',1,'REGISTAR_CONTAGEM','null','{\"motivo\": \"VALIDACAO_INVENTARIO\", \"item_id\": 1, \"situacao\": \"FALTA\", \"diferenca\": -1.0, \"quantidade_contada\": 9.0}',NULL,'2026-09-25 15:51:06'),(1175,1,'192.168.100.141','ARMAPE','inventario_items',1,'REGISTAR_CONTAGEM','null','{\"motivo\": \"VALIDACAO_INVENTARIO\", \"item_id\": 1, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 10.0}',NULL,'2026-09-25 15:51:06'),(1176,1,'192.168.100.141','ARMAPE','inventario_items',1,'REGISTAR_CONTAGEM','null','{\"motivo\": \"VALIDACAO_INVENTARIO\", \"item_id\": 1, \"situacao\": \"FALTA\", \"diferenca\": -1.0, \"quantidade_contada\": 9.0}',NULL,'2026-09-25 15:51:12'),(1177,1,'192.168.100.141','ARMAPE','inventario_items',2,'REGISTAR_CONTAGEM','null','{\"motivo\": \"VALIDACAO_INVENTARIO\", \"item_id\": 2, \"situacao\": \"FALTA\", \"diferenca\": -400.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:51:14'),(1178,1,'192.168.100.141','ARMAPE','inventario_items',2,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 2, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 400.0}',NULL,'2026-09-25 15:51:15'),(1179,1,'192.168.100.141','ARMAPE','inventario_items',3,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 3, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.03}',NULL,'2026-09-25 15:51:16'),(1180,1,'192.168.100.141','ARMAPE','inventario_items',4,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 4, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 278.0}',NULL,'2026-09-25 15:51:17'),(1181,1,'192.168.100.141','ARMAPE','inventario_items',5,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 5, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 103.0}',NULL,'2026-09-25 15:51:21'),(1182,1,'192.168.100.141','ARMAPE','inventario_items',6,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 6, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 289.0}',NULL,'2026-09-25 15:51:22'),(1183,1,'192.168.100.141','ARMAPE','inventario_items',7,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 7, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:23'),(1184,1,'192.168.100.141','ARMAPE','inventario_items',8,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 8, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:24'),(1185,1,'192.168.100.141','ARMAPE','inventario_items',9,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 9, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:26'),(1186,1,'192.168.100.141','ARMAPE','inventario_items',10,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 10, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 130.0}',NULL,'2026-09-25 15:51:26'),(1187,1,'192.168.100.141','ARMAPE','inventario_items',11,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 11, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:51:28'),(1188,1,'192.168.100.141','ARMAPE','inventario_items',12,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 12, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 284.0}',NULL,'2026-09-25 15:51:29'),(1189,1,'192.168.100.141','ARMAPE','inventario_items',13,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 13, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:31'),(1190,1,'192.168.100.141','ARMAPE','inventario_items',14,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 14, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 90.0}',NULL,'2026-09-25 15:51:31'),(1191,1,'192.168.100.141','ARMAPE','inventario_items',15,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 15, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:32'),(1192,1,'192.168.100.141','ARMAPE','inventario_items',15,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 15, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:34'),(1193,1,'192.168.100.141','ARMAPE','inventario_items',16,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 16, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 260.0}',NULL,'2026-09-25 15:51:35'),(1194,1,'192.168.100.141','ARMAPE','inventario_items',17,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 17, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 125.0}',NULL,'2026-09-25 15:51:36'),(1195,1,'192.168.100.141','ARMAPE','inventario_items',18,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 18, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 130.0}',NULL,'2026-09-25 15:51:37'),(1196,1,'192.168.100.141','ARMAPE','inventario_items',19,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 19, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:37'),(1197,1,'192.168.100.141','ARMAPE','inventario_items',20,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 20, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 3.0}',NULL,'2026-09-25 15:51:38'),(1198,1,'192.168.100.141','ARMAPE','inventario_items',21,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 21, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 3.0}',NULL,'2026-09-25 15:51:40'),(1199,1,'192.168.100.141','ARMAPE','inventario_items',22,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 22, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 103.0}',NULL,'2026-09-25 15:51:40'),(1200,1,'192.168.100.141','ARMAPE','inventario_items',23,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 23, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 103.0}',NULL,'2026-09-25 15:51:41'),(1201,1,'192.168.100.141','ARMAPE','inventario_items',24,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 24, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 103.0}',NULL,'2026-09-25 15:51:42'),(1202,1,'192.168.100.141','ARMAPE','inventario_items',25,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 25, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 199.0}',NULL,'2026-09-25 15:51:42'),(1203,1,'192.168.100.141','ARMAPE','inventario_items',25,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 25, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 199.0}',NULL,'2026-09-25 15:51:43'),(1204,1,'192.168.100.141','ARMAPE','inventario_items',26,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 26, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:44'),(1205,1,'192.168.100.141','ARMAPE','inventario_items',27,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 27, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:45'),(1206,1,'192.168.100.141','ARMAPE','inventario_items',28,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 28, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:46'),(1207,1,'192.168.100.141','ARMAPE','inventario_items',29,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 29, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 300.0}',NULL,'2026-09-25 15:51:48'),(1208,1,'192.168.100.141','ARMAPE','inventario_items',30,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 30, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 297.0}',NULL,'2026-09-25 15:51:48'),(1209,1,'192.168.100.141','ARMAPE','inventario_items',31,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 31, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 288.0}',NULL,'2026-09-25 15:51:49'),(1210,1,'192.168.100.141','ARMAPE','inventario_items',32,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 32, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 273.0}',NULL,'2026-09-25 15:51:50'),(1211,1,'192.168.100.141','ARMAPE','inventario_items',33,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 33, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 3.0}',NULL,'2026-09-25 15:51:51'),(1212,1,'192.168.100.141','ARMAPE','inventario_items',43,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 43, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 1210.0}',NULL,'2026-09-25 15:51:52'),(1213,1,'192.168.100.141','ARMAPE','inventario_items',42,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 42, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 1000.0}',NULL,'2026-09-25 15:51:53'),(1214,1,'192.168.100.141','ARMAPE','inventario_items',41,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 41, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 99.0}',NULL,'2026-09-25 15:51:54'),(1215,1,'192.168.100.141','ARMAPE','inventario_items',40,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 40, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 100.0}',NULL,'2026-09-25 15:51:55'),(1216,1,'192.168.100.141','ARMAPE','inventario_items',39,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 39, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 100.0}',NULL,'2026-09-25 15:51:55'),(1217,1,'192.168.100.141','ARMAPE','inventario_items',37,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 37, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:51:58'),(1218,1,'192.168.100.141','ARMAPE','inventario_items',38,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 38, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:51:58'),(1219,1,'192.168.100.141','ARMAPE','inventario_items',36,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 36, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:51:59'),(1220,1,'192.168.100.141','ARMAPE','inventario_items',35,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 35, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 0.0}',NULL,'2026-09-25 15:52:00'),(1221,1,'192.168.100.141','ARMAPE','inventario_items',34,'REGISTAR_CONTAGEM','null','{\"motivo\": null, \"item_id\": 34, \"situacao\": \"SEM_DIVERGENCIA\", \"diferenca\": 0.0, \"quantidade_contada\": 3.0}',NULL,'2026-09-25 15:52:01'),(1222,1,'192.168.100.141','ARMAPE','inventario_items',1,'REGISTAR_CONTAGEM','null','{\"motivo\": \"PERDA\", \"item_id\": 1, \"situacao\": \"FALTA\", \"diferenca\": -1.0, \"quantidade_contada\": 9.0}',NULL,'2026-09-25 15:52:42'),(1223,1,'192.168.100.141','ARMAPE','inventario_items',1,'REGISTAR_CONTAGEM','null','{\"motivo\": \"PERDA\", \"item_id\": 1, \"situacao\": \"FALTA\", \"diferenca\": -1.0, \"quantidade_contada\": 9.0}',NULL,'2026-09-25 15:52:51'),(1224,1,'192.168.100.141','ARMAPE','inventarios',1,'FINALIZAR_CONTAGEM','null','{\"estado\": \"EM_CONFERENCIA\", \"finalizado_em\": \"2026-09-25T15:52:53\"}',NULL,'2026-09-25 15:52:53'),(1225,1,'192.168.100.141','ARMAPE','inventarios',1,'APROVAR_INVENTARIO','null','{\"estado\": \"APROVADO\", \"aprovado_em\": \"2026-09-25T15:53:08\"}',NULL,'2026-09-25 15:53:08'),(1226,1,'192.168.100.141','ARMAPE','inventarios',1,'APLICAR_AJUSTES_INVENTARIO','null','{\"aplicado_em\": \"2026-09-25T15:53:13\", \"total_ajustes\": 1}',NULL,'2026-09-25 15:53:13'),(1227,16,'192.168.100.91',NULL,'users',16,'LOGIN_FAILED','null','null',NULL,'2026-09-25 16:02:54'),(1228,16,'192.168.100.91',NULL,'users',16,'LOGIN_FAILED','null','null',NULL,'2026-09-25 16:03:17'),(1229,16,'192.168.100.91',NULL,'users',16,'LOGIN','null','null',NULL,'2026-09-25 16:03:34'),(1230,1,'192.168.100.141',NULL,'caixas',34,'FECHAR_DETALHADO','null','null',NULL,'2026-09-25 16:11:12'),(1231,1,'192.168.100.141',NULL,'users',1,'LOGIN','null','null',NULL,'2026-09-25 16:11:18'),(1232,1,'127.0.0.1',NULL,'users',1,'LOGIN','null','null',NULL,'2026-09-25 16:17:11'),(1233,1,'127.0.0.1',NULL,'users',1,'LOGIN','null','null',NULL,'2026-09-25 16:20:03'),(1234,1,'192.168.100.141',NULL,'users',1,'LOGIN','null','null',NULL,'2026-09-25 17:03:33'),(1235,1,'192.168.100.141','CONFIGURACOES','sistema',NULL,'DELETE_BACKUP','null','{\"filename\": \"sigi_completo_20260813_142715.sql\"}',NULL,'2026-09-27 11:09:20'),(1236,1,'192.168.100.141','CONFIGURACOES','sistema',NULL,'DELETE_BACKUP','null','{\"filename\": \"sigi_completo_20260813_111342.sql\"}',NULL,'2026-09-27 11:09:23'),(1237,1,'192.168.100.141','CONFIGURACOES','sistema',NULL,'DELETE_BACKUP','null','{\"filename\": \"sigi_completo_20260813_111231.sql\"}',NULL,'2026-09-27 11:09:25'),(1238,1,'192.168.100.141','CONFIGURACOES','sistema',NULL,'DELETE_BACKUP','null','{\"filename\": \"sigi_completo_20260813_111037.sql\"}',NULL,'2026-09-27 11:09:27'),(1239,1,'192.168.100.141','CONFIGURACOES','sistema',NULL,'DELETE_BACKUP','null','{\"filename\": \"sigi_completo_20260813_111031.sql\"}',NULL,'2026-09-27 11:09:30');
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caixas`
--

LOCK TABLES `caixas` WRITE;
/*!40000 ALTER TABLE `caixas` DISABLE KEYS */;
INSERT INTO `caixas` VALUES ('CX-20260925151658284503','2026-09-25 15:16:58','2026-09-25 16:11:12',100.00,3605.00,1,1,'FECHADO',3605.00,0.00,0.00,3605.00,0.00,0.00,0.00,0.00,0.00,NULL,34,'2026-09-25 15:16:58','2026-09-25 16:11:12',NULL,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `venda_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eventos_numero` (`numero`),
  KEY `fk_eventos_cliente_id_clientes` (`cliente_id`),
  KEY `fk_evento_pedido` (`pedido_id`),
  CONSTRAINT `fk_evento_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES ('EVT-202609-CDF207',2,'ANIVERSARIO','Josias',NULL,'','2026-09-25','22:00:00','23:00:00',20,'CONFIRMADO','',0.00,0.00,0.00,14,'2026-09-25 15:24:41','2026-09-25 15:24:41',1,NULL,1,NULL,110,NULL,NULL,NULL,NULL,1,15.00,0.00,100.00,0.00,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos_itens`
--

LOCK TABLES `eventos_itens` WRITE;
/*!40000 ALTER TABLE `eventos_itens` DISABLE KEYS */;
INSERT INTO `eventos_itens` VALUES (26,14,'Produto',28,28,'Feijoada de Peixe',1.00,'Unidade',430.00,0.00,0.00,15.00,64.50,430.00,494.50,NULL,NULL,NULL),(27,14,'Produto',25,25,'Arroz de Cenoura Frango',1.00,'Unidade',280.00,0.00,0.00,15.00,42.00,280.00,322.00,NULL,NULL,NULL);
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
-- Table structure for table `historico_sms`
--

DROP TABLE IF EXISTS `historico_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_sms` (
  `telefone` varchar(50) NOT NULL,
  `destinatario_nome` varchar(120) DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `canal` varchar(20) NOT NULL,
  `tipo_mensagem` varchar(50) NOT NULL,
  `mensagem` text NOT NULL,
  `status` varchar(30) NOT NULL,
  `erro` text,
  `lido_em` datetime DEFAULT NULL,
  `metadados` json DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_historico_sms_cliente_id` (`cliente_id`),
  KEY `ix_historico_sms_telefone` (`telefone`),
  KEY `ix_historico_sms_user_id` (`user_id`),
  KEY `ix_historico_sms_status` (`status`),
  CONSTRAINT `fk_historico_sms_cliente_id_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_historico_sms_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_sms`
--

LOCK TABLES `historico_sms` WRITE;
/*!40000 ALTER TABLE `historico_sms` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_sms` ENABLE KEYS */;
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
  `tipo_item` enum('INGREDIENTE','MATERIAL','PRODUTO') DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `quantidade_sistema` decimal(12,2) NOT NULL,
  `quantidade_contada` decimal(12,3) DEFAULT NULL,
  `diferenca` decimal(12,3) DEFAULT NULL,
  `justificativa` varchar(255) DEFAULT NULL,
  `produto_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `unidade_medida_id` int DEFAULT NULL,
  `situacao` enum('SEM_DIVERGENCIA','FALTA','SOBRA','NAO_CONTADO') DEFAULT 'NAO_CONTADO',
  `motivo_ajuste` enum('QUEBRA','PERDA','DANIFICADO','CONSUMO_NAO_REGISTADO','ERRO_CONTAGEM','ERRO_REGISTO','VALIDACAO_INVENTARIO','OUTRO') DEFAULT NULL,
  `observacao` text,
  `contado_por` int DEFAULT NULL,
  `contado_em` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_inventario_items_inventario_id_inventarios` (`inventario_id`),
  CONSTRAINT `fk_inventario_items_inventario_id_inventarios` FOREIGN KEY (`inventario_id`) REFERENCES `inventarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario_items`
--

LOCK TABLES `inventario_items` WRITE;
/*!40000 ALTER TABLE `inventario_items` DISABLE KEYS */;
INSERT INTO `inventario_items` VALUES (1,1,NULL,NULL,10.00,9.000,-1.000,NULL,2,NULL,4,'FALTA','PERDA','não se viu',1,'2026-09-25 15:52:51','2026-09-25 15:50:41','2026-09-25 15:52:51',NULL,NULL,1,NULL),(2,1,NULL,NULL,400.00,400.000,0.000,NULL,3,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:15','2026-09-25 15:50:41','2026-09-25 15:51:15',NULL,NULL,1,NULL),(3,1,NULL,NULL,0.03,0.030,0.000,NULL,4,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:16','2026-09-25 15:50:41','2026-09-25 15:51:16',NULL,NULL,1,NULL),(4,1,NULL,NULL,278.00,278.000,0.000,NULL,5,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:17','2026-09-25 15:50:41','2026-09-25 15:51:17',NULL,NULL,1,NULL),(5,1,NULL,NULL,103.00,103.000,0.000,NULL,6,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:21','2026-09-25 15:50:41','2026-09-25 15:51:21',NULL,NULL,1,NULL),(6,1,NULL,NULL,289.00,289.000,0.000,NULL,7,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:22','2026-09-25 15:50:41','2026-09-25 15:51:22',NULL,NULL,1,NULL),(7,1,NULL,NULL,300.00,300.000,0.000,NULL,8,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:23','2026-09-25 15:50:41','2026-09-25 15:51:23',NULL,NULL,1,NULL),(8,1,NULL,NULL,300.00,300.000,0.000,NULL,9,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:24','2026-09-25 15:50:41','2026-09-25 15:51:24',NULL,NULL,1,NULL),(9,1,NULL,NULL,300.00,300.000,0.000,NULL,10,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:26','2026-09-25 15:50:41','2026-09-25 15:51:26',NULL,NULL,1,NULL),(10,1,NULL,NULL,130.00,130.000,0.000,NULL,11,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:26','2026-09-25 15:50:41','2026-09-25 15:51:26',NULL,NULL,1,NULL),(11,1,NULL,NULL,0.00,0.000,0.000,NULL,12,NULL,2,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:28','2026-09-25 15:50:41','2026-09-25 15:51:28',NULL,NULL,1,NULL),(12,1,NULL,NULL,284.00,284.000,0.000,NULL,13,NULL,2,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:29','2026-09-25 15:50:41','2026-09-25 15:51:29',NULL,NULL,1,NULL),(13,1,NULL,NULL,300.00,300.000,0.000,NULL,14,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:31','2026-09-25 15:50:41','2026-09-25 15:51:31',NULL,NULL,1,NULL),(14,1,NULL,NULL,90.00,90.000,0.000,NULL,15,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:31','2026-09-25 15:50:41','2026-09-25 15:51:31',NULL,NULL,1,NULL),(15,1,NULL,NULL,300.00,300.000,0.000,NULL,16,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:34','2026-09-25 15:50:41','2026-09-25 15:51:34',NULL,NULL,1,NULL),(16,1,NULL,NULL,260.00,260.000,0.000,NULL,17,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:35','2026-09-25 15:50:41','2026-09-25 15:51:35',NULL,NULL,1,NULL),(17,1,NULL,NULL,125.00,125.000,0.000,NULL,18,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:36','2026-09-25 15:50:41','2026-09-25 15:51:36',NULL,NULL,1,NULL),(18,1,NULL,NULL,130.00,130.000,0.000,NULL,19,NULL,2,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:37','2026-09-25 15:50:41','2026-09-25 15:51:37',NULL,NULL,1,NULL),(19,1,NULL,NULL,300.00,300.000,0.000,NULL,24,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:37','2026-09-25 15:50:41','2026-09-25 15:51:37',NULL,NULL,1,NULL),(20,1,NULL,NULL,3.00,3.000,0.000,NULL,27,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:38','2026-09-25 15:50:41','2026-09-25 15:51:38',NULL,NULL,1,NULL),(21,1,NULL,NULL,3.00,3.000,0.000,NULL,28,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:40','2026-09-25 15:50:41','2026-09-25 15:51:40',NULL,NULL,1,NULL),(22,1,NULL,NULL,103.00,103.000,0.000,NULL,32,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:40','2026-09-25 15:50:41','2026-09-25 15:51:40',NULL,NULL,1,NULL),(23,1,NULL,NULL,103.00,103.000,0.000,NULL,37,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:41','2026-09-25 15:50:41','2026-09-25 15:51:41',NULL,NULL,1,NULL),(24,1,NULL,NULL,103.00,103.000,0.000,NULL,43,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:42','2026-09-25 15:50:41','2026-09-25 15:51:42',NULL,NULL,1,NULL),(25,1,NULL,NULL,199.00,199.000,0.000,NULL,44,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:43','2026-09-25 15:50:41','2026-09-25 15:51:43',NULL,NULL,1,NULL),(26,1,NULL,NULL,300.00,300.000,0.000,NULL,45,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:44','2026-09-25 15:50:41','2026-09-25 15:51:44',NULL,NULL,1,NULL),(27,1,NULL,NULL,300.00,300.000,0.000,NULL,46,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:45','2026-09-25 15:50:41','2026-09-25 15:51:45',NULL,NULL,1,NULL),(28,1,NULL,NULL,300.00,300.000,0.000,NULL,47,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:46','2026-09-25 15:50:41','2026-09-25 15:51:46',NULL,NULL,1,NULL),(29,1,NULL,NULL,300.00,300.000,0.000,NULL,38,NULL,NULL,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:48','2026-09-25 15:50:41','2026-09-25 15:51:48',NULL,NULL,1,NULL),(30,1,NULL,NULL,297.00,297.000,0.000,NULL,31,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:48','2026-09-25 15:50:41','2026-09-25 15:51:48',NULL,NULL,1,NULL),(31,1,NULL,NULL,288.00,288.000,0.000,NULL,30,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:49','2026-09-25 15:50:41','2026-09-25 15:51:49',NULL,NULL,1,NULL),(32,1,NULL,NULL,273.00,273.000,0.000,NULL,29,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:50','2026-09-25 15:50:41','2026-09-25 15:51:50',NULL,NULL,1,NULL),(33,1,NULL,NULL,3.00,3.000,0.000,NULL,26,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:51','2026-09-25 15:50:41','2026-09-25 15:51:51',NULL,NULL,1,NULL),(34,1,NULL,NULL,3.00,3.000,0.000,NULL,25,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:52:01','2026-09-25 15:50:41','2026-09-25 15:52:01',NULL,NULL,1,NULL),(35,1,NULL,NULL,0.00,0.000,0.000,NULL,48,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:52:00','2026-09-25 15:50:41','2026-09-25 15:52:00',NULL,NULL,1,NULL),(36,1,NULL,NULL,0.00,0.000,0.000,NULL,53,NULL,1,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:59','2026-09-25 15:50:41','2026-09-25 15:51:59',NULL,NULL,1,NULL),(37,1,NULL,NULL,0.00,0.000,0.000,NULL,1,NULL,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:58','2026-09-25 15:50:41','2026-09-25 15:51:58',NULL,NULL,1,NULL),(38,1,NULL,NULL,0.00,0.000,0.000,NULL,NULL,1,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:58','2026-09-25 15:50:41','2026-09-25 15:51:58',NULL,NULL,1,NULL),(39,1,NULL,NULL,100.00,100.000,0.000,NULL,NULL,2,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:55','2026-09-25 15:50:41','2026-09-25 15:51:55',NULL,NULL,1,NULL),(40,1,NULL,NULL,100.00,100.000,0.000,NULL,NULL,3,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:55','2026-09-25 15:50:41','2026-09-25 15:51:55',NULL,NULL,1,NULL),(41,1,NULL,NULL,99.00,99.000,0.000,NULL,NULL,4,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:54','2026-09-25 15:50:41','2026-09-25 15:51:54',NULL,NULL,1,NULL),(42,1,NULL,NULL,1000.00,1000.000,0.000,NULL,NULL,5,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:53','2026-09-25 15:50:41','2026-09-25 15:51:53',NULL,NULL,1,NULL),(43,1,NULL,NULL,1210.00,1210.000,0.000,NULL,NULL,6,4,'SEM_DIVERGENCIA',NULL,NULL,1,'2026-09-25 15:51:52','2026-09-25 15:50:41','2026-09-25 15:51:52',NULL,NULL,1,NULL);
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
  `tipo` enum('COMPLETO','PARCIAL') NOT NULL DEFAULT 'COMPLETO',
  `estado` enum('RASCUNHO','EM_CONTAGEM','EM_CONFERENCIA','APROVADO','APLICADO','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
  `data_inicio` datetime DEFAULT NULL,
  `data_fim` datetime DEFAULT NULL,
  `observacoes` text,
  `utilizador_id` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `armazem_id` int DEFAULT NULL,
  `data_inventario` date DEFAULT NULL,
  `responsavel_id` int DEFAULT NULL,
  `observacao` text,
  `iniciado_em` datetime DEFAULT NULL,
  `finalizado_em` datetime DEFAULT NULL,
  `aprovado_em` datetime DEFAULT NULL,
  `aprovado_por` int DEFAULT NULL,
  `aplicado_em` datetime DEFAULT NULL,
  `aplicado_por` int DEFAULT NULL,
  `cancelado_em` datetime DEFAULT NULL,
  `cancelado_por` int DEFAULT NULL,
  `motivo_cancelamento` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventarios_numero` (`numero`),
  KEY `fk_inventarios_utilizador_id_users` (`utilizador_id`),
  CONSTRAINT `fk_inventarios_utilizador_id_users` FOREIGN KEY (`utilizador_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventarios`
--

LOCK TABLES `inventarios` WRITE;
/*!40000 ALTER TABLE `inventarios` DISABLE KEYS */;
INSERT INTO `inventarios` VALUES ('INV-2026-00001','COMPLETO','APLICADO',NULL,NULL,NULL,NULL,1,'2026-09-25 15:50:36','2026-09-25 15:53:13',NULL,NULL,1,NULL,1,'2026-09-25',1,'mjjnjnjjkc','2026-09-25 15:50:41','2026-09-25 15:52:53','2026-09-25 15:53:08',1,'2026-09-25 15:53:13',1,NULL,NULL,NULL);
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
  `tipo_item` enum('Produto','Produto Acabado','Produto Revenda','Servico','Aluguer') NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_pedido`
--

LOCK TABLES `itens_pedido` WRITE;
/*!40000 ALTER TABLE `itens_pedido` DISABLE KEYS */;
INSERT INTO `itens_pedido` VALUES (109,'Produto',38,'Produto E2E',4.00,100.00,400.00,244,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,400.00,0.00,NULL,0.00,0.00),(109,'Produto',27,'Feijoada da Terra Recheada',6.00,450.00,2700.00,245,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,3105.00,0.00,1,15.00,405.00),(110,'Produto',28,'Feijoada de Peixe',1.00,430.00,430.00,246,'2026-09-25 15:24:41','2026-09-25 15:24:41',1,NULL,1,NULL,494.50,0.00,1,15.00,64.50),(110,'Produto',25,'Arroz de Cenoura Frango',1.00,280.00,280.00,247,'2026-09-25 15:24:41','2026-09-25 15:24:41',1,NULL,1,NULL,322.00,0.00,1,15.00,42.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=1483 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_erros`
--

LOCK TABLES `log_erros` WRITE;
/*!40000 ALTER TABLE `log_erros` DISABLE KEYS */;
INSERT INTO `log_erros` VALUES (1475,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-09-25 15:23:49'),(1476,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-09-25 15:23:49'),(1477,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-09-25 15:23:50'),(1478,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-09-25 15:23:50'),(1479,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-09-25 15:23:52'),(1480,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-09-25 15:23:52'),(1481,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/cadastros/espacos',1,'2026-09-25 15:23:56'),(1482,'Exception','\'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo','Traceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1609, in _object_value_for_elem\n    return self._object_lookup[elem]\n           ~~~~~~~~~~~~~~~~~~~^^^^^^\nKeyError: \'ATIVO\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 880, in full_dispatch_request\n    rv = self.dispatch_request()\n         ^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask\\app.py\", line 865, in dispatch_request\n    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_jwt_extended\\view_decorators.py\", line 170, in decorator\n    return current_app.ensure_sync(fn)(*args, **kwargs)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 307, in get_espacos\n    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\api\\v1\\evento_controller.py\", line 33, in build_pagination\n    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Users\\josia\\Documents\\GitHub\\SIGI\\backend\\app\\repositories\\base_repository.py\", line 46, in get_paginated\n    return query.paginate(page=page, per_page=per_page, error_out=False)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\query.py\", line 98, in paginate\n    return QueryPagination(\n           ^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 72, in __init__\n    items = self._query_items()\n            ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\flask_sqlalchemy\\pagination.py\", line 358, in _query_items\n    out = query.limit(self.per_page).offset(self._query_offset).all()\n          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\query.py\", line 2673, in all\n    return self._iter().all()  # type: ignore\n           ^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1769, in all\n    return self._allrows()\n           ^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 548, in _allrows\n    rows = self._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 1676, in _fetchall_impl\n    return self._real_result._fetchall_impl()\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 2270, in _fetchall_impl\n    return list(self.iterator)\n           ^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\orm\\loading.py\", line 219, in chunks\n    fetch = cursor._raw_all_rows()\n            ^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\engine\\result.py\", line 541, in _raw_all_rows\n    return [make_row(row) for row in rows]\n            ^^^^^^^^^^^^^\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 22, in sqlalchemy.cyextension.resultproxy.BaseRow.__init__\n  File \"lib\\\\sqlalchemy\\\\cyextension\\\\resultproxy.pyx\", line 79, in sqlalchemy.cyextension.resultproxy._apply_processors\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1729, in process\n    value = self._object_value_for_elem(value)\n            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\dialects\\mysql\\enumerated.py\", line 87, in _object_value_for_elem\n    return super()._object_value_for_elem(elem)\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n  File \"C:\\Python312\\Lib\\site-packages\\sqlalchemy\\sql\\sqltypes.py\", line 1611, in _object_value_for_elem\n    raise LookupError(\nLookupError: \'ATIVO\' is not among the defined enum values. Enum name: estadoespaco. Possible values: Ativo, Inativo\n','/api/v1/eventos/espacos',1,'2026-09-25 15:23:56');
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
) ENGINE=InnoDB AUTO_INCREMENT=215 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacoes_armazem`
--

LOCK TABLES `movimentacoes_armazem` WRITE;
/*!40000 ALTER TABLE `movimentacoes_armazem` DISABLE KEYS */;
INSERT INTO `movimentacoes_armazem` VALUES ('SAIDA','VENDA','PRODUTO',44,10.000,'Venda FR 2026/000025',133,'2026-08-19 15:02:31','2026-08-19 15:02:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,10.000,'Venda FR 2026/000025',134,'2026-08-19 15:02:31','2026-08-19 15:02:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,10.000,'Venda FR 2026/000025',135,'2026-08-19 15:02:31','2026-08-19 15:02:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,10.000,'Venda FR 2026/000025',136,'2026-08-19 15:02:31','2026-08-19 15:02:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,20.000,'Venda FR 2026/000025',137,'2026-08-19 15:02:31','2026-08-19 15:02:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FT 2026/000007',138,'2026-08-19 15:06:37','2026-08-19 15:06:37',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FT 2026/000007',139,'2026-08-19 15:06:37','2026-08-19 15:06:37',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,1.000,'Venda FT 2026/000008',140,'2026-08-19 15:33:39','2026-08-19 15:33:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',16,1.000,'Venda FT 2026/000008',141,'2026-08-19 15:33:39','2026-08-19 15:33:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,1.000,'Venda FT 2026/000008',142,'2026-08-19 15:33:39','2026-08-19 15:33:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FT 2026/000008',143,'2026-08-19 15:33:39','2026-08-19 15:33:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',26,1.000,'Venda FT 2026/000008',144,'2026-08-19 15:33:39','2026-08-19 15:33:39',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,1.000,'Venda FR 2026/000026',145,'2026-08-19 16:11:52','2026-08-19 16:11:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000026',146,'2026-08-19 16:11:52','2026-08-19 16:11:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,1.000,'Venda FR 2026/000026',147,'2026-08-19 16:11:52','2026-08-19 16:11:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000026',148,'2026-08-19 16:11:52','2026-08-19 16:11:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000026',149,'2026-08-19 16:11:52','2026-08-19 16:11:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FR 2026/000027',150,'2026-08-20 16:16:44','2026-08-20 16:16:44',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000027',151,'2026-08-20 16:16:44','2026-08-20 16:16:44',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000027',152,'2026-08-20 16:16:44','2026-08-20 16:16:44',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FR 2026/000028',153,'2026-08-20 16:21:15','2026-08-20 16:21:15',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000028',154,'2026-08-20 16:21:15','2026-08-20 16:21:15',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,1.000,'Venda FR 2026/000028',155,'2026-08-20 16:21:15','2026-08-20 16:21:15',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FR 2026/000029',156,'2026-08-21 09:16:09','2026-08-21 09:16:09',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',16,1.000,'Venda FR 2026/000029',157,'2026-08-21 09:16:09','2026-08-21 09:16:09',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000029',158,'2026-08-21 09:16:09','2026-08-21 09:16:09',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',38,1.000,'Venda FR 2026/000029',159,'2026-08-21 09:16:09','2026-08-21 09:16:09',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FR 2026/000030',160,'2026-08-21 09:16:54','2026-08-21 09:16:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',16,1.000,'Venda FR 2026/000030',161,'2026-08-21 09:16:54','2026-08-21 09:16:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000030',162,'2026-08-21 09:16:54','2026-08-21 09:16:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',38,1.000,'Venda FR 2026/000030',163,'2026-08-21 09:16:54','2026-08-21 09:16:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000031',164,'2026-09-23 10:35:22','2026-09-23 10:35:22',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000031',165,'2026-09-23 10:35:22','2026-09-23 10:35:22',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,1.000,'Venda FT 2026/000009',166,'2026-09-23 15:07:40','2026-09-23 15:07:40',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FT 2026/000009',167,'2026-09-23 15:07:40','2026-09-23 15:07:40',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,2.000,'Venda FT 2026/000010',168,'2026-09-23 15:10:50','2026-09-23 15:10:50',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000032',169,'2026-09-23 15:22:42','2026-09-23 15:22:42',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000032',170,'2026-09-23 15:22:42','2026-09-23 15:22:42',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,1.000,'Venda FR 2026/000033',171,'2026-09-23 15:22:52','2026-09-23 15:22:52',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000034',172,'2026-09-23 16:01:42','2026-09-23 16:01:42',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000035',173,'2026-09-23 16:30:40','2026-09-23 16:30:40',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000035',174,'2026-09-23 16:30:40','2026-09-23 16:30:40',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000036',175,'2026-09-23 16:30:51','2026-09-23 16:30:51',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',29,1.000,'Venda FR 2026/000036',176,'2026-09-23 16:30:51','2026-09-23 16:30:51',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',44,1.000,'Venda FR 2026/000036',177,'2026-09-23 16:30:51','2026-09-23 16:30:51',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000037',178,'2026-09-23 16:31:03','2026-09-23 16:31:03',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000037',179,'2026-09-23 16:31:03','2026-09-23 16:31:03',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,1.000,'Venda FR 2026/000037',180,'2026-09-23 16:31:03','2026-09-23 16:31:03',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',29,1.000,'Venda FR 2026/000037',181,'2026-09-23 16:31:04','2026-09-23 16:31:04',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,2.000,'Venda FR 2026/000038',182,'2026-09-23 16:31:11','2026-09-23 16:31:11',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FR 2026/000039',183,'2026-09-23 17:09:47','2026-09-23 17:09:47',6,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FR 2026/000040',184,'2026-09-24 10:00:38','2026-09-24 10:00:38',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,1.000,'Venda FR 2026/000040',185,'2026-09-24 10:00:38','2026-09-24 10:00:38',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000041',186,'2026-09-24 13:49:49','2026-09-24 13:49:49',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FR 2026/000041',187,'2026-09-24 13:49:49','2026-09-24 13:49:49',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',26,1.000,'Venda FR 2026/000041',188,'2026-09-24 13:49:49','2026-09-24 13:49:49',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FR 2026/000042',189,'2026-09-25 07:59:08','2026-09-25 07:59:08',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,1.000,'Venda FR 2026/000042',190,'2026-09-25 07:59:08','2026-09-25 07:59:08',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',19,1.000,'Venda FR 2026/000043',191,'2026-09-25 08:51:42','2026-09-25 08:51:42',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,1.000,'Venda FR 2026/000043',192,'2026-09-25 08:51:42','2026-09-25 08:51:42',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',25,1.000,'Venda FT 2026/000011',193,'2026-09-25 08:53:31','2026-09-25 08:53:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FT 2026/000011',194,'2026-09-25 08:53:31','2026-09-25 08:53:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',24,1.000,'Venda FT 2026/000011',195,'2026-09-25 08:53:31','2026-09-25 08:53:31',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000044',196,'2026-09-25 09:00:32','2026-09-25 09:00:32',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000044',197,'2026-09-25 09:00:32','2026-09-25 09:00:32',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000045',198,'2026-09-25 10:47:54','2026-09-25 10:47:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',5,1.000,'Venda FR 2026/000045',199,'2026-09-25 10:47:54','2026-09-25 10:47:54',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',30,2.000,'Venda FR 2026/000046',200,'2026-09-25 11:10:39','2026-09-25 11:10:39',6,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',29,1.000,'Venda FR 2026/000046',201,'2026-09-25 11:10:39','2026-09-25 11:10:39',6,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',25,1.000,'Venda FR 2026/000047',202,'2026-09-25 11:16:05','2026-09-25 11:16:05',6,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',29,1.000,'Venda FR 2026/000048',203,'2026-09-25 11:19:21','2026-09-25 11:19:21',25,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',17,1.000,'Venda FR 2026/000048',204,'2026-09-25 11:19:21','2026-09-25 11:19:21',25,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',38,1.000,'Venda FR 2026/000049',205,'2026-09-25 11:22:02','2026-09-25 11:22:02',25,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',31,1.000,'Venda FR 2026/000049',206,'2026-09-25 11:22:02','2026-09-25 11:22:02',25,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',28,6.000,'Venda FT 2026/000012',207,'2026-09-25 13:53:43','2026-09-25 13:53:43',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,6.000,'Venda FT 2026/000012',208,'2026-09-25 13:53:43','2026-09-25 13:53:43',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,1.000,'Venda FR 2026/000050',209,'2026-09-25 13:57:15','2026-09-25 13:57:15',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',4,1.000,'Venda FR 2026/000051',210,'2026-09-25 15:05:14','2026-09-25 15:05:14',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',25,1.000,'Venda FR 2026/000051',211,'2026-09-25 15:05:14','2026-09-25 15:05:14',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',38,4.000,'Venda FR 2026/000052',212,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,0.000,0.000,NULL),('SAIDA','VENDA','PRODUTO',27,6.000,'Venda FR 2026/000052',213,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,0.000,0.000,NULL),('PERDA','AJUSTE','PRODUTO',2,1.000,'Inventário INV-2026-00001: PERDA',214,'2026-09-25 15:53:13','2026-09-25 15:53:13',NULL,NULL,1,NULL,10.000,9.000,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentos_caixa`
--

LOCK TABLES `movimentos_caixa` WRITE;
/*!40000 ALTER TABLE `movimentos_caixa` DISABLE KEYS */;
INSERT INTO `movimentos_caixa` VALUES (132,34,'ABERTURA',100.00,'Abertura de Caixa','2026-09-25 15:16:58',1,NULL,NULL,'Dinheiro'),(133,34,'RECEBIMENTO',3505.00,'Recebimento de Pedido PED-2618-B9C0C5 via Dinheiro','2026-09-25 15:18:19',1,NULL,NULL,'Dinheiro');
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
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentos_stock`
--

LOCK TABLES `movimentos_stock` WRITE;
/*!40000 ALTER TABLE `movimentos_stock` DISABLE KEYS */;
INSERT INTO `movimentos_stock` VALUES (48,'ENTRADA',150.000,0.000,150.000,NULL,'FAT7871127889/283273',NULL,NULL,1,'Compra por necessidade ',121,'2026-08-14 15:20:38','2026-08-14 15:20:38',1,NULL,1,NULL),(48,'SAIDA',130.000,150.000,20.000,'Quebra/Dano',NULL,NULL,NULL,1,'yiftsrardoioiujo',122,'2026-09-24 13:58:58','2026-09-24 13:58:58',1,NULL,1,NULL),(48,'SAIDA',20.000,20.000,0.000,'Validade Expirada',NULL,NULL,NULL,1,'uhuuhu',123,'2026-09-24 13:59:50','2026-09-24 13:59:50',1,NULL,1,NULL),(2,'INVENTARIO',1.000,10.000,9.000,'Inventário INV-2026-00001: PERDA',NULL,NULL,'INV-2026-00001',1,'não se viu',124,'2026-09-25 15:53:13','2026-09-25 15:53:13',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `movimentos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao_leituras`
--

DROP TABLE IF EXISTS `notificacao_leituras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacao_leituras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notificacao_id` int NOT NULL,
  `user_id` int NOT NULL,
  `lido_em` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notificacao_user_leitura` (`notificacao_id`,`user_id`),
  KEY `ix_notificacao_leituras_user_id` (`user_id`),
  KEY `ix_notificacao_leituras_notificacao_id` (`notificacao_id`),
  CONSTRAINT `fk_notificacao_leituras_notificacao_id_notificacoes` FOREIGN KEY (`notificacao_id`) REFERENCES `notificacoes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notificacao_leituras_user_id_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao_leituras`
--

LOCK TABLES `notificacao_leituras` WRITE;
/*!40000 ALTER TABLE `notificacao_leituras` DISABLE KEYS */;
INSERT INTO `notificacao_leituras` VALUES (1,39,16,'2026-09-25 16:23:09','192.168.100.91','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),(2,39,1,'2026-09-25 16:31:01','192.168.100.141','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),(3,38,1,'2026-09-25 17:12:14','197.159.166.222','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),(4,36,1,'2026-09-25 17:13:35','192.168.100.141','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),(5,37,1,'2026-09-25 17:13:56','192.168.100.141','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),(6,34,1,'2026-09-25 17:14:05','192.168.100.141','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0');
/*!40000 ALTER TABLE `notificacao_leituras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacoes`
--

DROP TABLE IF EXISTS `notificacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacoes` (
  `titulo` varchar(150) NOT NULL,
  `mensagem` text NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `canal` varchar(30) NOT NULL,
  `prioridade` varchar(20) NOT NULL,
  `persistente` tinyint(1) NOT NULL,
  `ativa` tinyint(1) NOT NULL,
  `desativada_em` datetime DEFAULT NULL,
  `desativada_por` int DEFAULT NULL,
  `expira_em` datetime DEFAULT NULL,
  `target_type` varchar(20) NOT NULL,
  `target_role` varchar(50) DEFAULT NULL,
  `target_sector` varchar(50) DEFAULT NULL,
  `target_user_id` int DEFAULT NULL,
  `metadados` json DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `event_id` varchar(64) DEFAULT NULL,
  `event_type` varchar(64) DEFAULT NULL,
  `entity_type` varchar(64) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `aggregate_id` varchar(128) DEFAULT NULL,
  `actor_user_id` int DEFAULT NULL,
  `recipient_user_id` int DEFAULT NULL,
  `recipient_role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notificacoes_desativada_por_users` (`desativada_por`),
  KEY `ix_notificacoes_persistente` (`persistente`),
  KEY `ix_notificacoes_target_user_id` (`target_user_id`),
  KEY `ix_notificacoes_ativa` (`ativa`),
  KEY `ix_notificacoes_target_type` (`target_type`),
  KEY `ix_notificacoes_target_role` (`target_role`),
  KEY `ix_notificacoes_target_sector` (`target_sector`),
  CONSTRAINT `fk_notificacoes_desativada_por_users` FOREIGN KEY (`desativada_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notificacoes_target_user_id_users` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacoes`
--

LOCK TABLES `notificacoes` WRITE;
/*!40000 ALTER TABLE `notificacoes` DISABLE KEYS */;
INSERT INTO `notificacoes` VALUES ('Nova Produção: Pedido #PED-2618-B9C0C5','Ordens de produção geradas para os sectores: Cozinha.\n• Pedido: #PED-2618-B9C0C5\n• Cliente: Consumidor Final\n• Artigos a Confecionar: Produto E2E (4x), Feijoada da Terra Recheada (6x)','info','SISTEMA','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"numero\": \"PED-2618-B9C0C5\", \"origem\": \"nova_ordem_producao\", \"titulo\": \"Nova Produção: Pedido #PED-2618-B9C0C5\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_8b8a0e0d6a6c400a87bd376d0b672fdf\", \"mensagem\": \"Ordens de produção geradas para os sectores: Cozinha.\\n• Pedido: #PED-2618-B9C0C5\\n• Cliente: Consumidor Final\\n• Artigos a Confecionar: Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"sectores\": [\"Cozinha\"], \"pedido_id\": 109, \"event_type\": \"PRODUCTION_ORDER_CREATED\", \"actor_user_id\": \"1\"}',28,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,'evt_8b8a0e0d6a6c400a87bd376d0b672fdf','PRODUCTION_ORDER_CREATED','ORDEM_PRODUCAO',109,'PEDIDO:109',1,NULL,NULL),('Novo Pedido #PED-2618-B9C0C5','Pedido #PED-2618-B9C0C5 registado com sucesso.\n• Cliente: Consumidor Final\n• Produtos: Produto E2E (4x), Feijoada da Terra Recheada (6x)\n• Total: 3505.00 €','info','PEDIDO','media',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 3505.0, \"numero\": \"PED-2618-B9C0C5\", \"origem\": \"novo_pedido\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_b6b81cff2cfb434085af219fc31b7e38\", \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"pedido_id\": 109, \"event_type\": \"ORDER_CREATED\", \"actor_user_id\": \"1\"}',29,'2026-09-25 15:18:19','2026-09-25 15:18:19',1,NULL,1,NULL,'evt_b6b81cff2cfb434085af219fc31b7e38','ORDER_CREATED','PEDIDO',109,'PEDIDO:109',1,NULL,NULL),('Produção (Cozinha) #OP-COZ-202609-F3C7E3: Concluída','A ordem de produção #OP-COZ-202609-F3C7E3 (Cozinha) passou para \'Pronto\'.\n• Pedido: #PED-2618-B9C0C5\n• Cliente: Consumidor Final\n• Artigos: Produto E2E (4x), Feijoada da Terra Recheada (6x)\n• Transição: Em Producao ➔ Pronto','success','SISTEMA','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"origem\": \"ordem_producao_atualizada\", \"sector\": \"Cozinha\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_f17ec0a75d54414295128bc7c19587a6\", \"ordem_id\": 155, \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"event_type\": \"PRODUCTION_ORDER_COMPLETED\", \"novo_estado\": \"Pronto\", \"ordem_numero\": \"OP-COZ-202609-F3C7E3\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Em Producao\", \"pedido_numero\": \"PED-2618-B9C0C5\"}',30,'2026-09-25 15:21:11','2026-09-25 15:21:11',7,NULL,1,NULL,'evt_f17ec0a75d54414295128bc7c19587a6','PRODUCTION_ORDER_COMPLETED','ORDEM_PRODUCAO',155,'ORDEM:155',7,NULL,NULL),('Pedido #PED-2618-B9C0C5: Pronto para Levantamento','O estado do Pedido #PED-2618-B9C0C5 foi alterado para \'Pronto\'.\n• Cliente: Consumidor Final\n• Produtos: Produto E2E (4x), Feijoada da Terra Recheada (6x)\n• Transição: Em Producao ➔ Pronto','success','PEDIDO','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 3505.0, \"numero\": \"PED-2618-B9C0C5\", \"origem\": \"pedido_atualizado\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_ab9b6db1e6e545429d4fbb772b8ccb59\", \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"pedido_id\": 109, \"event_type\": \"ORDER_READY\", \"novo_estado\": \"Pronto\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Em Producao\"}',31,'2026-09-25 15:21:11','2026-09-25 15:21:11',7,NULL,1,NULL,'evt_ab9b6db1e6e545429d4fbb772b8ccb59','ORDER_READY','PEDIDO',109,'PEDIDO:109',7,NULL,NULL),('Pedido #PED-2618-B9C0C5: Entregue','O estado do Pedido #PED-2618-B9C0C5 foi alterado para \'Entregue\'.\n• Cliente: Consumidor Final\n• Produtos: Produto E2E (4x), Feijoada da Terra Recheada (6x)\n• Transição: Pronto ➔ Entregue','success','PEDIDO','media',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 3505.0, \"numero\": \"PED-2618-B9C0C5\", \"origem\": \"pedido_atualizado\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_6e231a9f013646afb72f36b57c7fb5d2\", \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"pedido_id\": 109, \"event_type\": \"ORDER_UPDATED\", \"novo_estado\": \"Entregue\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Pronto\"}',32,'2026-09-25 15:21:40','2026-09-25 15:21:40',7,NULL,1,NULL,'evt_6e231a9f013646afb72f36b57c7fb5d2','ORDER_UPDATED','PEDIDO',109,'PEDIDO:109',7,NULL,NULL),('Pedido #PED-2618-B9C0C5: Entregue','O estado do Pedido #PED-2618-B9C0C5 foi alterado para \'Concluido\'.\n• Cliente: Consumidor Final\n• Produtos: Produto E2E (4x), Feijoada da Terra Recheada (6x)\n• Transição: Entregue ➔ Concluido','success','PEDIDO','media',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 3505.0, \"numero\": \"PED-2618-B9C0C5\", \"origem\": \"pedido_atualizado\", \"cliente\": \"Consumidor Final\", \"event_id\": \"evt_5fd89869c1c246e38af6f352a72f9e2a\", \"produtos\": \"Produto E2E (4x), Feijoada da Terra Recheada (6x)\", \"pedido_id\": 109, \"event_type\": \"ORDER_UPDATED\", \"novo_estado\": \"Concluido\", \"actor_user_id\": \"1\", \"antigo_estado\": \"Entregue\"}',33,'2026-09-25 15:23:19','2026-09-25 15:23:19',1,NULL,1,NULL,'evt_5fd89869c1c246e38af6f352a72f9e2a','ORDER_UPDATED','PEDIDO',109,'PEDIDO:109',1,NULL,NULL),('Nova Produção: Pedido #PED-2624-D9C7B7','Ordens de produção geradas para os sectores: Cozinha.\n• Pedido: #PED-2624-D9C7B7\n• Cliente: Josias Vaz Pereira Barreto\n• Artigos a Confecionar: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)','info','SISTEMA','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"numero\": \"PED-2624-D9C7B7\", \"origem\": \"nova_ordem_producao\", \"titulo\": \"Nova Produção: Pedido #PED-2624-D9C7B7\", \"cliente\": \"Josias Vaz Pereira Barreto\", \"event_id\": \"evt_97fc8d297b56480aa086f0a9b3a633e4\", \"mensagem\": \"Ordens de produção geradas para os sectores: Cozinha.\\n• Pedido: #PED-2624-D9C7B7\\n• Cliente: Josias Vaz Pereira Barreto\\n• Artigos a Confecionar: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"produtos\": \"Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"sectores\": [\"Cozinha\"], \"pedido_id\": 110, \"event_type\": \"PRODUCTION_ORDER_CREATED\", \"actor_user_id\": \"1\"}',34,'2026-09-25 15:24:41','2026-09-25 15:24:41',1,NULL,1,NULL,'evt_97fc8d297b56480aa086f0a9b3a633e4','PRODUCTION_ORDER_CREATED','ORDEM_PRODUCAO',110,'PEDIDO:110',1,NULL,NULL),('Novo Pedido #PED-2624-D9C7B7','Pedido #PED-2624-D9C7B7 registado com sucesso.\n• Cliente: Josias Vaz Pereira Barreto\n• Produtos: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\n• Total: 816.50 €','info','PEDIDO','media',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 816.5, \"numero\": \"PED-2624-D9C7B7\", \"origem\": \"novo_pedido\", \"cliente\": \"Josias Vaz Pereira Barreto\", \"event_id\": \"evt_4265d9e8941f4b8aa0a214bd5d642988\", \"produtos\": \"Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"pedido_id\": 110, \"event_type\": \"ORDER_CREATED\", \"actor_user_id\": \"1\"}',35,'2026-09-25 15:24:41','2026-09-25 15:24:41',1,NULL,1,NULL,'evt_4265d9e8941f4b8aa0a214bd5d642988','ORDER_CREATED','PEDIDO',110,'PEDIDO:110',1,NULL,NULL),('Produção (Cozinha) #OP-COZ-202609-D28FB2: Concluída','A ordem de produção #OP-COZ-202609-D28FB2 (Cozinha) passou para \'Pronto\'.\n• Pedido: #PED-2624-D9C7B7\n• Cliente: Josias Vaz Pereira Barreto\n• Artigos: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\n• Transição: Em Producao ➔ Pronto','success','SISTEMA','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"origem\": \"ordem_producao_atualizada\", \"sector\": \"Cozinha\", \"cliente\": \"Josias Vaz Pereira Barreto\", \"event_id\": \"evt_82f5f97fdd5d4e1ea8d7b21bd846be2c\", \"ordem_id\": 156, \"produtos\": \"Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"event_type\": \"PRODUCTION_ORDER_COMPLETED\", \"novo_estado\": \"Pronto\", \"ordem_numero\": \"OP-COZ-202609-D28FB2\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Em Producao\", \"pedido_numero\": \"PED-2624-D9C7B7\"}',36,'2026-09-25 15:25:03','2026-09-25 15:25:03',7,NULL,1,NULL,'evt_82f5f97fdd5d4e1ea8d7b21bd846be2c','PRODUCTION_ORDER_COMPLETED','ORDEM_PRODUCAO',156,'ORDEM:156',7,NULL,NULL),('Pedido #PED-2624-D9C7B7: Pronto para Levantamento','O estado do Pedido #PED-2624-D9C7B7 foi alterado para \'Pronto\'.\n• Cliente: Josias Vaz Pereira Barreto\n• Produtos: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\n• Transição: Em Producao ➔ Pronto','success','PEDIDO','alta',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 816.5, \"numero\": \"PED-2624-D9C7B7\", \"origem\": \"pedido_atualizado\", \"cliente\": \"Josias Vaz Pereira Barreto\", \"event_id\": \"evt_d42699c361f44235a78ec2bccd25edb7\", \"produtos\": \"Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"pedido_id\": 110, \"event_type\": \"ORDER_READY\", \"novo_estado\": \"Pronto\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Em Producao\"}',37,'2026-09-25 15:25:03','2026-09-25 15:25:03',7,NULL,1,NULL,'evt_d42699c361f44235a78ec2bccd25edb7','ORDER_READY','PEDIDO',110,'PEDIDO:110',7,NULL,NULL),('Pedido #PED-2624-D9C7B7: Entregue','O estado do Pedido #PED-2624-D9C7B7 foi alterado para \'Entregue\'.\n• Cliente: Josias Vaz Pereira Barreto\n• Produtos: Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\n• Transição: Pronto ➔ Entregue','success','PEDIDO','media',0,1,NULL,NULL,NULL,'GLOBAL',NULL,NULL,NULL,'{\"total\": 816.5, \"numero\": \"PED-2624-D9C7B7\", \"origem\": \"pedido_atualizado\", \"cliente\": \"Josias Vaz Pereira Barreto\", \"event_id\": \"evt_2554735a35ff47709331a50721e36830\", \"produtos\": \"Feijoada de Peixe  (1x), Arroz de Cenoura Frango (1x)\", \"pedido_id\": 110, \"event_type\": \"ORDER_UPDATED\", \"novo_estado\": \"Entregue\", \"actor_user_id\": \"7\", \"antigo_estado\": \"Pronto\"}',38,'2026-09-25 15:25:05','2026-09-25 15:25:05',7,NULL,1,NULL,'evt_2554735a35ff47709331a50721e36830','ORDER_UPDATED','PEDIDO',110,'PEDIDO:110',7,NULL,NULL),('lldlldlda','dasdadas','info','SISTEMA','media',1,1,NULL,NULL,NULL,'GLOBAL',NULL,'',NULL,'{}',39,'2026-09-25 16:15:55','2026-09-25 16:15:55',1,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `notificacoes` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordem_producao_itens`
--

LOCK TABLES `ordem_producao_itens` WRITE;
/*!40000 ALTER TABLE `ordem_producao_itens` DISABLE KEYS */;
INSERT INTO `ordem_producao_itens` VALUES (214,155,38,4.00,NULL),(215,155,27,6.00,NULL),(216,156,28,1.00,NULL),(217,156,25,1.00,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordens_producao`
--

LOCK TABLES `ordens_producao` WRITE;
/*!40000 ALTER TABLE `ordens_producao` DISABLE KEYS */;
INSERT INTO `ordens_producao` VALUES ('OP-COZ-202609-F3C7E3',109,NULL,NULL,'Cozinha',NULL,'2026-09-25','2026-09-25 15:18:19','2026-09-25 15:21:11','Media','Entregue',NULL,155,'2026-09-25 15:18:19','2026-09-25 15:21:40',1,NULL,1,NULL,NULL),('OP-COZ-202609-D28FB2',110,NULL,NULL,'Cozinha',NULL,'2026-09-25','2026-09-25 15:24:41','2026-09-25 15:25:11','Media','Entregue',NULL,156,'2026-09-25 15:24:41','2026-09-25 15:25:13',1,NULL,1,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamentos`
--

LOCK TABLES `pagamentos` WRITE;
/*!40000 ALTER TABLE `pagamentos` DISABLE KEYS */;
INSERT INTO `pagamentos` VALUES (109,NULL,126,3505.00,1,'PAGO','2026-09-25 15:18:19',NULL,'Pagamento do pedido PED-2618-B9C0C5. Checkout no registo do pedido #PED-2618-B9C0C5',NULL,NULL,98,'2026-09-25 15:18:19','2026-09-25 15:18:19',NULL,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES ('PED-2618-B9C0C5',NULL,NULL,'Simples','Balcao','2026-09-25 15:18:19','2026-09-25','22:00:00','Concluido',NULL,NULL,3505.00,3505.00,0.00,'Dinheiro','Pago',109,'2026-09-25 15:18:19','2026-09-25 15:23:19',1,NULL,1,NULL),('PED-2624-D9C7B7',2,NULL,'Composto','Balcao','2026-09-25 15:24:41','2026-09-25','22:00:00','Entregue','Pedido automatico gerado para o Evento EVT-202609-CDF207',NULL,816.50,0.00,816.50,NULL,'Pendente',110,'2026-09-25 15:24:41','2026-09-25 15:25:13',1,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produto_stock_armazem`
--

LOCK TABLES `produto_stock_armazem` WRITE;
/*!40000 ALTER TABLE `produto_stock_armazem` DISABLE KEYS */;
INSERT INTO `produto_stock_armazem` VALUES (2,1,9.000,0.000,1,'2026-07-07 16:53:02','2026-09-25 15:53:13',NULL,NULL,1,NULL),(3,1,400.000,0.000,2,'2026-07-07 16:58:41','2026-08-14 15:04:37',NULL,NULL,1,NULL),(4,1,0.030,0.000,3,'2026-07-07 17:09:42','2026-08-14 15:04:37',NULL,NULL,1,NULL),(5,1,278.000,10.000,4,'2026-07-07 17:18:58','2026-08-14 15:04:37',NULL,NULL,1,NULL),(6,1,103.000,0.000,5,'2026-07-08 07:49:27','2026-08-14 15:04:37',NULL,NULL,1,NULL),(7,1,289.000,0.000,6,'2026-07-08 07:49:48','2026-08-14 15:04:37',NULL,NULL,1,NULL),(8,1,300.000,0.000,7,'2026-07-08 07:50:19','2026-08-14 15:04:37',NULL,NULL,1,NULL),(9,1,300.000,0.000,8,'2026-07-08 07:50:47','2026-08-14 15:04:37',NULL,NULL,1,NULL),(10,1,300.000,0.000,9,'2026-07-08 07:51:18','2026-08-14 15:04:37',NULL,NULL,1,NULL),(11,1,130.000,0.000,10,'2026-07-08 07:51:45','2026-08-14 15:04:37',NULL,NULL,1,NULL),(12,1,0.000,0.000,11,'2026-07-08 07:52:17','2026-07-08 07:52:17',NULL,NULL,1,NULL),(13,1,284.000,0.000,12,'2026-07-08 07:52:56','2026-08-14 15:04:37',NULL,NULL,1,NULL),(14,1,300.000,0.000,13,'2026-07-08 07:53:33','2026-08-14 15:04:37',NULL,NULL,1,NULL),(15,1,90.000,0.000,14,'2026-07-08 10:27:33','2026-07-08 13:39:40',NULL,NULL,1,NULL),(16,1,300.000,0.000,15,'2026-07-08 10:34:54','2026-08-14 15:04:37',NULL,NULL,1,NULL),(17,1,260.000,15.000,16,'2026-07-08 10:36:42','2026-08-14 15:04:37',NULL,NULL,1,NULL),(18,1,125.000,10.000,17,'2026-07-08 10:56:56','2026-08-14 15:04:37',NULL,NULL,1,NULL),(19,1,130.000,10.000,18,'2026-07-08 13:33:18','2026-08-14 15:04:37',NULL,NULL,1,NULL),(24,1,300.000,0.000,19,'2026-07-23 09:21:43','2026-08-14 15:04:37',NULL,NULL,1,NULL),(25,4,0.000,0.000,20,'2026-07-23 09:24:23','2026-07-23 09:24:23',NULL,NULL,1,NULL),(26,4,0.000,0.000,21,'2026-07-23 09:25:58','2026-07-23 09:25:58',NULL,NULL,1,NULL),(27,1,3.000,0.000,22,'2026-07-23 09:29:34','2026-08-14 15:04:37',NULL,NULL,1,NULL),(28,1,3.000,0.000,23,'2026-07-23 09:31:25','2026-08-14 15:04:37',NULL,NULL,1,NULL),(29,4,20.000,10.000,24,'2026-07-23 09:32:45','2026-07-23 09:35:52',NULL,NULL,1,NULL),(30,4,20.000,6.000,25,'2026-07-23 09:33:48','2026-07-23 09:35:47',NULL,NULL,1,NULL),(31,4,20.000,10.000,26,'2026-07-23 09:34:39','2026-07-23 09:35:40',NULL,NULL,1,NULL),(3,4,100.000,0.000,27,'2026-07-31 11:48:19','2026-07-31 11:48:19',NULL,NULL,1,NULL),(32,1,103.000,0.000,28,'2026-08-04 16:55:25','2026-08-14 15:04:37',NULL,NULL,1,NULL),(37,1,103.000,0.000,29,'2026-08-12 11:59:24','2026-08-14 15:04:37',NULL,NULL,1,NULL),(43,1,103.000,10.000,30,'2026-08-13 09:16:55','2026-08-14 15:04:37',NULL,NULL,1,NULL),(44,1,199.000,10.000,31,'2026-08-13 09:18:06','2026-08-14 15:04:37',NULL,NULL,1,NULL),(45,1,300.000,10.000,32,'2026-08-13 10:27:20','2026-08-14 15:04:37',NULL,NULL,1,NULL),(46,1,300.000,10.000,33,'2026-08-13 10:27:54','2026-08-14 15:04:37',NULL,NULL,1,NULL),(47,1,300.000,10.000,34,'2026-08-13 10:28:34','2026-08-14 15:04:37',NULL,NULL,1,NULL),(38,1,300.000,0.000,35,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(31,1,297.000,10.000,36,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(30,1,288.000,6.000,37,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(29,1,273.000,10.000,38,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(26,1,3.000,0.000,39,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(25,1,3.000,0.000,40,'2026-08-14 15:01:40','2026-08-14 15:04:37',NULL,NULL,1,NULL),(48,1,0.000,30.000,41,'2026-08-14 15:19:42','2026-09-24 13:59:50',NULL,NULL,1,NULL),(53,1,0.000,10.000,42,'2026-09-25 11:34:09','2026-09-25 11:34:09',NULL,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (1,'ING000001','Ovos de Galinha','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-07 16:51:42','2026-07-07 16:53:34',1,1,0,'2026-07-07 16:53:34','ABASTECIMENTO'),(2,'ING000002','Ovos de Galinha','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,9.000,0.000,NULL,1,NULL,'2026-07-07 16:53:02','2026-09-25 15:53:13',1,NULL,1,NULL,'ABASTECIMENTO'),(3,'ING000003','ARROZ CATAPLANA','CONSUMIVEL',NULL,1,1,NULL,0.00,35.00,NULL,500.000,0.000,NULL,1,NULL,'2026-07-07 16:58:41','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(4,'PAC000001','Bolo de Chocolate Decorado','ACABADO',NULL,1,4,100,470.00,40.00,'Bolo de Chocolate Decoração com Chocolate Marron ',0.000,0.000,1,1,NULL,'2026-07-07 17:09:42','2026-08-17 10:15:31',1,1,1,NULL,'PASTELARIA'),(5,'REV000001','Sumol de Manga ','REVENDA',NULL,3,4,NULL,20.00,18.00,NULL,248.000,10.000,NULL,1,NULL,'2026-07-07 17:18:58','2026-09-25 10:47:54',1,NULL,1,NULL,'BAR'),(6,'ING000004','Açucar Fino','CONSUMIVEL',NULL,1,1,NULL,0.00,25.00,NULL,103.000,0.000,NULL,1,NULL,'2026-07-08 07:49:27','2026-08-14 15:04:37',1,1,1,NULL,'ABASTECIMENTO'),(7,'ING000005','Açucar de Cana','CONSUMIVEL',NULL,1,1,NULL,0.00,22.00,NULL,286.000,10.000,NULL,1,'2029-10-10','2026-07-08 07:49:48','2026-08-14 15:04:37',1,1,1,NULL,'ABASTECIMENTO'),(8,'ING000006','Lata de Milho','CONSUMIVEL',NULL,1,4,NULL,0.00,30.00,NULL,300.000,0.000,NULL,1,NULL,'2026-07-08 07:50:19','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(9,'ING000007','Sal Grosso','CONSUMIVEL',NULL,1,1,NULL,0.00,12.00,NULL,300.000,0.000,NULL,1,NULL,'2026-07-08 07:50:47','2026-08-14 15:04:37',1,1,1,NULL,'ABASTECIMENTO'),(10,'ING000008','Lata de Massa Tomate','CONSUMIVEL',NULL,1,4,NULL,0.00,35.00,NULL,300.000,0.000,NULL,1,NULL,'2026-07-08 07:51:18','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(11,'ING000009','Farinha de Trigo','CONSUMIVEL',NULL,1,1,NULL,0.00,18.00,NULL,120.000,0.000,NULL,1,NULL,'2026-07-08 07:51:45','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(12,'ING000010','Óleo Fringe','CONSUMIVEL',NULL,1,2,NULL,0.00,55.00,NULL,0.000,0.000,NULL,1,NULL,'2026-07-08 07:52:17','2026-07-23 13:08:59',1,1,0,'2026-07-23 13:08:59','ABASTECIMENTO'),(13,'ING000011','Azeite Dose Vegetal','CONSUMIVEL',NULL,1,2,NULL,0.00,1000.00,NULL,276.000,0.000,NULL,1,NULL,'2026-07-08 07:52:56','2026-08-14 15:04:37',1,1,1,NULL,'ABASTECIMENTO'),(14,'ING000012','Manteiga Evita','CONSUMIVEL',NULL,1,4,NULL,0.00,10.00,NULL,300.000,0.000,NULL,1,NULL,'2026-07-08 07:53:33','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(15,'ING000013','Bacalhau Portugês','CONSUMIVEL',NULL,1,1,NULL,0.00,150.00,NULL,90.000,10.000,NULL,1,NULL,'2026-07-08 10:27:33','2026-07-08 14:50:31',1,1,0,'2026-07-08 14:50:31','ABASTECIMENTO'),(16,'PAC000002','Bolo de Laranja','ACABADO',NULL,1,4,120,450.00,89.00,NULL,293.000,0.000,1,1,NULL,'2026-07-08 10:34:54','2026-08-21 09:16:54',1,1,1,NULL,'PASTELARIA'),(17,'REV000002','Sumol de Maracúja ','REVENDA',NULL,3,4,NULL,20.00,18.00,NULL,229.000,15.000,NULL,1,NULL,'2026-07-08 10:36:42','2026-09-25 11:19:21',1,NULL,1,NULL,'BAR'),(18,'ING000014','Esparguete ','CONSUMIVEL',NULL,1,4,NULL,0.00,15.00,'esparguete de portugal',125.000,10.000,NULL,1,'2029-10-10','2026-07-08 10:56:56','2026-08-14 15:04:37',1,1,1,NULL,'ABASTECIMENTO'),(19,'REV000003','Vinho de Porto','REVENDA',NULL,4,2,NULL,240.00,180.00,NULL,102.000,10.000,1,1,'2090-10-10','2026-07-08 13:33:18','2026-09-25 08:51:42',1,1,1,NULL,'BAR'),(24,'PAC000003','Bolo de Banana','ACABADO',NULL,1,4,120,550.00,319.00,NULL,294.000,0.000,1,1,NULL,'2026-07-23 09:21:43','2026-09-25 08:53:31',1,1,1,NULL,'PASTELARIA'),(25,'PAC000004','Arroz de Cenoura Frango','ACABADO',NULL,1,4,350,280.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:24:23','2026-09-25 08:53:31',1,NULL,1,NULL,NULL),(26,'PAC000005','Banana Cozida Molho de Peixe Atum','ACABADO',NULL,1,4,120,300.00,0.00,NULL,1.000,0.000,1,1,NULL,'2026-07-23 09:25:58','2026-09-24 13:49:49',1,NULL,1,NULL,NULL),(27,'PAC000006','Feijoada da Terra Recheada','ACABADO',NULL,1,4,450,450.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:29:34','2026-08-20 16:21:15',1,NULL,1,NULL,NULL),(28,'PAC000007','Feijoada de Peixe ','ACABADO',NULL,1,4,120,430.00,0.00,NULL,0.000,0.000,1,1,NULL,'2026-07-23 09:31:25','2026-08-17 15:36:22',1,1,1,NULL,NULL),(29,'REV000004','Água Mineral Bom Sucesso','REVENDA',NULL,3,4,NULL,20.00,8.00,NULL,273.000,10.000,NULL,1,'2026-07-24','2026-07-23 09:32:45','2026-09-25 11:19:21',1,NULL,1,NULL,'BAR'),(30,'REV000005','Água Mineral Cristal','REVENDA',NULL,3,4,NULL,15.00,12.00,NULL,279.000,6.000,1,1,'2026-07-24','2026-07-23 09:33:48','2026-09-25 11:10:39',1,NULL,1,NULL,'BAR'),(31,'REV000006','Sumo Natural ','REVENDA',NULL,3,4,NULL,50.00,45.00,NULL,284.000,10.000,1,1,'2026-07-25','2026-07-23 09:34:39','2026-09-25 11:22:02',1,NULL,1,NULL,'BAR'),(32,'ING000015','Sal magro','CONSUMIVEL',NULL,1,1,NULL,0.00,23.00,NULL,103.000,0.000,NULL,1,'2030-02-02','2026-08-04 16:55:25','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(37,'ING000016','Laranja ','CONSUMIVEL',NULL,1,1,NULL,0.00,130.00,NULL,103.000,0.000,NULL,1,'2026-08-27','2026-08-12 11:59:24','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(38,NULL,'Produto E2E','ACABADO',NULL,NULL,NULL,NULL,100.00,0.00,NULL,293.000,0.000,NULL,1,NULL,'2026-08-12 13:54:39','2026-09-25 15:18:19',NULL,NULL,1,NULL,NULL),(43,'ING000017','Caldo Mage','CONSUMIVEL',NULL,2,4,NULL,0.00,12.00,NULL,103.000,10.000,NULL,1,'2028-09-09','2026-08-13 09:16:55','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(44,'REV000007','Coca-Cola 1L','REVENDA',NULL,1,4,NULL,17.00,14.00,NULL,152.000,10.000,1,1,'2028-09-03','2026-08-13 09:18:06','2026-09-23 16:30:51',1,NULL,1,NULL,'BAR'),(45,'ING000018','Banana Prata Madura','CONSUMIVEL',NULL,1,4,NULL,0.00,1.00,NULL,300.000,10.000,NULL,1,NULL,'2026-08-13 10:27:20','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(46,'ING000019','ovos de Galinha podeira','CONSUMIVEL',NULL,1,4,NULL,0.00,8.00,NULL,300.000,10.000,NULL,1,'2026-09-05','2026-08-13 10:27:54','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(47,'ING000020','Fermento de Bolo','CONSUMIVEL',NULL,1,1,NULL,0.00,100.00,NULL,300.000,10.000,NULL,1,'2029-09-09','2026-08-13 10:28:34','2026-08-14 15:04:37',1,NULL,1,NULL,'ABASTECIMENTO'),(48,'ING000021','Alho Branco','CONSUMIVEL',NULL,1,4,NULL,0.00,20.00,NULL,0.000,30.000,NULL,1,'2027-01-22','2026-08-14 15:19:42','2026-09-24 13:59:50',1,NULL,1,NULL,'ABASTECIMENTO'),(53,'ING000022','Banana Prata embalado','CONSUMIVEL',NULL,1,1,NULL,0.00,100.00,NULL,0.000,10.000,NULL,1,NULL,'2026-09-25 11:34:09','2026-09-25 11:34:09',1,NULL,1,NULL,'ABASTECIMENTO');
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proforma_itens`
--

DROP TABLE IF EXISTS `proforma_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proforma_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proforma_id` int NOT NULL,
  `item_tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Produto',
  `item_id` int DEFAULT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` decimal(10,2) NOT NULL DEFAULT '1.00',
  `preco_unitario` decimal(12,2) NOT NULL DEFAULT '0.00',
  `desconto` decimal(12,2) NOT NULL DEFAULT '0.00',
  `taxa_iva` decimal(5,2) NOT NULL DEFAULT '0.00',
  `valor_iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proforma_itens`
--

LOCK TABLES `proforma_itens` WRITE;
/*!40000 ALTER TABLE `proforma_itens` DISABLE KEYS */;
INSERT INTO `proforma_itens` VALUES (50,21,'Produto',44,'Coca-Cola 1L',1.00,19.55,0.00,15.00,2.93,19.55,22.48,'2026-08-19 15:30:32','2026-08-19 15:30:32',NULL,NULL,1,NULL),(51,21,'Produto',16,'Bolo de Laranja',1.00,517.50,0.00,15.00,77.63,517.50,595.13,'2026-08-19 15:30:32','2026-08-19 15:30:32',NULL,NULL,1,NULL),(52,21,'Produto',27,'Feijoada da Terra Recheada',1.00,517.50,0.00,15.00,77.63,517.50,595.13,'2026-08-19 15:30:32','2026-08-19 15:30:32',NULL,NULL,1,NULL),(53,21,'Produto',30,'Água Mineral Cristal',1.00,17.25,0.00,15.00,2.59,17.25,19.84,'2026-08-19 15:30:32','2026-08-19 15:30:32',NULL,NULL,1,NULL),(54,21,'Produto',26,'Banana Cozida Molho de Peixe Atum',1.00,345.00,0.00,15.00,51.75,345.00,396.75,'2026-08-19 15:30:32','2026-08-19 15:30:32',NULL,NULL,1,NULL),(55,22,'Produto',24,'Bolo de Banana',1.00,632.50,0.00,15.00,94.88,632.50,727.38,'2026-08-20 16:13:32','2026-08-20 16:13:32',NULL,NULL,1,NULL),(56,22,'Produto',28,'Feijoada de Peixe ',1.00,494.50,0.00,15.00,74.18,494.50,568.68,'2026-08-20 16:13:32','2026-08-20 16:13:32',NULL,NULL,1,NULL),(57,22,'Produto',5,'Sumol de Manga ',1.00,20.00,0.00,15.00,3.00,20.00,23.00,'2026-08-20 16:13:32','2026-08-20 16:13:32',NULL,NULL,1,NULL),(58,23,'Produto',5,'Sumol de Manga ',1.00,20.00,0.00,15.00,3.00,20.00,23.00,'2026-09-23 12:04:08','2026-09-23 12:04:08',NULL,NULL,1,NULL),(59,23,'Produto',17,'Sumol de Maracúja ',1.00,20.00,0.00,15.00,3.00,20.00,23.00,'2026-09-23 12:04:08','2026-09-23 12:04:08',NULL,NULL,1,NULL),(60,23,'Produto',31,'Sumo Natural ',1.00,57.50,0.00,15.00,8.63,57.50,66.13,'2026-09-23 12:04:08','2026-09-23 12:04:08',NULL,NULL,1,NULL),(61,24,'Produto',17,'Sumol de Maracúja ',1.00,20.00,0.00,15.00,3.00,20.00,23.00,'2026-09-23 15:06:29','2026-09-23 15:06:29',NULL,NULL,1,NULL),(62,24,'Produto',5,'Sumol de Manga ',1.00,20.00,0.00,15.00,3.00,20.00,23.00,'2026-09-23 15:06:29','2026-09-23 15:06:29',NULL,NULL,1,NULL),(63,25,'Servico',9,'dddddddddddddd',1.00,2100.00,0.00,0.00,0.00,2100.00,2100.00,'2026-09-25 11:26:32','2026-09-25 11:26:32',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `proforma_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proformas`
--

DROP TABLE IF EXISTS `proformas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proformas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_documento` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `origem` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POS',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `desconto_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Emitida',
  `observacoes` text COLLATE utf8mb4_unicode_ci,
  `criado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_documento` (`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proformas`
--

LOCK TABLES `proformas` WRITE;
/*!40000 ALTER TABLE `proformas` DISABLE KEYS */;
INSERT INTO `proformas` VALUES (21,'PROFORMA 2026/000026',NULL,NULL,'Balcao',1416.80,0.00,212.52,1629.32,'Faturada','Orçamento Fatura Pró-Forma',1,'2026-08-19 15:30:32','2026-08-19 15:33:39',NULL,NULL,1,NULL),(22,'PROFORMA 2026/000027',NULL,NULL,'EVENTO',1147.00,0.00,172.05,1319.05,'Emitida','Pró-Forma do Evento: Casamento Hendd',1,'2026-08-20 16:13:32','2026-08-20 16:13:32',NULL,NULL,1,NULL),(23,'PROFORMA 2026/000028',NULL,NULL,'POS',97.50,0.00,14.63,112.13,'Emitida','Orçamento emitido no Caixa POS',1,'2026-09-23 12:04:08','2026-09-23 12:04:08',NULL,NULL,1,NULL),(24,'PROFORMA 2026/000029',NULL,NULL,'POS',40.00,0.00,6.00,46.00,'Emitida','Orçamento emitido no Caixa POS',1,'2026-09-23 15:06:29','2026-09-23 15:06:29',NULL,NULL,1,NULL),(25,'PROFORMA 2026/000030',2,NULL,'Eventos',2100.00,0.00,0.00,2100.00,'Emitida','Orçamento Evento EVT-202608-00C1FF',25,'2026-09-25 11:26:32','2026-09-25 11:26:32',NULL,NULL,1,NULL);
/*!40000 ALTER TABLE `proformas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quarentena_itens`
--

DROP TABLE IF EXISTS `quarentena_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quarentena_itens` (
  `produto_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `armazem_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `motivo` varchar(120) NOT NULL,
  `lote` varchar(100) DEFAULT NULL,
  `validade` date DEFAULT NULL,
  `observacao` text,
  `responsavel_id` int DEFAULT NULL,
  `estado` enum('QUARENTENA','DESCARTADO','REINTEGRADO') NOT NULL,
  `resolvido_em` datetime DEFAULT NULL,
  `justificativa_resolucao` text,
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_quarentena_itens_produto_id_produtos` (`produto_id`),
  KEY `fk_quarentena_itens_material_id_materiais` (`material_id`),
  KEY `fk_quarentena_itens_armazem_id_armazens` (`armazem_id`),
  KEY `fk_quarentena_itens_responsavel_id_users` (`responsavel_id`),
  CONSTRAINT `fk_quarentena_itens_armazem_id_armazens` FOREIGN KEY (`armazem_id`) REFERENCES `armazens` (`id`),
  CONSTRAINT `fk_quarentena_itens_material_id_materiais` FOREIGN KEY (`material_id`) REFERENCES `materiais` (`id`),
  CONSTRAINT `fk_quarentena_itens_produto_id_produtos` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  CONSTRAINT `fk_quarentena_itens_responsavel_id_users` FOREIGN KEY (`responsavel_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quarentena_itens`
--

LOCK TABLES `quarentena_itens` WRITE;
/*!40000 ALTER TABLE `quarentena_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `quarentena_itens` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisicoes`
--

LOCK TABLES `requisicoes` WRITE;
/*!40000 ALTER TABLE `requisicoes` DISABLE KEYS */;
INSERT INTO `requisicoes` VALUES ('REQ-20260819-E2C772','Inicial','Pastelaria',2,1,'2026-08-19 15:26:43','Pendente','Gerada automaticamente pelas ordens de produção do turno.',15,'2026-08-19 15:26:43','2026-08-19 15:26:43',NULL,NULL,1,NULL,NULL,NULL),('REQ-20260820-8A7EEB','Inicial','Pastelaria',2,1,'2026-08-20 16:13:53','Pendente','Gerada automaticamente pelas ordens de produção do turno.',16,'2026-08-20 16:13:53','2026-08-20 16:13:53',NULL,NULL,1,NULL,NULL,NULL),('REQ-20260821-A8DA27','Inicial','Pastelaria',1,1,'2026-08-21 09:16:09','Pendente','Gerada automaticamente pelas ordens de produção do turno.',17,'2026-08-21 09:16:09','2026-08-21 09:16:09',NULL,NULL,1,NULL,NULL,NULL),('REQ-20260924-F18652','Inicial','Pastelaria',1,1,'2026-09-24 11:37:26','Pendente','Gerada automaticamente pelas ordens de produção do turno.',18,'2026-09-24 11:37:26','2026-09-24 11:37:26',NULL,NULL,1,NULL,NULL,NULL),('REQ-20260925-26EC4F','Inicial','Pastelaria',1,1,'2026-09-25 08:00:56','Pendente','Gerada automaticamente pelas ordens de produção do turno.',19,'2026-09-25 08:00:56','2026-09-25 08:00:56',NULL,NULL,1,NULL,NULL,NULL),('REQ-20260925-261B0E','Inicial','Pastelaria',2,1,'2026-09-25 14:45:33','Pendente','Gerada automaticamente pelas ordens de produção do turno.',20,'2026-09-25 14:45:33','2026-09-25 14:45:33',NULL,NULL,1,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisicoes_itens`
--

LOCK TABLES `requisicoes_itens` WRITE;
/*!40000 ALTER TABLE `requisicoes_itens` DISABLE KEYS */;
INSERT INTO `requisicoes_itens` VALUES (44,15,'Consumivel',11,3.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(45,15,'Consumivel',14,2.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(46,15,'Consumivel',2,8.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(47,15,'Consumivel',37,2.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(48,16,'Consumivel',11,7.500,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(49,16,'Consumivel',14,5.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(50,16,'Consumivel',2,20.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(51,16,'Consumivel',37,5.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(52,17,'Consumivel',11,3.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(53,17,'Consumivel',14,2.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(54,17,'Consumivel',2,8.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(55,17,'Consumivel',37,1.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(56,17,'Consumivel',45,20.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(57,18,'Consumivel',45,20.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(58,18,'Consumivel',11,1.500,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(59,18,'Consumivel',14,1.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(60,18,'Consumivel',2,4.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(61,19,'Consumivel',45,20.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(62,19,'Consumivel',11,4.500,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(63,19,'Consumivel',14,3.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(64,19,'Consumivel',2,12.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(65,19,'Consumivel',37,2.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(66,20,'Consumivel',11,1.500,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(67,20,'Consumivel',14,1.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(68,20,'Consumivel',2,4.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.'),(69,20,'Consumivel',37,1.000,0.000,0.000,0.000,0.000,0.000,'Calculado a partir das receitas dos produtos acabados.');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `series_documento`
--

LOCK TABLES `series_documento` WRITE;
/*!40000 ALTER TABLE `series_documento` DISABLE KEYS */;
INSERT INTO `series_documento` VALUES ('FR',2026,52,7,'2026-07-23 16:38:01','2026-09-25 15:18:19',NULL,NULL,1,NULL),('PROFORMA',2026,30,8,'2026-08-14 12:24:27','2026-09-25 11:26:32',NULL,NULL,1,NULL),('FT',2026,12,9,'2026-08-17 10:15:31','2026-09-25 13:53:43',NULL,NULL,1,NULL);
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
INSERT INTO `turnos` VALUES ('Manhã','06:00:00','14:00:00',1,1,'2026-07-07 16:23:22','2026-09-23 11:02:46',NULL,NULL,1,NULL),('Tarde','14:00:00','22:00:00',1,2,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL),('Noite','22:00:00','06:00:00',1,3,'2026-07-07 16:23:22','2026-07-07 16:23:22',NULL,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('Josias Barreto','josiasbarreto11@gmail.com','scrypt:32768:8:1$3smIVfUyNmBNuDIy$6a997e73661475595cd52b5d8db2c9a7be2be870184c773bcfdecad7958a0f4b55137d9ef2b3b9c3d031e2e764c88befa3caf723dd8ef85af3a37624f2bf5652','ADMINISTRADOR',1,'2026-07-07 16:24:53','2026-08-14 10:21:02',NULL,NULL,1,NULL),('Admin Atendimento','atendimento@test.com','scrypt:32768:8:1$oBquuxWbsKpbfn6B$0d3657d2da89207c8f796ed79a100511991625652bdf6797f319fb3d8e2aa67848d18fb6bf2f625f3b82ad5366612fd695a43877a6e50f2da78dd72d365cf337','ARMAZEM',2,'2026-07-10 15:28:42','2026-07-10 15:28:42',NULL,NULL,1,NULL),('Maura Barreto','tl80207@gmail.com','scrypt:32768:8:1$oBquuxWbsKpbfn6B$0d3657d2da89207c8f796ed79a100511991625652bdf6797f319fb3d8e2aa67848d18fb6bf2f625f3b82ad5366612fd695a43877a6e50f2da78dd72d365cf337','ATENDIMENTO',6,'2026-07-20 16:48:38','2026-09-23 08:32:06',1,1,1,NULL),('Garçon boss','equipatecnicacfp@gmail.com','scrypt:32768:8:1$3smIVfUyNmBNuDIy$6a997e73661475595cd52b5d8db2c9a7be2be870184c773bcfdecad7958a0f4b55137d9ef2b3b9c3d031e2e764c88befa3caf723dd8ef85af3a37624f2bf5652','COZINHA',7,'2026-08-04 11:04:24','2026-09-24 09:56:41',1,1,1,NULL),('Admin Armazem','armazem@test.com','scrypt:32768:8:1$3smIVfUyNmBNuDIy$6a997e73661475595cd52b5d8db2c9a7be2be870184c773bcfdecad7958a0f4b55137d9ef2b3b9c3d031e2e764c88befa3caf723dd8ef85af3a37624f2bf5652','ADMINISTRADOR',12,'2026-08-12 13:54:35','2026-08-12 13:54:35',NULL,NULL,1,NULL),('Test Admin','admin@test.com','scrypt:32768:8:1$3smIVfUyNmBNuDIy$6a997e73661475595cd52b5d8db2c9a7be2be870184c773bcfdecad7958a0f4b55137d9ef2b3b9c3d031e2e764c88befa3caf723dd8ef85af3a37624f2bf5652','ADMINISTRADOR',16,'2026-08-12 13:54:38','2026-08-12 13:54:38',NULL,NULL,1,NULL),('Admin Logistica','logistica@test.com','scrypt:32768:8:1$eNEaRfKZsXgCHbis$a21952e4493f3618cd0d59b5671e098b2c255a6ff7dd975c4f06adb415c48363b6519c9c4aea856fc82591db1af0661f2a06978fe2634d6f6b62fed9725662a9','ADMINISTRADOR',19,'2026-08-12 13:54:43','2026-08-12 13:54:43',NULL,NULL,1,NULL),('Admin Relatorios','rel@test.com','scrypt:32768:8:1$3smIVfUyNmBNuDIy$6a997e73661475595cd52b5d8db2c9a7be2be870184c773bcfdecad7958a0f4b55137d9ef2b3b9c3d031e2e764c88befa3caf723dd8ef85af3a37624f2bf5652','ATENDIMENTO',25,'2026-08-12 13:54:49','2026-09-23 08:26:24',NULL,1,1,NULL),('ATENDIMENTO','suporte.cfpstp@gmail.com','scrypt:32768:8:1$TXISqhEfVYELM7O4$0bbf98a8703a5136807424418339139b27fdcb3f98e9aefe1ce596084e1e1862e25c5246945be3f0483bfd92f2285bb5919bdf41f888c3be62e07fff65ec7dfd','ATENDIMENTO',27,'2026-09-23 09:10:49','2026-09-23 09:10:49',1,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=264 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda_itens`
--

LOCK TABLES `venda_itens` WRITE;
/*!40000 ALTER TABLE `venda_itens` DISABLE KEYS */;
INSERT INTO `venda_itens` VALUES (126,'Produto',38,'Produto E2E',4.00,100.00,0.00,NULL,0.00,0.00,400.00,400.00,262,'2026-09-25 15:18:19','2026-09-25 15:18:19',NULL,NULL,1,NULL),(126,'Produto',27,'Feijoada da Terra Recheada',6.00,450.00,0.00,1,15.00,405.00,2700.00,3105.00,263,'2026-09-25 15:18:19','2026-09-25 15:18:19',NULL,NULL,1,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendas`
--

LOCK TABLES `vendas` WRITE;
/*!40000 ALTER TABLE `vendas` DISABLE KEYS */;
INSERT INTO `vendas` VALUES ('FR 2026/000052','FR',NULL,109,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PAGO','Checkout no registo do pedido #PED-2618-B9C0C5',1,126,'2026-09-25 15:18:19','2026-09-25 15:18:19',NULL,NULL,1,NULL,NULL);
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

-- Dump completed on 2026-09-27 11:09:44
