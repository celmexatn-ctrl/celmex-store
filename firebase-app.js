import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocs, getDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuGsj3ivLYLwrbYV52CuaR0eiTPOX8BMM",
  authDomain: "celmex-store-2.firebaseapp.com",
  projectId: "celmex-store-2",
  storageBucket: "celmex-store-2.firebasestorage.app",
  messagingSenderId: "252793498020",
  appId: "1:252793498020:web:5f2606803508e8d9bd3931"
};

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
await setPersistence(auth,browserLocalPersistence);const db=getFirestore(app);

// Aplicación secundaria: permite al administrador crear accesos de socios
// sin cerrar su propia sesión de Google.
const socioCreatorApp=initializeApp(firebaseConfig,'socioCreator');
const socioCreatorAuth=getAuth(socioCreatorApp);
const ADMIN_EMAIL='celmexatn@gmail.com';
let currentUser=null;
let cloudProducts=[];
// Conserva una copia inmutable del catálogo incluido en la tienda.
// Así, aunque Firestore tenga solo uno o algunos productos, el botón de importación
// siempre puede publicar TODOS los artículos originales.
const initialStoreCatalog=JSON.parse(JSON.stringify(window.CelMexStore?.products||[]));

const loginModal=document.querySelector('#adminLoginModal');
const adminModal=document.querySelector('#adminModal');
const googleLoginBtn=document.querySelector('#googleAdminLoginBtn');
const productForm=document.querySelector('#firebaseProductForm');
const adminList=document.querySelector('#firebaseAdminList');
const statusBox=document.querySelector('.cloud-status');
const statusText=document.querySelector('#firebaseStatusText');
const seedBtn=document.querySelector('#seedCatalogBtn');
const cancelEditBtn=document.querySelector('#cancelEditBtn');
const editId=document.querySelector('#editProductId');
const adminSearch=document.querySelector('#adminProductSearch');
const adminStats=document.querySelector('#firebaseAdminStats');
const exportBtn=document.querySelector('#exportCatalogBtn');
const importFile=document.querySelector('#importCatalogFile');
let adminQuery='';

let loginIntent='admin';
let currentSocio=null;
let socios=[];
let ventas=[];
let socioVentasUnsubscribe=null;

const socioLoginModal=document.querySelector('#socioLoginModal');
const socioDashboardModal=document.querySelector('#socioDashboardModal');
const socioCodeLoginForm=document.querySelector('#socioCodeLoginForm');
const socioCodeLoginBtn=document.querySelector('#socioCodeLoginBtn');
const socioForm=document.querySelector('#socioForm');
const editSocioId=document.querySelector('#editSocioId');
const cancelSocioEditBtn=document.querySelector('#cancelSocioEditBtn');
const sociosAdminList=document.querySelector('#sociosAdminList');
const ventaSocioForm=document.querySelector('#ventaSocioForm');
const ventaSocioEmail=document.querySelector('#ventaSocioEmail');
const ventaProductId=document.querySelector('#ventaProductId');
const ventaCommissionAmount=document.querySelector('#ventaCommissionAmount');
const ventasSocioFilter=document.querySelector('#ventasSocioFilter');
const ventasAdminSummary=document.querySelector('#ventasAdminSummary');
const ventasAdminList=document.querySelector('#ventasAdminList');
const socioDashboardName=document.querySelector('#socioDashboardName');
const socioDashboardStats=document.querySelector('#socioDashboardStats');
const socioDashboardCode=document.querySelector('#socioDashboardCode');
const socioDashboardList=document.querySelector('#socioDashboardList');
const commissionSettingsList=document.querySelector('#commissionSettingsList');
const commissionSettingsSearch=document.querySelector('#commissionSettingsSearch');
const commissionSettingsCount=document.querySelector('#commissionSettingsCount');
let commissionSettingsQuery='';
const socioCommissionCatalog=document.querySelector('#socioCommissionCatalog');
const socioCommissionSearch=document.querySelector('#socioCommissionSearch');
const socioCommissionCatalogCount=document.querySelector('#socioCommissionCatalogCount');
let socioCommissionQuery='';

const moneyMXN=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(Number(value)||0);
const socioDocId=email=>(email||'').trim().toLowerCase();
const normalizeSocioCode=value=>String(value||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24);
const socioInternalEmail=code=>`${normalizeSocioCode(code).toLowerCase()}@socios.celmex.local`;
const currentReferralCode=()=>{
  const fromUrl=new URLSearchParams(location.search).get('socio');
  if(fromUrl){localStorage.setItem('celmexSocioCode',fromUrl.toUpperCase());return fromUrl.toUpperCase()}
  return localStorage.getItem('celmexSocioCode')||'';
};
window.CelMexSocioCode=currentReferralCode;
currentReferralCode();
window.openSocioAccess=()=>{loginIntent='socio';if(currentSocio&&currentUser){socioDashboardModal.showModal();renderSocioDashboard()}else socioLoginModal.showModal()};


function toast(msg){window.CelMexStore?.showToast?.(msg)}
function setStatus(text,type=''){statusText.textContent=text;statusBox.classList.remove('online','error');if(type)statusBox.classList.add(type)}
function isAdmin(user){return !!user && (user.email||'').toLowerCase()===ADMIN_EMAIL}

