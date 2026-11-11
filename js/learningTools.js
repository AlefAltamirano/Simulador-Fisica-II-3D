import * as THREE from 'three';
export const METRIC_LABELS={chargeCount:'Cargas (máximo 10)',netCharge:'Carga neta',probePosition:'Posición de la sonda',electricField:'Campo eléctrico',electricPotential:'Potencial eléctrico',fieldVector:'Vector E (SI)',capacitance:'Capacitancia',energy:'Energía almacenada',charge:'Carga acumulada',plateArea:'Área de placas',separation:'Separación',dielectric:'Dieléctrico',voltage:'Voltaje',resistance:'Resistencia equivalente',current:'Corriente total',power:'Potencia total',state:'Interruptor',particlePos:'Posición de la partícula',velocity:'Rapidez',magneticFieldB:'Campo magnético B',electricFieldE:'Campo eléctrico E',lorentzForce:'Fuerza de Lorentz',cyclotronRadius:'Radio m·v⊥ / |q|B',branchVoltages:'Voltajes R1 / R2 / R3',branchCurrents:'Corrientes R1 / R2 / R3'};
const notes={
  1:['Cargas y potencial','Rojo: carga positiva · Azul: negativa · Morado: equipotenciales en z = 0. Arrastra para girar y usa la rueda para acercarte.','Prueba el dipolo: en su plano medio V = 0, aunque E puede ser distinto de cero. La sonda usa SI; líneas, equipotenciales y trayectoria eléctrica usan un campo suavizado en unidades normalizadas.'],
  2:['Capacitores y dieléctricos','Fuente conectada: el voltaje permanece constante. La inserción representa la fracción del área ocupada por el dieléctrico.','Duplica A: C y U se duplican. Duplica d: C se reduce a la mitad. Modelo ideal sin corrección cuantitativa de bordes.'],
  3:['Circuitos y ley de Ohm','Ajusta R1, R2 y R3 en el panel derecho. La animación de los portadores representa el sentido opuesto a la corriente convencional.','Compara serie y paralelo usando la misma fuente. ¿En qué conexión aumenta la corriente total? Comprueba las caídas de voltaje y corrientes de cada resistencia.'],
  4:['Fuerza de Lorentz','Verde: B · Ámbar: E · Azul: velocidad · Rojo: fuerza neta. Carga en C y masa en kg: partícula didáctica.','En el selector, v = E/B y E + v × B = 0: la trayectoria es recta. El campo B es uniforme; los anillos son referencias visuales.']
};
function clear(group){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});group.clear();}

