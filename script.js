'use strict';
/**
 * SalesSense — IBM SkillsBuild × Hacktiv8 (2026)
 * All analytics derive from validated source JSON, not generated/demo metrics.
 * Agent is explicitly a rule-based analytical prototype, NOT an LLM.
 */
const DATA_URL='data/sales_data.json';
const COLORS=['#6ce3bd','#8ca8ff','#f9ae77','#cb9aff','#ff8c9b','#80d5e9'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const state={records:[],filtered:[],charts:{},theme:'dark'};
const $=id=>document.getElementById(id);
const num=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const precise=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const sum=(a,fn)=>a.reduce((s,x)=>s+fn(x),0);
const groupSum=(rows,key,fn)=>rows.reduce((out,r)=>{let k=String(r[key]);out[k]=(out[k]||0)+fn(r);return out;},{});
const sortedEntries=(obj)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]);
const formatUnits=x=>`${num.format(Math.round(x))} u`;
const formatUnitsPrecise=x=>`${precise.format(x)} u`;
const CHART_ARIA_LABELS={trendChart:'Sales trend: monthly revenue over time',regionChart:'Revenue by region: polar area chart',categoryChart:'Revenue by product category: horizontal bar chart',repChart:'Revenue by sales representative: horizontal bar chart',customerChart:'Customer type distribution: doughnut chart',paymentChart:'Payment method distribution: doughnut chart',channelChart:'Sales channel distribution: doughnut chart',scatterChart:'Discount vs sales: scatter plot of individual transactions',topChart:'Top 10 highest-value transactions: horizontal bar chart',quantityChart:'Quantity sold by category: bar chart'};
const fmtDate=x=>new Date(x+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});

