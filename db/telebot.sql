-- MySQL dump for TeleBot (Admin Portal)
-- Database: yx
-- Created: 2025-12-07

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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (28,'customer','customer@gmail.com','$2b$10$p5dtvy8IeySFbA1OCFDvJe8ruboNWiXMrgyA4L3lbclxLLPBNmt16',NULL,'user','2025-02-09 14:29:35'),(29,'boss','boss@happybuy.com','$2b$10$hQXCbdoLu15A4urWY.cAEejS9bUxzXeiYeEkFo3/RnCDmaycHmO6m',NULL,'admin','2025-02-09 14:31:44'),(30,'222','222@gmail.com','$2b$10$dS8rcxk89cZBIiY08l3D9uwTUYR7FoE42708Y83rsOZHgfR76oAXi',NULL,'user','2025-02-09 14:34:31'),(31,'doraemon','doraemon@gmail.com','$2b$10$zVpwibKNJfXjO48T9plYM.T1chbgiP5MPGLAQq2itOgTwwMvH3l6a',NULL,'user','2025-02-09 14:35:51'),(32,'user','user@gmail.com','$2b$10$Wgcbw5IB4gAsed/f3plKkeT5wmrO0oWPoWVxJnzsZr0NLfQJfGFx2',NULL,'user','2025-02-12 02:13:24'),(35,'123','123@gmail.com','$2b$10$aHJPLeK1BWeI2c7qzVzf2etXcobKVprrcWloBh8QoaghGZ0VZ87HS',NULL,'user','2025-02-12 02:17:15'),(36,'admins','admins@gmail.com','$2b$10$VmNul2gDwZUtJGGIcgCIcep8TPRF3BzVr2GGAvmXDXMce8QEj2lGG',NULL,'admin','2025-02-12 02:20:00'),(37,'nobita','nobita@gmail.com','$2b$10$ct6R84lG8FqEBJ6t.lNA..G2L6hw1l2T4WDlEf4BpTFdZmnJW9HD.',NULL,'user','2025-11-02 13:31:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Toys'),(2,'Stationery'),(6,'Clothes');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `quantity` int DEFAULT '1',
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (46,'Men shorts',12.00,'/uploads/1762093413797-5dfc22a94a30281233aee1e6e52ae113.jpg',5342,6),(47,'Star Wars Lego',523.00,'/uploads/1762093443474-lego_star_wars.png',198,1),(48,'Doraemon Car',22.00,'/uploads/1762093465989-doraemon_car.png',2,1),(49,'Pen',1.20,'/uploads/1762093507476-af0cb0c5a3daf9480fba47fd06f35bc4.jpg',75643,2);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `card_details` varchar(255) DEFAULT NULL,
  `card_code` varchar(50) DEFAULT NULL,
  `card_number` varchar(50) DEFAULT NULL,
  `card_cvv` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2024-11-26 13:35:33',NULL,NULL,'',''),(2,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2024-11-26 13:36:26',NULL,NULL,'',''),(3,'idk','idk@gmail.com','idk block 999','99999999','Cash on Delivery','2024-11-26 13:44:31',NULL,NULL,'',''),(4,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','HappyBuy Card','2024-11-26 14:44:34','123456','123','',''),(5,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','HappyBuy Card','2024-11-26 14:53:29','123456','123','',''),(6,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-11-26 15:24:59',NULL,NULL,'1235','123'),(7,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-11-26 15:28:05',NULL,NULL,'1234','123'),(8,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-11-26 15:30:56',NULL,NULL,'12356','123'),(9,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2024-11-26 15:33:56',NULL,NULL,NULL,NULL),(10,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','HappyBuy Card','2024-11-26 15:34:03','123456','123',NULL,NULL),(11,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-11-26 15:34:14',NULL,NULL,'12356','123'),(12,'idk','idk@gmail.com','idk block 999','88888888','Cash on Delivery','2024-11-26 15:36:16',NULL,NULL,NULL,NULL),(13,'idk','idk@gmail.com','idk block 999','88888888','Cash on Delivery','2024-12-04 13:39:13',NULL,NULL,NULL,NULL),(14,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-12-04 13:45:14',NULL,NULL,'345678','987'),(15,'idk','idk@gmail.com','idk block 999','88888888','Cash on Delivery','2024-12-04 14:42:14',NULL,NULL,NULL,NULL),(16,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','HappyBuy Card','2024-12-04 14:42:20','123456','123',NULL,NULL),(17,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-12-04 14:43:18',NULL,NULL,'345678','987'),(18,'idk','idk@gmail.com','republic poly','94389348','HappyBuy Card','2024-12-04 14:44:10','223445','283',NULL,NULL),(19,'richy','richy@gmail.com','richy house','7347348','Cash on Delivery','2024-12-04 14:48:18',NULL,NULL,NULL,NULL),(20,'idk','idk@gmail.com','republic poly','94389348','HappyBuy Card','2024-12-04 14:48:36','223445','283',NULL,NULL),(21,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-12-04 14:49:10',NULL,NULL,'1234567','765'),(22,'richy','richy@gmail.com','richy house','7347348','Cash on Delivery','2024-12-04 16:17:45',NULL,NULL,NULL,NULL),(23,'nayeon','nayeon@gmail.com','republic poly','444444','HappyBuy Card','2024-12-04 16:18:07','123456io','283',NULL,NULL),(24,'jeongyeon yoo','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2024-12-04 16:19:24',NULL,NULL,'1278opo','222'),(25,'richy','richy@gmail.com','richy house','7347348','Cash on Delivery','2025-01-08 01:37:52',NULL,NULL,NULL,NULL),(26,'nayeon','nayeon@gmail.com','republic poly','444444','HappyBuy Card','2025-01-08 01:38:01','123456io','283',NULL,NULL),(27,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2025-01-08 01:38:34',NULL,NULL,'1245y','123'),(28,'nayeon','nayeon@gmail.com','republic poly','444444','HappyBuy Card','2025-01-08 07:12:49','123456io','283',NULL,NULL),(29,'nayeon','nayeon@gmail.com','republic poly','444444','HappyBuy Card','2025-01-08 07:21:08','123456io','283',NULL,NULL),(30,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-01-15 07:03:30',NULL,NULL,NULL,NULL),(31,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2025-01-15 14:55:03',NULL,NULL,'1245y','123'),(32,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Credit Card','2025-01-15 15:12:27',NULL,NULL,'123','122'),(33,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-01-15 15:27:38',NULL,NULL,NULL,NULL),(34,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-01-15 15:32:03',NULL,NULL,NULL,NULL),(35,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','HappyBuy Card','2025-02-07 10:27:12','123456','123',NULL,NULL),(36,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-02-07 12:52:37',NULL,NULL,NULL,NULL),(37,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-02-07 13:06:01',NULL,NULL,NULL,NULL),(38,'tom','tom@yahoo.com','republic poly','95295854','HappyBuy Card','2025-02-07 13:16:43','634123','812',NULL,NULL),(39,'tom','tom@yahoo.com','republic poly','95295854','HappyBuy Card','2025-02-07 14:52:20','634123','812',NULL,NULL),(40,'peck hwee chin','peckhweechin@gmail.com','Choa Chu Kang Block 490D #09-305 avenue 5','89113299','Cash on Delivery','2025-02-07 14:59:14',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `fk_user_id` (`user_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (76,35,46,1);
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `review_text` text NOT NULL,
  `rating` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase`
--

DROP TABLE IF EXISTS `purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `purchase_location` varchar(255) DEFAULT NULL,
  `purchase_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `purchase_ibfk_1` (`product_id`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase`
--

LOCK TABLES `purchase` WRITE;
/*!40000 ALTER TABLE `purchase` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_products`
--

DROP TABLE IF EXISTS `admin_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_products`
--

LOCK TABLES `admin_products` WRITE;
/*!40000 ALTER TABLE `admin_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_products` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-07

-- =====================================================
-- INSTRUCTIONS FOR IMPORTING INTO YOUR MYSQL DATABASE
-- =====================================================
-- 1. Open MySQL Workbench or any MySQL client
-- 2. Create database: CREATE DATABASE yx;
-- 3. Select database: USE yx;
-- 4. Copy ALL SQL above and paste into query tab
-- 5. Click Execute (Ctrl+Shift+Enter)
-- Done! All your tables with data are imported
-- =====================================================
