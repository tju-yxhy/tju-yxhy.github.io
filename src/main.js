import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTower } from './createTower.js';
import { createZunyiMeetingSite } from './createZunyi.js';
import { createYananPagoda } from './createYananPagoda.js';
import { createTemporaryGovernmentSite } from './createTemporaryGovernmentSite.js';

const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.style.width='';renderer.domElement.style.height='';
document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();scene.background=new THREE.Color('#ffffff');
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,700);
function resizeRenderer(){const width=renderer.domElement.clientWidth||innerWidth*.68,height=renderer.domElement.clientHeight||innerHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
resizeRenderer();
camera.position.set(58,34,-62);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,7,0);controls.enableDamping=true;controls.dampingFactor=.07;controls.enableRotate=true;controls.rotateSpeed=.72;controls.enableZoom=false;controls.enablePan=false;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.32;controls.autoRotate=false;
scene.add(new THREE.HemisphereLight('#fff3df','#6f6a60',2.0));
const key=new THREE.DirectionalLight('#fff3df',3.4);key.position.set(-30,38,30);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-70;key.shadow.camera.right=70;key.shadow.camera.top=65;key.shadow.camera.bottom=-65;key.shadow.camera.far=250;scene.add(key);
const fill=new THREE.DirectionalLight('#d7e1ee',1.1);fill.position.set(30,20,-28);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.ShadowMaterial({color:'#000000',opacity:.14}));ground.rotation.x=-Math.PI/2;ground.position.y=-.14;ground.receiveShadow=true;scene.add(ground);

const pages=[
  {id:'cover',title:'长征·足迹',factory:null},
  {id:'government',title:'瑞金·临时中央政府旧址',meta:'中央红军长征出发地 · 1934年10月',description:'1934年10月，中央红军从瑞金出发，开始战略转移。临时中央政府旧址留存着出发前的中央苏区记忆，也为这段长征叙事标出起点。',highlights:['1934年10月10日出发','中央苏区战略转移','长征路线起点'],factory:()=>createTemporaryGovernmentSite(THREE),fov:35,direction:[.72,.22,-1],target:[0,3.0,0],displayScale:1.82},
  {id:'zunyi',title:'遵义会议旧址',meta:'长征关键转折 · 1935年1月15—17日',description:'中央红军在长征途中抵达遵义。遵义会议总结此前军事经验、调整领导与行军方针，成为长征进程中的重要转折。',highlights:['1935年1月15—17日','总结长征初期经验','调整军事领导与方针'],factory:()=>createZunyiMeetingSite(THREE),fov:35,direction:[.62,.38,-1],target:[0,4.1,0],displayScale:1.43},
  {id:'yanan',title:'延安·岭山寺塔',meta:'中央红军抵达陕北 · 1935年10月',description:'1935年10月，中央红军抵达陕北吴起镇，第一方面军的长征阶段性结束。此后陕北成为重要革命根据地，延安也见证了长征精神的延续；本页以岭山寺塔呈现这片地域。',highlights:['1935年10月抵达陕北','中央红军长征阶段性胜利','延安承接长征精神'],factory:()=>createYananPagoda(THREE),fov:34,direction:[.42,.24,-1],target:[0,27,0],displayScale:1.82},
  {id:'huining',title:'会宁·会师楼',meta:'红军主力会师节点 · 1936年10月',description:'1936年10月，红一、红四方面军在会宁会合；红二方面军随后在将台堡与红一方面军会师。会宁会师推动三大主力胜利会师，长征由此走向胜利。',highlights:['1936年10月9日会宁会合','红一、红四方面军会师','将台堡会师后长征胜利'],factory:()=>createTower(THREE),fov:34,direction:[.44,.35,-1],target:[0,7.5,0],displayScale:1.43}
];
const sections=[...document.querySelectorAll('.site-page')];
const models=new Map();
let activePageId='';let activeView='perspective';let inputLocked=false;let touchStart=null;
const prefersReducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const titleNode=document.querySelector('#model-title'),metaNode=document.querySelector('#model-meta'),descriptionNode=document.querySelector('#model-description'),highlightsNode=document.querySelector('#highlights'),eyebrowNode=document.querySelector('#eyebrow'),countNode=document.querySelector('#page-count'),arrow=document.querySelector('#page-arrow'),startButton=document.querySelector('#start-journey');
let rotationResumeTimer=0;let userInteracting=false;

