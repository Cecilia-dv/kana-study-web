(() => {
  const words = window.TEXTBOOK_WORDS;
  const kana = window.KANA;
  const labels = {kr:'假名 → 罗马音', rk:'罗马音 → 假名', kk:'平假名 ↔ 片假名', wz:'日语原文 → 中文', kz:'假名 → 中文', hz:'日语汉字 → 中文', ar:'听写 · 听日语写假名', zw:'中文 → 日语', wr:'汉字 → 假名读音', az:'听发音 → 中文'};
  const normal = s => String(s).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
  const japanese = s => normal(s).replace(/[ァ-ヶ]/g,c => String.fromCharCode(c.charCodeAt(0)-96));
  const split = s => s.split(/[・/／]/).map(x => x.trim()).filter(Boolean);
  const glosses = s => [s, ...s.split(/[，,；;、/]/), ...s.replace(/（[^）]*）|\([^)]*\)/g,'').split(/[，,；;、/]/)];
  // Alternative grading forms are separate from the printed glossary.
  const synonyms = ['那里 那儿 那边','这里 这儿 这边','哪里 哪儿 哪边','哪个 哪一个','卫生间 厕所 洗手间','房间 屋子','行李 行囊','好的 好','安静 清静','著名 有名 出名','有趣的 有趣 好玩','漂亮 好看','干净 清洁','炎热的 炎热 热','寒冷的 寒冷 冷','辛辣的 辛辣 辣','凉爽的 凉爽','饭 米饭','电视机 电视','经常地 经常 常常','稍稍 稍微 一点 一点儿','不要紧 没关系','大家 众人','中国菜 中餐','日本料理 日本菜','室友 舍友','学校食堂 校园食堂','日语系 日本语系','兴趣小组 兴趣社团','总经理 社长'];
  const variants = {'良い':['いい'],'きれい':['綺麗'],'ぼく':['僕'],'まじめ':['真面目'],'にぎやか':['賑やか'],'みんな':['皆'],'ご飯':['御飯'],'休憩室':['休けい室'],'勉強':['勉強する','べんきょうする'],'活動':['活動する','かつどうする'],'見る':['観る']};
  function meaning(word) {
    const base = glosses(word.zh).concat(word.aliases ? word.aliases.split(/[|；;]/) : []).map(normal).filter(Boolean);
    return [...new Set(base.concat(synonyms.map(g => g.split(' ').map(normal)).filter(g => g.some(x => base.includes(x))).flat(), base.filter(x => x.length > 1 && x.endsWith('的')).map(x => x.slice(0,-1))))];
  }
  function shuffle(items) {
    const result = items.slice();
    for (let i=result.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [result[i],result[j]] = [result[j],result[i]];
    }
    return result;
  }
  function answer(item, dir) {
    return ({kr: item.r && item.r[0],rk:item.ja,kk:item.other,wz:item.zh,kz:item.zh,hz:item.zh,az:item.zh,ar:item.reading && split(item.reading)[0],zw:item.ja,wr:item.reading})[dir];
  }
  function question(item, dir, pool) {
    const display = answer(item, dir);
    const normalize = ['zw','wr','ar'].includes(dir) ? japanese : normal;
    const prompt = dir === 'rk' ? item.r[0] : dir === 'zw' ? item.zh : dir === 'az' ? '听音辨义' : dir === 'ar' ? '听完后写下假名' : dir === 'kz' ? item.reading : item.ja;
    const matches = (a,b) => a.some(x => b.includes(x));
    const readings = word => [word.reading, ...split(word.reading)].map(japanese);
    const jaForms = word => [word.ja, ...split(word.reading), ...(variants[word.ja] || [])].map(japanese);
    let forms;
    if (dir === 'kr') forms = item.r;
    if (dir === 'rk') forms = kana.filter(k => k.script === item.script && k.r.includes(prompt)).map(k => normal(k.ja));
    if (dir === 'kk') forms = [normal(display)];
    if (dir === 'wr') forms = pool.filter(w => normal(w.ja) === normal(item.ja)).flatMap(readings);
    if (dir === 'zw') {
      const related = /（[^）]+）/.test(item.zh) ? pool.filter(w => normal(w.zh) === normal(item.zh)) : pool.filter(w => !/（[^）]+）/.test(w.zh) && matches(meaning(item),meaning(w)));
      forms = [item,...related].flatMap(jaForms);
    }
    if (dir === 'ar') forms = [japanese(display)];
    if (dir === 'wz' || dir === 'hz') forms = [item,...pool.filter(w => japanese(w.ja) === japanese(item.ja))].flatMap(meaning);
    if (dir === 'kz') forms = [item,...pool.filter(w => japanese(w.reading) === japanese(item.reading))].flatMap(meaning);
    if (dir === 'az') forms = [item,...pool.filter(w => japanese(split(w.reading)[0]) === japanese(split(item.reading)[0]))].flatMap(meaning);
    const accepts = value => forms.includes(normalize(value));
    function distractor(other) {
      if (item.id === other.id || (item.script && item.script !== other.script)) return false;
      if (['wz','kz','hz','az'].includes(dir)) return !matches(forms,meaning(other));
      if (dir === 'wr') return !matches(forms,readings(other));
      if (dir === 'zw') return !matches(forms,jaForms(other));
      if (dir === 'kr') return !matches(forms,other.r);
      return !accepts(answer(other,dir));
    }
    const candidates = shuffle(pool.filter(distractor)).sort((a,b) => {
      const rank = x => item.script ? Number(x.group === item.group) : Number(x.pos === item.pos)*2 + Number(x.lesson === item.lesson);
      return rank(b)-rank(a);
    });
    const options = [display];
    for (const candidate of candidates) {
      const label = answer(candidate,dir);
      if (label && !options.some(x => normalize(x) === normalize(label))) options.push(label);
      if (options.length === 4) break;
    }
    return {prompt, display, accepts, options: dir !== 'ar' && options.length === 4 ? shuffle(options) : [], audio: item.reading ? split(item.reading)[0] : item.ja};
  }
  function csvParse(text) {
    const rows = [];
    let row = [], field = '', quoted = false, closed = false;
    const source = text.replace(/^\uFEFF/,'');
    for (let i=0; i<source.length; i++) {
      const c=source[i];
      if (quoted) {
        if (c === '"' && source[i+1] === '"') { field += '"'; i++; }
        else if (c === '"') { quoted=false; closed=true; }
        else field += c;
      } else if (c === ',' || c === '\n' || c === '\r') {
        row.push(field); field=''; closed=false;
        if (c !== ',') {
          if (row.some(Boolean)) rows.push(row);
          row=[];
          if (c==='\r' && source[i+1]==='\n') i++;
        }
      } else if (c === '"' && !field && !closed) quoted=true;
      else if (closed || c === '"') throw Error('CSV 引号格式有误');
      else field+=c;
    }
    if (quoted) throw Error('CSV 有未闭合的引号');
    if (row.length || field) {row.push(field); if(row.some(Boolean)) rows.push(row);}
    return rows;
  }
  window.Study = {words,kana,labels,question,shuffle,normal,japanese,csvParse};
})();