window.openAdmin=()=>{loginIntent='admin';if(isAdmin(currentUser)){adminModal.showModal();renderAdminList();renderCommissionSettings();renderSociosAdmin();renderVentasAdmin()}else loginModal.showModal()};

// Mantener 5 segundos sobre el logo para abrir el panel privado.
const brand=document.querySelector('#brandButton');let pressTimer;
brand?.addEventListener('pointerdown',()=>{pressTimer=setTimeout(()=>window.openAdmin(),4000)});
['pointerup','pointercancel','pointerleave'].forEach(e=>brand?.addEventListener(e,()=>clearTimeout(pressTimer)));
brand?.addEventListener('contextmenu',e=>e.preventDefault());

const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});

async function completeGoogleAccess(user,intent=loginIntent){
 const adminErr=document.querySelector('#adminLoginError');
 const socioErr=document.querySelector('#socioLoginError');
 if(isAdmin(user)){
   currentSocio=null;
   socioLoginModal?.close();
   loginModal?.close();
   if(intent==='socio'){
     if(socioErr){socioErr.textContent='La cuenta administradora no es una cuenta de socio. Usa el engrane para administrar.';socioErr.hidden=false}
     socioLoginModal?.showModal();
     return false;
   }
   adminModal?.showModal();
   renderAdminList();renderCommissionSettings();renderSociosAdmin();renderVentasAdmin();
   toast('Acceso de administrador autorizado');
   return true;
 }
 const email=(user?.email||'').toLowerCase();
 const socioSnap=await getDoc(doc(db,'socios',email));
 if(socioSnap.exists()&&socioSnap.data().active!==false){
   currentSocio={id:socioSnap.id,...socioSnap.data()};
   loginModal?.close();socioLoginModal?.close();
   if(intent==='admin'){
     if(adminErr){adminErr.textContent='Esta cuenta pertenece a un socio y no tiene acceso administrativo.';adminErr.hidden=false}
     loginModal?.showModal();
     return false;
   }
   socioDashboardModal?.showModal();
   subscribeSocioVentas();
   renderSocioDashboard();
   return true;
 }
 await signOut(auth);
 const message=`La cuenta ${email||'seleccionada'} no está registrada como administrador ni socio activo.`;
 if(intent==='admin'){if(adminErr){adminErr.textContent=message;adminErr.hidden=false}loginModal?.showModal()}
 else{if(socioErr){socioErr.textContent=message;socioErr.hidden=false}socioLoginModal?.showModal()}
 return false;
}

googleLoginBtn?.addEventListener('click',async()=>{
 loginIntent='admin';
 const err=document.querySelector('#adminLoginError');
 if(err)err.hidden=true;
 googleLoginBtn.disabled=true;
 googleLoginBtn.textContent='Abriendo Google…';
 localStorage.setItem('celmexAdminLoginPending','1');localStorage.setItem('celmexLoginIntent','admin');
 try{
   const result=await signInWithPopup(auth,googleProvider);
   localStorage.removeItem('celmexAdminLoginPending');
   await completeGoogleAccess(result.user,'admin');
 }catch(ex){
   console.error(ex);
   const fallbackCodes=['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment'];
   if(fallbackCodes.includes(ex?.code)){
     try{await signInWithRedirect(auth,googleProvider);return}catch(redirectError){console.error(redirectError)}
   }
   localStorage.removeItem('celmexAdminLoginPending');
   if(err){err.textContent='No fue posible completar el acceso con Google. Inténtalo nuevamente.';err.hidden=false}
   googleLoginBtn.disabled=false;
   googleLoginBtn.textContent='Continuar con Google';
 }
});



socioCodeLoginForm?.addEventListener('submit',async e=>{
 e.preventDefault();
 loginIntent='socio';
 const err=document.querySelector('#socioLoginError');
 if(err)err.hidden=true;
 const fd=new FormData(socioCodeLoginForm);
 const code=normalizeSocioCode(fd.get('code'));
 const pin=String(fd.get('pin')||'');
 if(!code||pin.length<6){
   if(err){err.textContent='Escribe tu código y una clave válida de al menos 6 caracteres.';err.hidden=false}
   return;
 }
 socioCodeLoginBtn.disabled=true;
 socioCodeLoginBtn.textContent='Verificando acceso…';
 localStorage.setItem('celmexLoginIntent','socio');
 try{
   const result=await signInWithEmailAndPassword(auth,socioInternalEmail(code),pin);
   const snap=await getDoc(doc(db,'socios',(result.user.email||'').toLowerCase()));
   if(!snap.exists()||snap.data().active===false){
     await signOut(auth);
     throw new Error('El acceso está inactivo o no existe.');
   }
   currentSocio={id:snap.id,...snap.data()};
   socioLoginModal.close();
   socioDashboardModal.showModal();
   subscribeSocioVentas();
   renderSocioDashboard();
   socioCodeLoginForm.reset();
   toast(`Bienvenido, ${currentSocio.name||code}`);
 }catch(ex){
   console.error(ex);
   let message='Código o clave incorrectos.';
   if(ex?.code==='auth/too-many-requests')message='Demasiados intentos. Espera unos minutos y vuelve a probar.';
   if(ex?.message?.includes('inactivo'))message=ex.message;
   if(err){err.textContent=message;err.hidden=false}
 }finally{
   socioCodeLoginBtn.disabled=false;
   socioCodeLoginBtn.textContent='Entrar a mis comisiones';
 }
});

