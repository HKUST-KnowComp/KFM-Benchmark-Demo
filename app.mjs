import {initEncoder} from './encoder.mjs';
import {initComposition} from './composition.mjs';
import {initMedia} from './media.mjs';
import {decide,scan,view,textSpan} from './engine.mjs';
const $=s=>document.querySelector(s), make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const names={operations:'数据库 · 订单与供应商',inventory:'表格 · 库存',network:'图 · 替代与供货关系',policy:'Markdown · 采购规则',bulletin:'文本 · 原通知','bulletin-update':'文本 · 更新通知',annotations:'JSON · 人工标注','stock-to-products':'键对齐 · 库存与产品','suppliers-to-graph':'键对齐 · 供应商'};
const reasons={insufficient_stock:'库存不足',late_delivery:'超出交期',over_budget:'超过预算',supplier_risk:'风险超限',supplier_hold:'暂停出货'};
try {
  const response=await fetch('demo.json');if(!response.ok)throw Error('知识包加载失败');
  const pkg=await response.json();let answer,activeArtifact='operations',selectedUnit;
  const textFiles={policy:'policy.md',bulletin:'bulletin.txt','bulletin-update':'bulletin-update.txt'};
  const texts=Object.fromEntries(await Promise.all(Object.entries(textFiles).map(async([id,file])=>{const r=await fetch(`sources/${file}`);if(!r.ok)throw Error('证据文件缺失');return [id,await r.text()];})));
  function showEvidence(aid){
    activeArtifact=aid;$('#trace').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.artifact===aid));
    const card=$('#evidence');card.replaceChildren(make('b',names[aid]??aid));
    const candidate=answer.selected??answer.candidates.find(c=>c.sku==='P-C')??answer.candidates[0];
    const refs=candidate.evidence.filter(e=>e.artifact===aid);const blocks=[];
    for(const e of refs){
      if(e.locator.kind==='text'){blocks.push(textSpan(texts[aid],e.locator.start,e.locator.end));continue;}
      const unit=pkg.units.find(u=>JSON.stringify(u.provenance)===JSON.stringify(e));
      const link=pkg.links.find(l=>JSON.stringify(l.provenance)===JSON.stringify(e));
      if(unit)blocks.push(JSON.stringify({locator:e.locator,value:pkg.evidence[unit.id]?.native_value??view(unit)},null,2));
      else if(link)blocks.push(JSON.stringify({locator:e.locator,source:link.source,predicate:link.predicate,target:link.target,attributes:link.attributes},null,2));
      else blocks.push(JSON.stringify(e.locator,null,2));
    }
    card.append(make('pre',blocks.join('\n\n')));
    const a=pkg.artifacts.find(a=>a.id===aid);card.append(make('small',`SHA-256 ${a.sha256.slice(0,20)}… · ${refs.length} 处来源定位`));
  }
  function recompute(){
    answer=decide(pkg,{order_id:$('#order').value,quantity:Number($('#quantity').value),max_risk:Number($('#risk').value),bulletin_version:$('#bulletin').value});
    $('#qty-label').textContent=answer.order.quantity;$('#risk-label').textContent=answer.max_risk.toFixed(2);
    const heading=make('h3');if(answer.selected){heading.append('选择 ',make('span',answer.selected.sku,'answer-sku'));}else heading.textContent='当前没有可行替代方案';
    const note=answer.selected?`${answer.selected.lead_days} 天可交付 · 总价 ¥${answer.selected.total_cost.toLocaleString()} · ${answer.selected.supplier} 通过全部约束`:'查看被排除原因，或调整需求、阈值和通知版本。';
    $('#answer').replaceChildren(heading,make('p',note));$('#candidates').replaceChildren();
    for(const c of answer.candidates){const tr=make('tr');[c.sku,c.stock,`${c.lead_days} 天`,`¥${c.total_cost.toLocaleString()}`,c.risk.toFixed(2)].forEach(v=>tr.append(make('td',v)));const status=make('td',c.eligible?'可选':c.reasons.map(x=>reasons[x]).join('、'),`reason ${c.eligible?'ok':'fail'}`);tr.append(status);$('#candidates').append(tr);}
    const candidate=answer.selected??answer.candidates.find(c=>c.sku==='P-C')??answer.candidates[0];
    const ids=[...new Set(candidate.evidence.map(e=>e.artifact))];$('#trace').replaceChildren();
    ids.forEach(id=>{const b=make('button',names[id]??id);b.dataset.artifact=id;b.addEventListener('click',()=>showEvidence(id));$('#trace').append(b);});
    if(!ids.includes(activeArtifact))activeArtifact=ids.includes('bulletin-update')?'bulletin-update':ids[0];showEvidence(activeArtifact);
  }
  ['quantity','risk','bulletin'].forEach(id=>$(`#${id}`).addEventListener('input',recompute));
  $('#order').addEventListener('change',()=>{const row=scan(pkg,'row','operations/database/table/orders').find(u=>view(u).order_id===$('#order').value);$('#quantity').value=view(row).quantity;recompute();});
  $('#reset').addEventListener('click',()=>{$('#order').value='O-1042';$('#quantity').value=5;$('#risk').value=.2;$('#bulletin').value='v1';recompute();});
  const kinds=[...new Set(pkg.units.map(u=>u.kind))].sort();kinds.forEach(k=>{const o=make('option',`${k} · ${pkg.units.filter(u=>u.kind===k).length}`);o.value=k;$('#kind').append(o);});$('#kind').value='row';
  $('#counts').textContent=`${pkg.summary.artifacts} artifacts · ${pkg.summary.units} units · ${pkg.summary.links} links`;
  function showUnit(unit){selectedUnit=unit.id;$('#unit-title').textContent=unit.id;$('#unit-json').textContent=JSON.stringify(unit,null,2);const links=pkg.links.filter(l=>l.source===unit.id||l.target===unit.id);$('#unit-links').textContent=`${links.length} 条关联：`+links.slice(0,6).map(l=>`${l.predicate} (${l.source===unit.id?'out':'in'})`).join(' · ');$('#unit-list').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.id===unit.id));}
  function listUnits(){const needle=$('#unit-search').value.toLowerCase(),units=pkg.units.filter(u=>u.kind===$('#kind').value&&JSON.stringify(u).toLowerCase().includes(needle));$('#unit-list').replaceChildren();units.slice(0,100).forEach(u=>{const b=make('button',u.id);b.dataset.id=u.id;b.title=u.id;b.addEventListener('click',()=>showUnit(u));$('#unit-list').append(b);});if(units.length)showUnit(units.find(u=>u.id===selectedUnit)??units[0]);else{$('#unit-title').textContent='没有匹配的单元';$('#unit-json').textContent='';$('#unit-links').textContent='';}}
  $('#kind').addEventListener('change',listUnits);$('#unit-search').addEventListener('input',listUnits);listUnits();recompute();
  initMedia(pkg);
  initComposition().catch(error=>console.error(error));
  initEncoder().catch(error=>console.error(error));
  fetch('validation.json').then(r=>r.ok?r.json():null).then(report=>{if(!report)return;const wrap=$('#measurements');wrap.append(make('h3','真实数据兼容性验证'));for(const r of report.results){const block=make('div',undefined,'measurement');block.append(make('b',r.title),make('p',r.description));wrap.append(block);}wrap.append(make('p','这些结果用于核对表示转换与原执行路径的一致性，不代表统一模型的跨任务迁移成绩。'));}).catch(()=>{});
} catch(error){$('#answer').replaceChildren(make('h3','无法运行实验'),make('p',error.message));console.error(error);}
