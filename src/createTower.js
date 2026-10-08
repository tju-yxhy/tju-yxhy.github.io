const WALL_W = 50, WALL_D = 20, WALL_H = 8, TOTAL_H = 15;

function mat(THREE, color, roughness=.82, extra={}) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness:0, ...extra});
}
function box(THREE, parent, w,h,d, material,x,y,z) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function beam(THREE,parent,a,b,r,material,segments=8) {
  const p=new THREE.Vector3(...a), q=new THREE.Vector3(...b), d=q.clone().sub(p);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),segments),material);
  m.position.copy(p.add(q).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function label(THREE,parent,text,w,h,x,y,z) {
  const c=document.createElement('canvas'); c.width=1024;c.height=256;
  const g=c.getContext('2d');g.fillStyle='#25170f';g.fillRect(0,0,1024,256);g.strokeStyle='#d4b565';g.lineWidth=14;g.strokeRect(10,10,1004,236);g.fillStyle='#f0d77a';g.textAlign='center';g.textBaseline='middle';g.font='bold 140px serif';g.fillText(text,512,130);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.7}));m.position.set(x,y,z);m.rotation.y=Math.PI;parent.add(m);return m;
}
function archWall(THREE, material, width,height,depth, openingWidth,springY) {
  const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(width/2,height);s.lineTo(-width/2,height);s.closePath();
  const r=openingWidth/2,hole=new THREE.Path();hole.moveTo(-r,0);hole.lineTo(r,0);hole.lineTo(r,springY);hole.absarc(0,springY,r,0,Math.PI,false);hole.lineTo(-r,0);hole.closePath();s.holes.push(hole);
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:24}),material);m.castShadow=true;m.receiveShadow=true;return m;
}
function roofMap(THREE) {
  const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#42494a';g.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=32)for(let x=0;x<512;x+=42){const xx=x+((y/32)%2)*21;g.fillStyle=((x+y)/32|0)%3?'#596061':'#697071';g.fillRect(xx+1,y+1,40,29);g.strokeStyle='#7c8280';g.lineWidth=2;g.beginPath();g.arc(xx+21,y+1,19,0,Math.PI);g.stroke();g.strokeStyle='#292f31';g.beginPath();g.moveTo(xx+40,y);g.lineTo(xx+40,y+30);g.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,1.4);t.anisotropy=8;return t;
}
function curvedRoof(THREE,parent,{width,depth,eaveY,ridgeY,name},material,wood) {
  const group=new THREE.Group();group.name=name;parent.add(group);const ridgeHalf=width*.44,eaveHalf=width*.5;
  const p=(side,t,v)=>{const xh=ridgeHalf+(eaveHalf-ridgeHalf)*t,x=-xh+2*xh*v,z=side*depth*.5*t;const y=ridgeY-(ridgeY-eaveY)*t+1.0*Math.pow(Math.abs(x)/eaveHalf,3.5)+.4*Math.pow(t,4);return[x,y,z];};
  for(const side of [-1,1]){
    const pos=[],uv=[],idx=[],rows=28,cols=36;
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){pos.push(...p(side,r/rows,c/cols));uv.push(c/cols*2,r/rows*1.5);}
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const top=new THREE.Mesh(geo,material);top.material.side=THREE.DoubleSide;top.castShadow=true;top.receiveShadow=true;group.add(top);
    const underGeo=geo.clone(),a=underGeo.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)-.07);a.needsUpdate=true;underGeo.computeVertexNormals();const under=new THREE.Mesh(underGeo,wood);under.material.side=THREE.DoubleSide;group.add(under);
    for(let i=0;i<40;i++)beam(THREE,group,p(side,1,i/40),p(side,1,(i+1)/40),.095,wood,8);
    for(const v of [0,1])for(let i=0;i<24;i++){const a=p(side,i/24,v),b=p(side,(i+1)/24,v);a[1]-=.1;b[1]-=.1;beam(THREE,group,a,b,.07,wood,8);}
  }
  box(THREE,group,width*.88,.25,.28,wood,0,ridgeY,0);
  return group;
}
function pavilionStory(THREE,parent,{w,d,y,h,bays,wood,woodLight,woodDark,rail}) {
  const group=new THREE.Group();group.position.y=y;parent.add(group);
  for(const zside of [-1,1]){
    const z=zside*d/2;
    for(let i=0;i<=bays;i++){
      const x=-w/2+i*w/bays;
      box(THREE,group,.34,h+.08,.34,woodLight,x,h/2,z);
      box(THREE,group,.5,.22,.5,woodDark,x,.18,z);
      box(THREE,group,.52,.2,.52,woodLight,x,h-.06,z);
    }
    box(THREE,group,w+.6,.32,.45,woodDark,0,h-.18,z);
    box(THREE,group,w+.8,.18,.56,woodLight,0,h-.02,z);
    const ry=h-.42,rz=z+zside*.52;
    box(THREE,group,w+.9,.12,.12,rail,0,ry,rz);box(THREE,group,w+.9,.12,.12,rail,0,ry-.7,rz);
    for(let i=0;i<=Math.round(bays*4);i++)box(THREE,group,.075,.7,.075,woodLight,-(w+.8)/2+i*(w+.8)/(bays*4),ry-.35,rz);
  }
  for(const xside of [-1,1]){
    const x=xside*w/2;
    for(let i=0;i<=4;i++){const z=-d/2+i*d/4;box(THREE,group,.34,h+.08,.34,woodLight,x,h/2,z);}
  }
  // Close the front and rear bays so oblique views read as a room, not a loose frame.
  for(const zside of [-1,1])for(let i=0;i<bays;i++){
    const x=-w/2+(i+.5)*w/bays,z=zside*(d/2+.03);
    box(THREE,group,w/bays-.36,h-.48,.1,woodDark,x,h/2,z);
    const faceZ=zside*(d/2+.09);
    box(THREE,group,w/bays-.55,h-.78,.045,wood,x,h/2,faceZ);
    for(const q of [-.33,.33])box(THREE,group,.055,h-.9,.035,woodLight,x+q,h/2,faceZ+zside*.035);
    box(THREE,group,(w/bays-.65),.055,.035,woodLight,x,h*.52,faceZ+zside*.035);
  }
  // The short elevations also receive continuous infill and simple timber windows.
  for(const xside of [-1,1])for(let i=0;i<4;i++){
    const span=d/4-.32,z=-d/2+(i+.5)*d/4,x=xside*(w/2+.02);
    box(THREE,group,.12,h-.48,span,woodDark,x,h/2,z);
    const faceX=xside*(w/2+.09),winW=span*.58,winH=h*.42;
    box(THREE,group,.045,winH,winW,wood,faceX,h*.58,z);
    for(const q of [-winW*.36,0,winW*.36])box(THREE,group,.045,winH*.9,.045,woodLight,faceX+xside*.035,h*.58,z+q);
    box(THREE,group,.045,.05,winW*.92,woodLight,faceX+xside*.035,h*.58,z);
  }
  return group;
}
function flag(THREE,parent,x,y,z,red) {
  beam(THREE,parent,[x,y,z],[x,y+1.25,z],.035,red,6);
  const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.55,-.16);s.lineTo(.42,-.38);s.lineTo(0,-.32);s.closePath();const f=new THREE.Mesh(new THREE.ShapeGeometry(s),red);f.position.set(x,y+1.2,z);f.castShadow=true;parent.add(f);
}