getRedirectResult(auth).then(async result=>{
 if(result?.user){
   localStorage.removeItem('celmexAdminLoginPending');
   localStorage.removeItem('celmexLoginIntent');
   await completeGoogleAccess(result.user,'admin');
 }
}).catch(ex=>{
 console.error(ex);
 localStorage.removeItem('celmexAdminLoginPending');
 const err=document.querySelector('#adminLoginError');
 if(err){err.textContent='Google no pudo completar el inicio de sesión. Vuelve a intentarlo.';err.hidden=false}
 loginModal?.showModal();
});


document.querySelector('#socioLogoutBtn')?.addEventListener('click',async()=>{
 if(socioVentasUnsubscribe){socioVentasUnsubscribe();socioVentasUnsubscribe=null}
 currentSocio=null;await signOut(auth);socioDashboardModal.close();toast('Sesión de socio cerrada')
});

document.querySelector('#adminLogoutBtn')?.addEventListener('click',async()=>{await signOut(auth);adminModal.close();toast('Sesión cerrada')});

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){
   currentSocio=null;
   document.querySelector('#adminAccessBtn')?.classList.remove('is-authenticated');
   setStatus('CelMex Cloud conectado','online');
   return;
 }
 if(isAdmin(user)){
   currentSocio=null;
   setStatus('Administrador CelMex conectado','online');
   document.querySelector('#adminAccessBtn')?.classList.add('is-authenticated');
   const pending=localStorage.getItem('celmexAdminLoginPending')==='1';
   if(pending){
     localStorage.removeItem('celmexAdminLoginPending');
     loginModal?.close();
     if(!adminModal?.open)adminModal?.showModal();
     renderAdminList();renderCommissionSettings();renderSociosAdmin();renderVentasAdmin();
   }
   return;
 }
 const email=(user.email||'').toLowerCase();
 try{
   const snap=await getDoc(doc(db,'socios',email));
   if(snap.exists()&&snap.data().active!==false){
     currentSocio={id:snap.id,...snap.data()};
     setStatus(`Socio CelMex conectado • ${currentSocio.name||email}`,'online');
     document.querySelector('#adminAccessBtn')?.classList.remove('is-authenticated');
     const partnerIntent=(localStorage.getItem('celmexLoginIntent')||'')==='socio';
     if(partnerIntent){
       localStorage.removeItem('celmexLoginIntent');
       socioLoginModal?.close();
       if(!socioDashboardModal?.open)socioDashboardModal?.showModal();
       subscribeSocioVentas();
       renderSocioDashboard();
     }
     return;
   }
 }catch(ex){console.error(ex)}
 await signOut(auth);
 toast('Esta cuenta no está autorizada');
});

function normalizeProduct(data,id){
 const capacities=Array.isArray(data.capacities)&&data.capacities.length?data.capacities:['Por confirmar'];
 const colors=Array.isArray(data.colors)&&data.colors.length?data.colors:[{name:'Por confirmar',hex:'#718096',image:'assets/logo.png'}];
 const price=data.price||'Cotizar';
 return {id,brand:data.brand||'Otra',category:data.category||data.brand||'Otra',name:data.name||'Producto',badge:data.badge||'Nuevo',price,oldPrice:data.oldPrice||'',description:data.description||'',numeric:window.CelMexStore.priceNumber(price),featured:!!data.featured,capacities,colors,prices:data.prices||Object.fromEntries(capacities.map(c=>[c,price])),stock:data.stock||'Disponible',commissionAmount:Number(data.commissionAmount||0),cloud:true};
}

onSnapshot(collection(db,'productos'),snap=>{
 cloudProducts=snap.docs.map(d=>normalizeProduct(d.data(),d.id));
 if(cloudProducts.length){
   const list=window.CelMexStore.products;list.splice(0,list.length,...cloudProducts);
   window.CelMexStore.render();window.CelMexStore.renderFeatured();
 }
 renderAdminList();populateSocioSelectors();renderCommissionSettings();if(currentSocio)renderSocioCommissionCatalog();setStatus(`CelMex Cloud • ${cloudProducts.length||window.CelMexStore.products.length} productos`,'online');
},err=>{console.error(err);setStatus('No se pudo leer Firestore. Revisa las reglas.','error')});

async function imageToDataURL(file){
 return new Promise((resolve,reject)=>{
  const img=new Image(),reader=new FileReader();reader.onerror=reject;reader.onload=()=>img.src=reader.result;
  img.onerror=reject;img.onload=()=>{
   let max=700,quality=.72,result='';
   const render=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);result=c.toDataURL('image/jpeg',quality);if(result.length>140000&&max>320){max=Math.round(max*.82);quality=Math.max(.56,quality-.08);render()}else resolve(result)};
   render();
  };reader.readAsDataURL(file)
 });
}
function hexFor(name,i){const n=name.toLowerCase(),map={negro:'#22252a',blanco:'#eeeeea',azul:'#789bc9',rosa:'#e8becf',violeta:'#8174a9',morado:'#8174a9',naranja:'#e7792d',gris:'#777b82',plata:'#cfd2d7',verde:'#72a987'};return Object.entries(map).find(([k])=>n.includes(k))?.[1]||['#3c8dde','#7f6bd7','#d98b42','#55a47b'][i%4]}

productForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!isAdmin(currentUser)){toast('Inicia sesión como administrador');return}
 const fd=new FormData(productForm),id=editId.value,old=id?cloudProducts.find(p=>p.id===id):null;
 const capacities=String(fd.get('capacities')).split(',').map(x=>x.trim()).filter(Boolean);
 const names=String(fd.get('colors')).split(',').map(x=>x.trim()).filter(Boolean);
 let image=String(fd.get('imageUrl')||'').trim()||old?.colors?.[0]?.image||'assets/logo.png';
 const file=fd.get('imageFile');if(file instanceof File&&file.size){if(file.size>8_000_000){toast('La imagen es demasiado grande');return}image=await imageToDataURL(file)}
 const price=String(fd.get('price')).trim()||'Cotizar';
 const data={brand:String(fd.get('brand')).trim(),category:String(fd.get('category')),name:String(fd.get('name')).trim(),price,oldPrice:String(fd.get('oldPrice')||'').trim(),description:String(fd.get('description')||'').trim(),stock:String(fd.get('stock')),badge:String(fd.get('badge')).trim()||'Nuevo',featured:String(fd.get('featured'))==='true',commissionAmount:Math.max(0,Number(fd.get('commissionAmount')||0)),capacities,colors:names.map((name,i)=>({name,hex:hexFor(name,i),image})),prices:Object.fromEntries(capacities.map(c=>[c,price])),updatedAt:serverTimestamp()};
 const submitBtn=productForm.querySelector('button[type=submit]');
 const originalText=submitBtn?.textContent||'Guardar producto';
 if(submitBtn){submitBtn.disabled=true;submitBtn.textContent=id?'Guardando cambios…':'Publicando…'}
 try{
   if(id){
     // setDoc con merge es más confiable en móviles y también funciona si el documento
     // fue recreado o cambió mientras estaba abierto el panel.
     await setDoc(doc(db,'productos',id),data,{merge:true});
   }else{
     await addDoc(collection(db,'productos'),{...data,createdAt:serverTimestamp()});
   }
   resetProductForm();
   toast(id?'Cambios guardados correctamente':'Producto publicado correctamente');
 }
 catch(ex){
   console.error('Error al guardar producto:',ex);
   const code=ex?.code||'error desconocido';
   toast(`No se pudo guardar (${code}). Cierra y vuelve a abrir el panel.`);
 }
 finally{
   if(submitBtn){submitBtn.disabled=false;submitBtn.textContent=editId.value?'Actualizar producto':'Guardar producto'}
 }
});

function resetProductForm(){productForm.reset();editId.value='';cancelEditBtn.hidden=true;productForm.querySelector('button[type=submit]').textContent='Guardar producto'}
cancelEditBtn?.addEventListener('click',resetProductForm);

window.editCloudProduct=id=>{const p=cloudProducts.find(x=>x.id===id);if(!p)return;editId.value=id;productForm.elements.brand.value=p.brand;productForm.elements.category.value=p.category;productForm.elements.name.value=p.name;productForm.elements.price.value=p.price;productForm.elements.oldPrice.value=p.oldPrice||'';productForm.elements.commissionAmount.value=Number(p.commissionAmount)||0;productForm.elements.description.value=p.description||'';productForm.elements.stock.value=p.stock;productForm.elements.capacities.value=p.capacities.join(', ');productForm.elements.colors.value=p.colors.map(c=>c.name).join(', ');productForm.elements.badge.value=p.badge;productForm.elements.featured.value=String(!!p.featured);productForm.elements.imageUrl.value=p.colors[0]?.image?.startsWith('data:')?'':p.colors[0]?.image||'';cancelEditBtn.hidden=false;productForm.querySelector('button[type=submit]').textContent='Actualizar producto';productForm.scrollIntoView({behavior:'smooth'});};
window.deleteCloudProduct=async id=>{const p=cloudProducts.find(x=>x.id===id);if(!p||!confirm(`¿Eliminar ${p.name}?`))return;try{await deleteDoc(doc(db,'productos',id));toast('Producto eliminado')}catch(ex){console.error(ex);toast('No se pudo eliminar')}};

function renderAdminStats(){if(!adminStats)return;const available=cloudProducts.filter(p=>p.stock==='Disponible').length,out=cloudProducts.filter(p=>p.stock==='Agotado').length,offers=cloudProducts.filter(p=>p.oldPrice||/oferta|promo/i.test(p.badge)).length;adminStats.innerHTML=`<article><b>${cloudProducts.length}</b><span>Productos</span></article><article><b>${available}</b><span>Disponibles</span></article><article><b>${out}</b><span>Agotados</span></article><article><b>${offers}</b><span>En oferta</span></article>`}
function renderAdminList(){if(!adminList)return;const q=adminQuery.toLowerCase();const list=cloudProducts.filter(p=>`${p.name} ${p.brand} ${p.stock} ${p.badge}`.toLowerCase().includes(q));renderAdminStats();adminList.innerHTML=list.length?list.map(p=>`<article class="cloud-admin-row"><img src="${p.colors[0]?.image||'assets/logo.png'}" alt="" loading="lazy" decoding="async"><div><h4>${p.name}</h4><p>${p.oldPrice?`Antes ${p.oldPrice} • `:''}${p.price} • ${p.stock}</p><span class="tag-mini">${p.badge}</span> <span class="tag-mini commission-product-tag">Comisión ${moneyMXN(p.commissionAmount)}</span></div><div class="cloud-admin-actions"><button class="secondary" onclick="editCloudProduct('${p.id}')">Editar</button><button class="danger-btn" onclick="deleteCloudProduct('${p.id}')">Eliminar</button></div></article>`).join(''):'<div class="firebase-loading">No hay productos que coincidan con la búsqueda.</div>'}
adminSearch?.addEventListener('input',e=>{adminQuery=e.target.value;renderAdminList()});



