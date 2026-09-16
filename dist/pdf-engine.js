import {modules,covers} from './catalog.js';
const {PDFDocument,rgb}=PDFLib;
const cache=new Map();
async function asset(path){if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error('Could not load '+path);return r.arrayBuffer()}));return cache.get(path)}
const titleFor=id=>modules.find(m=>m.id===id).title;
function wrap(text,font,size,width){let lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(font.widthOfTextAtSize(word,size)>width){if(line){lines.push(line);line=''}for(const char of word){if(font.widthOfTextAtSize(line+char,size)>width){lines.push(line);line=''}line+=char}}else{const next=line?line+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){lines.push(line);line=word}else line=next}}lines.push(line)}return lines}
function drawLines(page,lines,x,y,size,font,leading,color=rgb(.188,.188,.188)){lines.forEach((line,i)=>{if(line)page.drawText(line,{x,y:y-i*leading,size,font,color})})}
export async function assemble(snapshot){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const [heading,body]=await Promise.all([doc.embedFont(await asset('assets/neue.ttf'),{subset:false,features:{liga:false,clig:false}}),doc.embedFont(await asset('assets/messina.otf'),{subset:false,features:{liga:false,clig:false}})]);
 const source=await PDFDocument.load(await asset(snapshot.cover==='custom'?'assets/custom-base.pdf':`assets/${snapshot.cover}.pdf`));
 const [page]=await doc.copyPages(source,[0]);doc.addPage(page);
 const titles=snapshot.selected.map((id,i)=>`${i+1}. ${titleFor(id)}`);
 if(snapshot.cover==='custom'){
  const text=snapshot.title.trim()||'Your title';let size=65,lines=wrap(text.toUpperCase(),heading,size,510);
  while(lines.length>4&&size>30){size-=1;lines=wrap(text.toUpperCase(),heading,size,510)}
  const leading=size*.846;const titleHeight=Math.max(95,lines.length*leading+40);const divider=755-titleHeight;
  const copyLines=wrap(snapshot.copy,body,13,231),copyHeight=copyLines.length*15;
  const available=divider-110;const contentsHeight=titles.length*15;
  if(copyHeight+contentsHeight+60>available)throw Error('The cover copy is too long for one page. Shorten it or use a shorter title.');
  const copyY=152.8+(copyLines.length-1)*15;
  const indexBottom=copyY+50;const indexY=Math.max(263.16,indexBottom)+(titles.length-1)*15;
  if(indexY>divider-28)throw Error('The title and copy leave too little space for the contents. Shorten either field.');
  drawLines(page,lines,50.88,755-size*1.0631,size,heading,leading);
  drawLines(page,copyLines,52.56,copyY,13,body,15);
  drawLines(page,titles,52.77,indexY,13,body,15);
  drawLines(page,['VISIT→','SABIN.','DESIGN'],320.4,226.24,65,heading,55);
  page.drawRectangle({x:35.875,y:90.485,width:539.5,height:664.515,borderWidth:.5,borderColor:rgb(0,0,0)});
  page.drawLine({start:{x:36,y:divider},end:{x:575.375,y:divider},thickness:.5,color:rgb(0,0,0)});
  page.drawLine({start:{x:305,y:90.485},end:{x:305,y:divider},thickness:.5,color:rgb(0,0,0)});
 }else{
  const y=snapshot.cover==='suspension-methods'?263.1576+Math.max(0,titles.length-1)*15:560;
  drawLines(page,titles,snapshot.cover==='suspension-methods'?52.7717:48,y,13,body,15);
 }
 const pageNames=['Cover'];
 for(const id of snapshot.selected){const modulePdf=await PDFDocument.load(await asset(modules.find(m=>m.id===id).file));for(const p of await doc.copyPages(modulePdf,modulePdf.getPageIndices())){doc.addPage(p);pageNames.push(titleFor(id))}}
 doc.setTitle(snapshot.cover==='custom'?(snapshot.title.trim()||'Submission document'):covers[snapshot.cover].title);doc.setAuthor('SABIN');doc.setCreator('SABIN sheets generator');
 // The supplied Messina font has CFF OpenType outlines. Describe its full
 // OpenType stream correctly instead of the library's TrueType default.
 await body.embed();
 const name=PDFLib.PDFName.of;
 const fontDictionary=doc.context.lookup(body.ref);
 const descendant=doc.context.lookup(fontDictionary.lookup(name('DescendantFonts')).get(0));
 const descriptor=descendant.lookup(name('FontDescriptor'));
 const file=descriptor.get(name('FontFile2'));
 if(file){descriptor.delete(name('FontFile2'));descriptor.set(name('FontFile3'),file);doc.context.lookup(file).dict.set(name('Subtype'),name('OpenType'));descendant.set(name('Subtype'),name('CIDFontType0'));descendant.delete(name('CIDToGIDMap'));}
 return {bytes:await doc.save(),pageNames};
}
