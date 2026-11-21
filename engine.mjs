// A browser executor for the authored IR fixture. Native SQL is exercised in Python.
export function view(unit) { return unit.attributes.sqlite_values ?? unit.value; }
export function scan(pkg, kind, collection) { return pkg.units.filter(u=>u.kind===kind && (!collection || u.attributes.collection===collection)); }
function follow(pkg, id, predicate) { return [...new Set(pkg.links.filter(l=>l.source===id && l.predicate===predicate).map(l=>l.target))]; }
function jsonValue(pkg,id) {
  const unit=pkg.units.find(u=>u.id===id);
  const children=pkg.links.filter(l=>l.source===id && l.predicate==='contains').map(l=>pkg.units.find(u=>u.id===l.target));
  if(unit.kind==='json_object')return Object.fromEntries(children.map(u=>[u.attributes.member,jsonValue(pkg,u.id)]));
  if(unit.kind==='json_array')return children.sort((a,b)=>a.attributes.member-b.attributes.member).map(u=>jsonValue(pkg,u.id));
  return unit.value;
}
function aligned(pkg,id) { return pkg.links.filter(l=>l.predicate==='aligned_with'&&l.attributes.alignment_id===id).map(l=>({left:pkg.units.find(u=>u.id===l.source),right:pkg.units.find(u=>u.id===l.target),link:l})); }
function one(rows,label) { if(rows.length!==1)throw Error(`Missing or ambiguous ${label}`);return rows[0]; }
export function decide(pkg,{order_id='O-1042',quantity=null,max_risk=null,bulletin_version='v1'}={}) {
  if(!['v1','v2'].includes(bulletin_version))throw Error('Unknown bulletin');
  const orderUnit=one(scan(pkg,'row','operations/database/table/orders').filter(u=>view(u).order_id===order_id),'order');
  const order={...view(orderUnit)};
  if(quantity!==null){if(!Number.isInteger(quantity)||quantity<=0)throw Error('Invalid quantity');order.quantity=quantity;}
  const policyUnit=one(scan(pkg,'document_block').filter(u=>u.provenance.artifact==='policy' && u.value.text.startsWith('```json policy\n')),'policy');
  const lines=policyUnit.value.text.trim().split('\n'),policy=JSON.parse(lines.slice(1,-1).join('\n'));
  if(!Array.isArray(policy.ranking)||policy.ranking.length!==3||[...policy.ranking].sort().join(',')!=='lead_days,sku,total_cost')throw Error('Unsupported policy ranking');
  const threshold=max_risk??policy.max_supplier_risk;
  if(typeof threshold!=='number'||!Number.isFinite(threshold)||threshold<0||threshold>1)throw Error('Invalid risk');
  const product=one(scan(pkg,'entity','network/graph').filter(u=>u.value.id===order.sku),'product');
  const stock=aligned(pkg,'stock-to-products'),suppliers=aligned(pkg,'suppliers-to-graph'),annotations=jsonValue(pkg,'annotations/json');
  const candidates=follow(pkg,product.id,'substitute').map(node=>{
    const inventory=one(stock.filter(r=>r.right.id===node),'stock'),row=view(inventory.left);
    const owners=follow(pkg,node,'supplied_by'),supplier=one(suppliers.filter(r=>owners.includes(r.right.id)),'supplier'),sup=view(supplier.left);
    const matches=annotations.map((r,i)=>({r,i})).filter(({r})=>r.supplier_id===sup.supplier_id&&r.version===bulletin_version);
    const {r:notice,i:noticeIndex}=one(matches,'bulletin');
    const total=row.unit_cost*order.quantity,reasons=[];
    if(row.stock<order.quantity)reasons.push('insufficient_stock');
    if(row.lead_days>order.due_days)reasons.push('late_delivery');
    if(total>order.budget)reasons.push('over_budget');
    if(sup.risk>threshold)reasons.push('supplier_risk');
    if(policy.require_released_supplier&&notice.status!=='released')reasons.push('supplier_hold');
    const evidence=[orderUnit.provenance,policyUnit.provenance,
      ...[inventory.left,inventory.right,inventory.link,supplier.left,supplier.right,supplier.link].map(u=>u.provenance),
      {artifact:'annotations',locator:{kind:'json',pointer:`/${noticeIndex}`}},notice.source,
      ...pkg.links.filter(l=>(l.source===product.id&&l.target===node&&l.predicate==='substitute')||(l.source===node&&l.target===supplier.right.id&&l.predicate==='supplied_by')).map(l=>l.provenance)];
    return {sku:inventory.right.value.id,supplier:sup.supplier_id,...row,risk:sup.risk,status:notice.status,total_cost:total,eligible:!reasons.length,reasons,evidence};
  });
  const eligible=candidates.filter(c=>c.eligible).sort((a,b)=>{for(const field of policy.ranking){const cmp=field==='sku'?a.sku.localeCompare(b.sku):a[field]-b[field];if(cmp)return cmp;}return 0;});
  return {order,max_risk:threshold,bulletin_version,candidates,selected:eligible[0]??null,learned_model:false};
}

export function textSpan(text,start,end){const points=Array.from(text);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>points.length)throw Error("Invalid text span");return points.slice(start,end).join("");}
