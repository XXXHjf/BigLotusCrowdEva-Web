# 重要场所人群疏散可视化分析系统（CFEVA）· MySQL 数据库设计（对齐当前前端需求）

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
用途：登录账户信息与密码哈希。前端登录接口仅需 username/password，对应后端校验。
字段说明：
- `id`：自增主键，用于内部关联。
- `username`：登录名，唯一。
- `password_hash`：密码哈希值，不保存明文。
- `created_at`：创建时间。
- `updated_at`：更新时间。

### auth_token（如需持久化会话）
- `id` BIGINT PK AI
- `user_id` BIGINT NOT NULL FK → user_account(id)
- `token` VARCHAR(512) NOT NULL UNIQUE
- `expires_at` DATETIME NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

索引：INDEX(user_id), INDEX(expires_at)
用途：登录后持久化 Token（与 /auth/login 返回结构一致）。
字段说明：
- `id`：自增主键。
- `user_id`：关联用户（逻辑外键）。
- `token`：认证 Token。
- `expires_at`：过期时间。
- `created_at`：创建时间。

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
用途：场馆区块基础信息，对应前端 Zone。
字段说明：
- `id`：自增主键。
- `zone_code`：前端使用的区块 id（如 zone_1）。
- `name`：系统内部名称。
- `label`：展示名称。
- `category`：区块分类。
- `created_at`：创建时间。
- `updated_at`：更新时间。

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
用途：概览 KPI 快照历史，对应 KpiItem 列表。
字段说明：
- `id`：自增主键。
- `metric_key`：指标 id（如 total_people）。
- `metric_title`：展示标题。
- `value`：指标数值。
- `unit`：单位。
- `trend`：趋势方向。
- `trend_value`：趋势幅度（字符串便于带 %）。
- `snapshot_time`：快照时间。

### heatmap_point
- `id` BIGINT PK AI
- `zone_id` BIGINT NOT NULL FK → zone(id)
- `ts_minute` DATETIME NOT NULL                // 精度到分钟
- `value` INT NOT NULL                         // 人数/拥堵指数

索引：INDEX(zone_id, ts_minute), INDEX(ts_minute)
用途：热力矩阵时间点数据，对应 HeatmapDataPoint。
字段说明：
- `id`：自增主键。
- `zone_id`：关联区块（逻辑外键）。
- `ts_minute`：时间点（分钟粒度）。
- `value`：人数/拥堵指数。

### alarm
- `id` BIGINT PK AI
- `level` ENUM('warning','danger') NOT NULL
- `content` VARCHAR(255) NOT NULL
- `zone_id` BIGINT NULL FK → zone(id)
- `occur_time` DATETIME NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

索引：INDEX(level, occur_time), INDEX(zone_id, occur_time)
用途：拥挤告警记录列表，对应 AlarmItem。
字段说明：
- `id`：自增主键。
- `level`：告警等级。
- `content`：告警描述。
- `zone_id`：关联区块（可空）。
- `occur_time`：发生时间。
- `created_at`：记录创建时间。

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
用途：力导向/沙盘节点基础信息，对应 GraphNode。
字段说明：
- `id`：自增主键。
- `node_code`：前端使用的节点 id（如 cluster_1/zone_1）。
- `label`：展示名。
- `crowd_level`：拥挤等级。
- `current_value`：当前人流量。
- `zone_id`：关联区块（可空）。
- `updated_at`：更新时间。

### graph_edge
- `id` BIGINT PK AI
- `source_node_id` BIGINT NOT NULL FK → graph_node(id)
- `target_node_id` BIGINT NOT NULL FK → graph_node(id)
- `edge_type` ENUM('flow','influence') NULL
- `value` INT NOT NULL                         // 流量/影响强度
- `label` VARCHAR(64) NULL
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：INDEX(source_node_id), INDEX(target_node_id)
用途：力导向/沙盘边信息，对应 GraphEdge。
字段说明：
- `id`：自增主键。
- `source_node_id`：起点节点。
- `target_node_id`：终点节点。
- `edge_type`：关系类型（flow/influence）。
- `value`：流量/影响强度。
- `label`：展示文本。
- `updated_at`：更新时间。

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
用途：节点详情快照历史，对应 NodeDetail。
字段说明：
- `id`：自增主键。
- `node_id`：关联节点。
- `value`：当前人流量。
- `crowd_level`：拥挤等级。
- `male_ratio`：男性占比（0-100）。
- `female_ratio`：女性占比（0-100）。
- `avg_stay_minutes`：平均停留时长。
- `snapshot_time`：快照时间。

