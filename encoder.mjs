const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
export async function initEncoder(){
  const response=await fetch('encoder.json');if(!response.ok)return;
  const report=await response.json(),root=document.querySelector('#encoder-lab');root.hidden=false;
  const task=root.querySelector('#encoder-task'),budget=root.querySelector('#encoder-budget');
  const avg=(rows,key)=>rows.reduce((s,r)=>s+r[key],0)/rows.length;
  function render(){
    const bird=task.value==='bird',data=report[task.value],k=budget.value,body=root.querySelector('#encoder-results');body.replaceChildren();
    root.querySelector('#encoder-counts').textContent=bird?`${data.eligible_queries.toLocaleString()} 个问题 · ${data.skipped} 个跳过`:`${data.queries.toLocaleString()} 个查询 · ${data.support_queries.toLocaleString()} 个有支持`;
    for(const [method,label] of [['lexical','词法哈希'],['random','随机投影 · 3 seeds'],['trained','训练投影 · 3 seeds']]){
      const rows=method==='lexical'?[data.methods.lexical]:report.seeds.map(s=>data.methods[`${method}-${s}`]);
      const keys=['mrr',bird?`recall@${k}`:`support_recall@${k}`,bird?`complete_schema@${k}`:`complete_proof@${k}`];
      const tr=make('tr','');tr.dataset.method=method;tr.append(make('td',label));keys.forEach((key,i)=>tr.append(make('td',i===0?avg(rows,key).toFixed(3):(avg(rows,key)*100).toFixed(2)+'%')));body.append(tr);
    }
    root.querySelector('#encoder-conclusion').textContent=bird?'冻结迁移出现下降：训练只见过受控符号内容，尚不能迁移到自然语言与数据库 schema。':'完整证明召回@16 和下游 SAR：词法、训练模型均为 100%。MRR 提升没有转化为该预算下的答案收益。无支持查询仍计入下游 SAR，检索指标只统计有支持的查询。';
  }
  task.addEventListener('change',render);budget.addEventListener('change',render);render();
}
