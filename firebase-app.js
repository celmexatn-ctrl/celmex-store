import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCt26mccVQsNDe7RykS7-GDIvoJJTFAJcE",
  authDomain: "celmex-store-4c97a.firebaseapp.com",
  projectId: "celmex-store-4c97a",
  storageBucket: "celmex-store-4c97a.firebasestorage.app",
  messagingSenderId: "496852885344",
  appId: "1:496852885344:web:a10301948bd303a6d40805"
};

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const ADMIN_EMAIL='celmexatn@gmail.com';
let currentUser=null;
let cloudProducts=[];

const loginModal=document.querySelector('#adminLoginModal');
const adminModal=document.querySelector('#adminModal');
const loginForm=document.querySelector('#adminLoginForm');
const productForm=document.querySelector('#firebaseProductForm');
const adminList=document.querySelector('#firebaseAdminList');
const statusBox=document.querySelector('.cloud-status');
const statusText=document.querySelector('#firebaseStatusText');
const seedBtn=document.querySelector('#seedCatalogBtn');
const cancelEditBtn=document.querySelector('#cancelEditBtn');
const editId=document.querySelector('#editProductId');

function toast(msg){window.CelMexStore?.showToast?.(msg)}
function setStatus(text,type=''){statusText.textContent=text;statusBox.classList.remove('online','error');if(type)statusBox.classList.add(type)}
function isAdmin(user){return !!user && (user.email||'').toLowerCase()===ADMIN_EMAIL}

window.openAdmin=()=>{if(isAdmin(currentUser)){adminModal.showModal();renderAdminList()}else loginModal.showModal()};

// Mantener 5 segundos sobre el logo para abrir el panel privado.
const brand=document.querySelector('#brandButton');let pressTimer;
brand?.addEventListener('pointerdown',()=>{pressTimer=setTimeout(()=>window.openAdmin(),4000)});
['pointerup','pointercancel','pointerleave'].forEach(e=>brand?.addEventListener(e,()=>clearTimeout(pressTimer)));
brand?.addEventListener('contextmenu',e=>e.preventDefault());

loginForm?.addEventListener('submit',async e=>{
 e.preventDefault();const err=document.querySelector('#adminLoginError');err.hidden=true;
 try{await signInWithEmailAndPassword(auth,document.querySelector('#adminEmail').value.trim(),document.querySelector('#adminPassword').value);loginModal.close();adminModal.showModal();}
 catch(ex){err.textContent='No fue posible iniciar sesión. Revisa correo y contraseña.';err.hidden=false;console.error(ex)}
});

document.querySelector('#adminLogoutBtn')?.addEventListener('click',async()=>{await signOut(auth);adminModal.close();toast('Sesión cerrada')});

onAuthStateChanged(auth,user=>{currentUser=user;if(user&&!isAdmin(user)){signOut(auth);toast('Esta cuenta no está autorizada')};setStatus(isAdmin(user)?'Administrador conectado':'Catálogo conectado','online')});

function normalizeProduct(data,id){
 const capacities=Array.isArray(data.capacities)&&data.capacities.length?data.capacities:['Por confirmar'];
 const colors=Array.isArray(data.colors)&&data.colors.length?data.colors:[{name:'Por confirmar',hex:'#718096',image:'assets/logo.png'}];
 const price=data.price||'Cotizar';
 return {id,brand:data.brand||'Otra',category:data.category||data.brand||'Otra',name:data.name||'Producto',badge:data.badge||'Nuevo',price,numeric:window.CelMexStore.priceNumber(price),featured:!!data.featured,capacities,colors,prices:data.prices||Object.fromEntries(capacities.map(c=>[c,price])),stock:data.stock||'Disponible',cloud:true};
}

onSnapshot(collection(db,'productos'),snap=>{
 cloudProducts=snap.docs.map(d=>normalizeProduct(d.data(),d.id));
 if(cloudProducts.length){
   const list=window.CelMexStore.products;list.splice(0,list.length,...cloudProducts);
   window.CelMexStore.render();window.CelMexStore.renderFeatured();
 }
 renderAdminList();setStatus(`Firebase en línea • ${cloudProducts.length||window.CelMexStore.products.length} productos`,'online');
},err=>{console.error(err);setStatus('No se pudo leer Firestore. Revisa las reglas.','error')});