function populateFilter(id,field){
  const select=$(id);
  [...new Set(state.records.map(r=>r[field]))].sort().forEach(value=>{
    const option=document.createElement('option');option.value=value;option.textContent=value;select.appendChild(option);
  });
}
function applyFilters(){
  const filter={region:$('regionFilter').value,product_category:$('categoryFilter').value,customer_type:$('customerFilter').value,sales_channel:$('channelFilter').value};
  state.filtered=state.records.filter(r=>Object.entries(filter).every(([key,v])=>!v||r[key]===v));
  renderAll();
}
function renderAll(){
  const r=state.filtered;
  $('activeRecords').textContent=num.format(r.length);
  $('sidebarCount').textContent=`${r.length} / ${state.records.length} records in view`;
  $('datasetStatus').innerHTML=`<span class="live-dot"></span> ${num.format(r.length)} rows loaded`;
  $('kpiRevenue').textContent=formatUnitsPrecise(sum(r,x=>x.sales_amount));
  $('kpiTransactions').textContent=num.format(r.length);
  $('kpiQuantity').textContent=num.format(sum(r,x=>x.quantity_sold));
  $('kpiDiscount').textContent=r.length?(100*sum(r,x=>x.discount)/r.length).toFixed(2)+'%':'—';
  renderCharts(r);renderTable(r);
}
function chartSettings(kind, labels, values, extra={}){
  const pointColor=COLORS[0], isDoughnut=kind==='doughnut';
  const axisText='#9eacc2', axisGrid='rgba(165,181,213,.10)';
  let data={labels,datasets:[{
      data:values,backgroundColor:extra.colors||COLORS.slice(0,Math.max(1,values.length)),
      borderWidth:isDoughnut||kind==='polarArea'?2:0,
      borderColor:'#151c2c',hoverBorderColor:'#ffffff',
      hoverOffset:kind==='doughnut'?5:0,
      borderRadius:kind==='bar'?5:0,
      maxBarThickness:kind==='bar'?29:undefined,
      tension:.36,pointRadius:4,pointHoverRadius:6,
      fill:kind==='line',
      backgroundColor:kind==='line'?'rgba(108,227,189,.11)':extra.colors||COLORS.slice(0,Math.max(1,values.length)),
      borderColor:kind==='line'?pointColor:'#151c2c',
      pointBackgroundColor:pointColor,
      showLine:kind==='line'
    }]};
  if(kind==='scatter'){
    data={datasets:[{label:'Transactions',data:extra.points||[],backgroundColor:'rgba(108,227,189,.75)',pointRadius:4.2,pointHoverRadius:6.5,pointBorderWidth:0}]};
  }
  let opts={responsive:true,maintainAspectRatio:false,animation:{duration:350},
    plugins:{legend:{display:false},tooltip:{enabled:true,backgroundColor:'#202d45',titleColor:'#fff',bodyColor:'#e6edf7',borderColor:'#354563',borderWidth:1,padding:12,
      callbacks:{label:c=>{const v=typeof c.raw==='object'?`(${c.raw.x.toFixed(1)}%, ${formatUnits(c.raw.y)})`:formatUnits(Number(c.raw));return `${c.label||'Value'}: ${v}`;}}}},
    scales:kind==='doughnut'||kind==='polarArea'?{}:{
      x:{ticks:{color:axisText,font:{size:10},maxRotation:0,minRotation:0},grid:{display:kind==='scatter',color:axisGrid},border:{display:false},title:{display:kind==='scatter',text:'Discount (%)',color:axisText}},
      y:{beginAtZero:true,ticks:{color:axisText,font:{size:10},callback:v=>Number(v)>=1000?`${Math.round(v/1000)}k`:v},grid:{color:axisGrid},border:{display:false},title:{display:kind==='scatter',text:'Sales amount (units)',color:axisText}}
    }};
  if(kind==='bar'&&extra.horizontal){opts.indexAxis='y';opts.scales.x.ticks.callback=v=>Number(v)>=1000?`${Math.round(v/1000)}k`:v;}
  if(kind==='doughnut')opts.cutout='72%';
  if(kind==='polarArea'){opts.scales={r:{ticks:{display:false},grid:{color:axisGrid},angleLines:{color:axisGrid},pointLabels:{display:true,color:'#9eacc2',font:{size:10}}}};opts.plugins.legend={display:false};}
  if(extra.units==='count') opts.plugins.tooltip.callbacks.label=c=>`${c.label||'Count'}: ${num.format(Number(c.raw))}`;
  if(kind==='scatter')opts.plugins.tooltip.callbacks.label=c=>`Discount ${c.raw.x.toFixed(1)}% · Revenue ${formatUnits(c.raw.y)}`;
  if(kind==='line')data.datasets[0].borderWidth=3;
  return {type:kind,data,options:opts};
}
function chartCard(id,kind,labels,values,extra={}){
  const target=$(id); target.innerHTML='';
  if(state.charts[id]){state.charts[id].destroy();delete state.charts[id];}
  if(!labels.length || (kind!=='scatter'&&values.length===0)){
    target.innerHTML='<div class="empty-state">No matching transactions. Change your filters.</div>';return;
  }
  const chartArea=document.createElement('div');chartArea.className='chart-canvas';
  const legend=document.createElement('div');legend.className='chart-legend';
  const countLegend=extra.legend!==false;
  if(typeof Chart!=='undefined'){
    let canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',CHART_ARIA_LABELS[id]||id+' data visualization');chartArea.appendChild(canvas);
    try{state.charts[id]=new Chart(canvas.getContext('2d'),chartSettings(kind,labels,values,extra));}
    catch(err){console.warn('Chart.js rendering failed, falling back to SVG',err);chartArea.innerHTML='';chartArea.appendChild(svgFallback(kind,labels,values,extra));}
  }else chartArea.appendChild(svgFallback(kind,labels,values,extra));
  target.appendChild(chartArea);
  if(countLegend && ['doughnut','polarArea'].includes(kind)){
    labels.forEach((label,i)=>{
      const el=document.createElement('div');el.className='legend-item';
      const dot=document.createElement('i');dot.style.background=COLORS[i%COLORS.length];
      const name=document.createElement('span');name.textContent=label;
      const value=document.createElement('strong');value.textContent=extra.units==='count'?num.format(values[i]):formatUnits(values[i]);
      el.append(dot,name,value);legend.appendChild(el);
    });
    target.appendChild(legend);
  }
}
function svgFallback(kind,labels,values,extra={}){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 610 280');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.classList.add('fallback-svg');
  const add=(name,attrs,parent=svg,text)=>{const e=document.createElementNS(ns,name);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=String(text);parent.appendChild(e);return e;};
  const txt=(x,y,text,anchor='start',fill='#9babc3',font=12)=>add('text',{x,y,fill,'font-size':font,'text-anchor':anchor,'font-family':'system-ui, sans-serif'},svg,text);
  if(kind==='doughnut'||kind==='polarArea'){
    const total=sum(values,x=>x)||1, cx=305,cy=132;
    if(kind==='doughnut'){
      let offset=0;
      values.forEach((v,i)=>{const fraction=v/total,arc=2*Math.PI*95*fraction;
        add('circle',{cx,cy,r:95,fill:'none',stroke:COLORS[i%COLORS.length],'stroke-width':36,'stroke-dasharray':`${arc} ${2*Math.PI*95-arc}`,'stroke-dashoffset':-offset,'transform':`rotate(-90 ${cx} ${cy})`});offset+=arc;
      });
      txt(cx,cy-4,num.format(total),'middle','#eff9ff',25);txt(cx,cy+18,'TOTAL','middle','#8fa2be',11);
    }else{
      const max=Math.max(...values)||1,step=2*Math.PI/values.length;
      values.forEach((v,i)=>{const angle1=-Math.PI/2+i*step,angle2=angle1+step;const rad=108*Math.sqrt(v/max);
        const pt=a=>`${(cx+rad*Math.cos(a)).toFixed(2)} ${(cy+rad*Math.sin(a)).toFixed(2)}`;
        add('path',{d:`M ${cx} ${cy} L ${pt(angle1)} A ${rad} ${rad} 0 ${step>Math.PI?1:0} 1 ${pt(angle2)} Z`,fill:COLORS[i%COLORS.length],opacity:.85,stroke:'#192238','stroke-width':2});
      });
    }
    return svg;
  }
  if(kind==='scatter'){
    const points=extra.points||[],maxY=Math.max(...points.map(p=>p.y),1),left=66,right=580,top=18,bottom=236;
    for(let i=0;i<=4;i++){const y=bottom-(i/4)*(bottom-top);add('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#263448','stroke-width':1});txt(left-7,y+4,Math.round(maxY*i/4).toLocaleString('en-US'),'end');}
    points.forEach(p=>add('circle',{cx:left+(p.x/30)*(right-left),cy:bottom-(p.y/maxY)*(bottom-top),r:3.5,fill:COLORS[0],opacity:.7}));
    txt((left+right)/2,267,'Discount (%)','middle');return svg;
  }
  if(kind==='line'){
    let max=Math.max(...values,1)*1.12;let L=42,R=582,T=25,B=235;
    for(let i=0;i<=4;i++){let y=B-i*(B-T)/4;add('line',{x1:L,y1:y,x2:R,y2:y,stroke:'#29374f','stroke-width':1});txt(L-6,y+3,Math.round(max*i/4/1000)+'k','end');}
    const pts=values.map((v,i)=>[L+i*(R-L)/(values.length-1||1), B-v/max*(B-T)]);
    add('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:COLORS[0],'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});
    pts.forEach(([x,y],i)=>{add('circle',{cx:x,cy:y,r:3.5,fill:'#6ce3bd'});if(i%2===0)txt(x,258,labels[i],'middle');});return svg;
  }
  const horizontal=!!extra.horizontal;const top=16, bottom=246, left=horizontal?118:45,right=585;
  const max=Math.max(...values,1)*1.12;
  if(horizontal){
    const step=(bottom-top)/values.length;
    values.forEach((v,i)=>{
      const y=top+i*step+step*.20,h=step*.62;
      add('rect',{x:left,y,width:(right-left)*v/max,height:h,rx:4,fill:COLORS[i%COLORS.length]});
      txt(left-9,y+h/2+4,String(labels[i]).slice(0,20),'end','#a7b5cb',11);
      txt(Math.min(right-2,left+Math.max(30,(right-left)*v/max)+7),y+h/2+4,num.format(v),'end','#d0dae9',10);
    });
  }else{
    const step=(right-left)/values.length,barWidth=Math.min(50,step*.6);
    values.forEach((v,i)=>{const x=left+i*step+step/2-barWidth/2;let h=(bottom-top)*v/max;
      add('rect',{x,y:bottom-h,width:barWidth,height:h,rx:4,fill:COLORS[i%COLORS.length]});
      txt(x+barWidth/2,bottom+17,String(labels[i]).slice(0,12),'middle','#a7b5cb',11);
    });
  }
  return svg;
}
function renderCharts(r){
  const monthly=MONTHS.map((_,i)=>sum(r.filter(x=>Number(x.date.slice(5,7))===i+1),x=>x.sales_amount));
  const region=sortedEntries(groupSum(r,'region',x=>x.sales_amount));
  const categories=sortedEntries(groupSum(r,'product_category',x=>x.sales_amount));
  const reps=sortedEntries(groupSum(r,'sales_rep',x=>x.sales_amount));
  const customers=sortedEntries(groupSum(r,'customer_type',()=>1));
  const payments=sortedEntries(groupSum(r,'payment_method',()=>1));
  const channels=sortedEntries(groupSum(r,'sales_channel',()=>1));
  const top=[...r].sort((a,b)=>b.sales_amount-a.sales_amount).slice(0,10);
  const qty=sortedEntries(groupSum(r,'product_category',x=>x.quantity_sold));
  if(!r.length){['trendChart','regionChart','categoryChart','repChart','customerChart','paymentChart','channelChart','scatterChart','topChart','quantityChart'].forEach(id=>{const container=$(id);if(state.charts[id]){state.charts[id].destroy();delete state.charts[id];}container.innerHTML='<div class="empty-state">No matching transactions. Reset your filters.</div>';});return;}
  chartCard('trendChart','line',MONTHS,monthly,{legend:false});
  chartCard('regionChart','polarArea',region.map(x=>x[0]),region.map(x=>x[1]));
  chartCard('categoryChart','bar',categories.map(x=>x[0]),categories.map(x=>x[1]),{horizontal:true});
  chartCard('repChart','bar',reps.map(x=>x[0]),reps.map(x=>x[1]),{horizontal:true});
  chartCard('customerChart','doughnut',customers.map(x=>x[0]),customers.map(x=>x[1]),{units:'count'});
  chartCard('paymentChart','doughnut',payments.map(x=>x[0]),payments.map(x=>x[1]),{units:'count'});
  chartCard('channelChart','doughnut',channels.map(x=>x[0]),channels.map(x=>x[1]),{units:'count'});
  chartCard('scatterChart','scatter',['Transactions'],r.map(x=>x.sales_amount),{points:r.map(x=>({x:x.discount*100,y:x.sales_amount})),legend:false});
  chartCard('topChart','bar',top.map(x=>x.transaction_id),top.map(x=>x.sales_amount),{horizontal:true});
  chartCard('quantityChart','bar',qty.map(x=>x[0]),qty.map(x=>x[1]),{units:'count',legend:false});
}
function renderTable(r){
  const tbody=$('transactionRows');tbody.replaceChildren();$('tableCount').textContent=`SHOWING ${Math.min(r.length,12)} / ${r.length}`;
  if(!r.length){let tr=document.createElement('tr');let td=document.createElement('td');td.colSpan=8;td.textContent='No records match the selected filters.';tr.appendChild(td);tbody.appendChild(tr);return;}
  [...r].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12).forEach(d=>{
    const row=document.createElement('tr');
    [fmtDate(d.date),d.region,d.product_category,d.sales_rep,d.sales_channel,num.format(d.quantity_sold),(100*d.discount).toFixed(0)+'%',formatUnits(d.sales_amount)].forEach((v,i)=>{
      const cell=document.createElement('td');cell.textContent=v;if(i>=5)cell.className='number';if(i===7)cell.classList.add('bright');row.appendChild(cell);
    });tbody.appendChild(row);
  });
}
function interpretIntent(question){
  const q=question.toLocaleLowerCase('id-ID');
  if(/rekomen|saran|strateg|improv|suggest|action|insight|tindakan|peningkat/.test(q))return 'recommendation';
  if(/tren|trend|bulan|monthly|month|waktu|time/.test(q))return 'trend';
  if(/wilayah|region|daerah|area/.test(q))return 'region';
  if(/kategori|category|produk|product|laris/.test(q))return 'category';
  if(/sales rep|representative|salesperson|penjual|petugas/.test(q))return 'representative';
  if(/channel|saluran|online|retail/.test(q))return 'channel';
  if(/payment|pembayaran|bayar/.test(q))return 'payment';
  if(/diskon|discount/.test(q))return 'discount';
  if(/quantity|kuantitas|jumlah unit|unit terjual/.test(q))return 'quantity';
  if(/transaksi|transaction|order/.test(q))return 'transactions';
  if(/revenue|omzet|pendapatan|total|penjualan/.test(q))return 'revenue';
  return 'help';
}
function answerQuestion(q,records){
  const intent=interpretIntent(q);
  const total=sum(records,x=>x.sales_amount), n=records.length;
  if(!n)return {intent,tool:'Filter validation',text:'Tidak ada transaksi pada filter ini. Coba reset atau ubah filter agar analisis dapat dilakukan.'};
  let text='',tool='';
  if(intent==='revenue'){tool='SUM(Sales_Amount)';text=`Total revenue dari ${num.format(n)} transaksi terpilih adalah ${formatUnitsPrecise(total)}. Nilainya dijumlahkan langsung dari kolom Sales_Amount pada dataset.`;}
  else if(intent==='transactions'){tool='COUNT(transactions)';text=`Ada ${num.format(n)} transaksi valid dalam filter aktif. Angka ini menghitung baris transaksi, bukan jumlah produk yang terjual.`;}
  else if(intent==='quantity'){tool='SUM(Quantity_Sold)';text=`Total kuantitas yang terjual adalah ${num.format(sum(records,x=>x.quantity_sold))} unit pada ${num.format(n)} transaksi.`;}
  else if(intent==='discount'){tool='MEAN(Discount)';text=`Rata-rata diskon transaksi adalah ${(100*sum(records,x=>x.discount)/n).toFixed(2)}%. Ini rata-rata sederhana per transaksi, bukan diskon yang ditimbang berdasarkan revenue.`;}
  else if(['region','category','representative','channel','payment'].includes(intent)){
    const field={region:'region',category:'product_category',representative:'sales_rep',channel:'sales_channel',payment:'payment_method'}[intent];
    const countMode=intent==='payment';let entries=sortedEntries(groupSum(records,field,x=>countMode?1:x.sales_amount));
    let [best,value]=entries[0];tool=`GROUP BY ${field} + ${countMode?'COUNT':'SUM(Sales_Amount)'}`;
    text=`${countMode?'Metode pembayaran terpopuler':'Segmen dengan revenue terbesar'} adalah ${best} (${countMode?`${num.format(value)} transaksi`:formatUnits(value)}). ${entries.map(([key,v])=>`${key}: ${countMode?num.format(v)+' transaksi':formatUnits(v)}`).join(' · ')}. Perbandingan ini menggunakan ${num.format(n)} transaksi yang lolos filter.`;
  }
  else if(intent==='trend'){
    tool='SUM(Sales_Amount) GROUP BY month';const months=MONTHS.map((x,i)=>[x,sum(records.filter(r=>Number(r.date.slice(5,7))===i+1),r=>r.sales_amount)]);
    const sorted=[...months].sort((a,b)=>b[1]-a[1]);const peak=sorted[0],lowest=sorted[sorted.length-1];
    text=`Bulan dengan revenue tertinggi adalah ${peak[0]} (${formatUnits(peak[1])}); terendah ${lowest[0]} (${formatUnits(lowest[1])}). Grafik Sales trend memperlihatkan seluruh 12 bulan. Ini adalah ringkasan historis, bukan prediksi.`;
  }
  else if(intent==='recommendation'){
    tool='Regional + category segmentation + heuristics';let region=sortedEntries(groupSum(records,'region',x=>x.sales_amount));let categories=sortedEntries(groupSum(records,'product_category',x=>x.sales_amount));
    const best=region[0], weak=region[region.length-1];const leader=categories[0];
    text=`Saran berbasis data: (1) Tinjau praktik penjualan di ${best[0]} (${formatUnits(best[1])}) untuk diuji di area lain. (2) Periksa penyebab kontribusi ${weak[0]} lebih rendah (${formatUnits(weak[1])}) sebelum menyimpulkan kinerja. (3) Prioritaskan analisis kebutuhan stok atau kampanye kategori ${leader[0]} (${formatUnits(leader[1])}). Ini hipotesis tindakan dari data historis, bukan kesimpulan kausal.`;
  }else{tool='Intent parsing';text='Saya dapat menjawab pertanyaan tentang total revenue, jumlah transaksi, quantity, discount, region, kategori produk, sales representative, channel, payment, tren bulanan, atau rekomendasi berbasis data. Contoh: "Wilayah mana revenue tertinggi?"';}
  return {intent,tool,text};
}
function addChatBubble(role,text){
  const d=document.createElement('div');d.className=`bubble ${role==='user'?'user-bubble':'assistant-bubble'}`;
  const tag=document.createElement('span');tag.className='bubble-tag';tag.textContent=role==='user'?'YOU':'SALESSENSE AGENT';
  const p=document.createElement('p');p.textContent=text;d.append(tag,p);$('agentMessages').appendChild(d);$('agentMessages').scrollTop=$('agentMessages').scrollHeight;
}
function updateTrace(q,a){
  const rows=state.filtered.length;
  const entries=[['Observe',`Question received; ${rows} rows within current filters`],['Plan',`Detected intent: ${a.intent}`],['Analyze',`Executed: ${a.tool}`],['Respond','Generated descriptive, traceable response']];
  const t=$('agentTrace');t.replaceChildren();entries.forEach(([h,s],i)=>{
    const div=document.createElement('div');div.className='trace-step';const n=document.createElement('span');n.className='step-indicator';n.textContent=String(i+1).padStart(2,'0');const w=document.createElement('div');const strong=document.createElement('strong');strong.textContent=h;const p=document.createElement('p');p.textContent=s;w.append(strong,p);div.append(n,w);t.appendChild(div);
  });
}
function askAgent(question){
  if(!question.trim())return;addChatBubble('user',question);const a=answerQuestion(question,state.filtered);addChatBubble('assistant',a.text);updateTrace(question,a);
}
function csvExport(){
  if(!state.filtered.length)return;
  const keys=['transaction_id','date','sales_rep','region','sales_amount','quantity_sold','product_category','customer_type','discount','payment_method','sales_channel'];
  const escape=x=>`"${String(x??'').replace(/"/g,'""')}"`;
  const csv='\uFEFF'+[keys.join(','),...state.filtered.map(r=>keys.map(k=>escape(r[k])).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='salessense_filtered_sales.csv';a.click();URL.revokeObjectURL(url);
}
function initEvents(){
  ['regionFilter','categoryFilter','customerFilter','channelFilter'].forEach(id=>$(id).addEventListener('change',applyFilters));
  $('resetFilters').addEventListener('click',()=>{['regionFilter','categoryFilter','customerFilter','channelFilter'].forEach(id=>$(id).value='');applyFilters();});
  $('exportBtn').addEventListener('click',csvExport);
  $('agentForm').addEventListener('submit',e=>{e.preventDefault();const q=$('agentInput').value;$('agentInput').value='';askAgent(q);});
  document.querySelectorAll('.suggestion').forEach(b=>b.addEventListener('click',()=>{askAgent(b.dataset.question);$('agent').scrollIntoView({behavior:'smooth',block:'start'});}));
  $('themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;});
  const navlinks=document.querySelectorAll('.nav-link');navlinks.forEach(a=>a.addEventListener('click',()=>{navlinks.forEach(b=>b.classList.remove('active'));a.classList.add('active');}));
}
async function boot(){
  initEvents();
  try{
    const res=await fetch(DATA_URL,{cache:'no-store'});if(!res.ok)throw Error(`HTTP ${res.status}`);
    const records=await res.json();if(!Array.isArray(records))throw Error('Expected JSON array');
    state.records=records.filter(r=>r&&Number.isFinite(r.sales_amount)&&Number.isFinite(r.quantity_sold)&&Number.isFinite(r.discount));
    populateFilter('regionFilter','region');populateFilter('categoryFilter','product_category');populateFilter('customerFilter','customer_type');populateFilter('channelFilter','sales_channel');
    applyFilters();
    window.SalesSenseTest={getRecords:()=>state.records,getFiltered:()=>state.filtered,askAgent,answerQuestion,applyFilters};
  }catch(err){
    $('datasetStatus').textContent='Dataset unavailable';
    const alert=document.createElement('div');alert.className='load-error';alert.textContent='Unable to load data/sales_data.json. Open this folder using Live Server or run: python -m http.server 8080. Detail: '+err.message;
    document.querySelector('.filters-panel').prepend(alert);console.error('SalesSense initialization failed:',err);
  }
}
boot();