function populateSocioSelectors(){
 if(ventaProductId){
   const selected=ventaProductId.value;
   ventaProductId.innerHTML='<option value="">Seleccionar producto</option>'+cloudProducts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
   ventaProductId.value=selected;
 }
 if(ventaSocioEmail){
   const selected=ventaSocioEmail.value;
   ventaSocioEmail.innerHTML='<option value="">Seleccionar socio</option>'+socios.filter(s=>s.active!==false).map(s=>`<option value="${s.email}">${s.name} • ${s.code}</option>`).join('');
   ventaSocioEmail.value=selected;
 }
 if(ventasSocioFilter){
   const selected=ventasSocioFilter.value;
   ventasSocioFilter.innerHTML='<option value="all">Todos los socios</option>'+socios.map(s=>`<option value="${s.email}">${s.name}</option>`).join('');
   ventasSocioFilter.value=selected||'all';
 }
}

onSnapshot(collection(db,'socios'),snap=>{
 socios=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
 if(isAdmin(currentUser)){renderSociosAdmin();populateSocioSelectors()}
},err=>console.error('Socios:',err));

onSnapshot(collection(db,'ventasSocios'),snap=>{
 ventas=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
   const av=a.soldAt?.seconds||0,bv=b.soldAt?.seconds||0;return bv-av
 });
 if(isAdmin(currentUser))renderVentasAdmin();
},err=>console.error('Ventas socios:',err));

socioForm?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!isAdmin(currentUser))return toast('Acceso administrativo requerido');
 const fd=new FormData(socioForm);
 const editingId=String(editSocioId?.value||'');
 const name=String(fd.get('name')||'').trim();
 const code=normalizeSocioCode(fd.get('code'));
 const pin=String(fd.get('pin')||'');
 const phone=String(fd.get('phone')||'').trim();
 const active=String(fd.get('active'))==='true';

 if(!name||!code)return toast('Completa el nombre y el código del socio');

 if(editingId){
   await setDoc(doc(db,'socios',editingId),{name,phone,active,updatedAt:serverTimestamp()},{merge:true});
   resetSocioForm();
   toast('Datos del socio actualizados');
   return;
 }

 if(pin.length<6)return toast('La clave temporal debe tener al menos 6 caracteres');
 const internalEmail=socioInternalEmail(code);
 const duplicate=socios.find(s=>String(s.code||'').toUpperCase()===code);
 if(duplicate)return toast('Ese código ya pertenece a otro socio');

 let createdUser=null;
 try{
   const credential=await createUserWithEmailAndPassword(socioCreatorAuth,internalEmail,pin);
   createdUser=credential.user;
   await setDoc(doc(db,'socios',internalEmail),{
     name,email:internalEmail,code,phone,active,
     accessType:'codigo-pin',
     createdAt:serverTimestamp(),
     updatedAt:serverTimestamp()
   });
   await signOut(socioCreatorAuth);
   resetSocioForm();
   toast(`Acceso creado para ${name}: ${code}`);
 }catch(ex){
   console.error(ex);
   try{await signOut(socioCreatorAuth)}catch{}
   let message='No se pudo crear el acceso.';
   if(ex?.code==='auth/email-already-in-use')message='Ese código de acceso ya existe.';
   if(ex?.code==='auth/weak-password')message='La clave debe tener al menos 6 caracteres.';
   if(ex?.code==='auth/operation-not-allowed')message='Activa Correo/Contraseña en Firebase Authentication.';
   toast(message);
 }
});

function resetSocioForm(){
 socioForm?.reset();
 if(editSocioId)editSocioId.value='';
 if(cancelSocioEditBtn)cancelSocioEditBtn.hidden=true;
 if(socioForm?.elements?.code)socioForm.elements.code.readOnly=false;
 if(socioForm?.elements?.pin)socioForm.elements.pin.disabled=false;
 const button=socioForm?.querySelector('button[type="submit"]');
 if(button)button.textContent='Crear acceso de socio';
}
cancelSocioEditBtn?.addEventListener('click',resetSocioForm);

window.editSocio=email=>{
 const s=socios.find(x=>x.email===email);if(!s)return;
 editSocioId.value=s.email;
 socioForm.elements.name.value=s.name||'';
 socioForm.elements.code.value=s.code||'';
 socioForm.elements.code.readOnly=true;
 socioForm.elements.phone.value=s.phone||'';
 socioForm.elements.pin.value='';
 socioForm.elements.pin.disabled=true;
 socioForm.elements.active.value=String(s.active!==false);
 cancelSocioEditBtn.hidden=false;
 const button=socioForm.querySelector('button[type="submit"]');
 if(button)button.textContent='Guardar cambios';
 socioForm.scrollIntoView({behavior:'smooth'});
};
window.toggleSocio=async email=>{
 const s=socios.find(x=>x.email===email);if(!s)return;
 await setDoc(doc(db,'socios',email),{active:s.active===false,updatedAt:serverTimestamp()},{merge:true});
 toast(s.active===false?'Socio activado':'Socio desactivado');
};
window.copySocioLink=async code=>{
 const url=`${location.origin}${location.pathname}?socio=${encodeURIComponent(code)}`;
 try{await navigator.clipboard.writeText(url);toast('Enlace del socio copiado')}catch{prompt('Copia este enlace:',url)}
};