export function extendElectrostatics(unit){
  const visuals=new THREE.Group();unit.group.add(visuals);
  const probe=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),new THREE.MeshBasicMaterial({color:0x7c3aed}));unit.group.add(probe);
  Object.assign(unit.params,{showLines:true,showContours:false,showSurface:false,isoPotential:1,launchX:-4,launchY:1,launchZ:0,launchVx:1,launchVy:0,launchVz:0,particleCharge:1});
  const trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x9d174d}));
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color:0x9d174d}));unit.group.add(trail,mesh);mesh.visible=false;
  let particle=null,points=[];
  unit.launchParticle=()=>{const p=unit.params;particle={position:{x:p.launchX,y:p.launchY,z:p.launchZ},velocity:{x:p.launchVx,y:p.launchVy,z:p.launchVz},q:p.particleCharge};points=[];mesh.position.copy(particle.position);mesh.visible=true;trail.geometry.dispose();trail.geometry=new THREE.BufferGeometry();};
  unit.rebuildLearningVisuals=()=>{
    clear(visuals);
    const potential=p=>unit.physics.calculateElectricPotential(p,unit.charges,false);
    if(unit.params.showLines){
      const positive=unit.charges.filter(c=>c.q>0),seeds=positive.length?positive:unit.charges.filter(c=>c.q<0),sign=positive.length?1:-1;
      for(const c of seeds)for(let i=0;i<16;i++){
        const angle=i*Math.PI/8;let p=new THREE.Vector3(c.x+.4*Math.cos(angle),c.y+.4*Math.sin(angle),c.z);const pts=[p.clone()];
        for(let j=0;j<240;j++){
          const e=unit.physics.calculateElectricField(p,unit.charges);if(e.magnitude<1e-7)break;
          p=p.clone().addScaledVector(new THREE.Vector3(e.direction.x,e.direction.y,e.direction.z),.065*sign);pts.push(p);
          if(p.length()>9||unit.charges.some(q=>q.q*sign<0&&p.distanceTo(new THREE.Vector3(q.x,q.y,q.z))<.36))break;
        }
        visuals.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x0369a1,transparent:true,opacity:.7})));
      }
    }
    if(unit.params.showContours){
      const segments=[],levels=[-4,-2,-1,-.5,0,.5,1,2,4],n=64,step=12/n;
      for(let x=0;x<n;x++)for(let y=0;y<n;y++){
        const ps=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([a,b])=>new THREE.Vector3(-6+a*step,-6+b*step,.015)),vs=ps.map(potential);
        for(const level of levels)for(const ids of [[0,1,2],[0,2,3]]){
          const cuts=[];for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3];if((vs[a]<level)!==(vs[b]<level))cuts.push(ps[a].clone().lerp(ps[b],(level-vs[a])/(vs[b]-vs[a])));}
          if(cuts.length===2)segments.push(...cuts);
        }
      }
      visuals.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segments),new THREE.LineBasicMaterial({color:0x7e22ce})));
    }
    if(unit.params.showSurface&&unit.charges.length){
      const vertices=[],n=22,step=10/n,level=unit.params.isoPotential,offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
      for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++){
        const ps=offsets.map(([a,b,c])=>new THREE.Vector3(-5+(x+a)*step,-5+(y+b)*step,-5+(z+c)*step)),vs=ps.map(potential);
        for(const t of tetra){
          const inside=t.filter(i=>vs[i]<level),outside=t.filter(i=>vs[i]>=level);
          const cut=(a,b)=>ps[a].clone().lerp(ps[b],(level-vs[a])/(vs[b]-vs[a]));
          const add=(a,b,c)=>vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
          if(inside.length===1||outside.length===1){const a=inside.length===1?inside[0]:outside[0],others=inside.length===1?outside:inside;add(...others.map(b=>cut(a,b)));}
          else if(inside.length===2){const[a,b]=inside,[c,d]=outside,ac=cut(a,c),ad=cut(a,d),bc=cut(b,c),bd=cut(b,d);add(ac,ad,bc);add(ad,bd,bc);}
        }
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();visuals.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8b5cf6,side:THREE.DoubleSide,transparent:true,opacity:.26,depthWrite:false})));
    }
  };
  const update=unit.update.bind(unit);
  unit.update=(time,delta)=>{
    update(time,delta);probe.position.copy(unit.params.probePoint);if(!particle)return;
    // Velocity Verlet in a spatially varying, softened field; normalized q and m = 1.
    for(let i=0;i<4;i++){
      const dt=delta/4,p=particle.position,v=particle.velocity,q=particle.q,a=unit.physics.calculateElectricField(p,unit.charges).vector;
      const next={x:p.x+v.x*dt+.5*q*a.x*dt*dt,y:p.y+v.y*dt+.5*q*a.y*dt*dt,z:p.z+v.z*dt+.5*q*a.z*dt*dt};
      const b=unit.physics.calculateElectricField(next,unit.charges).vector;for(const k of ['x','y','z'])v[k]+=.5*q*(a[k]+b[k])*dt;particle.position=next;
    }
    mesh.position.copy(particle.position);points.push(mesh.position.clone());if(points.length>1000)points.shift();trail.geometry.dispose();trail.geometry=new THREE.BufferGeometry().setFromPoints(points);if(mesh.position.length()>12)particle=null;
  };
  unit.rebuildLearningVisuals();
}

