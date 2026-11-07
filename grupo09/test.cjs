// Testes de fluxos e restrições; DOM mínimo, sem dependências externas.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes={},handlers={},storage={};
const ctx=vm.createContext({console,URL,URLSearchParams,Date,crypto:require('node:crypto').webcrypto,confirm:()=>true,setTimeout:()=>{},location:{search:'',origin:'https://localhost:8000',pathname:'/prototipo/grupo09/'},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{querySelector:s=>nodes[s]??={innerHTML:'',textContent:'',style:{}},addEventListener:(k,h)=>handlers[k]=h,createElement:()=>({click(){}})},FormData:class{constructor(f){return Object.entries(f.values)[Symbol.iterator]()}},FileReader:class{readAsDataURL(file){this.result='data:text/plain;base64,'+Buffer.from(file.content||'trabalho').toString('base64');this.onload()}}});
vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),data=s=>JSON.parse(JSON.stringify(run(s)));
async function form(action,values={},dataset={},files=[]){await handlers.submit({preventDefault(){},target:{dataset:{form:action,...dataset},values,elements:{file:{files}}}})}
function click(action,dataset={}){handlers.click({target:{closest:()=>({dataset:{action,...dataset}})}})}
const as=(id,course='es')=>run(`db.session=${JSON.stringify(id)};classId=${JSON.stringify(course)};page='class';`);
(async()=>{
assert.equal(data('db.clock'),'2026-11-07T09:00');
// Grupos abertos/fechados, adição direta, aviso ao professor e reorganização.
click('joinGroup',{id:'g1'});assert.deepEqual(data('db.groups[0].members'),['bruno','ana']);
as('bruno');await form('toggleGroup',{open:'no'},{id:'g1'});as('clara');click('joinGroup',{id:'g1'});assert.equal(data('db.groups[0].members.length'),2);
as('bruno');await form('addMember',{student:'clara'},{id:'g1'});assert.equal(data('db.groups[0].members.length'),3);
click('removeMember',{group:'g1',id:'clara'});assert.equal(data('db.removals.length'),1);assert.equal(data('db.emails.length'),0);
as('paulo');await form('createGroup',{name:'Equipe B'});const g2=data('db.groups.at(-1).id');await form('moveMember',{student:'clara',group:g2});assert.equal(data(`db.groups.find(g=>g.id==='${g2}').members[0]`),'clara');
// Prazo comunicado, permissões por turma e modalidade sem documento.
await form('activity',{title:'Teste temporal',description:'Entrega',due:'2026-11-08T09:00',document:'yes'});const a=data('db.activities.at(-1).id');assert.equal(data('db.emails.length'),5);
as('ana');await form('post',{text:'Não permitido'});assert.equal(data('db.posts.length'),1);
// Arquivo de grupo, substituição, feedback preliminar, critérios e nota oficial.
await form('submit',{scope:'group'},{id:a},[{name:'v1.txt',content:'v1'}]);const sid=data('db.submissions.at(-1).id');assert.equal(data('db.submissions.at(-1).students.length'),2);
await form('submit',{}, {id:a},[{name:'v2.txt',content:'v2'}]);assert.equal(data('db.submissions.at(-1).file.name'),'v2.txt');
as('maria');await form('feedback',{text:'Rever os critérios'},{id:sid});assert.equal(data('db.feedbacks.length'),1);
as('paulo');await form('criterion',{name:'Equipe',scope:'group'},{id:a});await form('criterion',{name:'Individual',scope:'individual'},{id:a});let ks=data(`getActivity('${a}').criteria`);
await form('groupGrade',{['criterion_'+ks[0].id]:'7'},{id:a,group:'g1'});await form('grade',{value:'8',['criterion_'+ks[1].id]:'9'},{id:a,student:'ana'});assert.equal(data(`db.grades.find(g=>g.activityId==='${a}').value`),'8');
await form('grade',{value:'9'},{id:a,student:'ana'});assert.equal(data(`db.grades.find(g=>g.activityId==='${a}').value`),'9');
as('ana');await form('requestReview',{text:'Reavaliar contribuição'},{id:a});assert.equal(data('db.reviews.length'),1);
// Após o prazo: substituir sempre bloqueado; nova submissão depende da regra.
click('advance',{hours:'48'});await form('submit',{}, {id:a},[{name:'v3.txt'}]);assert.equal(data('db.submissions.at(-1).file.name'),'v2.txt');
as('clara');await form('submit',{scope:'individual'},{id:a},[{name:'clara.txt'}]);assert.equal(data('db.submissions.length'),1);
as('paulo');await form('settings',{model:'predefined',late:'yes'});as('clara');await form('submit',{scope:'individual'},{id:a},[{name:'clara.txt'}]);assert.equal(data('db.submissions.length'),2);assert.equal(data('db.submissions.at(-1).late'),true);
await form('createGroup',{name:'Proibido'});assert.equal(data('db.groups.length'),3);
// Nota sem documento; perfil contém resultado e controles de revisão.
as('paulo');await form('grade',{value:'10'},{id:'a2',student:'clara'});as('clara');click('page',{page:'profile'});assert.match(nodes['#main'].innerHTML,/10/);
// Monitor por turma, lembretes e fórum público somente no vínculo correspondente.
as('ana','bd');await form('remind',{activity:'a3',text:'Entregar amanhã'});assert.equal(data('db.emails.filter(m=>m.event.includes("Lembrete")).length'),2);
as('ana');await form('question',{title:'Dúvida',text:'Qual formato?'});const q=data('db.questions[0].id');as('maria');await form('answer',{text:'Texto livre'},{id:q});assert.equal(data('db.questions[0].answers.length'),1);
// Cadastro, acesso por link, criação, recuperação e código de uso único.
click('logout');await form('register',{name:'Teste',email:'teste@exemplo.test',reg:'900',password:'abc'});const u=data('db.session');await form('join',{code:'https://localhost:8000/prototipo/grupo09/?join=ES2026'});assert.equal(data(`db.classes[0].roles['${u}']`),'student');
await form('createClass',{name:'Nova disciplina',semester:'2027.1',description:'Teste'});assert.equal(data('role()'),'professor');
click('logout');await form('recover',{email:'teste@exemplo.test'});const token=data('db.tokens.at(-1).token');await form('resetPassword',{token,password:'nova'});await form('login',{email:'teste@exemplo.test',password:'nova'});assert.equal(data('db.session'),u);await form('resetPassword',{token,password:'outra'});assert.equal(data(`db.users.find(u=>u.id==='${u}').password`),'nova');
// Consulta antiga impede mutações. Reinício repõe relógio e mensagens.
as('paulo','old');await form('post',{text:'Proibido'});assert.equal(data('db.posts.length'),1);
click('reset');assert.equal(data('db.clock'),'2026-11-07T09:00');assert.equal(data('db.emails.length'),0);assert.equal(data('db.submissions.length'),0);
console.log('OK — grupos, permissões, convites, prazos, arquivos, atraso, notas, critérios, revisão, fórum, recuperação e reinício.');
})().catch(e=>{console.error(e);process.exitCode=1});
