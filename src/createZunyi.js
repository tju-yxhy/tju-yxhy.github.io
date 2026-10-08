function mat(THREE,color,roughness=.82,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness:0,...extra});}
function box(THREE,parent,w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function beam(THREE,parent,a,b,r,material,segments=8){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),segments),material);m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function brickTexture(THREE){const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#31383a';g.fillRect(0,0,512,512);for(let y=0;y<512;y+=24)for(let x=0;x<512;x+=48){const xx=x+((y/24)%2)*24;g.fillStyle=((x+y)/24|0)%4?'#3d4446':'#333a3c';g.fillRect(xx+1,y+1,46,22);g.strokeStyle='#aaa69b';g.globalAlpha=.55;g.lineWidth=2;g.strokeRect(xx+1,y+1,46,22);g.globalAlpha=1;}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.2,1.2);t.anisotropy=8;return t;}
function roofTexture(THREE){const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#444b4d';g.fillRect(0,0,512,512);for(let y=0;y<32*16;y+=32)for(let x=0;x<42*13;x+=42){const xx=x+((y/32)%2)*21;g.fillStyle=((x+y)/32|0)%3?'#555d5f':'#697072';g.fillRect(xx+1,y+1,40,29);g.strokeStyle='#7e8482';g.lineWidth=2;g.beginPath();g.arc(xx+21,y+2,19,0,Math.PI);g.stroke();g.strokeStyle='#252b2d';g.beginPath();g.moveTo(xx+40,y);g.lineTo(xx+40,y+30);g.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.5,1);t.anisotropy=8;return t;}
function archPanel(THREE,material,width,height,depth,openingWidth,springY){const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(width/2,height);s.lineTo(-width/2,height);s.closePath();const r=openingWidth/2,h=new THREE.Path();h.moveTo(-r,0);h.lineTo(r,0);h.lineTo(r,springY);h.absarc(0,springY,r,0,Math.PI,false);h.lineTo(-r,0);h.closePath();s.holes.push(h);const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18}),material);m.castShadow=true;m.receiveShadow=true;return m;}
function addArchTrim(THREE,parent,cx,baseY,r,springY,z,material){for(let i=0;i<20;i++){const a=Math.PI*i/20,b=Math.PI*(i+1)/20;beam(THREE,parent,[cx+r*Math.cos(a),baseY+springY+r*Math.sin(a),z],[cx+r*Math.cos(b),baseY+springY+r*Math.sin(b),z],.07,material,7);}for(const side of [-1,1])beam(THREE,parent,[cx+side*r,baseY,z],[cx+side*r,baseY+springY,z],.07,material,7);}
function hipRoof(THREE,parent,width,depth,eaveY,ridgeY,tiles,trim){const group=new THREE.Group();group.name='灰瓦四坡屋顶';parent.add(group);const rw=width*.62, e=width/2,d=depth/2;const verts=[-rw/2,ridgeY,0,rw/2,ridgeY,0,e,eaveY,-d,-e,eaveY,-d,e,eaveY,d,-e,eaveY,d];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1,0,0,1,0],2));geo.setIndex([0,3,2,0,2,1,0,1,4,1,5,4,0,5,3,1,2,4]);geo.computeVertexNormals();const m=new THREE.Mesh(geo,tiles);m.material.side=THREE.DoubleSide;m.castShadow=true;m.receiveShadow=true;group.add(m);box(THREE,group,rw,.22,.25,trim,0,ridgeY,0);for(const z of [-d,d])beam(THREE,group,[-e,eaveY,z],[e,eaveY,z],.1,trim,8);for(const x of [-e,e])beam(THREE,group,[x,eaveY,-d],[x,eaveY,d],.1,trim,8);return group;}
function stair(THREE,parent,x,materials){const n=12,z0=-2.8,run=.48,rise=.28;for(let i=0;i<n;i++){const z=z0+i*run,y=rise*(i+.5);box(THREE,parent,1.65,rise,run+.08,materials.wood,x,y,z);}for(const side of [-1,1]){const xx=x+side*1.02;beam(THREE,parent,[xx,.2,z0-.2],[xx,3.55,z0+n*run],.08,materials.woodLight,8);for(let i=0;i<=4;i++){const k=i*3;const zz=z0+k*run, yy=rise*k+.25;beam(THREE,parent,[xx,yy-.18,zz],[xx,yy+.18,zz],.055,materials.woodLight,6);}}}

