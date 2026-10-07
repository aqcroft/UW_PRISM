const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { TIMEZONE, today, time, hour } = require('./prism-time');
const { decodeAuthBundle, applySessionStorage } = require('./prism-auth');
const { makeBackend } = require('./prism-backend');
const pageTools = require('./prism-page');

const TEAM_URL='https://uw.co.uk/partner/portal/team';
const ATTEMPTS='07:00, 08:00, 11:00, 14:00, 17:00';
const FORCE=/^(1|true|yes)$/i.test(String(process.env.PRISM_FORCE_CHECK||''));
const REPORT=path.join(__dirname,'run-report.json');
function log(s){console.log(`[${new Date().toISOString()}] ${s}`);}
function report(p){let c={};try{c=JSON.parse(fs.readFileSync(REPORT,'utf8'));}catch(_){}fs.writeFileSync(REPORT,JSON.stringify({...c,...p,updatedAt:new Date().toISOString()},null,2));}

async function main(){
  const date=today(), h=hour();
  const backend=makeBackend(String(process.env.PRISM_APPS_SCRIPT_URL||'').trim(),date,ATTEMPTS);
  const auth=decodeAuthBundle(String(process.env.PRISM_UW_STORAGE_STATE_B64||'').trim());
  report({version:'1.1.0',startedAt:new Date().toISOString(),ukDate:date,ukTime:time(),forceCheck:FORCE,outcome:'started'});
  log(`PRISM cloud collector v1.1.0 starting. UK date ${date}, time ${time()}.`);
  if(!FORCE&&await backend.alreadyHas(date)){log('PRISM already contains today. Nothing to do.');report({outcome:'already_complete'});return;}

  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:480,height:900},locale:'en-GB',timezoneId:TIMEZONE,storageState:auth.storageState});
    await applySessionStorage(context,auth);
    const page=await context.newPage();
    await page.goto(TEAM_URL,{waitUntil:'domcontentloaded',timeout:45000});
    await pageTools.waitForBody(page); await page.waitForTimeout(3000);
    let i=await pageTools.info(page);
    if(!i){
      if(await pageTools.detectAuth(page)){
        const notification=await backend.failure('login_required');
        report({outcome:'login_required',notification,pageUrl:page.url()});
        throw new Error('UW login needs refreshing.');
      }
      throw new Error('Could not read the UW Team page summary. The page layout may have changed.');
    }
    log(`UW page reports ${i.claimed} partners, showing ${i.showing}, data from ${i.date}.`);
    if(i.date!==date){
      if(h===7){
        const notification=await backend.failure('stale_uw_date',{latestUwDate:i.date,stage:'morning',checkedAt:'07:00'});
        log(`07:00 check: UW data still dated ${i.date}. Morning warning sent.`);
        report({outcome:'stale_morning',latestUwDate:i.date,notification});
      }else if(h>=17){
        const notification=await backend.failure('stale_uw_date',{latestUwDate:i.date,stage:'final',checkedAt:'17:00'});
        log(`Final check: UW data still dated ${i.date}.`);
        report({outcome:'stale_final',latestUwDate:i.date,notification});
      }else{
        log(`UW data still dated ${i.date}. A later cloud run will retry silently.`);
        report({outcome:'stale_retry_later',latestUwDate:i.date});
      }
      return;
    }
    if(!i.claimed||i.claimed<1)throw new Error(`Invalid claimed partner count: ${i.claimed}`);
    i=await pageTools.loadAll(page,i.claimed); log(`All partner rows loaded: ${i.showing} of ${i.claimed}.`);
    const parsed=await pageTools.parsePartners(page);
    if(!parsed.ok)throw new Error(`Parser failed: ${parsed.error}`);
    if(parsed.date!==date)throw new Error(`Parsed snapshot date changed unexpectedly: ${parsed.date}`);
    if(parsed.partners.length!==parsed.claimed)throw new Error(`Parser count mismatch: parsed ${parsed.partners.length}, claimed ${parsed.claimed}.`);
    log(`Parsed ${parsed.partners.length} partners. Sending verified snapshot to PRISM.`);
    const saved=await backend.snapshot(parsed,time());
    report({outcome:'success',saved:saved.saved,fingerprint:saved.fingerprint||'',notification:saved.notification||null,sourceDate:parsed.date});
    log(`SUCCESS: PRISM saved and verified ${saved.saved} partners for ${date}.`);
    await context.close();
  }catch(err){
    const msg=String(err&&err.message||err), r={outcome:'error',error:msg};
    if(h>=17&&msg!=='UW login needs refreshing.'){
      try{r.notification=await backend.failure('technical_error',{lastError:msg});}catch(e){r.notificationError=String(e&&e.message||e);}
    }
    report(r); throw err;
  }finally{await browser.close();}
}
main().catch(err=>{log(`ERROR: ${String(err&&err.stack||err)}`);process.exitCode=1;});
