const mat=(THREE,color,roughness=.88,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness:0,...extra});
function box(THREE,parent,w,h,d,material,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function beam(THREE,parent,a,b,r,material,segments=8){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),segments),material);mesh.position.copy(p.add(q).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
function plaqueText(THREE,parent,lines,x,y,z,w,h,{background='#8d241d',foreground='#f3d9ac',border='#c9a05c',font='bold 58px serif'}={}){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle=background;ctx.fillRect(0,0,1024,512);ctx.strokeStyle=border;ctx.lineWidth=16;ctx.strokeRect(12,12,1000,488);ctx.fillStyle=foreground;ctx.textAlign='center';ctx.textBaseline='middle';
  const rows=Array.isArray(lines)?lines:[lines],size=rows.length>1?70:112;ctx.font=`bold ${size}px serif`;rows.forEach((line,i)=>ctx.fillText(line,512,256+(i-(rows.length-1)/2)*112));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.75,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=Math.PI;parent.add(mesh);return mesh;
}
function addStar(THREE,parent,x,y,z,r,material){
  const points=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;points.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
  const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);mesh.position.set(x,y,z);mesh.material.side=THREE.DoubleSide;parent.add(mesh);return mesh;
}
function addHammerSickle(THREE,parent,x,y,z,scale,gold){
  const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);
  const sickle=new THREE.Mesh(new THREE.TorusGeometry(.27,.045,6,18,Math.PI*1.45),gold);sickle.rotation.z=Math.PI*.55;group.add(sickle);
  beam(THREE,group,[-.19,-.2,0],[.18,.21,0],.042,gold,6);box(THREE,group,.28,.09,.08,gold,.16,.19,0);
  return group;
}
function addRoof(THREE,parent,tiles,trim,frontZ){
  const width=14.4,depth=12.5,eaveY=5.2,ridgeY=6.25,half=width/2,d=depth/2;
  const verts=[-half,ridgeY,0,half,ridgeY,0,half,eaveY,d,-half,eaveY,d,half,eaveY,-d,-half,eaveY,-d];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1,0,0,1,0],2));geo.setIndex([0,3,2,0,2,1,0,1,4,1,5,4,0,5,3,1,2,4]);geo.computeVertexNormals();const roof=new THREE.Mesh(geo,tiles);roof.material.side=THREE.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;parent.add(roof);
  box(THREE,parent,width+.32,.22,.32,trim,0,eaveY,frontZ+.15);box(THREE,parent,width+.32,.22,.32,trim,0,eaveY,-frontZ-.15);
  // Raised ridge cap and thin green tile courses.
  box(THREE,parent,width*.66,.18,.26,trim,0,ridgeY+.02,0);
  for(let i=1;i<5;i++){
    const z=d-i*(d/5),y=eaveY+i*(ridgeY-eaveY)/5;
    box(THREE,parent,width*.91,.035,.045,trim,0,y,z);box(THREE,parent,width*.91,.035,.045,trim,0,y,-z);
  }
}
function addParapet(THREE,parent,wall,frontZ,trim){
  const s=new THREE.Shape();s.moveTo(-7,5.0);s.lineTo(7,5.0);s.lineTo(7,6.15);s.quadraticCurveTo(6.35,6.82,5.68,6.2);s.quadraticCurveTo(4.6,5.68,3.7,6.15);s.quadraticCurveTo(2.5,6.72,1.35,6.54);s.quadraticCurveTo(0,6.42,-1.35,6.54);s.quadraticCurveTo(-2.5,6.72,-3.7,6.15);s.quadraticCurveTo(-4.6,5.68,-5.68,6.2);s.quadraticCurveTo(-6.35,6.82,-7,6.15);s.closePath();
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.34,bevelEnabled:false,curveSegments:12}),wall);mesh.position.set(0,0,frontZ-.3);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  // Raised center crest and end pinnacles complete the silhouette.
  const crest=new THREE.Shape();crest.moveTo(-1.05,6.48);crest.quadraticCurveTo(-.85,7.0,0,7.02);crest.quadraticCurveTo(.85,7.0,1.05,6.48);crest.closePath();const c=new THREE.Mesh(new THREE.ExtrudeGeometry(crest,{depth:.38,bevelEnabled:false}),wall);c.position.set(0,0,frontZ-.34);c.castShadow=true;parent.add(c);
  for(const x of [-6.55,-4.55,4.55,6.55]){
    box(THREE,parent,.18,.92,.2,trim,x,6.43,frontZ-.14);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.22,.48,4),trim);tip.position.set(x,7.12,frontZ-.14);tip.rotation.y=Math.PI/4;parent.add(tip);
  }
}