### sankey_node
- `id` BIGINT PK AI
- `name` VARCHAR(128) NOT NULL UNIQUE          // 入口A/通道1/区域X/出口
- `category` VARCHAR(64) NULL                  // entrance/channel/area/exit
用途：桑基图节点，对应 SankeyNode。
字段说明：
- `id`：自增主键。
- `name`：节点名称（前端 link 用 name 作为 source/target）。
- `category`：节点分类（入口/通道/区域/出口）。

### sankey_link
- `id` BIGINT PK AI
- `source_id` BIGINT NOT NULL FK → sankey_node(id)
- `target_id` BIGINT NOT NULL FK → sankey_node(id)
- `value` INT NOT NULL
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：INDEX(source_id), INDEX(target_id)
用途：桑基图连线，对应 SankeyLink。
字段说明：
- `id`：自增主键。
- `source_id`：源节点。
- `target_id`：目标节点。
- `value`：流量值。
- `updated_at`：更新时间。

## 5. 趋势研判（置信区间 + 模型评分）
### trend_point
- `id` BIGINT PK AI
- `point_time` DATETIME NOT NULL
- `series_type` ENUM('history','prediction','lower','upper') NOT NULL
- `value` DECIMAL(18,2) NOT NULL
- `scenario` VARCHAR(64) NULL                  // 场景/地点标签

索引：INDEX(series_type, point_time), INDEX(point_time)
用途：趋势与置信区间点位数据，对应 ConfidenceBand。
字段说明：
- `id`：自增主键。
- `point_time`：时间点。
- `series_type`：序列类型（history/prediction/lower/upper）。
- `value`：人流量数值。
- `scenario`：场景/地点标签。

### model_score
- `id` BIGINT PK AI
- `model_name` VARCHAR(64) NOT NULL            // LSTM/Transformer
- `accuracy` DECIMAL(5,2) NOT NULL             // 0-100
- `latency` DECIMAL(5,2) NOT NULL              // 响应速度
- `robustness` DECIMAL(5,2) NOT NULL           // 抗噪能力
- `scored_at` DATETIME NOT NULL

索引：INDEX(model_name, scored_at)
用途：模型竞技场评分数据，对应 ModelScore。
字段说明：
- `id`：自增主键。
- `model_name`：模型名称。
- `accuracy`：准确性评分。
- `latency`：响应速度评分。
- `robustness`：抗噪能力评分。
- `scored_at`：评分时间。

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
用途：沙盘推演操作记录，对应 SimulationRequest/SimulationImpact。
字段说明：
- `id`：自增主键。
- `node_id`：目标节点。
- `action`：操作类型（关闭/限流）。
- `limit_percent`：限流比例（50-200）。
- `run_at`：执行时间。
- `impact_message`：结果说明。

### simulation_impact_node
- `id` BIGINT PK AI
- `run_id` BIGINT NOT NULL FK → simulation_run(id)
- `node_id` BIGINT NOT NULL FK → graph_node(id)

索引：INDEX(run_id), INDEX(node_id)
用途：推演影响到的节点集合。
字段说明：
- `id`：自增主键。
- `run_id`：推演记录 id。
- `node_id`：受影响节点。

### simulation_impact_edge
- `id` BIGINT PK AI
- `run_id` BIGINT NOT NULL FK → simulation_run(id)
- `edge_id` BIGINT NOT NULL FK → graph_edge(id)

索引：INDEX(run_id), INDEX(edge_id)
用途：推演影响到的边集合。
字段说明：
- `id`：自增主键。
- `run_id`：推演记录 id。
- `edge_id`：受影响边。

## 7. 关系概要
- `zone` 一对多 `heatmap_point`，可一对多 `graph_node`，可选关联 `alarm`
- `graph_node` 一对多 `graph_edge`（source/target），一对多 `node_detail_snapshot`，一对多 `simulation_run`
- `sankey_node` 一对多 `sankey_link`（source/target）
- `simulation_run` 一对多 `simulation_impact_node` / `simulation_impact_edge`
- 时间序列：`trend_point`、`model_score`、`kpi_snapshot`、`heatmap_point` 依据时间与标签查询
