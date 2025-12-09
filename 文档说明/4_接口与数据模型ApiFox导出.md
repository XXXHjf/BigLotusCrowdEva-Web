# 大莲花

根据《BigLotus CrowdEva · 后端数据类型设计》整理的接口规范，本系统用于对场馆人流进行监控、预测和应急推演，可直接导入 Apifox 使用。字段与原始 TypeScript 定义保持一致。

Base URLs:

# Authentication

* API Key (apikey-header-token)

    - Parameter Name: **token**, in: header. 

    除了 POST /auth/login 这个接口，其他接口都需要 token。

    **token 的来源和用法**

    - `token` 字段的值就是 `POST /auth/login` 返回的 `data.token`。
    - 需要放到请求头：`token: <data.token>`。
    - `expiresAt` 过期后的行为（再调一次 login 换新的 token ）。

    **错误码说明（特别是与权限相关的）**

    成功：HTTP 200，`code = 0`，`success = true`

    失败：HTTP = 4xx/5xx，`code = HTTP 状态码`，`success = false`

# Auth

## POST 用户登录

POST /auth/login

使用用户名和密码进行登录，返回认证 Token 信息。

> Body 请求参数

```json
{
  "username": "string",
  "password": "pa$$word"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[AuthRequest](#schemaauthrequest)| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "token": "string",
    "expiresAt": "string"
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|登录成功，返回认证 Token|[AuthTokenResponse](#schemaauthtokenresponse)|

# Overview

## GET 概览 KPI 列表

GET /overview/kpis

获取概览页展示的 KPI 卡片列表（`KpiItem[]`）。

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "id": "string",
      "title": "string",
      "value": 0,
      "unit": "string",
      "trend": "up",
      "trendValue": "string"
    }
  ],
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回 KPI 列表|[KpiItemListResponse](#schemakpiitemlistresponse)|

## GET 热力矩阵数据

GET /overview/heatmap

获取热力矩阵数据点列表（`HeatmapDataPoint[]`）， 查询条件为时间范围 `TimeRange`，以查询参数形式传递。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|startTime|query|string| 是 |起始时间（ISO8601，含时区，例如 2025-01-01T08:00:00+08:00）|
|endTime|query|string| 是 |结束时间（ISO8601，含时区）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "zoneId": "string",
      "time": "string",
      "value": 0
    }
  ],
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回热力矩阵数据点列表|[HeatmapDataPointListResponse](#schemaheatmapdatapointlistresponse)|

## GET 告警列表

GET /overview/alarms

分页获取拥挤告警列表，对应 `PaginationResult<AlarmItem>`。 分页参数符合 `PaginationRequest` 定义（page / pageSize）。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|page|query|integer| 是 |页码，从 1 开始。|
|pageSize|query|integer| 是 |每页条数，大于 0。|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "list": [
      {
        "id": "string",
        "level": "[",
        "content": "string",
        "time": "string",
        "zoneId": "string"
      }
    ],
    "total": 0,
    "page": 0,
    "pageSize": 0
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回告警记录分页结果|[AlarmItemPageResponse](#schemaalarmitempageresponse)|

# Monitor

## GET 聚类监控力导向图

GET /monitor/graph

获取当前人流聚类的力导向图数据，对应 `GraphData`。

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {
        "id": "string",
        "label": "string",
        "value": 0,
        "level": "["
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string",
        "target": "string",
        "value": 0,
        "type": "["
      }
    ]
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回力导向图节点和边数据|[GraphDataResponse](#schemagraphdataresponse)|

## GET 节点详情

GET /monitor/node/{id}

根据节点 ID 获取节点详情，对应 `NodeDetail`。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |力导向图节点 ID（GraphNode.id）。|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": "string",
    "label": "string",
    "value": 0,
    "level": "safe",
    "maleRatio": 0,
    "femaleRatio": 0,
    "avgStayMinutes": 0
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回节点详情|[NodeDetailResponse](#schemanodedetailresponse)|

## GET 桑基流向数据

GET /monitor/sankey

获取人流在不同区域之间的流向数据，对应 `SankeyData`。 可选 nodeId 用于过滤与某节点相关的流向。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|nodeId|query|string| 否 |可选节点 ID，若提供则返回与该节点关联的流向信息。|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {
        "name": "string"
      }
    ],
    "links": [
      {
        "source": "string",
        "target": "string",
        "value": 0
      }
    ]
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回桑基图数据|[SankeyDataResponse](#schemasankeydataresponse)|

# Prediction

## GET 人流预测置信区间

GET /prediction/confidence

获取人流趋势的置信区间数据，对应 `ConfidenceBand`。 查询条件为时间范围 `TimeRange`。

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|startTime|query|string| 是 |起始时间（ISO8601，含时区）|
|endTime|query|string| 是 |结束时间（ISO8601，含时区）|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "history": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "prediction": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "lowerBound": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "upperBound": [
      {
        "time": "string",
        "value": 0
      }
    ]
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回人流趋势与置信区间数据|[ConfidenceBandResponse](#schemaconfidencebandresponse)|

## GET 模型竞技场评分

GET /prediction/models

获取模型竞技场数据，对应 `ModelArenaData`， 包含多个模型在不同维度上的评分。

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "models": [
      {
        "name": "string",
        "scores": [
          null,
          null,
          null
        ]
      }
    ]
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回模型竞技场信息|[ModelArenaDataResponse](#schemamodelarenadataresponse)|

# Simulation

## GET 应急沙盘节点网络

GET /simulation/graph

获取应急沙盘使用的节点与边网络图，对应 `SimulationGraph`。

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {}
    ],
    "edges": [
      {}
    ]
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|返回沙盘网络图数据|[SimulationGraphResponse](#schemasimulationgraphresponse)|

## POST 运行应急推演操作

POST /simulation/run

对指定节点执行关闭或限流操作，请求体为 `SimulationRequest`， 返回推演结果 `SimulationImpact`。

> Body 请求参数

```json
{
  "nodeId": "string",
  "action": "CLOSE",
  "limitPercent": 50
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[SimulationRequest](#schemasimulationrequest)| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "impactedNodes": [
      "string"
    ],
    "impactedEdges": [
      "string"
    ],
    "message": "string",
    "graph": {
      "nodes": [
        null
      ],
      "edges": [
        null
      ]
    }
  },
  "success": true
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|推演执行成功，返回影响结果|[SimulationImpactResponse](#schemasimulationimpactresponse)|

# 数据模型

<h2 id="tocS_ApiResponse">ApiResponse</h2>

<a id="schemaapiresponse"></a>
<a id="schema_ApiResponse"></a>
<a id="tocSapiresponse"></a>
<a id="tocsapiresponse"></a>

```json
{
  "code": 0,
  "message": "string",
  "data": null,
  "success": true
}

```

标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|true|none||业务状态码，0 表示成功，其它为错误码。|
|message|string|true|none||人类可读的提示信息。|
|data|null|false|none||业务数据载体，具体结构由各具体 *XxxResponse* 的 data 字段定义。|
|success|boolean|true|none||code === 0 时为 true，其余为 false|

<h2 id="tocS_PaginationResult_AlarmItem">PaginationResult_AlarmItem</h2>

```json
{
  "list": [
    {
      "id": "string",
      "level": "warning",
      "content": "string",
      "time": "string",
      "zoneId": "string"
    }
  ],
  "total": 0,
  "page": 0,
  "pageSize": 0
}
```

告警列表的分页结果，等价于 PaginationResult<AlarmItem>。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|list|[[AlarmItem](#schemaalarmitem)]|true|none||当前页的告警记录列表。|
|total|integer|true|none||满足条件的记录总数。|
|page|integer|true|none||当前页码。|
|pageSize|integer|true|none||当前每页条数。|

<h2 id="tocS_AuthRequest">AuthRequest</h2>

```json
{
  "username": "string",
  "password": "pa$$word"
}
```

登录请求体，包含用户名和密码。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||登录用户名。|
|password|string(password)|true|none||登录密码（按后端约定加密或明文）。|

<h2 id="tocS_AuthToken">AuthToken</h2>

```json
{
  "token": "string",
  "expiresAt": "string"
}
```

登录成功后返回的认证 Token 信息。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|token|string|true|none||认证令牌（JWT / Session Id）。|
|expiresAt|string|true|none||令牌过期时间（ISO8601）。|

<h2 id="tocS_KpiItem">KpiItem</h2>

```json
{
  "id": "string",
  "title": "string",
  "value": 0,
  "unit": "string",
  "trend": "up",
  "trendValue": "string"
}
```

概览页 KPI 卡片项。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string|true|none||唯一标识，如 total_people。|
|title|string|true|none||KPI 标题。|
|value|number|true|none||KPI 数值。|
|unit|string¦null|false|none||数值单位（如 人 / 分钟）。|
|trend|string¦null|false|none||趋势方向。|
|trendValue|string¦null|false|none||趋势幅度，字符串便于携带 % 符号（如 "+12%"）。|

#### 枚举值

|属性|值|
|---|---|
|trend|up|
|trend|down|

<h2 id="tocS_HeatmapDataPoint">HeatmapDataPoint</h2>

```json
{
  "zoneId": "string",
  "time": "string",
  "value": 0
}
```

热力矩阵中的单个数据点。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|zoneId|string|true|none||对应 Zone.id。|
|time|string|true|none||时间点（ISO8601，精度到分钟）。|
|value|number|true|none||人数或拥堵指数。|

<h2 id="tocS_AlarmLevel">AlarmLevel</h2>

```json
"warning"
```

告警等级。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|string|false|none||告警等级。|

#### 枚举值

|属性|值|
|---|---|
|*anonymous*|warning|
|*anonymous*|danger|

<h2 id="tocS_AlarmItem">AlarmItem</h2>

```json
{
  "id": "string",
  "level": "warning",
  "content": "string",
  "time": "string",
  "zoneId": "string"
}
```

告警列表项。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string|true|none||告警唯一标识。|
|level|[AlarmLevel](#schemaalarmlevel)|true|none||告警等级。|
|content|string|true|none||告警描述。|
|time|string|true|none||告警发生时间（ISO8601）。|
|zoneId|string¦null|false|none||可选关联的区块 ID。|

<h2 id="tocS_CrowdLevel">CrowdLevel</h2>

```json
"safe"
```

人群拥堵等级。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|string|false|none||人群拥堵等级。|

#### 枚举值

|属性|值|
|---|---|
|*anonymous*|safe|
|*anonymous*|warning|
|*anonymous*|danger|
|*anonymous*|normal|

<h2 id="tocS_GraphNode">GraphNode</h2>

```json
{
  "id": "string",
  "label": "string",
  "value": 0,
  "level": "safe"
}
```

力导向图中的节点，表示一个聚类/节点。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string|true|none||聚类/节点 id。|
|label|string|true|none||展示名。|
|value|number|true|none||当前人流量。|
|level|[CrowdLevel](#schemacrowdlevel)|true|none||人群拥堵等级。|

<h2 id="tocS_GraphEdge">GraphEdge</h2>

```json
{
  "id": "string",
  "source": "string",
  "target": "string",
  "value": 0,
  "type": "flow"
}
```

力导向图中的边，表示节点之间的流量或影响关系。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string|true|none||边的唯一标识。|
|source|string|true|none||源节点 ID（GraphNode.id）。|
|target|string|true|none||目标节点 ID（GraphNode.id）。|
|value|number|true|none||流量强度。|
|type|string¦null|false|none||边类型：流向或影响。|

#### 枚举值

|属性|值|
|---|---|
|type|flow|
|type|influence|

<h2 id="tocS_GraphData">GraphData</h2>

```json
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "value": 0,
      "level": "safe"
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "value": 0,
      "type": "flow"
    }
  ]
}
```

力导向图整体数据结构。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|nodes|[[GraphNode](#schemagraphnode)]|true|none||节点列表。|
|edges|[[GraphEdge](#schemagraphedge)]|true|none||边列表。|

<h2 id="tocS_NodeDetail">NodeDetail</h2>

```json
{
  "id": "string",
  "label": "string",
  "value": 0,
  "level": "safe",
  "maleRatio": 0,
  "femaleRatio": 0,
  "avgStayMinutes": 0
}
```

节点详情扩展信息。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string|true|none||节点 ID（GraphNode.id）。|
|label|string|true|none||节点展示名。|
|value|number|true|none||当前人流量。|
|level|[CrowdLevel](#schemacrowdlevel)|true|none||人群拥堵等级。|
|maleRatio|number¦null|false|none||男性比例（0-100）。|
|femaleRatio|number¦null|false|none||女性比例（0-100）。|
|avgStayMinutes|number¦null|false|none||平均停留时长（分钟）。|

<h2 id="tocS_SankeyNode">SankeyNode</h2>

```json
{
  "name": "string"
}
```

桑基图节点。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|name|string|true|none||节点名称。|

<h2 id="tocS_SankeyLink">SankeyLink</h2>

```json
{
  "source": "string",
  "target": "string",
  "value": 0
}
```

桑基图连线，表示从 source 到 target 的流量。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|source|string|true|none||源节点名称（SankeyNode.name）。|
|target|string|true|none||目标节点名称（SankeyNode.name）。|
|value|number|true|none||流量数值。|

<h2 id="tocS_SankeyData">SankeyData</h2>

```json
{
  "nodes": [
    {
      "name": "string"
    }
  ],
  "links": [
    {
      "source": "string",
      "target": "string",
      "value": 0
    }
  ]
}
```

桑基图整体数据结构。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|nodes|[[SankeyNode](#schemasankeynode)]|true|none||节点列表。|
|links|[[SankeyLink](#schemasankeylink)]|true|none||连线列表。|

<h2 id="tocS_TrendPoint">TrendPoint</h2>

```json
{
  "time": "string",
  "value": 0
}
```

趋势数据点，包含时间与数值。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|time|string|true|none||时间，HH:mm 或完整 ISO8601。|
|value|number|true|none||人流量或相关指标数值。|

<h2 id="tocS_ConfidenceBand">ConfidenceBand</h2>

```json
{
  "history": [
    {
      "time": "string",
      "value": 0
    }
  ],
  "prediction": [
    {
      "time": "string",
      "value": 0
    }
  ],
  "lowerBound": [
    {
      "time": "string",
      "value": 0
    }
  ],
  "upperBound": [
    {
      "time": "string",
      "value": 0
    }
  ]
}
```

置信区间数据，用于绘制趋势图及上下界。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|history|[[TrendPoint](#schematrendpoint)]|true|none||历史实测数据点。|
|prediction|[[TrendPoint](#schematrendpoint)]|true|none||预测均值数据点（含连接点）。|
|lowerBound|[[TrendPoint](#schematrendpoint)]|true|none||预测下界数据点。|
|upperBound|[[TrendPoint](#schematrendpoint)]|true|none||预测上界数据点。|

<h2 id="tocS_ModelScore">ModelScore</h2>

```json
{
  "name": "string",
  "scores": [
    100,
    100,
    100
  ]
}
```

单个模型在各维度上的评分（用于雷达图）。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|name|string|true|none||模型名称，如 LSTM / Transformer。|
|scores|[number]|true|none||[准确性, 响应速度, 抗噪能力]，每项 0-100。|

<h2 id="tocS_ModelArenaData">ModelArenaData</h2>

```json
{
  "models": [
    {
      "name": "string",
      "scores": [
        100,
        100,
        100
      ]
    }
  ]
}
```

模型竞技场数据，包含多个模型的评分。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|models|[[ModelScore](#schemamodelscore)]|true|none||参与对比的模型列表（至少两个模型）。|

<h2 id="tocS_SimulationNode">SimulationNode</h2>

```json
{
  "id": "string",
  "label": "string",
  "value": 0,
  "level": "safe",
  "style": "normal"
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[GraphNode](#schemagraphnode)|false|none||力导向图中的节点，表示一个聚类/节点。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||沙盘节点，在 GraphNode 基础上增加样式字段。|
|» style|string¦null|false|none||节点样式，normal 为实线，dashed 为虚线。|

#### 枚举值

|属性|值|
|---|---|
|style|normal|
|style|dashed|

<h2 id="tocS_SimulationEdge">SimulationEdge</h2>

```json
{
  "id": "string",
  "source": "string",
  "target": "string",
  "value": 0,
  "type": "flow",
  "style": "normal"
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[GraphEdge](#schemagraphedge)|false|none||力导向图中的边，表示节点之间的流量或影响关系。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||沙盘边，在 GraphEdge 基础上增加样式字段。|
|» style|string¦null|false|none||边样式，normal 为实线，dashed 为虚线。|

#### 枚举值

|属性|值|
|---|---|
|style|normal|
|style|dashed|

<h2 id="tocS_SimulationGraph">SimulationGraph</h2>

```json
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "value": 0,
      "level": "safe",
      "style": "normal"
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "value": 0,
      "type": "flow",
      "style": "normal"
    }
  ]
}
```

沙盘网络图数据结构。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|nodes|[[SimulationNode](#schemasimulationnode)]|true|none||节点列表。|
|edges|[[SimulationEdge](#schemasimulationedge)]|true|none||边列表。|

<h2 id="tocS_SimulationAction">SimulationAction</h2>

```json
"CLOSE"
```

沙盘推演操作类型。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|string|false|none||沙盘推演操作类型。|

#### 枚举值

|属性|值|
|---|---|
|*anonymous*|CLOSE|
|*anonymous*|LIMIT|

<h2 id="tocS_SimulationRequest">SimulationRequest</h2>

```json
{
  "nodeId": "string",
  "action": "CLOSE",
  "limitPercent": 50
}
```

沙盘推演操作请求体。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|nodeId|string|true|none||选中节点 ID。|
|action|[SimulationAction](#schemasimulationaction)|true|none||沙盘推演操作类型。|
|limitPercent|number¦null|false|none||限流比例，仅在 action = LIMIT 时有效，范围 50-200。|

<h2 id="tocS_SimulationImpact">SimulationImpact</h2>

```json
{
  "impactedNodes": [
    "string"
  ],
  "impactedEdges": [
    "string"
  ],
  "message": "string",
  "graph": {
    "nodes": [
      {
        "id": "string",
        "label": "string",
        "value": 0,
        "level": "[",
        "style": "["
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string",
        "target": "string",
        "value": 0,
        "type": "[",
        "style": "["
      }
    ]
  }
}
```

沙盘推演结果。

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|impactedNodes|[string]|true|none||受到影响的下游节点 ID 列表。|
|impactedEdges|[string]|true|none||受到影响的下游边 ID 列表。|
|message|string|true|none||对本次操作影响的文本说明。|
|graph|[SimulationGraph](#schemasimulationgraph)|true|none||沙盘网络图数据结构。|

<h2 id="tocS_AuthTokenResponse">AuthTokenResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "token": "string",
    "expiresAt": "string"
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||登录接口返回结构，data 为 AuthToken。|
|» data|[AuthToken](#schemaauthtoken)|false|none||登录成功后返回的认证 Token 信息。|

<h2 id="tocS_KpiItemListResponse">KpiItemListResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "id": "string",
      "title": "string",
      "value": 0,
      "unit": "string",
      "trend": "up",
      "trendValue": "string"
    }
  ],
  "success": true
}

```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||概览 KPI 列表返回结构，data 为 KpiItem 数组。|
|» data|[[KpiItem](#schemakpiitem)]|false|none||[概览页 KPI 卡片项。]|

<h2 id="tocS_HeatmapDataPointListResponse">HeatmapDataPointListResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "zoneId": "string",
      "time": "string",
      "value": 0
    }
  ],
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||热力矩阵数据返回结构，data 为 HeatmapDataPoint 数组。|
|» data|[[HeatmapDataPoint](#schemaheatmapdatapoint)]|false|none||[热力矩阵中的单个数据点。]|

<h2 id="tocS_AlarmItemPageResponse">AlarmItemPageResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "list": [
      {
        "id": "string",
        "level": "[",
        "content": "string",
        "time": "string",
        "zoneId": "string"
      }
    ],
    "total": 0,
    "page": 0,
    "pageSize": 0
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||告警列表分页返回结构，data 为 PaginationResult<AlarmItem>。|
|» data|[PaginationResult_AlarmItem](#schemapaginationresult_alarmitem)|false|none||告警列表的分页结果，等价于 PaginationResult<AlarmItem>。|

<h2 id="tocS_GraphDataResponse">GraphDataResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {
        "id": "string",
        "label": "string",
        "value": 0,
        "level": "["
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string",
        "target": "string",
        "value": 0,
        "type": "["
      }
    ]
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||力导向图数据返回结构，data 为 GraphData。|
|» data|[GraphData](#schemagraphdata)|false|none||力导向图整体数据结构。|

<h2 id="tocS_NodeDetailResponse">NodeDetailResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "id": "string",
    "label": "string",
    "value": 0,
    "level": "safe",
    "maleRatio": 0,
    "femaleRatio": 0,
    "avgStayMinutes": 0
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||节点详情返回结构，data 为 NodeDetail。|
|» data|[NodeDetail](#schemanodedetail)|false|none||节点详情扩展信息。|

<h2 id="tocS_SankeyDataResponse">SankeyDataResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {
        "name": "string"
      }
    ],
    "links": [
      {
        "source": "string",
        "target": "string",
        "value": 0
      }
    ]
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||桑基图数据返回结构，data 为 SankeyData。|
|» data|[SankeyData](#schemasankeydata)|false|none||桑基图整体数据结构。|

<h2 id="tocS_ConfidenceBandResponse">ConfidenceBandResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "history": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "prediction": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "lowerBound": [
      {
        "time": "string",
        "value": 0
      }
    ],
    "upperBound": [
      {
        "time": "string",
        "value": 0
      }
    ]
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||置信区间趋势数据返回结构，data 为 ConfidenceBand。|
|» data|[ConfidenceBand](#schemaconfidenceband)|false|none||置信区间数据，用于绘制趋势图及上下界。|

<h2 id="tocS_ModelArenaDataResponse">ModelArenaDataResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "models": [
      {
        "name": "string",
        "scores": [
          null,
          null,
          null
        ]
      }
    ]
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||模型竞技场数据返回结构，data 为 ModelArenaData。|
|» data|[ModelArenaData](#schemamodelarenadata)|false|none||模型竞技场数据，包含多个模型的评分。|

<h2 id="tocS_SimulationGraphResponse">SimulationGraphResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "nodes": [
      {}
    ],
    "edges": [
      {}
    ]
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||沙盘网络图数据返回结构，data 为 SimulationGraph。|
|» data|[SimulationGraph](#schemasimulationgraph)|false|none||沙盘网络图数据结构。|

<h2 id="tocS_SimulationImpactResponse">SimulationImpactResponse</h2>

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "impactedNodes": [
      "string"
    ],
    "impactedEdges": [
      "string"
    ],
    "message": "string",
    "graph": {
      "nodes": [
        null
      ],
      "edges": [
        null
      ]
    }
  },
  "success": true
}
```

### 属性

allOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[ApiResponse](#schemaapiresponse)|false|none||标准响应包装结构，等价于 TypeScript 中的 ApiResponse<T>。|

and

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|object|false|none||沙盘推演结果返回结构，data 为 SimulationImpact。|
|» data|[SimulationImpact](#schemasimulationimpact)|false|none||沙盘推演结果。|

