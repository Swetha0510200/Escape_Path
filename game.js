(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('maze'), ctx = canvas.getContext('2d'), mini = $('miniMap'), mctx = mini.getContext('2d');
const TILE = 44, COLS = 25, ROWS = 17; canvas.width=1250; canvas.height=850;
// Each route is deliberately compact but has several turns. Branches are short dead ends.
function buildWideLevel(name,theme,character,line,challenge,seed){
 const W=COLS,H=ROWS,g=Array.from({length:H},()=>Array(W).fill(0));let rnd=seed>>>0;const rand=()=>((rnd=(rnd*1664525+1013904223)>>>0)/4294967296);
 // DFS on a 13x9 logical lattice; each corridor is expanded to comfortable 2-cell-wide walkways.
 const cw=12,ch=8,seen=new Set(),stack=[[0,0]],logical=Array.from({length:ch},()=>Array(cw).fill(0));logical[0][0]=1;
 while(stack.length){const [x,y]=stack[stack.length-1],opts=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<cw&&b<ch&&!logical[b][a]);if(!opts.length){stack.pop();continue;}opts.sort(()=>rand()-.5);const [nx,ny]=opts[0];logical[ny][nx]=1;stack.push([nx,ny]);}
 // Expand lattice nodes and connecting edges, then add loops for alternate routes.
 const carve=(x,y)=>{g[y*2+1][x*2+1]=1;};
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){carve(x,y);if(x<cw-1&&rand()>.20)g[y*2+1][x*2+2]=1;if(y<ch-1&&rand()>.20)g[y*2+2][x*2+1]=1;}
 // Guarantee a winding connected backbone across the map.
 const backbone=[];for(let x=1;x<=23;x++)backbone.push([x,1]);for(let y=2;y<=15;y++)backbone.push([23,y]);for(let x=22;x>=2;x--)backbone.push([x,15]);
 backbone.forEach(([x,y])=>g[y][x]=1);
 // Open selected connectors to produce broad loops and side chambers.
 for(let k=0;k<18;k++){let x=2+Math.floor(rand()*21),y=2+Math.floor(rand()*13);g[y][x]=1;if(g[y][x-1]||g[y][x+1]||g[y-1]?.[x]||g[y+1]?.[x])g[y][x]=1;}
 const route=backbone;const start=[1,3],challengeAt=[7,1],chest=[23,8],exit=[2,15],ghostAt=[12,5],bonusGameAt=[17,13],secondChest=[4,13];
 // connect each landmark to backbone with guaranteed corridors
 const linePath=(a,b)=>{let [x,y]=a;while(x!==b[0]){x+=Math.sign(b[0]-x);g[y][x]=1;}while(y!==b[1]){y+=Math.sign(b[1]-y);g[y][x]=1;}};
 linePath(start,challengeAt);g[2][1]=1;g[1][1]=1;linePath(challengeAt,chest);linePath(chest,exit);linePath(chest,ghostAt);linePath(ghostAt,bonusGameAt);linePath(bonusGameAt,secondChest);linePath(secondChest,exit);
 // side branches / dead-end alcoves, all connected to main corridors
 for(let k=0;k<9;k++){let x=2+Math.floor(rand()*21),y=2+Math.floor(rand()*13),len=2+Math.floor(rand()*3),dx=rand()>.5?1:-1;for(let n=0;n<len;n++){x+=dx;if(x>1&&x<24)g[y][x]=1;}}
 // Level-specific connected side passages, with distinct branch silhouettes.
 const branchBase=3+(seed%11);for(let k=0;k<5;k++){const x=Math.min(21,branchBase+k*2),depth=4+((seed+k*3)%8);for(let y=1;y<=depth;y++)g[y][x]=1;const dir=(k+seed)%2?1:-1;for(let n=1;n<=3;n++){const xx=x+dir*n;if(xx>1&&xx<24)g[depth][xx]=1;}}
 const q=[start],vis=new Set([start.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=nx+','+ny;if(nx>=0&&nx<W&&ny>=0&&ny<H&&g[ny][nx]&&!vis.has(k)){vis.add(k);q.push([nx,ny]);}}}for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]&&!vis.has(x+','+y))g[y][x]=0;const cells=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x])cells.push([x,y]);
 return {name,theme,character,line,challenge,start,challengeAt,chest,exit,ghostAt,bonusGameAt,secondChest,route:cells,branches:[]};
}
const LEVELS=[
 buildWideLevel('FOREST MAZE','forest','👻','BONK THE PRINCIPAL! He has escaped detention and stolen the ghost’s snacks.','bonk',31),
 buildWideLevel('FROZEN MAZE','ice','🐧','YAWN 3 TIMES, then show DOUBLE THUMBS-UP 👍👍 and DOUBLE TWO-FINGERS ✌️✌️ to fool the penguin!','level2Combo',73),
 buildWideLevel('ANCIENT MUMMY MAZE','ruins','🧻','COPY THE MUMMY’S SILLY FACES! It has not blinked since 1024 BC.','face',119)
];
const state={level:0,pos:[1,3],score:0,seconds:0,paused:false,started:false,won:false,keys:[false,false,false],bonusKeys:[false,false,false],doorKey:false,doorHits:0,doorLast:0,doorTarget:null,exitKeys:0,challengeDone:false,chestDone:false,ghostQuizDone:false,bonusGameDone:false,bonusStep:0,bonusGesture:'',bonusSince:0,bonusFaceCount:0,bonusFaceArmed:true,bonusFaceLast:0,bonusSmileSamples:[],bonusSmileBaseline:null,bonusSmileCalibratedAt:0,secondChestDone:false,explored:new Set(),relics:[],camera:false,cameraStarting:false,hand:null,handLandmarks:[],face:null,gesture:'WAITING FOR CAMERA',lastMove:0,stableGesture:'',stableSince:0,lastAccepted:'',heldDirection:null,repeatAt:0,modelsReady:false,handReady:false,faceReady:false,stream:null,handLandmarker:null,faceLandmarker:null,raf:0,challengeActive:false,challengeKind:'',challengeEnd:0,challengeTick:0,snowflakes:[],snowCaught:0,bonkHits:0,bonkTarget:null,bonkLast:0,dodgeItems:[],dodgeHits:0,dodgeLast:0,faceIndex:0,faceStarted:0,faceDeadline:0,level2ComboStage:0,level2Yawns:0,level2YawnArmed:true,level2PoseSince:0,level2LastStageChange:0,memorySeq:[],memoryStep:0,rpsWins:0,rpsRound:0,memoryPoseSince:0,memoryLastPose:'',memoryRetry:0,toastTimer:0,mute:false,modalOpen:false,challengeInterval:null,characterPoints:[],characterDone:new Set(),characterTask:null,characterStep:0,characterSequence:[],characterAnswer:null,characterPunishment:null,characterGestureConsumed:false,characterLastGestureAt:0,characterHoldSince:0,characterArrowSequence:[]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function carveLevel(def){const g=Array.from({length:ROWS},()=>Array(COLS).fill(0));for(const [x,y] of def.route)if(x>=0&&y>=0&&x<COLS&&y<ROWS)g[y][x]=1;return g;}
const maps=LEVELS.map(carveLevel);

// Added character encounters: original chest/key mini-games are intentionally untouched.
const CHARACTER_COUNTS=[12,15,18];
const CHARACTER_TASKS=[
 ['Ghost Copycat','Ghost Says','Don’t Wake the Ghost','Magic Direction','Gesture Memory','Reverse Direction','Rock-Paper-Scissors Signs','Speed Sequence','Funny Question','Hidden Direction','Freeze Challenge','Ghost Final Trick'],
 ['Penguin Copycat','Ice Direction Trap','Catch the Fish','Snowstorm Survival','Frozen Memory','Penguin Says','Ice RPS','Snowball Dodge','Fish Direction Quiz','Double Gesture','Ice Code','Frozen Question','Safe Ice Path','Freeze Challenge','Penguin Final Test'],
 ['Mummy Magic Code','Pharaoh’s Command','Mummy Trap','Pyramid Escape','Treasure Lock','Mummy Copycat','Ancient Memory','Ancient RPS','Secret Direction','Pharaoh Says','Sandstorm Survival','Treasure Hunt','Reverse Code','Ancient Symbol Code','Pyramid Memory','Mummy Question','Bandage Escape','Pharaoh Final Test']
];
const CHAR_EMOJI=['👻','🐧','🧟'];
const GESTURE_SET=['THUMBS UP','POINT RIGHT','FIST','POINT LEFT','OPEN PALM'];
function buildCharacterPoints(){
 const defs=[];
 LEVELS.forEach((d,li)=>{
  const reserved=[d.start,d.challengeAt,d.chest,d.exit,d.ghostAt,d.bonusGameAt,d.secondChest].map(p=>p.join(','));
  const candidates=d.route.filter(p=>!reserved.includes(p.join(',')));
  const count=CHARACTER_COUNTS[li],tasks=[...CHARACTER_TASKS[li]];
  // Spread encounters through the traversable route; never place two characters in one tile.
  const chosen=[];
  for(let i=0;i<count;i++){
   let idx=Math.floor((i+.5)*candidates.length/count),p=candidates[idx];
   if(!p||chosen.some(q=>q.join(',')===p.join(','))){p=candidates.find(q=>!chosen.some(v=>v.join(',')===q.join(',')));}
   if(p)chosen.push(p);
  }
  const shuffled=tasks.map((task,i)=>({task,i})).sort(()=>Math.random()-.5);
  defs.push(chosen.map((p,i)=>({pos:p,task:shuffled[i]?.task||'Gesture Challenge',taskIndex:shuffled[i]?.i??i,id:`${li}-${i}`})));
 });
 return defs;
}
function showCharacterTask(enc){
 if(state.challengeActive||state.characterDone.has(enc.id))return;
 const li=state.level,emoji=CHAR_EMOJI[li],task=enc.task,idx=enc.taskIndex||0;
 state.challengeActive=true;state.challengeKind='characterTask';state.characterTask=enc;state.characterStep=0;
 state.characterGestureConsumed=false;state.characterLastGestureAt=0;state.characterHoldSince=0;
 // Each named activity gets its own gesture pattern and completion rule. Patterns are
 // task-specific (not one generic random sequence) and never repeat the same sign consecutively.
 const patterns=[
  [['THUMBS UP','POINT RIGHT','POINT LEFT'],['OPEN PALM','THUMBS UP','FIST'],['OPEN PALM'],['POINT RIGHT','POINT LEFT'],['THUMBS UP','FIST','POINT RIGHT'],['POINT LEFT','POINT RIGHT'],['THUMBS UP','FIST','POINT LEFT'],['POINT RIGHT','THUMBS UP','FIST','OPEN PALM'],['THUMBS UP'],['POINT LEFT','THUMBS UP'],['OPEN PALM'],['FIST','POINT RIGHT','OPEN PALM','THUMBS UP']],
  [['POINT LEFT','THUMBS UP','POINT RIGHT'],['POINT RIGHT','FIST'],['THUMBS UP','OPEN PALM'],['OPEN PALM','POINT LEFT','OPEN PALM'],['FIST','THUMBS UP','POINT LEFT'],['OPEN PALM','POINT RIGHT','THUMBS UP'],['THUMBS UP','POINT LEFT','FIST'],['POINT RIGHT','OPEN PALM','FIST'],['POINT LEFT'],['THUMBS UP','POINT RIGHT','FIST'],['POINT LEFT','FIST','THUMBS UP'],['OPEN PALM'],['POINT RIGHT','POINT LEFT','THUMBS UP'],['OPEN PALM'],['FIST','POINT LEFT','THUMBS UP','POINT RIGHT']],
  [['FIST','THUMBS UP','POINT RIGHT','POINT LEFT'],['THUMBS UP','OPEN PALM','FIST'],['OPEN PALM','FIST','OPEN PALM'],['POINT RIGHT','THUMBS UP','POINT LEFT'],['FIST','POINT LEFT','THUMBS UP'],['POINT LEFT','FIST','POINT RIGHT'],['THUMBS UP','POINT RIGHT','FIST','OPEN PALM'],['THUMBS UP','FIST','POINT LEFT'],['POINT RIGHT','POINT LEFT','THUMBS UP'],['OPEN PALM','THUMBS UP','FIST'],['OPEN PALM','POINT RIGHT','OPEN PALM'],['THUMBS UP','POINT LEFT','POINT RIGHT'],['POINT LEFT','THUMBS UP','POINT RIGHT'],['FIST','POINT RIGHT','OPEN PALM'],['POINT RIGHT','THUMBS UP','POINT LEFT','FIST'],['THUMBS UP'],['OPEN PALM','FIST','POINT LEFT'],['FIST','POINT RIGHT','THUMBS UP','OPEN PALM']]
 ];
 state.characterSequence=(patterns[li][idx]||['THUMBS UP','POINT RIGHT','FIST']).slice();
 // Reverse Direction is a real two-round arrow game: show an arrow, then require
 // the opposite webcam point. Do not reuse the generic memorized-sign sequence.
 if(task==='Reverse Direction'||task==='Reverse Code'){
  const arrows=['LEFT','RIGHT'];
  state.characterArrowSequence=Array.from({length:2},()=>arrows[Math.floor(Math.random()*arrows.length)]);
  state.characterSequence=state.characterArrowSequence.map(a=>a==='LEFT'?'POINT RIGHT':'POINT LEFT');
 }else state.characterArrowSequence=[];
 const question=task.toLowerCase().includes('question')||task.toLowerCase().includes('quiz');
 state.characterAnswer=question?state.characterSequence[0]:null;
 const punish=['👻 Boo! The ghost jumps out and laughs — spooky retry!','🐧 Slip! The penguin throws a snowball — thaw and retry!','🧟 Bandage attack! The mummy laughs — shake it off and retry!'];
 state.characterPunishment=punish[li];
 const instructions={
  'Ghost Copycat':'Copy the ghost’s 3-sign pattern in order.','Ghost Says':'Only follow the displayed Ghost Says hand-sign pattern; ignore the other signs in the instructions.' ,
  'Don’t Wake the Ghost':'Hold OPEN PALM steadily for 5 seconds.','Magic Direction':'Point right, then point left.','Gesture Memory':'Memorise the shown signs and repeat them in order.',
  'Reverse Direction':'Show the opposite direction from the arrow.','Rock-Paper-Scissors Signs':'Play the displayed sign pattern to beat the ghost.',
  'Speed Sequence':'Complete the signs in order before the timer runs out.','Funny Question':'Funny quiz: choose the correct answer using its matching hand sign.',
  'Hidden Direction':'Find the direction in the sequence and point it correctly.','Freeze Challenge':'Hold OPEN PALM steadily for 5 seconds.','Ghost Final Trick':'Complete the longer final sign pattern.',
  'Catch the Fish':'Use the signs to catch the penguin’s fish.','Snowstorm Survival':'Follow the ice signs without breaking the sequence.',
  'Snowball Dodge':'Show the dodge sequence to escape the snowball.','Safe Ice Path':'Repeat the safe-path direction code.',
  'Bandage Escape':'Follow the signs to unwrap the mummy’s bandages.',
  'Ice Direction Trap':'Copy the ice arrows in order: left, up, right.', 'Catch the Fish':'Show the two displayed signs to catch the fish.',
  'Snowstorm Survival':'Hold STOP, then show LEFT and RIGHT to survive the snowstorm.', 'Frozen Memory':'Memorise and repeat the four-sign ice code.',
  'Penguin Says':'Follow the three signs labelled PENGUIN SAYS in order.', 'Ice RPS':'Beat the penguin by copying the displayed rock-paper-scissors sign sequence.',
  'Fish Direction Quiz':'Point in the direction shown by the fish arrow.', 'Double Gesture':'Show the two displayed gestures in the correct order.', 'Ice Code':'Decode and repeat the three-sign ice code.',
  'Frozen Question':'Choose the funny answer by showing its matching hand gesture.', 'Penguin Final Test':'Complete the four-sign final penguin code.',
  'Mummy Magic Code':'Repeat the four ancient signs in order.', 'Pharaoh’s Command':'Obey the Pharaoh’s three displayed gestures.', 'Mummy Trap':'Show STOP, DOWN, then STOP to escape the trap.',
  'Pyramid Escape':'Follow the pyramid route: right, up, left.', 'Treasure Lock':'Enter the three-sign treasure code.', 'Mummy Copycat':'Copy the mummy’s three gestures exactly.',
  'Ancient Memory':'Remember and repeat the four ancient signs.', 'Ancient RPS':'Copy the displayed rock-paper-scissors sign sequence.', 'Secret Direction':'Point left, then right, then up.',
  'Pharaoh Says':'Follow the three signs marked PHARAOH SAYS.', 'Sandstorm Survival':'Show STOP, RIGHT, then STOP to survive the sandstorm.', 'Treasure Hunt':'Follow the direction clues in order.',
  'Reverse Code':'Show the opposite direction signs in order.', 'Ancient Symbol Code':'Translate and repeat the three-sign symbol code.', 'Pyramid Memory':'Remember and repeat the four pyramid signs.',
  'Mummy Question':'Choose the funny answer with its matching hand gesture.', 'Pharaoh Final Test':'Complete the four-sign Pharaoh final test.'
 };
 const instruction=instructions[task]||`Complete ${task} by showing each hand sign in order.`;
 const symbols={'THUMBS UP':'👍 UP','POINT RIGHT':'👉 RIGHT','FIST':'✊ DOWN','POINT LEFT':'👈 LEFT','OPEN PALM':'🖐️ STOP'};
 const funnyQuestions=[
  'A ghost forgot its homework. Which sign sends it flying?', 'The principal turned into a potato. What sign should we show?',
  'A tiny ghost wants to moonwalk. Which sign starts the dance?', 'The haunted bell is ringing backwards. Which sign fixes it?',
  'A penguin ordered pizza but got fish. Which sign shows its mood?', 'The ice cream is melting! Which sign calls for help?',
  'A snowman wants to join the school band. Which sign is its audition?', 'The penguin lost its favourite sock. Which sign finds it?',
  'A mummy sneezed and lost a bandage. Which sign helps?', 'The pyramid door is sleepy. Which sign wakes it up?',
  'The Pharaoh wants a silly salute. Which sign do you choose?', 'A treasure chest is telling jokes. Which sign says stop?'
 ];
 const questionIndex=(Math.max(0,enc.taskIndex||0)+li*4+(parseInt(String(enc.id).split('-')[1])||0))%funnyQuestions.length;
 const shown=question?`<div class="emoji-target">🤔</div><div class="challenge-instruction">${funnyQuestions[questionIndex]}</div><div class="symbol-mapping">${GESTURE_SET.map(g=>`<span>${symbols[g]}</span>`).join('')}</div><div class="snow-count" id="characterProgress">Choose 1 gesture</div><div class="hint-text">Pick one of the five signs with your webcam hand. No clicking.</div>`:
 task==='Reverse Direction'||task==='Reverse Code' ? `<div class="emoji-target">${emoji}</div><div class="snow-count" id="characterProgress">0 / 2</div><div class="challenge-instruction">${instruction}<br>Arrow: <strong id="reverseArrow">${state.characterArrowSequence[0]==='LEFT'?'⬅️ LEFT':'➡️ RIGHT'}</strong></div><div class="symbol-mapping"><span>👈 LEFT</span><span>👉 RIGHT</span></div><div class="hint-text">Point the OPPOSITE way with your index finger. Keep your hand visible.</div><div class="challenge-progress"><i id="characterProgressBar"></i></div>`:
 `<div class="emoji-target">${emoji}</div><div class="snow-count" id="characterProgress">0 / ${state.characterSequence.length}</div><div class="challenge-instruction">${instruction}</div><div class="symbol-sequence">${state.characterSequence.map(g=>`<span class="symbol-chip">${symbols[g]}</span>`).join('')}</div><div class="hint-text">👍 UP · 👉 RIGHT · ✊ DOWN · 👈 LEFT · 🖐️ STOP</div><div class="challenge-progress"><i id="characterProgressBar"></i></div>`;
 $('challenge').hidden=false;$('challengeCharacter').textContent=emoji;
 $('challengeTitle').textContent=task.toUpperCase();
 $('challengeDialogue').textContent=`${emoji} ${task}! ${li===0?'Forest test':li===1?'Ice test':'Ancient test'} — webcam hand gestures only.`;
 $('challengeBody').innerHTML=shown;
 $('challengeTimer').textContent=task.includes('Speed')?'10s':'GESTURE TASK';$('challengeFeedback').textContent='Show one clear gesture and hold briefly. After it registers, change pose for the NEXT sign; your progress is saved if you make a mistake.';
}
function handleCharacterGesture(g){
 const enc=state.characterTask;if(!enc)return;
 const question=enc.task.toLowerCase().includes('question')||enc.task.toLowerCase().includes('quiz');
 if(question){
  if(g===state.characterAnswer){completeCharacterTask();}else if(GESTURE_SET.includes(g)){characterFail();}
  return;
 }
 const expected=state.characterSequence[state.characterStep];
 if(g===expected){
  state.characterStep++;const p=$('characterProgress');if(p)p.textContent=`${state.characterStep} / ${state.characterSequence.length} complete`;
  const bar=$('characterProgressBar');if(bar)bar.style.width=(state.characterStep/state.characterSequence.length*100)+'%';
  if(state.characterStep>=state.characterSequence.length){completeCharacterTask();return;}
  const labels={'THUMBS UP':'👍 UP','POINT RIGHT':'👉 RIGHT','FIST':'✊ DOWN','POINT LEFT':'👈 LEFT','OPEN PALM':'🖐️ STOP'};
  if(state.characterArrowSequence?.length){const arrow=state.characterArrowSequence[state.characterStep];const el=$('reverseArrow');if(el)el.textContent=arrow==='LEFT'?'⬅️ LEFT':'➡️ RIGHT';$('challengeFeedback').textContent=`Correct! Now show the opposite of ${arrow}.`;}
  else $('challengeFeedback').textContent=`Correct! Next: ${labels[state.characterSequence[state.characterStep]]}. Change your hand pose.`;
 }else if(GESTURE_SET.includes(g)){
  const labels={'THUMBS UP':'👍 UP','POINT RIGHT':'👉 RIGHT','FIST':'✊ DOWN','POINT LEFT':'👈 LEFT','OPEN PALM':'🖐️ STOP'};
  $('challengeFeedback').textContent=`Not that one — show ${labels[expected]}. Your progress is saved.`;
  playTone(240,.07);
 }
}
function completeCharacterTask(){
 const enc=state.characterTask;state.characterDone.add(enc.id);state.challengeActive=false;state.challengeKind='';state.characterTask=null;$('challenge').hidden=true;state.score+=20;playTone(880,.2);notify('🎉 Character challenge completed! Nice hand control!');journal('You passed a character surprise challenge.','Continue exploring and collect both level keys.');updateUI();draw();
}
function characterFail(){
 $('challengeFeedback').textContent=state.characterPunishment;
 const body=document.body;if(body){const cls=['punish-forest','punish-ice','punish-ruins'][state.level];body.classList.remove('punish-forest','punish-ice','punish-ruins');body.classList.add(cls);setTimeout(()=>body.classList.remove(cls),650);}
 notify(state.characterPunishment+' Try the gesture task again!');
 state.characterStep=0;const p=$('characterProgress');if(p)p.textContent=`0 / ${state.characterSequence.length}`;const bar=$('characterProgressBar');if(bar)bar.style.width='0%';
}
function drawCharacterMarkers(){
 const pts=state.characterPoints[state.level]||[],cw=canvas.width/COLS,ch=canvas.height/ROWS;
 pts.forEach(enc=>{if(state.characterDone.has(enc.id))return;const [x,y]=enc.pos,px=(x+.5)*cw,py=(y+.5)*ch;
  ctx.save();const glow=THEME[levelDef().theme].glow;const pulse=1+Math.sin(Date.now()/240+enc.id.length)*.08;ctx.globalAlpha=.98;ctx.fillStyle=glow+'22';ctx.beginPath();ctx.arc(px,py,20*pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle=glow;ctx.lineWidth=2.5;ctx.shadowColor=glow;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(px,py,17*pulse,0,Math.PI*2);ctx.stroke();ctx.font='bold 32px "Segoe UI Emoji"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#071016';ctx.strokeText(CHAR_EMOJI[state.level],px,py);ctx.fillText(CHAR_EMOJI[state.level],px,py);ctx.restore();
 });
}

function isOpen(x,y){return !!(maps[state.level]?.[y]?.[x]);}
function keyPos(p){return `${p[0]},${p[1]}`;}
function addExplored(){state.explored.add(`${state.level}:${state.pos[0]},${state.pos[1]}`);}
function exploredPercent(){let total=0;maps.forEach((g)=>g.forEach(r=>r.forEach(c=>{if(c)total++})));return Math.round(state.explored.size/total*100);}
let audioContext=null;function playTone(freq=660,duration=.12){if(state.mute)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.value=freq;gain.gain.setValueAtTime(.045,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch(_){}}
function notify(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2100);}
function journal(msg,obj){$('journalText').textContent=msg;$('journalObjective').textContent='OBJECTIVE: '+obj.toUpperCase();$('objective').textContent=obj;}
function setStatus(s){$('gameStatus').textContent=s;}
function levelDef(){return LEVELS[state.level];}
const THEME={
 forest:{bg:'#06140d',void:'#030a07',tile:'#103b26',tileSeen:'#185536',edge:'#286b42',glow:'#36ed91',accent:'#b8ffd0',dust:'rgba(92,255,153,.18)'},
 ice:{bg:'#06172a',void:'#020b18',tile:'#123d59',tileSeen:'#1c5b7a',edge:'#4aa6cf',glow:'#70dfff',accent:'#e4f8ff',dust:'rgba(173,232,255,.48)'},
 ruins:{bg:'#1a1008',void:'#0b0704',tile:'#594020',tileSeen:'#805b2e',edge:'#b88743',glow:'#ffc45e',accent:'#ffe2a0',dust:'rgba(255,202,117,.22)'}
};
function draw(){
 const d=levelDef(),t=THEME[d.theme]||THEME.forest,now=Date.now();
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle=t.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
 const cellW=canvas.width/COLS,cellH=canvas.height/ROWS,ox=cellW*.5,oy=cellH*.5;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const px=x*cellW,py=y*cellH,seen=state.explored.has(`${state.level}:${x},${y}`)||Math.abs(x-state.pos[0])+Math.abs(y-state.pos[1])<=2;
  if(maps[state.level][y][x]){
   ctx.fillStyle=seen?t.tileSeen:t.tile;ctx.fillRect(px+1,py+1,cellW-2,cellH-2);
   ctx.strokeStyle=seen?t.edge:t.edge+'66';ctx.lineWidth=1.2;ctx.strokeRect(px+2,py+2,cellW-4,cellH-4);
   if(seen){ctx.save();ctx.globalAlpha=.10;ctx.fillStyle=t.glow;ctx.fillRect(px+4,py+4,cellW-8,cellH-8);ctx.restore();}
  }else{ctx.fillStyle=t.void;ctx.fillRect(px,py,cellW,cellH);}
 }
 // Level atmosphere: forest fireflies, continuous falling snow, or drifting desert sand.
 for(let i=0;i<64;i++){
  const x=(i*193+Math.sin(now/1700+i)*22+canvas.width)%canvas.width;
  const speed=d.theme==='ice'?((i%5)+1)*.42:d.theme==='ruins'?((i%4)+1)*.22:((i%3)+1)*.16;
  const y=(i*127+now*speed/12)%canvas.height;
  ctx.fillStyle=t.dust;if(d.theme==='ice'){const r=2.2+(i%3)*.7;ctx.lineWidth=1.3;ctx.strokeStyle=t.dust;ctx.beginPath();ctx.moveTo(x-r*2,y);ctx.lineTo(x+r*2,y);ctx.moveTo(x,y-r*2);ctx.lineTo(x,y+r*2);ctx.moveTo(x-r*1.4,y-r*1.4);ctx.lineTo(x+r*1.4,y+r*1.4);ctx.moveTo(x-r*1.4,y+r*1.4);ctx.lineTo(x+r*1.4,y-r*1.4);ctx.stroke();}else{ctx.beginPath();ctx.arc(x,y,d.theme==='ruins'?1.8+(i%3):1.5+(i%2),0,Math.PI*2);ctx.fill();}
 }
 // Scenic edge silhouettes reinforce the selected world without covering the maze.
 ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=t.glow;
 if(d.theme==='forest'){
  for(let i=0;i<9;i++){const x=i*155+28;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-25,42);ctx.lineTo(x-9,42);ctx.lineTo(x-34,72);ctx.lineTo(x+34,72);ctx.lineTo(x+9,42);ctx.lineTo(x+25,42);ctx.closePath();ctx.fill();}
 }else if(d.theme==='ice'){
  for(let i=0;i<22;i++){const x=(i*71+19)%canvas.width,y=(i*113+now*.035)%canvas.height;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+3,y-2);ctx.lineTo(x+8,y);ctx.lineTo(x+3,y+2);ctx.lineTo(x,y+8);ctx.lineTo(x-3,y+2);ctx.lineTo(x-8,y);ctx.lineTo(x-3,y-2);ctx.closePath();ctx.fill();}
 }else{
  for(let i=0;i<5;i++){const x=i*285+35;ctx.beginPath();ctx.moveTo(x,75);ctx.lineTo(x+62,12);ctx.lineTo(x+124,75);ctx.closePath();ctx.fill();}
 }
 ctx.restore();
 const marker=(p,emoji,color)=>{const x=p[0]*cellW+ox,y=p[1]*cellH+oy;ctx.save();ctx.shadowColor=color;ctx.shadowBlur=24;ctx.fillStyle='#03121b';ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();ctx.shadowBlur=18;ctx.font='bold 29px "Segoe UI Emoji","Apple Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(emoji,x,y+1);ctx.restore();};
 const mascot=(p)=>{const x=p[0]*cellW+ox,y=p[1]*cellH+oy;ctx.save();ctx.shadowColor=t.glow;ctx.shadowBlur=26;ctx.fillStyle='#06131b';ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle=t.accent;ctx.lineWidth=2.5;ctx.stroke();ctx.shadowBlur=14;
  if(d.theme==='ice'){ctx.fillStyle='#111b2a';ctx.beginPath();ctx.ellipse(x,y+1,12,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f5fbff';ctx.beginPath();ctx.ellipse(x,y+4,8,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffb52e';ctx.beginPath();ctx.moveTo(x-3,y-2);ctx.lineTo(x+7,y+1);ctx.lineTo(x-3,y+4);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-4,y-7,2,0,Math.PI*2);ctx.arc(x+4,y-7,2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffad27';ctx.fillRect(x-8,y+14,6,3);ctx.fillRect(x+2,y+14,6,3);}
  else if(d.theme==='ruins'){ctx.fillStyle='#e8c68a';ctx.beginPath();ctx.roundRect(x-10,y-15,20,30,7);ctx.fill();ctx.strokeStyle='#9c713b';ctx.lineWidth=3;for(let yy=y-9;yy<=y+10;yy+=7){ctx.beginPath();ctx.moveTo(x-9,yy);ctx.lineTo(x+9,yy+3);ctx.stroke();}ctx.fillStyle='#21170e';ctx.fillRect(x-6,y-6,4,3);ctx.fillRect(x+2,y-6,4,3);ctx.fillStyle='#e8c68a';ctx.fillRect(x-13,y-2,4,13);ctx.fillRect(x+9,y-2,4,13);}
  else{
   // Cute luminous cartoon ghost: rounded dome, scalloped hem, expressive eyes and smile.
   const bob=Math.sin(now/260)*1.4;ctx.translate(x,y+bob);
   ctx.shadowColor='#8dfff0';ctx.shadowBlur=22;
   ctx.fillStyle='#f5ffff';ctx.beginPath();ctx.moveTo(-13,13);ctx.lineTo(-13,-2);ctx.quadraticCurveTo(-13,-17,0,-17);ctx.quadraticCurveTo(13,-17,13,-2);ctx.lineTo(13,11);ctx.quadraticCurveTo(9,7,6,12);ctx.quadraticCurveTo(2,17,-2,12);ctx.quadraticCurveTo(-7,7,-10,13);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#a5fff4';ctx.lineWidth=1.5;ctx.stroke();
   ctx.shadowBlur=0;ctx.fillStyle='#17405a';ctx.beginPath();ctx.ellipse(-4.5,-3,2.1,3.2,-.12,0,Math.PI*2);ctx.ellipse(4.5,-3,2.1,3.2,.12,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-5,-4,0.8,0,Math.PI*2);ctx.arc(4,-4,.8,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#438f9a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,2,3.4,.15,Math.PI-.15);ctx.stroke();
   ctx.fillStyle='rgba(255,145,177,.55)';ctx.beginPath();ctx.ellipse(-8,3,2.3,1.2,0,0,Math.PI*2);ctx.ellipse(8,3,2.3,1.2,0,0,Math.PI*2);ctx.fill();
   ctx.restore();return;
  }
  ctx.restore();};
 const scenery=()=>{
  if(d.theme==='forest'){
   // A deterministic, spaced forest border. Trees occupy wall cells only and never
   // cover walkable corridors or any gameplay landmark/player position.
   const reserved=[d.challengeAt,d.chest,d.exit,d.ghostAt,d.bonusGameAt,d.secondChest,state.pos];
   const occupied=new Set(reserved.map(([x,y])=>`${x},${y}`));
   ctx.save();
   for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(maps[state.level][y][x]||occupied.has(`${x},${y}`))continue;
    const edge=x===0||y===0||x===COLS-1||y===ROWS-1;
    const decorative=edge||((x%4===0)&&(y%3===0));
    if(!decorative)continue;
    // Keep clear gaps between trunks for a deliberate, uncluttered rhythm.
    if((x%2)!==0&&y!==0&&y!==ROWS-1)continue;
    const px=x*cellW+cellW/2,py=y*cellH+cellH/2,s=.72+((x*7+y*3)%4)*.07;
    ctx.globalAlpha=edge?.96:.72;
    ctx.fillStyle='#543b25';ctx.fillRect(px-3*s,py+7*s,6*s,10*s);
    ctx.fillStyle='#12472c';ctx.beginPath();ctx.moveTo(px,py-22*s);ctx.lineTo(px-18*s,py+8*s);ctx.lineTo(px+18*s,py+8*s);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1b7540';ctx.beginPath();ctx.moveTo(px,py-15*s);ctx.lineTo(px-14*s,py+2*s);ctx.lineTo(px+14*s,py+2*s);ctx.closePath();ctx.fill();
    ctx.fillStyle='#39b96b';ctx.globalAlpha*=.8;ctx.beginPath();ctx.moveTo(px,py-9*s);ctx.lineTo(px-8*s,py-1*s);ctx.lineTo(px+8*s,py-1*s);ctx.closePath();ctx.fill();
   }
   ctx.restore();return;
  }
  ctx.save();ctx.globalAlpha=.9;for(let i=0;i<8;i++){const x=18+i*cellW*3.25,y=(i%2?canvas.height-20:20);if(d.theme==='ice'){ctx.fillStyle='#a8eaff';ctx.beginPath();ctx.moveTo(x,y-17);ctx.lineTo(x-5,y+7);ctx.lineTo(x+6,y+7);ctx.closePath();ctx.fill();}else{ctx.fillStyle='#b98543';ctx.beginPath();ctx.moveTo(x-18,y+9);ctx.lineTo(x,y-20);ctx.lineTo(x+18,y+9);ctx.closePath();ctx.fill();ctx.strokeStyle='#f6c36c';ctx.lineWidth=2;ctx.stroke();}}ctx.restore();
 };
 scenery();drawCharacterMarkers();marker(d.challengeAt,d.challengeDone?'✅':'✦',t.glow);marker(d.chest,state.chestDone?'📦':'🧰','#ffc45e');mascot(d.ghostAt);
 marker(d.bonusGameAt,state.bonusGameDone?'🎉':'🎮',t.glow);marker(d.secondChest,state.secondChestDone?'📦':'🔒','#ffc45e');marker(d.exit,(state.exitKeys>state.level&&(state.level<2||state.doorKey))?'🚪':'🔒','#ffc45e');
 ctx.save();ctx.shadowColor=t.glow;ctx.shadowBlur=24;ctx.fillStyle=t.accent;ctx.beginPath();ctx.arc(state.pos[0]*cellW+ox,state.pos[1]*cellH+oy,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle=t.glow;ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.pos[0]*cellW+ox,state.pos[1]*cellH+oy,14+Math.sin(now/150)*2,0,Math.PI*2);ctx.stroke();ctx.restore();
 drawMini();
}
function drawMini(){const t=THEME[levelDef().theme]||THEME.forest;mctx.clearRect(0,0,mini.width,mini.height);mctx.fillStyle=t.void;mctx.fillRect(0,0,mini.width,mini.height);const cw=mini.width/COLS,ch=mini.height/ROWS;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){if(maps[state.level][y][x]&&state.explored.has(`${state.level}:${x},${y}`)){mctx.fillStyle=t.edge;mctx.fillRect(x*cw+1,y*ch+1,cw-2,ch-2);}}const d=levelDef();mctx.fillStyle=t.glow;mctx.fillRect(d.exit[0]*cw+1,d.exit[1]*ch+1,cw-2,ch-2);mctx.fillStyle=t.accent;mctx.beginPath();mctx.arc((state.pos[0]+.5)*cw,(state.pos[1]+.5)*ch,4,0,Math.PI*2);mctx.fill();}
function updateUI(){ if(document.body)document.body.dataset.theme=levelDef().theme; $('timer').textContent=`${String(Math.floor(state.seconds/60)).padStart(2,'0')}:${String(Math.floor(state.seconds%60)).padStart(2,'0')}`;$('score').textContent=String(state.score).padStart(4,'0');$('explored').textContent=exploredPercent()+'%';$('levelName').textContent=`LEVEL 0${state.level+1} / ${levelDef().name}`;const totalKeys=state.keys.filter(Boolean).length+state.bonusKeys.filter(Boolean).length+(state.doorKey?1:0);$('keyCount').textContent=totalKeys+' / 7';$('progressBar').style.width=(totalKeys/7*100)+'%';$('progressLabel').textContent=state.doorKey?'All level keys and master key collected':'Collect two keys in each level, then the master key';$('relicCount').textContent=state.relics.length;$('relics').innerHTML=state.relics.length?state.relics.map(x=>`<span>${x}</span>`).join(' · '):'<span class="muted">Nothing shiny. Yet.</span>';$('keyList').innerHTML=['🌲 Forest Key','👻 Forest Door Key','❄️ Frozen Key','🐧 Frozen Door Key','🏺 Ancient Key','🧟 Ancient Door Key','🗝️ Principal’s Master Key'].map((v,i)=>{const got=i===6?state.doorKey:(i%2===0?state.keys[Math.floor(i/2)]:state.bonusKeys[Math.floor(i/2)]);return `<div class="key-item ${got?'unlocked':'locked'}">${v.split(' ')[0]} <span>${v.slice(3)}</span><i>${got?'ACQUIRED':'LOCKED'}</i></div>`;}).join('');drawMini();}

// Three genuinely different original soundtrack files (not the same synth loop).
// Each level has its own arrangement and loops at a strong but non-distorting volume.
let levelAudio=null;
const LEVEL_TRACKS=[
 {name:'Haunted Forest',src:'audio/forest_haunting.wav',volume:0.88},
 {name:'Frozen Snow World',src:'audio/snow_crystal.wav',volume:0.86},
 {name:'Ancient Mummy Desert',src:'audio/desert_ancient.wav',volume:0.90}
];
function stopLevelMusic(){if(levelAudio){levelAudio.pause();levelAudio.currentTime=0;levelAudio=null;}}
function startLevelMusic(){
 const track=LEVEL_TRACKS[state.level]||LEVEL_TRACKS[0];
 if(state.mute||!state.started||state.paused){if(levelAudio)levelAudio.pause();return;}
 if(levelAudio && levelAudio.dataset.track===track.src){levelAudio.volume=track.volume;levelAudio.play().catch(()=>{});return;}
 stopLevelMusic();
 try{levelAudio=new Audio(track.src);levelAudio.dataset.track=track.src;levelAudio.loop=true;levelAudio.volume=track.volume;levelAudio.preload='auto';levelAudio.play().catch(e=>console.warn('Music playback requires a user interaction',e));}catch(e){console.warn('Music unavailable',e);}
}
function unlockGameAudio(){if(state.started&&!state.mute&&!state.paused)startLevelMusic();}
document.addEventListener('pointerdown',unlockGameAudio,{passive:true});document.addEventListener('keydown',unlockGameAudio);

function startGame(){if(state.started)return;state.started=true;state.characterPoints=buildCharacterPoints();startLevelMusic();$('startCard').hidden=true;setStatus('EXPLORING');journal('A suspiciously mossy maze. The ghost is guarding a challenge marker.','Find the ghost, then the separate mini-game marker.');addExplored();lastFrame=performance.now();requestAnimationFrame(loop);}
function move(dir){if(!state.started||state.paused||state.won||state.challengeActive)return;const now=performance.now();if(now-state.lastMove<150)return;let [x,y]=state.pos;({up:()=>y--,down:()=>y++,left:()=>x--,right:()=>x++}[dir]||(()=>{}))();if(!isOpen(x,y)){if(Math.random()<.32)notify(['Wrong way! Your GPS is powered by a potato.','That wall has a better attendance record than you.','The maze says: skill issue. 😭'][Math.floor(Math.random()*3)]);return;}state.pos=[x,y];state.lastMove=now;playTone(220,.045);addExplored();state.score+=2;const d=levelDef();const encounter=(state.characterPoints[state.level]||[]).find(e=>e.pos[0]===x&&e.pos[1]===y&&!state.characterDone.has(e.id));if(encounter)showCharacterTask(encounter);if(x===d.challengeAt[0]&&y===d.challengeAt[1]&&!state.challengeDone)beginChallenge();if(x===d.chest[0]&&y===d.chest[1])openChest();if(x===d.ghostAt[0]&&y===d.ghostAt[1])notify('👻 Friendly ghost: “I only haunt homework. The game is at 🎮!”');if(x===d.bonusGameAt[0]&&y===d.bonusGameAt[1]&&!state.bonusGameDone)beginBonusGame();if(x===d.secondChest[0]&&y===d.secondChest[1])openSecondChest();if(x===d.exit[0]&&y===d.exit[1])reachExit();updateUI();draw();}
function interact(){const d=levelDef();if(state.pos[0]===d.challengeAt[0]&&state.pos[1]===d.challengeAt[1]&&!state.challengeDone)beginChallenge();else if(state.pos[0]===d.chest[0]&&state.pos[1]===d.chest[1])openChest();else if(state.pos[0]===d.ghostAt[0]&&state.pos[1]===d.ghostAt[1])notify('👻 Friendly ghost: “No riddles here! Find the separate 🎮 game marker.”');else if(state.pos[0]===d.bonusGameAt[0]&&state.pos[1]===d.bonusGameAt[1])beginBonusGame();else if(state.pos[0]===d.secondChest[0]&&state.pos[1]===d.secondChest[1])openSecondChest();else if(state.pos[0]===d.exit[0]&&state.pos[1]===d.exit[1])reachExit();else notify('Nothing here. Try the glowing markers.');}
function openChest(){if(state.chestDone)return;if(!state.challengeDone){notify('The chest says: Password incorrect. Try asking nicely.');return;}state.chestDone=true;state.keys[state.level]=true;state.score+=50;state.relics.push(['🌿 Mossy detention slip','🐧 Penguin hall pass','🏺 Ancient homework excuse'][state.level]);notify('FIRST CHEST OPEN! First level key acquired.');journal('The chest creaks open. It contains your first level key and a deeply expired hall pass.','Find the separate 🎮 mini-game. Win it, then open the second locked chest for the door key.');updateUI();draw();}
function beginGhostQuiz(){notify('👻 I am just a friendly guide. Find the separate 🎮 marker for the key game!');}
function beginBonusGame(){
 if(state.challengeActive||state.bonusGameDone)return;
 state.challengeActive=true;state.bonusStep=0;state.bonusFaceCount=0;state.bonusFaceArmed=true;state.bonusFaceLast=0;state.bonusSmileSamples=[];state.bonusSmileBaseline=null;state.bonusSmileCalibratedAt=performance.now();state.expressionSamples=[];state.expressionBaseline=null;state.expressionNeutralSince=0;state.expressionPoseSince=0;state.blinkClosedSince=0;state.blinkWasClosed=false;state.blinkOpenSamples=[];state.blinkCalibrationStarted=performance.now();state.blinkOpenBaseline=null;
 const games=[
  {kind:'bonusBlink',title:'BLINK-O-METER 😂',character:'👀',goal:6,instruction:'Blink your eyes 6 times. Close your eyes briefly, then open them again. The counter goes up once per blink.',hint:'A dramatic blink is worth one point.'},
  {kind:'bonusPose',title:'TURN & ROTATE CHALLENGE',character:'🧍',goal:3,instruction:'Follow the movement commands: turn your head left, turn your head right, then rotate/tilt your head sideways. Hold each movement briefly.',hint:'Use the camera so the game can track your face direction. A confirmation button is available if tracking misses.'},
  {kind:'bonusRps',title:'ROCK PAPER SCISSORS — RACE TO 5! ✊✋✌️',character:'🧟',goal:5,instruction:'Beat the mummy to 5 points! A win earns 1 point; a draw earns no points. Tap a move or show the matching hand pose.',hint:'Rock beats Scissors, Paper beats Rock, Scissors beats Paper.'}
 ];
 const game=games[state.level];state.challengeKind=game.kind;
 $('challenge').hidden=false;$('challengeCharacter').textContent=game.character;$('challengeTitle').textContent=game.title;
 $('challengeDialogue').textContent='The ghost is cheering from the sidelines. This mini-game—not the mascot—earns your second key!';
 if(state.level===1){
  $('challengeBody').innerHTML=`<div class="emoji-target" id="bonusFaceEmoji">←</div><div class="snow-count" id="bonusFaceProgress">0 / 3 movements</div><div class="challenge-instruction" id="poseInstruction">Movement 1 of 3: TURN LEFT</div><div class="hint-text" id="bonusFaceHint">Turn your head to your left and hold briefly. Then turn right, then rotate/tilt your head sideways.</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0"><button type="button" id="confirmPoseBtn" style="padding:10px 14px;border-radius:10px;border:1px solid #70d6ff;background:#123047;color:white;font-weight:700;cursor:pointer">I did this movement ✓</button></div><div class="challenge-progress"><i id="bonusFaceBar"></i></div>`;
 }else{
  $('challengeBody').innerHTML=`<div class="emoji-target" id="bonusFaceEmoji">${game.character}</div><div class="snow-count" id="bonusFaceProgress">0 / ${game.goal}</div><div class="challenge-instruction">${game.instruction}</div><div class="hint-text" id="bonusFaceHint">${game.hint}</div><div class="challenge-progress"><i id="bonusFaceBar"></i></div>`;
 }
 if(game.kind==='bonusPose'){const confirm=$('confirmPoseBtn');if(confirm)confirm.addEventListener('click',()=>advancePoseChallenge(true));}
 if(game.kind==='bonusRps'){
  state.rpsWins=0;state.rpsRound=0;state.rpsTies=0;state.memoryPoseSince=0;state.memoryLastPose='';
  $('challengeBody').innerHTML='<div class="symbol-mapping"><span>✊ FIST = ROCK</span><span>🖐️ OPEN PALM = PAPER</span><span>✌️ PEACE = SCISSORS</span></div><div class="emoji-target" id="rpsOpponent">🧟</div><div class="snow-count" id="rpsScore">You: 0 / 5 · Mummy: 0 / 5</div><div class="challenge-instruction" id="memoryInstruction">First to 5 points wins! A draw gives no points. Use the camera pose OR tap a move below.</div><div class="rps-buttons" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0"><button type="button" data-rps="ROCK">✊ Rock</button><button type="button" data-rps="PAPER">🖐️ Paper</button><button type="button" data-rps="SCISSORS">✌️ Scissors</button></div><div class="challenge-progress"><i id="memoryProgress"></i></div>';
  document.querySelectorAll('[data-rps]').forEach(btn=>btn.addEventListener('click',()=>playRpsMove(btn.dataset.rps)));
 }
 $('challengeTimer').textContent=game.kind==='bonusBlink'?'15s':game.kind==='bonusPose'?'30s':game.kind==='bonusRps'?'90s':'∞';
 $('challengeFeedback').textContent=game.kind==='bonusPose'?(state.faceReady?'Face tracking ready':'Start camera and show your face'):game.kind==='bonusRps'?(state.handReady?'Tap a move or show a hand pose':'Tap a move or start camera'):(state.faceReady?'Face tracking ready':'Start camera and keep your face visible');
 if(game.kind==='bonusBlink')challengeCountdown(15,()=>{},()=>endBonusGameFail('Time is up! Try the blink challenge again.'));
 if(game.kind==='bonusPose')challengeCountdown(30,()=>{},()=>endBonusGameFail('Movement time is up! Return to the marker and try again.'));
 if(game.kind==='bonusRps')challengeCountdown(90,()=>{},()=>endBonusGameFail('Time is up! The mummy wins this round. Try again!'));
}

function renderSnowballAttack(){
 const grid=$('snowballGrid');if(!grid||typeof grid.appendChild!=='function')return;grid.innerHTML='';
 const target=(state.bonusFaceCount*5+2)%9;
 for(let i=0;i<9;i++){
  const b=document.createElement('button');b.type='button';const isTarget=i===target;b.textContent=isTarget?'👻':['🐧','🦆','❄️','🐧','⛄','🦆','❄️','🐟'][i%8];
  b.setAttribute?.('aria-label',isTarget?'Throw snowball at ghost':'Decoy');
  b.style.cssText='min-height:62px;font-size:30px;border:2px solid #4a7892;border-radius:12px;background:#123047;color:#eafaff;cursor:pointer;';
  b.onclick=()=>{if(!state.challengeActive||state.challengeKind!=='bonusSnowball')return;if(isTarget){state.bonusFaceCount++;$('snowballHitCount').textContent=state.bonusFaceCount;$('bonusFaceBar').style.width=(state.bonusFaceCount/8*100)+'%';$('bonusFaceHint').textContent=['POW! Snowball direct hit! ❄️','Ghost got a frosty makeover! 🥶','Bullseye! The ghost is snow-mad!'][state.bonusFaceCount%3];playTone(520,.06);if(state.bonusFaceCount>=8){$('challengeFeedback').textContent='Ghost army defeated!';endBonusGame();return;}renderSnowballAttack();}else{$('bonusFaceHint').textContent='Oops! That was a decoy. The ghost is giggling. 😈';playTone(180,.04);}};
  grid.appendChild(b);
 }
}
function advancePoseChallenge(manual=false){
 if(!state.challengeActive||state.challengeKind!=='bonusPose')return;
 const moves=[{name:'TURN LEFT',symbol:'←',hint:'Turn your head to your left and hold it steady.'},{name:'TURN RIGHT',symbol:'→',hint:'Turn your head to your right and hold it steady.'},{name:'ROTATE HEAD',symbol:'↻',hint:'Tilt/rotate your head sideways and hold it steady.'}];
 state.bonusStep++;state.bonusFaceCount=state.bonusStep;state.bonusFaceArmed=false;state.expressionPoseSince=0;
 $('bonusFaceProgress').textContent=`${state.bonusStep} / 3 movements`;$('bonusFaceBar').style.width=(state.bonusStep/3*100)+'%';playTone(520,.06);
 if(state.bonusStep>=3){$('bonusFaceEmoji').textContent='✓';$('poseInstruction').textContent='All movements complete!';$('bonusFaceHint').textContent='Great movement control! You earned the second chest key.';$('challengeFeedback').textContent='Movement challenge complete!';endBonusGame();return;}
 const next=moves[state.bonusStep];$('bonusFaceEmoji').textContent=next.symbol;$('poseInstruction').textContent=`Movement ${state.bonusStep+1} of 3: ${next.name}`;$('bonusFaceHint').textContent=next.hint;$('challengeFeedback').textContent=`${moves[state.bonusStep-1].name} complete!`;
}

function updateFaceBonus(){
 if(!state.challengeActive)return;const kind=state.challengeKind,now=performance.now();
 if(kind==='bonusPose'){
  const moves=[{name:'TURN LEFT',hint:'Turn your head to your left and hold it steady.',match:f=>f.yaw>.075},{name:'TURN RIGHT',hint:'Turn your head to your right and hold it steady.',match:f=>f.yaw<-.075},{name:'ROTATE HEAD',hint:'Tilt/rotate your head sideways and hold it steady.',match:f=>Math.abs(f.roll)>.20}];
  const move=moves[state.bonusStep];if(!move)return;if(!state.face){state.expressionPoseSince=0;state.bonusFaceArmed=true;return;}
  const detected=move.match(state.face);
  if(detected){if(!state.expressionPoseSince)state.expressionPoseSince=now;const held=now-state.expressionPoseSince>=700;$('bonusFaceHint').textContent=held?'Movement detected! Great job!':`Hold ${move.name.toLowerCase()} steady…`;if(held&&state.bonusFaceArmed){advancePoseChallenge(false);return;}}else{state.expressionPoseSince=0;state.bonusFaceArmed=true;$('bonusFaceHint').textContent=move.hint;}return;
 }
 if(!state.face)return;if(kind==='bonusSnowball')return;let value=0,low=0,high=0,emoji='';
 if(kind==='bonusBlink'){
  // Personal calibration adapts to camera distance, face shape and lighting.
  // Learn the player's open-eye ratio briefly, then detect a relative drop and recovery.
  const eye=state.face.eyeOpen;
  if(!Number.isFinite(eye)||eye<=0){$('bonusFaceHint').textContent='Keep both eyes visible and face the camera.';return;}
  if(state.blinkOpenBaseline==null){
   if(eye>.045)state.blinkOpenSamples.push(eye);
   if(now-state.blinkCalibrationStarted<1200){$('bonusFaceHint').textContent='Keep both eyes open and face the camera… calibrating';return;}
   const a=state.blinkOpenSamples.slice().sort((x,y)=>x-y);
   if(a.length<5){state.blinkCalibrationStarted=now;state.blinkOpenSamples=[];$('bonusFaceHint').textContent='Face the camera with both eyes visible so I can calibrate.';return;}
   state.blinkOpenBaseline=a[Math.floor(a.length*.65)]||a[a.length-1];
   $('bonusFaceHint').textContent='Ready! Blink naturally 6 times.';return;
  }
  const closed=eye<Math.max(.055,state.blinkOpenBaseline*.78);
  const reopened=eye>Math.max(.075,state.blinkOpenBaseline*.90);
  if(closed){if(!state.blinkWasClosed){state.blinkWasClosed=true;state.blinkClosedSince=now;} $('bonusFaceHint').textContent='Eyes closed detected — open them to count the blink!';return;}
  if(reopened&&state.blinkWasClosed){const closedFor=now-state.blinkClosedSince;state.blinkWasClosed=false;state.blinkClosedSince=0;
   if(closedFor>=35&&closedFor<=900){state.bonusFaceCount++;const goal=6;$('bonusFaceEmoji').textContent='😉';$('bonusFaceProgress').textContent=`${state.bonusFaceCount} / ${goal}`;$('bonusFaceBar').style.width=(state.bonusFaceCount/goal*100)+'%';$('bonusFaceHint').textContent=state.bonusFaceCount>=goal?'Six blinks detected!':'Blink counted! Close and open your eyes again.';playTone(1046,.09);if(state.bonusFaceCount>=goal)endBonusGame();}
   else $('bonusFaceHint').textContent='Try a natural blink while facing the camera.';
  } else if(state.blinkWasClosed&&now-state.blinkClosedSince>1100){state.blinkWasClosed=false;state.blinkClosedSince=0;$('bonusFaceHint').textContent='Keep your face visible and try a natural blink.';}
  // Slowly adapt to normal open-eye variation, but never while the eye is closed.
  else if(!state.blinkWasClosed&&eye>state.blinkOpenBaseline*.90)state.blinkOpenBaseline=state.blinkOpenBaseline*.99+eye*.01;
  return;
 }
 else if(kind==='bonusSmile'&&state.level===1){
  const tasks=[{name:'Smile',emoji:'😊',key:'smile',delta:.035},{name:'Sad',emoji:'😢',key:'sad',delta:.008},{name:'Double Thumbs-Up',emoji:'👍👍',key:'thumbs',delta:0}];
  if(!state.expressionBaseline){
   state.expressionSamples.push({smile:state.face.smile,sad:state.face.sad,angry:state.face.angry});
   if(now-state.bonusSmileCalibratedAt<1400)return;
   const median=k=>{const a=state.expressionSamples.map(v=>v[k]).sort((x,y)=>x-y);return a[Math.floor(a.length/2)]||0;};
   state.expressionBaseline={smile:median('smile'),sad:median('sad'),angry:median('angry')};
   $('bonusFaceHint').textContent='Calibration complete. Keep your face centered. Smile clearly; for Sad, lower both mouth corners and hold the expression.';
   return;
  }
  const task=tasks[state.bonusStep];if(!task)return;
  let matched=false;
  if(task.key==='thumbs'){
   // Require two independently detected hands, each classified as THUMBS UP.
   // Face tracking remains active, but the final task is gesture-only for reliability.
   const hands=state.handLandmarks||[];
   const bothThumbsUp=hands.length>=2 && classifyHand(hands[0])==='THUMBS UP' && classifyHand(hands[1])==='THUMBS UP';
   if(bothThumbsUp){
    if(!state.expressionPoseSince)state.expressionPoseSince=now;
    matched=now-state.expressionPoseSince>=700;
    $('bonusFaceHint').textContent=matched?'Both thumbs-up detected! Hold it…':'Great! Keep both thumbs up for a moment.';
   }else{state.expressionPoseSince=0;matched=false;$('bonusFaceHint').textContent='Show BOTH hands clearly and point both thumbs upward.';}
   value=matched?1:0;high=1;
  }else{
   const baseline=state.expressionBaseline[task.key];value=state.face[task.key];high=baseline+task.delta;
   // Emotion scores are personalized against the neutral calibration. Sadness is
   // intentionally based mostly on downward mouth-corner curvature: eyebrow geometry
   // varies greatly between people and should not dominate the decision.
   if(task.key==='sad')high=Math.max(.012,baseline+.006);
   if(task.key==='smile')high=Math.max(.035,baseline+.012);
   matched=value>=high;
   // Require a short stable hold so one noisy frame cannot complete a task.
   if(matched){if(!state.expressionPoseSince)state.expressionPoseSince=now;matched=now-state.expressionPoseSince>=450;}else state.expressionPoseSince=0;
  }
  if(!matched){state.bonusFaceLast=now;state.bonusFaceArmed=true;if(task.key!=='thumbs')state.expressionPoseSince=0;state.expressionNeutralSince=now;return;}
  if(matched&&state.bonusFaceArmed&&now-state.bonusFaceLast>1300){
   state.bonusStep++;state.bonusFaceCount=state.bonusStep;state.bonusFaceArmed=false;state.bonusFaceLast=now;
   const card=document.querySelector(`#expressionTasks [data-expression="${state.bonusStep-1}"]`);
   if(card){card.style.background='#145a42';card.style.borderColor='#64f0ae';card.querySelector('small').textContent='✓ Completed';}
   const next=tasks[state.bonusStep];
   if(next){const nextCard=document.querySelector(`#expressionTasks [data-expression="${state.bonusStep}"]`);if(nextCard){nextCard.classList.add('active');nextCard.style.borderColor='#70dfff';nextCard.style.background='#123d59';nextCard.querySelector('small').textContent='Now';}
    $('bonusFaceEmoji').textContent=next.emoji;$('expressionInstruction').textContent=`Task ${state.bonusStep+1} of 3: ${next.name}`;$('bonusFaceHint').textContent=task.key==='sad'?'Sad face detected! Relax your face, then show both thumbs up.':`${task.name} detected! Relax your face, then make a clear ${next.name.toLowerCase()} expression.`;$('challengeFeedback').textContent=task.key==='thumbs'?'Double thumbs-up detected!':`${task.name} detected!`;
   }else{$('bonusFaceEmoji').textContent='🎉';$('expressionInstruction').textContent='All three expressions completed!';$('bonusFaceHint').textContent='Double thumbs-up matched! Reward unlocked.';$('challengeFeedback').textContent='Double thumbs-up detected!';}
   $('bonusFaceProgress').textContent=`${state.bonusStep} / 3 expressions`;$('bonusFaceBar').style.width=(state.bonusStep/3*100)+'%';playTone(520,.06);if(state.bonusStep>=3)endBonusGame();
  }
  return;
 }
 else if(kind==='bonusSmile'){value=state.face.smile;emoji='😁';}
 else if(kind==='bonusBurp'){value=state.face.mouthOpen;low=.16;high=.30;emoji='😮';}else return;
 if(kind==='bonusSmile'&&state.level!==1){
  if(state.bonusSmileBaseline===null){state.bonusSmileSamples.push(value);if(now-state.bonusSmileCalibratedAt<1300)return;const sorted=[...state.bonusSmileSamples].sort((a,b)=>a-b);state.bonusSmileBaseline=sorted[Math.floor(sorted.length/2)]??value;$('bonusFaceHint').textContent='Ready! Smile wide, relax your face, then smile again.';return;}
  low=state.bonusSmileBaseline+.012;high=state.bonusSmileBaseline+.045;
 }
 if(value<low){state.bonusFaceArmed=true;return;}
 if(value>=high&&state.bonusFaceArmed&&now-state.bonusFaceLast>650){
  state.bonusFaceCount++;state.bonusFaceArmed=false;state.bonusFaceLast=now;const goal=kind==='bonusBlink'?6:kind==='bonusBurp'?3:5;
  $('bonusFaceEmoji').textContent=emoji;$('bonusFaceProgress').textContent=`${state.bonusFaceCount} / ${goal}`;$('bonusFaceBar').style.width=(state.bonusFaceCount/goal*100)+'%';
  $('bonusFaceHint').textContent=kind==='bonusBlink'?'Blink again! The principal is counting…':kind==='bonusSmile'?'Beautifully ridiculous. Relax, then smile again!':'That yawn could swallow the principal. One more!';playTone(520,.06);if(state.bonusFaceCount>=goal)endBonusGame();
 }
}
function endBonusGameFail(msg){clearInterval(state.challengeInterval);state.challengeInterval=null;state.challengeActive=false;$('challenge').hidden=true;notify(msg);journal('The funny mini-game timer ran out. Return to the game marker to retry.','Retry the mini-game and complete it before time runs out.');}
function endBonusGame(){clearInterval(state.challengeInterval);state.challengeInterval=null;state.challengeActive=false;$('challenge').hidden=true;state.bonusGameDone=true;state.score+=150;state.relics.push(['👀 Blink champion badge','🤸 Silly Pose Master medal','😮 Mummy yawn trophy'][state.level]);notify('🗝️ MINI-GAME WON! Second chest unlocked!');journal(['You completed the blink challenge and unlocked the second chest!','You completed the two-pose showdown and unlocked the second chest!','You completed the mummy yawn contest and unlocked the second chest!'][state.level],'Open the second box to collect the level door key.');confetti();updateUI();draw();}
function openSecondChest(){if(state.secondChestDone)return;if(!state.bonusGameDone){notify('🔒 Play the separate 🎮 mini-game to earn this box’s door key!');return;}state.secondChestDone=true;state.bonusKeys[state.level]=true;state.score+=75;state.relics.push(['👻 Ghost’s hall pass','🐧 Penguin’s fish licence','🧟 Mummy’s spare bandage'][state.level]);notify('🗝️ SECOND BOX OPEN! Level door key collected!');journal('The second chest opens with a ridiculous squeak. You found the level door key!','Find the exit door.');confetti();updateUI();draw();}
function reachExit(){if(!state.chestDone||!state.secondChestDone||!state.keys[state.level]||!state.bonusKeys[state.level]){notify('🔒 Exit locked! Collect BOTH keys: open the first chest, win the separate mini-game, then open the second chest.');return;}if(state.level<2){const next=state.level+1;$('nextLevelTitle').textContent=`LEVEL ${state.level+1} COMPLETE!`;$('nextLevelMessage').textContent=next===1?'The forest ghost is defeated! Ready for the Frozen Penguin Maze?':'The frozen maze is cleared! Ready for the Ancient Mummy Maze?';$('nextLevelEmoji').textContent=next===1?'❄️':'🏺';$('nextLevelBtn').textContent=`START LEVEL ${next+1}`;$('nextLevelOverlay').hidden=false;state.pendingNextLevel=next;}else if(state.doorKey){completeWin();}else finalChallenge();}
function beginNextLevel(){const next=state.pendingNextLevel;if(next!==1&&next!==2)return;$('nextLevelOverlay').hidden=true;state.level=next;state.pos=[...levelDef().start];state.challengeDone=false;state.chestDone=false;state.ghostQuizDone=false;state.bonusGameDone=false;state.bonusStep=0;state.secondChestDone=false;state.challengeActive=false;state.characterTask=null;state.characterStep=0;startLevelMusic();addExplored();journal(next===1?'The forest ghost is defeated. Enter the frozen fortress and watch out for flying fish.':'The penguin’s fish cannon has jammed. Face the mummy’s ridiculous duel.',next===1?'Explore the snowy maze, complete its challenges, and collect both keys.':'Explore the ancient pyramid maze, complete its challenges, and collect both keys.');updateUI();draw();}
function beginChallenge(){if(state.challengeActive||state.challengeDone)return;state.challengeActive=true;state.challengeKind=levelDef().challenge;$('challenge').hidden=false;$('challengeCharacter').textContent=levelDef().character;$('challengeDialogue').textContent=levelDef().line;$('challengeFeedback').textContent=state.camera?'Camera ready':'Start camera for detection';if(state.challengeKind==='face')setupFaceChallenge();if(state.challengeKind==='level2Combo')setupLevel2Combo();if(state.challengeKind==='bonk')setupBonkChallenge();if(state.challengeKind==='snow')setupSnowChallenge();if(state.challengeKind==='dodge')setupDodgeChallenge();if(state.challengeKind==='memory')setupMemoryChallenge();}
function endChallenge(success,msg){document.querySelectorAll('#dodgeArea span').forEach(e=>e.remove());if(success)playTone(880,.24);clearInterval(state.challengeInterval);state.challengeInterval=null;state.challengeActive=false;$('challenge').hidden=true;if(success&&state.challengeKind==='bonusRps'){endBonusGame();return;}if(success&&state.challengeKind==='door'){state.doorKey=true;state.score+=200;notify('🔑 PRINCIPAL’S DOOR KEY ACQUIRED! The doorbell has resigned.');journal('You rang the ridiculous doorbell four times. The principal dropped the master key.','Step away, return to the exit door, and escape!');confetti();updateUI();draw();return;}if(success){state.challengeDone=true;state.score+=state.level===2?150:100;const lines=['😂 Your face has officially broken the forest ghost!','🐧 The penguin slipped. “That was definitely part of my plan.”','🧠 Congratulations! You have a better memory than a 3,000-year-old mummy!'];notify(lines[state.level]);journal(lines[state.level],'Reach the treasure chest and collect the exit key.');confetti();}else{notify(msg||'Challenge timed out. Try again when ready.');journal('The guard is still waiting. Step back onto the glowing marker to retry.','Retry the challenge.');}updateUI();draw();}
function challengeCountdown(seconds,onTick,onEnd){state.challengeEnd=performance.now()+seconds*1000;state.challengeInterval=setInterval(()=>{const left=Math.max(0,Math.ceil((state.challengeEnd-performance.now())/1000));$('challengeTimer').textContent=left+'s';if(onTick)onTick(left);if(left<=0){clearInterval(state.challengeInterval);state.challengeInterval=null;onEnd();}},100);}
function setupBonkChallenge(){
 state.bonkHits=0;state.bonkLast=0;state.bonkTarget={x:18+Math.random()*64,y:22+Math.random()*55};
 $('challengeTitle').textContent='BONK THE PRINCIPAL! 🧑‍🏫';$('challengeTimer').textContent='15s';
 $('challengeBody').innerHTML='<div class="snow-count" id="bonkCount">Principal bonks: 0/6</div><div class="snow-area" id="bonkArea" style="height:230px;position:relative;overflow:hidden;background:radial-gradient(circle,#183c2b,#06110f);border:1px solid #276849"><div id="bonkTarget" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:48px;filter:drop-shadow(0 0 12px #4dff9b)">🧑‍🏫</div><div id="bonkHand" style="position:absolute;display:none;transform:translate(-50%,-50%);font-size:30px">👆</div></div><div class="challenge-instruction">Move your tracked hand over the principal. Bonk him 6 times before he assigns homework!</div><div class="hint-text">Keep your hand visible. The target jumps after every hit.</div>';
 if(!state.camera)$('challengeFeedback').textContent='Start camera to play';
 challengeCountdown(15,()=>{},()=>endChallenge(false,'Time is up! The principal escaped. Try again!'));
}
function updateBonkChallenge(){if(!state.challengeActive||state.challengeKind!=='bonk'||!state.hand)return;const area=$('bonkArea'),target=$('bonkTarget'),cursor=$('bonkHand');if(!area||!target||!cursor)return;/* Use the tracked index fingertip, matching the visible hand cursor, not the palm centre. */const tip=state.hand.tip||state.hand;const x=(1-tip.x)*100,y=tip.y*100;cursor.style.display='block';cursor.style.left=x+'%';cursor.style.top=y+'%';const ar=area.getBoundingClientRect(),tr=target.getBoundingClientRect();const px=(1-tip.x)*ar.width,py=tip.y*ar.height;const cx=tr.left-ar.left+tr.width/2,cy=tr.top-ar.top+tr.height/2;const hitRadius=Math.max(38,Math.min(58,tr.width*.62));if(Math.hypot(px-cx,py-cy)<hitRadius&&performance.now()-state.bonkLast>650){state.bonkLast=performance.now();state.bonkHits++;$('bonkCount').textContent=`Principal bonks: ${state.bonkHits}/6`;notify(['BONK! Principal.exe has stopped responding.','Direct hit! His tie filed a complaint.','BONK! Detention has been cancelled.'][state.bonkHits%3]);state.bonkTarget={x:12+Math.random()*76,y:18+Math.random()*64};target.style.left=state.bonkTarget.x+'%';target.style.top=state.bonkTarget.y+'%';target.textContent=['🧑‍🏫','🤡','😵‍💫','👨‍🏫'][state.bonkHits%4];if(state.bonkHits>=6)endChallenge(true);}}
function setupDodgeChallenge(){state.dodgeHits=0;state.dodgeLast=0;state.dodgeItems=[];$('challengeTitle').textContent='PENGUIN LUNCH PANIC 🐟';$('challengeTimer').textContent='15s';$('challengeBody').innerHTML='<div class="snow-count" id="dodgeCount">💥 Hits: 0/3 · Avoid ALL falling food!</div><div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin:6px 0 10px;font-size:14px"><span>🐟 AVOID</span><span>🦑 AVOID</span><span>🍣 AVOID</span><span>🧺 YOU</span></div><div class="snow-area" id="dodgeArea" style="height:250px;position:relative;overflow:hidden;background:linear-gradient(#0b2932,#06110f);border:1px solid #276849"><div id="dodgeHand" style="position:absolute;display:none;transform:translate(-50%,-50%);font-size:42px;filter:drop-shadow(0 0 8px #52ffb0)">🧺</div></div><div class="challenge-instruction"><b>MISSION: SAVE THE PENGUIN!</b> 🐧 Move your tracked hand LEFT and RIGHT to steer the 🧺 basket. DODGE the falling 🐟 fish, 🦑 squid and 🍣 sushi. Do NOT catch them! Survive for 15 seconds. Three hits = you become sushi!</div><div class="hint-text">Move your REAL hand sideways in front of the webcam. The basket follows your palm. Keep your hand visible in the camera frame.</div>';
 for(let i=0;i<5;i++)state.dodgeItems.push({x:8+Math.random()*84,y:-Math.random()*100,speed:24+Math.random()*20,el:null});if(!state.camera)$('challengeFeedback').textContent='Start camera to play';
 challengeCountdown(15,()=>tickDodge(),()=>endChallenge(state.dodgeHits<3,state.dodgeHits<3?'You dodged the fish! The penguin says: “I meant to do that.”':'Fish attack! The penguin has ordered fish-flavoured revenge.'));
}
function tickDodge(){const area=$('dodgeArea');if(!area||!state.challengeActive)return;const now=performance.now();for(const [i,f] of state.dodgeItems.entries()){f.y+=f.speed*.11;if(f.y>108){f.y=-8;f.x=5+Math.random()*90;}if(!f.el||!f.el.isConnected){f.el=document.createElement('span');f.el.textContent=['🐟','🦑','🍣'][i%3];f.el.style.cssText='position:absolute;font-size:27px;transform:translate(-50%,-50%)';area.appendChild(f.el);}f.el.style.left=f.x+'%';f.el.style.top=f.y+'%';if(state.hand){const hx=(1-state.hand.x)*100,hy=state.hand.y*100;if(Math.abs(hx-f.x)<10&&Math.abs(hy-f.y)<14&&now-state.dodgeLast>650){state.dodgeLast=now;state.dodgeHits++;$('dodgeCount').textContent=`💥 Hits: ${state.dodgeHits}/3 · Keep dodging!`;f.y=-12;f.x=5+Math.random()*90;if(state.dodgeHits>=3){endChallenge(false,'Three fish hits! The penguin says: “You are now the sushi.”');return;}}}}if(state.hand){const c=$('dodgeHand');c.style.display='block';c.style.left=((1-state.hand.x)*100)+'%';c.style.top=(state.hand.y*100)+'%';}}
function setupLevel2Combo(){
 state.level2ComboStage=0;state.level2Yawns=0;state.level2YawnArmed=true;state.level2PoseSince=0;state.level2LastStageChange=0;
 $('challengeTitle').textContent='PENGUIN’S SILLY FACE & HAND CHALLENGE 🐧';
 $('challengeTimer').textContent='60s';
 $('challengeBody').innerHTML='<div class="emoji-target" id="level2ComboEmoji">😮</div><div class="snow-count" id="level2ComboProgress">Yawns: 0 / 3</div><div class="challenge-instruction" id="level2ComboInstruction"><b>Step 1:</b> Yawn clearly 3 times in front of the camera. Close your mouth between yawns.</div><div class="hint-text" id="level2ComboHint">Keep your face centered and well-lit. After 3 yawns, show BOTH thumbs up, then show a V/peace sign with BOTH hands. Each pose must be held briefly.</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0"><button type="button" id="level2PoseConfirm" style="padding:10px 14px;border-radius:10px;border:1px solid #70d6ff;background:#123047;color:white;font-weight:700;cursor:pointer">I did this pose ✓</button></div><div class="challenge-progress"><i id="level2ComboBar"></i></div>';
 $('level2PoseConfirm').addEventListener('click',()=>{if(!state.challengeActive||state.challengeKind!=='level2Combo'||state.level2ComboStage===0)return;advanceLevel2ComboPose(true);});
 $('challengeFeedback').textContent=state.faceReady?'Face tracking ready':'Start camera for yawn detection';
 challengeCountdown(60,()=>{},()=>endChallenge(false,'Time is up! The penguin escaped. Try the three-step challenge again!'));
}
function advanceLevel2ComboPose(manual=false){
 if(!state.challengeActive||state.challengeKind!=='level2Combo'||state.level2ComboStage===0)return;
 state.level2ComboStage++;state.level2PoseSince=0;state.level2LastStageChange=performance.now();
 const instruction=$('level2ComboInstruction'),emoji=$('level2ComboEmoji'),hint=$('level2ComboHint'),progress=$('level2ComboProgress'),bar=$('level2ComboBar');
 if(state.level2ComboStage===1){emoji.textContent='👍👍';instruction.innerHTML='<b>Step 2:</b> Show BOTH thumbs up 👍👍. Hold both hands in the camera frame.';hint.textContent='The game checks two separate hands. If tracking misses your pose, make it clearly and use the confirmation button.';progress.textContent='Yawns complete ✓ · Double thumbs-up';bar.style.width='50%';$('challengeFeedback').textContent='Yawn challenge complete! Double thumbs-up next.';playTone(560,.08);return;}
 if(state.level2ComboStage===2){emoji.textContent='✌️✌️';instruction.innerHTML='<b>Step 3:</b> Show TWO fingers / peace sign with BOTH hands ✌️✌️.';hint.textContent='Show a clear V with index and middle fingers on BOTH hands; fold ring and little fingers. Keep both hands apart, fully inside the frame, and hold for 1 second. If tracking still misses, use the confirmation button.';progress.textContent='Yawns ✓ · Double thumbs-up ✓ · Double two-fingers';bar.style.width='75%';$('challengeFeedback').textContent='Double thumbs-up detected! Double two-fingers next.';playTone(640,.08);return;}
 progress.textContent='All 3 tasks complete!';bar.style.width='100%';emoji.textContent='🎉';instruction.textContent='You fooled the penguin! Challenge complete.';hint.textContent='All done — the first chest key is yours!';endChallenge(true);
}
function updateLevel2Combo(now){
 if(!state.challengeActive||state.challengeKind!=='level2Combo')return;
 if(state.level2ComboStage===0){
  if(!state.face)return;
  const yawning=state.face.mouthOpen>.34;
  if(yawning&&state.level2YawnArmed&&now-state.level2LastStageChange>500){state.level2Yawns++;state.level2YawnArmed=false;state.level2LastStageChange=now;playTone(440,.06);$('level2ComboEmoji').textContent=['😮','🥱','😪'][Math.min(state.level2Yawns-1,2)];$('level2ComboProgress').textContent=`Yawns: ${Math.min(state.level2Yawns,3)} / 3`;$('level2ComboBar').style.width=(Math.min(state.level2Yawns,3)/3*25)+'%';$('level2ComboHint').textContent='Yawn counted! Close your mouth before yawning again.';if(state.level2Yawns>=3){state.level2ComboStage=1;$('level2ComboEmoji').textContent='👍👍';$('level2ComboInstruction').innerHTML='<b>Step 2:</b> Show BOTH thumbs up 👍👍. Hold both hands in the camera frame.';$('level2ComboProgress').textContent='Yawns: 3 / 3 ✓ · Double thumbs-up next';$('level2ComboBar').style.width='25%';$('challengeFeedback').textContent='Three yawns detected! Now show double thumbs-up.';}}
  else if(!yawning){state.level2YawnArmed=true;}
  return;
 }
 const hands=state.handLandmarks||[];let matched=false;
 if(state.level2ComboStage===1)matched=hands.length>=2&&hands.filter(h=>classifyHand(h)==='THUMBS UP').length>=2;
 if(state.level2ComboStage===2)matched=hands.length>=2&&hands.filter(h=>classifyHand(h)==='PEACE').length>=2;
 if(matched){if(!state.level2PoseSince)state.level2PoseSince=now;if(now-state.level2PoseSince>=650){advanceLevel2ComboPose(false);return;}$('level2ComboHint').textContent='Pose detected! Hold it steady…';}
 else{state.level2PoseSince=0;$('level2ComboHint').textContent=state.level2ComboStage===1?'Show BOTH thumbs up clearly.':'Show a two-finger V/peace sign with BOTH hands.';}
}
function setupFaceChallenge(){state.faceIndex=0;state.faceStarted=performance.now();state.faceDeadline=performance.now()+15000;$('challengeTitle').textContent='Copy the Emoji 😂';$('challengeBody').innerHTML='<div class="emoji-target" id="faceTarget">😊</div><div class="challenge-instruction">Copy each face: happy smile → wide-open surprise → relaxed neutral face.</div><div class="challenge-progress"><i id="faceProgress"></i></div><div class="hint-text" id="faceHint">Big expressions work best. No need to overact!</div>';$('challengeTimer').textContent='15s';if(!state.camera)$('challengeFeedback').textContent='Camera needed — press START CAMERA';challengeCountdown(15,()=>{},()=>endChallenge(false,'The ghost got bored. Try again!'));}
const faceTargets=[{emoji:'😊',name:'HAPPY SMILE',test:f=>f.smile>.30},{emoji:'😮',name:'SURPRISED',test:f=>f.mouthOpen>.16},{emoji:'😳',name:'BIG EYES',test:f=>f.eyeOpen>.27}];
function faceFeatures(l){
 const dist=(a,b)=>Math.hypot(l[a].x-l[b].x,l[a].y-l[b].y);
 const mouthW=dist(61,291),mouthH=dist(13,14),faceW=dist(234,454)||.4;
 const corners=(l[61].y+l[291].y)/2,center=l[13].y;
 // Normalized nose offset estimates horizontal head turn; eye-line angle estimates head rotation/tilt.
 const faceCenterX=(l[234].x+l[454].x)/2;
 const yaw=(l[1].x-faceCenterX)/faceW;
 const roll=Math.atan2(l[263].y-l[33].y,l[263].x-l[33].x);
 const eyeOpen=((dist(159,145)/(dist(33,133)||.01))+(dist(386,374)/(dist(362,263)||.01)))/2;
 // Positive cornerDrop means the mouth corners sit below the upper-lip centre.
 // Keep this feature normalized by face width so camera distance matters less.
 const cornerDrop=(corners-center)/faceW;
 const cornerLift=(center-corners)/faceW;
 const innerBrowLift=((l[159].y-l[105].y)+(l[386].y-l[334].y))/(2*faceW);
 const browLower=((l[105].y-l[159].y)+(l[334].y-l[386].y))/(2*faceW);
 // Mouth-corner movement is the strongest stable cue for smile/sad. Weight it
 // meaningfully instead of relying almost entirely on mouth width, which barely
 // changes for many faces. Clamp extreme tracking noise from partial occlusion.
 const clamp01=v=>Math.max(0,Math.min(.12,v));
 const sad=clamp01(cornerDrop)*1.5;
 const smile=mouthW/faceW+clamp01(cornerLift)*1.5;
 const angry=Math.max(0,browLower)+Math.max(0,cornerLift)*.25;
 return {smile,mouthOpen:mouthH/(mouthW||.01),eyeOpen,purse:mouthW/faceW,sad,angry,innerBrowLift,cheekY:(l[234].y+l[454].y)/2,faceWidth:faceW,yaw,roll};
}
function setupSnowChallenge(){state.snowRetry=false;state.snowCaught=0;state.snowflakes=[];$('challengeTitle').textContent='Catch the Snowflakes ❄️';$('challengeBody').innerHTML='<div class="snow-count" id="snowCount">Snowflakes: 0/5</div><div class="snow-area" id="snowArea"><div class="hand-target" id="snowHand" hidden></div></div><div class="challenge-instruction">Move your tracked open hand over five falling flakes.</div>';$('challengeTimer').textContent='12s';if(!state.camera)$('challengeFeedback').textContent='Camera needed — press START CAMERA';for(let i=0;i<7;i++)state.snowflakes.push({x:8+Math.random()*84,y:-Math.random()*120,speed:35+Math.random()*28,caught:false});challengeCountdown(12,()=>snowTick(),()=>{if(state.snowCaught>=5)endChallenge(true);else if(!state.snowRetry){state.snowRetry=true;setupSnowRetry();}else endChallenge(false,'The snow police have been notified. Try again!');});}
function setupSnowRetry(){clearInterval(state.challengeInterval);state.snowRetry=true;state.snowCaught=0;$('challengeTitle').textContent='One More Snowy Chance';$('challengeFeedback').textContent='Quick retry';$('challengeBody').innerHTML='<div class="snow-count" id="snowCount">Snowflakes: 0/5</div><div class="snow-area" id="snowArea"><div class="hand-target" id="snowHand" hidden></div></div><div class="challenge-instruction">Five flakes. You can do this. Probably.</div>';state.snowflakes=[];for(let i=0;i<8;i++)state.snowflakes.push({x:8+Math.random()*84,y:-Math.random()*130,speed:42+Math.random()*35,caught:false});challengeCountdown(12,()=>snowTick(),()=>endChallenge(state.snowCaught>=5,state.snowCaught>=5?'':'Penguin wins this round. Try again!'));}
function snowTick(){const area=$('snowArea');if(!area)return;const dt=.11;for(const f of state.snowflakes){if(f.caught)continue;f.y+=f.speed*dt;if(f.y>110){f.y=-10;f.x=5+Math.random()*90;}let el=area.querySelector(`[data-flake="${state.snowflakes.indexOf(f)}"]`);if(!el){el=document.createElement('span');el.className='snowflake';el.dataset.flake=state.snowflakes.indexOf(f);el.textContent='❄';area.appendChild(el);}el.style.left=f.x+'%';el.style.top=f.y+'%';if(state.hand&&state.hand.open){const hx=(1-state.hand.x)*100,hy=state.hand.y*100;if(Math.abs(hx-f.x)<12&&Math.abs(hy-f.y)<20){f.caught=true;el.remove();state.snowCaught++;$('snowCount').textContent=`Snowflakes: ${state.snowCaught}/5`;if(state.snowCaught>=5){endChallenge(true);return;}}}}}
function setupMemoryChallenge(){state.rpsWins=0;state.rpsRound=0;state.rpsTies=0;state.memoryPoseSince=0;state.memoryLastPose='';$('challengeTitle').textContent='ROCK PAPER SCISSORS — RACE TO 5! 🧟';$('challengeBody').innerHTML='<div class="symbol-mapping"><span>✊ FIST = ROCK</span><span>🖐️ OPEN PALM = PAPER</span><span>✌️ PEACE = SCISSORS</span></div><div class="emoji-target" id="rpsOpponent">🧟</div><div class="snow-count" id="rpsScore">You: 0 / 5 · Mummy: 0 / 5</div><div class="challenge-instruction" id="memoryInstruction">First to 5 points wins! A draw gives no points. Use the camera pose OR tap a move below.</div><div class="rps-buttons" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0"><button type="button" data-rps="ROCK">✊ Rock</button><button type="button" data-rps="PAPER">🖐️ Paper</button><button type="button" data-rps="SCISSORS">✌️ Scissors</button></div><div class="challenge-progress"><i id="memoryProgress"></i></div>';$('challengeTimer').textContent='90s';document.querySelectorAll('[data-rps]').forEach(btn=>btn.addEventListener('click',()=>playRpsMove(btn.dataset.rps)));if(!state.camera)$('challengeFeedback').textContent='Tap a move or start camera';challengeCountdown(90,()=>{},()=>endChallenge(false,'The mummy wins on time! It says: “I have all eternity to practise.”'))}
const rpsMoves={'FIST':'ROCK','OPEN PALM':'PAPER','PEACE':'SCISSORS'};
function playRpsMove(move){if(!state.challengeActive||!['memory','bonusRps'].includes(state.challengeKind)||!['ROCK','PAPER','SCISSORS'].includes(move))return;state.memoryPoseSince=performance.now()+100000;state.memoryLastPose=move;const options=['ROCK','PAPER','SCISSORS'],cpu=options[Math.floor(Math.random()*3)];let result='DRAW — NO POINTS';if(move!==cpu){if((move==='ROCK'&&cpu==='SCISSORS')||(move==='PAPER'&&cpu==='ROCK')||(move==='SCISSORS'&&cpu==='PAPER')){state.rpsWins++;result='YOU WIN +1 POINT! 🎉';}else{state.rpsRound++;result='MUMMY WINS +1 POINT! 🧟';}}else{state.rpsTies++;}
 $('rpsOpponent').textContent=cpu==='ROCK'?'✊':cpu==='PAPER'?'🖐️':'✌️';$('memoryInstruction').textContent=`You: ${move} · Mummy: ${cpu} — ${result}`;$('rpsScore').textContent=`You: ${state.rpsWins} / 5 · Mummy: ${state.rpsRound} / 5`;$('memoryProgress').style.width=(Math.max(state.rpsWins,state.rpsRound)/5*100)+'%';if(state.rpsWins>=5)endChallenge(true);else if(state.rpsRound>=5)endChallenge(false,'Mummy reached 5 points first! It says: “Wrap it up, rookie.”');else{state.memoryLastPose='';state.memoryPoseSince=0;}}
function checkMemoryGesture(g,now){const move=rpsMoves[g];if(!move){state.memoryPoseSince=0;state.memoryLastPose='';return;}if(move!==state.memoryLastPose){state.memoryLastPose=move;state.memoryPoseSince=now;return;}if(now-state.memoryPoseSince<500)return;playRpsMove(move);}
function finalChallenge(){state.challengeKind='door';state.challengeActive=true;state.doorHits=0;state.doorLast=0;state.doorTarget={x:50,y:50};$('challenge').hidden=false;$('challengeCharacter').textContent='🧑‍🏫';$('challengeTitle').textContent='DING-DONG PANIC! GET THE SECRET KEY 🔔';$('challengeDialogue').textContent='The principal has hidden the final key behind a doorbell. Ring it four times before he notices. He is currently arguing with a stapler.';$('challengeBody').innerHTML='<div class="snow-count" id="doorCount">Doorbell rings: 0/4</div><div id="doorArea" style="height:230px;position:relative;overflow:hidden;background:radial-gradient(circle,#183c2b,#06110f);border:1px solid #276849;border-radius:8px"><div id="doorTarget" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:54px;filter:drop-shadow(0 0 14px #4dff9b)">🔔</div><div id="doorHand" style="position:absolute;display:none;transform:translate(-50%,-50%);font-size:30px">👆</div></div><div class="challenge-instruction"><b>MISSION: RING THE BELL 4 TIMES!</b> Move your tracked index fingertip onto the glowing bell. It jumps to a new spot after every ring.</div><div class="hint-text">Keep one hand visible. No special pose needed — just move your hand pointer over the bell. Four rings unlock the secret Principal’s Door Key.</div>';$('challengeTimer').textContent='15s';if(!state.camera)$('challengeFeedback').textContent='Start camera to ring the bell';challengeCountdown(15,()=>updateDoorChallenge(),()=>endChallenge(false,'The principal heard you sneaking around and hid the key again. Try once more!'));}
function updateDoorChallenge(){if(!state.challengeActive||state.challengeKind!=='door'||!state.hand)return;const area=$('doorArea'),target=$('doorTarget'),cursor=$('doorHand');if(!area||!target||!cursor)return;const tip=state.hand.tip||state.hand,x=(1-tip.x)*100,y=tip.y*100;cursor.style.display='block';cursor.style.left=x+'%';cursor.style.top=y+'%';const ar=area.getBoundingClientRect(),tr=target.getBoundingClientRect();const px=(1-tip.x)*ar.width,py=tip.y*ar.height,cx=tr.left-ar.left+tr.width/2,cy=tr.top-ar.top+tr.height/2;if(Math.hypot(px-cx,py-cy)<Math.max(42,tr.width*.55)&&performance.now()-state.doorLast>650){state.doorLast=performance.now();state.doorHits++;$('doorCount').textContent=`Doorbell rings: ${state.doorHits}/4`;playTone(740,.12);notify(['DING-DONG! The principal ignored it.','DING! A pigeon has filed a noise complaint.','DONG! The stapler is now frightened.','FOUR RINGS! The principal dropped his master key!'][state.doorHits-1]);if(state.doorHits>=4){endChallenge(true);return;}state.doorTarget={x:12+Math.random()*76,y:18+Math.random()*64};target.style.left=state.doorTarget.x+'%';target.style.top=state.doorTarget.y+'%';target.textContent=['🔔','📣','🛎️'][state.doorHits%3];}}
function completeWin(){state.challengeActive=false;clearInterval(state.challengeInterval);$('challenge').hidden=true;state.won=true;state.score+=100;$('finalScore').textContent=`FINAL SCORE: ${state.score}  ·  TIME: ${Math.floor(state.seconds/60)}:${String(Math.floor(state.seconds%60)).padStart(2,'0')}`;$('winOverlay').hidden=false;confetti();}
function confetti(){for(let i=0;i<28;i++){const p=document.createElement('i');p.textContent=['✦','✧','❋','✺'][i%4];p.style.cssText=`position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;color:${i%2?'#52efa7':'#d9c47c'};font-size:${10+Math.random()*18}px;pointer-events:none;z-index:6;animation:fall ${.7+Math.random()}s ease-out forwards`;canvas.parentElement.appendChild(p);setTimeout(()=>p.remove(),1800);}}
function classifyHand(l){
 // Classify using normalized fingertip reach plus joint bend. Raw landmark coordinates
 // are noisy, so each finger is judged relative to its own palm base, not fixed pixels.
 if(!Array.isArray(l)||l.length<21)return 'UNCERTAIN';
 const dist=(a,b)=>Math.hypot(l[a].x-l[b].x,l[a].y-l[b].y);
 const angle=(a,b,c)=>{const ux=l[a].x-l[b].x,uy=l[a].y-l[b].y,vx=l[c].x-l[b].x,vy=l[c].y-l[b].y;const den=Math.hypot(ux,uy)*Math.hypot(vx,vy)||1;return Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/den)))*180/Math.PI;};
 const palm=Math.max(.012,dist(0,9));
 const defs=[{name:'INDEX',tip:8,pip:6,dip:7,mcp:5},{name:'MIDDLE',tip:12,pip:10,dip:11,mcp:9},{name:'RING',tip:16,pip:14,dip:15,mcp:13},{name:'PINKY',tip:20,pip:18,dip:19,mcp:17}];
 const info=defs.map(f=>{
   const pipAngle=angle(f.mcp,f.pip,f.tip),dipAngle=angle(f.pip,f.dip,f.tip);
   const tipReach=dist(f.tip,0),pipReach=dist(f.pip,0),baseReach=dist(f.mcp,0);
   // Straight fingers have a near-180 degree joint and the tip extends beyond PIP.
   const extended=(pipAngle>142&&dipAngle>138&&tipReach>pipReach*1.015)||(pipAngle>158&&tipReach>baseReach*1.22);
   const folded=(pipAngle<153)||(tipReach<pipReach*1.045);
   return {...f,pipAngle,dipAngle,extended,folded,tipReach,pipReach,baseReach};
 });
 const count=info.filter(f=>f.extended).length,index=info[0],middle=info[1],ring=info[2],pinky=info[3];
 const thumbReach=dist(4,5),thumbBase=Math.max(.01,dist(3,5));
 const thumbExtended=thumbReach>thumbBase*1.12&&dist(4,0)>dist(3,0)*1.04;
 const foldedCount=info.filter(f=>f.folded).length;
 // Direction poses must win before OPEN PALM, because a pointing hand can look partly open.
 if(index.extended&&!middle.extended&&!ring.extended&&!pinky.extended){
   // Use the index finger's own direction vector. A horizontal finger can be
   // slightly diagonal in a webcam view, so don't require a large palm-relative offset.
   const dx=l[8].x-l[5].x,dy=l[8].y-l[5].y;
   if(Math.abs(dx)>Math.abs(dy)*.58&&Math.abs(dx)>palm*.085)return dx>0?'POINT LEFT':'POINT RIGHT';
   if(Math.abs(dy)>Math.abs(dx)*.42)return 'INDEX';
 }
 if(thumbExtended&&foldedCount>=3&&count<=1)return 'THUMBS UP';
 if(index.extended&&middle.extended&&!ring.extended&&!pinky.extended)return 'PEACE';
 if(count>=3&&foldedCount<=1)return 'OPEN PALM';
 if(count<=1&&foldedCount>=3&&!thumbExtended)return 'FIST';
 return 'UNCERTAIN';
}
function gestureAction(g){if(g==='THUMBS UP')return 'up';if(g==='INDEX'||g==='POINT RIGHT')return 'right';if(g==='FIST')return 'down';if(g==='POINT LEFT')return 'left';return null;}
async function createLandmarkerWithFallback(Task,files,options){try{return await Task.createFromOptions(files,options);}catch(gpuError){console.warn('GPU delegate unavailable; retrying on CPU',gpuError);return Task.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}}
async function loadVisionRuntime(){
 const sources=[{js:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm',wasm:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'},{js:'https://unpkg.com/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs',wasm:'https://unpkg.com/@mediapipe/tasks-vision@0.10.14/wasm'}];
 let lastError;for(const source of sources){try{const vision=await import(source.js);const files=await vision.FilesetResolver.forVisionTasks(source.wasm);return {vision,files};}catch(error){lastError=error;console.warn('Vision runtime source failed; trying backup CDN',source.js,error);}}throw lastError||new Error('Could not load hand-tracking runtime from either CDN. Check internet access.');
}
async function startCamera(){
 if(state.camera||state.cameraStarting)return;
 state.cameraStarting=true;gestureHistory=[];lastDetect=0;state.stableGesture='';state.heldDirection=null;
 const status=$('cameraStatus'),button=$('cameraBtn');
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access needs localhost or HTTPS in Chrome. Run start_game.bat and open http://localhost:8000.');
  status.textContent='Requesting camera permission…';$('cameraBadge').textContent='STARTING';button.textContent='CONNECTING…';
  const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
  state.stream=stream;state.camera=true;
  const video=$('cameraVideo');video.srcObject=stream;video.muted=true;video.autoplay=true;video.playsInline=true;
  await video.play();video.classList.add('active');$('cameraPlaceholder').classList.add('hide');button.textContent='STOP CAMERA';$('cameraBadge').textContent='CAMERA ON';status.textContent='Camera on. Loading hand tracking…';
  const track=stream.getVideoTracks()[0];
  if(track){track.onended=()=>{if(state.stream!==stream)return;state.camera=false;state.modelsReady=false;state.raf=0;button.textContent='RECONNECT CAMERA';$('cameraBadge').textContent='CAMERA INTERRUPTED';status.textContent='Camera stream stopped by browser/device. Click RECONNECT CAMERA.';$('handStatus').textContent='Hand: camera interrupted';};track.onmute=()=>{if(state.stream===stream){$('cameraBadge').textContent='CAMERA PAUSED';status.textContent='Camera temporarily paused by browser/device; waiting for video…';}};track.onunmute=()=>{if(state.stream===stream){$('cameraBadge').textContent=state.modelsReady?'TRACKING':'CAMERA ON';status.textContent=state.modelsReady?'Camera and hand tracking active':'Camera resumed; loading tracking…';video.play().catch(()=>{});}};}
  try{
   const runtime=await loadVisionRuntime();
   const vision=runtime.vision,files=runtime.files;
   state.handLandmarker=await createLandmarkerWithFallback(vision.HandLandmarker,files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2});
   state.handReady=true;
   try{state.faceLandmarker=await createLandmarkerWithFallback(vision.FaceLandmarker,files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1});state.faceReady=true;}
   catch(faceError){console.warn('Face model unavailable; hand tracking continues',faceError);$('faceStatus').textContent='Face: model unavailable';}
   state.modelsReady=state.handReady;status.textContent=state.faceReady?'Camera on · Hand and face tracking ready':'Camera on · Hand tracking ready';$('cameraBadge').textContent='TRACKING';
  }catch(e){console.error('Tracking model load failed',e);state.modelsReady=false;$('cameraBadge').textContent='TRACKING ERROR';status.textContent='CAMERA IS ON BUT HAND TRACKING DID NOT LOAD. Check internet access, then click RELOAD GAME. Details: '+(e.message||'model download failed');$('handStatus').textContent='Hand tracking unavailable';$('gestureName').textContent='TRACKING NOT READY';}
  if(!state.raf)state.raf=requestAnimationFrame(processCamera);
 }catch(e){console.error(e);const msg=e.name==='NotAllowedError'?'Camera permission blocked. Click the lock icon beside the address bar, allow Camera, and reload.':e.name==='NotReadableError'?'Camera is being used by another app. Close other camera apps and reconnect.':e.message||'Could not start camera.';status.textContent=msg;$('cameraBadge').textContent='CAMERA ERROR';state.camera=false;state.stream=null;button.textContent='START CAMERA';}
 finally{state.cameraStarting=false;}
}
function stopCamera(){gestureHistory=[];state.stableGesture='';state.heldDirection=null;state.hand=null;state.handLandmarks=[];state.face=null;if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;state.camera=false;state.modelsReady=false;state.handReady=false;state.faceReady=false;state.handLandmarker?.close();state.faceLandmarker?.close();state.handLandmarker=null;state.faceLandmarker=null;const v=$('cameraVideo');v.srcObject=null;v.classList.remove('active');$('cameraPlaceholder').classList.remove('hide');$('cameraBtn').textContent='START CAMERA';$('cameraBadge').textContent='OFFLINE';$('cameraStatus').textContent='Camera is off. Start it to use gestures.';$('handStatus').textContent='Hand: not detected';$('faceStatus').textContent='Face: not detected';$('gestureName').textContent='WAITING FOR CAMERA';$('handCursor').style.display='none';}
function vReady(v){return v.readyState>=2&&v.videoWidth>0;}let lastDetect=0,gestureHistory=[];function smoothGesture(g){
 // Every frame, including uncertain frames, participates in the vote. This prevents
 // a stale LEFT/RIGHT label from sticking after the hand has changed pose.
 gestureHistory.push(g);if(gestureHistory.length>3)gestureHistory.shift();
 const counts={};for(const v of gestureHistory){if(v!=='UNCERTAIN')counts[v]=(counts[v]||0)+1;}
 let best='UNCERTAIN',n=0;for(const [v,c] of Object.entries(counts)){if(c>n){best=v;n=c;}}
 return n>=2?best:'UNCERTAIN';}function processCamera(now){if(!state.camera||!state.stream){state.raf=0;return;}const liveVideo=$('cameraVideo');if(state.stream.getVideoTracks?.().every(t=>t.readyState==='ended')){state.camera=false;state.raf=0;$('cameraBadge').textContent='CAMERA INTERRUPTED';$('cameraStatus').textContent='Camera stream ended. Click RECONNECT CAMERA.';$('cameraBtn').textContent='RECONNECT CAMERA';return;}if(state.modelsReady&&now-lastDetect>33&&vReady(liveVideo)){lastDetect=now;const v=$('cameraVideo');try{const h=state.handLandmarker?state.handLandmarker.detectForVideo(v,now):null;state.handLandmarks=h?.landmarks||[];if(h?.landmarks?.length){const l=h.landmarks[0],rawGesture=classifyHand(l),g=smoothGesture(rawGesture);state.hand={x:(l[0].x+l[5].x+l[9].x+l[13].x+l[17].x)/5,y:(l[0].y+l[5].y+l[9].y+l[13].y+l[17].y)/5,tip:{x:l[8].x,y:l[8].y},open:g==='OPEN PALM',gesture:g};if(state.challengeActive&&state.challengeKind==='bonk')updateBonkChallenge();if(state.challengeActive&&state.challengeKind==='door')updateDoorChallenge();$('handStatus').textContent='Hand: detected';$('gestureName').textContent=g==='UNCERTAIN'?'HAND FOUND — HOLD POSE':g+' DETECTED';$('handCursor').style.display='block';$('handCursor').style.left=((1-l[8].x)*100)+'%';$('handCursor').style.top=(l[8].y*100)+'%';handleStableGesture(g,now);if(state.challengeActive&&state.challengeKind==='level2Combo')updateLevel2Combo(now);}else{state.handLandmarks=[];state.hand=null;gestureHistory=[];$('handStatus').textContent='Hand: not detected — keep it in frame';$('gestureName').textContent='NO HAND IN FRAME';$('handCursor').style.display='none';state.stableGesture='';}
 const f=state.faceLandmarker?state.faceLandmarker.detectForVideo(v,now):null;if(f?.faceLandmarks?.length){state.face=faceFeatures(f.faceLandmarks[0]);$('faceStatus').textContent='Face: detected';if(state.challengeActive&&state.challengeKind==='face')checkFaceChallenge();if(state.challengeActive&&['bonusBlink','bonusSmile','bonusBurp','bonusPose'].includes(state.challengeKind))updateFaceBonus();if(state.challengeActive&&state.challengeKind==='level2Combo')updateLevel2Combo(now);}else{state.face=null;$('faceStatus').textContent='Face: not detected';if(state.challengeActive&&state.challengeKind==='bonusBlink'&&state.blinkWasClosed&&now-state.blinkClosedSince>900){state.blinkWasClosed=false;state.blinkClosedSince=0;$('bonusFaceHint').textContent='Face tracking paused. Face the camera and blink again.';}}}
 catch(e){console.warn('Landmark frame skipped',e);}}
 state.raf=requestAnimationFrame(processCamera);}
