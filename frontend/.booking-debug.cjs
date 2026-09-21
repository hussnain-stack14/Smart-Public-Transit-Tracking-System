const {spawn}=require("node:child_process");
const path=require("node:path");
const chrome=spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",["--headless","--no-sandbox","--disable-gpu","--remote-debugging-port=9233","--remote-allow-origins=*","--user-data-dir="+path.resolve(".booking-debug-profile"),"about:blank"],{stdio:"ignore"});
const delay=n=>new Promise(r=>setTimeout(r,n));
(async()=>{
 let pages;for(let i=0;i<30;i++){try{pages=await(await fetch("http://127.0.0.1:9233/json/list")).json();break}catch{await delay(300)}}
 const ws=new WebSocket(pages.find(p=>p.type==="page").webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}};
 const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
 await call("Page.enable");await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await call("Page.navigate",{url:"http://localhost:3100/booking?route=6aae14238a36eacd5539e12f"});await delay(7000);
 const expr='JSON.stringify({url:location.href,heading:document.querySelector("h1")?.textContent,route:document.querySelector("select[name=route]")?.value,options:[...document.querySelectorAll("select[name=route] option")].map(o=>o.value),error:document.querySelector("[role=alert]")?.textContent,text:document.body.innerText.slice(0,700)})';
 console.log((await call("Runtime.evaluate",{expression:expr,returnByValue:true})).result.value);ws.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>chrome.kill());

