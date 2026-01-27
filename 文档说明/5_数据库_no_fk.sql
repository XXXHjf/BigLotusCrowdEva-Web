-- CFEVA schema without physical foreign keys
CREATE DATABASE IF NOT EXISTS cfeva
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE cfeva;

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
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  username VARCHAR(64) NOT NULL COMMENT '登录名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_account_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录账户';

CREATE TABLE auth_token (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  user_id BIGINT NOT NULL COMMENT '关联用户id',
  token VARCHAR(512) NOT NULL COMMENT '认证Token',
  expires_at DATETIME NOT NULL COMMENT '过期时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_token_token (token),
  KEY idx_auth_token_user_id (user_id),
  KEY idx_auth_token_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证Token持久化';

CREATE TABLE zone (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  zone_code VARCHAR(64) NOT NULL COMMENT '区块编码(前端id)',
  name VARCHAR(128) NOT NULL COMMENT '内部名称',
  label VARCHAR(128) NOT NULL COMMENT '展示名称',
  category VARCHAR(64) DEFAULT NULL COMMENT '区块分类',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_zone_zone_code (zone_code),
  KEY idx_zone_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='场馆区块';

CREATE TABLE kpi_snapshot (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  metric_key VARCHAR(64) NOT NULL COMMENT '指标key',
  metric_title VARCHAR(128) NOT NULL COMMENT '指标标题',
  value DECIMAL(18,2) NOT NULL COMMENT '指标数值',
  unit VARCHAR(32) DEFAULT NULL COMMENT '单位',
  trend ENUM('up','down') DEFAULT NULL COMMENT '趋势方向',
  trend_value VARCHAR(32) DEFAULT NULL COMMENT '趋势幅度',
  snapshot_time DATETIME NOT NULL COMMENT '快照时间',
  PRIMARY KEY (id),
  KEY idx_kpi_snapshot_metric_time (metric_key, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='KPI快照';

CREATE TABLE heatmap_point (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  zone_id BIGINT NOT NULL COMMENT '区块id',
  ts_minute DATETIME NOT NULL COMMENT '时间点(分钟)',
  value INT NOT NULL COMMENT '人数/拥堵指数',
  PRIMARY KEY (id),
  KEY idx_heatmap_zone_time (zone_id, ts_minute),
  KEY idx_heatmap_time (ts_minute)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热力矩阵点';

CREATE TABLE alarm (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  level ENUM('warning','danger') NOT NULL COMMENT '告警等级',
  content VARCHAR(255) NOT NULL COMMENT '告警内容',
  zone_id BIGINT DEFAULT NULL COMMENT '区块id',
  occur_time DATETIME NOT NULL COMMENT '发生时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_alarm_level_time (level, occur_time),
  KEY idx_alarm_zone_time (zone_id, occur_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='拥挤告警';

CREATE TABLE graph_node (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  node_code VARCHAR(64) NOT NULL COMMENT '节点编码(前端id)',
  label VARCHAR(128) NOT NULL COMMENT '展示名',
  crowd_level ENUM('safe','warning','danger','normal') NOT NULL COMMENT '拥挤等级',
  current_value INT NOT NULL COMMENT '当前人流量',
  zone_id BIGINT DEFAULT NULL COMMENT '关联区块',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_graph_node_code (node_code),
  KEY idx_graph_node_crowd_level (crowd_level),
  KEY idx_graph_node_zone_id (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='力导向/沙盘节点';

CREATE TABLE graph_edge (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  source_node_id BIGINT NOT NULL COMMENT '源节点id',
  target_node_id BIGINT NOT NULL COMMENT '目标节点id',
  edge_type ENUM('flow','influence') DEFAULT NULL COMMENT '关系类型',
  value INT NOT NULL COMMENT '流量/影响强度',
  label VARCHAR(64) DEFAULT NULL COMMENT '展示标签',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_graph_edge_source (source_node_id),
  KEY idx_graph_edge_target (target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='力导向/沙盘边';

CREATE TABLE node_detail_snapshot (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  node_id BIGINT NOT NULL COMMENT '节点id',
  value INT NOT NULL COMMENT '当前人流量',
  crowd_level ENUM('safe','warning','danger','normal') NOT NULL COMMENT '拥挤等级',
  male_ratio TINYINT DEFAULT NULL COMMENT '男性占比0-100',
  female_ratio TINYINT DEFAULT NULL COMMENT '女性占比0-100',
  avg_stay_minutes DECIMAL(5,2) DEFAULT NULL COMMENT '平均停留分钟',
  snapshot_time DATETIME NOT NULL COMMENT '快照时间',
  PRIMARY KEY (id),
  KEY idx_node_detail_snapshot_node_time (node_id, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点详情快照';

CREATE TABLE sankey_node (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  name VARCHAR(128) NOT NULL COMMENT '节点名称',
  category VARCHAR(64) DEFAULT NULL COMMENT '节点分类',
  PRIMARY KEY (id),
  UNIQUE KEY uk_sankey_node_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='桑基节点';

CREATE TABLE sankey_link (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  source_id BIGINT NOT NULL COMMENT '源节点id',
  target_id BIGINT NOT NULL COMMENT '目标节点id',
  value INT NOT NULL COMMENT '流量值',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_sankey_link_source (source_id),
  KEY idx_sankey_link_target (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='桑基连线';

CREATE TABLE trend_point (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  point_time DATETIME NOT NULL COMMENT '时间点',
  series_type ENUM('history','prediction','lower','upper') NOT NULL COMMENT '序列类型',
  value DECIMAL(18,2) NOT NULL COMMENT '人流量',
  scenario VARCHAR(64) DEFAULT NULL COMMENT '场景标签',
  PRIMARY KEY (id),
  KEY idx_trend_point_series_time (series_type, point_time),
  KEY idx_trend_point_time (point_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='趋势点';

CREATE TABLE model_score (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  model_name VARCHAR(64) NOT NULL COMMENT '模型名称',
  accuracy DECIMAL(5,2) NOT NULL COMMENT '准确性',
  latency DECIMAL(5,2) NOT NULL COMMENT '响应速度',
  robustness DECIMAL(5,2) NOT NULL COMMENT '抗噪能力',
  scored_at DATETIME NOT NULL COMMENT '评分时间',
  PRIMARY KEY (id),
  KEY idx_model_score_name_time (model_name, scored_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型评分';

CREATE TABLE simulation_run (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  node_id BIGINT NOT NULL COMMENT '目标节点id',
  action ENUM('CLOSE','LIMIT') NOT NULL COMMENT '操作类型',
  limit_percent INT DEFAULT NULL COMMENT '限流比例50-200',
  run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  impact_message VARCHAR(512) DEFAULT NULL COMMENT '影响说明',
  PRIMARY KEY (id),
  KEY idx_simulation_run_node_id (node_id),
  KEY idx_simulation_run_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='沙盘推演记录';

CREATE TABLE simulation_impact_node (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  run_id BIGINT NOT NULL COMMENT '推演记录id',
  node_id BIGINT NOT NULL COMMENT '受影响节点id',
  PRIMARY KEY (id),
  KEY idx_simulation_impact_node_run_id (run_id),
  KEY idx_simulation_impact_node_node_id (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推演影响节点';

CREATE TABLE simulation_impact_edge (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  run_id BIGINT NOT NULL COMMENT '推演记录id',
  edge_id BIGINT NOT NULL COMMENT '受影响边id',
  PRIMARY KEY (id),
  KEY idx_simulation_impact_edge_run_id (run_id),
  KEY idx_simulation_impact_edge_edge_id (edge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推演影响边';
