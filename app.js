// App JS - localStorage based demo (VYANA) - Cancel Order doesn't send emails
const RAZOR_KEY = "rzp_test_RNJ2LNk1ufk2Zy"; // Razorpay test key
const EMAILJS_KEY = "y52ET2TDQpwI-ehwF"; // EmailJS public key (if you want emails)
const SERVICE_ID = "service_nx17k0o";
const TEMPLATE_CUSTOMER = "template_jwhthic";
const TEMPLATE_ADMIN = "template_j59su57";

const PRODUCTS = [
  {id:"p1",name:"Smart Watch",price:1999,image:"assets/images/slider1.svg",desc:"Smartwatch with features"},
  {id:"p2",name:"Casual Shoes",price:899,image:"assets/images/slider2.svg",desc:"Comfortable shoes"},
  {id:"p3",name:"T-Shirt",price:599,image:"assets/images/slider3.svg",desc:"100% cotton tee"}
];

let slideIndex = 0;
function startSlider(){
  const slides = document.querySelector('.slides');
  if(!slides) return;
  setInterval(function(){
    slideIndex = (slideIndex+1)%3;
    slides.style.transform = 'translateX(-' + (slideIndex*100) + '%)';
  },3000);
}

function renderHome(){
  const grid = document.getElementById('productGrid');
  if(!grid) return;
  grid.innerHTML = PRODUCTS.map(function(p){
    return '<div class="card"><img src="'+p.image+'"><h3>'+p.name+'</h3><p class="small">₹'+p.price+'</p><div style="display:flex;gap:8px;margin-top:8px"><button class="btn" onclick="viewProduct(\''+p.id+'\')">View</button><button class="btn primary" onclick="addToCart(\''+p.id+'\')">Add to Cart</button></div></div>';
  }).join('');
}

function viewProduct(id){
  localStorage.setItem('view',id);
  location.href = 'product.html';
}

function addToCart(id){
  var prod = PRODUCTS.find(function(p){ return p.id===id; });
  if(!prod) return;
  let cart = JSON.parse(localStorage.getItem('cart')||'[]');
  // allow multiple items by pushing
  cart.push(prod);
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
}

function loadProductPage(){
  var id = localStorage.getItem('view') || PRODUCTS[0].id;
  var p = PRODUCTS.find(function(x){ return x.id===id; });
  if(!p) return;
  document.getElementById('pname').innerText = p.name;
  document.getElementById('pimg').src = p.image;
  document.getElementById('pprice').innerText = '₹'+p.price;
  document.getElementById('pdesc').innerText = p.desc;
}

function renderCart(){
  var area = document.getElementById('cartArea');
  if(!area) return;
  var cart = JSON.parse(localStorage.getItem('cart')||'[]');
  if(!cart || cart.length===0){ area.innerHTML = '<p>Cart empty</p>'; return; }
  var html = '';
  var total = 0;
  cart.forEach(function(item, idx){
    total += item.price;
    html += '<div class="card"><img src="'+item.image+'" style="height:100px"><h3>'+item.name+'</h3><p>₹'+item.price+'</p></div>';
  });
  var cod = total + 10;
  var online = total - 10;
  html += '<div class="card"><p><b>Payable Online:</b> ₹'+online+' <br><b>Payable COD:</b> ₹'+cod+'</p></div>';
  area.innerHTML = html;
  document.getElementById('cartTotal').innerText = total;
}

function placeOrder(){
  var addr = document.getElementById('addr')?document.getElementById('addr').value:'';
  if(!addr) return alert('Enter address');
  var payEls = document.getElementsByName('pay');
  var pay = 'cod';
  for(var i=0;i<payEls.length;i++){ if(payEls[i].checked) pay = payEls[i].value; }
  var cart = JSON.parse(localStorage.getItem('cart')||'[]');
  if(!cart || cart.length===0) return alert('No product selected');
  var total = cart.reduce(function(s,it){return s+it.price},0);
  var price = (pay==='cod')? total+10 : total-10;
  var order = { id:'ORD'+Date.now(), items:cart, price: price, original: total, image:cart[0].image, address:addr, paymentMethod:pay==='cod'?'COD':'Online', status:0, canceled:false };
  if(pay==='online'){
    var options = { key:RAZOR_KEY, amount: order.price*100, currency:'INR', name:'VYANA Store', description:'Order '+order.id, image:order.image, handler:function(res){ order.paymentId = res.razorpay_payment_id; saveOrder(order); } };
    var rzp = new Razorpay(options); rzp.open();
  } else { saveOrder(order); }
}

