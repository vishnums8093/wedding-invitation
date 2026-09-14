const cover=document.querySelector("#cover");
const open=document.querySelector("#open");
const loader=document.querySelector("#loader");
const tapFx=document.querySelector("#tapFx");

window.addEventListener("load",()=>setTimeout(()=>{loader.style.opacity="0";loader.style.visibility="hidden"},350));

function effects(x,y){
  tapFx.style.left=x+"px";tapFx.style.top=y+"px";tapFx.classList.remove("go");void tapFx.offsetWidth;tapFx.classList.add("go");
  ["✦","✧","✿","•","✦"].forEach(ch=>{
    const s=document.createElement("span");s.className="spark";s.textContent=ch;
    s.style.left=x+"px";s.style.top=y+"px";
    s.style.setProperty("--x",((Math.random()-.5)*110)+"px");
    s.style.setProperty("--y",((Math.random()-.5)*110)+"px");
    document.body.appendChild(s);setTimeout(()=>s.remove(),1000);
  });
}
open.addEventListener("click",e=>{
  effects(e.clientX,e.clientY);
  document.body.classList.add("opened");
  setTimeout(petals,350);
  setTimeout(()=>window.scrollTo(0,0),100);
});
document.addEventListener("pointerdown",e=>{
  if(e.target.closest("#scratchArea"))return;
  if(!document.body.classList.contains("opened"))return;
  effects(e.clientX,e.clientY);
},{passive:true});

function petals(){
  for(let i=0;i<11;i++){
    const p=document.createElement("span");p.className="petal";p.textContent=i%3?"✿":"✧";
    p.style.left=(Math.random()*100)+"vw";p.style.top=(-20-Math.random()*80)+"px";
    p.style.setProperty("--x",((Math.random()-.5)*150)+"px");
    p.style.animationDuration=(5+Math.random()*4)+"s";
    document.body.appendChild(p);setTimeout(()=>p.remove(),10000);
  }
}

/* Scratch interaction */
const area=document.querySelector("#scratchArea");
const canvas=document.querySelector("#scratchCanvas");
const ctx=canvas.getContext("2d",{willReadFrequently:true});
const hint=document.querySelector("#scratchHint");
const mask=document.querySelector("#dateMask");
let active=false,last=null,finished=false;

function setupScratch(){
  const r=area.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);
  ctx.setTransform(d,0,0,d,0,0);
  const g=ctx.createLinearGradient(0,0,r.width,r.height);
  g.addColorStop(0,"#b88339");g.addColorStop(.45,"#e5c47e");g.addColorStop(1,"#b57b34");
  ctx.globalCompositeOperation="source-over";ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);
  for(let i=0;i<900;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.10})`;ctx.fillRect(Math.random()*r.width,Math.random()*r.height,1,1)}
}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function erase(p){
  ctx.save();ctx.globalCompositeOperation="destination-out";ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=42;
  ctx.beginPath();if(last){ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y)}else ctx.arc(p.x,p.y,21,0,Math.PI*2);ctx.stroke();ctx.restore();last=p;
  // The instruction fades almost immediately, so it never remains until the entire card is scratched.
  hint.style.opacity=".04";check();
}
function check(){
  if(finished)return;
  const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0,total=0;
  for(let i=3;i<d.length;i+=4*16){total++;if(d[i]<25)clear++}
  if(clear/total>.42){
    finished=true;document.body.classList.add("revealed");
    canvas.style.transition="opacity .65s ease";canvas.style.opacity="0";
    setTimeout(()=>canvas.remove(),700);petals();
  }
}
area.addEventListener("pointerdown",e=>{active=true;last=null;area.setPointerCapture(e.pointerId);erase(point(e))});
area.addEventListener("pointermove",e=>{if(active)erase(point(e))});
["pointerup","pointercancel","pointerleave"].forEach(n=>area.addEventListener(n,()=>{active=false;last=null}));
addEventListener("resize",()=>{if(!finished)setupScratch()});
setupScratch();
