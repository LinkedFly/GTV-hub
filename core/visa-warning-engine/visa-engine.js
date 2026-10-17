/**
 * core/visa-warning-engine 签证预警引擎
 * 职责：基于 data/visa-rules 规则集，对 入境 / 中转 做签证类型校验，
 *       输出预警级别（ok / caution / warn / info）。
 * 注意：规则集为示例数据，引擎只做判定，不构成出行建议，须以官方信息为准。
 */

const RULES_URL = new URL('../../data/visa-rules/visa-rules.json', import.meta.url);
let _rulesCache = null;

export async function loadVisaRules() {
    if (_rulesCache) return _rulesCache;
    const res = await fetch(RULES_URL);
    if (!res.ok) throw new Error('visa-rules.json 加载失败');
    _rulesCache = (await res.json()).rules;
    return _rulesCache;
}

function levelOf(visa) {
    if (visa === 'visa-free') return 'ok';
    if (visa === 'visa-on-arrival' || visa === 'e-visa') return 'caution';
    if (visa === 'visa-required') return 'warn';
    return 'info'; // unknown 等
}

function wrap(rule) {
    return {
        visa: rule.visa,
        maxDays: rule.maxDays ?? null,
        note: rule.note || '',
        level: levelOf(rule.visa)
    };
}

/**
 * 校验单次入境：destISO 对 nationality 的入境签证
 */
export function checkEntry(rules, nationality, destISO) {
    const dest = rules[destISO];
    if (!dest || !dest.entry) {
        return { visa: 'unknown', maxDays: null, note: `${destISO} 暂无规则，请核实`, level: 'info' };
    }
    const rule = dest.entry[nationality];
    if (!rule) {
        return { visa: 'unknown', maxDays: null, note: `${destISO} 对 ${nationality} 暂无示例规则，请核实`, level: 'info' };
    }
    return wrap(rule);
}

/**
 * 校验整段行程：对每个国际段做 入境/中转 判定，中转时结合驻留时长(transitMaxHours)升级预警
 * @param {object} rules 规则集
 * @param {string} nationality 护照国籍(ISO alpha-2)
 * @param {{segments:Array, layoverHours?:number}} itinerary 行程（来自 itinerary-engine）
 * @returns {Array} warnings: [{type:'entry'|'transit', toCountry|transitCountry, visa, maxDays, note, level, layoverHours?, transitMaxHours?}]
 */
export function checkItinerary(rules, nationality, itinerary) {
    const warnings = [];
    const segs = itinerary?.segments || [];
    const layover = itinerary?.layoverHours;
    segs.forEach((seg, i) => {
        const toISO = seg.to.country;
        if (!toISO) return;
        if (toISO === nationality) return; // 回到本国，无需签证
        const isFinal = i === segs.length - 1;
        if (isFinal) {
            const e = checkEntry(rules, nationality, toISO);
            warnings.push({ type: 'entry', toCountry: toISO, ...e });
        } else {
            // 中转：优先查该中转国的 transit 规则，无则回退 entry
            const dest = rules[toISO];
            const rule = dest?.transit?.[nationality] || dest?.entry?.[nationality];
            const w = {
                type: 'transit',
                transitCountry: toISO,
                ...(rule ? wrap(rule) : { visa: 'unknown', maxDays: null, note: `${toISO} 无中转示例规则，请核实`, level: 'info' })
            };
            // 中转驻留时长判定：超过免过境签窗口 → 升级预警
            const windowHours = rule?.transitMaxHours;
            if (typeof windowHours === 'number' && typeof layover === 'number' && layover > 0) {
                w.layoverHours = layover;
                w.transitMaxHours = windowHours;
                if (layover > windowHours) {
                    w.level = 'warn';
                    w.note = `${w.note || ''}；中转停留 ${layover}h 超过免过境签窗口(≤${windowHours}h)，可能需要(过境/短期)签证`.trim();
                } else {
                    w.level = w.level === 'info' || w.level === 'unknown' ? 'ok' : w.level;
                    w.note = `${w.note || ''}；中转停留 ${layover}h 在 ${windowHours}h 免过境签窗口内`.trim();
                }
            }
            warnings.push(w);
        }
    });
    return warnings;
}