function handleStableGesture(g,now){
 if(g==='UNCERTAIN'){if(now-state.stableSince>500){state.stableGesture='';state.heldDirection=null;}return;}
 if(g!==state.stableGesture){state.stableGesture=g;state.stableSince=now;state.heldDirection=null;state.characterGestureConsumed=false;state.characterHoldSince=0;return;}
 const confirmMs=45;if(now-state.stableSince<confirmMs)return;
 if(state.challengeActive){if(state.challengeKind==='characterTask'){
 const taskName=state.characterTask?.task||'';
 if(taskName==='Don’t Wake the Ghost'||taskName==='Freeze Challenge'||taskName==='Penguin Freeze Challenge'){
  if(g==='OPEN PALM'&&now-state.stableSince>=350){if(!state.characterHoldSince)state.characterHoldSince=now;const elapsed=now-state.characterHoldSince;const p=$('characterProgress');if(p)p.textContent=`${Math.min(5,Math.floor(elapsed/1000))} / 5 seconds`;const bar=$('characterProgressBar');if(bar)bar.style.width=Math.min(100,elapsed/5000*100)+'%';if(elapsed>=5000)completeCharacterTask();}
  else if(g!=='OPEN PALM'){state.characterHoldSince=0;const p=$('characterProgress');if(p)p.textContent='0 / 5 seconds';const bar=$('characterProgressBar');if(bar)bar.style.width='0%';}
  return;
 }
 if(!state.characterGestureConsumed&&now-state.stableSince>=180){state.characterGestureConsumed=true;state.characterLastGestureAt=now;handleCharacterGesture(g==='INDEX'?'POINT RIGHT':g);}return;}if(state.challengeKind==='bonk')updateBonkChallenge();if(state.challengeKind==='memory')checkMemoryGesture(g,now);if(state.challengeKind==='bonus')handleBonusGesture(g,now);if(state.challengeKind==='bonusRps'||state.challengeKind==='memory')checkMemoryGesture(g,now);if(state.challengeKind==='final'&&g==='OPEN PALM'){if(!state.finalPalmSince)state.finalPalmSince=now;if(now-state.finalPalmSince>1000)completeWin();}else if(state.challengeKind==='final')state.finalPalmSince=0;return;}
 const dir=gestureAction(g);
 if(g==='OPEN PALM'){state.heldDirection=null;state.lastAccepted='STOP';$('gestureName').textContent='OPEN PALM — STOP';return;}
 if(dir){if(state.heldDirection!==dir){state.heldDirection=dir;state.repeatAt=now;move(dir);state.repeatAt=now+180;}else if(now>=state.repeatAt){move(dir);state.repeatAt=now+180;}}
 }