export function initLearningTools(app){
  extendElectrostatics(app.modules[1]);
  const card=document.createElement('aside');card.className='experiment-card interactive-panel';card.innerHTML='<div class="eyebrow">EXPLORA · MIDE · COMPARA</div><h2 id="experiment-title"></h2><p id="experiment-note"></p><details><summary>Experimento sugerido</summary><p id="experiment-task"></p></details><div class="experiment-actions"><button id="export-data">Exportar medición CSV</button><a href="./manual.html" target="_blank" rel="noopener">Manual de uso ↗</a></div><div id="ohm-plot"></div>';document.querySelector('.ui-overlay').append(card);
  const build=app.guiControls.updateUnitControls.bind(app.guiControls);
  app.guiControls.updateUnitControls=(idx,unit,callbacks)=>{
    build(idx,unit,callbacks);
    if(idx===1){
      const gui=app.guiControls.gui,f=gui.addFolder('Líneas y equipotenciales');
      for(const[key,label]of [['showLines','Líneas de campo'],['showContours','Equipotenciales 2D'],['showSurface','Superficie V constante']])f.add(unit.params,key).name(label).onChange(()=>unit.rebuildLearningVisuals());
      f.add(unit.params,'isoPotential',-4,4,.25).name('Nivel V (normalizado)').onFinishChange(()=>unit.rebuildLearningVisuals());
      const t=gui.addFolder('Lanzamiento eléctrico (u. normalizadas)');t.close();
      for(const[k,label]of [['launchX','Posición x'],['launchY','Posición y'],['launchZ','Posición z'],['launchVx','Velocidad x'],['launchVy','Velocidad y'],['launchVz','Velocidad z']])t.add(unit.params,k,-5,5,.1).name(label);
      t.add(unit.params,'particleCharge',-2,2,.5).name('Carga de prueba');t.add(unit,'launchParticle').name('Lanzar partícula');
    }
    document.getElementById('experiment-title').textContent=notes[idx][0];document.getElementById('experiment-note').textContent=notes[idx][1];document.getElementById('experiment-task').textContent=notes[idx][2];
  };
  app.selectUnit(1);
  const update=app.updateTelemetryUI.bind(app);
  app.updateTelemetryUI=()=>{
    update();const plot=document.getElementById('ohm-plot');if(app.activeUnitIndex!==3){plot.innerHTML='';return;}
    const unit=app.modules[3],r=unit.equivalentResistance(),maxI=36/r,x=30+unit.params.voltage/36*230,y=100-(unit.params.switchClosed?unit.params.voltage/r:0)/maxI*80;
    plot.innerHTML=`<svg viewBox="0 0 290 135" role="img" aria-label="Gráfica I frente a V para la resistencia equivalente actual"><path d="M30 15V100H270" fill="none" stroke="#64748b"/><path d="M30 100L260 20" stroke="#0369a1" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="#be123c"/><g fill="#334155" font-size="10"><text x="5" y="12">I (A)</text><text x="4" y="25">${maxI.toFixed(1)}</text><text x="30" y="115">0</text><text x="225" y="115">36 V</text><text x="45" y="132">Pendiente = 1 / R equivalente</text></g></svg>`;
  };
  document.getElementById('export-data').onclick=()=>{
    const rows=[['Versión','1.1.0'],['Unidad',app.activeUnitIndex],['Fecha',new Date().toISOString()],...Object.entries(app.modules[app.activeUnitIndex].getTelemetry()).map(([k,v])=>[METRIC_LABELS[k]||k,v])];
    const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`fisica-unidad-${app.activeUnitIndex}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const modal=document.getElementById('info-modal'),help=document.getElementById('btn-help'),close=document.getElementById('modal-close');help.addEventListener('click',()=>close.focus());close.addEventListener('click',()=>help.focus());
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open')){modal.classList.remove('open');help.focus();}if(e.key==='Tab'&&modal.classList.contains('open')){const items=[...modal.querySelectorAll('button,a[href]')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  const header=document.querySelector('.lab-header');new ResizeObserver(()=>document.documentElement.style.setProperty('--header-bottom',`${header.getBoundingClientRect().bottom+12}px`)).observe(header);
}
