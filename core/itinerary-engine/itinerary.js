/**
 * core/itinerary-engine 行程引擎
 * 职责：基于国家/机场元数据，生成多段行程方案（直达 + 经主要枢纽中转），
 *       计算每段大圆距离与总距离，标记国际中转点，供签证引擎与 UI 使用。
 * 依赖：core/metadata（元数据）、modules/poi-calc（地理算法）
 */

import { loadMetadata, getAirport } from '../metadata/metadata.js';
import { calcDistance } from '../../modules/poi-calc/poi-calc.js';

// 全球主要中转枢纽（IATA），可按业务扩展
const DEFAULT_HUBS = ['DXB', 'SIN', 'HKG', 'DOH', 'IST', 'FRA', 'CDG', 'ICN', 'PEK'];

/**
 * 生成一段行程
 */
function makeSegment(a, b) {
    return {
        from: { iata: a.iata, city: a.city, country: a.country },
        to: { iata: b.iata, city: b.city, country: b.country },
        km: +calcDistance(a.lat, a.lon, b.lat, b.lon)
    };
}

function isInternational(seg) {
    return seg.from.country !== seg.to.country;
}

/**
 * 生成 起→止 的行程方案
 * @param {string} depIata 出发机场 IATA
 * @param {string} arrIata 到达机场 IATA
 * @param {string[]} [hubs] 候选中转枢纽 IATA
 * @param {number} [layoverHours] 中转驻留时长（小时），供签证引擎判定中转窗口
 * @returns {{dep:object,arr:object,options:Array}}
 */
export function buildItineraries(md, depIata, arrIata, hubs = DEFAULT_HUBS, layoverHours = 3) {
    const dep = getAirport(md, depIata);
    const arr = getAirport(md, arrIata);
    if (!dep) return { error: `出发机场 ${depIata} 未收录` };
    if (!arr) return { error: `到达机场 ${arrIata} 未收录` };

    const options = [];

    // 直达方案
    const direct = makeSegment(dep, arr);
    options.push({
        via: '直达',
        viaIata: null,
        segments: [direct],
        totalKm: +direct.km.toFixed(2),
        international: isInternational(direct),
        transitCountry: null,
        layoverHours: 0
    });

    // 经枢纽中转方案
    const seenHub = new Set();
    for (const h of hubs) {
        if (h === depIata || h === arrIata) continue;
        if (seenHub.has(h)) continue;
        const hub = getAirport(md, h);
        if (!hub) continue;
        seenHub.add(h);
        const s1 = makeSegment(dep, hub);
        const s2 = makeSegment(hub, arr);
        s1.to.layoverHours = layoverHours; // 在枢纽处的驻留时长
        options.push({
            via: `经 ${h}（${hub.city}）中转`,
            viaIata: h,
            segments: [s1, s2],
            totalKm: +(s1.km + s2.km).toFixed(2),
            international: isInternational(s1) || isInternational(s2),
            transitCountry: isInternational(s1) ? s1.to.country : null,
            layoverHours: layoverHours
        });
    }

    // 按总距离升序
    options.sort((a, b) => a.totalKm - b.totalKm);
    return { dep, arr, options };
}

export { loadMetadata };
