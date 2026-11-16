/* ===== ENGINE: turns DATA into a month-by-month ledger ===== */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function keyOf(i) { const [y, m] = DATA.start.split("-").map(Number); const t = (m - 1) + i; return `${y + Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; }
function idxOf(k) { const [y0, m0] = DATA.start.split("-").map(Number); const [y, m] = k.split("-").map(Number); return (y - y0) * 12 + (m - m0); }
function labelOf(k, long) { const [y, m] = k.split("-").map(Number); const n = MONTH_NAMES[m - 1]; return long ? `${n} ${y}` : `${n.slice(0, 3)} ${y}`; }
function round2(n) { return Math.round(n * 100) / 100; }

function buildLedger(today) {
  const N = DATA.months;
  const months = Array.from({ length: N }, (_, i) => ({ idx: i, key: keyOf(i), cards: {} }));
  DATA.cards.forEach(c => months.forEach(m => { m.cards[c.id] = { lines: [], due: 0, converted: 0 }; }));
  const conv = {}; DATA.conversions.forEach(c => { conv[c.card + "|" + c.month] = c; });
  DATA.items.forEach(it => {
    for (let j = 0; j < it.count; j++) {
      const i = idxOf(it.first) + j; if (i < 0 || i >= N) continue;
      const k = keyOf(i);
      const amount = (it.overrides && it.overrides[k] !== undefined) ? it.overrides[k] : it.amount;
      const seq = it.seq ? { n: it.seq.start + j, of: it.seq.total } : (it.once ? null : { n: j + 1, of: it.count });
      const line = { id: it.id, name: it.name, amount, seq, added: !!it.added, once: !!it.once, converted: !!conv[it.card + "|" + k] };
      months[i].cards[it.card].lines.push(line);
    }
  });
  DATA.conversions.forEach(cv => {
    const i0 = idxOf(cv.month); if (i0 < 0 || i0 >= N) return;
    const base = months[i0].cards[cv.card].lines.reduce((s, l) => s + l.amount, 0);
    const per = cv.payment !== undefined ? cv.payment : base * (1 + cv.ratePct * cv.months / 100) / cv.months;
    for (let j = 0; j < cv.months; j++) {
      const i = idxOf(cv.from) + j; if (i < 0 || i >= N) continue;
      months[i].cards[cv.card].lines.push({ id: "conv-" + cv.card, name: cv.name, amount: per, seq: { n: j + 1, of: cv.months }, added: false, once: false, converted: false, isConversion: true });
    }
  });
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  DATA.cards.forEach(c => months.forEach(m => {
    const cm = m.cards[c.id];
    cm.due = round2(cm.lines.filter(l => !l.converted).reduce((s, l) => s + l.amount, 0));
    cm.converted = round2(cm.lines.filter(l => l.converted).reduce((s, l) => s + l.amount, 0));
    const [y, mo] = m.key.split("-").map(Number);
    cm.dueDate = new Date(y, mo - 1, c.dueDay);
    const ov = DATA.paymentOverrides[c.id] && DATA.paymentOverrides[c.id][m.key];
    cm.paid = ov !== undefined ? ov : (t0 >= cm.dueDate ? cm.due : 0);
    cm.left = round2(Math.max(0, cm.due - cm.paid));
    cm.days = Math.round((cm.dueDate - t0) / 86400000);
    cm.status = cm.due === 0 ? "clear" : cm.left === 0 ? "paid" : cm.days < 0 ? "overdue" : cm.days <= 3 ? "soon" : cm.days <= 7 ? "upcoming" : "ok";
  }));
  months.forEach(m => { m.total = round2(DATA.cards.reduce((s, c) => s + m.cards[c.id].due, 0)); });
  const cur = Math.min(Math.max(idxOf(`${t0.getFullYear()}-${String(t0.getMonth() + 1).padStart(2, "0")}`), 0), N - 1);
  return { months, cur, today: t0 };
}
function committed(L, cardId) {
  const a = DATA.actualBalance[cardId]; if (a !== null && a !== undefined) return { value: a, actual: true };
  let s = 0; for (let i = L.cur; i < L.months.length; i++) s += L.months[i].cards[cardId].left;
  return { value: round2(s), actual: false };
}
if (false && typeof module !== "undefined") module.exports = { DATA, buildLedger, committed, keyOf, idxOf, labelOf };

(function(){
const $ = s => document.querySelector(s);
const fmt = n => "₱" + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const todayOverride = window.__TODAY__ ? new Date(window.__TODAY__) : new Date();
const L = buildLedger(todayOverride);
const cards = DATA.cards, byId = Object.fromEntries(cards.map(c=>[c.id,c]));
const cvar = id => ({platinum:"--c-plat",gold:"--c-gold",bpi:"--c-bpi"})[id];
const dayWord = d => d===0?"Today":d===1?"Tomorrow":d>1?`${d} days`:d===-1?"Yesterday":`${-d} days ago`;
const dateLong = d => d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
const dateShort = d => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
const STATUS = {paid:["Paid","✓"],clear:["Nothing due","–"],ok:["On track","●"],upcoming:["Due this week","◷"],soon:["Due soon","!"],overdue:["Overdue","!"]};
const chip = s => `<span class="chip ${s}"><span aria-hidden="true">${STATUS[s][1]}</span>${STATUS[s][0]}</span>`;
const cur = L.cur, M = L.months;
let sel = cur, tab = cards[0].id;

/* theme */
const root = document.documentElement;
function isDark(){ const t=root.getAttribute("data-theme"); return t? t==="dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function paintTheme(){ $("#theme-label").textContent = isDark()?"Light":"Dark"; }
try{ const t=localStorage.getItem("ledger-theme"); if(t) root.setAttribute("data-theme",t);}catch(e){}
$("#theme").addEventListener("click",()=>{ const n=isDark()?"light":"dark"; root.setAttribute("data-theme",n); try{localStorage.setItem("ledger-theme",n);}catch(e){} paintTheme(); });
paintTheme();

/* hero */
function nextEvent(){
  for(let i=cur;i<M.length;i++){
    const open = cards.filter(c=>M[i].cards[c.id].left>0).sort((a,b)=>M[i].cards[a.id].dueDate-M[i].cards[b.id].dueDate);
    if(!open.length) continue;
    const first = M[i].cards[open[0].id].dueDate.getTime();
    const group = open.filter(c=>M[i].cards[c.id].dueDate.getTime()===first);
    return {i, group, date:M[i].cards[open[0].id].dueDate, days:M[i].cards[open[0].id].days};
  }
  return null;
}
function renderHero(){
  const ev = nextEvent(); const el=$("#next");
  if(!ev){ el.innerHTML=`<div class="eyebrow">Next payment</div><div class="days">All clear</div><div class="date">Nothing left to pay in the months on file.</div>`; }
  else{
    const total = ev.group.reduce((s,c)=>s+M[ev.i].cards[c.id].left,0);
    el.innerHTML = `<div class="eyebrow">Next payment</div>
      <div class="when"><div class="days">${dayWord(ev.days)}</div><div class="date">${dateLong(ev.date)}</div></div>
      <div class="amt" data-count="${total}">${fmt(total)}</div>
      <div class="rows">${ev.group.map(c=>`<div class="r"><span class="dot d-${c.id}"></span>${esc(c.name)}<span class="num">${fmt(M[ev.i].cards[c.id].left)}</span></div>`).join("")}</div>`;
  }
  const m=M[cur], tot=m.total, paid=cards.reduce((s,c)=>s+Math.min(m.cards[c.id].paid,m.cards[c.id].due),0), left=Math.max(0,tot-paid);
  const nxt = M[cur+1]; 
  const peak = M.reduce((a,b)=>b.total>a.total?b:a, M[cur]);
  $("#glance").innerHTML = `<div><div class="eyebrow">${labelOf(m.key,true)} so far</div><h3 style="margin-top:8px">${fmt(left)} left to pay</h3></div>
    <div class="meter" role="img" aria-label="${fmt(paid)} paid of ${fmt(tot)}">${cards.map(c=>{const p=Math.min(m.cards[c.id].paid,m.cards[c.id].due); return p>0?`<i style="width:${p/tot*100}%;background:var(${cvar(c.id)})"></i>`:""}).join("")}</div>
    <div class="stats"><div class="stat"><div class="k">Billed</div><div class="v">${fmt(tot)}</div></div><div class="stat"><div class="k">Paid</div><div class="v">${fmt(paid)}</div></div><div class="stat"><div class="k">Left</div><div class="v">${fmt(left)}</div></div></div>
    <div class="more">${nxt?`<div><span>${labelOf(nxt.key,true)}</span><span class="num">${fmt(nxt.total)}</span></div>`:""}<div><span>Heaviest month ahead</span><span class="num">${labelOf(peak.key)} · ${fmt(peak.total)}</span></div><div><span>Last bill on file</span><span class="num">${labelOf(M.filter(x=>x.total>0).slice(-1)[0].key)}</span></div></div>`;
}

/* tiles */
function renderTiles(){
  const nth = d => ["th","st","nd","rd"][(d%100>10&&d%100<14)||d%10>3?0:d%10];
  $("#tiles").innerHTML = cards.map((c,ci)=>{
    const cm=M[cur].cards[c.id];
    const win=M.slice(cur,cur+12), mx=Math.max(...win.map(x=>x.cards[c.id].due),1);
    const upcoming = (()=>{ for(let i=cur;i<M.length;i++){ if(M[i].cards[c.id].left>0) return M[i].cards[c.id]; } return null; })();
    return `<article class="panel tile rv" style="--cc:var(${cvar(c.id)});--d:${ci*90+120}ms">
      <div class="face f-${c.id}">
        <svg class="chip-art" viewBox="0 0 34 26" aria-hidden="true"><rect x="1" y="1" width="32" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".8"/><path d="M1 9h10M1 17h10M23 9h10M23 17h10M11 1v24M23 1v24" stroke="currentColor" stroke-width="1.2" opacity=".55"/></svg>
        <svg class="wave" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6c2.5 3.5 2.5 8.500 0 12M11 4c3.600 5 3.600 11 0 16M15 2c4.700 6.500 4.700 13.500 0 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".75"/></svg>
        <h3>${esc(c.name)}</h3><div class="fd">Due every ${c.dueDay}${nth(c.dueDay)}</div>
      </div>
      <div class="trow"><div><div class="eyebrow">${labelOf(M[cur].key,true)}</div><div class="big" data-count="${cm.due}" style="margin-top:8px">${fmt(cm.due)}</div></div>${chip(cm.status)}</div>
      <div class="sub">${cm.converted>0?`${fmt(cm.converted)} converted to instalments · `:""}${upcoming?`Next bill ${dateShort(upcoming.dueDate)} · ${dayWord(upcoming.days)}`:"Nothing left to pay"}</div>
      <div><div class="spark" role="img" aria-label="Next 12 months for ${esc(c.name)}">${win.map((x,i)=>`<i class="on ${i===0?"now":""}" style="height:${Math.max(4,x.cards[c.id].due/mx*100)}%;--i:${i}" title="${labelOf(x.key,true)}: ${fmt(x.cards[c.id].due)}"></i>`).join("")}</div>
      <div class="spark-cap"><span>${labelOf(win[0].key)}</span><span>${labelOf(win[win.length-1].key)}</span></div></div>
    </article>`;}).join("");
}

/* limits */
function renderLimits(){
  $("#limits").innerHTML = DATA.pools.map(p=>{
    const parts = p.cards.map(id=>({id, ...committed(L,id)}));
    const total = parts.reduce((s,x)=>s+x.value,0), ratio = total/p.limit, scale = Math.max(1,ratio);
    const anyActual = parts.some(x=>x.actual);
    return `<div class="panel limit"><div class="hd"><h3>${esc(p.name)}</h3><span class="num" style="font-size:14px">${fmt(p.limit)}</span></div>
      <div class="meter" role="img" aria-label="${Math.round(ratio*100)} percent of limit">${parts.map(x=>`<i style="width:${x.value/p.limit/scale*100}%;background:var(${cvar(x.id)})"></i>`).join("")}</div>
      <div class="hd"><span class="num" style="font-size:20px">${(ratio*100).toFixed(0)}%</span><span class="sub" style="font-size:13px;color:var(--ink-2)">${fmt(total)} ${anyActual?"balance":"still to pay"}</span></div>
      <div class="legend">${parts.map(x=>`<span><span class="dot d-${x.id}"></span>${esc(byId[x.id].short)} <span class="num">${fmt(x.value)}</span></span>`).join("")}</div>
      ${ratio>1?`<p class="note" style="color:var(--crit)">Remaining instalments exceed this limit. Your real balance is likely lower; enter it to replace the estimate.</p>`:`<p class="note">${anyActual?"Uses the balance you entered.":"Estimate: unpaid amounts from this month onward."}</p>`}</div>`;
  }).join("");
}

/* chart */
const W=920,H=300,ml=54,mr=8,mt=14,mb=44;
function niceStep(v){ const p=Math.pow(10,Math.floor(Math.log10(v))-1); for(const f of [1,2,2.5,5,10,20,25,50,100]){ if(Math.ceil(v/(f*p))<=6) return f*p; } return p*100; }
let firstChart=true;
function renderChart(){
  const vmax=Math.max(...M.map(m=>m.total)), step=niceStep(vmax), steps=Math.ceil(vmax/step), mx=step*steps, bw=(W-ml-mr)/M.length, bar=bw*0.64;
  const y=v=>mt+(H-mt-mb)*(1-v/mx);
  let s="";
  for(let t=0;t<=steps;t++){ const v=step*t; s+=`<line class="grid" x1="${ml}" x2="${W-mr}" y1="${y(v)}" y2="${y(v)}"/><text x="${ml-8}" y="${y(v)+4}" text-anchor="end">${v===0?"₱0":"₱"+(v/1000)+"k"}</text>`; }
  M.forEach((m,i)=>{
    const x0=ml+i*bw, cx=x0+bw/2, isSel=i===sel;
    s+=`<g class="${isSel?"sel":""}" style="--i:${i}">`;
    if(isSel) s+=`<rect class="band" x="${x0+1}" y="${mt}" width="${bw-2}" height="${H-mt-mb+4}" rx="6"/>`;
    let acc=0; const segs=cards.map(c=>({c,v:m.cards[c.id].due})).filter(x=>x.v>0);
    segs.forEach((sg,k)=>{ const top=y(acc+sg.v), bot=y(acc), h=Math.max(0,bot-top-(k>0?2:0)), yy=bot-h; const r=Math.min(4,h/2);
      const last=k===segs.length-1; const bx=cx-bar/2;
      s+= last && h>0 ? `<path class="s-${sg.c.id}" d="M${bx},${yy+h} V${yy+r} Q${bx},${yy} ${bx+r},${yy} H${bx+bar-r} Q${bx+bar},${yy} ${bx+bar},${yy+r} V${yy+h} Z"/>` : `<rect class="s-${sg.c.id}" x="${bx}" y="${yy}" width="${bar}" height="${h}"/>`;
      acc+=sg.v; });
    const mo=labelOf(m.key).slice(0,3), yr=m.key.slice(0,4);
    s+=`<text x="${cx}" y="${H-mb+18}" text-anchor="middle">${mo}</text>`;
    if(i===0||m.key.endsWith("-01")) s+=`<text x="${cx}" y="${H-mb+34}" text-anchor="middle" style="fill:var(--ink-2)">${yr}</text>`;
    if(i===cur) s+=`<text x="${cx}" y="${mt-3}" text-anchor="middle" style="fill:var(--ink)">now</text>`;
    s+=`<rect class="hit" data-i="${i}" x="${x0}" y="${mt}" width="${bw}" height="${H-mt}" tabindex="0" role="button" aria-label="${labelOf(m.key,true)}, total ${fmt(m.total)}"/></g>`;
  });
  const svg=$("#chart"); svg.setAttribute("viewBox",`0 0 ${W} ${H}`); svg.innerHTML=s; if(firstChart){ svg.classList.add("grow"); firstChart=false; } else svg.classList.remove("grow");
}
const tip=$("#tip");
function showTip(i,target){
  const m=M[i]; tip.innerHTML=`<b>${labelOf(m.key,true)}</b>${cards.map(c=>`<div><span class="dot d-${c.id}"></span>${esc(c.short)}<span class="num">${fmt(m.cards[c.id].due)}</span></div>`).join("")}<div style="border-top:1px solid var(--line);margin-top:4px;padding-top:6px;font-weight:600">Total<span class="num">${fmt(m.total)}</span></div>`;
  const wrap=$("#chartwrap"), svg=$("#chart"), sr=svg.getBoundingClientRect(), wr=wrap.getBoundingClientRect(), k=sr.width/W;
  let x=(ml+i*((W-ml-mr)/M.length))*k + wrap.scrollLeft + 14; const tw=210;
  const maxX = wrap.scrollLeft + wrap.clientWidth - tw - 6; if(x>maxX) x = (ml+i*((W-ml-mr)/M.length))*k + wrap.scrollLeft - tw + 6;
  tip.style.left=Math.max(4,x)+"px"; tip.style.top="10px"; tip.classList.add("on");
}
const hideTip=()=>tip.classList.remove("on");
$("#chart").addEventListener("mouseover",e=>{const t=e.target.closest(".hit"); if(t) showTip(+t.dataset.i,t);});
$("#chart").addEventListener("mouseleave",hideTip);
$("#chart").addEventListener("focusin",e=>{const t=e.target.closest(".hit"); if(t) showTip(+t.dataset.i,t);});
$("#chart").addEventListener("focusout",hideTip);
$("#chart").addEventListener("click",e=>{const t=e.target.closest(".hit"); if(t) select(+t.dataset.i);});
$("#chart").addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.classList.contains("hit")){ e.preventDefault(); select(+e.target.dataset.i);} });

/* month detail */
function renderMonth(){
  const m=M[sel];
  $("#msel").value=sel; $("#prev").disabled=sel===0; $("#nextm").disabled=sel===M.length-1;
  $("#mgrid").innerHTML = cards.map(c=>{
    const cm=m.cards[c.id];
    const lines = cm.lines.slice().sort((a,b)=>b.amount-a.amount).map(l=>`<div class="line ${l.converted?"conv":""}">
      <div class="nm"><span>${esc(l.name)}</span>${l.added?'<span class="chip added">Added</span>':""}${l.converted?'<span class="chip added">Converted</span>':""}</div>
      <div class="sq">${l.seq?`${l.seq.n} of ${l.seq.of}`:"One-time"}</div><div class="num">${fmt(l.amount)}</div></div>`).join("");
    const st = cm.status;
    return `<article class="panel mcard"><div class="hd"><span class="dot d-${c.id}"></span><h3>${esc(c.name)}</h3>${chip(st)}</div>
      <div class="due">${cm.due>0||cm.converted>0?`Due ${dateLong(cm.dueDate)}`:"No bill this month"}</div>
      ${lines||'<div class="empty">Nothing billed.</div>'}
      <div class="tot"><span>Due</span><span class="num">${fmt(cm.due)}</span></div></article>`;
  }).join("");
  renderChart();
}
function select(i){ sel=Math.max(0,Math.min(M.length-1,i)); renderMonth(); }
$("#msel").innerHTML = M.map((m,i)=>`<option value="${i}">${labelOf(m.key,true)}</option>`).join("");
$("#msel").addEventListener("change",e=>select(+e.target.value));
$("#prev").addEventListener("click",()=>select(sel-1)); $("#nextm").addEventListener("click",()=>select(sel+1));
$("#clegend").innerHTML = cards.map(c=>`<span><span class="dot d-${c.id}"></span> ${esc(c.name)}</span>`).join("");

/* installments */
function groups(cardId){
  const g={};
  M.forEach((m,i)=>m.cards[cardId].lines.forEach(l=>{ (g[l.id]=g[l.id]||{name:l.name,added:l.added,items:[]}).items.push({i,l,cm:m.cards[cardId]}); }));
  return Object.values(g).map(x=>{
    const done = x.items.filter(o=>o.i<cur || (o.i===cur && (o.cm.status==="paid"||o.l.converted)));
    const rest = x.items.filter(o=>!done.includes(o));
    const first=x.items[0], last=x.items[x.items.length-1];
    const total = last.l.seq? last.l.seq.of : 1;
    const nowNo = done.length? (done[done.length-1].l.seq? done[done.length-1].l.seq.n : 1) : (first.l.seq? first.l.seq.n-1 : 0);
    return {name:x.name, added:x.added, once:!!first.l.once, amount:last.l.amount, nowNo, total, restN:rest.length, restSum:rest.reduce((s,o)=>s+o.l.amount,0), end:M[last.i].key, converted:x.items.every(o=>o.l.converted), isConv:!!first.l.isConversion, rest};
  }).sort((a,b)=>b.restSum-a.restSum||a.end.localeCompare(b.end));
}
function renderInst(){
  const c=byId[tab], g=groups(tab), act=g.filter(x=>x.restN>0), fin=g.filter(x=>x.restN===0);
  const monthly = M[cur].cards[tab].due, remain=act.reduce((s,x)=>s+x.restSum,0), endAll = act.length? act.map(x=>x.end).sort().slice(-1)[0] : null;
  const row = x => `<tr><td><b style="font-weight:500">${esc(x.name)}</b> ${x.added?'<span class="chip added">Added</span>':""}${x.converted?'<span class="chip added">Converted</span>':""}</td>
    <td class="num">${fmt(x.amount)}</td>
    <td><div class="prog">${x.once?'<span>One-time</span>':`<div class="tr"><i style="width:${Math.min(100,x.nowNo/x.total*100)}%"></i></div><span>${x.nowNo} of ${x.total}</span>`}</div></td>
    <td class="r num">${x.restN?fmt(x.restSum):"–"}</td><td class="r">${labelOf(x.end)}</td></tr>`;
  const head = `<thead><tr><th>Instalment</th><th>Monthly</th><th>Progress</th><th class="r">Still to pay</th><th class="r">Last bill</th></tr></thead>`;
  $("#inst").style.setProperty("--cc",`var(${cvar(tab)})`);
  $("#inst").innerHTML = `<div class="summary"><div class="stat"><div class="k">Billed ${labelOf(M[cur].key,true)}</div><div class="v">${fmt(monthly)}</div></div><div class="stat"><div class="k">Still to pay on instalments</div><div class="v">${fmt(remain)}</div></div><div class="stat"><div class="k">Final bill</div><div class="v">${endAll?labelOf(endAll,true):"None"}</div></div></div>
    <div class="tscroll"><table>${head}<tbody>${act.map(row).join("")||'<tr><td colspan="5" style="color:var(--muted)">No running instalments.</td></tr>'}</tbody></table></div>
    ${fin.length?`<details class="fin"><summary>${fin.length} finished or one-time</summary><div class="tscroll"><table>${head}<tbody>${fin.map(row).join("")}</tbody></table></div></details>`:""}`;
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.id===tab));
}
$("#tabs").innerHTML = cards.map(c=>`<button role="tab" data-id="${c.id}" aria-selected="false"><span class="dot d-${c.id}"></span>${esc(c.name)}</button>`).join("");
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button"); if(b){tab=b.dataset.id; renderInst();}});

/* additions */
function renderAdded(){
  const list = DATA.items.filter(x=>x.added).sort((a,b)=>a.first.localeCompare(b.first));
  $("#added").innerHTML = list.map(x=>`<div class="add"><span class="dot d-${x.card}"></span><div><div class="nm">${esc(x.name)}</div><div class="sm">${esc(byId[x.card].short)} · ${x.once?`one-time in ${labelOf(x.first,true)}`:`${x.count} months from ${labelOf(x.first,true)}`}</div></div>
    <div class="num">${fmt(x.amount)}${x.count>1?`<div class="sm">× ${x.count} = ${fmt(x.amount*x.count)}</div>`:""}</div></div>`).join("");
}
$("#foot-src").textContent = `Built from ${DATA.source}. Updated ${new Date(DATA.asOf+"T00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}.`;

renderHero(); renderTiles(); renderLimits(); renderMonth(); renderInst(); renderAdded();

/* motion */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function countUp(el){
  const to=parseFloat(el.dataset.count); if(reduce||!isFinite(to)||to===0) return;
  const t0=performance.now(), D=650;
  const step=now=>{ const p=Math.min(1,(now-t0)/D), e=1-Math.pow(1-p,3); el.textContent=fmt(to*e); if(p<1) requestAnimationFrame(step); else el.textContent=fmt(to); };
  requestAnimationFrame(step);
}
document.querySelectorAll("[data-count]").forEach(countUp);
document.querySelectorAll(".hero > .panel, .limit, .tl, .mcard, .inst, .added-list, .sec-head").forEach((el,i)=>{ el.classList.add("rv"); el.style.setProperty("--d",(Math.min(i,8)*70)+"ms"); });
(function floaters(){
  const box=$("#floaters"); if(!box||reduce) return;
  const cols=["--c-plat","--c-gold","--c-bpi"]; const n = innerWidth<700 ? 3 : 6;
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let i=0;i<n;i++){
    const d=document.createElement("div"); d.className="fl";
    const w=70+rnd()*110;
    d.style.cssText=`--cc:var(${cols[i%3]});left:${(rnd()*96).toFixed(1)}%;width:${w.toFixed(0)}px;--r:${(rnd()*50-25).toFixed(0)}deg;--sw:${(rnd()*60-30).toFixed(0)}px;animation-duration:calc(${(16+rnd()*14).toFixed(0)}s / var(--bg-speed));animation-delay:-${(rnd()*20).toFixed(0)}s`;
    box.appendChild(d);
  }
})();
})();
