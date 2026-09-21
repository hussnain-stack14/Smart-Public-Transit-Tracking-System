const {spawn}=require("node:child_process");
const fs=require("node:fs");
const path=require("node:path");
const env=fs.readFileSync(".env.local","utf8").split(/\r?\n/).find(line=>line.startsWith("NEXT_PUBLIC_API_URL="));
const base=env.slice(env.indexOf("=")+1).trim().replace(/\/$/,"");
const chrome=spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless","--no-sandbox","--disable-gpu","--remote-debugging-port=9232","--remote-allow-origins=*","--user-data-dir="+path.resolve(".booking-check-profile"),"about:blank"],{stdio:"ignore"});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const busesRaw=await(await fetch(base+"/api/buses")).json();
 const buses=Array.isArray(busesRaw)?busesRaw:busesRaw.buses||[];
 const bus=buses.find(b=>b.status==="active"&&Number(b.availableSeats)>0&&b.driver&&b.route);
 if(!bus)throw Error("No eligible bus available for booking check");
 const routeId=String(bus.route._id||bus.route);
 let pages;for(let n=0;n<30;n++){try{pages=await(await fetch("http://127.0.0.1:9232/json/list")).json();break}catch{await delay(300)}}
 if(!pages)throw Error("Chrome debugging endpoint unavailable");
 const page=pages.find(p=>p.type==="page");const ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
 let id=0;const pending=new Map();const errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text)};
 const call=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,{resolve:r,reject:j});ws.send(JSON.stringify({id:n,method,params}))});
 const evaluate=async expression=>(await call("Runtime.evaluate",{expression,returnByValue:true})).result.value;
 await call("Page.enable");await call("Runtime.enable");
 await call("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await call("Page.navigate",{url:"http://localhost:3100/routes/"+routeId});
 let link;
 for(let i=0;i<20;i++){await delay(500);link=await evaluate('document.querySelector(\'a[href^="/booking?route="]\')?.getAttribute("href") || ""');if(link)break}
 if(!link)throw Error("Route Details Book Ticket link was not rendered");
 console.log("Route Details Book Ticket",link);
 await evaluate('document.querySelector(\'a[href^="/booking?route="]\').click()');
 let state;
 for(let i=0;i<20;i++){await delay(500);state=await evaluate('JSON.stringify({path:location.pathname,route:document.querySelector(\'select[name="route"]\')?.value,bus:document.body.innerText.includes("'+bus.busNumber+'"),next:[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Log in to continue"))?.disabled})');if(JSON.parse(state).route===routeId)break}
 console.log("Booking form",state);
 for(const width of [360,375,390,412,768,1024,1440]){
  await call("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<768});await delay(150);
  const metric=await evaluate('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,progressRight:Math.ceil(document.querySelector(\'ol[aria-label="Booking steps"]\')?.getBoundingClientRect().right||0),route:document.querySelector(\'select[name="route"]\')?.value})');
  console.log("viewport",width,metric);
 }
 console.log("runtime errors",JSON.stringify(errors));ws.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>chrome.kill());

