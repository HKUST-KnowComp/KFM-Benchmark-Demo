const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const names={full_ir:'统一表示 · 完整状态',lossless_text:'完整文本 · 相同状态',frozen_initial:'冻结初始状态',native_table:'仅表格',native_graph:'仅图',native_sqlite:'仅数据库',native_text:'仅文本记录',native_markdown:'仅 Markdown',native_json:'仅 JSON'};
export async function initComposition(){
  const response=await fetch('composition.json');if(!response.ok)return;
  const report=await response.json(),root=document.querySelector('#composition-lab');root.hidden=false;
  const select=root.querySelector('select');
  function render(){
    const s=report.splits[select.value];root.querySelector('#composition-counts').textContent=`${s.episodes} 个 episode · ${s.probes.toLocaleString()} 个主 probe · ${s.mechanism_clusters} 个机制结构`;
    for(const [selector,modes] of [['#composition-main',['full_ir','lossless_text','frozen_initial']],['#composition-ablations',['native_table','native_graph','native_sqlite','native_text','native_markdown','native_json']]]){
      const body=root.querySelector(selector);body.replaceChildren();
      for(const mode of modes){const row=make('tr');row.append(make('td',names[mode]),make('td',(s.modes[mode].sar*100).toFixed(2)+'%'),make('td',(s.modes[mode].answer_accuracy*100).toFixed(2)+'%'));body.append(row);}
    }
  }
  select.addEventListener('change',render);render();
}
