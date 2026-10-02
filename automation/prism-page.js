const MONTHS = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
function parseDateLine(line) {
  if (!line) return null;
  const dm = line.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!dm) return null;
  const mon = MONTHS[dm[2].slice(0,3)];
  if (!mon) return null;
  return `${dm[3]}-${mon}-${dm[1].padStart(2,'0')}`;
}
async function waitForBody(page) {
  await page.waitForFunction(() => document.body && document.body.innerText && document.body.innerText.trim().length > 20, null, { timeout: 20000 });
}
async function info(page) {
  return page.evaluate(() => {
    const months={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
    const lines=document.body.innerText.split('\n').map(x=>x.trim()).filter(Boolean);
    const line=lines.find(x=>x.includes('partners')&&x.toLowerCase().includes('data from')&&x.includes('showing'));
    if(!line)return null;
    const dm=line.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); if(!dm)return null;
    const mon=months[dm[2].slice(0,3)]; if(!mon)return null;
    const c=line.match(/(\d+)\s+partners/i), s=line.match(/showing\s+\d+\s*-\s*(\d+)/i);
    return {date:`${dm[3]}-${mon}-${dm[1].padStart(2,'0')}`,claimed:c?+c[1]:0,showing:s?+s[1]:0,dateLine:line};
  });
}
async function detectAuth(page) {
  const url=page.url();
  const body=(await page.locator('body').innerText().catch(()=>'' )).toLowerCase();
  return !url.includes('/partner/portal/team') || body.includes('sign in') || body.includes('log in') || body.includes('login');
}
async function loadAll(page, claimed) {
  for(let n=0;n<=30;n++){
    const i=await info(page); if(i&&i.showing>=claimed)return i;
    await page.evaluate(()=>{
      const sc=Array.from(document.querySelectorAll('*')).filter(el=>{const s=getComputedStyle(el);return(s.overflowY==='auto'||s.overflowY==='scroll')&&el.scrollHeight>el.clientHeight+100;}).sort((a,b)=>b.scrollHeight-a.scrollHeight)[0];
      if(sc)sc.scrollTop=sc.scrollHeight;
      const lm=Array.from(document.querySelectorAll('*')).find(el=>el.innerText&&el.innerText.trim()==='Load More');
      if(lm)lm.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    });
    await page.waitForTimeout(700);
  }
  const i=await info(page); throw new Error(`Timed out loading all partners. Showing ${i?i.showing:'?'} of ${claimed}.`);
}
async function parsePartners(page) {
  return page.evaluate(() => {
    const pn=s=>parseInt(String(s||'').replace(/,/g,''),10)||0;
    const lines=document.body.innerText.split('\n').map(x=>x.trim()).filter(Boolean);
    const dateLine=lines.find(x=>x.includes('partners')&&x.toLowerCase().includes('data from')&&x.includes('showing'));
    const months={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
    const dm=dateLine&&dateLine.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); if(!dm)return{ok:false,error:'Date not found.'};
    const mon=months[dm[2].slice(0,3)], cm=dateLine.match(/(\d+)\s+partners/i);
    const date=`${dm[3]}-${mon}-${dm[1].padStart(2,'0')}`, claimed=cm?+cm[1]:0;
    const titles=['NNL','NGL','SGL','GL','STL','TL','QD','D'];
    const start=lines.findIndex(x=>x.includes('Name')&&(x.includes('Personal')||x.includes('Group Customers')))+1;
    if(start===0)return{ok:false,error:'Table header not found.'};
    const partners=[]; let i=start;
    while(i<lines.length){
      const line=lines[i]; if(line==='Tree'||line==='List')break;
      if(/^\d+$/.test(line)&&+line>0&&+line<20){
        const level=+line; let j=i+1; if(j>=lines.length)break;
        const raw=lines[j++]; if(!raw||raw==='Tree'||raw==='List')break;
        const closed=/\(closed\)/i.test(raw), name=raw.replace(/\s*\(closed\)/gi,'').replace(/\.\.\.$/,'').trim();
        let title='D'; if(j<lines.length&&titles.some(t=>lines[j].toUpperCase().includes(t)))title=lines[j++].toUpperCase();
        let pc=0,uwId=0,gc=0,services=0;
        if(j<lines.length&&lines[j].includes('\t')){
          const p=lines[j++].split('\t').map(x=>x.trim()).filter(Boolean); if(p.length>=4){pc=pn(p[0]);uwId=pn(p[1]);gc=pn(p[2]);services=pn(p[3]);}
        }else{
          if(j<lines.length&&/^[\d,]+$/.test(lines[j]))pc=pn(lines[j++]);
          if(j<lines.length&&/^[\d,]+$/.test(lines[j]))uwId=pn(lines[j++]);
          if(j<lines.length&&/^[\d,]+$/.test(lines[j]))gc=pn(lines[j++]);
          if(j<lines.length&&/^[\d,]+$/.test(lines[j]))services=pn(lines[j++]);
        }
        if(name)partners.push({level,name,title:title.replace(/\s+/g,' '),closed,pc,uwId,gc,services});
        i=j; continue;
      }
      i++;
    }
    return partners.length?{ok:true,date,claimed,partners}:{ok:false,error:'No partners parsed.'};
  });
}
module.exports = { waitForBody, info, detectAuth, loadAll, parsePartners, parseDateLine };
