CREATE DATABASE IF NOT EXISTS sigi_erp;
CREATE DATABASE IF NOT EXISTS sigi_erp_test;
CREATE USER IF NOT EXISTS 'sigi_user'@'%' IDENTIFIED BY 'sigipassword';
GRANT ALL PRIVILEGES ON sigi_erp.* TO 'sigi_user'@'%';
GRANT ALL PRIVILEGES ON sigi_erp_test.* TO 'sigi_user'@'%';
FLUSH PRIVILEGES;
