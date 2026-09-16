import * as pdfjs from './vendor/pdf.min.mjs';
import {modules,covers} from './catalog.js';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.min.mjs',import.meta.url).href;
import {assemble} from './pdf-engine.js';
const $=id=>document.getElementById(id);
const state={cover:'suspension-methods',selected:[...covers['suspension-methods'].modules],title:$('title').value,copy:$('copy').value,page:0};
let revision=0,latestBytes=null,pdf=null,renderTask=null,timer,dragged;
const titleFor=id=>modules.find(m=>m.id===id).title;
function showError(message=''){$('error').textContent=message;$('error').hidden=!message;}
let pageNames=['Cover'];
function renderControls(){
 $('custom-fields').hidden=state.cover!=='custom';
 const ordered=[...state.selected,...modules.filter(m=>!state.selected.includes(m.id)).map(m=>m.id)];
 $('modules').replaceChildren(...ordered.map(id=>{
  const selected=state.selected.includes(id), row=document.createElement('div');
  row.className='module'+(selected?' selected':'');row.dataset.id=id;row.setAttribute('role','listitem');
  const label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span');
  check.type='checkbox';check.checked=selected;text.textContent=titleFor(id);
  check.addEventListener('change',()=>{state.selected=check.checked?[...state.selected,id]:state.selected.filter(x=>x!==id);state.page=0;renderControls();schedule();$('modules').querySelector(`[data-id="${id}"] input`).focus()});
  label.append(check,text);
  const handle=document.createElement('button');handle.type='button';handle.className='handle';handle.disabled=!selected;handle.setAttribute('aria-label',`Reorder ${titleFor(id)}`);handle.setAttribute('aria-describedby','reorder-help');handle.title='Drag to reorder. Use arrow keys when focused.';
  handle.innerHTML='<svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true"><g fill="currentColor"><circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/><circle cx="11" cy="11" r="1.5"/><circle cx="5" cy="17" r="1.5"/><circle cx="11" cy="17" r="1.5"/></g></svg>';
  handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const from=state.selected.indexOf(id),to=from+(e.key==='ArrowUp'?-1:1);if(to>=0&&to<state.selected.length)move(from,to,id)});
  let target=null,startY=0,moved=false;
  handle.addEventListener('pointerdown',e=>{if(!selected||e.button!==0)return;e.preventDefault();handle.focus();startY=e.clientY;moved=false;target=null;handle.setPointerCapture(e.pointerId);row.classList.add('dragging')});
  handle.addEventListener('pointermove',e=>{if(!handle.hasPointerCapture(e.pointerId))return;if(Math.abs(e.clientY-startY)>4)moved=true;document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.module');target=hit?.classList.contains('selected')?hit.dataset.id:null;if(target&&target!==id)hit.classList.add('drag-over');const panel=document.querySelector('.toolbar'),rect=panel.getBoundingClientRect();if(e.clientY>rect.bottom-35)panel.scrollTop+=12;if(e.clientY<rect.top+35)panel.scrollTop-=12});
  const clear=()=>{row.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))};
  handle.addEventListener('pointerup',e=>{if(!handle.hasPointerCapture(e.pointerId))return;handle.releasePointerCapture(e.pointerId);clear();if(moved&&target&&target!==id)move(state.selected.indexOf(id),state.selected.indexOf(target),id)});
  handle.addEventListener('pointercancel',clear);row.append(label,handle);return row;
 }));
}
function move(from,to,id){if(from<0||to<0||from===to)return;const [item]=state.selected.splice(from,1);state.selected.splice(to,0,item);state.page=0;renderControls();schedule();$('reorder-status').textContent=`${titleFor(item)} moved to position ${to+1}`;if(id)$('modules').querySelector(`[data-id="${id}"] .handle`).focus()}
function schedule(){clearTimeout(timer);revision++;latestBytes=null;$('download').disabled=true;$('loading').hidden=false;$('loading').textContent='Updating your stack…';showError();timer=setTimeout(build,180)}
async function build(){const thisRevision=revision;const snapshot={...state,selected:[...state.selected]};try{const result=await assemble(snapshot);if(thisRevision!==revision)return;const nextPdf=await pdfjs.getDocument({data:result.bytes.slice(),isEvalSupported:false}).promise;if(thisRevision!==revision){nextPdf.destroy();return}if(renderTask){renderTask.cancel();try{await renderTask.promise}catch{}renderTask=null}if(pdf)await pdf.destroy();pdf=nextPdf;latestBytes=result.bytes;pageNames=result.pageNames;state.page=Math.min(state.page,pdf.numPages-1);await renderPage();if(thisRevision!==revision)return;$('download').disabled=false;$('stack-summary').textContent=`${state.selected.length} module${state.selected.length===1?'':'s'} · ${pdf.numPages} page${pdf.numPages===1?'':'s'} · one PDF`;}catch(error){if(thisRevision!==revision)return;latestBytes=null;$('download').disabled=true;$('loading').hidden=true;showError(error.message||'Could not prepare the PDF. Please try again.')}}
let paintVersion=0;
async function renderPage(){if(!pdf)return;const version=++paintVersion;if(renderTask){renderTask.cancel();try{await renderTask.promise}catch{}}const p=await pdf.getPage(state.page+1);if(version!==paintVersion)return;const viewport=p.getViewport({scale:1.6});const canvas=$('page');canvas.width=viewport.width;canvas.height=viewport.height;renderTask=p.render({canvasContext:canvas.getContext('2d'),viewport});try{await renderTask.promise}catch(e){if(e.name==='RenderingCancelledException')return;throw e}if(version!==paintVersion)return;$('loading').hidden=true;$('page-counter').textContent=`Page ${state.page+1} of ${pdf.numPages}`;$('page-name').textContent=pageNames[state.page];$('prev').disabled=state.page===0;$('next').disabled=state.page===pdf.numPages-1;}
$('cover').addEventListener('change',()=>{state.cover=$('cover').value;if(state.cover!=='custom')state.selected=[...covers[state.cover].modules];state.page=0;renderControls();schedule()});
for(const key of ['title','copy'])$(key).addEventListener('input',()=>{state[key]=$(key).value;$(key).classList.remove('suggested');state.page=0;schedule()});
for(const [id,delta] of [['prev',-1],['next',1]])$(id).addEventListener('click',()=>{if(!pdf)return;state.page=Math.max(0,Math.min(pdf.numPages-1,state.page+delta));renderPage()});
$('download').addEventListener('click',()=>{if(!latestBytes)return;const name=state.cover==='custom'?(state.title.trim()||'submission'):covers[state.cover].title;const url=URL.createObjectURL(new Blob([latestBytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`${name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'submission'}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)});
renderControls();schedule();
// Page-scoped tools use the same catalog, state and assembly path as the controls.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}};
 register({name:'read_document_stack',description:'Read the selected cover and ordered topic modules.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({cover:state.cover,title:state.title,copy:state.copy,modules:[...state.selected],ready:!!latestBytes,pages:pageNames.length})});
 register({name:'configure_document_stack',description:'Set the cover, optional custom title and copy, and ordered modules. Updates the visible preview; does not download.',inputSchema:{type:'object',properties:{cover:{type:'string',enum:[...Object.keys(covers),'custom']},title:{type:'string',maxLength:180},copy:{type:'string',maxLength:1200},modules:{type:'array',items:{type:'string',enum:modules.map(m=>m.id)},uniqueItems:true}},required:['cover','modules'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||!(input.cover==='custom'||Object.hasOwn(covers,input.cover))||!Array.isArray(input.modules)||input.modules.some(id=>!modules.some(m=>m.id===id))||new Set(input.modules).size!==input.modules.length||('title'in input&&(typeof input.title!=='string'||input.title.length>180))||('copy'in input&&(typeof input.copy!=='string'||input.copy.length>1200)))throw Error('Invalid cover, text or module selection.');Object.assign(state,{cover:input.cover,selected:[...input.modules],page:0});for(const key of ['title','copy'])if(key in input){state[key]=input[key];$(key).value=input[key]}$('cover').value=state.cover;renderControls();schedule();clearTimeout(timer);await build();return{cover:state.cover,modules:[...state.selected],ready:!!latestBytes,pages:pageNames.length,error:$('error').textContent||null}}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