function renderSociosAdmin(){
 if(!sociosAdminList||!isAdmin(currentUser))return;
 sociosAdminList.innerHTML=socios.length?socios.map(s=>`<article class="socio-admin-row">
   <div><h4>${s.name||s.code||'Socio CelMex'}</h4><p>${s.phone||'Acceso por código y clave'}</p><span class="tag-mini">${s.code||'Sin código'}</span> <span class="tag-mini">${s.accessType==='codigo-pin'?'Sin correo':'Acceso anterior'}</span></div>
   <div class="socio-status ${s.active===false?'inactive':''}">${s.active===false?'Inactivo':'Activo'}</div>
   <div class="cloud-admin-actions"><button class="secondary" onclick="copySocioLink('${s.code}')">Copiar enlace</button><button class="secondary" onclick="editSocio('${s.email}')">Editar</button><button class="danger-btn" onclick="toggleSocio('${s.email}')">${s.active===false?'Activar':'Desactivar'}</button></div>
 </article>`).join(''):'<div class="firebase-loading">Aún no has registrado socios.</div>';
 populateSocioSelectors();
}

function syncCommissionFromProduct(){
 const product=cloudProducts.find(p=>p.id===ventaProductId?.value);
 if(ventaCommissionAmount)ventaCommissionAmount.value=product?Number(product.commissionAmount||0):'';
}
ventaProductId?.addEventListener('change',syncCommissionFromProduct);

ventaSocioForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!isAdmin(currentUser))return toast('Acceso administrativo requerido');
 const fd=new FormData(ventaSocioForm);
 const socio=socios.find(s=>s.email===String(fd.get('socioEmail')));
 const product=cloudProducts.find(p=>p.id===String(fd.get('productId')));
 if(!socio||!product)return toast('Selecciona socio y producto');
 const status=String(fd.get('status')||'Pendiente');
 await addDoc(collection(db,'ventasSocios'),{
   socioEmail:socio.email,socioName:socio.name,socioCode:socio.code,
   productId:product.id,productName:product.name,
   salePrice:Number(fd.get('salePrice')||0),
   commissionAmount:Math.max(0,Number(fd.get('commissionAmount')||product.commissionAmount||0)),
   commissionSource:'producto',
   status,notes:String(fd.get('notes')||'').trim(),
   soldAt:serverTimestamp(),paidAt:status==='Pagada'?serverTimestamp():null,
   createdBy:currentUser.email
 });
 ventaSocioForm.reset();if(ventaCommissionAmount)ventaCommissionAmount.value='';toast('Venta y comisión registradas');
});

ventasSocioFilter?.addEventListener('change',renderVentasAdmin);

window.markCommissionPaid=async id=>{
 if(!isAdmin(currentUser))return;
 await setDoc(doc(db,'ventasSocios',id),{status:'Pagada',paidAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});
 toast('Comisión marcada como pagada');
};
window.markCommissionPending=async id=>{
 if(!isAdmin(currentUser))return;
 await setDoc(doc(db,'ventasSocios',id),{status:'Pendiente',paidAt:null,updatedAt:serverTimestamp()},{merge:true});
 toast('Comisión marcada como pendiente');
};
window.markCommissionCancelled=async id=>{
 if(!isAdmin(currentUser))return;
 await setDoc(doc(db,'ventasSocios',id),{status:'Cancelada',paidAt:null,updatedAt:serverTimestamp()},{merge:true});
 toast('Comisión cancelada');
};
window.deleteCommissionSale=async id=>{
 if(!isAdmin(currentUser)||!confirm('¿Eliminar este movimiento de comisión?'))return;
 await deleteDoc(doc(db,'ventasSocios',id));toast('Movimiento eliminado');
};

function renderVentasAdmin(){
 if(!ventasAdminList||!isAdmin(currentUser))return;
 const filter=ventasSocioFilter?.value||'all';
 const list=filter==='all'?ventas:ventas.filter(v=>v.socioEmail===filter);
 const pending=list.filter(v=>v.status==='Pendiente'||!v.status).reduce((a,v)=>a+Number(v.commissionAmount||0),0);
 const paid=list.filter(v=>v.status==='Pagada').reduce((a,v)=>a+Number(v.commissionAmount||0),0);
 const cancelled=list.filter(v=>v.status==='Cancelada');
 ventasAdminSummary.innerHTML=`<article><b>${list.length}</b><span>Movimientos</span></article><article><b>${moneyMXN(pending)}</b><span>Pendiente</span></article><article><b>${moneyMXN(paid)}</b><span>Pagado</span></article><article><b>${cancelled.length}</b><span>Canceladas</span></article>`;
 ventasAdminList.innerHTML=list.length?list.map(v=>`<article class="venta-admin-row">
   <div><h4>${v.productName}</h4><p>${v.socioName} • ${v.socioCode}</p><small>${v.notes||'Sin nota'}</small></div>
   <div><strong>${moneyMXN(v.commissionAmount)}</strong><span class="commission-status ${v.status==='Pagada'?'paid':v.status==='Cancelada'?'cancelled':'pending'}">${v.status||'Pendiente'}</span></div>
   <div class="cloud-admin-actions">${v.status==='Pagada'?`<button class="secondary" onclick="markCommissionPending('${v.id}')">Marcar pendiente</button>`:`<button class="primary" onclick="markCommissionPaid('${v.id}')">Marcar pagada</button>`}${v.status==='Cancelada'?`<button class="secondary" onclick="markCommissionPending('${v.id}')">Reactivar</button>`:`<button class="secondary" onclick="markCommissionCancelled('${v.id}')">Cancelar</button>`}<button class="danger-btn" onclick="deleteCommissionSale('${v.id}')">Eliminar</button></div>
 </article>`).join(''):'<div class="firebase-loading">No hay movimientos para este filtro.</div>';
}

