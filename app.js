const PHONE='526313181585';
function partnerAttribution(){const code=window.CelMexSocioCode?.();return code?`\n\nCódigo de socio: ${code}`:''}
let sortMode='featured',availableOnly=false;
let customer=JSON.parse(localStorage.getItem('celmex-customer-v4')||'{}');
let analytics=JSON.parse(localStorage.getItem('celmex-analytics-v4')||'{"views":0,"productViews":{},"quotes":0,"whatsapp":0}');
let campaign=JSON.parse(localStorage.getItem('celmex-campaign-v4')||'{"title":"Beneficio especial de lanzamiento","text":"Solicita tu equipo y pregunta por disponibilidad y promoción vigente.","enabled":true}');
const products=[
 {id:'s25u',brand:'Samsung',category:'Samsung',name:'Samsung Galaxy S25 Ultra',badge:'Premium',price:'$17,399',numeric:17399,featured:true,capacities:['256 GB','1 TB'],colors:[{name:'Titanium Black',hex:'#202226',image:'assets/s25-ultra-black.png'},{name:'Titanium Silver Blue',hex:'#b9c9df',image:'assets/s25-ultra-silverblue.png'}],prices:{'256 GB':'$17,399','1 TB':'Cotizar'}},
 {id:'s26p',brand:'Samsung',category:'Samsung',name:'Samsung Galaxy S26+',badge:'Nuevo',price:'$19,599',numeric:19599,featured:true,capacities:['512 GB'],colors:[{name:'Azul',hex:'#b8dcf4',image:'assets/s26plus-blue.png'},{name:'Violeta',hex:'#77709f',image:'assets/s26plus-violet.png'},{name:'Negro',hex:'#252a30',image:'assets/s26plus-black.png'}],prices:{'512 GB':'$19,599'}},
 {id:'a57',brand:'Samsung',category:'Samsung',name:'Samsung Galaxy A57 5G',badge:'5G',price:'Cotizar',numeric:999999,capacities:['256 GB'],colors:[{name:'Azul oscuro',hex:'#151d2d',image:'assets/a57-dark.png'},{name:'Gris',hex:'#70747b',image:'assets/a57-dark.png'},{name:'Violeta',hex:'#7670a5',image:'assets/a57-dark.png'}],prices:{'256 GB':'Cotizar'}},
 {id:'ip17',brand:'Apple',category:'Apple',name:'Apple iPhone 17',badge:'Popular',price:'$19,999',numeric:19999,featured:true,capacities:['256 GB','512 GB'],colors:[{name:'Azul',hex:'#aec9e8',image:'assets/iphone17-blue.png'},{name:'Blanco',hex:'#f3f3f1',image:'assets/iphone17-white.png'},{name:'Rosa',hex:'#e9c5e9',image:'assets/iphone17-pink.jpg'},{name:'Negro',hex:'#36393c',image:'assets/iphone17-black.png'}],prices:{'256 GB':'$19,999','512 GB':'Cotizar'}},
 {id:'ip17e',brand:'Apple',category:'Apple',name:'Apple iPhone 17e',badge:'Nuevo',price:'$14,999',numeric:14999,capacities:['256 GB'],colors:[{name:'Negro',hex:'#222222',image:'assets/iphone17e-black.png'},{name:'Rosa',hex:'#f2d7d7',image:'assets/iphone17e-pink.png'}],prices:{'256 GB':'$14,999'}},
 {id:'ip17pro',brand:'Apple',category:'Apple',name:'Apple iPhone 17 Pro',badge:'Pro',price:'$28,499',numeric:28499,featured:true,capacities:['256 GB','512 GB','1 TB'],colors:[{name:'Azul',hex:'#3c4661',image:'assets/iphone17pro-blue.png'},{name:'Blanco',hex:'#ecece8',image:'assets/iphone17pro-white.png'},{name:'Naranja',hex:'#e97728',image:'assets/iphone17pro-orange.png'}],prices:{'256 GB':'$28,499','512 GB':'$33,499','1 TB':'$38,499'}},
 {id:'tabs10',brand:'Samsung',category:'Tablets',name:'Samsung Galaxy Tab S10 Lite',badge:'Tablet',price:'Cotizar',numeric:999999,capacities:['128 GB'],colors:[{name:'Gris',hex:'#606267',image:'assets/tabs10lite-gray.png'}],prices:{'128 GB':'Cotizar'}},
 {id:'tabs11',brand:'Samsung',category:'Tablets',name:'Samsung Galaxy Tab S11 Ultra',badge:'Ultra',price:'Cotizar',numeric:999999,capacities:['256 GB'],colors:[{name:'Plata',hex:'#d7d9dd',image:'assets/tabs11ultra-silver.png'}],prices:{'256 GB':'Cotizar'}}
];