function checkFaceChallenge(){if(!state.face||!state.challengeActive)return;const target=faceTargets[state.faceIndex];if(!target)return;if(target.test(state.face)){state.faceIndex++;$('faceTarget').textContent=faceTargets[state.faceIndex]?.emoji||'✅';$('faceProgress').style.width=(state.faceIndex/3*100)+'%';$('faceHint').textContent=state.faceIndex===3?'Ghost defeated!':'Nice! Next expression…';if(state.faceIndex>=3)endChallenge(true);}}

// Recover the last safe maze checkpoint if the tab reloads or the browser briefly interrupts the game.
const SAVE_KEY='escapePathCheckpointV1';let lastCheckpoint=0;
function checkpoint(){
 if(!state.started||state.won)return;
 try{const data={savedAt:Date.now(),level:state.level,pos:state.pos,score:state.score,seconds:state.seconds,keys:state.keys,bonusKeys:state.bonusKeys,doorKey:state.doorKey,exitKeys:state.exitKeys,challengeDone:state.challengeDone,chestDone:state.chestDone,ghostQuizDone:state.ghostQuizDone,bonusGameDone:state.bonusGameDone,secondChestDone:state.secondChestDone,explored:[...state.explored],relics:state.relics,characterPoints:state.characterPoints,characterDone:[...state.characterDone],mute:state.mute};sessionStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){/* Storage may be disabled; keep the game playable. */}
}
function restoreCheckpoint(){
 try{const raw=sessionStorage.getItem(SAVE_KEY);if(!raw)return false;const d=JSON.parse(raw);if(!d||Date.now()-d.savedAt>12*60*60*1000||!Array.isArray(d.pos)||!Array.isArray(d.keys))return false;
 Object.assign(state,{level:clamp(Number(d.level)||0,0,2),pos:d.pos,score:Number(d.score)||0,seconds:Number(d.seconds)||0,started:true,paused:false,won:false,keys:d.keys,bonusKeys:Array.isArray(d.bonusKeys)?d.bonusKeys:[false,false,false],doorKey:!!d.doorKey,exitKeys:Number(d.exitKeys)||0,challengeDone:!!d.challengeDone,chestDone:!!d.chestDone,ghostQuizDone:!!d.ghostQuizDone,bonusGameDone:!!d.bonusGameDone,secondChestDone:!!d.secondChestDone,explored:new Set(d.explored||[]),relics:d.relics||[],characterPoints:d.characterPoints||buildCharacterPoints(),characterDone:new Set(d.characterDone||[]),mute:!!d.mute,challengeActive:false,challengeKind:'',characterTask:null,stream:null,camera:false,hand:null,face:null});
 $('startCard').hidden=true;$('pauseOverlay').hidden=true;$('challenge').hidden=true;$('pauseBtn').textContent='Pause';setStatus('EXPLORING');journal('Welcome back! Your last maze checkpoint was restored.','Continue exploring from where you left off.');lastFrame=performance.now();return true;
 }catch(e){return false;}
}
let lastFrame=0;function loop(now){if(!state.started)return;const dt=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;if(!state.paused&&!state.won){state.seconds+=dt;}if(now-lastCheckpoint>1500){checkpoint();lastCheckpoint=now;}updateUI();draw();requestAnimationFrame(loop);}