function subscribeSocioVentas(){
 if(!currentUser||!currentSocio)return;
 if(socioVentasUnsubscribe)socioVentasUnsubscribe();
 const q=query(collection(db,'ventasSocios'),where('socioEmail','==',(currentUser.email||'').toLowerCase()));
 socioVentasUnsubscribe=onSnapshot(q,snap=>{
   const own=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.soldAt?.seconds||0)-(a.soldAt?.seconds||0));
   currentSocio.ventas=own;renderSocioDashboard();
 },err=>{console.error(err);toast('No se pudieron cargar las comisiones')});
}



function renderCommissionSettings(){
 if(!commissionSettingsList||!isAdmin(currentUser))return;
 const q=(commissionSettingsQuery||'').trim().toLowerCase();
 const source=cloudProducts.length?cloudProducts:(window.CelMexStore.products||[]);
 const products=source
   .filter(p=>`${p.name||''} ${p.brand||''} ${p.category||''}`.toLowerCase().includes(q))
   .sort((a,b)=>(a.name||'').localeCompare(b.name||''));

 if(commissionSettingsCount){
   commissionSettingsCount.textContent=`${products.length} ${products.length===1?'artículo':'artículos'}`;
 }

 commissionSettingsList.innerHTML=products.length?products.map(p=>{
   const image=p.colors?.[0]?.image||'assets/logo.png';
   return `<article class="commission-setting-row">
     <img src="${image}" alt="${p.name||'Producto'}" loading="lazy" decoding="async">
     <div class="commission-setting-product">
       <span class="tag-mini">${p.brand||p.category||'CelMex'}</span>
       <h4>${p.name||'Producto'}</h4>
       <p>${(p.capacities||[]).join(' • ')||'Capacidad por confirmar'}</p>
     </div>
     <label class="commission-setting-input">
       <span>Comisión por venta</span>
       <div><b>$</b><input id="commission-${p.id}" type="number" min="0" step="1" value="${Number(p.commissionAmount||0)}" inputmode="numeric"></div>
     </label>
     <button class="primary small-btn" type="button" onclick="saveProductCommission('${p.id}')">Guardar comisión</button>
   </article>`;
 }).join(''):'<div class="firebase-loading">No hay artículos que coincidan con tu búsqueda.</div>';
}

let commissionSettingsTimer;
commissionSettingsSearch?.addEventListener('input',()=>{
 commissionSettingsQuery=commissionSettingsSearch.value||'';
 clearTimeout(commissionSettingsTimer);
 commissionSettingsTimer=setTimeout(renderCommissionSettings,120);
});

window.saveProductCommission=async productId=>{
 if(!isAdmin(currentUser))return toast('Acceso administrativo requerido');
 const input=document.getElementById(`commission-${productId}`);
 const amount=Number(input?.value||0);
 if(!Number.isFinite(amount)||amount<0)return toast('Escribe una comisión válida');
 try{
   await setDoc(doc(db,'productos',productId),{
     commissionAmount:amount,
     updatedAt:serverTimestamp()
   },{merge:true});
   toast(`Comisión actualizada: ${moneyMXN(amount)}`);
 }catch(ex){
   console.error(ex);
   toast(`No se pudo guardar: ${ex.code||ex.message||'error'}`);
 }
};

function renderSocioCommissionCatalog(){
 if(!socioCommissionCatalog)return;
 const q=(socioCommissionQuery||'').trim().toLowerCase();
 const source=cloudProducts.length?cloudProducts:(window.CelMexStore.products||[]);
 const products=source
   .filter(p=>`${p.name||''} ${p.brand||''} ${p.category||''} ${p.stock||''}`.toLowerCase().includes(q))
   .sort((a,b)=>(a.name||'').localeCompare(b.name||''));

 if(socioCommissionCatalogCount){
   socioCommissionCatalogCount.textContent=`${products.length} ${products.length===1?'artículo':'artículos'}`;
 }

 socioCommissionCatalog.innerHTML=products.length?products.map(p=>{
   const commission=Number(p.commissionAmount||0);
   const image=p.colors?.[0]?.image||'assets/logo.png';
   const stock=p.stock||'Disponible';
   const capacity=(p.capacities||[]).join(' • ');
   return `<article class="socio-commission-card">
     <img src="${image}" alt="${p.name||'Producto'}" loading="lazy" decoding="async">
     <div class="socio-commission-info">
       <span class="tag-mini">${p.brand||p.category||'CelMex'}</span>
       <h4>${p.name||'Producto'}</h4>
       <p>${capacity||'Capacidad por confirmar'}</p>
       <span class="socio-stock ${stock==='Agotado'?'out':''}">${stock}</span>
     </div>
     <div class="socio-commission-amount">
       <small>Ganas por venta</small>
       <strong>${moneyMXN(commission)}</strong>
       ${commission>0?'':'<em>Por definir</em>'}
     </div>
   </article>`;
 }).join(''):'<div class="firebase-loading">No hay artículos que coincidan con tu búsqueda.</div>';
}