export function createZunyiMeetingSite(THREE){
  const root=new THREE.Group();root.name='遵义会议旧址 · 24×9.5×7.5 m';
  const brick=new THREE.MeshStandardMaterial({map:brickTexture(THREE),color:'#c2c0ba',roughness:.92,metalness:0}),brickSolid=mat(THREE,'#505354',.95),plaster=mat(THREE,'#ded9cc',.88),stone=mat(THREE,'#a9a396',.86),wood=mat(THREE,'#713a2b',.68),woodLight=mat(THREE,'#9a523d',.64),woodDark=mat(THREE,'#4a2921',.76),rail=mat(THREE,'#963f2c',.62),ground=mat(THREE,'#8e8b83',.94),tileMap=roofTexture(THREE),tiles=new THREE.MeshStandardMaterial({map:tileMap,roughness:.68,side:THREE.DoubleSide});
  const width=24,depth=9.5,bays=8,bw=width/bays,story=3.4,front=-depth/2-.05,back=depth/2-.05;
  // Interior floor plates and long brick gallery bays.
  box(THREE,root,width,.24,depth,ground,0,.12,0);box(THREE,root,width,.24,depth,ground,0,story+.12,0);
  for(const [base,z] of [[0,front],[0,back],[story,front],[story,back]]){
    const upper=base>0,openW=upper?2.15:2.0,spring=upper?1.95:2.05,h=story-.12;
    for(let i=0;i<bays;i++){
      const cx=-width/2+bw*(i+.5),panel=archPanel(THREE,brick,bw-.02,h,.48,openW,spring);panel.position.set(cx,base+.24,z);root.add(panel);
      addArchTrim(THREE,root,cx,base+.24,openW/2,spring,z-.025,plaster);
      const leafW=upper?1.05:(i%2===0?1.35:1.05),leafH=upper?1.75:2.0,door=box(THREE,root,leafW,leafH,.10,wood,cx,base+.24+leafH/2,z+.12);
      box(THREE,root,.07,leafH,.06,woodLight,cx-leafW/2+.12,base+.24+leafH/2,z+.05);box(THREE,root,.07,leafH,.06,woodLight,cx+leafW/2-.12,base+.24+leafH/2,z+.05);
      if(i%2===1){for(const q of [-.30,.30])box(THREE,root,.04,leafH*.68,.045,woodLight,cx+q,base+.24+leafH*.58,z+.04);box(THREE,root,leafW*.74,.05,.045,woodLight,cx,base+.24+leafH*.56,z+.04);}
      door.receiveShadow=true;
    }
    // Masonry piers and white capitals define the repeated arcade rhythm.
    for(let i=0;i<=bays;i++){
      const x=-width/2+i*bw;
      box(THREE,root,.48,h+.15,.68,brickSolid,x,base+.24+h/2,z-.08);
      box(THREE,root,.66,.22,.84,stone,x,base+.4,z-.08);
      box(THREE,root,.78,.24,.9,plaster,x,base+h+.05,z-.08);
      box(THREE,root,.82,.11,.92,stone,x,base+h+.21,z-.08);
    }
  }
  // End elevations: shorter three-bay arcades, tying both galleries together.
  for(const side of [-1,1])for(const level of [0,story])for(let i=0;i<3;i++){
    const z=-depth/2+depth*(i+.5)/3,x=side*(width/2-.05),h=story-.12,r=.9,spring=2.0;
    const panel=archPanel(THREE,brickSolid,depth/3-.05,h,.5,1.8,spring);panel.rotation.y=side<0?Math.PI/2:-Math.PI/2;panel.position.set(x,level+.24,z);root.add(panel);
    box(THREE,root,.7,h+.12,.7,brickSolid,x,level+.24+h/2,z);
  }
  // White belt courses, upper red gallery rails and plinths.
  for(const z of [front-.4,back+.35]){
    box(THREE,root,width+.55,.24,.38,plaster,0,story+.12,z);
    box(THREE,root,width+.55,.2,.38,stone,0,story+.3,z);
    const ry=story+1.08,rz=z-.05;
    box(THREE,root,width+.25,.12,.12,rail,0,ry,rz);box(THREE,root,width+.25,.11,.12,rail,0,ry-.68,rz);
    for(let i=0;i<=48;i++)box(THREE,root,.065,.68,.065,rail,-(width+.25)/2+i*(width+.25)/48,ry-.34,rz);
  }
  for(const x of [-width/2,width/2]){box(THREE,root,.35,.22,depth+.4,plaster,x,story-.02,0);box(THREE,root,.35,.22,depth+.4,stone,x,story+.2,0);}
  // Side stair flights visible in the short elevation.
  stair(THREE,root,-12.7,{wood,woodLight});
  // Hipped tile roof and a small central roof monitor shown on the reference board.
  box(THREE,root,width+.7,.24,depth+.65,plaster,0,2*story-.08,0);
  hipRoof(THREE,root,width+1.15,depth+1.05,2*story+.05,7.5,tiles,woodDark);
  box(THREE,root,2.05,.85,1.05,wood,0,7.0,-.15);box(THREE,root,2.45,.12,1.35,plaster,0,7.42,-.15);
  const dormerRoof=mat(THREE,'#394144',.68);const gable=new THREE.Shape();gable.moveTo(-1.3,7.35);gable.lineTo(0,8.2);gable.lineTo(1.3,7.35);gable.closePath();const gm=new THREE.Mesh(new THREE.ShapeGeometry(gable),woodDark);gm.material.side=THREE.DoubleSide;gm.position.z=-.84;root.add(gm);box(THREE,root,2.8,.12,1.65,dormerRoof,0,8.12,-.15);
  root.userData.dimensions={width:24,depth:9.5,storyHeight:3.4,totalHeight:8.2};return root;
}