async function imageToDataURL(file){
 return new Promise((resolve,reject)=>{const img=new Image(),reader=new FileReader();reader.onload=()=>img.src=reader.result;reader.onerror=reject;img.onload=()=>{const max=1100,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.78))};reader.readAsDataURL(file)});
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
 const data={brand:String(fd.get('brand')).trim(),category:String(fd.get('category')),name:String(fd.get('name')).trim(),price,stock:String(fd.get('stock')),badge:String(fd.get('badge')).trim()||'Nuevo',featured:String(fd.get('featured'))==='true',capacities,colors:names.map((name,i)=>({name,hex:hexFor(name,i),image})),prices:Object.fromEntries(capacities.map(c=>[c,price])),updatedAt:serverTimestamp()};
 try{if(id)await updateDoc(doc(db,'productos',id),data);else await addDoc(collection(db,'productos'),{...data,createdAt:serverTimestamp()});resetProductForm();toast(id?'Producto actualizado':'Producto publicado')}
 catch(ex){console.error(ex);toast('No se pudo guardar. Revisa las reglas de Firestore.')}
});

function resetProductForm(){productForm.reset();editId.value='';cancelEditBtn.hidden=true;productForm.querySelector('button[type=submit]').textContent='Guardar producto'}
cancelEditBtn?.addEventListener('click',resetProductForm);

window.editCloudProduct=id=>{const p=cloudProducts.find(x=>x.id===id);if(!p)return;editId.value=id;productForm.elements.brand.value=p.brand;productForm.elements.category.value=p.category;productForm.elements.name.value=p.name;productForm.elements.price.value=p.price;productForm.elements.stock.value=p.stock;productForm.elements.capacities.value=p.capacities.join(', ');productForm.elements.colors.value=p.colors.map(c=>c.name).join(', ');productForm.elements.badge.value=p.badge;productForm.elements.featured.value=String(!!p.featured);productForm.elements.imageUrl.value=p.colors[0]?.image?.startsWith('data:')?'':p.colors[0]?.image||'';cancelEditBtn.hidden=false;productForm.querySelector('button[type=submit]').textContent='Actualizar producto';productForm.scrollIntoView({behavior:'smooth'});};
window.deleteCloudProduct=async id=>{const p=cloudProducts.find(x=>x.id===id);if(!p||!confirm(`¿Eliminar ${p.name}?`))return;try{await deleteDoc(doc(db,'productos',id));toast('Producto eliminado')}catch(ex){console.error(ex);toast('No se pudo eliminar')}};

function renderAdminList(){if(!adminList)return;const list=cloudProducts.length?cloudProducts:[];adminList.innerHTML=list.length?list.map(p=>`<article class="cloud-admin-row"><img src="${p.colors[0]?.image||'assets/logo.png'}" alt=""><div><h4>${p.name}</h4><p>${p.price} • ${p.stock}</p></div><div class="cloud-admin-actions"><button class="secondary" onclick="editCloudProduct('${p.id}')">Editar</button><button class="danger-btn" onclick="deleteCloudProduct('${p.id}')">Eliminar</button></div></article>`).join(''):'<div class="firebase-loading">Firestore todavía no contiene productos. Pulsa “Publicar catálogo inicial”.</div>'}

seedBtn?.addEventListener('click',async()=>{
 if(!isAdmin(currentUser)){toast('Inicia sesión como administrador');return}
 if(cloudProducts.length&&!confirm('Firestore ya tiene productos. ¿Actualizar el catálogo inicial?'))return;
 seedBtn.disabled=true;seedBtn.textContent='Publicando…';
 try{for(const p of window.CelMexStore.products){const clean=JSON.parse(JSON.stringify(p));delete clean.numeric;delete clean.cloud;await setDoc(doc(db,'productos',p.id),{...clean,updatedAt:serverTimestamp()},{merge:true})}toast('Catálogo inicial publicado')}
 catch(ex){console.error(ex);toast('No se pudo publicar. Revisa usuario y reglas.')}
 finally{seedBtn.disabled=false;seedBtn.textContent='Publicar catálogo inicial'}
});
