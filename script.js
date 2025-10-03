let slides = document.querySelectorAll('.slide');
let index = 0;
setInterval(()=>{
  slides.forEach((s,i)=> s.style.transform = `translateX(-${index*100}%)`);
  index = (index+1) % slides.length;
},3000);