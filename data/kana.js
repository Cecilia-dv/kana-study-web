(() => {
  const groups = {
    '清音': 'あ:a い:i う:u え:e お:o か:ka き:ki く:ku け:ke こ:ko さ:sa し:shi/si す:su せ:se そ:so た:ta ち:chi/ti つ:tsu/tu て:te と:to な:na に:ni ぬ:nu ね:ne の:no は:ha ひ:hi ふ:fu/hu へ:he ほ:ho ま:ma み:mi む:mu め:me も:mo や:ya ゆ:yu よ:yo ら:ra り:ri る:ru れ:re ろ:ro わ:wa を:wo/o ん:n/nn',
    '浊音': 'が:ga ぎ:gi ぐ:gu げ:ge ご:go ざ:za じ:ji/zi ず:zu ぜ:ze ぞ:zo だ:da ぢ:di/ji づ:du/zu で:de ど:do ば:ba び:bi ぶ:bu べ:be ぼ:bo',
    '半浊音': 'ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po',
    '拗音': 'きゃ:kya きゅ:kyu きょ:kyo しゃ:sha/sya しゅ:shu/syu しょ:sho/syo ちゃ:cha/tya/cya ちゅ:chu/tyu/cyu ちょ:cho/tyo/cyo にゃ:nya にゅ:nyu にょ:nyo ひゃ:hya ひゅ:hyu ひょ:hyo みゃ:mya みゅ:myu みょ:myo りゃ:rya りゅ:ryu りょ:ryo ぎゃ:gya ぎゅ:gyu ぎょ:gyo じゃ:ja/zya/jya じゅ:ju/zyu/jyu じょ:jo/zyo/jyo びゃ:bya びゅ:byu びょ:byo ぴゃ:pya ぴゅ:pyu ぴょ:pyo'
  };
  window.KANA = Object.entries(groups).flatMap(([group, pairs]) =>
    pairs.split(' ').flatMap(pair => {
      const [h, r] = pair.split(':');
      const k = h.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 96));
      return [[h, k, '平假名'], [k, h, '片假名']].map(([ja, other, script]) =>
        ({id: 'k-' + ja, ja, other, script, group, r: r.split('/')}));
    })
  );
})();
