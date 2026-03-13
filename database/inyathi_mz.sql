-- ============================================================
--  Inyathi-Mz | Hygiene & Medical Supplies — Mozambique
--  Database Schema (MySQL) | Database: inyathi_mz
--  60 products · 12 categories · 6 services · 11 provinces
-- ============================================================

CREATE DATABASE IF NOT EXISTS inyathi_mz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inyathi_mz;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLE 1: provinces — Mozambique's 11 provinces
-- ============================================================
DROP TABLE IF EXISTS provinces;
CREATE TABLE provinces (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)     NOT NULL,
  code       CHAR(3)          NOT NULL,
  is_active  TINYINT(1)       NOT NULL DEFAULT 1,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_province_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mozambique provinces for delivery coverage';

INSERT INTO provinces (name, code) VALUES
  ('Maputo City','MPM'),('Maputo','MPT'),('Gaza','GZA'),
  ('Inhambane','INH'),('Sofala','SOF'),('Manica','MAN'),
  ('Tete','TET'),('Zambezia','ZAM'),('Nampula','NAM'),
  ('Cabo Delgado','CAB'),('Niassa','NIA');


-- ============================================================
-- TABLE 2: product_categories
-- 12 slugs match productCatalogueData keys in main.js
-- filter_group matches data-filter values in products.html
-- ============================================================
DROP TABLE IF EXISTS product_categories;
CREATE TABLE product_categories (
  id              TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(50)      NOT NULL COMMENT 'Catalogue key in main.js e.g. soap, roll-towel',
  name_en         VARCHAR(100)     NOT NULL,
  name_pt         VARCHAR(100)     NOT NULL,
  icon_class      VARCHAR(100)     NOT NULL DEFAULT 'fas fa-box',
  filter_group    VARCHAR(50)      NOT NULL COMMENT 'Filter tab slug in products.html e.g. soap-sanitisers',
  filter_group_en VARCHAR(100)     NOT NULL,
  filter_group_pt VARCHAR(100)     NOT NULL,
  sort_order      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_active       TINYINT(1)       NOT NULL DEFAULT 1,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_slug (slug),
  KEY idx_category_filter (filter_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='12 product categories matching catalogue keys and filter tabs in products.html';

INSERT INTO product_categories (slug,name_en,name_pt,icon_class,filter_group,filter_group_en,filter_group_pt,sort_order) VALUES
('soap',        'Hand Soap Dispensers',        'Dispensadores de Sabao',          'fas fa-pump-soap',    'soap-sanitisers', 'Soap & Sanitisers', 'Sabao e Desinfectantes', 1),
('sanitisers',  'Hand Sanitisers',             'Dispensadores de Desinfectante',  'fas fa-hand-sparkles','soap-sanitisers', 'Soap & Sanitisers', 'Sabao e Desinfectantes', 2),
('roll-towel',  'Roll Towel Dispensers',       'Dispensadores de Toalha em Rolo', 'fas fa-scroll',       'towel',           'Towel Dispensers',  'Dispensadores de Toalha',3),
('folded-towel','Folded Towel Dispensers',     'Dispensadores de Toalha Dobrada', 'fas fa-layer-group',  'towel',           'Towel Dispensers',  'Dispensadores de Toalha',4),
('tissue',      'Toilet Tissue Dispensers',    'Dispensadores de Papel Higienico','fas fa-toilet-paper', 'tissue',          'Tissue Dispensers', 'Dispensadores de Papel', 5),
('dryers',      'Hot Air Dryers',              'Secadores de Maos',               'fas fa-wind',         'dryers-fragrance','Dryers & Fragrance','Secadores e Fragrancia', 6),
('fragrance',   'Fragrance Systems',           'Sistemas de Fragrancia',          'fas fa-spray-can',    'dryers-fragrance','Dryers & Fragrance','Secadores e Fragrancia', 7),
('urinal',      'Urinal Hygiene',              'Higiene de Urinol',               'fas fa-restroom',     'hygiene-systems', 'Hygiene Systems',   'Sistemas de Higiene',    8),
('seat',        'Seat Sanitisers',             'Sanitizadores de Assento',        'fas fa-toilet',       'hygiene-systems', 'Hygiene Systems',   'Sistemas de Higiene',    9),
('sanitary',    'Sanitary Disposal',           'Eliminacao Sanitaria',            'fas fa-trash-can',    'hygiene-systems', 'Hygiene Systems',   'Sistemas de Higiene',    10),
('waste',       'Waste Bins',                  'Caixotes do Lixo',                'fas fa-dumpster',     'waste-ppe',       'Waste & PPE',       'Residuos e EPI',         11),
('ppe',         'PPE & Other Products',        'EPI e Outros Produtos',           'fas fa-shield-halved','waste-ppe',       'Waste & PPE',       'Residuos e EPI',         12);


-- ============================================================
-- TABLE 3: products — 60 products from main.js productCatalogueData
-- ============================================================
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  category_id   TINYINT UNSIGNED  NOT NULL,
  product_code  VARCHAR(50)       NULL     COMMENT 'e.g. SD/03, HD/09, AF/04',
  product_range VARCHAR(100)      NULL     COMMENT 'e.g. Pearl Range, Excel Range, Betasan',
  name_en       VARCHAR(200)      NOT NULL,
  name_pt       VARCHAR(200)      NOT NULL,
  description_en TEXT             NOT NULL,
  description_pt TEXT             NOT NULL,
  image_path    VARCHAR(255)      NULL     COMMENT 'Relative path e.g. images/products/SD-03.png',
  icon_class    VARCHAR(100)      NOT NULL DEFAULT 'fas fa-box',
  stock_status  ENUM('in_stock','available','out_of_stock','discontinued') NOT NULL DEFAULT 'in_stock',
  is_featured   TINYINT(1)        NOT NULL DEFAULT 0,
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_category (category_id),
  KEY idx_product_code     (product_code),
  KEY idx_product_range    (product_range),
  KEY idx_product_stock    (stock_status),
  KEY idx_product_active   (is_active),
  CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES product_categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Full product catalogue — 60 hygiene dispenser products';

-- ── cat 1 (id=1): soap — 9 products ─────────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(1,'SD/03','Pearl Range','Pearl Manual Soap Dispenser (White)','Dispensador de Sabao Manual Pearl (Branco)','Wall-mounted manual push soap dispenser in white finish. Pearl Range unit for high-traffic washrooms.','Dispensador de sabao manual de parede em acabamento branco. Unidade da Gama Pearl para casas de banho de grande afluencia.','images/products/SD-03.png','fas fa-pump-soap','in_stock',1,10),
(1,'SD/03PL','Pearl Range','Pearl Manual Soap Dispenser (Platinum)','Dispensador de Sabao Manual Pearl (Platina)','Wall-mounted manual push soap dispenser in platinum finish. Premium Pearl Range unit for upscale washrooms.','Dispensador de sabao manual de parede em acabamento platina. Unidade premium da Gama Pearl para casas de banho de alto nivel.','images/products/SD-03PL.jpg','fas fa-pump-soap','in_stock',0,20),
(1,'SD/86PRL','Pearl Range','Pearl Sensor Soap Dispenser (White)','Dispensador de Sabao com Sensor Pearl (Branco)','Touchless infrared sensor soap dispenser in white finish. Pearl Range hands-free hygienic dispensing.','Dispensador de sabao com sensor infravermelho sem toque em acabamento branco. Distribuicao higienica sem maos da Gama Pearl.','images/products/SD-86PRL.jpg','fas fa-pump-soap','in_stock',1,30),
(1,'SD/86PRLPL','Pearl Range','Pearl Sensor Soap Dispenser (Platinum)','Dispensador de Sabao com Sensor Pearl (Platina)','Touchless infrared sensor soap dispenser in platinum finish. Premium Pearl Range hands-free unit.','Dispensador de sabao com sensor infravermelho sem toque em acabamento platina. Unidade premium sem maos da Gama Pearl.','images/products/SD-86PRLPL.png','fas fa-pump-soap','in_stock',0,40),
(1,'SD/84SS-MII','Excel Range','Excel Manual Soap Dispenser','Dispensador de Sabao Manual Excel','Robust manual push soap dispenser from the Excel Range Mark II for heavy-duty commercial and healthcare environments.','Dispensador de sabao manual robusto da Gama Excel Mark II para ambientes comerciais e de saude de uso intensivo.','images/products/SD-84SS-MII.jpg','fas fa-pump-soap','in_stock',0,50),
(1,'SD/86SS-MII','Excel Range','Excel Sensor Soap Dispenser','Dispensador de Sabao com Sensor Excel','Touchless infrared sensor soap dispenser from the Excel Range Mark II for busy healthcare and commercial settings.','Dispensador de sabao com sensor infravermelho sem toque da Gama Excel Mark II para ambientes movimentados.','images/products/SD-86SS-MII.jpg','fas fa-pump-soap','in_stock',0,60),
(1,'SD/84SB','Betasan','Betasan Manual Soap Dispenser','Dispensador de Sabao Manual Betasan','Manual push soap dispenser from the Betasan range, compatible with Betasan antibacterial soap formulations.','Dispensador de sabao manual da gama Betasan, compativel com formulacoes de sabao antibacteriano Betasan.','images/products/SD-84SB.png','fas fa-pump-soap','in_stock',0,70),
(1,'SD/86SB','Betasan','Betasan Sensor Soap Dispenser','Dispensador de Sabao com Sensor Betasan','Touchless sensor soap dispenser from the Betasan range for hands-free antibacterial soap dispensing.','Dispensador de sabao com sensor sem toque da gama Betasan para distribuicao sem maos de sabao antibacteriano.','images/products/SD-86SB.png','fas fa-pump-soap','in_stock',0,80),
(1,'SD/95','Top Up','Top Up Soap Dispenser','Dispensador de Sabao Top Up','Refillable top-up soap dispenser for easy bulk refilling. Cost-effective solution reducing plastic waste.','Dispensador de sabao recarregavel para recarga a granel facil. Solucao economica que reduz o desperdicio de plastico.','images/products/SD-95.jpg','fas fa-pump-soap','in_stock',0,90);

-- ── cat 2 (id=2): sanitisers — 4 products ───────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(2,'SD/72','Betasan','Betasan Countertop Sanitiser Dispenser','Dispensador de Desinfectante de Bancada Betasan','Compact countertop hand sanitiser dispenser from the Betasan range. Ideal for reception desks and nurse stations.','Dispensador de desinfectante de maos de bancada compacto da gama Betasan. Ideal para recepcoes e postos de enfermagem.','images/products/SD-72.png','fas fa-hand-sparkles','in_stock',1,10),
(2,'SD/73',NULL,'Free Standing Sanitiser Tower','Torre de Desinfectante de Pe Livre','Floor-standing sanitiser tower for high-traffic areas. No wall mounting required — ideal for entrances and corridors.','Torre de desinfectante de pe livre para areas de grande afluencia. Nao requer montagem na parede — ideal para entradas e corredores.','images/products/SD-73.jpg','fas fa-hand-sparkles','in_stock',1,20),
(2,'SD/86SP','Betasan','Betasan Sensor Sanitiser Dispenser','Dispensador de Desinfectante com Sensor Betasan','Touchless infrared sensor hand sanitiser dispenser from the Betasan range for maximum infection control.','Dispensador de desinfectante de maos com sensor infravermelho sem toque da gama Betasan para maximo controlo de infeccoes.','images/products/SD-86SP.png','fas fa-hand-sparkles','in_stock',0,30),
(2,'SD/84SP','Betasan','Betasan Manual Sanitiser Dispenser','Dispensador de Desinfectante Manual Betasan','Wall-mounted manual push hand sanitiser dispenser from the Betasan range for hand hygiene compliance.','Dispensador de desinfectante de maos manual de parede da gama Betasan para conformidade com a higiene das maos.','images/products/SD-84SPx.png','fas fa-hand-sparkles','in_stock',0,40);

-- ── cat 3 (id=3): roll-towel — 7 products ───────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(3,'HD/09','Pearl Range','Pearl Minitowel Sensor Dispenser (White)','Dispensador de Toalha Sensor Pearl (Branco)','Sensor-activated roll towel dispenser in white finish from the Pearl Range. Touchless hygienic hand drying.','Dispensador de toalha em rolo com sensor em acabamento branco da Gama Pearl. Secagem higienica sem toque.','images/products/HD-09.jpg','fas fa-scroll','in_stock',1,10),
(3,'HD/09PL','Pearl Range','Pearl Minitowel Sensor Dispenser (Platinum)','Dispensador de Toalha Sensor Pearl (Platina)','Sensor-activated roll towel dispenser in platinum finish from the Pearl Range. Premium touchless unit.','Dispensador de toalha em rolo com sensor em acabamento platina da Gama Pearl. Unidade premium sem toque.','images/products/HD-09PL.jpg','fas fa-scroll','in_stock',0,20),
(3,'HD/01','Pearl Range','Pearl Minitowel Manual Dispenser (White)','Dispensador de Toalha Manual Pearl (Branco)','Manual lever-operated roll towel dispenser in white finish from the Pearl Range for consistent hand drying.','Dispensador de toalha em rolo manual por alavanca em acabamento branco da Gama Pearl para secagem consistente.','images/products/HD-01.png','fas fa-scroll','in_stock',0,30),
(3,'HD/01PL','Pearl Range','Pearl Minitowel Manual Dispenser (Platinum)','Dispensador de Toalha Manual Pearl (Platina)','Manual lever-operated roll towel dispenser in platinum finish from the Pearl Range for premium washrooms.','Dispensador de toalha em rolo manual por alavanca em acabamento platina da Gama Pearl para casas de banho premium.','images/products/HD-01PL.jpg','fas fa-scroll','in_stock',0,40),
(3,'HD/08-MII','Excel Range','Excel Autotowel Manual Dispenser','Dispensador de Toalha Manual Excel Autotowel','Manual roll towel dispenser from the Excel Range Mark II. Heavy-duty for high-traffic commercial washrooms.','Dispensador de toalha em rolo manual da Gama Excel Mark II. Robusto para casas de banho comerciais de grande afluencia.','images/products/HD-08-MII.jpeg','fas fa-scroll','in_stock',0,50),
(3,'HD/13-MII','Excel Range','Excel Autotowel Sensor Dispenser','Dispensador de Toalha com Sensor Excel Autotowel','Sensor-activated roll towel dispenser from the Excel Range Mark II. Touchless infrared dispensing.','Dispensador de toalha em rolo com sensor da Gama Excel Mark II. Distribuicao por infravermelhos sem toque.','images/products/HD-13-MII.png','fas fa-scroll','in_stock',0,60),
(3,'HD/07',NULL,'Centrepull Towel Dispenser','Dispensador de Toalha Centrepull','Centre-pull roll towel dispenser for high-volume washrooms. Reduces waste with consistent sheet delivery.','Dispensador de toalha em rolo de puxar pelo centro para casas de banho de grande volume. Reduz o desperdicio.','images/products/HD-07.jpg','fas fa-scroll','in_stock',0,70);

-- ── cat 4 (id=4): folded-towel — 3 products ─────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(4,'HD/05','Pearl Range','Pearl Compact Folded Towel Dispenser (White)','Dispensador de Toalha Dobrada Compacto Pearl (Branco)','Compact folded towel dispenser in white finish from the Pearl Range. Space-saving design for smaller washrooms.','Dispensador de toalha dobrada compacto em acabamento branco da Gama Pearl. Design que poupa espaco para casas de banho mais pequenas.','images/products/HD-05.jpg','fas fa-layer-group','in_stock',1,10),
(4,'HD/05PL','Pearl Range','Pearl Compact Folded Towel Dispenser (Platinum)','Dispensador de Toalha Dobrada Compacto Pearl (Platina)','Compact folded towel dispenser in platinum finish from the Pearl Range. Premium space-saving unit.','Dispensador de toalha dobrada compacto em acabamento platina da Gama Pearl. Unidade premium que poupa espaco.','images/products/HD-05PL.jpg','fas fa-layer-group','in_stock',0,20),
(4,'HD/54-MII','Excel Range','Excel Slimline Folded Towel Dispenser','Dispensador de Toalha Dobrada Slimline Excel','Slimline folded towel dispenser from the Excel Range Mark II. Ultra-slim profile with high-capacity storage.','Dispensador de toalha dobrada Slimline da Gama Excel Mark II. Perfil ultra-fino com armazenamento de grande capacidade.','images/products/HD-54-MII.jpg','fas fa-layer-group','in_stock',0,30);

-- ── cat 5 (id=5): tissue — 5 products ───────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(5,'TR/02, TR/03, TR/05',NULL,'TR Units — Multi-Roll Tissue Dispensers (2, 3, 5 roll)','Unidades TR — Dispensadores Multi-Rolo (2, 3, 5 rolos)','Multi-roll toilet tissue dispensers in 2, 3, and 5 roll configurations. Reduces refill frequency in high-traffic washrooms.','Dispensadores de papel higienico multi-rolo em configuracoes de 2, 3 e 5 rolos. Reduz a frequencia de reabastecimento.','images/products/TR-02-03-05.jpg','fas fa-toilet-paper','in_stock',1,10),
(5,'TR/12',NULL,'SFX JTR 500 Tissue Dispenser','Dispensador de Papel Higienico SFX JTR 500','High-capacity jumbo toilet roll dispenser holding up to 500m of tissue for very high-traffic public washrooms.','Dispensador de rolo de papel higienico jumbo de grande capacidade com ate 500m de papel para casas de banho publicas.','images/products/TR-12.jpg','fas fa-toilet-paper','in_stock',0,20),
(5,'TR/01','Pearl Range','Pearl JTR Twin Tissue Dispenser (White)','Dispensador de Papel Higienico JTR Twin Pearl (Branco)','Twin jumbo toilet roll dispenser in white finish from the Pearl Range. Continuous supply with two jumbo rolls.','Dispensador de rolo de papel higienico jumbo duplo em acabamento branco da Gama Pearl. Fornecimento continuo com dois rolos.','images/products/TR-01.jpg','fas fa-toilet-paper','in_stock',0,30),
(5,'TR/01PL','Pearl Range','Pearl JTR Twin Tissue Dispenser (Platinum)','Dispensador de Papel Higienico JTR Twin Pearl (Platina)','Twin jumbo toilet roll dispenser in platinum finish from the Pearl Range. Premium continuous supply unit.','Dispensador de rolo de papel higienico jumbo duplo em acabamento platina da Gama Pearl. Unidade premium de fornecimento continuo.','images/products/TR-01PL.jpg','fas fa-toilet-paper','in_stock',0,40),
(5,'TR/18SS-MII','Excel Range','Excel JTR Twin Tissue Dispenser','Dispensador de Papel Higienico JTR Twin Excel','Twin jumbo toilet roll dispenser from the Excel Range Mark II. Heavy-duty for high-traffic washrooms.','Dispensador de rolo de papel higienico jumbo duplo da Gama Excel Mark II. Robusto para casas de banho de grande afluencia.','images/products/TR-18SS-MII.jpg','fas fa-toilet-paper','in_stock',0,50);

-- ── cat 6 (id=6): dryers — 4 products ───────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(6,'Quartz Fastdry',NULL,'Quartz Fastdry Hand Dryer','Secador de Maos Quartz Fastdry','High-speed hand dryer with rapid drying technology. Energy-efficient hygienic alternative to paper towels.','Secador de maos de alta velocidade com tecnologia de secagem rapida. Alternativa energeticamente eficiente as toalhas de papel.','images/products/quartz-fastdry.jpg','fas fa-wind','in_stock',1,10),
(6,'HD/04','Excel Range','Excel E-Dry Hand Dryer','Secador de Maos Excel E-Dry','Compact and efficient electric hand dryer from the Excel Range for medium-traffic commercial and healthcare washrooms.','Secador de maos electrico compacto e eficiente da Gama Excel para casas de banho comerciais e de saude de media afluencia.','images/products/HD-04.jpg','fas fa-wind','in_stock',0,20),
(6,'Excel R8','Excel Range','Excel R8 Hand Dryer','Secador de Maos Excel R8','High-performance hand dryer from the Excel Range. Fast drying with low noise for offices, hotels, and healthcare facilities.','Secador de maos de alto desempenho da Gama Excel. Secagem rapida com baixo ruido para escritorios, hoteis e instalacoes de saude.','images/products/excel-r8.jpg','fas fa-wind','in_stock',0,30),
(6,'HD/22','Excel Range','Excel V-Dry Hand Dryer','Secador de Maos Excel V-Dry','Excel V-Dry vertical-airflow hand dryer with innovative V-shaped air outlet for fast, efficient, hygienic drying.','Secador de maos de fluxo de ar vertical Excel V-Dry com saida de ar em V inovadora para secagem rapida e higienica.','images/products/HD-22.jpg','fas fa-wind','in_stock',0,40);

-- ── cat 7 (id=7): fragrance — 10 products ───────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(7,'AF/04','Pearl Range','Pearl Airmist Fragrance Dispenser (White)','Dispensador de Fragrancia Pearl Airmist (Branco)','Automatic air freshener dispenser in white finish from the Pearl Range. Programmable spray intervals for consistent washroom fragrance.','Dispensador automatico de ambientador em acabamento branco da Gama Pearl. Intervalos de pulverizacao programaveis para fragrancia consistente.','images/products/AF-04.jpg','fas fa-spray-can','in_stock',1,10),
(7,'AF/04PL','Pearl Range','Pearl Airmist Fragrance Dispenser (Platinum)','Dispensador de Fragrancia Pearl Airmist (Platina)','Automatic air freshener dispenser in platinum finish from the Pearl Range. Premium unit for upscale washroom environments.','Dispensador automatico de ambientador em acabamento platina da Gama Pearl. Unidade premium para ambientes de casa de banho de alto nivel.','images/products/AF-04PL.jpg','fas fa-spray-can','in_stock',0,20),
(7,'AF/06-MII','Excel Range','Excel Airmist MKII Fragrance Dispenser','Dispensador de Fragrancia Excel Airmist MKII','Automatic air freshener dispenser from the Excel Range Mark II. Heavy-duty unit for high-traffic commercial washrooms.','Dispensador automatico de ambientador da Gama Excel Mark II. Unidade robusta para casas de banho comerciais de grande afluencia.','images/products/AF-06-MII.jpg','fas fa-spray-can','in_stock',0,30),
(7,'Refill','Fragrance Refills','Citrus Rush Fragrance Refill','Recarga de Fragrancia Citrus Rush','Citrus Rush fragrance refill for Pearl and Excel Airmist dispensers. Fresh citrus scent for a clean, invigorating washroom atmosphere.','Recarga de fragrancia Citrus Rush para dispensadores Pearl e Excel Airmist. Aroma citrico fresco para uma atmosfera de casa de banho limpa e revigorante.','images/products/refill-citrus-rush.jpg','fas fa-spray-can','in_stock',0,40),
(7,'Refill','Fragrance Refills','Baby Breeze Fragrance Refill','Recarga de Fragrancia Baby Breeze','Baby Breeze fragrance refill for Pearl and Excel Airmist dispensers. Soft, gentle scent for a welcoming washroom environment.','Recarga de fragrancia Baby Breeze para dispensadores Pearl e Excel Airmist. Aroma suave e delicado para um ambiente de casa de banho acolhedor.','images/products/refill-baby-breeze.jpg','fas fa-spray-can','in_stock',0,50),
(7,'Refill','Fragrance Refills','Berry Mint Fragrance Refill','Recarga de Fragrancia Berry Mint','Berry Mint fragrance refill for Pearl and Excel Airmist dispensers. Refreshing berry and mint blend for a vibrant washroom atmosphere.','Recarga de fragrancia Berry Mint para dispensadores Pearl e Excel Airmist. Mistura refrescante de frutos silvestres e menta.','images/products/refill-berry-mint.jpg','fas fa-spray-can','in_stock',0,60),
(7,'Refill','Fragrance Refills','Candy Blast Fragrance Refill','Recarga de Fragrancia Candy Blast','Candy Blast fragrance refill for Pearl and Excel Airmist dispensers. Sweet, playful scent for a fun and fresh washroom.','Recarga de fragrancia Candy Blast para dispensadores Pearl e Excel Airmist. Aroma doce e divertido para uma casa de banho fresca.','images/products/refill-candy-blast.jpg','fas fa-spray-can','in_stock',0,70),
(7,'Refill','Fragrance Refills','Edge Fragrance Refill','Recarga de Fragrancia Edge','Edge fragrance refill for Pearl and Excel Airmist dispensers. Bold, masculine scent for a confident washroom atmosphere.','Recarga de fragrancia Edge para dispensadores Pearl e Excel Airmist. Aroma ousado e masculino para uma atmosfera de casa de banho confiante.','images/products/refill-edge.jpg','fas fa-spray-can','in_stock',0,80),
(7,'Refill','Fragrance Refills','Vanilla Fragrance Refill','Recarga de Fragrancia Vanilla','Vanilla fragrance refill for Pearl and Excel Airmist dispensers. Warm, comforting vanilla scent for a welcoming washroom.','Recarga de fragrancia Vanilla para dispensadores Pearl e Excel Airmist. Aroma quente e reconfortante de baunilha para uma casa de banho acolhedora.','images/products/refill-vanilla.jpg','fas fa-spray-can','in_stock',0,90),
(7,'Refill','Fragrance Refills','Citronella Lemongrass Fragrance Refill','Recarga de Fragrancia Citronella Lemongrass','Citronella Lemongrass fragrance refill for Pearl and Excel Airmist dispensers. Natural citronella and lemongrass scent with insect-repelling properties.','Recarga de fragrancia Citronella Lemongrass para dispensadores Pearl e Excel Airmist. Aroma natural de citronela e capim-limao com propriedades repelentes de insectos.','images/products/refill-citronella.jpg','fas fa-spray-can','in_stock',0,100);

-- ── cat 8 (id=8): urinal — 4 products ───────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(8,'US/08-MII','Excel Range','Excel Autosan Urinal Hygiene Unit','Unidade de Higiene de Urinol Excel Autosan','Automatic urinal hygiene unit from the Excel Range Mark II. Timed dosing of sanitising fluid to maintain urinal hygiene and eliminate odours.','Unidade de higiene de urinol automatica da Gama Excel Mark II. Doseamento temporizado de fluido sanitizante para manter a higiene do urinol e eliminar odores.','images/products/US-08-MII.jpg','fas fa-restroom','in_stock',1,10),
(8,'US/22',NULL,'SFX Autosan Urinal Hygiene Unit','Unidade de Higiene de Urinol SFX Autosan','SFX Autosan automatic urinal hygiene unit. Programmable dosing system for consistent urinal sanitisation and odour control.','Unidade de higiene de urinol automatica SFX Autosan. Sistema de doseamento programavel para sanitizacao consistente do urinol e controlo de odores.','images/products/US-22.jpg','fas fa-restroom','in_stock',0,20),
(8,'UR/06 / UR/07',NULL,'V-Screen Urinal Screens','Telas de Urinol V-Screen','V-Screen urinal screens with built-in fragrance and anti-splash design. Reduces splashback and maintains urinal hygiene between cleans.','Telas de urinol V-Screen com fragrancia incorporada e design anti-salpicos. Reduz os salpicos e mantem a higiene do urinol entre limpezas.','images/products/UR-06-07.jpg','fas fa-restroom','in_stock',0,30),
(8,'UR/27B-33B',NULL,'Wave 3D Urinal Screens','Telas de Urinol Wave 3D','Wave 3D urinal screens with 3D anti-splash technology and long-lasting fragrance. Superior splash reduction for cleaner urinal environments.','Telas de urinol Wave 3D com tecnologia anti-salpicos 3D e fragrancia de longa duracao. Reducao superior de salpicos para ambientes de urinol mais limpos.','images/products/UR-27B-33B.jpg','fas fa-restroom','in_stock',0,40);

-- ── cat 9 (id=9): seat — 3 products ─────────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(9,'WD/03','Pearl Range','Pearl Seatsan Seat Sanitiser (White)','Dispensador de Sanitizador de Assento Pearl Seatsan (Branco)','Toilet seat sanitiser dispenser in white finish from the Pearl Range. Provides hygienic toilet seat cleaning solution for public washrooms.','Dispensador de sanitizador de assento de sanita em acabamento branco da Gama Pearl. Fornece solucao de limpeza higienica do assento para casas de banho publicas.','images/products/WD-03.jpg','fas fa-toilet','in_stock',1,10),
(9,'WD/03PL','Pearl Range','Pearl Seatsan Seat Sanitiser (Platinum)','Dispensador de Sanitizador de Assento Pearl Seatsan (Platina)','Toilet seat sanitiser dispenser in platinum finish from the Pearl Range. Premium unit for upscale washroom environments.','Dispensador de sanitizador de assento de sanita em acabamento platina da Gama Pearl. Unidade premium para ambientes de casa de banho de alto nivel.','images/products/WD-03PL.jpg','fas fa-toilet','in_stock',0,20),
(9,'WD/06-MII','Excel Range','Excel Seatsan Seat Sanitiser','Dispensador de Sanitizador de Assento Excel Seatsan','Toilet seat sanitiser dispenser from the Excel Range Mark II. Heavy-duty unit for high-traffic commercial and healthcare washrooms.','Dispensador de sanitizador de assento de sanita da Gama Excel Mark II. Unidade robusta para casas de banho comerciais e de saude de grande afluencia.','images/products/WD-06-MII.jpg','fas fa-toilet','in_stock',0,30);

-- ── cat 10 (id=10): sanitary — 4 products ───────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(10,'SW/26-MII','Excel Range','Excel Femcare Sanitary Disposal Bin','Caixote de Eliminacao Sanitaria Excel Femcare','Sanitary disposal bin from the Excel Range Mark II. Hygienic, discreet disposal solution for feminine hygiene products in commercial washrooms.','Caixote de eliminacao sanitaria da Gama Excel Mark II. Solucao de eliminacao higienica e discreta para produtos de higiene feminina em casas de banho comerciais.','images/products/SW-26-MII.jpg','fas fa-trash-can','in_stock',1,10),
(10,'SW/01X / SW/03X',NULL,'Femcare Sanitary Disposal Bins (White)','Caixotes de Eliminacao Sanitaria Femcare (Branco)','Femcare sanitary disposal bins in white finish. Available in two sizes for flexible placement in washroom cubicles.','Caixotes de eliminacao sanitaria Femcare em acabamento branco. Disponiveis em dois tamanhos para colocacao flexivel em cubiculos de casa de banho.','images/products/SW-01X-03X.jpg','fas fa-trash-can','in_stock',0,20),
(10,'SW/01XPL / SW/03XPL',NULL,'Femcare Sanitary Disposal Bins (Platinum)','Caixotes de Eliminacao Sanitaria Femcare (Platina)','Femcare sanitary disposal bins in platinum finish. Premium units available in two sizes for upscale washroom environments.','Caixotes de eliminacao sanitaria Femcare em acabamento platina. Unidades premium disponiveis em dois tamanhos para ambientes de casa de banho de alto nivel.','images/products/SW-01XPL-03XPL.jpg','fas fa-trash-can','in_stock',0,30),
(10,'SW/50',NULL,'Femcare Pedal Sanitary Disposal Bin','Caixote de Eliminacao Sanitaria Femcare com Pedal','Femcare pedal-operated sanitary disposal bin. Hands-free lid operation for maximum hygiene in washroom cubicles.','Caixote de eliminacao sanitaria Femcare com operacao por pedal. Operacao da tampa sem maos para maxima higiene em cubiculos de casa de banho.','images/products/SW-50.jpg','fas fa-trash-can','in_stock',0,40);

-- ── cat 11 (id=11): waste — 3 products ──────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(11,'SW/13-MII','Excel Range','Excel Wastecare Waste Bin','Caixote do Lixo Excel Wastecare','Waste bin from the Excel Range Mark II. Robust, hygienic waste disposal solution for commercial washrooms and healthcare facilities.','Caixote do lixo da Gama Excel Mark II. Solucao de eliminacao de residuos robusta e higienica para casas de banho comerciais e instalacoes de saude.','images/products/SW-13-MII.jpg','fas fa-dumpster','in_stock',1,10),
(11,'SW/76',NULL,'Eco Wall Bin 6L','Caixote de Parede Eco 6L','Eco Wall Bin 6-litre wall-mounted waste bin. Space-saving design for washroom cubicles and compact spaces.','Caixote de parede Eco de 6 litros montado na parede. Design que poupa espaco para cubiculos de casa de banho e espacos compactos.','images/products/SW-76.jpg','fas fa-dumpster','in_stock',0,20),
(11,'SW/77',NULL,'Eco Wall Bin 25L','Caixote de Parede Eco 25L','Eco Wall Bin 25-litre wall-mounted waste bin. Larger capacity for high-traffic washrooms and communal areas.','Caixote de parede Eco de 25 litros montado na parede. Maior capacidade para casas de banho de grande afluencia e areas comuns.','images/products/SW-77.jpg','fas fa-dumpster','in_stock',0,30);

-- ── cat 12 (id=12): ppe — 4 products ────────────────────────
INSERT INTO products (category_id,product_code,product_range,name_en,name_pt,description_en,description_pt,image_path,icon_class,stock_status,is_featured,sort_order) VALUES
(12,'Nitrile Gloves','PPE','Nitrile Gloves (100 pack)','Luvas de Nitrilo (100 unidades)','Powder-free nitrile examination gloves, 100 per box. Latex-free, puncture-resistant gloves for healthcare, cleaning, and food service use.','Luvas de exame de nitrilo sem po, 100 por caixa. Luvas sem latex e resistentes a perfuracao para uso em saude, limpeza e servicos alimentares.','images/products/nitrile-gloves.jpg','fas fa-shield-halved','in_stock',1,10),
(12,'CAPS009','PPE','Mop Caps','Toucas de Mop','Disposable mop caps for hygiene and food service environments. Lightweight, breathable, and elastic for a secure fit.','Toucas de mop descartaveis para ambientes de higiene e servicos alimentares. Leves, respiratorias e elasticas para um ajuste seguro.','images/products/CAPS009.jpg','fas fa-shield-halved','in_stock',0,20),
(12,'Betasan Wipes','PPE','Betasan All Purpose Sanitiser Wipes','Lencos Desinfectantes Betasan Multiusos','Betasan all-purpose antibacterial sanitiser wipes for surface and hand cleaning. Effective against bacteria and viruses in healthcare and commercial settings.','Lencos desinfectantes antibacterianos multiusos Betasan para limpeza de superficies e maos. Eficazes contra bacterias e virus em ambientes de saude e comerciais.','images/products/Betasan-All-Purpose-Wipes.jpg','fas fa-shield-halved','in_stock',0,30),
(12,'Aerosoal Fogger','PPE','Betasan Aerosol Fogger Range','Gama de Nebulizadores Aerossol Betasan','Betasan aerosol fogger for large-area disinfection. Effective sanitisation of rooms, vehicles, and large spaces using Betasan disinfectant formulation.','Nebulizador aerossol Betasan para desinfeccao de grandes areas. Sanitizacao eficaz de salas, veiculos e grandes espacos usando formulacao desinfectante Betasan.','images/products/Aerosoal-Fogger.jpg','fas fa-shield-halved','in_stock',0,40);


-- ============================================================
-- TABLE 4: services — 6 services from services.html
-- ============================================================
DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id             TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(80)      NOT NULL,
  name_en        VARCHAR(150)     NOT NULL,
  name_pt        VARCHAR(150)     NOT NULL,
  description_en TEXT             NOT NULL,
  description_pt TEXT             NOT NULL,
  icon_class     VARCHAR(100)     NOT NULL DEFAULT 'fas fa-cog',
  sort_order     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_active      TINYINT(1)       NOT NULL DEFAULT 1,
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Services offered by Inyathi-Mz (matches services.html)';

INSERT INTO services (slug,name_en,name_pt,description_en,description_pt,icon_class,sort_order) VALUES
('pharmaceutical-distribution',
 'Pharmaceutical Distribution','Distribuicao Farmaceutica',
 'Reliable, nationwide distribution of prescription medicines, OTC drugs, vaccines, antibiotics, and specialty pharmaceuticals across all major provinces in Mozambique.',
 'Distribuicao fiavel a nivel nacional de medicamentos com receita, medicamentos sem receita, vacinas, antibioticos e produtos farmaceuticos especializados em todas as principais provincias de Mocambique.',
 'fas fa-pills',1),

('bulk-supply-procurement',
 'Bulk Supply & Procurement','Fornecimento a Granel e Aquisicao',
 'Cost-effective bulk purchasing solutions for large healthcare institutions, NGOs, and government programs with volume-based pricing and flexible payment terms.',
 'Solucoes de compra a granel rentaveis para grandes instituicoes de saude, ONGs e programas governamentais com precos baseados em volume e condicoes de pagamento flexiveis.',
 'fas fa-boxes-stacked',2),

('cold-chain-logistics',
 'Cold Chain Logistics','Logistica de Cadeia de Frio',
 'Temperature-controlled storage and transport ensuring product integrity for vaccines and temperature-sensitive medicines using validated cold storage facilities and refrigerated transport.',
 'Armazenamento e transporte com controlo de temperatura, garantindo a integridade do produto para vacinas e medicamentos sensiveis a temperatura, utilizando instalacoes de armazenamento a frio validadas e transporte refrigerado.',
 'fas fa-temperature-low',3),

('medical-equipment-supply',
 'Medical Equipment Supply','Fornecimento de Equipamento Medico',
 'Supply of a wide range of medical equipment, diagnostic tools, surgical instruments, and hospital consumables from certified manufacturers to equip healthcare facilities.',
 'Fornecimento de uma vasta gama de equipamentos medicos, ferramentas de diagnostico, instrumentos cirurgicos e consumiveis hospitalares de fabricantes certificados para equipar unidades de saude.',
 'fas fa-stethoscope',4),

('regulatory-compliance',
 'Regulatory Compliance Support','Apoio a Conformidade Regulatoria',
 'Ensuring all products comply with Mozambique MISAU regulations and international standards, handling all necessary documentation, import paperwork, and certifications.',
 'Garantir que todos os produtos cumprem os regulamentos do MISAU de Mocambique e as normas internacionais, tratando de toda a documentacao necessaria, papelada de importacao e certificacoes.',
 'fas fa-clipboard-check',5),

('customer-support',
 'Dedicated Customer Support','Apoio ao Cliente Dedicado',
 'Experienced team providing responsive, personalized support for all supply needs, from order placement to after-sales service with dedicated account managers.',
 'Equipa experiente que presta apoio responsivo e personalizado para todas as necessidades de fornecimento, desde a colocacao de encomendas ate ao servico pos-venda com gestores de conta dedicados.',
 'fas fa-headset',6);


-- ============================================================
-- TABLE 5: client_types — Types of healthcare institutions served
-- ============================================================
DROP TABLE IF EXISTS client_types;
CREATE TABLE client_types (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(50)      NOT NULL,
  name_en    VARCHAR(100)     NOT NULL,
  name_pt    VARCHAR(100)     NOT NULL,
  icon_class VARCHAR(100)     NOT NULL DEFAULT 'fas fa-building',
  is_active  TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_type_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Types of healthcare institutions served (matches pricing.html We Serve section)';

INSERT INTO client_types (slug,name_en,name_pt,icon_class) VALUES
('hospital',  'Private & Public Hospital',    'Hospital Publico e Privado',     'fas fa-hospital'),
('clinic',    'Clinic & Health Center',       'Clinica e Centro de Saude',      'fas fa-clinic-medical'),
('pharmacy',  'Pharmacy',                     'Farmacia',                       'fas fa-prescription-bottle'),
('ngo',       'NGO & Healthcare Program',     'ONG e Programa de Saude',        'fas fa-globe'),
('corporate', 'Corporate Medical Department', 'Departamento Medico Corporativo', 'fas fa-building'),
('government','Government Health Institution','Instituicao de Saude Publica',   'fas fa-landmark');


-- ============================================================
-- TABLE 6: clients — Registered client/institution records
-- ============================================================
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  client_type_id   TINYINT UNSIGNED NOT NULL,
  province_id      TINYINT UNSIGNED NULL,
  institution_name VARCHAR(200)     NOT NULL,
  contact_person   VARCHAR(150)     NOT NULL,
  email            VARCHAR(254)     NOT NULL,
  phone            VARCHAR(30)      NULL,
  address          TEXT             NULL,
  city             VARCHAR(100)     NULL,
  notes            TEXT             NULL,
  is_active        TINYINT(1)       NOT NULL DEFAULT 1,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_email (email),
  KEY idx_client_type     (client_type_id),
  KEY idx_client_province (province_id),
  CONSTRAINT fk_client_type
    FOREIGN KEY (client_type_id) REFERENCES client_types (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_client_province
    FOREIGN KEY (province_id) REFERENCES provinces (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registered client and institution records';


-- ============================================================
-- TABLE 7: contact_messages — Submissions from contact.html
-- ============================================================
DROP TABLE IF EXISTS contact_messages;
CREATE TABLE contact_messages (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(150)  NOT NULL,
  institution VARCHAR(200)  NULL     COMMENT 'Optional institution/organization',
  email       VARCHAR(254)  NOT NULL,
  phone       VARCHAR(30)   NULL,
  subject     VARCHAR(255)  NOT NULL,
  message     TEXT          NOT NULL,
  ip_address  VARCHAR(45)   NULL     COMMENT 'IPv4 or IPv6',
  user_agent  VARCHAR(500)  NULL,
  status      ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  replied_at  TIMESTAMP     NULL,
  reply_notes TEXT          NULL     COMMENT 'Internal admin notes',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_status  (status),
  KEY idx_contact_email   (email),
  KEY idx_contact_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Contact form submissions from contact.html — handled by routes/contact.js';


-- ============================================================
-- TABLE 8: quote_requests — Submissions from pricing.html
-- ============================================================
DROP TABLE IF EXISTS quote_requests;
CREATE TABLE quote_requests (
  id                     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  client_id              INT UNSIGNED     NULL     COMMENT 'Linked if client is registered',
  full_name              VARCHAR(150)     NOT NULL,
  institution            VARCHAR(200)     NOT NULL,
  email                  VARCHAR(254)     NOT NULL,
  phone                  VARCHAR(30)      NOT NULL,
  product_category_id    TINYINT UNSIGNED NULL     COMMENT 'FK to product_categories',
  product_category_other VARCHAR(100)     NULL     COMMENT 'Free text if category = other',
  estimated_quantity     VARCHAR(200)     NULL     COMMENT 'e.g. 500 units, monthly supply',
  product_details        TEXT             NOT NULL COMMENT 'Specific products and requirements',
  ip_address             VARCHAR(45)      NULL,
  user_agent             VARCHAR(500)     NULL,
  status                 ENUM('new','under_review','quoted','accepted','rejected','expired') NOT NULL DEFAULT 'new',
  quoted_at              TIMESTAMP        NULL,
  quote_reference        VARCHAR(50)      NULL     COMMENT 'e.g. QR-20240101-12345',
  admin_notes            TEXT             NULL,
  created_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quote_status   (status),
  KEY idx_quote_email    (email),
  KEY idx_quote_category (product_category_id),
  KEY idx_quote_client   (client_id),
  KEY idx_quote_created  (created_at),
  CONSTRAINT fk_quote_category
    FOREIGN KEY (product_category_id) REFERENCES product_categories (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_quote_client
    FOREIGN KEY (client_id) REFERENCES clients (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Quote request form submissions from pricing.html — handled by routes/quote.js';


-- ============================================================
-- TABLE 9: quote_request_items — Line items per quote request
-- ============================================================
DROP TABLE IF EXISTS quote_request_items;
CREATE TABLE quote_request_items (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  quote_request_id INT UNSIGNED     NOT NULL,
  product_id       INT UNSIGNED     NULL     COMMENT 'NULL if product not in catalogue',
  product_name     VARCHAR(200)     NOT NULL COMMENT 'Free-text product name',
  quantity         VARCHAR(100)     NULL     COMMENT 'e.g. 200 units, 5 boxes',
  unit             VARCHAR(50)      NULL     COMMENT 'e.g. units, boxes, packs',
  notes            TEXT             NULL,
  unit_price       DECIMAL(12,2)    NULL     COMMENT 'Quoted unit price (MZN)',
  total_price      DECIMAL(14,2)    NULL     COMMENT 'Quoted total price (MZN)',
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qri_quote   (quote_request_id),
  KEY idx_qri_product (product_id),
  CONSTRAINT fk_qri_quote
    FOREIGN KEY (quote_request_id) REFERENCES quote_requests (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_qri_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual product line items per quote request';


-- ============================================================
-- TABLE 10: orders — Confirmed orders (converted from accepted quotes)
-- ============================================================
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  order_number      VARCHAR(30)      NOT NULL COMMENT 'e.g. IM-2024-00001',
  client_id         INT UNSIGNED     NOT NULL,
  quote_request_id  INT UNSIGNED     NULL     COMMENT 'Source quote if applicable',
  province_id       TINYINT UNSIGNED NULL     COMMENT 'Delivery province',
  delivery_address  TEXT             NULL,
  contact_person    VARCHAR(150)     NOT NULL,
  contact_phone     VARCHAR(30)      NULL,
  contact_email     VARCHAR(254)     NOT NULL,
  subtotal          DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  discount_amount   DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  tax_amount        DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN (IVA)',
  shipping_amount   DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  total_amount      DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  currency          CHAR(3)          NOT NULL DEFAULT 'MZN',
  payment_status    ENUM('pending','partial','paid','refunded') NOT NULL DEFAULT 'pending',
  payment_method    VARCHAR(80)      NULL     COMMENT 'e.g. Bank Transfer, M-Pesa',
  order_status      ENUM('pending','confirmed','processing','dispatched','delivered','cancelled') NOT NULL DEFAULT 'pending',
  notes             TEXT             NULL,
  dispatched_at     TIMESTAMP        NULL,
  delivered_at      TIMESTAMP        NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_number  (order_number),
  KEY idx_order_client        (client_id),
  KEY idx_order_status        (order_status),
  KEY idx_order_payment       (payment_status),
  KEY idx_order_province      (province_id),
  KEY idx_order_quote         (quote_request_id),
  KEY idx_order_created       (created_at),
  CONSTRAINT fk_order_client
    FOREIGN KEY (client_id) REFERENCES clients (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_province
    FOREIGN KEY (province_id) REFERENCES provinces (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_order_quote
    FOREIGN KEY (quote_request_id) REFERENCES quote_requests (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Confirmed orders placed by clients';


-- ============================================================
-- TABLE 11: order_items — Line items per confirmed order
-- ============================================================
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  order_id      INT UNSIGNED     NOT NULL,
  product_id    INT UNSIGNED     NULL     COMMENT 'NULL if custom/unlisted product',
  product_code  VARCHAR(50)      NULL     COMMENT 'Snapshot of product code at order time',
  product_name  VARCHAR(200)     NOT NULL COMMENT 'Snapshot of product name at order time',
  category_name VARCHAR(100)     NULL     COMMENT 'Snapshot of category at order time',
  quantity      DECIMAL(10,2)    NOT NULL DEFAULT 1,
  unit          VARCHAR(50)      NULL     COMMENT 'e.g. units, boxes, packs',
  unit_price    DECIMAL(12,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  discount_pct  DECIMAL(5,2)     NOT NULL DEFAULT 0.00 COMMENT 'Line-level discount %',
  total_price   DECIMAL(14,2)    NOT NULL DEFAULT 0.00 COMMENT 'MZN',
  batch_number  VARCHAR(100)     NULL,
  expiry_date   DATE             NULL,
  notes         TEXT             NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_oi_order   (order_id),
  KEY idx_oi_product (product_id),
  CONSTRAINT fk_oi_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oi_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual product line items per confirmed order';


-- ============================================================
-- TABLE 12: admin_users — Backend admin accounts
-- ============================================================
DROP TABLE IF EXISTS admin_users;
CREATE TABLE admin_users (
  id                     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name              VARCHAR(150)  NOT NULL,
  email                  VARCHAR(254)  NOT NULL,
  password_hash          VARCHAR(255)  NOT NULL  COMMENT 'bcrypt hash — never store plain text',
  role                   ENUM('super_admin','admin','manager','viewer') NOT NULL DEFAULT 'viewer',
  is_active              TINYINT(1)    NOT NULL DEFAULT 1,
  last_login_at          TIMESTAMP     NULL,
  last_login_ip          VARCHAR(45)   NULL,
  password_reset_token   VARCHAR(100)  NULL,
  password_reset_expires TIMESTAMP     NULL,
  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_email (email),
  KEY idx_admin_role   (role),
  KEY idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Admin user accounts for backend management';

-- Default super admin — replace password hash before deploying!
INSERT INTO admin_users (full_name, email, password_hash, role) VALUES
  ('Inyathi Admin', 'admin@inyathimz.com',
   '$2y$12$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH_BEFORE_DEPLOY',
   'super_admin');


-- ============================================================
-- Re-enable foreign key checks
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- VIEWS
-- ============================================================

-- View: pending quote requests with category name
CREATE OR REPLACE VIEW v_pending_quotes AS
SELECT
  qr.id,
  qr.quote_reference,
  qr.full_name,
  qr.institution,
  qr.email,
  qr.phone,
  pc.name_en        AS product_category,
  pc.slug           AS category_slug,
  qr.estimated_quantity,
  qr.product_details,
  qr.status,
  qr.created_at
FROM quote_requests qr
LEFT JOIN product_categories pc ON pc.id = qr.product_category_id
WHERE qr.status IN ('new','under_review')
ORDER BY qr.created_at DESC;


-- View: unread contact messages
CREATE OR REPLACE VIEW v_unread_contacts AS
SELECT
  id,
  full_name,
  institution,
  email,
  phone,
  subject,
  LEFT(message, 120) AS message_preview,
  created_at
FROM contact_messages
WHERE status = 'new'
ORDER BY created_at DESC;


-- View: active orders with client and province info
CREATE OR REPLACE VIEW v_active_orders AS
SELECT
  o.id,
  o.order_number,
  c.institution_name,
  ct.name_en        AS client_type,
  p.name            AS delivery_province,
  o.contact_person,
  o.contact_email,
  o.total_amount,
  o.currency,
  o.payment_status,
  o.order_status,
  o.created_at
FROM orders o
JOIN clients c       ON c.id  = o.client_id
JOIN client_types ct ON ct.id = c.client_type_id
LEFT JOIN provinces p ON p.id = o.province_id
WHERE o.order_status NOT IN ('delivered','cancelled')
ORDER BY o.created_at DESC;


-- View: full product catalogue with category and filter group info
CREATE OR REPLACE VIEW v_product_catalogue AS
SELECT
  pr.id,
  pr.product_code,
  pr.product_range,
  pc.slug           AS category_slug,
  pc.name_en        AS category_en,
  pc.name_pt        AS category_pt,
  pc.filter_group,
  pc.filter_group_en,
  pc.filter_group_pt,
  pr.name_en,
  pr.name_pt,
  pr.description_en,
  pr.description_pt,
  pr.image_path,
  pr.icon_class,
  pr.stock_status,
  pr.is_featured,
  pr.sort_order
FROM products pr
JOIN product_categories pc ON pc.id = pr.category_id
WHERE pr.is_active = 1
  AND pc.is_active = 1
ORDER BY pc.sort_order, pr.sort_order;


-- ============================================================
-- SCHEMA SUMMARY
-- ============================================================
--
--  Tables (12):
--  +---------------------------+----------------------------------------------+
--  | Table                     | Purpose                                      |
--  +---------------------------+----------------------------------------------+
--  | provinces                 | Mozambique's 11 provinces                    |
--  | product_categories        | 12 categories matching main.js catalogue     |
--  | products                  | 60 hygiene dispenser products                |
--  | services                  | 6 services from services.html                |
--  | client_types              | 6 institution types (hospital/clinic/etc.)   |
--  | clients                   | Registered client/institution records        |
--  | contact_messages          | Contact form submissions (contact.html)      |
--  | quote_requests            | Quote form submissions (pricing.html)        |
--  | quote_request_items       | Line items per quote request                 |
--  | orders                    | Confirmed orders                             |
--  | order_items               | Line items per confirmed order               |
--  | admin_users               | Backend admin accounts                       |
--  +---------------------------+----------------------------------------------+
--
--  Views (4):
--  +----------------------+--------------------------------------------------+
--  | View                 | Purpose                                          |
--  +----------------------+--------------------------------------------------+
--  | v_pending_quotes     | New/under-review quote requests                  |
--  | v_unread_contacts    | Unread contact form messages                     |
--  | v_active_orders      | Orders not yet delivered or cancelled            |
--  | v_product_catalogue  | Active products with category & filter info      |
--  +----------------------+--------------------------------------------------+
--
--  Product Categories (12) → Filter Groups (6):
--  soap          ─┐
--  sanitisers    ─┘─ soap-sanitisers
--  roll-towel    ─┐
--  folded-towel  ─┘─ towel
--  tissue        ──── tissue
--  dryers        ─┐
--  fragrance     ─┘─ dryers-fragrance
--  urinal        ─┐
--  seat          ─┤─ hygiene-systems
--  sanitary      ─┘
--  waste         ─┐
--  ppe           ─┘─ waste-ppe
--
--  Product Ranges in Catalogue:
--  Pearl Range · Excel Range · Betasan · Top Up · Fragrance Refills · PPE
--
--  Run with:
--    mysql -u root -p < database/inyathi_mz.sql
--
--  Company:  Inyathi-Mz | inyathimz@gmail.com | +258 84 394 1017
--  Address:  Av. Emilia Dausse, no.48, Maputo, Mozambique
-- ============================================================
