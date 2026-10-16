# SDD - System Design Document
# GTV-hub Global Trip & Visa Hub

## 1. 项目概述
GTV-hub 面向全球用户的跨国家行程规划系统，支持任意始发国，重点服务入境中国（含西藏、新疆特殊区域通行许可）、小众目的地（佛得角等）。
核心能力：航班方案、中转签证校验、目的地基础信息、领事预警、UNESCO遗产点位、酒店-POI距离计算；移动端优先，预留WebXR/VR扩展。

### 1.1 架构原则
- 模块化、解耦设计；新增功能放入extensions，不改动core核心代码
- 隐私优先：仅使用匿名行程ID；不强制采集护照号等敏感个人信息，自动适配属地法规(GDPR / PIPL)
- 数据源优先选用CC0 / MIT / Apache2.0商用免费公开数据源

## 2. 系统分层
1. Core 核心层：全局ID、元数据引擎、行程引擎、签证&预警引擎（不可随意修改）
2. Modules 业务模块层：可插拔，按需启用
3. Data 静态元数据：CSV/YAML，国家、机场航司、遗产点位、签证规则
4. mobile_hub：移动端H5入口，预留WebXR
5. extensions：未来插件扩展目录（三维地图、高级分析等）

## 3. 模块详细定义
### core
1. id-system：全局唯一ID生成与管理（国家ID / 机场ID / UNESCO点位ID）
2. metadata：联合国国家/行政、货币、时区基础元数据
3. itinerary-engine：行程组合、中转航班逻辑
4. visa-warning-engine：入境/中转签证校验、外交部/使领馆出行预警

### modules
1. map-2d：Leaflet二维地图模块，v1.0主可视化；OSM瓦片，酒店↔遗产距离测算
2. map-3d：CesiumJS三维地图、大圆航班航线，预留扩展
3. poi-calc：Haversine距离计算，两点直线距离
4. subscription：订阅用户管理、订阅看板
5. scenario-repository：用户行程卡点反馈库，沉淀独家场景资产（核心护城河）

### data
- country：联合国国家、行政区划、货币、时区
- airport-airline：IATA机场、航司基础信息
- unesco-heritage：UNESCO世界遗产GeoJSON（坐标、类型、名称）
- visa-rules：各国入境、中转签证规则、特殊区域通行许可（西藏入藏函等）

## 4. 数据源清单（商用免费）
1. UN 联合国国家基础数据集：CC0
2. UNESCO World Heritage 遗产GIS数据：CC0
3. OpenTravelData 机场航司：CC0
4. OpenStreetMap OSM POI/道路瓦片：Open Database License(ODbL，商用允许)
5. 各国使领馆、外交部出行预警公告：公开信息

## 5. 隐私安全规范
- 用户身份：使用匿名行程ID，行程反馈与个人身份解绑
- 按用户护照国籍/访问属地，自动匹配合规策略
- 最小必要原则：不采集证件号，只收集行程必需参数（国籍、出行日期）

## 6. 多端规划
- v1.0：移动端H5优先，二维地图
- v2.0：Cesium三维、航班大圆航线
- v2.1：WebXR，VR眼镜遗产点位漫游

## 7. 版本迭代策略
增量迭代，先上线核心二维地图与基础元数据，后续逐个接入签证引擎、订阅模块，最后三维与VR。