function saveOrder(order){
  localStorage.setItem('order', JSON.stringify(order));
  // send emails if emailjs available - order confirmation (optional)
  if(window.emailjs){
    try{ emailjs.init(EMAILJS_KEY); }catch(e){}
    var cust = { email: localStorage.getItem('userEmail')||'customer@example.com', name:localStorage.getItem('userName')||'Customer', product:order.items[0].name, price:'₹'+order.price, order_id:order.id, productImage:order.image };
    var adm = { order_id:order.id, customerName:cust.name, customerEmail:cust.email, address:order.address, paymentMethod:order.paymentMethod, product:order.items[0].name, price:'₹'+order.price, productImage:order.image };
    if(window.emailjs){ try{ emailjs.send(SERVICE_ID, TEMPLATE_CUSTOMER, cust); emailjs.send(SERVICE_ID, TEMPLATE_ADMIN, adm); }catch(e){ console.error(e); } }
  }
  // clear cart
  localStorage.removeItem('cart');
  location.href='success.html';
}

function renderOrder(){
  var o = JSON.parse(localStorage.getItem('order')||'null');
  var cont = document.getElementById('orderContainer');
  if(!cont) return;
  if(!o){ cont.innerHTML = '<p>No orders</p>'; return; }
  var html = '<div class="card"><img src="'+o.image+'" style="height:120px"><h3>'+o.items[0].name+'</h3><p>₹'+o.price+'</p><p>Payment: '+o.paymentMethod+'</p>';
  html += '<div class="track"><div class="progress-line"><div class="progress-fill" style="width:' + ((o.status/3)*100) + '%"></div></div><div class="step-row">';
  var steps=['Confirmed','Shipped','Out for Delivery','Delivered'];
  for(var i=0;i<steps.length;i++){ html += '<div class="step ' + ((o.status>=i && !o.canceled)?'active':'') + (o.canceled? ' cancelled':'') + '"><div class="dot"></div><p>' + steps[i] + '</p></div>'; }
  html += '</div>';
  if(!o.canceled && o.status<3) html += '<button class="cancel-btn" onclick="cancelOrder()">Cancel Order</button>';
  if(o.canceled) html += '<p style="color:#d9534f;font-weight:700">Order Cancelled</p>';
  html += '</div>';
  cont.innerHTML = html;
}

function cancelOrder(){
  if(!confirm('Are you sure you want to cancel this order?')) return;
  var o = JSON.parse(localStorage.getItem('order')||'null'); if(!o) return;
  o.canceled = true; // set cancelled flag
  localStorage.setItem('order', JSON.stringify(o));
  // update UI only - NO EMAILS sent on cancel as requested
  renderOrder();
  alert('Order cancelled successfully');
}

function adminUpdate(){
  var o = JSON.parse(localStorage.getItem('order')||'null'); if(!o) return alert('No order');
  if(o.status<3){ o.status++; localStorage.setItem('order', JSON.stringify(o)); alert('Status updated'); renderOrder(); } else alert('Already delivered');
}

function signup(){ var n=document.getElementById('su_name')?document.getElementById('su_name').value:''; var e=document.getElementById('su_email')?document.getElementById('su_email').value:''; if(!n||!e) return alert('fill'); localStorage.setItem('userName', n); localStorage.setItem('userEmail', e); localStorage.setItem('logged','1'); alert('Signed up'); location.href='index.html'; }
function login(){ var e=document.getElementById('li_email')?document.getElementById('li_email').value:''; if(!e) return alert('enter email'); localStorage.setItem('userEmail', e); localStorage.setItem('userName','Customer'); localStorage.setItem('logged','1'); alert('Logged in'); location.href='index.html'; }
function logout(){ localStorage.removeItem('logged'); localStorage.removeItem('userEmail'); localStorage.removeItem('userName'); location.href='index.html'; }

document.addEventListener('DOMContentLoaded', function(){ startSlider(); renderHome(); renderCart(); renderOrder(); var user = localStorage.getItem('userName'); var userEl = document.getElementById('hdrUser'); if(userEl) userEl.innerText = user?user:'Sign In'; });