let socioCommissionTimer;
socioCommissionSearch?.addEventListener('input',()=>{
 socioCommissionQuery=socioCommissionSearch.value||'';
 clearTimeout(socioCommissionTimer);
 socioCommissionTimer=setTimeout(renderSocioCommissionCatalog,120);
});

function renderSocioDashboard(){
 if(!currentSocio||!socioDashboardStats)return;
 const own=currentSocio.ventas||[];
 const pending=own.filter(v=>v.status==='Pendiente'||!v.status).reduce((a,v)=>a+Number(v.commissionAmount||0),0);
 const paid=own.filter(v=>v.status==='Pagada').reduce((a,v)=>a+Number(v.commissionAmount||0),0);
 const cancelled=own.filter(v=>v.status==='Cancelada').length;
 const total=pending+paid;
 socioDashboardName.textContent=currentSocio.name||'Mis comisiones';
 socioDashboardCode.textContent=currentSocio.code||'—';
 renderSocioCommissionCatalog();
 socioDashboardStats.innerHTML=`<article><b>${moneyMXN(pending)}</b><span>Pendiente de pago</span></article><article><b>${moneyMXN(paid)}</b><span>Ya pagado</span></article><article><b>${moneyMXN(total)}</b><span>Total ganado</span></article><article><b>${own.filter(v=>v.status!=='Cancelada').length}</b><span>Ventas acreditadas</span></article><article><b>${cancelled}</b><span>Canceladas</span></article>`;
 socioDashboardList.innerHTML=own.length?own.map(v=>`<article class="venta-admin-row socio-movement">
   <div><h4>${v.productName}</h4><p>${v.notes||'Venta acreditada'}</p></div>
   <div><strong>${moneyMXN(v.commissionAmount)}</strong><span class="commission-status ${v.status==='Pagada'?'paid':v.status==='Cancelada'?'cancelled':'pending'}">${v.status||'Pendiente'}</span></div>
 </article>`).join(''):'<div class="firebase-loading">Todavía no tienes ventas acreditadas.</div>';
}

document.querySelector('#copySocioLinkBtn')?.addEventListener('click',()=>currentSocio?.code&&copySocioLink(currentSocio.code));

exportBtn?.addEventListener('click',()=>{if(!isAdmin(currentUser))return toast('Inicia sesión como administrador');const payload={version:1,exportedAt:new Date().toISOString(),products:cloudProducts.map(({cloud,numeric,...p})=>p)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`celmex-catalogo-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast('Respaldo descargado')});
importFile?.addEventListener('change',async e=>{if(!isAdmin(currentUser))return toast('Inicia sesión como administrador');const file=e.target.files?.[0];if(!file)return;try{const raw=JSON.parse(await file.text()),items=Array.isArray(raw)?raw:raw.products;if(!Array.isArray(items)||!items.length)throw new Error('Formato inválido');if(!confirm(`¿Restaurar ${items.length} productos? Los IDs coincidentes se actualizarán.`))return;let done=0;for(const item of items){const id=item.id||`producto-${Date.now()}-${done}`;const clean={...item};delete clean.id;delete clean.cloud;delete clean.numeric;await setDoc(doc(db,'productos',id),{...clean,updatedAt:serverTimestamp()},{merge:true});done++}toast(`${done} productos restaurados`)}catch(ex){console.error(ex);toast('El respaldo no es válido')}finally{e.target.value=''}});

seedBtn?.addEventListener('click',async()=>{
 if(!isAdmin(currentUser)){toast('Inicia sesión como administrador');return}
 if(!initialStoreCatalog.length){toast('No se encontraron artículos en el catálogo de la tienda');return}
 if(cloudProducts.length&&!confirm(`Firestore ya tiene ${cloudProducts.length} producto(s). ¿Importar o actualizar los ${initialStoreCatalog.length} artículos de la tienda sin borrar los existentes?`))return;
 seedBtn.disabled=true;seedBtn.textContent=`Importando 0 de ${initialStoreCatalog.length}…`;
 try{
   let done=0;
   for(const p of initialStoreCatalog){
     const clean=JSON.parse(JSON.stringify(p));delete clean.numeric;delete clean.cloud;
     await setDoc(doc(db,'productos',p.id),{...clean,updatedAt:serverTimestamp()},{merge:true});
     done++;seedBtn.textContent=`Importando ${done} de ${initialStoreCatalog.length}…`;
   }
   toast(`${initialStoreCatalog.length} artículos importados correctamente`);
 }
 catch(ex){console.error(ex);toast('No se pudieron importar todos los artículos. Revisa usuario y reglas.')}
 finally{seedBtn.disabled=false;seedBtn.textContent=`Importar todos los artículos (${initialStoreCatalog.length})`}
});