function togglePause(){if(!state.started||state.won)return;state.paused=!state.paused;$('pauseOverlay').hidden=!state.paused;$('pauseBtn').textContent=state.paused?'Resume':'Pause';if(state.paused&&levelAudio)levelAudio.pause();if(!state.paused){lastFrame=performance.now();if(!state.mute)startLevelMusic();} }
function restart(){try{sessionStorage.removeItem(SAVE_KEY);}catch(_){}stopCamera();stopLevelMusic();Object.assign(state,{level:0,pos:[1,3],score:0,seconds:0,paused:false,started:false,won:false,keys:[false,false,false],bonusKeys:[false,false,false],doorKey:false,doorHits:0,doorLast:0,doorTarget:null,exitKeys:0,challengeDone:false,chestDone:false,ghostQuizDone:false,bonusGameDone:false,bonusStep:0,bonusGesture:'',bonusSince:0,bonusFaceCount:0,bonusFaceArmed:true,bonusFaceLast:0,bonusSmileSamples:[],bonusSmileBaseline:null,bonusSmileCalibratedAt:0,secondChestDone:false,explored:new Set(),relics:[],lastMove:0,stableGesture:'',lastAccepted:'',heldDirection:null,repeatAt:0,challengeActive:false,level2ComboStage:0,level2Yawns:0,level2YawnArmed:true,level2PoseSince:0,level2LastStageChange:0,snowRetry:false,bonkHits:0,bonkTarget:null,dodgeItems:[],dodgeHits:0,memoryRetry:0,rpsWins:0,rpsRound:0,characterPoints:[],characterDone:new Set(),characterTask:null,characterStep:0,characterGestureConsumed:false,characterHoldSince:0});clearInterval(state.challengeInterval);$('challenge').hidden=true;$('pauseOverlay').hidden=true;$('winOverlay').hidden=true;$('nextLevelOverlay').hidden=true;state.pendingNextLevel=null;$('startCard').hidden=false;$('pauseBtn').textContent='Pause';$('cameraStatus').textContent='Camera is off. Start it to use gestures.';journal('The principal has trapped you in a suspiciously mossy maze. Find the challenge marker.','Find the challenge marker and follow the two silly pose commands to earn the second key.');setStatus('READY');updateUI();draw();}
function showPanel(which){const titles={journal:'Field Journal',hints:'Survival Hints',map:'Scout Map'};const contents={journal:`<p>${$('journalText').textContent}</p><p class="hint-text">${$('journalObjective').textContent}</p>`,hints:'<ul><li>Move only with the webcam hand gestures and walk over glowing ✦ to start a challenge.</li><li>Reach each chest after earning its level key. At the final exit, complete the doorbell challenge to earn the fourth key.</li><li>Thumbs up = up · index = right · fist = down · point left = left.</li><li>Open palm stops movement. Movement is gesture-only: thumbs up = up, index = right, fist = down, point left = left, open palm = stop.</li><li>Keep your hand and face visible in the camera preview.</li></ul>',map:'<p>Green tiles show paths you have explored. Gold marks the exit; the bright dot is you.</p>'};$('modalTitle').textContent=titles[which];$('modalContent').innerHTML=contents[which];$('infoModal').hidden=false;}
$('beginBtn').addEventListener('click',startGame);$('nextLevelBtn').addEventListener('click',beginNextLevel);$('cameraBtn').addEventListener('click',()=>state.camera?stopCamera():startCamera());$('pauseBtn').addEventListener('click',togglePause);$('resumeBtn').addEventListener('click',togglePause);$('restartBtn').addEventListener('click',restart);$('playAgainBtn').addEventListener('click',restart);$('muteBtn').addEventListener('click',()=>{state.mute=!state.mute;$('muteBtn').textContent=state.mute?'🔇':'♫';if(state.mute)stopLevelMusic();else if(state.started&&!state.paused)startLevelMusic();notify(state.mute?'Game audio muted.':'Game audio on.');});$('settingsBtn').addEventListener('click',()=>{ $('modalTitle').textContent='Settings';$('modalContent').innerHTML='<p>Camera: start/stop from the Camera Link panel.</p><p>Movement: webcam hand gestures only. Thumbs up = up, index = right, fist = down, point left = left, open palm = stop.</p><p>Tip: use a bright, even light and keep your hand inside the camera frame.</p>'; $('infoModal').hidden=false;});$('modalClose').addEventListener('click',()=>$('infoModal').hidden=true);$('closeChallenge').addEventListener('click',()=>{notify('Challenge paused. Step off and back onto the glowing marker to retry.');state.challengeActive=false;clearInterval(state.challengeInterval);$('challenge').hidden=true;});document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.panel)));
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.started)togglePause();});window.addEventListener('beforeunload',()=>{checkpoint();stopCamera();});window.addEventListener('pagehide',checkpoint);document.addEventListener('visibilitychange',()=>{if(document.hidden){checkpoint();}else if(state.stream&&state.stream.getVideoTracks().some(t=>t.readyState==='live')){const v=$('cameraVideo');v.play().then(()=>{if(!state.raf)state.raf=requestAnimationFrame(processCamera);}).catch(()=>{$('cameraStatus').textContent='Camera paused by browser. Click the camera button to reconnect.';$('cameraBtn').textContent='RECONNECT CAMERA';});}});
// Public test hooks are intentionally read-only except reset/move helpers for automated logic checks.
window.EscapePath={LEVELS,THEME,maps,state,carveLevel,beginNextLevel,isOpen,buildCharacterPoints,showCharacterTask,handleCharacterGesture,move,openChest,openSecondChest,beginGhostQuiz,beginBonusGame,updateFaceBonus,advancePoseChallenge,endBonusGame,reachExit,beginChallenge,finalChallenge,endChallenge,updateDoorChallenge,playRpsMove,checkMemoryGesture,completeWin,faceFeatures,classifyHand,updateLevel2Combo,advanceLevel2ComboPose,exploredPercent,restart};
const restored=restoreCheckpoint();updateUI();draw();if(restored){requestAnimationFrame(loop);document.addEventListener('click',function resumeAudioOnce(){if(state.started&&!state.mute){startLevelMusic();}document.removeEventListener('click',resumeAudioOnce);},{once:true});}
})();
