-- BigLotus CrowdEva schema without physical foreign keys
CREATE DATABASE IF NOT EXISTS biglotus_crowdeva
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE biglotus_crowdeva;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS simulation_impact_edge;
DROP TABLE IF EXISTS simulation_impact_node;
DROP TABLE IF EXISTS simulation_run;
DROP TABLE IF EXISTS sankey_link;
DROP TABLE IF EXISTS sankey_node;
DROP TABLE IF EXISTS node_detail_snapshot;
DROP TABLE IF EXISTS graph_edge;
DROP TABLE IF EXISTS graph_node;
DROP TABLE IF EXISTS alarm;
DROP TABLE IF EXISTS heatmap_point;
DROP TABLE IF EXISTS kpi_snapshot;
DROP TABLE IF EXISTS trend_point;
DROP TABLE IF EXISTS model_score;
DROP TABLE IF EXISTS auth_token;
DROP TABLE IF EXISTS zone;
DROP TABLE IF EXISTS user_account;

CREATE TABLE user_account (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_account_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_token (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_token_token (token),
  KEY idx_auth_token_user_id (user_id),
  KEY idx_auth_token_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE zone (
  id BIGINT NOT NULL AUTO_INCREMENT,
  zone_code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  label VARCHAR(128) NOT NULL,
  category VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_zone_zone_code (zone_code),
  KEY idx_zone_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kpi_snapshot (
  id BIGINT NOT NULL AUTO_INCREMENT,
  metric_key VARCHAR(64) NOT NULL,
  metric_title VARCHAR(128) NOT NULL,
  value DECIMAL(18,2) NOT NULL,
  unit VARCHAR(32) DEFAULT NULL,
  trend ENUM('up','down') DEFAULT NULL,
  trend_value VARCHAR(32) DEFAULT NULL,
  snapshot_time DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_kpi_snapshot_metric_time (metric_key, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE heatmap_point (
  id BIGINT NOT NULL AUTO_INCREMENT,
  zone_id BIGINT NOT NULL,
  ts_minute DATETIME NOT NULL,
  value INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_heatmap_zone_time (zone_id, ts_minute),
  KEY idx_heatmap_time (ts_minute)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alarm (
  id BIGINT NOT NULL AUTO_INCREMENT,
  level ENUM('warning','danger') NOT NULL,
  content VARCHAR(255) NOT NULL,
  zone_id BIGINT DEFAULT NULL,
  occur_time DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_alarm_level_time (level, occur_time),
  KEY idx_alarm_zone_time (zone_id, occur_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE graph_node (
  id BIGINT NOT NULL AUTO_INCREMENT,
  node_code VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  crowd_level ENUM('safe','warning','danger','normal') NOT NULL,
  current_value INT NOT NULL,
  zone_id BIGINT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_graph_node_code (node_code),
  KEY idx_graph_node_crowd_level (crowd_level),
  KEY idx_graph_node_zone_id (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE graph_edge (
  id BIGINT NOT NULL AUTO_INCREMENT,
  source_node_id BIGINT NOT NULL,
  target_node_id BIGINT NOT NULL,
  edge_type ENUM('flow','influence') DEFAULT NULL,
  value INT NOT NULL,
  label VARCHAR(64) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_graph_edge_source (source_node_id),
  KEY idx_graph_edge_target (target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE node_detail_snapshot (
  id BIGINT NOT NULL AUTO_INCREMENT,
  node_id BIGINT NOT NULL,
  value INT NOT NULL,
  crowd_level ENUM('safe','warning','danger','normal') NOT NULL,
  male_ratio TINYINT DEFAULT NULL,
  female_ratio TINYINT DEFAULT NULL,
  avg_stay_minutes DECIMAL(5,2) DEFAULT NULL,
  snapshot_time DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_node_detail_snapshot_node_time (node_id, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sankey_node (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sankey_node_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sankey_link (
  id BIGINT NOT NULL AUTO_INCREMENT,
  source_id BIGINT NOT NULL,
  target_id BIGINT NOT NULL,
  value INT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sankey_link_source (source_id),
  KEY idx_sankey_link_target (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trend_point (
  id BIGINT NOT NULL AUTO_INCREMENT,
  point_time DATETIME NOT NULL,
  series_type ENUM('history','prediction','lower','upper') NOT NULL,
  value DECIMAL(18,2) NOT NULL,
  scenario VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_trend_point_series_time (series_type, point_time),
  KEY idx_trend_point_time (point_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE model_score (
  id BIGINT NOT NULL AUTO_INCREMENT,
  model_name VARCHAR(64) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  latency DECIMAL(5,2) NOT NULL,
  robustness DECIMAL(5,2) NOT NULL,
  scored_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_model_score_name_time (model_name, scored_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE simulation_run (
  id BIGINT NOT NULL AUTO_INCREMENT,
  node_id BIGINT NOT NULL,
  action ENUM('CLOSE','LIMIT') NOT NULL,
  limit_percent INT DEFAULT NULL,
  run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  impact_message VARCHAR(512) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_simulation_run_node_id (node_id),
  KEY idx_simulation_run_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE simulation_impact_node (
  id BIGINT NOT NULL AUTO_INCREMENT,
  run_id BIGINT NOT NULL,
  node_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_simulation_impact_node_run_id (run_id),
  KEY idx_simulation_impact_node_node_id (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE simulation_impact_edge (
  id BIGINT NOT NULL AUTO_INCREMENT,
  run_id BIGINT NOT NULL,
  edge_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_simulation_impact_edge_run_id (run_id),
  KEY idx_simulation_impact_edge_edge_id (edge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
