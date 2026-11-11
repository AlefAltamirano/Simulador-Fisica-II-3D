import * as THREE from 'three';
export function equivalentResistance(p) {
  const {resistance:a,resistance2:b,resistance3:c,topology:t}=p;
  return t==='series'?a+b+c:t==='parallel'?1/(1/a+1/b+1/c):t==='mixed'?a+1/(1/b+1/c):a;
}
export function branchValues(p) {
  const {voltage:V,resistance:a,resistance2:b,resistance3:c,topology:t,switchClosed:on}=p;
  if(!on)return {voltages:[0,0,0],currents:[0,0,0]};
  const I=V/equivalentResistance(p);
  if(t==='single')return {voltages:[V,0,0],currents:[I,0,0]};
  if(t==='series')return {voltages:[I*a,I*b,I*c],currents:[I,I,I]};
  if(t==='parallel')return {voltages:[V,V,V],currents:[V/a,V/b,V/c]};
  const vp=V-I*a;return {voltages:[I*a,vp,vp],currents:[I,vp/b,vp/c]};
}
export class ResistorNetwork {
  constructor(scene,physics) {
    this.physics=physics;this.group=new THREE.Group();scene.add(this.group);
    this.params={voltage:12,resistance:10,resistance2:20,resistance3:30,topology:'single',switchClosed:true};
    this.rebuildNetwork();
  }
  equivalentResistance(){return equivalentResistance(this.params);}
  rebuildNetwork() {
    this.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});this.group.clear();this.paths=[];
    const line=(pts,color=0x3e627d)=>this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(([x,y])=>new THREE.Vector3(x,y,0))),new THREE.LineBasicMaterial({color})));
    const label=(text,x,y)=>{
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#17374f';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,63);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false,toneMapped:false}));sprite.position.set(x,y,.2);sprite.scale.set(2,.375,1);this.group.add(sprite);
    };
    const resistor=(x,y,idx)=>{const body=new THREE.Mesh(new THREE.BoxGeometry(.85,.28,.24),new THREE.MeshStandardMaterial({color:0xd59b3e,roughness:.6}));body.position.set(x,y,0);this.group.add(body);label('R'+(idx+1),x,y+.35);};
    const branch=(left,right,y,idx)=>{const x=(left+right)/2;line([[left,y],[x-.45,y]]);line([[x+.45,y],[right,y]]);resistor(x,y,idx);this.paths.push({points:[[right,y],[left,y]],idx});};
    line([[-3,1.8],[-3,-1.8],[-.45,-1.8]]);line([[.45,-1.8],[3,-1.8],[3,1.8]]);
    line([[-.35,-2.05],[-.35,-1.55]],0x0369a1);line([[.35,-2.2],[.35,-1.4]],0xb91c1c);label('−     +',0,-1.15);label('Fuente DC',0,-2.5);
    const t=this.params.topology;
    if(t==='single')branch(-3,3,1.8,0);
    if(t==='series')for(let i=0;i<3;i++)branch(-3+i*2,-1+i*2,1.8,i);
    if(t==='parallel'){for(let i=0;i<3;i++)branch(-3,3,1.8-i*1.1,i);line([[-3,-.4],[-3,1.8]]);line([[3,-.4],[3,1.8]]);}
    if(t==='mixed'){branch(1,3,1.8,0);line([[1,1.8],[1,.4]]);line([[-3,1.8],[-3,.4]]);branch(-3,1,1.8,1);branch(-3,1,.4,2);}
    this.markers=[];
    for(const path of this.paths)for(let i=0;i<12;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:0x0284c7}));this.group.add(mesh);this.markers.push({mesh,path,progress:i/12});}
    label('Portadores: sentido opuesto a I',0,-3);
  }
  setSwitch(closed){this.params.switchClosed=closed;}
  getTelemetry() {
    const p=this.params,I=p.switchClosed?p.voltage/this.equivalentResistance():0,b=branchValues(p),count=p.topology==='single'?1:3;
    return {voltage:`${p.voltage.toFixed(2)} V`,resistance:`${this.equivalentResistance().toFixed(2)} Ω`,current:`${I.toFixed(3)} A`,power:`${(p.voltage*I).toFixed(3)} W`,branchVoltages:b.voltages.slice(0,count).map(v=>v.toFixed(2)).join(' / ')+' V',branchCurrents:b.currents.slice(0,count).map(v=>v.toFixed(3)).join(' / ')+' A',state:p.switchClosed?'Cerrado (ON)':'Abierto (OFF)'};
  }
  update(time,delta){const currents=branchValues(this.params).currents;for(const m of this.markers){m.progress=(m.progress-Math.min(currents[m.path.idx],10)*.09*delta+1)%1;const[a,b]=m.path.points;m.mesh.position.set(a[0]+(b[0]-a[0])*m.progress,a[1],.16);}}
  setVisible(visible){this.group.visible=visible;}
}
