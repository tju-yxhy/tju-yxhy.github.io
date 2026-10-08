const mat=(THREE,color,roughness=.88,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness:0,...extra});
function brickMap(THREE){const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#877353';g.fillRect(0,0,512,512);for(let y=0;y<512;y+=30)for(let x=0;x<512;x+=54){const xx=x+((y/30)%2)*27;g.fillStyle=((x+y)/30|0)%4?'#988263':'#79684d';g.fillRect(xx+1,y+1,51,27);g.strokeStyle='#5f5748';g.lineWidth=2;g.strokeRect(xx+1,y+1,51,27);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
function tileMap(THREE){const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#494d49';g.fillRect(0,0,512,512);for(let y=0;y<512;y+=32)for(let x=0;x<512;x+=42){const xx=x+((y/32)%2)*21;g.fillStyle=((x+y)/32|0)%3?'#555a54':'#62665e';g.fillRect(xx+1,y+1,40,29);g.strokeStyle='#7b7c72';g.lineWidth=2;g.beginPath();g.arc(xx+21,y+2,19,0,Math.PI);g.stroke();g.strokeStyle='#30332f';g.beginPath();g.moveTo(xx+40,y);g.lineTo(xx+40,y+30);g.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.1,1);t.anisotropy=8;return t;}
function box(THREE,parent,w,h,d,material,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function beam(THREE,parent,a,b,r,material,segments=7){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),segments),material);mesh.position.copy(p.add(q).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function addHill(THREE,parent,earth){
  const rings=64,sectors=128,positions=[0,.1,0],indices=[];
  const h=(x,z)=>{
    const r=Math.sqrt((x/32)**2+(z/31)**2);if(r>=1)return .1;
    const noise=Math.sin(x*.34)*Math.cos(z*.29)*.34+Math.sin((x+z)*.18)*.22;
    if(r<=.46)return 12+noise*.12;
    const t=(r-.46)/.54,fall=t*t*(3-2*t);
    return .1+11.9*(1-fall)+noise*(.25+.75*(1-r));
  };
  const boundary=a=>1+.035*Math.sin(3*a+.6)+.025*Math.cos(5*a-1.2);
  for(let ring=1;ring<=rings;ring++)for(let sector=0;sector<sectors;sector++){
    const a=sector/sectors*Math.PI*2,r=ring/rings*boundary(a),x=32*r*Math.cos(a),z=31*r*Math.sin(a);
    positions.push(x,h(x,z),z);
  }
  for(let sector=0;sector<sectors;sector++)indices.push(0,1+(sector+1)%sectors,1+sector);
  for(let ring=0;ring<rings-1;ring++)for(let sector=0;sector<sectors;sector++){
    const a=1+ring*sectors+sector,b=1+ring*sectors+(sector+1)%sectors,c=a+sectors,d=b+sectors;
    indices.push(a,b,c,b,d,c);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const hill=new THREE.Mesh(geo,earth);hill.receiveShadow=true;hill.castShadow=true;parent.add(hill);return h;
}
function addRoof(THREE,parent,width,y,bodyWidth,tiles,trim,level){
  const half=width/2,inner=Math.max(bodyWidth*.37,.75),rise=.94,positions=[],indices=[];
  const sides=[
    [[-half,y,-half],[half,y,-half],[inner,y+rise,-inner],[-inner,y+rise,-inner]],
    [[half,y,half],[-half,y,half],[-inner,y+rise,inner],[inner,y+rise,inner]],
    [[half,y,-half],[half,y,half],[inner,y+rise,inner],[inner,y+rise,-inner]],
    [[-half,y,half],[-half,y,-half],[-inner,y+rise,-inner],[-inner,y+rise,inner]]
  ];
  for(const face of sides){const start=positions.length/3;for(const p of face)positions.push(...p);indices.push(start,start+1,start+2,start,start+2,start+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const roof=new THREE.Mesh(g,tiles);roof.material.side=THREE.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;parent.add(roof);
  box(THREE,parent,width+.12,.2,width+.12,trim,0,y-.05,0);
  // Repeated tile courses make the broad eaves read as a tiled roof from above.
  for(let n=1;n<=3;n++){
    const offset=half-n*(half-inner)/4,yy=y+n*rise/4;
    for(const sign of [-1,1]){
      box(THREE,parent,width*.88,.025,.035,trim,0,yy,sign*offset);
      box(THREE,parent,.035,.025,width*.88,trim,sign*offset,yy,0);
    }
  }
  // Compact corner tips echo the raised eaves in the reference elevation.
  for(const x of [-half,half])for(const z of [-half,half])beam(THREE,parent,[x*.92,y+.02,z*.92],[x*1.04,y+.42,z*1.04],.065,trim,6);
}
function addTree(THREE,parent,x,y,z,scale,bark,leaf){
  beam(THREE,parent,[x,y,z],[x,y+scale*.72,z],scale*.075,bark,6);
  for(let i=0;i<3;i++){const yy=y+scale*(.48+i*.19),r=scale*(.31-i*.035);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),leaf);crown.position.set(x+(i%2?-.08:.06),yy,z+(i===1?.08:0));crown.scale.set(.86,1.08,.82);crown.castShadow=true;crown.receiveShadow=true;parent.add(crown);}
}
function addWindow(THREE,parent,width,height,x,y,z,rotation,stone,deep){
  const frame=box(THREE,parent,width,height,.12,stone,x,y,z);frame.rotation.y=rotation;
  const niche=box(THREE,parent,width*.52,height*.58,.055,deep,x,y,z-.085);niche.rotation.y=rotation;
}

export function createYananPagoda(THREE){
  const root=new THREE.Group();root.name='延安·岭山寺塔';
  const earth=mat(THREE,'#a98252',1),earthLight=mat(THREE,'#c09a66',.98),stone=mat(THREE,'#a69b84',.94),stoneLight=mat(THREE,'#c1b59d',.9),mortar=mat(THREE,'#807563',.97),brick=mat(THREE,'#ffffff',.94,{map:brickMap(THREE)}),brickAlt=mat(THREE,'#b5a17c',.92),dark=mat(THREE,'#393a37',.83),roof=mat(THREE,'#ffffff',.78,{map:tileMap(THREE)}),roofTrim=mat(THREE,'#756d60',.8),bark=mat(THREE,'#59422c',.95),leaf=mat(THREE,'#536345',.94),leafLight=mat(THREE,'#68764d',.94);
  const terrainHeight=addHill(THREE,root,earth);
  // Upper walled terrace and the square stone foot of the pagoda.
  const terraceY=12.15;box(THREE,root,18,.55,18,stone,0,terraceY-.28,0);box(THREE,root,17.35,.12,17.35,stoneLight,0,terraceY+.05,0);
  const wallY=terraceY+.85;
  for(const side of [-1,1]){
    for(const x of [-6.55,6.55])box(THREE,root,4.7,1.35,.72,stone,x,wallY,side*8.1);
    for(const z of [-6.55,6.55])box(THREE,root,.72,1.35,4.7,stone,side*8.1,wallY,z);
  }
  for(const x of [-6.55,6.55])for(const z of [-8.05,8.05])box(THREE,root,.92,1.55,.92,stoneLight,x,wallY+.08,z);
  for(let i=0;i<15;i++){const x=-7+i;box(THREE,root,.55,.28,.55,stoneLight,x,wallY+.88,-8.15);}
  // Broad, straight stair flight from the hillside into the terrace opening.
  const stairCount=28,stairStartZ=-30.5,stairStep=.82;
  const stairTop=z=>Math.min(terraceY-.03,terrainHeight(0,z)+.22);
  let previousTop=stairTop(stairStartZ)-.32;
  for(let i=0;i<stairCount;i++){
    const z=stairStartZ+i*stairStep,top=stairTop(z),rise=Math.max(.16,top-previousTop),bottom=top-rise;
    box(THREE,root,3.5,rise,stairStep+.08,stoneLight,0,(top+bottom)/2,z);
    box(THREE,root,3.7,.08,stairStep+.13,mortar,0,top-.04,z);
    previousTop=top;
  }
  for(const side of [-1,1]){
    const x=side*2.05;beam(THREE,root,[x,terrainHeight(x,stairStartZ)+.9,stairStartZ-.2],[x,12.45,-8.1],.12,stone,6);
    for(let i=0;i<7;i++){const z=stairStartZ+2+i*3.2;box(THREE,root,.35,.32,.35,stoneLight,x,terrainHeight(x,z)+.75,z);}
  }
  // Nine square storeys, each with a projecting tiled hip eave and recessed window niches.
  const tower=new THREE.Group();tower.name='九层密檐砖塔';tower.position.y=terraceY+.12;root.add(tower);
  box(THREE,tower,12,.8,12,stoneLight,0,.4,0);box(THREE,tower,11.6,.2,11.6,mortar,0,.9,0);
  for(let i=0;i<9;i++){
    const y=1.05+i*4.35,w=11.4-i*.61,h=3.32,roofW=w+1.35-i*.035;
    const body=box(THREE,tower,w,h,w,brick,0,y+h/2,0);body.material=i%2?brickAlt:brick;
    box(THREE,tower,w+.12,.14,w+.12,mortar,0,y+.24,0);
    box(THREE,tower,w+.1,.12,w+.1,stoneLight,0,y+h-.14,0);
    // Narrow stone corner pilasters and a central dark niche on each elevation.
    for(const s of [-1,1])for(const t of [-1,1])box(THREE,tower,.16,h-.25,.16,stoneLight,s*(w/2-.18),y+h/2,t*(w/2-.18));
    const winY=y+h*.57,winW=Math.max(.42,.78-i*.025),winH=Math.max(.58,.9-i*.03),face=w/2+.075;
    addWindow(THREE,tower,winW,winH,0,winY,-face,0,stoneLight,dark);
    addWindow(THREE,tower,winW,winH,face,winY,0,Math.PI/2,stoneLight,dark);
    addWindow(THREE,tower,winW,winH,0,winY,face,Math.PI,stoneLight,dark);
    addWindow(THREE,tower,winW,winH,-face,winY,0,-Math.PI/2,stoneLight,dark);
    addRoof(THREE,tower,roofW,y+h+.02,w,roof,roofTrim,i);
    // A light masonry course under each eave separates the storey bands.
    box(THREE,tower,w*.94,.12,w*.94,stoneLight,0,y+h-.04,0);
  }
  // The tower is nested on the raised terrace, so its crown must use world-local root height.
  const topY=terraceY+.12+1.05+8*4.35+3.32+.94;
  const cap=new THREE.Mesh(new THREE.ConeGeometry(2.45,3.0,4),roof);cap.position.set(0,topY+1.4,0);cap.rotation.y=Math.PI/4;cap.castShadow=true;root.add(cap);
  const finialBase=topY+2.9;
  for(let i=0;i<4;i++){const r=.42-i*.075,y=finialBase+i*.38;const fin=new THREE.Mesh(new THREE.CylinderGeometry(r*.74,r,.42,8),roofTrim);fin.position.set(0,y,0);fin.castShadow=true;root.add(fin);}
  const finialTip=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),roofTrim);finialTip.position.set(0,finialBase+1.65,0);root.add(finialTip);
  // Stone paving slabs around the tower base.
  for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
    if(Math.max(Math.abs(x),Math.abs(z))<4)continue;
    box(THREE,root,.94,.035,.94,(x+z)%3?stoneLight:stone, x,terraceY+.16,z);
  }
  // Sparse trees are distributed on the lower slopes, leaving the tower silhouette clear.
  const trees=[[-15,-5,5],[-11,8,4.2],[13,-7,5.1],[17,7,4.4],[-4,17,3.8],[7,18,4.6],[-18,10,4.2],[19,-14,3.8],[-27,-6,5.4],[25,-13,4.8],[-23,19,5.1],[28,8,5.6],[-5,28,4.5],[8,-26,5.1]];
  for(let i=0;i<trees.length;i++){
    const [x,z,size]=trees[i],y=terrainHeight(x,z)+.08;
    addTree(THREE,root,x,y,z,size,bark,i%2?leaf:leafLight);
  }
  // A low stone path follows the visible hillside approach on both sides of the stairs.
  for(let i=0;i<17;i++){
    const z=-20+i*1.55,y=terrainHeight(4.4,z)+.14;
    box(THREE,root,1.1,.1,1.35, i%2?stoneLight:stone,4.4,y,z);
    box(THREE,root,1.1,.1,1.35, i%2?stone:stoneLight,-4.4,y,z);
  }
  // Scattered loess and stone patches break the broad hillside color without hiding its profile.
  for(let i=0;i<46;i++){
    const a=i*2.399963,zRadius=7+(i%8)*1.7,x=Math.cos(a)*zRadius,z=Math.sin(a)*zRadius;
    if(Math.max(Math.abs(x),Math.abs(z))<10)continue;
    const patch=new THREE.Mesh(new THREE.IcosahedronGeometry(.36+(i%4)*.11,0),i%3?earthLight:stone);patch.position.set(x,terrainHeight(x,z)+.12,z);patch.scale.set(1.7,.34,1.1);patch.rotation.y=a;patch.castShadow=true;patch.receiveShadow=true;root.add(patch);
  }
  root.userData.dimensions={towerWidth:12,towerHeight:44,siteWidth:48,siteDepth:48,units:'m'};
  root.userData.cameraTarget=[0,29,0];
  return root;
}
