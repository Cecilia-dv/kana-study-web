(() => {
  'use strict';
  const S = window.Study;
  const $ = id => document.getElementById(id);
  const main = $('main');
  const key = 'kana-notebook-v1';
  const fresh = () => ({version:1,theme:'',edits:{},removed:[],attempts:[],dismissed:{},round:null,prefs:{}});
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  const itemValid = x => object(x) && ['id','ja','reading','zh','pos'].every(k => typeof x[k] === 'string') && x.ja.trim() && x.zh.trim() && Number.isSafeInteger(x.lesson) && x.lesson > 0 && /^[ぁ-ゖァ-ヺー・/／\s]+$/u.test(x.reading);
  function valid(d) {
    return object(d) && d.version === 1 && ['', 'light','dark'].includes(d.theme)
      && object(d.edits) && Object.entries(d.edits).every(([id,w])=>itemValid(w) && id===w.id && /^(w|u)-/.test(id))
      && Array.isArray(d.removed) && d.removed.every(x=>typeof x==='string')
      && Array.isArray(d.attempts) && d.attempts.every(x=>object(x) && typeof x.key==='string' && typeof x.id==='string' && own(S.labels,x.dir) && typeof x.ok==='boolean' && Number.isFinite(x.time))
      && object(d.dismissed) && Object.values(d.dismissed).every(Number.isFinite) && object(d.prefs)
      && (d.round===null || (object(d.round) && typeof d.round.id==='string' && ['kana','words','review'].includes(d.round.kind) && typeof d.round.done==='boolean' && Array.isArray(d.round.items) && d.round.items.length && Number.isInteger(d.round.index) && d.round.index>=0 && d.round.index<d.round.items.length && ['input','choice','card'].includes(d.round.mode) && d.round.items.every(q=>object(q)&&own(S.labels,q.dir)&&object(q.item)&&typeof q.item.id==='string'&& (q.item.script ? S.kana.some(k=>k.id===q.item.id) : itemValid(q.item)) && (q.options===undefined || (Array.isArray(q.options) && [0,4].includes(q.options.length) && q.options.every(x=>typeof x==='string'))) && (!q.result || ['correct','wrong','skip'].includes(q.result.status)))));
  }
  let state=fresh();
  function warn(message) {
    $('storage-warning').hidden=false;
    $('storage-warning').textContent=message;
  }
  try {
    const raw=localStorage.getItem(key);
    if (raw) {
      const data=JSON.parse(raw);
      if (!valid(data)) throw Error();
      state=data;
    }
  } catch { warn('本地记录暂时无法读取。你可以在学习统计页恢复已有备份。'); }
  function save() {
    try { localStorage.setItem(key,JSON.stringify(state)); }
    catch { warn('浏览器无法保存到本机。请在学习统计页导出备份，以保留本次记录。'); }
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const uid = () => Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const icons = {
    home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    kana:'<path d="M4 17 9 5l5 12M6 13h6M16 8h5m-2.5-2.5v5M16 17h5"/>',
    words:'<path d="M12 6c-3-3-6-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2v15"/>',
    review:'<path d="M4 12a8 8 0 1 1 2.4 5.7M4 7v5h5m3-4v4l3 2"/>',
    stats:'<path d="M4 20h16M7 16v-4m5 4V5m5 11V9"/>',
    moon:'<path d="M20.5 15.3A8.7 8.7 0 0 1 8.7 3.5 8.8 8.8 0 1 0 20.5 15.3Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    sound:'<path d="M3 9v6h4l5 4V5L7 9zm13 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>'
  };
  const icon = name => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
  const routes={home:'首页',kana:'假名',words:'单词',review:'错题本',stats:'学习统计'};
  const modes={input:'输入答案',choice:'四选一',card:'翻转卡片'};
  const a = (href,label,cls='') => '<a class="btn '+cls+'" href="#'+href+'">'+label+'</a>';
  const btn = (action,label,cls='',disabled=false) => '<button type="button" class="btn '+cls+'" data-act="'+esc(action)+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
  const pageHead = (eyebrow,title,sub) => '<div class="page-head"><div class="eyebrow">'+eyebrow+'</div><h1>'+title+'</h1><p class="sub">'+sub+'</p></div>';
  const meter = (num,total) => '<div class="bar" role="progressbar" aria-label="完成进度" aria-valuemin="0" aria-valuemax="'+(total||1)+'" aria-valuenow="'+num+'"><span style="width:'+(total?num/total*100:0)+'%"></span></div>';
  const day = t => {const d=new Date(t); return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');};
  const percentage=(n,d)=>d?Math.round(100*n/d)+'%':'—';
  function words() {
    return S.words.map(w=>own(state.edits,w.id)?state.edits[w.id]:w)
      .concat(Object.values(state.edits).filter(w=>w.id.startsWith('u-')))
      .filter(w=>!state.removed.includes(w.id));
  }
  const lessons=()=>[...new Set([3,4,5,6,...words().map(w=>w.lesson)])].sort((a,b)=>a-b);
  function mistakes() {
    const live = new Map([...S.kana,...words()].map(w=>[w.id,w]));
    const entries = new Map();
    for (const record of state.attempts) {
      if (record.ok || !live.has(record.id) || record.time <= (state.dismissed[record.id] || 0)) continue;
      entries.set(record.id,{item:live.get(record.id),dir:record.dir,count:(entries.get(record.id)?.count||0)+1,time:record.time});
    }
    return [...entries.values()].sort((a,b)=>b.count-a.count||b.time-a.time);
  }
  function metrics() {
    const today=day(Date.now());
    const attempts=state.attempts.filter(x=>day(x.time)===today);
    const days=new Set(state.attempts.map(x=>day(x.time)));
    let streak=0;
    const date=new Date();
    date.setHours(12,0,0,0);
    if (!days.has(today)) date.setDate(date.getDate()-1);
    while(days.has(day(+date))) { streak++;date.setDate(date.getDate()-1); }
    return {count:attempts.length,rate:percentage(attempts.filter(x=>x.ok).length,attempts.length),streak};
  }
  const metric=(value,label)=>'<div class="panel metric"><strong>'+value+'</strong><small>'+label+'</small></div>';
  function home() {
    const m=metrics();
    const resume=state.round&&!state.round.done;
    return '<section class="hero"><div><p class="eyebrow">まいにち日本語</p><h1>今天，练一点日语</h1><p class="sub">从一个假名、一个单词开始。按照自己的节奏，把学过的日语慢慢记牢。</p><div class="actions">'+(resume?a('quiz','继续上次练习 '+icon('arrow'),'primary'):a('kana','开始练习 '+icon('arrow'),'primary'))+'</div></div><div class="art" aria-hidden="true"><div class="art-grid"></div><div class="art-disc"></div><span class="petal one">✧</span><span class="petal two">✦</span><div class="tile left" lang="ja">あ<small>HIRAGANA</small></div><div class="tile right" lang="ja">カ<small>KATAKANA</small></div></div></section>'+
      '<div class="section-title"><h2>练习入口</h2><small>自选范围与题型</small></div><div class="grid two keep">'+
      '<a href="#kana" class="panel practice-link"><span class="badge" lang="ja">あ</span><span><h3>假名抽问</h3><small>平假名、片假名与罗马音</small></span>'+icon('arrow')+'</a>'+
      '<a href="#words" class="panel practice-link"><span class="badge green" lang="ja">語</span><span><h3>单词抽问</h3><small>教材第 3–6 课 · '+words().length+' 个词条</small></span>'+icon('arrow')+'</a></div>'+
      '<div class="section-title"><h2>今日学习</h2><a class="quiet" href="#stats">查看统计 '+icon('arrow')+'</a></div><div class="grid three">'+metric(m.count,'今日答题')+metric(m.rate,'今日正确率')+metric(m.streak+' 天','连续学习')+'</div>';
  }
  const select = (name, options, current) => '<select name="'+name+'">'+Object.entries(options).map(([v,l])=>'<option value="'+esc(v)+'"'+(String(current)===v?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
  const field=(label,html)=>'<label><span class="field-label">'+label+'</span>'+html+'</label>';
  const checks=(name,labels,selected)=>'<div class="check-group">'+labels.map(v=>'<label class="check"><input type="checkbox" name="'+name+'" value="'+esc(v)+'"'+(selected.includes(v)?' checked':'')+'>'+esc(name==='lesson'?'第 '+v+' 课':v)+'</label>').join('')+'</div>';
  const countOptions={'5':'5 题','10':'10 题','15':'15 题','20':'20 题','30':'30 题','50':'50 题',all:'全部'};
  function setup(kind) {
    const isKana=kind==='kana', p=state.prefs[kind] || {};
    const groups=['清音','浊音','半浊音','拗音'], scripts=['平假名','片假名'];
    const directions=isKana?['kr','rk','kk']:['wz','kz','hz','zw','wr','az','ar'];
    return '<div class="narrow">'+pageHead(isKana?'かな · KANA':'ことば · VOCABULARY',isKana?'假名抽问':'单词抽问',isKana?'选择要练的文字、音类和答题方向。':'《新时代大学日语 1（学生用书）》')+
      '<form id="setup" class="panel setup" data-kind="'+kind+'">'+
      (isKana?'<fieldset><legend>文字</legend>'+checks('script',scripts,Array.isArray(p.script)?p.script:scripts)+'</fieldset><fieldset><legend>音类</legend>'+checks('group',groups,Array.isArray(p.group)?p.group:groups)+'</fieldset>':'<fieldset><legend>课程</legend>'+checks('lesson',lessons().map(String),Array.isArray(p.lesson)?p.lesson:lessons().map(String))+'</fieldset>')+
      '<div class="grid two">'+field('答题方向',select('dir',Object.fromEntries(directions.map(d=>[d,S.labels[d]])),p.dir))+field('答题模式',select('mode',modes,p.mode))+'</div>'+
      field('题目数量',select('count',countOptions,p.count||'10'))+
      '<div class="actions"><button class="btn primary" type="submit">开始抽问 '+icon('arrow')+'</button>'+
      (state.round&&!state.round.done?a('quiz','继续未完成练习'):'')+(isKana?'':a('library','管理词库'))+'</div></form></div>';
  }
  function launch(kind,entries,mode,count,ordered=false) {
    if (!entries.length) return toast('当前范围没有可用题目。');
    if (state.round && !state.round.done && !confirm('开始新一轮会替换未完成的练习。继续吗？')) return;
    const list=(ordered?entries:S.shuffle(entries)).slice(0,count==='all'?entries.length:Number(count));
    state.round={id:uid(),kind,index:0,mode,items:list,done:false};
    save();go('quiz');
  }
  function start(form) {
    const kind=form.dataset.kind;
    const data=new FormData(form);
    const p=Object.fromEntries(data);
    const isKana=kind==='kana';
    const scope=isKana?['script','group']:['lesson'];
    scope.forEach(k=>p[k]=data.getAll(k));
    if (scope.some(k=>!p[k].length)) return toast('请至少选择一个练习范围。');
    const items=isKana?S.kana.filter(k=>p.script.includes(k.script)&&p.group.includes(k.group)):
      words().filter(w=>p.lesson.includes(String(w.lesson))&&(!['wr','hz','ar'].includes(p.dir)||/[\p{Script=Han}]/u.test(w.ja)));
    state.prefs[kind]=p;
    launch(kind,items.map(item=>({item,dir:p.dir})),p.dir==='ar'?'input':p.mode,p.count);
  }
  const current=()=>state.round.items[state.round.index];
  const question=q=>S.question(q.item,q.dir,q.item.script?S.kana:[q.item,...words().filter(w=>w.id!==q.item.id)]);
  let activeQuestion, speechMessage='', toastTimer;
  function toast(s) {
    $('toast').textContent=s;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{$('toast').textContent='';},4000);
  }
  let activeAudio;
  function speak(text) {
    stopAudio();
    const file=window.STUDY_AUDIO?.[text];
    if (!file) return speakOnDevice(text);
    const player=new Audio('./audio/'+file+'.wav');
    activeAudio=player;
    speechStatus('');
    player.play().catch(()=>{
      if(activeAudio===player) speechStatus('音频未能播放。请检查网络或媒体音量，再点一次播放。');
    });
  }
  let utterance;
  function speakOnDevice(text) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return speechStatus('此浏览器无法播放日语语音。');
    try {
      const voices=speechSynthesis.getVoices();
      const voice=voices.find(v=>/^ja(?:[-_]|$)/i.test(v.lang));
      if (!voice && voices.length) return speechStatus('此设备暂无可用的日语语音。请在系统语音设置中启用日语，或切换练习方向。');
      utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='ja-JP';
      utterance.rate=.88;
      if(voice) utterance.voice=voice;
      utterance.onerror=e=>{if(!['canceled','interrupted'].includes(e.error)) speechStatus('日语语音播放失败。请检查设备的日语语音设置。');};
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      speechStatus('');
    } catch {speechStatus('此浏览器无法播放日语语音。');}
  }
  function speechStatus(s) {
    speechMessage=s;
    const el=$('speech-status');
    if(el) {el.textContent=s;el.hidden=!s;}
    else if(s) toast(s);
  }
  function quiz() {
    const r=state.round;
    if(!r) return '<div class="panel empty"><h2>还没有进行中的练习</h2><p class="sub">从首页选择一种练习。</p>'+a('home','返回首页')+'</div>';
    if(r.done) return results(r);
    const q=current();
    const nextQuestion=question(q);
    const result=q.result;
    const dictation=q.dir==='ar';
    const mode=dictation?'input':r.mode, pending=!result||result.status==='skip';
    activeQuestion=nextQuestion;
    if (mode==='choice' && (!q.options || (q.options.length && q.options.filter(nextQuestion.accepts).length!==1))) {q.options=nextQuestion.options; save();}
    const display=esc(nextQuestion.display), prompt=esc(nextQuestion.prompt);
    const lang=['zw','az','ar','rk'].includes(q.dir)?'':' lang="ja"';
    const isCard=mode==='card'&&pending;
    const prefix=q.item.script?q.item.script+' · '+q.item.group:'第 '+q.item.lesson+' 课';
    const feedback=!pending?'<div class="feedback '+result.status+'" role="status"><b>'+(result.status==='correct'?'答对了':'加入错题本')+'</b><p>参考答案　<span '+(['wz','kz','hz','az'].includes(q.dir)?'':'lang="ja"')+'>'+display+'</span></p>'+(result.value?'<small>你的答案　'+esc(result.value)+'</small>':'')+(dictation?'<p>对应写法　<span lang="ja">'+esc(q.item.ja)+'</span></p>':!q.item.script&&q.dir!=='wr'?'<small lang="ja">　'+esc(q.item.reading)+'</small>':'')+'</div>':'';
    const input='<form id="answer" class="answer-form"><input type="text" name="value" aria-label="输入答案" placeholder="输入答案" autocomplete="off" autocapitalize="off" spellcheck="false" required><button class="btn primary" type="submit">提交</button></form>';
    let body='';
    if(pending && !isCard) body=mode==='choice'&&q.options.length?'<div class="options">'+q.options.map((x,i)=>btn('pick:'+i,'<b>'+String.fromCharCode(65+i)+'</b>'+esc(x),'option')).join('')+'</div>':(mode==='choice'?'<p class="quiet">可用干扰项不足，请输入答案。</p>':'')+input;
    if(isCard) body=q.revealed?'<div class="actions"><span>'+btn('known','认识','primary')+'</span>'+btn('unknown','不认识')+'</div>':'';
    const showSound=!pending||['az','ar','kr','kk','wz','kz','hz'].includes(q.dir);
    const title='<h2 class="prompt '+(q.dir==='zw'?'word-meaning':'')+'"'+lang+'>'+prompt+'</h2>';
    const face=isCard?'<button type="button" class="card-face" data-act="flip" aria-label="翻转卡片">'+
      '<span class="prompt" style="display:block"'+(q.revealed?(['az','wz','kz','hz'].includes(q.dir)?'':' lang="ja"'):lang)+'>'+(q.revealed?display:prompt)+'</span><small>'+(q.revealed?'参考答案 · 点击返回题目':'轻触查看答案')+'</small></button>':title;
    return '<div class="narrow"><div class="row quiz-meta"><div><div class="eyebrow">ただいま練習中</div><b>第 '+(r.index+1)+' / '+r.items.length+' 题</b></div>'+
      (dictation?'<span class="quiet">输入假名</span>':'<label><span class="quiet">答题模式</span> '+select('active-mode',modes,mode)+'</label>')+'</div>'+
      meter(r.items.filter(x=>x.result&&x.result.status!=='skip').length,r.items.length)+
      '<section class="panel quiz-card"><span class="chip">'+prefix+'</span><p class="quiet">'+S.labels[q.dir]+'</p>'+face+
      (showSound?btn('speak',icon('sound')+' 播放日语','soft'):'')+
      '<p id="speech-status" role="status" class="notice" '+(!speechMessage?'hidden':'')+'>'+esc(speechMessage)+'</p>'+
      '<div class="answer-zone">'+feedback+body+'</div></section>'+
      '<div class="actions quiz-controls">'+btn('prev','上一题','',!r.index)+(pending?btn('next','跳过')+btn('unknown','不认识 · 看答案','soft'):(result.status==='wrong'&&result.value&&result.source==='input'?btn('override','接受我的答案'):'')+btn('next',r.index===r.items.length-1?'查看成绩':'下一题','primary'))+btn('finish','结束本轮')+'</div></div>';
  }
  function submit(value,ok,source) {
    const q=current(),r=state.round;
    if(q.result && q.result.status!=='skip') return;
    q.result={status:ok?'correct':'wrong',value,source};
    state.attempts.push({key:r.id+'-'+r.index,id:q.item.id,dir:q.dir,ok,time:Date.now()});
    save(); render();
    main.querySelector('[data-act="next"]')?.focus({preventScroll:true});
  }
  function stopAudio() {
    if (activeAudio) { activeAudio.pause(); activeAudio=null; }
    if (utterance && 'speechSynthesis' in window) { speechSynthesis.cancel(); utterance=null; }
  }
  function step(offset) {
    const r=state.round;
    if(offset>0&&!current().result) current().result={status:'skip'};
    if(r.index+offset>=r.items.length) return finish();
    stopAudio();
    r.index=Math.max(0,r.index+offset);speechMessage='';save();render();window.scrollTo(0,0);
  }
  function finish() {
    stopAudio();
    state.round.done=true;save();render();
  }
  function results(r) {
    const answered=r.items.filter(q=>q.result&&q.result.status!=='skip');
    const wrong=answered.filter(q=>q.result.status==='wrong');
    const missed=r.items.length-answered.length;
    return '<div class="narrow">'+pageHead('おつかれさま','本轮成绩','已答 '+answered.length+' 题 · 跳过或未答 '+missed+' 题')+
      '<div class="grid three">'+metric(percentage(answered.length-wrong.length,answered.length),'正确率')+metric(answered.length-wrong.length,'答对')+metric(wrong.length,'错题')+'</div>'+
      '<div class="section-title"><h2>本轮错题</h2></div><div class="panel">'+(wrong.length?'<ul class="list">'+wrong.map(q=>'<li><b lang="ja">'+esc(q.item.ja)+'</b><br><small>'+esc(question(q).display)+'</small></li>').join('')+'</ul>':'<p class="quiet">本轮没有错题。</p>')+'</div>'+
      '<div class="actions quiz-controls">'+(wrong.length?btn('retry','重练本轮错题','primary'):'')+a(r.kind==='review'?'review':r.kind,'返回练习设置')+a('home','返回首页')+'</div></div>';
  }
  function review() {
    const rows=mistakes();
    return '<div class="narrow">'+pageHead('ふくしゅう · REVIEW','错题本','把容易忘记的内容再练一遍。')+
      (rows.length?'<form id="review-form" class="panel setup"><div class="grid two">'+field('答题模式',select('mode',modes,'input'))+field('题目数量',select('count',countOptions,'all'))+'</div><div class="actions"><button class="btn primary">优先练习高频错题 '+icon('arrow')+'</button></div></form><div class="section-title"><h2>待复习</h2><small>'+rows.length+' 项</small></div><div class="panel"><ul class="list">'+rows.map(({item,count})=>'<li class="row"><div class="word-info"><div class="word-title" lang="ja">'+esc(item.ja)+'</div><small>'+esc(item.script?item.script+' · '+item.r[0]:item.reading+' · '+item.zh)+' · 错 '+count+' 次</small></div>'+btn('master:'+item.id,'已掌握')+'</li>').join('')+'</ul></div>':'<div class="panel empty"><h2>错题本是空的</h2><p class="sub">答错或选择「不认识」时，题目会出现在这里。</p></div>')+'</div>';
  }
  function stats() {
    const m=metrics();
    const latest=new Map(state.attempts.map(x=>[x.id,x.ok]));
    const progress=(title,items)=>{
      const got=items.filter(x=>latest.get(x.id)).length;
      return '<div class="stack"><div class="row"><b>'+title+'</b><small>'+got+' / '+items.length+'</small></div>'+meter(got,items.length)+'</div>';
    };
    const vocab=words();
    return '<div class="narrow">'+pageHead('きろく · PROGRESS','学习统计','看见每一次练习留下的进步。')+
      '<div class="grid two keep">'+metric(m.count,'今日答题')+metric(m.rate,'今日正确率')+metric(state.attempts.length,'累计答题')+metric(m.streak+' 天','连续学习')+'</div>'+
      '<div class="section-title"><h2>掌握进度</h2><small>按每项最近一次作答</small></div><div class="panel stack">'+progress('假名',S.kana)+lessons().map(l=>progress('第 '+l+' 课',vocab.filter(w=>w.lesson===l))).join('')+'</div>'+
      '<div class="section-title"><h2>备份与恢复</h2></div><div class="panel stack"><p class="quiet">记录、自定义词库和未完成练习保存在当前浏览器。换设备前可以导出备份。</p><div class="actions">'+btn('backup','导出备份','soft')+btn('restore','恢复备份')+'</div><input id="restore-file" type="file" accept=".json,application/json" hidden></div></div>';
  }
  let libraryQuery='', editing=null;
  const csvFields=['ja','reading','zh','lesson','pos','aliases'];
  const csvLabel={ja:'日语写法',reading:'假名读音',zh:'中文释义',lesson:'课次',pos:'词性',aliases:'可接受的中文同义词'};
  function wordList() {
    const query=S.normal(libraryQuery);
    const list=words().filter(w=>!query||S.normal([w.ja,w.reading,w.zh,w.lesson].join(' ')).includes(query));
    return '<p class="quiet">'+list.length+' 个词条</p><ul class="list word-list">'+list.map(w=>'<li class="row"><div class="word-info"><div class="word-title" lang="ja">'+esc(w.ja)+'</div><small>'+esc(w.reading)+' · '+esc(w.zh)+'</small><br><small>第 '+w.lesson+' 课'+(w.pos?' · '+esc(w.pos):'')+(w.page?' · '+esc(w.section)+' · 教材第 '+w.page+' 页':' · 自定义')+'</small></div><div class="actions">'+btn('edit:'+w.id,'编辑')+btn('delete:'+w.id,'删除','danger')+'</div></li>').join('')+'</ul>';
  }
  function library() {
    const w=editing;
    const form=w?'<form id="word-form" class="panel setup"><h2>'+(w.id?'编辑词条':'添加词条')+'</h2><div class="form-grid grid two">'+csvFields.map(k=>field(csvLabel[k],'<input name="'+k+'" '+(k==='lesson'?'type="number" min="1" max="999"':'type="text"')+(k==='pos'||k==='aliases'?'':' required')+' value="'+esc(w[k])+'"'+(k==='aliases'?' placeholder="多个同义词用 | 分隔"':'')+'>')).join('')+'</div><div class="actions"><button type="submit" class="btn primary">保存词条</button>'+btn('cancel-edit','取消')+'</div></form>':'';
    return '<div class="narrow stack">'+pageHead('たんごちょう · LIBRARY','管理词库','浏览教材词条，或添加自己的课次与单词。')+
      '<div class="actions">'+btn('add','＋ 添加词条','primary')+btn('csv-out','导出 CSV')+btn('csv-in','导入 CSV')+a('words','返回单词')+'</div><input id="csv-file" type="file" accept=".csv,text/csv" hidden>'+
      '<p class="quiet">CSV 使用 UTF-8。导入时跳过写法、读音、课次均相同的词条。</p>'+form+
      '<input id="word-search" type="search" aria-label="搜索词库" placeholder="搜索日语、读音、中文或课次" value="'+esc(libraryQuery)+'"><div id="word-list" class="panel">'+wordList()+'</div></div>';
  }
  const fingerprint = w => [S.japanese(w.ja),S.japanese(w.reading),w.lesson].join('|');
  function buildWord(raw,id) {
    const w=Object.fromEntries(csvFields.map(k=>[k,String(raw[k]??'').trim()]));
    w.lesson=Number(w.lesson);
    w.id=id||'u-'+uid();
    if(!itemValid(w)||w.lesson>999) throw Error('请填写日语、中文、1–999 的课次，以及有效的假名读音。');
    return w;
  }
  function saveWord(form) {
    try {
      const w=buildWord(Object.fromEntries(new FormData(form)),editing.id);
      if(words().some(x=>x.id!==w.id&&fingerprint(x)===fingerprint(w))) throw Error('相同写法、读音和课次的词条已存在。');
      state.edits[w.id]={...editing,...w};
      editing=null;save();render();toast('词条已保存。');
    } catch(e) {toast(e.message);}
  }
  function download(name,content,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const link=document.createElement('a');
    link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function importFile(input) {
    const file=input.files?.[0];
    if(!file)return;
    input.value='';
    try {
      const text=await file.text();
      if(input.id==='restore-file') {
        const data=JSON.parse(text);
        if(!valid(data))throw Error('备份格式无效或版本不兼容。');
        if(!confirm('用这份备份替换本机的词库和学习记录吗？'))return;
        state=data;save();render();toast('备份已恢复。');
        return;
      }
      const [header,...rows]=S.csvParse(text);
      const fields=(header||[]).map(h=>Object.entries(csvLabel).find(([,label])=>label===h.trim())?.[0]||h.trim().toLowerCase());
      if(!['ja','reading','zh','lesson'].every(k=>fields.includes(k)))throw Error('CSV 缺少日语、读音、中文或课次列。可先导出 CSV 查看格式。');
      const existing=new Set(words().map(fingerprint));
      const added=[];
      rows.forEach((row,i)=>{
        let w;
        try {
          if(row.length!==fields.length)throw Error('列数与表头不同。');
          w=buildWord(Object.fromEntries(fields.map((k,j)=>[k,row[j]])));
        }catch(e){throw Error('第 '+(i+2)+' 条 CSV 记录有误。'+e.message);}
        if(!existing.has(fingerprint(w))){existing.add(fingerprint(w));added.push(w);}
      });
      added.forEach(w=>{state.edits[w.id]=w;});
      save();render();toast('已导入 '+added.length+' 条，跳过 '+(rows.length-added.length)+' 条重复词条。');
    } catch(e) {toast(e.message||'文件读取失败。');}
  }
  const systemTheme=matchMedia('(prefers-color-scheme: dark)');
  function theme() {
    const mode=state.theme||(systemTheme.matches?'dark':'light');
    document.documentElement.dataset.theme=mode;
    $('theme').innerHTML=icon(mode==='dark'?'sun':'moon');
    $('theme').title=mode==='dark'?'切换浅色':'切换深色';
    document.querySelector('meta[name="theme-color"]').content=mode==='dark'?'#211c1b':'#faf7f2';
  }
  systemTheme.addEventListener?.('change',theme);
  function route() {
    const p=location.hash.slice(1);
    return ['home','kana','words','review','stats','quiz','library'].includes(p)?p:'home';
  }
  function go(page) {
    if(route()===page)render();
    else location.hash=page;
  }
  function render() {
    const p=route(), selected=p==='quiz'?state.round?.kind:p==='library'?'words':p;
    const nav=Object.entries(routes).map(([r,label])=>'<a href="#'+r+'" '+(r===selected?'aria-current="page"':'')+'>'+icon(r)+label+'</a>').join('');
    $('desktop-nav').innerHTML=nav;$('mobile-nav').innerHTML=nav;
    const content={home,kana:()=>setup('kana'),words:()=>setup('words'),quiz,review,stats,library}[p]();
    main.innerHTML='<div class="view">'+content+'</div>';
    theme();
    syncSetupMode();
  }
  function syncSetupMode() {
    const form=$('setup');
    if (!form) return;
    const dictation=form.elements.dir.value==='ar';
    if (dictation) form.elements.mode.value='input';
    form.elements.mode.disabled=dictation;
  }
  window.addEventListener('hashchange',()=>{stopAudio();speechMessage='';render();window.scrollTo(0,0);});
  $('theme').addEventListener('click',()=>{state.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';save();theme();});
  main.addEventListener('input',e=>{
    if(e.target.id==='word-search'){libraryQuery=e.target.value;$('word-list').innerHTML=wordList();}
  });
  main.addEventListener('change',e=>{
    if(e.target.name==='dir')syncSetupMode();
    if(e.target.name==='active-mode'){state.round.mode=e.target.value;save();render();}
    if(['restore-file','csv-file'].includes(e.target.id))importFile(e.target);
  });
  let composing=false;
  main.addEventListener('compositionstart',()=>{composing=true;});
  main.addEventListener('compositionend',()=>{composing=false;});
  main.addEventListener('keydown',e=>{
    if(e.key==='Enter' && (e.isComposing||e.keyCode===229||composing))e.preventDefault();
  });
  main.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.target;
    if(f.id==='setup')start(f);
    if(f.id==='word-form')saveWord(f);
    if(f.id==='answer'&&!composing){
      const value=new FormData(f).get('value').trim();
      if(value)submit(value,activeQuestion.accepts(value),'input');
    }
    if(f.id==='review-form'){
      const d=new FormData(f);
      launch('review',mistakes().map(({item,dir})=>({item,dir})),d.get('mode'),d.get('count'),true);
    }
  });
  main.addEventListener('click',e=>{
    const control=e.target.closest('[data-act]');
    if(!control||control.disabled)return;
    const act=control.dataset.act;
    const id=act.slice(act.indexOf(':')+1);
    if(act==='next')step(1);
    else if(act==='prev')step(-1);
    else if(act==='finish'){
      const remaining=state.round.items.filter(x=>!x.result||x.result.status==='skip').length;
      if(!remaining||confirm('还有 '+remaining+' 题未答。现在查看成绩吗？'))finish();
    }
    else if(act==='speak')speak(activeQuestion.audio);
    else if(act==='flip'){current().revealed=!current().revealed;save();render();main.querySelector('[data-act="flip"]')?.focus({preventScroll:true});}
    else if(act==='known')submit('',true,'card');
    else if(act==='unknown')submit('',false,'unknown');
    else if(act.startsWith('pick:')) {
      const value=current().options[Number(id)];
      submit(value,activeQuestion.accepts(value),'choice');
    }
    else if(act==='override'){
      const r=state.round;
      const record=state.attempts.find(x=>x.key===r.id+'-'+r.index);
      if(record){record.ok=true;current().result.status='correct';save();render();}
    }
    else if(act==='retry')launch('review',state.round.items.filter(q=>q.result?.status==='wrong').map(({item,dir})=>({item,dir})),state.round.mode,'all');
    else if(act.startsWith('master:')){state.dismissed[id]=Date.now();save();render();}
    else if(act==='backup')download('kana-notebook-backup.json',JSON.stringify(state,null,2),'application/json');
    else if(act==='restore')$('restore-file').click();
    else if(act==='csv-in')$('csv-file').click();
    else if(act==='csv-out'){
      const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
      const csv=[csvFields.join(','),...words().map(w=>csvFields.map(k=>quote(w[k])).join(','))].join('\r\n');
      download('kana-notebook-words.csv','\uFEFF'+csv,'text/csv;charset=utf-8');
    }
    else if(act==='add'||act.startsWith('edit:')){
      editing=act==='add'?{lesson:7}:words().find(w=>w.id===id);render();
      $('word-form')?.scrollIntoView({block:'nearest'});
    }
    else if(act==='cancel-edit'){editing=null;render();}
    else if(act.startsWith('delete:')&&confirm('删除这个词条吗？')){
      state.removed.push(id);
      if(editing?.id===id)editing=null;
      save();render();toast('词条已删除。');
    }
  });
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  render();
})();
