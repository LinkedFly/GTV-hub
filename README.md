# GTV-hub
Global Trip & Visa Hub
> 全球商旅行程智能规划平台，面向全球出境/入境商旅用户。
> 功能：多始发地航班方案推荐、中转/入境签证校验、目的地基础信息、外交部出行预警、UNESCO世界遗产点位、点位距离测算；支持移动端H5，预留Cesium三维地图、WebXR VR可视化扩展。

## 核心特点
1. 模块化架构，可增量迭代，低耦合
2. 数据来源：联合国国家数据、UNESCO世界遗产、OpenTravelData、OpenStreetMap
3. 隐私策略：最小化采集，匿名行程ID，不强制存储护照号等敏感信息，适配GDPR / 中国个人信息保护法
4. 底层开源组件全部支持商用授权(MIT/Apache2.0/CC0)

## 模块清单
- core：核心引擎（元数据、行程、签证预警、全局ID）
- modules：可插拔业务模块
- data：静态元数据仓库（yaml/csv）
- mobile_hub：移动端H5，预留WebXR VR接口
- extensions：后续扩展插件

## 当前版本计划
- v1.0：2D地图、基础国家元数据、UNESCO点位、距离计算
- v1.1：签证引擎、出行预警
- v1.2：移动端H5订阅看板、用户场景沉淀库
- v2.0：Cesium三维地图，大圆航线、WebXR VR漫游