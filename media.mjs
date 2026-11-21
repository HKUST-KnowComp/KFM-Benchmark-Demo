export function initMedia(pkg){
  if(!pkg.artifacts.some(a=>a.id==='bulletin-scan'))return;
  const $=s=>document.querySelector(s),make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  $('#media-lab').hidden=false;
  const sources={'bulletin-scan':{image:'sources/supplier-notice.png',original:'sources/supplier-notice.png',root:'bulletin-scan/image'},'policy-pdf':{image:'sources/policy-preview.png',original:'sources/policy.pdf',root:'policy-pdf/page/1'}};
  function showMedia(){
    const aid=$('#media-source').value,config=sources[aid],geometry=pkg.units.find(u=>u.id===config.root).value;
    $('#media-image').src=config.image;$('#media-original').href=config.original;
    const blocks=pkg.units.filter(u=>u.kind==='document_block'&&u.attributes.native_source?.artifact===aid);
    $('#media-boxes').replaceChildren();$('#media-blocks').replaceChildren();
    function select(block,index){
      $('#media-status').textContent=block.attributes.extraction_status==='ocr_unverified'?'OCR 提取 · 尚未核验':'PDF 原生文本 · 尚未核验';
      $('#media-text').textContent=block.value.text;
      $('#media-coordinate').textContent=`${block.id} · [${block.attributes.bbox.map(x=>Number(x.toFixed(1))).join(', ')}] · ${aid==='policy-pdf'?'page points':'pixels'}`;
      $('#media-confidence').textContent=block.attributes.confidence===undefined?'原生 PDF 文本提取；尚未人工核验。':`OCR 行平均置信分数 ${block.attributes.confidence.toFixed(1)} / 100；它不是准确率或校准概率。`;
      for(const container of ['#media-boxes','#media-blocks'])$(container).querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===index));
    }
    blocks.forEach((block,index)=>{
      const box=block.attributes.bbox,b=make('button');b.setAttribute('aria-label',`文字区域 ${index+1}: ${block.value.text}`);b.title=block.value.text;
      Object.assign(b.style,{left:100*box[0]/geometry.width+'%',top:100*box[1]/geometry.height+'%',width:100*(box[2]-box[0])/geometry.width+'%',height:100*(box[3]-box[1])/geometry.height+'%'});
      b.addEventListener('click',()=>select(block,index));$('#media-boxes').append(b);
      const item=make('button',`区域 ${index+1}`);item.addEventListener('click',()=>select(block,index));$('#media-blocks').append(item);
    });
    if(blocks.length)select(blocks[0],0);
  }
  $('#media-source').addEventListener('change',showMedia);showMedia();
}
