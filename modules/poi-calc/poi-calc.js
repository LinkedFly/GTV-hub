/**
 * poi-calc 公共地理算法库
 * 供 map-2d / map-3d(Cesium) 复用
 * 纯函数、零依赖，可在浏览器 / Node 中直接使用
 */

/**
 * Haversine 大圆距离计算，返回km
 * @param {number} lat1 起点纬度
 * @param {number} lon1 起点经度
 * @param {number} lat2 终点纬度
 * @param {number} lon2 终点经度
 * @returns {string} 距离，保留2位小数
 */
export function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球平均半径 km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
        * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

/**
 * 大圆航线采样，生成航线坐标数组
 * @param {number} lat1 起点纬度
 * @param {number} lon1 起点经度
 * @param {number} lat2 终点纬度
 * @param {number} lon2 终点经度
 * @param {number} steps 采样分段数量（越大越平滑）
 * @returns {Array<[number,number]>} [[lat,lng],...]，含起止点共 steps+1 个点
 */
export function greatCirclePoints(lat1, lon1, lat2, lon2, steps = 60) {
    const rad = Math.PI / 180;
    lat1 *= rad; lon1 *= rad;
    lat2 *= rad; lon2 *= rad;

    // 起点到终点的大圆圆心角（弧度）
    const d = 2 * Math.asin(Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
    ));

    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const f = i / steps; // 0 -> 1 线性插值
        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);

        // 球面线性插值（slerp）
        const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
        const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lng = Math.atan2(y, x);
        pts.push([lat / rad, lng / rad]);
    }
    return pts;
}
