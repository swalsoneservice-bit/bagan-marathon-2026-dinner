/* Configure API_URL after deploying Apps Script as a Web App. */
const API_URL = "https://script.google.com/macros/s/AKfycbzJmy2-nl8hd2XZuCv2PDyF9_srQ36RLF7O1H-X4hBD7uxvvpty-T_oZntu61x3Vf5ltQ/exec";
const PRICE_PER_PERSON = 40000;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
let adminPassword = "";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
function showTab(id){document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));if(id==="guests")loadGuests();if(id==="admin"&&adminPassword)loadAdmin();document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});}
$$("[data-tab]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();showTab(b.dataset.tab)}));
const count=$("#guestCount");for(let i=1;i<=20;i++){const o=document.createElement("option");o.value=i;o.textContent=`${i} ${i===1?"Person":"People"}`;count.append(o)}
count.addEventListener("change",()=>$("#totalAmount").textContent=(Number(count.value)*PRICE_PER_PERSON).toLocaleString()+" MMK");
function message(el,txt,ok=false){el.textContent=txt;el.classList.toggle("success",ok)}
async function api(action,data={}){if(!API_URL.startsWith("https://script.google.com/"))throw new Error("Website setup incomplete: Apps Script API URL has not been configured.");const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...data})});const j=await r.json();if(!j.ok)throw new Error(j.error||"Request failed");return j}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=()=>reject(new Error("Could not read the payment file. Please try again."));r.readAsDataURL(file)})}
async function optimizePaymentImage(file){
  if(!file.type.startsWith("image/")||!("createImageBitmap" in window))return file;
  try{
    const bitmap=await createImageBitmap(file);
    const maxEdge=2000,scale=Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext("2d",{alpha:false});
    ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.90));
    if(!blob||blob.size>=file.size*.95)return file;
    const baseName=file.name.replace(/\.[^.]+$/,"");
    return new File([blob],baseName+".jpg",{type:"image/jpeg",lastModified:Date.now()});
  }catch(err){console.warn("Payment image optimization skipped:",err);return file}
}
$("#registrationForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const f=e.currentTarget,btn=$("#submitRegistration"),m=$("#registrationMessage"),fd=new FormData(f),file=$("#paymentFile").files[0];
  if(!file)return message(m,"Please upload your payment screenshot.");
  if(file.size>MAX_UPLOAD_BYTES)return message(m,"File exceeds the 8 MB limit.");
  const allowed=["image/jpeg","image/png","application/pdf"];
  if(!allowed.includes(file.type))return message(m,"Only JPG, JPEG, PNG or PDF files are accepted.");
  btn.disabled=true;btn.textContent="PREPARING...";
  try{
    message(m,"Preparing your payment proof. Please keep this page open.");
    const uploadFile=await optimizePaymentImage(file);
    const base64=await fileToBase64(uploadFile);
    btn.textContent="SENDING...";
    message(m,uploadFile.size<file.size? `Image optimized (${Math.max(1,Math.round((1-uploadFile.size/file.size)*100))}% smaller). Sending registration securely...` : "Sending registration and payment proof securely. Please do not close this page.");
    const payload={
      name:fd.get("name").trim(),email:fd.get("email").trim(),phone:fd.get("phone").trim(),viber:fd.get("viber").trim(),
      guests:Number(fd.get("guests")),remark:fd.get("remark").trim(),paymentMethod:fd.get("paymentMethod"),
      paymentReference:fd.get("paymentReference").trim(),fileName:uploadFile.name,fileMimeType:uploadFile.type,fileBase64:base64
    };
    const result=await api("register",payload);
    f.reset();$("#totalAmount").textContent="40,000 MMK";
    message(m,`Registration received. Your Registration ID is ${result.registrationId}. Payment is pending admin verification.`,true);
  }catch(err){message(m,err.message||"Registration failed. Please try again.")}
  finally{btn.disabled=false;btn.textContent="SUBMIT REGISTRATION"}
});
function formatDinnerDate(value){
  const raw=String(value||"2026-11-22").trim().replace(/[၀-၉]/g,ch=>String("၀၁၂၃၄၅၆၇၈၉".indexOf(ch)));
  const months={JAN:0,JANUARY:0,FEB:1,FEBRUARY:1,MAR:2,MARCH:2,APR:3,APRIL:3,MAY:4,JUN:5,JUNE:5,JUL:6,JULY:6,AUG:7,AUGUST:7,SEP:8,SEPT:8,SEPTEMBER:8,OCT:9,OCTOBER:9,NOV:10,NOVEMBER:10,DEC:11,DECEMBER:11};
  let day,month,year,m;
  if((m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))){year=+m[1];month=+m[2]-1;day=+m[3];}
  else if((m=raw.match(/^(\d{1,2})[\s\/-]+([A-Za-z]+)[\s\/-]+(\d{4})$/))){day=+m[1];month=months[m[2].toUpperCase()];year=+m[3];}
  else if((m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))){day=+m[1];month=+m[2]-1;year=+m[3];}
  if(!Number.isInteger(day)||!Number.isInteger(month)||month<0||month>11||!Number.isInteger(year)||day<1||day>31)return "22/NOV/2026";
  return String(day).padStart(2,"0")+"/"+["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][month]+"/"+year;
}
function formatDinnerTime(value){
  const raw=String(value||"18:00").trim().replace(/[၀-၉]/g,ch=>String("၀၁၂၃၄၅၆၇၈၉".indexOf(ch)));
  let m=raw.match(/^(\d{1,2}):(\d{2})$/);
  if(m){const h=Number(m[1]),min=m[2],ampm=h>=12?"PM":"AM",hour=h%12||12;return hour+":"+min+" "+ampm;}
  m=raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  return m?Number(m[1])+":"+m[2]+" "+m[3].toUpperCase():"6:00 PM";
}
async function loadPublicDinnerDetails(){try{const r=await api("publicSettings");if(!r.settings)return;const date=$("#dinnerDate"),time=$("#dinnerTime");if(date)date.textContent=formatDinnerDate(r.settings.eventDate);if(time)time.textContent=formatDinnerTime(r.settings.eventTime);}catch(e){console.warn("Could not load current dinner date/time:",e.message)}}
async function loadGuests(){const list=$("#officialGuestList");list.innerHTML="<li>Loading...</li>";try{const r=await api("publicGuestList");window.approvedNames=r.names||[];renderGuests()}catch(e){list.innerHTML="<li>Guest list is temporarily unavailable.</li>";$("#guestTotal").textContent="";}}
function renderGuests(){const q=$("#guestSearch").value.toLowerCase();const names=(window.approvedNames||[]).filter(n=>n.toLowerCase().includes(q));$("#officialGuestList").innerHTML=names.length?names.map(n=>`<li>${escapeHtml(n)}</li>`).join(""):"<li>No approved guests found.</li>";$("#guestTotal").textContent=`${names.length} guest name(s)`}
$("#guestSearch").addEventListener("input",renderGuests);
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
let qrCodeLoadPromise;
function loadQRCodeLibrary(){
  if(window.QRCode)return Promise.resolve(window.QRCode);
  if(qrCodeLoadPromise)return qrCodeLoadPromise;
  const sources=[
    "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
    "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
    "https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js"
  ];
  qrCodeLoadPromise=(async()=>{
    for(const src of sources){
      try{
        await new Promise((resolve,reject)=>{
          const script=document.createElement("script");
          script.src=src;
          script.async=true;
          script.onload=()=>window.QRCode?resolve():reject(new Error("QR library did not initialize"));
          script.onerror=()=>reject(new Error("QR library could not be loaded"));
          document.head.appendChild(script);
        });
        if(window.QRCode)return window.QRCode;
      }catch(err){console.warn("QR library source failed:",src,err);}
    }
    throw new Error("QR Code library could not be loaded. Please refresh the page and try again.");
  })();
  return qrCodeLoadPromise;
}
async function makeTicket(t){
  $("#ticketArea").innerHTML=`<div class="ticket-card" id="printTicket"><div class="ticket-id">BAGAN MARATHON 2026 · OFFICIAL DINNER</div><h3>DINNER ADMISSION</h3><p>Organized by RUNderful Myanmar</p><div class="gold-rule"></div><div class="ticket-name">${escapeHtml(t.name)}</div><div class="ticket-guests">TOTAL GUESTS: ${Number(t.guests)}</div><div id="ticketQr">Loading QR Code...</div><div class="ticket-id">${escapeHtml(t.registrationId)}</div><p>Website Development by Swal-Sone-Service</p></div><div class="ticket-actions"><button class="gold-button" onclick="window.print()">DOWNLOAD / SAVE AS PDF</button></div>`;
  try{
    const QR=await loadQRCodeLibrary();
    const target=$("#ticketQr");
    target.textContent="";
    new QR(target,{text:t.verifyUrl,width:150,height:150,colorDark:"#142b35",colorLight:"#ffffff",correctLevel:QR.CorrectLevel.M});
  }catch(err){
    $("#ticketQr").textContent="QR Code unavailable. Please refresh and try again.";
    console.error(err);
  }
}
$("#ticketLookup").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),m=$("#ticketMessage");$("#ticketArea").innerHTML="";try{const r=await api("getTicket",{registrationId:f.get("registrationId").trim(),email:f.get("email").trim()});if(r.ticket)makeTicket(r.ticket);message(m,"Approved ticket found.",true)}catch(err){message(m,err.message)}});
async function verifyTicket(){const id=new URLSearchParams(location.search).get("verify");if(!id)return;showTab("verify");try{const r=await api("verifyTicket",{registrationId:id});const t=r.ticket;$("#verifyResult").innerHTML=`<h2>${escapeHtml(t.name)}</h2><p>Email: ${escapeHtml(t.email)}</p><p>Phone: ${escapeHtml(t.phone)}</p><p>Total Guests: <b>${Number(t.guests)}</b></p><p>Registration ID: ${escapeHtml(t.registrationId)}</p><p class="message success">APPROVED · VALID DINNER TICKET</p>`}catch(e){$("#verifyResult").textContent="Ticket could not be verified: "+e.message}}
$("#adminLogin").addEventListener("submit",async e=>{e.preventDefault();const pw=new FormData(e.currentTarget).get("password");try{await api("adminList",{password:pw});adminPassword=pw;message($("#adminMessage"),"Login successful.",true);$("#adminLogin").hidden=true;loadAdmin()}catch(err){message($("#adminMessage"),err.message)}});

