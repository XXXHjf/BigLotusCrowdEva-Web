# BigLotus CrowdEva · MySQL 数据库设计（对齐当前前端需求）

- 字符集：`utf8mb4`，排序规则：`utf8mb4_unicode_ci`
- 存储引擎：`InnoDB`
- 命名：小写加下划线；时间字段优先 `DATETIME`（业务侧确保时区一致）

## 1. 用户与会话
### user_account
- `id` BIGINT PK AI
- `username` VARCHAR(64) NOT NULL UNIQUE
- `password_hash` VARCHAR(255) NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：UNIQUE(username)

### auth_token（如需持久化会话）
- `id` BIGINT PK AI
- `user_id` BIGINT NOT NULL FK → user_account(id)
- `token` VARCHAR(512) NOT NULL UNIQUE
- `expires_at` DATETIME NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

索引：INDEX(user_id), INDEX(expires_at)

## 2. 区域/节点基础
### zone
- `id` BIGINT PK AI
- `zone_code` VARCHAR(64) NOT NULL UNIQUE      // zone_1
- `name` VARCHAR(128) NOT NULL                 // 系统内部名
- `label` VARCHAR(128) NOT NULL                // 展示名
- `category` VARCHAR(64) NULL                  // entrance/hall/corridor/stand/exit
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：UNIQUE(zone_code), INDEX(category)

## 3. 概览（KPI、热力、告警）
### kpi_snapshot（可存快照/历史）
- `id` BIGINT PK AI
- `metric_key` VARCHAR(64) NOT NULL            // total_people 等
- `metric_title` VARCHAR(128) NOT NULL
- `value` DECIMAL(18,2) NOT NULL
- `unit` VARCHAR(32) NULL
- `trend` ENUM('up','down') NULL
- `trend_value` VARCHAR(32) NULL
- `snapshot_time` DATETIME NOT NULL

索引：INDEX(metric_key, snapshot_time)

### heatmap_point
- `id` BIGINT PK AI
- `zone_id` BIGINT NOT NULL FK → zone(id)
- `ts_minute` DATETIME NOT NULL                // 精度到分钟
- `value` INT NOT NULL                         // 人数/拥堵指数

索引：INDEX(zone_id, ts_minute), INDEX(ts_minute)

### alarm
- `id` BIGINT PK AI
- `level` ENUM('warning','danger') NOT NULL
- `content` VARCHAR(255) NOT NULL
- `zone_id` BIGINT NULL FK → zone(id)
- `occur_time` DATETIME NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

索引：INDEX(level, occur_time), INDEX(zone_id, occur_time)

## 4. 聚类监控（力导向 + 详情 + 桑基）
### graph_node
- `id` BIGINT PK AI
- `node_code` VARCHAR(64) NOT NULL UNIQUE      // cluster_1
- `label` VARCHAR(128) NOT NULL
- `crowd_level` ENUM('safe','warning','danger','normal') NOT NULL
- `current_value` INT NOT NULL                 // 当前人流量
- `zone_id` BIGINT NULL FK → zone(id)
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：INDEX(crowd_level), INDEX(zone_id)

### graph_edge
- `id` BIGINT PK AI
- `source_node_id` BIGINT NOT NULL FK → graph_node(id)
- `target_node_id` BIGINT NOT NULL FK → graph_node(id)
- `edge_type` ENUM('flow','influence') NULL
- `value` INT NOT NULL                         // 流量/影响强度
- `label` VARCHAR(64) NULL
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：INDEX(source_node_id), INDEX(target_node_id)

### node_detail_snapshot（可选）
- `id` BIGINT PK AI
- `node_id` BIGINT NOT NULL FK → graph_node(id)
- `value` INT NOT NULL
- `crowd_level` ENUM('safe','warning','danger','normal') NOT NULL
- `male_ratio` TINYINT NULL                    // 0-100
- `female_ratio` TINYINT NULL
- `avg_stay_minutes` DECIMAL(5,2) NULL
- `snapshot_time` DATETIME NOT NULL

索引：INDEX(node_id, snapshot_time)

### sankey_node
- `id` BIGINT PK AI
- `name` VARCHAR(128) NOT NULL UNIQUE          // 入口A/通道1/区域X/出口
- `category` VARCHAR(64) NULL                  // entrance/channel/area/exit

### sankey_link
- `id` BIGINT PK AI
- `source_id` BIGINT NOT NULL FK → sankey_node(id)
- `target_id` BIGINT NOT NULL FK → sankey_node(id)
- `value` INT NOT NULL
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：INDEX(source_id), INDEX(target_id)

## 5. 趋势研判（置信区间 + 模型评分）
### trend_point
- `id` BIGINT PK AI
- `point_time` DATETIME NOT NULL
- `series_type` ENUM('history','prediction','lower','upper') NOT NULL
- `value` DECIMAL(18,2) NOT NULL
- `scenario` VARCHAR(64) NULL                  // 场景/地点标签

索引：INDEX(series_type, point_time), INDEX(point_time)

### model_score
- `id` BIGINT PK AI
- `model_name` VARCHAR(64) NOT NULL            // LSTM/Transformer
- `accuracy` DECIMAL(5,2) NOT NULL             // 0-100
- `latency` DECIMAL(5,2) NOT NULL              // 响应速度
- `robustness` DECIMAL(5,2) NOT NULL           // 抗噪能力
- `scored_at` DATETIME NOT NULL

索引：INDEX(model_name, scored_at)

## 6. 应急沙盘（拓扑 + 推演历史）
拓扑可复用 `graph_node` / `graph_edge`。推演结果单独存历史。

### simulation_run
- `id` BIGINT PK AI
- `node_id` BIGINT NOT NULL FK → graph_node(id)
- `action` ENUM('CLOSE','LIMIT') NOT NULL
- `limit_percent` INT NULL                     // 50-200
- `run_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `impact_message` VARCHAR(512) NULL

索引：INDEX(node_id), INDEX(run_at)

### simulation_impact_node
- `id` BIGINT PK AI
- `run_id` BIGINT NOT NULL FK → simulation_run(id)
- `node_id` BIGINT NOT NULL FK → graph_node(id)

索引：INDEX(run_id), INDEX(node_id)

### simulation_impact_edge
- `id` BIGINT PK AI
- `run_id` BIGINT NOT NULL FK → simulation_run(id)
- `edge_id` BIGINT NOT NULL FK → graph_edge(id)

索引：INDEX(run_id), INDEX(edge_id)

## 7. 关系概要
- `zone` 一对多 `heatmap_point`，可一对多 `graph_node`，可选关联 `alarm`
- `graph_node` 一对多 `graph_edge`（source/target），一对多 `node_detail_snapshot`，一对多 `simulation_run`
- `sankey_node` 一对多 `sankey_link`（source/target）
- `simulation_run` 一对多 `simulation_impact_node` / `simulation_impact_edge`
- 时间序列：`trend_point`、`model_score`、`kpi_snapshot`、`heatmap_point` 依据时间与标签查询
