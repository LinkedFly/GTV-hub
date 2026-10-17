/**
 * core/metadata 元数据引擎
 * 统一加载并查询 国家 / 机场 元数据，供各模块（地图、行程、签证、订阅）复用。
 * 数据源（相对本模块定位，任何页面引入都指向同一份数据）：
 *   - data/country/countries.json
 *   - data/airport-airline/airports.json
 */

const COUNTRY_URL = new URL('../../data/country/countries.json', import.meta.url);
const AIRPORT_URL = new URL('../../data/airport-airline/airports.json', import.meta.url);
const AIRLINE_URL = new URL('../../data/airport-airline/airlines.json', import.meta.url);

let _cache = null;

/**
 * 加载元数据（带缓存）
 * @returns {Promise<{countries:Object, airports:Array, airlines:Array}>}
 */
export async function loadMetadata() {
    if (_cache) return _cache;
    const [cRes, aRes, lRes] = await Promise.all([
        fetch(COUNTRY_URL).then(r => { if (!r.ok) throw new Error('countries.json 加载失败'); return r.json(); }),
        fetch(AIRPORT_URL).then(r => { if (!r.ok) throw new Error('airports.json 加载失败'); return r.json(); }),
        fetch(AIRLINE_URL).then(r => { if (!r.ok) throw new Error('airlines.json 加载失败'); return r.json(); })
    ]);
    _cache = { countries: cRes.countries, airports: aRes.airports, airlines: lRes.airlines };
    return _cache;
}

/** 按 ISO alpha-2 查国家 */
export function getCountry(md, code) {
    if (!md || !code) return null;
    return md.countries[code] || null;
}

/** 按 IATA 查机场 */
export function getAirport(md, iata) {
    if (!md || !iata) return null;
    return md.airports.find(a => a.iata === iata) || null;
}

/** 按 IATA（2位航司码）查航空公司 */
export function getAirline(md, code) {
    if (!md || !code) return null;
    return md.airlines.find(a => a.iata === code) || null;
}

/**
 * 将一条 place 描述（可能来自 routes.json）解析为完整信息
 * place: { iata?, city?, country?, tz?, lat?, lon? }
 * 返回 { iata, city, country, countryName, continent, tz, currency, lat, lon }
 */
export function enrichPlace(md, place = {}) {
    const country = getCountry(md, place.country);
    const airport = getAirport(md, place.iata);
    const city = place.city || airport?.city || country?.name_zh || '';
    return {
        iata: place.iata || null,
        city,
        country: place.country || airport?.country || null,
        countryName: country?.name_zh || null,
        continent: country?.continent || null,
        tz: place.tz || airport?.tz || country?.tz || null,
        currency: country?.currency || null,
        lat: place.lat ?? airport?.lat ?? null,
        lon: place.lon ?? airport?.lon ?? null
    };
}