let filter='all',query='',selectedProduct=null,selectedCapacity='',selectedColor=null;
let favorites=JSON.parse(localStorage.getItem('celmex-favorites')||'[]');
let compare=[];
let quote=JSON.parse(localStorage.getItem('celmex-quote')||'[]');
let recent=JSON.parse(localStorage.getItem('celmex-recent')||'[]');
const savedCatalog=JSON.parse(localStorage.getItem('celmex-catalog-v4')||localStorage.getItem('celmex-catalog-v3')||'{}');
const defaultStocks={s25u:'Disponible',s26p:'Disponible',a57:'Por confirmar',ip17:'Disponible',ip17e:'Disponible',ip17pro:'Últimas piezas',tabs10:'Por confirmar',tabs11:'Por confirmar'};
const grid=document.querySelector('#productGrid'),modal=document.querySelector('#productModal');
const advisorModal=document.querySelector('#advisorModal'),compareModal=document.querySelector('#compareModal');
const quoteModal=document.querySelector('#quoteModal'),adminModal=document.querySelector('#adminModal');

function priceNumber(value){const n=Number(String(value).replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n?n:999999}
products.forEach(p=>{p.stock=savedCatalog[p.id]?.stock||defaultStocks[p.id]||'Disponible';if(savedCatalog[p.id]?.price){p.price=savedCatalog[p.id].price;p.numeric=priceNumber(p.price);p.prices[p.capacities[0]]=p.price}});
function moneyText(p){return p.price==='Cotizar'?'Precio a consultar':`Desde ${p.price}`}
function isFav(id){return favorites.includes(id)}
function stockClass(stock){return stock==='Agotado'?'out':stock==='Últimas piezas'||stock==='Por confirmar'?'low':''}
function updateFavCount(){document.querySelector('#favCount').textContent=favorites.length}
function updateCartCount(){document.querySelector('#cartCount').textContent=quote.length}

function render(){
 const list=products.filter(p=>{
  const categoryMatch=filter==='all'||(filter==='favorites'&&isFav(p.id))||p.category===filter;
  const hay=`${p.name} ${p.capacities.join(' ')} ${p.colors.map(c=>c.name).join(' ')} ${p.stock}`.toLowerCase();
  return categoryMatch&&hay.includes(query.toLowerCase());
 });
 document.querySelector('#resultCount').textContent=`${list.length} productos`;
 grid.innerHTML=list.length?list.map(cardTemplate).join(''):'<div class="empty">No encontramos productos con esa búsqueda.</div>';
 updateFavCount();updateCompareBar();updateCartCount();renderRecent();
}
function cardTemplate(p){const unavailable=p.stock==='Agotado';return `<article class="card reveal visible ${unavailable?'unavailable':''}"><button class="compare-check ${compare.includes(p.id)?'active':''}" onclick="event.stopPropagation();toggleCompare('${p.id}')">${compare.includes(p.id)?'✓ Comparando':'+ Comparar'}</button><div class="card-actions"><button class="${isFav(p.id)?'active':''}" onclick="event.stopPropagation();toggleFavorite('${p.id}')">${isFav(p.id)?'♥':'♡'}</button><button onclick="event.stopPropagation();shareProduct('${p.id}')">↗</button></div><div class="card-media" onclick="openProduct('${p.id}')"><img src="${p.colors[0].image}" alt="${p.name}" loading="lazy" decoding="async"></div><div class="card-body"><span class="tag">${p.badge}</span><span class="stock-badge ${stockClass(p.stock)}">${p.stock}</span><h3>${p.name}</h3><div class="spec">${p.capacities.join(' • ')}<br>${p.colors.map(c=>c.name).join(' • ')}</div><div class="price">${p.oldPrice?`<span class="old-price">Antes ${p.oldPrice}</span>`:""}${moneyText(p)}</div><button class="card-main-btn" onclick="openProduct('${p.id}')">${unavailable?'Ver alternativas':'◉ Ver producto'}</button></div></article>`}
function renderFeatured(){document.querySelector('#featuredStrip').innerHTML=products.filter(p=>p.featured).map(p=>`<article class="featured-card"><div><span class="eyebrow">${p.badge.toUpperCase()}</span><h3>${p.name}</h3><p>${p.capacities.join(' • ')}<br>${moneyText(p)}</p><button onclick="openProduct('${p.id}')">Ver producto</button></div><img src="${p.colors[0].image}" alt="${p.name}" loading="lazy" decoding="async"></article>`).join('')}
function renderRecent(){const sec=document.querySelector('#recentSection'),strip=document.querySelector('#recentStrip');const list=recent.map(id=>products.find(p=>p.id===id)).filter(Boolean);sec.hidden=!list.length;if(!list.length)return;strip.innerHTML=list.map(p=>`<article class="featured-card"><div><span class="eyebrow">RECIENTE</span><h3>${p.name}</h3><p>${moneyText(p)}</p><button onclick="openProduct('${p.id}')">Continuar</button></div><img src="${p.colors[0].image}" alt="${p.name}" loading="lazy" decoding="async"></article>`).join('')}
function openProduct(id){selectedProduct=products.find(p=>p.id===id);analytics.views++;analytics.productViews[id]=(analytics.productViews[id]||0)+1;saveAnalytics();history.replaceState(null,'','#producto='+id);selectedCapacity=selectedProduct.capacities[0];selectedColor=selectedProduct.colors[0];document.querySelector('#modalBrand').textContent=selectedProduct.brand;document.querySelector('#modalName').textContent=selectedProduct.name;recent=[id,...recent.filter(x=>x!==id)].slice(0,5);localStorage.setItem('celmex-recent',JSON.stringify(recent));syncModal();modal.showModal();document.body.style.overflow='hidden';renderRecent()}
function syncModal(){
 const img=document.querySelector('#modalImage');img.style.opacity='.25';img.style.transform='scale(.97)';setTimeout(()=>{img.src=selectedColor.image;img.onload=()=>{img.style.opacity='1';img.style.transform='none'}},100);
 const shownPrice=selectedProduct.prices[selectedCapacity]||selectedProduct.price;document.querySelector('#modalPrice').textContent=shownPrice;
 document.querySelector('#capacityOptions').innerHTML=selectedProduct.capacities.map(c=>`<button class="option ${c===selectedCapacity?'active':''}" onclick="selectCapacity('${c}')">${c}</button>`).join('');
 document.querySelector('#colorOptions').innerHTML=selectedProduct.colors.map((c,i)=>`<button class="option color-option ${c.name===selectedColor.name?'active':''}" onclick="selectColor(${i})"><span class="dot" style="background:${c.hex}"></span>${c.name}</button>`).join('');
 document.querySelector('#galleryDots').innerHTML=selectedProduct.colors.map((c,i)=>`<button class="${c.name===selectedColor.name?'active':''}" onclick="selectColor(${i})" aria-label="${c.name}"></button>`).join('');
 const status=document.querySelector('.status-line');status.innerHTML=`<span class="stock-dot"></span><b>${selectedProduct.stock}</b>`;status.className=`status-line ${stockClass(selectedProduct.stock)}`;
 const fav=document.querySelector('#modalFav');fav.textContent=isFav(selectedProduct.id)?'♥':'♡';fav.classList.toggle('active',isFav(selectedProduct.id));fav.onclick=()=>toggleFavorite(selectedProduct.id,true);
 document.querySelector('#shareBtn').onclick=()=>shareProduct(selectedProduct.id);
 document.querySelector('#compareButton').textContent=compare.includes(selectedProduct.id)?'✓ Agregado al comparador':'＋ Agregar al comparador';document.querySelector('#compareButton').onclick=()=>toggleCompare(selectedProduct.id,true);
 document.querySelector('#quoteButton').onclick=addCurrentToQuote;
 const buy=document.querySelector('#buyButton');buy.disabled=selectedProduct.stock==='Agotado';buy.textContent=selectedProduct.stock==='Agotado'?'Producto agotado':'◉ Consultar producto';buy.onclick=()=>{const msg=`Hola CelMex 👋, me interesa el ${selectedProduct.name} de ${selectedCapacity} en color ${selectedColor.name}. Precio mostrado: ${shownPrice}. Estado: ${selectedProduct.stock}. ¿Sigue disponible?${partnerAttribution()}`;analytics.whatsapp++;saveAnalytics();showToast('Conectándote con E&D Market…');setTimeout(()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`,'_blank'),450)}
}
function selectCapacity(c){selectedCapacity=c;syncModal()}
function selectColor(i){selectedColor=selectedProduct.colors[i];syncModal()}
function closeModal(){modal.close();document.body.style.overflow='';history.replaceState(null,'',location.pathname+location.search)}
function toggleFavorite(id,fromModal=false){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem('celmex-favorites',JSON.stringify(favorites));showToast(favorites.includes(id)?'Agregado a favoritos':'Eliminado de favoritos');render();if(fromModal)syncModal()}
function openFavorites(){filter='favorites';document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.filter==='favorites'));goCatalog();render()}
function shareProduct(id){const p=products.find(x=>x.id===id);const text=`Mira este producto en CelMex Store: ${p.name} — ${moneyText(p)}`;const url=`${location.href.split('#')[0]}#producto=${p.id}`;if(navigator.share)navigator.share({title:p.name,text,url});else{navigator.clipboard?.writeText(`${text} ${url}`);showToast('Información copiada para compartir')}}
function toggleCompare(id,fromModal=false){if(compare.includes(id))compare=compare.filter(x=>x!==id);else if(compare.length<2)compare.push(id);else showToast('Solo puedes comparar dos equipos');render();if(fromModal&&selectedProduct)syncModal()}
function updateCompareBar(){const bar=document.querySelector('#compareBar');bar.hidden=compare.length===0;document.querySelector('#compareNames').textContent=compare.map(id=>products.find(p=>p.id===id).name).join(' vs. ')}
function clearCompare(){compare=[];render()}
function openCompare(){if(compare.length<2){showToast('Selecciona dos equipos');return}const ps=compare.map(id=>products.find(p=>p.id===id));document.querySelector('#compareContent').innerHTML=`<div class="compare-table"><b>Característica</b>${ps.map(p=>`<b>${p.name}</b>`).join('')}<span>Imagen</span>${ps.map(p=>`<img src="${p.colors[0].image}" alt="" loading="lazy" decoding="async">`).join('')}<span>Precio inicial</span>${ps.map(p=>`<strong>${p.price}</strong>`).join('')}<span>Disponibilidad</span>${ps.map(p=>`<span>${p.stock}</span>`).join('')}<span>Capacidades</span>${ps.map(p=>`<span>${p.capacities.join(', ')}</span>`).join('')}<span>Colores</span>${ps.map(p=>`<span>${p.colors.map(c=>c.name).join(', ')}</span>`).join('')}<span>Categoría</span>${ps.map(p=>`<span>${p.category}</span>`).join('')}</div>`;compareModal.showModal()}
function openAdvisor(){document.querySelector('#advisorResults').innerHTML='';advisorModal.showModal()}
document.querySelector('#advisorForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target),brand=fd.get('brand'),budget=Number(fd.get('budget')),priority=fd.get('priority');let list=products.filter(p=>(brand==='all'||p.brand===brand)&&(p.numeric<=budget||p.numeric===999999)&&p.stock!=='Agotado');
  if(availableOnly) list=list.filter(p=>p.stock!=='Agotado');
  if(sortMode==='priceAsc') list.sort((a,b)=>a.numeric-b.numeric);
  if(sortMode==='priceDesc') list.sort((a,b)=>b.numeric-a.numeric);
  if(sortMode==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  if(sortMode==='featured') list.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));if(priority==='premium')list=list.filter(p=>['Premium','Pro','Ultra'].includes(p.badge));if(priority==='storage')list=list.filter(p=>p.capacities.includes('1 TB')||p.capacities.includes('512 GB'));if(priority==='tablet')list=list.filter(p=>p.category==='Tablets');if(!list.length)list=products.filter(p=>p.stock!=='Agotado').slice(0,3);document.querySelector('#advisorResults').innerHTML=list.slice(0,3).map(p=>`<article class="advisor-result"><img src="${p.colors[0].image}" alt="" loading="lazy" decoding="async"><div><h3>${p.name}</h3><span>${moneyText(p)} • ${p.stock}</span></div><button onclick="advisorModal.close();openProduct('${p.id}')">Ver</button></article>`).join('')})

function addCurrentToQuote(){const item={key:`${selectedProduct.id}|${selectedCapacity}|${selectedColor.name}`,id:selectedProduct.id,capacity:selectedCapacity,color:selectedColor.name,price:selectedProduct.prices[selectedCapacity]||selectedProduct.price};if(!quote.some(x=>x.key===item.key))quote.push(item);localStorage.setItem('celmex-quote',JSON.stringify(quote));updateCartCount();showToast('Agregado a tu cotización')}
function openQuote(){renderQuote();renderCustomerSummary();quoteModal.showModal()}
function renderQuote(){const box=document.querySelector('#quoteContent');if(!quote.length){box.innerHTML='<div class="empty">Todavía no has agregado equipos.</div>';return}box.innerHTML=quote.map((q,i)=>{const p=products.find(x=>x.id===q.id),c=p.colors.find(x=>x.name===q.color)||p.colors[0];return `<article class="quote-item"><img src="${c.image}" alt="" loading="lazy" decoding="async"><div><h3>${p.name}</h3><p>${q.capacity} • ${q.color}<br>${q.price}</p></div><button onclick="removeQuote(${i})">×</button></article>`}).join('')}
function removeQuote(i){quote.splice(i,1);localStorage.setItem('celmex-quote',JSON.stringify(quote));renderQuote();updateCartCount()}
function clearQuote(){quote=[];localStorage.setItem('celmex-quote','[]');renderQuote();updateCartCount()}
function sendQuote(){if(!quote.length){showToast('Agrega al menos un producto');return}const lines=quote.map((q,i)=>{const p=products.find(x=>x.id===q.id);return `${i+1}. ${p.name} — ${q.capacity}, ${q.color}, ${q.price}`});const msg=`Hola CelMex 👋, quiero consultar estos productos:\n\n${lines.join('\n')}\n\n¿Me confirman disponibilidad y opciones de envío/pago?${partnerAttribution()}`;window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`,'_blank')}



function saveAnalytics(){localStorage.setItem('celmex-analytics-v4',JSON.stringify(analytics))}
function renderAdminStats(){const top=Object.entries(analytics.productViews||{}).sort((a,b)=>b[1]-a[1])[0];const topName=top?(products.find(p=>p.id===top[0])?.name||'—'):'Sin datos';(document.querySelector('#adminStats')||{set innerHTML(v){}}).innerHTML=`<article><b>${analytics.views||0}</b><span>Fichas vistas</span></article><article><b>${analytics.quotes||0}</b><span>Cotizaciones enviadas</span></article><article><b>${analytics.whatsapp||0}</b><span>Aperturas de WhatsApp</span></article><article><b>${topName}</b><span>Más consultado</span></article>`}
function applyCampaign(){const flash=document.querySelector('#ofertas');flash.hidden=!campaign.enabled;flash.querySelector('h2').textContent=campaign.title;flash.querySelector('p').textContent=campaign.text}
function setupCustomer(){const form=document.querySelector('#customerForm');for(const [k,v] of Object.entries(customer))if(form.elements[k])form.elements[k].value=v;form.addEventListener('submit',e=>{e.preventDefault();customer=Object.fromEntries(new FormData(form));localStorage.setItem('celmex-customer-v4',JSON.stringify(customer));showToast('Datos guardados en este dispositivo')})}
function renderCustomerSummary(){const el=document.querySelector('#quoteCustomerSummary');const vals=[customer.name,customer.state,customer.postal&&`C.P. ${customer.postal}`,customer.payment].filter(Boolean);el.innerHTML=vals.length?`<b>Datos para la solicitud</b><span>${vals.join(' • ')}</span><button onclick="document.querySelector('#pedidoRapido').scrollIntoView({behavior:'smooth'});quoteModal.close()">Editar</button>`:'<span>Agrega tus datos para agilizar la atención.</span><button onclick="document.querySelector(\'#pedidoRapido\').scrollIntoView({behavior:\'smooth\'});quoteModal.close()">Agregar datos</button>'}
function setupV4Controls(){document.querySelector('#sortSelect').addEventListener('change',e=>{sortMode=e.target.value;render()});document.querySelector('#availableOnly').addEventListener('change',e=>{availableOnly=e.target.checked;render()});document.querySelector('#zoomButton').addEventListener('click',()=>{document.querySelector('#lightboxImage').src=document.querySelector('#modalImage').src;lightboxModal.showModal()});document.querySelector('#modalImage').addEventListener('dblclick',()=>document.querySelector('#zoomButton').click());document.querySelector('#stockAlertButton').addEventListener('click',()=>stockAlertModal.showModal());document.querySelector('#sendStockAlert').addEventListener('click',()=>{const msg=`Hola CelMex 👋, quiero recibir información sobre disponibilidad del ${selectedProduct.name}, ${selectedCapacity}, color ${selectedColor.name}.${partnerAttribution()}`;analytics.whatsapp++;saveAnalytics();window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`,'_blank')});const hash=new URLSearchParams(location.hash.replace(/^#/,''));const id=hash.get('producto');if(id&&products.some(p=>p.id===id))setTimeout(()=>openProduct(id),950)}
function setupPromos(){const track=document.querySelector('#promoTrack'),count=track.children.length,dots=document.querySelector('#promoDots');dots.innerHTML=Array.from({length:count},(_,i)=>`<button class="${i===0?'active':''}" data-i="${i}"></button>`).join('');let i=0;const move=n=>{i=n;track.style.transform=`translateX(-${i*100}%)`;dots.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('active',j===i))};dots.onclick=e=>{if(e.target.dataset.i)move(Number(e.target.dataset.i))};setInterval(()=>{if(!document.hidden&&innerWidth<720)move((i+1)%count)},4500)}
function setupTheme(){const btn=document.querySelector('#themeBtn'),saved=localStorage.getItem('celmex-theme')||'dark';document.body.classList.toggle('light',saved==='light');btn.textContent=saved==='light'?'☀':'☾';btn.onclick=()=>{document.body.classList.toggle('light');const light=document.body.classList.contains('light');localStorage.setItem('celmex-theme',light?'light':'dark');btn.textContent=light?'☀':'☾'}}
function setupCountdown(){const key='celmex-flash-end';let end=Number(localStorage.getItem(key));if(!end||end<Date.now()){end=Date.now()+24*60*60*1000;localStorage.setItem(key,end)}setInterval(()=>{if(document.hidden)return;let diff=Math.max(0,end-Date.now());const h=Math.floor(diff/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000),vals=[h,m,s];document.querySelectorAll('#countdown b').forEach((el,i)=>el.textContent=String(vals[i]).padStart(2,'0'))},1000)}
function showToast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function goCatalog(){document.querySelector('#catalogo').scrollIntoView({behavior:'smooth'})}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
function clearSearch(){query='';document.querySelector('#searchInput').value='';render()}
let searchRenderTimer;
document.querySelector('#searchInput').addEventListener('input',e=>{
 query=e.target.value;
 clearTimeout(searchRenderTimer);
 searchRenderTimer=setTimeout(render,120);
});
document.querySelector('#chips').addEventListener('click',e=>{if(!e.target.matches('.chip'))return;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));e.target.classList.add('active');filter=e.target.dataset.filter;render()});
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
let deferredPrompt=null;
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function updateInstallButtons(){const installed=isStandalone();document.querySelectorAll('#installBtn,#installAppBtn').forEach(btn=>{if(btn)btn.hidden=installed})}
async function requestAppInstall(){
  if(isStandalone()){showToast('CelMex Store ya está instalada');return}
  if(deferredPrompt){
    deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice;
    if(choice.outcome==='accepted')showToast('Instalando CelMex Store…');
    deferredPrompt=null;updateInstallButtons();return;
  }
  const modal=document.querySelector('#installHelpModal');
  if(modal&&typeof modal.showModal==='function')modal.showModal();else showToast('Chrome: ⋮ → Instalar aplicación');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateInstallButtons()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;updateInstallButtons();showToast('CelMex Store instalada correctamente')});
document.querySelectorAll('#installBtn,#installAppBtn').forEach(btn=>btn&&btn.addEventListener('click',requestAppInstall));
updateInstallButtons();
const observer=new IntersectionObserver(entries=>entries.forEach(x=>x.isIntersecting&&x.target.classList.add('visible')),{threshold:.08});document.querySelectorAll('.reveal').forEach(x=>observer.observe(x));
renderFeatured();setupPromos();setupTheme();setupCountdown();setupCustomer();setupV4Controls();applyCampaign();render();setTimeout(()=>document.querySelector('#splash').classList.add('hide'),850);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

// Exposición controlada para la integración Firebase.
window.CelMexStore={products,render,renderFeatured,priceNumber,showToast,defaultStocks};