export function createTemporaryGovernmentSite(THREE){
  const root=new THREE.Group();root.name='临时中央政府旧址';
  const plaster=mat(THREE,'#d6d1c5',.9),plasterHi=mat(THREE,'#e4dfd3',.86),stone=mat(THREE,'#484845',.96),stoneHi=mat(THREE,'#625f59',.93),green=mat(THREE,'#174b3d',.58),greenHi=mat(THREE,'#286653',.55),greenDark=mat(THREE,'#102f29',.75),roof=mat(THREE,'#315b4b',.8),red=mat(THREE,'#a52b20',.72),gold=mat(THREE,'#d6a12f',.48),trim=mat(THREE,'#b2a792',.82),ground=mat(THREE,'#aaa18e',.96);
  const width=14,depth=12,frontZ=-depth/2,baseY=.28,eaveY=5;
  // Stone plinth and stepped forecourt.
  box(THREE,root,15.1,.54,13.1,stone,0,.27,.15);box(THREE,root,14.65,.22,12.7,stoneHi,0,.65,.15);
  box(THREE,root,18,.16,13.2,ground,0,.08,-.25);
  for(let i=0;i<4;i++)box(THREE,root,5.3-i*.24,.22,1.1,stoneHi,0,.82-i*.22,-7.1-i*.95);
  // Rear and short-side walls; the facade is assembled around five real recessed openings.
  box(THREE,root,width,.24,depth,plaster,0,baseY+.12,0);
  box(THREE,root,width,.24,depth,plaster,0,eaveY-.12,0);
  for(const side of [-1,1]){
    box(THREE,root,.24,eaveY-baseY,depth,plaster,side*(width/2-.12),(baseY+eaveY)/2,0);
    box(THREE,root,.32,.32,depth+.12,plasterHi,side*(width/2-.1),eaveY-.12,0);
    // A recessed green shutter window on each visible side elevation.
    const x=side*(width/2+.02);box(THREE,root,.055,1.18,1.25,greenDark,x,2.75,1.65);
    box(THREE,root,.08,.12,1.5,plasterHi,x,3.4,1.65);box(THREE,root,.08,.12,1.5,plasterHi,x,2.1,1.65);
    for(let j=0;j<5;j++)box(THREE,root,.045,.07,1.05,greenHi,x+side*.05,2.35+j*.16,1.65);
  }
  const openings=[
    {x:-5.05,kind:'door',w:1.28,h:2.45},
    {x:-2.52,kind:'window',w:1.42,h:1.45},
    {x:0,kind:'door',w:1.45,h:2.72},
    {x:2.52,kind:'window',w:1.42,h:1.45},
    {x:5.05,kind:'door',w:1.28,h:2.45}
  ];
  const jamb=.42,openingTop=3.2;
  let edge=-width/2;
  for(const item of openings){
    const left=item.x-item.w/2,right=item.x+item.w/2;
    if(left>edge)box(THREE,root,left-edge,eaveY-baseY,.22,(item.x<0?plaster:plasterHi),(edge+left)/2,(baseY+eaveY)/2,frontZ);
    const openingY=item.kind==='door'?baseY+item.h/2:1.9;
    const lower=item.kind==='window'?openingY-item.h/2:baseY;
    const upper=item.kind==='window'?openingY+item.h/2:item.h+baseY;
    box(THREE,root,jamb,eaveY-baseY,.28,plasterHi,left-jamb/2,(baseY+eaveY)/2,frontZ);
    box(THREE,root,jamb,eaveY-baseY,.28,plasterHi,right+jamb/2,(baseY+eaveY)/2,frontZ);
    if(lower>baseY+.04)box(THREE,root,item.w,lower-baseY,.24,plaster,item.x,(lower+baseY)/2,frontZ);
    if(upper<eaveY-.03)box(THREE,root,item.w,eaveY-upper,.24,plaster,item.x,(upper+eaveY)/2,frontZ);
    const door=item.kind==='door';
    if(door){
      box(THREE,root,item.w-.14,item.h,.08,greenDark,item.x,baseY+item.h/2,frontZ-.12);
      const leafW=(item.w-.2)/2;
      for(const side of [-1,1]){
        const leafMesh=box(THREE,root,leafW,item.h-.12,.09,green,item.x+side*leafW*.52,baseY+item.h/2,frontZ-.18);
        box(THREE,root,.08,item.h-.2,.04,greenHi,leafMesh.position.x,leafMesh.position.y,frontZ-.24);
        for(let row=1;row<5;row++)box(THREE,root,leafW-.12,.035,.04,greenHi,leafMesh.position.x,baseY+row*item.h/5,frontZ-.25);
      }
      const handle=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),gold);handle.position.set(item.x+.08,baseY+item.h*.52,frontZ-.29);root.add(handle);
    }else{
      box(THREE,root,item.w-.12,item.h-.1,.07,greenDark,item.x,openingY,frontZ-.12);
      box(THREE,root,item.w,.1,.12,greenHi,item.x,openingY+item.h/2+.03,frontZ-.19);
      box(THREE,root,.12,item.h+.08,.12,greenHi,item.x-item.w/2,openingY,frontZ-.19);
      box(THREE,root,.12,item.h+.08,.12,greenHi,item.x+item.w/2,openingY,frontZ-.19);
      for(let row=0;row<7;row++)box(THREE,root,item.w-.2,.055,.045,greenHi,item.x,openingY-item.h*.38+row*item.h*.125,frontZ-.23);
      box(THREE,root,item.w+.22,.12,.22,plasterHi,item.x,openingY+item.h/2+.15,frontZ-.12);
    }
    edge=right;
  }
  if(edge<width/2)box(THREE,root,width/2-edge,eaveY-baseY,.22,plaster,(width/2+edge)/2,(baseY+eaveY)/2,frontZ);
  // Cornice bands and subtle rectangular relief panels on the facade.
  box(THREE,root,width+.25,.22,.42,plasterHi,0,4.85,frontZ-.1);box(THREE,root,width+.48,.16,.48,stoneHi,0,5.04,frontZ-.12);
  for(const x of [-5.9,-3.8,3.8,5.9]){
    box(THREE,root,.09,1.05,.1,plasterHi,x,4.2,frontZ-.15);box(THREE,root,1.45,.08,.11,plasterHi,x,4.72,frontZ-.15);
  }
  // A shallow extruded parapet carries the characteristic curved skyline.
  addParapet(THREE,root,plaster,frontZ,plasterHi);
  for(const x of [-6.6,-4.6,4.6,6.6])box(THREE,root,.18,.12,.62,green,x,5.18,frontZ-.08);
  addRoof(THREE,root,roof,green,frontZ);
  // Raised emblem and title plaque are separated from the plaster plane for readable relief.
  const medallion=new THREE.Mesh(new THREE.CircleGeometry(.82,32),red);medallion.position.set(0,5.88,frontZ-.55);root.add(medallion);
  const outer=new THREE.Mesh(new THREE.RingGeometry(.68,.8,32),gold);outer.position.set(0,5.88,frontZ-.57);root.add(outer);
  addStar(THREE,root,0,5.88,frontZ-.61,.68,gold);
  const core=new THREE.Mesh(new THREE.CircleGeometry(.27,24),green);core.position.set(0,5.88,frontZ-.66);root.add(core);
  addHammerSickle(THREE,root,-3.75,5.62,frontZ-.48,.86,gold);addHammerSickle(THREE,root,3.75,5.62,frontZ-.48,.86,gold);
  addStar(THREE,root,-2.35,5.82,frontZ-.5,.24,red);addStar(THREE,root,2.35,5.82,frontZ-.5,.24,red);
  plaqueText(THREE,root,['中华苏维埃共和国','临时中央政府'],0,4.25,frontZ-.55,4.8,.95,{background:'#ded4c1',foreground:'#a51f1c',border:'#b49a70',font:'bold 76px serif'});
  // Roof/eave finish, corner piers and paving module around the entrance.
  for(const x of [-6.8,6.8]){
    box(THREE,root,.32,5.7,.34,plasterHi,x,2.86,frontZ-.1);
    box(THREE,root,.62,.28,.62,stoneHi,x,.82,frontZ-.1);
  }
  for(let z=-9;z<5;z+=1.25)for(let x=-9;x<9;x+=1.25){
    const slab=box(THREE,root,1.18,.035,1.18,(Math.round(x+z)%3)?ground:plasterHi,x,.01,z);slab.receiveShadow=true;
  }
  root.userData.dimensions={width:14,depth:12,eaveHeight:5,totalHeight:7.4,units:'m'};
  root.userData.cameraTarget=[0,3.6,0];
  return root;
}
