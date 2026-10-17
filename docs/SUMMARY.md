# GTV-hub 阶段性小结汇报

> **全球商旅行程智能规划平台** · 模块化单页应用 · 本地可运行（`python serve.py 8023`）
> 10 次提交已全部推送 GitHub `main` · 汇报日期：2026-10-17

---

## 一、整体架构（分层）

```
GTV-hub
├── index.html                 导航首页（串联全部模块）
├── serve.py                   本地静态服务器 + 受限 POST 保存端点
├── libs/                      本地化前端库（Leaflet / Cesium，摆脱外网 CDN）
│
├── data/                      数据层（纯 JSON，改数据全站生效）
│   ├── country/countries.json          250 国
│   ├── airport-airline/airports.json   1151 机场
│   ├── airport-airline/airlines.json    32 航司
│   ├── routes.json                      12 条全球大圆航线 + 2 个 POI
│   ├── visa-rules/visa-rules.json       11 目的国 / 15 条规则
│   └── flight-schedules/schedules.json   5 条航班时刻（占位）
│
├── core/                      核心引擎层（业务逻辑，全模块复用）
│   ├── metadata/metadata.js            元数据引擎（loadMetadata / getCountry / getAirport / getAirline / enrichPlace）
│   ├── itinerary-engine/itinerary.js   行程引擎（直达 + 9 大枢纽中转，距离升序，含中转驻留时长）
│   └── visa-warning-engine/visa-engine.js  签证预警引擎（入境/中转判定 + 中转驻留时长升级预警）
│
└── modules/                   业务模块层（可视化 + 交互）
    ├── map-2d/                2D 地图（Leaflet·卫星底图，多航线叠加、航线动画）
    ├── map-3d/                3D 地球（Cesium·OSM，全球大圆立体叠加）
    ├── planner/               行程规划器（行程+签证+航班+行程单导出）
    ├── schedule/              航班时刻页（占位示例，待接真实源）
    ├── subscription/          订阅看板（移动端 H5）
    ├── visa-rules/            签证规则可编排表格（增删改+持久化）
    ├── airlines/              航空公司知识库（检索/联盟/国家筛选）
    └── poi-calc/              公共地理算法（大圆距离/航线采样点）
```

> 注：`modules/scenario-repository`、`core/id-system` 为脚手架遗留的**空目录**，暂无文件。

---

## 二、各模块功能 + 全量数据数量

| 模块 / 引擎 | 实现功能 | 全量数据 |
|---|---|---|
| **元数据引擎** | 统一加载国家/机场/航司，`enrichPlace` 丰富端点（中文名/洲/货币/时区/机场全名） | 250 国 · 1151 机场 · 32 航司 |
| **行程引擎** | 直达 + 9 大枢纽中转方案，总距离升序，标记国际段/中转国，支持中转驻留时长 | 候选中转枢纽 9 个（DXB/SIN/HKG/DOH/IST/FRA/CDG/ICN/PEK） |
| **签证预警引擎** | 按国籍逐段判定入境/中转；中转超免过境签窗口自动升级预警 | 11 目的国 · 15 条规则（含 FR/DE/TR/QA/SG/KR/HK 中转窗口） |
| **2D 地图** | Esri 卫星底图、多航线叠加（调色板）、大圆距离、端点元数据弹窗、航线动画 | 12 条全球大圆航线 + 2 个 POI |
| **3D 地球** | Cesium 椭球地形、全球 12 条大圆立体叠加、端点标签（含时区/货币/洲） | 12 条全球大圆航线 |
| **行程规划器** | 起止机场下拉（1151）、行程方案、逐段签证、可用航班联动、执飞航司标注、**行程单导出**（.txt/打印PDF） | 1151 机场下拉 · 250 国籍 |
| **航班时刻** | 航线时刻表 + 规划器联动 | 5 条（**全为占位**，标注 placeholder，待接真实源） |
| **订阅看板** | 移动端 H5：当前套餐/用量进度/三档套餐对比/切换 | 3 档套餐 |
| **签证规则编排** | 可增删改表格，POST 持久化写回 visa-rules.json | 11 目的国 / 15 条规则（示例数据） |
| **航司知识库** | 搜索 + 联盟/国家筛选，枢纽解析到城市 | 32 家真实航司（IATA/ICAO/联盟/国家/枢纽） |

---

## 三、数据量汇总

- **250 国家**（ISO3166 + IANA 时区 + 中文名，245 大洲 / 246 货币）
- **1151 大型机场**（含 IATA/全名/城市/ISO/IANA 时区/坐标）
- **32 家航司**（联盟：星空 14 / 天合 7 / 寰宇 7 / 无 4）
- **12 条全球大圆航线**（CAN-SYD、PEK-LHR、HKG-JFK、SIN-LAX、DXB-JNB、DXB-NRT、FRA-GRU、CDG-SYD、IST-JFK、SIN-FRA、LIS-CV、CAN-LIS）
- **11 目的国 / 15 条签证规则**（含中转驻留窗口）
- **5 条航班时刻**（占位，待接真实数据源）
- **2 个 POI**（酒店 / UNESCO 古城）

---

## 四、已完成里程碑

1. ✅ 脚手架 + 2D/3D 地图 + 公共地理算法
2. ✅ 配置抽离（routes.json）+ 元数据层（metadata 引擎）
3. ✅ 元数据全量扩充（250 国 / 30→1151 机场 / 32 航司）
4. ✅ 行程引擎 + 签证引擎 + 订阅看板 + 规划器
5. ✅ 签证规则可编排表格 + 航班时刻模块（占位）
6. ✅ 行程单导出 + 航司×机场联动 + 多航线叠加 + 签证判定细化（中转时长）

---

## 五、当前待办

- 真实航班数据（需飞常准充值或其他数据源）
- 部署上线（EdgeOne 单页 Demo 或 GitHub Pages，已暂缓）

---

*本小结由系统自动采集仓库实际数据生成。*