function getPage(id){return pages.find(page=>page.id===id)??pages[0];}
function ensureModel(page){
  if(!page.factory)return null;
  if(models.has(page.id))return models.get(page.id);
  const model=page.factory();model.visible=false;scene.add(model);models.set(page.id,model);return model;
}
function fitCamera(view='perspective'){
  const page=getPage(activePageId),model=models.get(page.id);if(!model)return;
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  const defaultTarget=new THREE.Vector3(...page.target),target=defaultTarget;
  let fov=page.fov,dir;
  if(view==='front')dir=new THREE.Vector3(0,.025,-1);
  else if(view==='side')dir=new THREE.Vector3(1,.12,0);
  else if(view==='top')dir=new THREE.Vector3(0,1,0);
  else dir=new THREE.Vector3(...page.direction);
  dir.normalize();
  camera.fov=fov;camera.aspect=renderer.domElement.clientWidth/renderer.domElement.clientHeight;camera.updateProjectionMatrix();
  const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2)),fitAspect=renderer.domElement.clientWidth/renderer.domElement.clientHeight;let distance;
  if(view==='top'){
    camera.up.set(0,0,-1);
    distance=Math.max(size.x/(2*tangent*fitAspect),size.z/(2*tangent))*1.2/(page.displayScale??1);
    target.y=bounds.min.y;
  }else{
    if(view==='front'||view==='side')target.y=(bounds.min.y+bounds.max.y)/2;
    camera.up.set(0,1,0);
    const forward=dir.clone().negate(),right=new THREE.Vector3().crossVectors(forward,camera.up).normalize(),up=new THREE.Vector3().crossVectors(right,forward).normalize();
    const halfWidth=(Math.abs(right.x)*size.x+Math.abs(right.y)*size.y+Math.abs(right.z)*size.z)/2;
    const halfHeight=(Math.abs(up.x)*size.x+Math.abs(up.y)*size.y+Math.abs(up.z)*size.z)/2;
    const halfDepth=(Math.abs(dir.x)*size.x+Math.abs(dir.y)*size.y+Math.abs(dir.z)*size.z)/2;
    distance=(halfDepth+Math.max(halfHeight/tangent,halfWidth/(tangent*fitAspect)))*1.1*1.2/(page.displayScale??1);
  }
  controls.enabled=false;controls.target.copy(target);camera.position.copy(target).addScaledVector(dir,Math.max(distance,5));camera.lookAt(target);controls.update();controls.enabled=true;
  activeView=view;
  document.querySelectorAll('button[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
}
function activatePage(id){
  if(!pages.some(page=>page.id===id))return;
  const page=getPage(id);if(activePageId===page.id)return;
  clearTimeout(rotationResumeTimer);userInteracting=false;
  const model=ensureModel(page);
  for(const [modelId,group] of models)group.visible=Boolean(model)&&modelId===page.id;
  activePageId=page.id;activeView='perspective';document.body.dataset.activePage=page.id;
  const index=pages.findIndex(item=>item.id===page.id);
  if(model){
    titleNode.textContent=page.title;metaNode.textContent=page.meta;descriptionNode.textContent=page.description;
    eyebrowNode.textContent=`${String(index).padStart(2,'0')} / LONG MARCH TIMELINE`;
    highlightsNode.replaceChildren(...page.highlights.map((text,i)=>{const item=document.createElement('li');item.dataset.index=`0${i+1}`;item.textContent=text;return item;}));
    countNode.textContent=`${String(index+1).padStart(2,'0')} — 05`;
    controls.enabled=true;controls.autoRotate=!prefersReducedMotion.matches;
  }else{
    controls.enabled=false;controls.autoRotate=false;
    document.querySelectorAll('button[data-view]').forEach(button=>button.classList.remove('active'));
  }
  document.title=model?`${page.title} · 长征足迹`:'长征·足迹 — 历史旧址数字漫游';
  document.querySelectorAll('button[data-nav-page]').forEach(button=>button.classList.toggle('active',button.dataset.navPage===page.id));
  arrow.setAttribute('aria-label',index===pages.length-1?'上一处旧址':'下一处旧址');arrow.textContent=index===pages.length-1?'↑':'↓';
  if(model)fitCamera('perspective');
  window.towerReview.activeModel=model;
}
function goToPage(index){
  const next=Math.max(0,Math.min(pages.length-1,index));if(next===pages.findIndex(page=>page.id===activePageId))return;
  sections[next].scrollIntoView({block:'start',behavior:prefersReducedMotion.matches?'auto':'smooth'});
}
function onWheel(event){
  if(Math.abs(event.deltaY)<12)return;
  event.preventDefault();
  if(event.altKey){
    const delta=THREE.MathUtils.clamp(event.deltaY,-240,240),offset=camera.position.clone().sub(controls.target);
    offset.multiplyScalar(Math.exp(delta*.001));const minDistance=5,maxDistance=260;offset.setLength(THREE.MathUtils.clamp(offset.length(),minDistance,maxDistance));camera.position.copy(controls.target).add(offset);controls.update();return;
  }
  if(inputLocked)return;inputLocked=true;
  const current=pages.findIndex(page=>page.id===activePageId);goToPage(current+(event.deltaY>0?1:-1));
  setTimeout(()=>{inputLocked=false;},760);
}
function onKeyDown(event){
  const target=event.target;if(target instanceof HTMLElement&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
  const down=['ArrowDown','PageDown',' '].includes(event.key),up=['ArrowUp','PageUp'].includes(event.key);
  if(!down&&!up)return;event.preventDefault();if(event.repeat||inputLocked)return;
  inputLocked=true;goToPage(pages.findIndex(page=>page.id===activePageId)+(down?1:-1));setTimeout(()=>{inputLocked=false;},760);
}
const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(visible)activatePage(visible.target.dataset.page);
},{threshold:[.55,.7]});
sections.forEach(section=>observer.observe(section));
document.querySelectorAll('button[data-nav-page]').forEach(button=>button.addEventListener('click',()=>goToPage(pages.findIndex(page=>page.id===button.dataset.navPage))));
document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>fitCamera(button.dataset.view)));
startButton.addEventListener('click',()=>goToPage(1));
arrow.addEventListener('click',()=>{const index=pages.findIndex(page=>page.id===activePageId);goToPage(index==pages.length-1?index-1:index+1);});
function pauseAutoRotation(){userInteracting=true;clearTimeout(rotationResumeTimer);controls.autoRotate=false;}
function resumeAutoRotation(){
  clearTimeout(rotationResumeTimer);userInteracting=false;
  rotationResumeTimer=setTimeout(()=>{controls.autoRotate=Boolean(activePageId&&activePageId!=='cover'&&!prefersReducedMotion.matches);},1400);
}
renderer.domElement.addEventListener('pointerdown',pauseAutoRotation);
window.addEventListener('pointerup',resumeAutoRotation);window.addEventListener('pointercancel',resumeAutoRotation);
document.addEventListener('visibilitychange',()=>{if(document.hidden)controls.autoRotate=false;else if(!userInteracting)controls.autoRotate=Boolean(activePageId&&activePageId!=='cover'&&!prefersReducedMotion.matches);});
prefersReducedMotion.addEventListener?.('change',event=>{controls.autoRotate=Boolean(!event.matches&&!userInteracting&&activePageId&&activePageId!=='cover');});
window.addEventListener('wheel',onWheel,{passive:false});window.addEventListener('keydown',onKeyDown);
window.addEventListener('touchstart',event=>{if(event.touches.length===1)touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};else touchStart=null;},{passive:true});
window.addEventListener('touchend',event=>{
  if(!touchStart||!event.changedTouches.length)return;const end=event.changedTouches[0],dy=end.clientY-touchStart.y,dx=end.clientX-touchStart.x;touchStart=null;
  if(Math.abs(dy)<70||Math.abs(dy)<Math.abs(dx)*1.2||inputLocked)return;
  inputLocked=true;goToPage(pages.findIndex(page=>page.id===activePageId)+(dy<0?1:-1));setTimeout(()=>{inputLocked=false;},760);
},{passive:true});
window.addEventListener('resize',()=>{resizeRenderer();fitCamera(activeView);});
window.towerReview={renderer,scene,camera,controls,pages,models,activatePage,fitCamera};
function render(){controls.update();renderer.render(scene,camera);requestAnimationFrame(render);}render();