function renderAdminRecords(records){
  const safeRecords=Array.isArray(records)?records:[];
  const methods=["KBZPay","CBPay","AYAPay","WavePay"];
  const getMethod=x=>{
    const value=String(x.paymentMethod??x.payment_method??"").trim();
    return methods.find(m=>m.toLowerCase()===value.toLowerCase())||"Other";
  };
  const summary=$("#paymentMethodSummary");
  if(summary){
    summary.innerHTML=methods.concat("Other").map(method=>{
      const group=safeRecords.filter(x=>getMethod(x)===method);
      const guests=group.reduce((sum,x)=>sum+(Number(x.guests)||0),0);
      return `<div class="payment-method-stat"><b>${escapeHtml(method==="Other"?"Other / Not specified":method)}</b><strong>${group.length}</strong><small>registration(s) · ${guests} guest(s)</small></div>`;
    }).join("");
  }
  const filter=$("#paymentMethodFilter");
  const selected=filter?filter.value:"All";
  const filtered=selected==="All"?safeRecords:safeRecords.filter(x=>getMethod(x)===selected);
  const rows=$("#adminRows");
  if(!rows)return;
  rows.innerHTML=filtered.length?filtered.map(x=>`<div class="admin-row"><b>${escapeHtml(x.name)}</b> · ${Number(x.guests)||0} guest(s)<br><small>Payment Method: <b>${escapeHtml(x.paymentMethod??x.payment_method??"Not specified")}</b><br>${escapeHtml(x.registrationId)} · ${escapeHtml(x.paymentReference)} · ${escapeHtml(x.approvalStatus)}</small><br><a href="${escapeHtml(x.screenshotUrl)}" target="_blank" rel="noopener">View payment proof</a><br><button data-approve="${escapeHtml(x.registrationId)}">APPROVE</button><button data-reject="${escapeHtml(x.registrationId)}">REJECT</button></div>`).join(""):"<p>No registrations for this payment method.</p>";
  $$("[data-approve]").forEach(b=>b.onclick=()=>updateApproval(b.dataset.approve,"Approved"));
  $$("[data-reject]").forEach(b=>b.onclick=()=>updateApproval(b.dataset.reject,"Rejected"));
}
async function loadAdmin(){const box=$("#adminDashboard");box.hidden=false;box.innerHTML="<p>Loading dashboard...</p>";try{const r=await api("adminList",{password:adminPassword});box.innerHTML=`<div class="form-card"><h2>Capacity & Registration Control</h2><p>Approved guests: <b>${r.stats.approvedGuests}</b> · Pending registrations: <b>${r.stats.pending}</b></p><label>Maximum Guest Capacity<input id="capacityInput" type="number" min="1" value="${r.settings.capacity||100}"></label><label><input id="openInput" type="checkbox" ${r.settings.open?"checked":""}> Registration Open</label><button class="gold-button" id="saveSettings">SAVE SETTINGS</button><p id="settingMessage" class="message"></p><h2>Registrations by Payment Method</h2><div id="paymentMethodSummary" class="payment-method-summary"></div><label>Filter by Payment Method<select id="paymentMethodFilter"><option value="All">All Payment Methods</option><option value="KBZPay">KBZPay</option><option value="CBPay">CBPay</option><option value="AYAPay">AYAPay</option><option value="WavePay">WavePay</option><option value="Other">Other / Not specified</option></select></label><button class="gold-button" id="exportCsv">EXPORT CSV</button><div id="adminRows"></div></div>`;$("#saveSettings").onclick=async()=>{try{await api("saveSettings",{password:adminPassword,capacity:Number($("#capacityInput").value),open:$("#openInput").checked});message($("#settingMessage"),"Settings saved.",true)}catch(e){message($("#settingMessage"),e.message)}};$("#exportCsv").onclick=()=>{const records=Array.isArray(r.records)?r.records:[];const rows=[["Registration ID","Name","Email","Phone","Guests","Amount","Payment Method","Payment Reference","Payment Status","Approval Status"],...records.map(x=>[x.registrationId,x.name,x.email,x.phone,x.guests,x.amount,x.paymentMethod??x.payment_method,x.paymentReference,x.paymentStatus,x.approvalStatus])];const csv="\ufeff"+rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bagan-dinner-registrations.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};const adminRecords=Array.isArray(r.records)?r.records:[];renderAdminRecords(adminRecords);$("#paymentMethodFilter").onchange=()=>renderAdminRecords(adminRecords);}catch(e){box.innerHTML=`<p class="message">${escapeHtml(e.message)}</p>`}}
async function updateApproval(id,status){if(!confirm(`${status} this registration?`))return;try{await api("updateApproval",{password:adminPassword,registrationId:id,status});loadAdmin()}catch(e){alert(e.message)}}
function handleLocationHash(){const id=location.hash.replace(/^#/,"");if(["home","register","guests","ticket","verify","admin"].includes(id))showTab(id);}
handleLocationHash();
window.addEventListener("hashchange",handleLocationHash);
loadPublicDinnerDetails();
verifyTicket();