export function createTower(THREE) {
  const root=new THREE.Group();root.name='会宁会师楼 · 50×20×15 m';
  const stone=mat(THREE,'#898982',.95),light=mat(THREE,'#c5c1b6',.9),darkStone=mat(THREE,'#666762',.96),mortar=mat(THREE,'#777770',.96),wood=mat(THREE,'#713b28',.7),woodLight=mat(THREE,'#985738',.65),woodDark=mat(THREE,'#4d2c20',.8),rail=mat(THREE,'#8e4a30',.65),red=mat(THREE,'#b52d24',.7),roofwood=mat(THREE,'#493329',.85),tiles=new THREE.MeshStandardMaterial({map:roofMap(THREE),roughness:.68,side:THREE.DoubleSide});
  const frontZ=-WALL_D/2,backZ=WALL_D/2,gateW=8.5,spring=3.25;
  // A continuous 50 × 20 × 8 m wall with a real passage through its full depth.
  const wall=archWall(THREE,stone,WALL_W,WALL_H,WALL_D,gateW,spring);wall.position.set(0,0,frontZ);root.add(wall);
  // Staggered masonry courses across the two broad wall faces.
  for(const z of [frontZ-.035,backZ+.035])for(let row=1;row<8;row++){
    const y=row,offset=(row%2)*1.2;
    for(const [center,length,start,end] of [[-14.625,20.75,-24.9,-4.25],[14.625,20.75,4.25,24.9]]){
      box(THREE,root,length,.055,.04,mortar,center,y,z);
      for(let x=start+offset;x<end;x+=2.4)box(THREE,root,.045,.94,.045,mortar,x,y-.5,z);
    }
  }
  // Continue the ashlar courses across both 20 m end elevations.
  for(const side of [-1,1]){
    const x=side*(WALL_W/2+.035);
    for(let row=1;row<8;row++){
      box(THREE,root,.04,.055,WALL_D,mortar,x,row,0);
      const offset=(row%2)*1.2;
      for(let z=-9.7+offset;z<9.7;z+=2.4)box(THREE,root,.045,.94,.045,mortar,x,row-.5,z);
    }
  }
  box(THREE,root,WALL_W,.28,WALL_D,light,0,8.02,0);
  // Battlements around the wall crown.
  for(let i=0;i<31;i++){const x=-24.2+i*1.61;for(const z of [frontZ+.25,backZ-.25])box(THREE,root,.9,.72,.82,light,x,8.48,z);}
  for(let i=0;i<13;i++){const z=-9+i*1.5;for(const x of [-24.7,24.7])box(THREE,root,.82,.72,.9,light,x,8.48,z);}
  for(const z of [frontZ-.07,backZ+.07])for(let i=0;i<=24;i++){
    const a=Math.PI*i/24,r=gateW/2-.08,m=new THREE.Mesh(new THREE.BoxGeometry(.36,.28,.16),light);
    m.position.set(Math.cos(a)*r,spring+Math.sin(a)*r,z);m.rotation.z=a-Math.PI/2;root.add(m);
  }
  box(THREE,root,2.9,.76,.22,light,0,7.08,frontZ-.16);label(THREE,root,'会师门',2.5,.48,0,7.08,frontZ-.3);
  box(THREE,root,8.5,.12,WALL_D-.4,mat(THREE,'#aaa69b',.95),0,.05,0);
  for(const x of [-22,-16,-10,10,16,22])flag(THREE,root,x,8.78,frontZ+.5,red);
  pavilionStory(THREE,root,{w:13.4,d:10.8,y:8.16,h:2.85,bays:6,wood,woodLight,woodDark,rail});
  curvedRoof(THREE,root,{width:16.3,depth:12.3,eaveY:10.9,ridgeY:12.25,name:'下层门楼屋顶'},tiles,roofwood);
  pavilionStory(THREE,root,{w:10.8,d:8.6,y:11.05,h:2.2,bays:5,wood,woodLight,woodDark,rail});
  curvedRoof(THREE,root,{width:13.8,depth:10.4,eaveY:13.28,ridgeY:14.68,name:'上层门楼屋顶'},tiles,roofwood);
  label(THREE,root,'会师门',3.1,.76,0,12.15,-4.48);
  root.userData.dimensions={width:WALL_W,depth:WALL_D,wallHeight:WALL_H,totalHeight:TOTAL_H};return root;
}
