import { useState, useEffect, createContext, useContext } from "react";
import { LayoutDashboard, Building2, MapPin, FileText, AlertTriangle, FolderOpen, MessageSquare, Bell, LogOut, ChevronLeft, ChevronRight, Plus, Search, Download, Upload, CheckCircle2, Clock, ArrowRight, Activity, TrendingUp, X, Shield, Phone, Send, ArrowUpRight, XCircle, AlertCircle, Briefcase, DollarSign, Eye, Edit, Trash2, Check, Zap, CreditCard, BarChart3, Menu, Users } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "./lib/supabase";

// ── Mapeia enum do banco (snake_case) para o label visual em PT-BR ──
const STATUS_DB_TO_LABEL = {
  solicitado:"Solicitado", cadastrado:"Cadastrado", em_analise:"Em Análise",
  em_diligencia:"Em Diligência", aprovado:"Aprovado", executando:"Executando",
  prestacao_contas:"Prestação de Contas",
};
const STATUS_LABEL_TO_DB = Object.fromEntries(Object.entries(STATUS_DB_TO_LABEL).map(([k,v])=>[v,k]));

// ═══════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════
const T = {
  navy:"#0F0D24", sidebar:"#13112C", violet:"#3D31A0", vLight:"#5146B8",
  gold:"#C8A227", bg:"#F5F4FB", card:"#FFFFFF", text:"#1B1631",
  sub:"#5C5474", muted:"#9992C0", border:"#E3E0F5",
  success:"#059669", warning:"#D97706", error:"#DC2626", info:"#2563EB",
};

const STATUS_MAP = {
  "Solicitado":         {bg:"#F0F0F6",fg:"#5A5B7A",dot:"#A0A0C0"},
  "Cadastrado":         {bg:"#EFF4FF",fg:"#1D4ED8",dot:"#3B82F6"},
  "Em Análise":         {bg:"#FFFBEB",fg:"#936000",dot:"#F59E0B"},
  "Em Diligência":      {bg:"#FFF5EE",fg:"#9A3412",dot:"#F97316"},
  "Aprovado":           {bg:"#EDFFF5",fg:"#15803D",dot:"#22C55E"},
  "Executando":         {bg:"#F5F0FF",fg:"#5B21B6",dot:"#8B5CF6"},
  "Prestação de Contas":{bg:"#EDFBFB",fg:"#0E6E6E",dot:"#14B8A6"},
};
const PRIO_MAP = {
  baixa:{bg:"#EDFFF5",fg:"#14532D",l:"Baixa"},
  media:{bg:"#FFFBEB",fg:"#78350F",l:"Média"},
  alta:{bg:"#FFF5EE",fg:"#9A3412",l:"Alta"},
  urgente:{bg:"#FFF0F0",fg:"#991B1B",l:"Urgente"},
};
const SRC_MAP = {
  ministerio:{l:"Ministério",bg:"#EFF4FF",fg:"#1D4ED8"},
  parlamentar:{l:"Parlamentar",bg:"#F5F0FF",fg:"#6D28D9"},
  interno:{l:"Interno",bg:"#EDFFF5",fg:"#15803D"},
};
const CAT_MAP = {
  plano_trabalho:"Plano de Trabalho", projeto_basico:"Projeto Básico",
  orcamento:"Orçamento", documentacao_tecnica:"Doc. Técnica",
  prestacao_contas:"Prest. de Contas", aprovacao:"Aprovação", outro:"Outro",
};
const PLAN_MAP = {
  active:{bg:"#EDFFF5",fg:"#15803D",l:"Ativo"},
  trial:{bg:"#EFF4FF",fg:"#1D4ED8",l:"Trial"},
  suspended:{bg:"#FFF0F0",fg:"#991B1B",l:"Suspenso"},
  cancelled:{bg:"#F0F0F6",fg:"#5A5B7A",l:"Cancelado"},
};

// ═══════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════
let MUNIS = [
  {id:1,name:"Fortaleza",st:"CE",mayor:"Evandro Leitão",pop:2703391,ibge:"2304400",props:5,phone:"(85) 3105-0250",email:"secretaria@fortaleza.ce.gov.br"},
  {id:2,name:"Sobral",st:"CE",mayor:"Oscar Rodrigues",pop:232645,ibge:"2312908",props:3,phone:"(88) 3677-1400",email:"gabinete@sobral.ce.gov.br"},
  {id:3,name:"Juazeiro do Norte",st:"CE",mayor:"Glêdson Bezerra",pop:285306,ibge:"2307304",props:2,phone:"(88) 3566-4000",email:"prefeitura@juazeiro.ce.gov.br"},
  {id:4,name:"Mossoró",st:"RN",mayor:"Allyson Bezerra",pop:301876,ibge:"2408003",props:4,phone:"(84) 3315-0300",email:"gabinete@mossoro.rn.gov.br"},
  {id:5,name:"Caruaru",st:"PE",mayor:"Rodrigo Pinheiro",pop:356872,ibge:"2603906",props:2,phone:"(81) 3722-6300",email:"prefeitura@caruaru.pe.gov.br"},
  {id:6,name:"Petrolina",st:"PE",mayor:"Simone Fontana",pop:348998,ibge:"2611101",props:3,phone:"(87) 2101-6000",email:"gabinete@petrolina.pe.gov.br"},
  {id:7,name:"Feira de Santana",st:"BA",mayor:"Zé Neto",pop:635924,ibge:"2910800",props:2,phone:"(75) 3612-7000",email:"prefeitura@feira.ba.gov.br"},
  {id:8,name:"Campina Grande",st:"PB",mayor:"Bruno Cunha Lima",pop:412783,ibge:"2504009",props:2,phone:"(83) 2101-1500",email:"gabinete@cg.pb.gov.br"},
];
let PROPS = [
  {id:1,mun:1,num:"PAC-2024-001234",title:"Pavimentação e Drenagem Pluvial — Bairro Centro",min:"Ministério das Cidades",parl:"Sen. Eduardo Girão",status:"Em Análise",gv:2500000,tv:2250000,cv:250000,s:"2024-01-15",e:"2025-06-30",prio:"alta",ass:"Ana Souza"},
  {id:2,mun:1,num:"MEC-2024-005621",title:"Construção de Escola Municipal de Ensino Fundamental",min:"Ministério da Educação",parl:"Dep. Domingos Neto",status:"Aprovado",gv:4800000,tv:4200000,cv:600000,s:"2024-03-01",e:"2026-03-01",prio:"alta",ass:"Carlos Mendes"},
  {id:3,mun:2,num:"MS-2024-008900",title:"Ampliação da UBS — Unidade de Saúde Central",min:"Ministério da Saúde",parl:"Sen. Camilo Santana",status:"Executando",gv:1200000,tv:1100000,cv:100000,s:"2023-07-01",e:"2024-12-31",prio:"media",ass:"Ana Souza"},
  {id:4,mun:3,num:"MAPA-2023-114455",title:"Aquisição de Maquinário Agrícola e Implementos",min:"Min. Agricultura e Pecuária",parl:"Dep. André Figueiredo",status:"Prestação de Contas",gv:890000,tv:800000,cv:90000,s:"2023-01-01",e:"2023-12-31",prio:"baixa",ass:"Carlos Mendes"},
  {id:5,mun:4,num:"MDR-2024-220089",title:"Sistema de Abastecimento de Água — Zona Rural",min:"Min. do Desenvolvimento Regional",parl:"Sen. Rogério Marinho",status:"Em Diligência",gv:3200000,tv:2900000,cv:300000,s:"2024-05-01",e:"2026-05-01",prio:"urgente",ass:"Ana Souza"},
  {id:6,mun:4,num:"MEC-2024-331201",title:"Reforma e Ampliação de Quadra Esportiva Escolar",min:"Ministério da Educação",parl:"Dep. Benes Leocádio",status:"Cadastrado",gv:650000,tv:580000,cv:70000,s:"2024-08-01",e:"2025-08-01",prio:"media",ass:"Carlos Mendes"},
  {id:7,mun:5,num:"MCid-2024-445500",title:"Regularização Fundiária Urbana — Setor Norte",min:"Ministério das Cidades",parl:"Dep. Augusto Coutinho",status:"Solicitado",gv:1800000,tv:1600000,cv:200000,s:null,e:null,prio:"baixa",ass:null},
  {id:8,mun:6,num:"MS-2024-556789",title:"Construção de Centro de Atenção Psicossocial (CAPS)",min:"Ministério da Saúde",parl:"Dep. Simone Morgado",status:"Em Análise",gv:2100000,tv:1900000,cv:200000,s:"2024-09-01",e:"2026-09-01",prio:"alta",ass:"Ana Souza"},
  {id:9,mun:7,num:"MDR-2023-667123",title:"Obras de Contenção de Encostas e Drenagem",min:"Min. do Desenvolvimento Regional",parl:"Dep. Elmar Nascimento",status:"Aprovado",gv:5500000,tv:5000000,cv:500000,s:"2024-02-01",e:"2026-12-31",prio:"urgente",ass:"Carlos Mendes"},
  {id:10,mun:8,num:"MEC-2024-778900",title:"Equipamentos para Laboratório Digital Escolar",min:"Ministério da Educação",parl:"Sen. Veneziano Vital",status:"Executando",gv:980000,tv:900000,cv:80000,s:"2024-04-01",e:"2025-10-01",prio:"media",ass:"Ana Souza"},
];
let DILIG = [
  {id:1,pid:1,pnum:"PAC-2024-001234",ptitle:"Pavimentação e Drenagem Pluvial",title:"Complementação do Plano de Trabalho",desc:"O Ministério solicita complementação do plano de trabalho com detalhamento das etapas de execução e cronograma físico-financeiro atualizado.",src:"ministerio",status:"aberta",prio:"urgente",due:"2026-07-10",by:"CGPROG/MCIDADES"},
  {id:2,pid:5,pnum:"MDR-2024-220089",ptitle:"Sistema de Abastecimento de Água",title:"Documentação Técnica do Projeto de Engenharia",desc:"Apresentar ART/RRT assinada pelo responsável técnico e projeto executivo completo com pranchas cotadas e georreferenciadas.",src:"ministerio",status:"em_andamento",prio:"alta",due:"2026-07-25",by:"DENACOOP/MDR"},
  {id:3,pid:1,pnum:"PAC-2024-001234",ptitle:"Pavimentação e Drenagem Pluvial",title:"Regularização da Contrapartida Municipal",desc:"Enviar Lei Municipal autorizando a contrapartida financeira e extrato bancário demonstrando os recursos disponíveis.",src:"parlamentar",status:"aberta",prio:"alta",due:"2026-08-05",by:"Gab. Sen. Eduardo Girão"},
  {id:4,pid:8,pnum:"MS-2024-556789",ptitle:"Centro de Atenção Psicossocial",title:"Alvará de Construção e Licença Ambiental",desc:"Apresentar alvará de construção expedido pela Prefeitura e licença ambiental prévia emitida pelo órgão competente estadual.",src:"ministerio",status:"aberta",prio:"media",due:"2026-08-20",by:"DAPES/MS"},
  {id:5,pid:3,pnum:"MS-2024-008900",ptitle:"Ampliação da UBS",title:"Relatório Fotográfico de Execução",desc:"Enviar relatório fotográfico georeferenciado das obras executadas conforme cronograma físico aprovado.",src:"interno",status:"respondida",prio:"media",due:"2025-06-15",by:"Equipe SOMMA"},
];
let DOCS = [
  {id:1,pid:2,name:"Plano de Trabalho v3.0 — Escola Municipal.pdf",cat:"plano_trabalho",sz:"2,4 MB",by:"Carlos Mendes",at:"2024-06-01"},
  {id:2,pid:2,name:"Projeto Básico Arquitetônico.pdf",cat:"projeto_basico",sz:"8,7 MB",by:"Ana Souza",at:"2024-06-05"},
  {id:3,pid:2,name:"Orçamento Detalhado SINAPI Jun-2024.xlsx",cat:"orcamento",sz:"512 KB",by:"Carlos Mendes",at:"2024-06-08"},
  {id:4,pid:1,name:"Plano de Trabalho — Pavimentação Centro.pdf",cat:"plano_trabalho",sz:"1,8 MB",by:"Ana Souza",at:"2024-05-20"},
  {id:5,pid:5,name:"ART Engenheiro Civil — Marcos Viana.pdf",cat:"documentacao_tecnica",sz:"340 KB",by:"Carlos Mendes",at:"2024-06-22"},
  {id:6,pid:9,name:"Ofício de Aprovação MDR-0456-2024.pdf",cat:"aprovacao",sz:"180 KB",by:"Carlos Mendes",at:"2024-05-12"},
  {id:7,pid:4,name:"Prestação de Contas Final — MAPA-2023.pdf",cat:"prestacao_contas",sz:"5,1 MB",by:"Ana Souza",at:"2024-03-28"},
];
let MSGS = [
  {id:1,from:"Administração SOMMA",subj:"Novas Funcionalidades — Módulo de Relatórios",body:"Foram liberadas novas funcionalidades na plataforma SOMMA. O módulo de relatórios agora conta com exportação em PDF e Excel, além de filtros avançados por período e ministério. Acesse o menu Relatórios para conferir.",at:"2024-06-25",read:false},
  {id:2,from:"Administração SOMMA",subj:"⚠️ Alerta: Prazo de Diligência se Aproximando",body:"A diligência 'Complementação do Plano de Trabalho' referente à proposta PAC-2024-001234 vence em 5 dias. Acesse o módulo de Diligências para providenciar o atendimento dentro do prazo estipulado.",at:"2024-06-23",read:true},
  {id:3,from:"Administração SOMMA",subj:"Renovação do Plano Profissional — 30 dias",body:"Seu plano Profissional expira em 30 dias. Para garantir a continuidade dos serviços sem interrupção, entre em contato com nossa equipe comercial para condições especiais de renovação.",at:"2024-06-20",read:false},
];
let NOTIFS0 = [
  {id:1,type:"diligency_opened",title:"Nova Diligência Aberta",body:"PAC-2024-001234 · Complementação do Plano de Trabalho",read:false,at:new Date(Date.now()-3600000)},
  {id:2,type:"status_change",title:"Status Atualizado",body:"MDR-2023-667123 mudou para Aprovado",read:false,at:new Date(Date.now()-7200000)},
  {id:3,type:"deadline_approaching",title:"Prazo Crítico",body:"Diligência vence em 5 dias — Pavimentação Bairro Centro",read:true,at:new Date(Date.now()-86400000)},
  {id:4,type:"document_uploaded",title:"Documento Adicionado",body:"ART Engenheiro Civil adicionada à proposta MDR-2024",read:true,at:new Date(Date.now()-172800000)},
  {id:5,type:"proposal_approved",title:"Proposta Aprovada! 🎉",body:"MDR-2023-667123 foi aprovada pelo Ministério",read:true,at:new Date(Date.now()-259200000)},
];
let TENANTS = [
  {id:1,name:"Escritório Projetos Nordeste Ltda",type:"escritorio",cnpj:"12.345.678/0001-90",city:"Fortaleza",st:"CE",plan:"Profissional",ps:"active",props:15,munis:8},
  {id:2,name:"OSC Desenvolvimento Sustentável",type:"osc",cnpj:"23.456.789/0001-01",city:"Recife",st:"PE",plan:"Básico",ps:"trial",props:6,munis:3},
  {id:3,name:"Consultoria Municipal do Sertão",type:"escritorio",cnpj:"34.567.890/0001-12",city:"Mossoró",st:"RN",plan:"Profissional",ps:"suspended",props:8,munis:5},
];

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
const F = {
  cur: v => v==null ? "—" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0}).format(v),
  dt:  d => d ? new Date(d).toLocaleDateString("pt-BR") : "—",
  ago: d => { const m=Math.floor((Date.now()-new Date(d))/60000); return m<60?`${m}min atrás`:m<1440?`${Math.floor(m/60)}h atrás`:`${Math.floor(m/1440)}d atrás`; },
  ini: n => (n||"").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()||"?",
  num: v => new Intl.NumberFormat("pt-BR").format(v||0),
};

// ═══════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════
const App = createContext(null);
const useApp = () => useContext(App);

// ═══════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════
function SBadge({s}) {
  const c=STATUS_MAP[s]||{bg:"#F0F0F6",fg:"#5A5B7A",dot:"#A0A0C0"};
  return <span style={{background:c.bg,color:c.fg,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{s}
  </span>;
}
function PBadge({p}) {
  const c=PRIO_MAP[p]||PRIO_MAP.media;
  return <span style={{background:c.bg,color:c.fg,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.l}</span>;
}
function SrcBadge({s}) {
  const c=SRC_MAP[s]||{l:s,bg:"#F0F0F6",fg:"#5A5B7A"};
  return <span style={{background:c.bg,color:c.fg,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{c.l}</span>;
}
function PlBadge({ps}) {
  const c=PLAN_MAP[ps]||PLAN_MAP.cancelled;
  return <span style={{background:c.bg,color:c.fg,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:600}}>{c.l}</span>;
}
function Av({name,size=32,bg=T.violet}) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*.35,flexShrink:0}}>{F.ini(name)}</div>;
}
function KPI({title,value,sub,Icon,color=T.violet}) {
  return <div style={{background:T.card,borderRadius:12,padding:"18px 20px",border:`1px solid ${T.border}`,boxShadow:"0 1px 4px rgba(20,16,50,.05)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontSize:10.5,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:".7px"}}>{title}</span>
      <div style={{width:34,height:34,borderRadius:9,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={16} color={color}/></div>
    </div>
    <div style={{fontSize:28,fontWeight:900,color:T.text,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:11,color:T.muted,marginTop:4}}>{sub}</div>}
  </div>;
}
function Empty({Icon,title,desc,btn,onBtn}) {
  return <div style={{textAlign:"center",padding:"44px 20px"}}>
    <div style={{width:52,height:52,borderRadius:14,background:`${T.violet}12`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Icon size={22} color={T.violet}/></div>
    <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:5}}>{title}</div>
    {desc && <div style={{fontSize:12.5,color:T.sub,marginBottom:btn?16:0}}>{desc}</div>}
    {btn && <button onClick={onBtn} style={{background:T.violet,color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{btn}</button>}
  </div>;
}
function Toast({msg,type="success",onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  const C={success:{bg:"#F0FDF4",b:"#86EFAC",c:"#166534"},error:{bg:"#FEF2F2",b:"#FCA5A5",c:"#991B1B"},info:{bg:"#EFF4FF",b:"#93C5FD",c:"#1E3A5F"}};
  const s=C[type]||C.success;
  return <div style={{background:s.bg,border:`1px solid ${s.b}`,color:s.c,padding:"12px 18px",borderRadius:11,boxShadow:"0 8px 32px rgba(0,0,0,.15)",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:10,minWidth:280,maxWidth:400,animation:"si .3s ease",fontFamily:"Inter,system-ui,sans-serif"}}>
    {type==="success"&&<CheckCircle2 size={16}/>}{type==="error"&&<XCircle size={16}/>}{type==="info"&&<AlertCircle size={16}/>}
    <span style={{flex:1}}>{msg}</span>
    <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",padding:2,fontFamily:"inherit"}}><X size={13}/></button>
  </div>;
}
function Modal({title,children,onClose,w=480}) {
  return <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(10,8,28,.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
    <div style={{background:T.card,borderRadius:16,width:"100%",maxWidth:w,maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 64px rgba(10,8,28,.3)",fontFamily:"Inter,system-ui,sans-serif"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"17px 22px",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontWeight:700,fontSize:15,color:T.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,padding:4}}><X size={16}/></button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div>;
}
function Btn({children,onClick,v="primary",sz="md",I,disabled=false,style:s={}}) {
  const VS={primary:{background:T.violet,color:"#fff",border:"none"},outline:{background:"transparent",color:T.violet,border:`1.5px solid ${T.violet}`},ghost:{background:"transparent",color:T.sub,border:"none"},danger:{background:"#FEF2F2",color:"#991B1B",border:"1.5px solid #FCA5A5"},gold:{background:T.gold,color:"#1B1631",border:"none"}};
  const SS={md:{padding:"8px 16px",fontSize:13,borderRadius:8},sm:{padding:"5px 11px",fontSize:12,borderRadius:7}};
  return <button onClick={onClick} disabled={disabled} style={{...VS[v]||VS.primary,...SS[sz]||SS.md,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.55:1,display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",...s}}>
    {I&&<I size={sz==="sm"?12:14}/>}{children}
  </button>;
}
function Inp({label,value,onChange,placeholder="",type="text",required=false,error,rows}) {
  const base={width:"100%",border:`1.5px solid ${error?"#FCA5A5":T.border}`,borderRadius:8,padding:"9px 13px",fontSize:13,color:T.text,background:"#fff",outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"};
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:12,fontWeight:600,color:T.sub}}>{label}{required&&<span style={{color:"#DC2626"}}> *</span>}</label>}
    {rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={base}/>:<input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base}/>}
    {error&&<span style={{fontSize:11.5,color:"#DC2626"}}>{error}</span>}
  </div>;
}
function Sel({label,value,onChange,options=[],placeholder="Selecione...",required=false}) {
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<label style={{fontSize:12,fontWeight:600,color:T.sub}}>{label}{required&&<span style={{color:"#DC2626"}}> *</span>}</label>}
    <select value={value} onChange={onChange} style={{width:"100%",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"9px 13px",fontSize:13,color:value?T.text:T.muted,background:"#fff",outline:"none",fontFamily:"inherit"}}>
      <option value="">{placeholder}</option>
      {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>;
}

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════
const NAV_TENANT = [
  {id:"dashboard",I:LayoutDashboard,l:"Dashboard"},
  {id:"municipalities",I:MapPin,l:"Municípios"},
  {id:"proposals",I:FileText,l:"Propostas"},
  {id:"diligencies",I:AlertTriangle,l:"Diligências",b:"dil"},
  {id:"documents",I:FolderOpen,l:"Documentos"},
  {id:"communications",I:MessageSquare,l:"Comunicações",b:"msg"},
];
const NAV_ADMIN = [
  {id:"admin",I:LayoutDashboard,l:"Dashboard"},
  {id:"admin-tenants",I:Building2,l:"Escritórios / OSCs"},
  {id:"municipalities",I:MapPin,l:"Municípios"},
  {id:"proposals",I:FileText,l:"Propostas"},
  {id:"diligencies",I:AlertTriangle,l:"Diligências"},
  {id:"communications",I:MessageSquare,l:"Comunicações"},
  {id:"admin-plans",I:CreditCard,l:"Planos"},
];

function Sidebar({col,setCol}) {
  const {pg,go,user,nu} = useApp();
  const isA = user?.role==="super_admin";
  const items = isA ? NAV_ADMIN : NAV_TENANT;
  const bd = {dil:DILIG.filter(d=>d.status==="aberta").length, msg:MSGS.filter(m=>!m.read).length};

  return <aside style={{width:col?60:224,background:T.sidebar,display:"flex",flexDirection:"column",height:"100vh",flexShrink:0,transition:"width .22s",position:"relative",overflow:"hidden"}}>
    {/* Logo */}
    <div style={{padding:col?"14px 10px":"14px 15px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:9,justifyContent:col?"center":"flex-start",minHeight:58}}>
      <div style={{width:34,height:34,borderRadius:9,background:T.violet,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 0 2px ${T.gold}55`,fontStyle:"italic",fontWeight:900,color:"#fff",fontSize:16}}>∑</div>
      {!col && <div>
        <div style={{color:"#fff",fontWeight:900,fontSize:16,letterSpacing:".5px",lineHeight:1}}>SOMMA<span style={{color:T.gold}}>.IO</span></div>
        <div style={{color:"rgba(180,175,230,.45)",fontSize:9.5,fontWeight:500,marginTop:1}}>Gestão de Recursos</div>
      </div>}
    </div>

    {/* Role tag */}
    {!col && <div style={{padding:"8px 12px 2px"}}>
      <span style={{background:isA?`${T.gold}22`:`${T.violet}40`,color:isA?T.gold:"rgba(200,190,255,.85)",fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",padding:"3px 9px",borderRadius:6}}>
        {isA?"⚡ Admin Geral":user?.role==="tenant_admin"?"Administrador":"Membro"}
      </span>
    </div>}

    {/* Nav */}
    <nav style={{flex:1,padding:col?"8px 5px":"8px",overflowY:"auto"}}>
      {items.map(item=>{
        const act=pg===item.id;
        return <div key={item.id} onClick={()=>go(item.id)} className="sli" style={{display:"flex",alignItems:"center",gap:col?0:9,padding:col?"9px":"7px 10px",borderRadius:9,cursor:"pointer",marginBottom:2,background:act?`${T.gold}22`:"transparent",color:act?T.gold:"rgba(205,200,255,.62)",transition:"background .13s",position:"relative",justifyContent:col?"center":"flex-start"}}>
          <item.I size={17} style={{flexShrink:0,color:act?T.gold:"rgba(195,190,245,.6)"}}/>
          {!col && <>
            <span style={{fontSize:13,fontWeight:act?700:500,flex:1,whiteSpace:"nowrap"}}>{item.l}</span>
            {item.b&&bd[item.b]>0&&<span style={{background:"#DC2626",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:999,lineHeight:"16px"}}>{bd[item.b]}</span>}
          </>}
          {col&&item.b&&bd[item.b]>0&&<span style={{position:"absolute",top:5,right:5,width:6,height:6,borderRadius:"50%",background:"#DC2626"}}/>}
        </div>;
      })}
    </nav>

    {/* Bottom */}
    <div style={{borderTop:"1px solid rgba(255,255,255,.07)",padding:col?"8px 5px":"8px"}}>
      <div onClick={()=>go("notifications")} className="sli" style={{display:"flex",alignItems:"center",gap:9,padding:col?"9px":"7px 10px",borderRadius:9,cursor:"pointer",color:"rgba(195,190,245,.55)",marginBottom:3,justifyContent:col?"center":"flex-start",position:"relative"}}>
        <Bell size={15} style={{flexShrink:0}}/>
        {!col&&<span style={{fontSize:13,fontWeight:500,flex:1}}>Notificações</span>}
        {!col&&nu>0&&<span style={{background:"#DC2626",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:999}}>{nu}</span>}
        {col&&nu>0&&<span style={{position:"absolute",top:5,right:5,width:6,height:6,borderRadius:"50%",background:"#DC2626"}}/>}
      </div>
      <div onClick={()=>go("profile")} className="sli" style={{display:"flex",alignItems:"center",gap:9,padding:col?"9px":"7px 10px",borderRadius:9,cursor:"pointer",justifyContent:col?"center":"flex-start"}}>
        <Av name={user?.name} size={26}/>
        {!col&&<div style={{flex:1,overflow:"hidden"}}>
          <div style={{color:"rgba(235,230,255,.88)",fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name}</div>
          <div style={{color:"rgba(165,160,215,.5)",fontSize:10.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email}</div>
        </div>}
      </div>
    </div>

    <button onClick={()=>setCol(!col)} style={{position:"absolute",top:"50%",right:-11,transform:"translateY(-50%)",width:22,height:22,borderRadius:"50%",background:T.navy,border:"2px solid rgba(255,255,255,.12)",color:"rgba(195,190,245,.7)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
      {col?<ChevronRight size={10}/>:<ChevronLeft size={10}/>}
    </button>
  </aside>;
}

// ═══════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════
const PT={dashboard:"Dashboard",proposals:"Propostas",municipalities:"Municípios",diligencies:"Diligências",documents:"Documentos",communications:"Comunicações",notifications:"Notificações",profile:"Meu Perfil",admin:"Painel Admin","admin-tenants":"Escritórios / OSCs","admin-plans":"Planos","proposal-detail":"Detalhes da Proposta","proposal-form":"Nova Proposta"};

function Layout({children}) {
  const {pg,go,user,nu}=useApp();
  const [col,setCol]=useState(false);
  return <div style={{display:"flex",height:"100vh",background:T.bg}}>
    <Sidebar col={col} setCol={setCol}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
      <header style={{height:54,background:T.card,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 18px",gap:12,flexShrink:0}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:T.muted,fontSize:11.5}}>SOMMA</span>
          <ChevronRight size={11} color={T.muted}/>
          <span style={{fontSize:13,fontWeight:700,color:T.text}}>{PT[pg]||"..."}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <button onClick={()=>go("notifications")} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:7,borderRadius:8,color:T.sub}}>
            <Bell size={16}/>{nu>0&&<span style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:"#DC2626"}}/>}
          </button>
          <div onClick={()=>go("profile")} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 9px 4px 4px",borderRadius:8,cursor:"pointer",border:`1px solid ${T.border}`,marginLeft:3}}>
            <Av name={user?.name} size={26}/><span style={{fontSize:12.5,fontWeight:600,color:T.text}}>{(user?.name||"").split(" ")[0]}</span>
          </div>
        </div>
      </header>
      <main style={{flex:1,overflowY:"auto"}}>{children}</main>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════
function LoginForm() {
  const [email,setEmail]=useState("admin@somma.io");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async (e)=>{
    e.preventDefault();
    setErr(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
    // Sucesso: o listener onAuthStateChange no App root cuida do redirecionamento
  };

  return <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:10,minWidth:260}}>
    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
      style={{padding:"9px 13px",borderRadius:8,border:"1.5px solid rgba(195,190,255,.25)",background:"rgba(255,255,255,.06)",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
    <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha"
      style={{padding:"9px 13px",borderRadius:8,border:"1.5px solid rgba(195,190,255,.25)",background:"rgba(255,255,255,.06)",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
    {err && <span style={{color:"#FCA5A5",fontSize:11.5}}>{err}</span>}
    <button type="submit" disabled={loading} style={{background:T.gold,color:"#1B1631",border:"none",padding:"9px 20px",borderRadius:8,fontWeight:700,fontSize:13,cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,fontFamily:"inherit"}}>
      {loading?"Entrando...":"Entrar"}
    </button>
  </form>;
}

function Landing() {
  const feats=[["📄","Gestão de Propostas","Ciclo completo do cadastro à prestação de contas."],["⚠️","Diligências em Tempo Real","Alertas automáticos e resposta dentro do prazo."],["📍","Municípios Organizados","Centralize informações de todos os clientes."],["📁","Gestão Documental","Organize documentos de cada proposta com segurança."],["🔔","Alertas Automáticos","Notificações de prazos e abertura de diligências."],["📊","Dashboards Analíticos","KPIs e volume financeiro em tempo real."]];
  return <div style={{background:"#fff",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
    <header style={{background:T.sidebar,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:34,height:34,borderRadius:9,background:T.violet,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 0 2px ${T.gold}55`,fontStyle:"italic",fontWeight:900,color:"#fff",fontSize:15}}>∑</div>
        <span style={{color:"#fff",fontWeight:900,fontSize:17,letterSpacing:".5px"}}>SOMMA<span style={{color:T.gold}}>.IO</span></span>
      </div>
      <LoginForm/>
    </header>
    <section style={{background:`linear-gradient(140deg,${T.sidebar} 0%,#1E1545 55%,#2D1E70 100%)`,padding:"72px 40px 60px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",right:-40,top:-40,width:380,height:380,borderRadius:"50%",background:`${T.violet}35`,filter:"blur(60px)"}}/>
      <div style={{maxWidth:680,position:"relative"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${T.gold}20`,border:`1px solid ${T.gold}40`,color:T.gold,padding:"4px 13px",borderRadius:999,fontSize:11,fontWeight:700,letterSpacing:".5px",marginBottom:20}}>
          <Zap size={10}/> PLATAFORMA DE GESTÃO DE RECURSOS PÚBLICOS
        </div>
        <h1 style={{fontSize:42,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:18,letterSpacing:"-.5px"}}>Transforme a gestão<br/><span style={{color:T.gold}}>de recursos públicos</span><br/>do seu município</h1>
        <p style={{fontSize:16,color:"rgba(195,190,255,.7)",lineHeight:1.7,marginBottom:32,maxWidth:520}}>A plataforma completa para escritórios e OSCs que atuam com captação via Transferegov — do cadastro à prestação de contas.</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button onClick={()=>document.getElementById("hero-email")?.focus()} style={{background:T.gold,color:"#1B1631",fontWeight:700,fontSize:13.5,padding:"12px 26px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>Começar gratuitamente <ArrowRight size={15}/></button>
          <button onClick={()=>document.getElementById("hero-email")?.focus()} style={{background:"transparent",color:"rgba(195,190,255,.8)",border:"1.5px solid rgba(195,190,255,.25)",fontSize:13.5,padding:"12px 22px",borderRadius:9,cursor:"pointer",fontFamily:"inherit"}}>Ver demonstração</button>
        </div>
        <div style={{display:"flex",gap:36,marginTop:48,flexWrap:"wrap"}}>
          {[["500+","Municípios atendidos"],["R$ 2B+","em recursos gerenciados"],["98%","satisfação dos clientes"]].map(([v,l])=>
            <div key={v}><div style={{fontSize:26,fontWeight:900,color:"#fff"}}>{v}</div><div style={{fontSize:11.5,color:"rgba(180,175,230,.6)",fontWeight:500}}>{l}</div></div>
          )}
        </div>
      </div>
    </section>
    <section style={{padding:"64px 40px",background:"#FAFAFE"}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <span style={{fontSize:11,fontWeight:700,color:T.violet,textTransform:"uppercase",letterSpacing:"1.5px"}}>Funcionalidades</span>
        <h2 style={{fontSize:30,fontWeight:900,color:T.text,marginTop:9}}>Tudo que seu escritório precisa</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20,maxWidth:880,margin:"0 auto"}}>
        {feats.map(([ic,t,d])=><div key={t} style={{background:"#fff",borderRadius:13,padding:"22px 20px",border:`1px solid ${T.border}`}}>
          <div style={{width:42,height:42,borderRadius:11,background:`${T.violet}12`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:13,fontSize:18}}>{ic}</div>
          <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:6}}>{t}</div>
          <div style={{fontSize:12.5,color:T.sub,lineHeight:1.6}}>{d}</div>
        </div>)}
      </div>
    </section>
    <section style={{background:`linear-gradient(135deg,${T.violet},${T.navy})`,padding:"52px 40px",textAlign:"center"}}>
      <h2 style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:10}}>Pronto para começar?</h2>
      <p style={{fontSize:14,color:"rgba(195,190,255,.7)",marginBottom:28}}>Experimente gratuitamente por 14 dias. Sem cartão de crédito.</p>
      <button onClick={()=>document.getElementById("hero-email")?.focus()} style={{background:T.gold,color:"#1B1631",fontWeight:700,fontSize:13.5,padding:"12px 30px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit"}}>Criar conta gratuita</button>
    </section>
    <footer style={{background:T.sidebar,padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{color:"rgba(175,170,225,.4)",fontSize:11.5}}>© 2024 SOMMA.IO — Todos os direitos reservados</span>
      <span style={{color:"rgba(175,170,225,.4)",fontSize:11.5}}>Fortaleza, CE — Brasil</span>
    </footer>
  </div>;
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
function Dashboard() {
  const {user,go}=useApp();
  const tot=PROPS.reduce((a,p)=>a+p.gv,0);
  const aprov=PROPS.filter(p=>p.status==="Aprovado").length;
  const od=DILIG.filter(d=>d.status==="aberta").length;
  const sd=Object.entries(PROPS.reduce((a,p)=>{a[p.status]=(a[p.status]||0)+1;return a;},{})).map(([name,value])=>({name,value,color:(STATUS_MAP[name]||{dot:"#aaa"}).dot}));
  const md=Object.entries(PROPS.reduce((a,p)=>{const k=p.min.replace(/^(Min\. |Ministério |Ministério d[aoe] )/,"").split(" ")[0];a[k]=(a[k]||0)+p.gv/1e6;return a;},{})).map(([name,value])=>({name,value:+value.toFixed(1)}));
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div><h1 style={{fontSize:21,fontWeight:900,color:T.text,marginBottom:3}}>Olá, {(user?.name||"").split(" ")[0]} 👋</h1><p style={{fontSize:12.5,color:T.sub}}>{user?.tenant}</p></div>
      <div style={{display:"flex",gap:8}}><Btn v="outline" I={MapPin} sz="sm" onClick={()=>go("municipalities")}>Municípios</Btn><Btn I={Plus} sz="sm" onClick={()=>go("proposal-form")}>Nova Proposta</Btn></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      <KPI title="Municípios" value={MUNIS.length} sub="clientes ativos" Icon={MapPin} color="#2563EB"/>
      <KPI title="Propostas" value={PROPS.length} sub="cadastradas" Icon={FileText} color={T.violet}/>
      <KPI title="Aprovadas" value={aprov} sub="com êxito" Icon={CheckCircle2} color="#059669"/>
      <KPI title="Diligências" value={od} sub="em aberto" Icon={AlertTriangle} color="#D97706"/>
    </div>
    <div style={{background:`linear-gradient(135deg,${T.violet},${T.vLight})`,borderRadius:13,padding:"20px 26px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 6px 28px ${T.violet}45`}}>
      <div><div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontWeight:500,marginBottom:5}}>Valor Total Gerenciado</div><div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-.5px"}}>{F.cur(tot)}</div><div style={{fontSize:11.5,color:"rgba(255,255,255,.4)",marginTop:4}}>em {PROPS.length} propostas ativas</div></div>
      <TrendingUp size={52} color="rgba(255,255,255,.12)"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={{background:T.card,borderRadius:13,padding:"18px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:13}}>Propostas por Status</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <ResponsiveContainer width={130} height={130}>
            <PieChart><Pie data={sd} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={2} dataKey="value">{sd.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
          </ResponsiveContainer>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            {sd.map(s=><div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:s.color,flexShrink:0}}/><span style={{fontSize:10.5,color:T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:95}}>{s.name}</span></div>
              <span style={{fontSize:12,fontWeight:700,color:T.text}}>{s.value}</span>
            </div>)}
          </div>
        </div>
      </div>
      <div style={{background:T.card,borderRadius:13,padding:"18px 20px",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:13}}>
          <span style={{fontWeight:700,fontSize:13,color:T.text}}>Diligências em Aberto</span>
          <button onClick={()=>go("diligencies")} style={{background:"none",border:"none",cursor:"pointer",color:T.violet,fontSize:11.5,fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>Ver todas <ArrowRight size={10}/></button>
        </div>
        {DILIG.filter(d=>d.status!=="respondida").length===0 ? <Empty Icon={CheckCircle2} title="Tudo em dia!"/> :
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {DILIG.filter(d=>d.status!=="respondida").slice(0,3).map(d=><div key={d.id} onClick={()=>go("diligencies")} style={{display:"flex",gap:9,padding:"9px 11px",borderRadius:9,border:`1px solid ${T.border}`,cursor:"pointer",background:T.bg}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:d.prio==="urgente"?"#DC2626":d.prio==="alta"?"#F97316":"#F59E0B",marginTop:5,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.title}</div><div style={{display:"flex",gap:6,marginTop:3}}><PBadge p={d.prio}/><span style={{fontSize:10.5,color:T.muted,display:"flex",alignItems:"center",gap:2}}><Clock size={9}/>{F.dt(d.due)}</span></div></div>
            </div>)}
          </div>}
      </div>
    </div>
    <div style={{background:T.card,borderRadius:13,padding:"18px 20px",border:`1px solid ${T.border}`,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:13}}>Volume por Ministério (R$ milhões)</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={md} margin={{left:0,right:0,top:0,bottom:0}}>
          <XAxis dataKey="name" tick={{fontSize:10,fill:T.sub}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:10,fill:T.sub}} axisLine={false} tickLine={false} width={26}/>
          <Tooltip formatter={v=>`R$ ${v}M`} contentStyle={{borderRadius:7,border:`1px solid ${T.border}`,fontSize:11.5,fontFamily:"Inter,system-ui,sans-serif"}}/>
          <Bar dataKey="value" fill={T.violet} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontWeight:700,fontSize:13,color:T.text,display:"flex",alignItems:"center",gap:6}}><Activity size={13} color={T.violet}/>Propostas Recentes</span>
        <button onClick={()=>go("proposals")} style={{background:"none",border:"none",cursor:"pointer",color:T.violet,fontSize:11.5,fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>Ver todas<ArrowRight size={10}/></button>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#FAFAFE",borderBottom:`1px solid ${T.border}`}}>{["Número","Título / Município","Repasse","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 14px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".5px"}}>{h}</th>)}</tr></thead>
        <tbody>{PROPS.slice(0,5).map(p=>{const m=MUNIS.find(x=>x.id===p.mun);return(
          <tr key={p.id} onClick={()=>go("proposal-detail",{id:p.id})} className="trow" style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
            <td style={{padding:"10px 14px",fontSize:11.5,fontWeight:700,color:T.violet,whiteSpace:"nowrap"}}>{p.num}</td>
            <td style={{padding:"10px 14px"}}><div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:190}}>{p.title}</div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{m?.name} — {m?.st}</div></td>
            <td style={{padding:"10px 14px",fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>{F.cur(p.tv)}</td>
            <td style={{padding:"10px 14px"}}><SBadge s={p.status}/></td>
          </tr>
        );})}</tbody>
      </table>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// PROPOSALS
// ═══════════════════════════════════════════════════════
function Proposals() {
  const {go}=useApp();
  const [q,setQ]=useState(""); const [sf,setSf]=useState(""); const [mf,setMf]=useState("");
  const fil=PROPS.filter(p=>{const s=q.toLowerCase();return(!q||p.title.toLowerCase().includes(s)||p.num.toLowerCase().includes(s)||p.parl.toLowerCase().includes(s))&&(!sf||p.status===sf)&&(!mf||p.min===mf);});
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Propostas</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Gerencie todas as propostas dos municípios</p></div>
      <Btn I={Plus} onClick={()=>go("proposal-form")}>Nova Proposta</Btn>
    </div>
    <div style={{background:T.card,borderRadius:11,padding:"11px 15px",border:`1px solid ${T.border}`,marginBottom:16,display:"flex",gap:9,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{flex:"1 1 220px",position:"relative"}}><Search size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.muted}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por título, número ou parlamentar..." style={{width:"100%",padding:"8px 10px 8px 30px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12.5,color:T.text,background:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
      <select value={sf} onChange={e=>setSf(e.target.value)} style={{padding:"8px 12px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12.5,color:sf?T.text:T.muted,background:"#fff",outline:"none",fontFamily:"inherit"}}><option value="">Todos os status</option>{[...new Set(PROPS.map(p=>p.status))].map(s=><option key={s}>{s}</option>)}</select>
      <select value={mf} onChange={e=>setMf(e.target.value)} style={{padding:"8px 12px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12.5,color:mf?T.text:T.muted,background:"#fff",outline:"none",fontFamily:"inherit"}}><option value="">Todos os ministérios</option>{[...new Set(PROPS.map(p=>p.min))].map(m=><option key={m}>{m}</option>)}</select>
      {(q||sf||mf)&&<button onClick={()=>{setQ("");setSf("");setMf("");}} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:12,fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><X size={10}/>Limpar</button>}
      <span style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>{fil.length} resultado{fil.length!==1?"s":""}</span>
    </div>
    <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      {fil.length===0 ? <Empty Icon={FileText} title="Nenhuma proposta encontrada" desc="Tente outros filtros." btn="Nova Proposta" onBtn={()=>go("proposal-form")}/> :
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead style={{background:"#FAFAFE"}}><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Número","Título / Município","Ministério","Repasse","Prioridade","Status",""].map(h=><th key={h} style={{textAlign:"left",padding:"10px 13px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{fil.map(p=>{const m=MUNIS.find(x=>x.id===p.mun);return(
          <tr key={p.id} className="trow" style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>go("proposal-detail",{id:p.id})}>
            <td style={{padding:"11px 13px",whiteSpace:"nowrap"}}><span style={{fontSize:11.5,fontWeight:700,color:T.violet}}>{p.num}</span></td>
            <td style={{padding:"11px 13px",maxWidth:200}}><div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{m?.name} — {m?.st}</div></td>
            <td style={{padding:"11px 13px",fontSize:11.5,color:T.sub,maxWidth:140,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.min}</td>
            <td style={{padding:"11px 13px",fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>{F.cur(p.tv)}</td>
            <td style={{padding:"11px 13px"}}><PBadge p={p.prio}/></td>
            <td style={{padding:"11px 13px"}}><SBadge s={p.status}/></td>
            <td style={{padding:"11px 13px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",gap:3}}><button onClick={()=>go("proposal-detail",{id:p.id})} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,padding:4,borderRadius:5,display:"flex"}}><Eye size={12}/></button><button style={{background:"none",border:"none",cursor:"pointer",color:T.sub,padding:4,borderRadius:5,display:"flex"}}><Edit size={12}/></button></div></td>
          </tr>
        );})}</tbody>
      </table>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// PROPOSAL DETAIL
// ═══════════════════════════════════════════════════════
function ProposalDetail({id}) {
  const {go,toast}=useApp();
  const p=PROPS.find(x=>x.id===id)||PROPS[0];
  const m=MUNIS.find(x=>x.id===p?.mun);
  const dils=DILIG.filter(d=>d.pid===p?.id);
  const docs=DOCS.filter(d=>d.pid===p?.id);
  const [modal,setModal]=useState(false); const [ns,setNs]=useState("");
  const tl=[{to:"Solicitado",by:"Carlos Mendes",at:"2024-01-10",note:"Proposta criada no sistema."},{to:"Cadastrado",by:"Carlos Mendes",at:"2024-01-15",note:"Cadastrado no Transferegov."},{to:p?.status,by:"Ana Souza",at:"2024-02-01",note:"Status atualizado conforme análise ministerial."}];
  if(!p) return <Empty Icon={FileText} title="Proposta não encontrada"/>;
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:16}}>
      <button onClick={()=>go("proposals")} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",alignItems:"center",gap:3,fontSize:12.5,fontFamily:"inherit"}}><ArrowRight size={12} style={{transform:"rotate(180deg)"}}/>Propostas</button>
      <ChevronRight size={11} color={T.muted}/><span style={{fontSize:12.5,fontWeight:600,color:T.text}}>{p.num}</span>
    </div>
    <div style={{background:T.card,borderRadius:13,padding:"20px 24px",border:`1px solid ${T.border}`,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9,flexWrap:"wrap"}}><SBadge s={p.status}/><PBadge p={p.prio}/><span style={{fontSize:11,color:T.muted,fontWeight:700}}>{p.num}</span></div>
          <h1 style={{fontSize:18,fontWeight:900,color:T.text,lineHeight:1.3,marginBottom:9}}>{p.title}</h1>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:4}}><MapPin size={11}/>{m?.name} — {m?.st}</span>
            <span style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:4}}><Briefcase size={11}/>{p.min}</span>
            <span style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:4}}><Shield size={11}/>{p.parl}</span>
          </div>
        </div>
        <Btn v="outline" I={ArrowUpRight} sz="sm" onClick={()=>setModal(true)}>Alterar Status</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
        {[["Valor Global",F.cur(p.gv)],["Repasse Federal",F.cur(p.tv)],["Contrapartida",F.cur(p.cv)],["Vigência",`${F.dt(p.s)} → ${F.dt(p.e)}`],["Responsável",p.ass||"Não atribuído"]].map(([l,v])=>
          <div key={l}><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:T.text}}>{v}</div></div>
        )}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
      <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:12,display:"flex",justifyContent:"space-between"}}><span>Diligências ({dils.length})</span><Btn v="ghost" sz="sm" onClick={()=>go("diligencies")}>Ver</Btn></div>
        {dils.length===0?<Empty Icon={AlertTriangle} title="Sem diligências"/>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{dils.map(d=><div key={d.id} style={{padding:"9px 12px",borderRadius:9,border:`1px solid ${T.border}`,background:T.bg}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:T.text}}>{d.title}</span><PBadge p={d.prio}/></div><div style={{display:"flex",gap:6}}><SrcBadge s={d.src}/><span style={{fontSize:10.5,color:T.muted}}>Vence: {F.dt(d.due)}</span></div></div>)}</div>}
      </div>
      <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:12,display:"flex",justifyContent:"space-between"}}><span>Documentos ({docs.length})</span><Btn v="ghost" sz="sm" onClick={()=>go("documents")}>Ver</Btn></div>
        {docs.length===0?<Empty Icon={FolderOpen} title="Sem documentos"/>:<div style={{display:"flex",flexDirection:"column",gap:7}}>{docs.map(d=><div key={d.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg}}><div style={{width:28,height:28,borderRadius:7,background:`${T.violet}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><FolderOpen size={12} color={T.violet}/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:11.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</div><div style={{fontSize:10.5,color:T.muted}}>{d.sz} · {F.dt(d.at)}</div></div><button style={{background:"none",border:"none",cursor:"pointer",color:T.violet,display:"flex"}}><Download size={12}/></button></div>)}</div>}
      </div>
    </div>
    <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
      <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:14}}>Histórico de Status</div>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:10,top:10,bottom:0,width:2,background:T.border}}/>
        {tl.map((t,i)=><div key={i} style={{display:"flex",gap:13,marginBottom:14,position:"relative"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:i===tl.length-1?T.violet:T.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,border:`2px solid ${T.card}`}}>{i===tl.length-1?<Check size={10} color="#fff"/>:<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}</div>
          <div style={{flex:1,paddingTop:1}}><div style={{marginBottom:2}}><SBadge s={t.to}/></div><div style={{fontSize:12,color:T.sub}}>{t.note}</div><div style={{fontSize:10.5,color:T.muted,marginTop:2}}>{t.by} · {F.dt(t.at)}</div></div>
        </div>)}
      </div>
    </div>
    {modal&&<Modal title="Alterar Status da Proposta" onClose={()=>setModal(false)}>
      <div style={{marginBottom:14}}><p style={{fontSize:12.5,color:T.sub,marginBottom:12}}>Status atual: <SBadge s={p.status}/></p><Sel label="Novo Status" value={ns} onChange={e=>setNs(e.target.value)} required options={["Solicitado","Cadastrado","Em Análise","Em Diligência","Aprovado","Executando","Prestação de Contas"].map(s=>({v:s,l:s}))} placeholder="Selecione..."/></div>
      <Inp label="Observações" placeholder="Descreva o motivo..." rows={3} value="" onChange={()=>{}}/>
      <div style={{display:"flex",gap:9,marginTop:16,justifyContent:"flex-end"}}><Btn v="ghost" onClick={()=>setModal(false)}>Cancelar</Btn><Btn disabled={!ns} onClick={async ()=>{
        const dbStatus = STATUS_LABEL_TO_DB[ns] || ns;
        const { error } = await supabase.from("proposals").update({ status: dbStatus }).eq("id", p.id);
        if (error) { toast("Erro ao atualizar status: "+error.message, "error"); return; }
        const idx = PROPS.findIndex(x=>x.id===p.id); if (idx>-1) PROPS[idx].status = ns;
        toast("Status atualizado com sucesso!","success"); setModal(false);
      }}>Salvar</Btn></div>
    </Modal>}
  </div>;
}

// ═══════════════════════════════════════════════════════
// MUNICIPALITIES
// ═══════════════════════════════════════════════════════
function Municipalities() {
  const {toast,user}=useApp();
  const [q,setQ]=useState(""); const [modal,setModal]=useState(false);
  const [form,setForm]=useState({name:"",st:"",mayor:"",ibge:"",email:"",phone:""});
  const UF=["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
  const fil=MUNIS.filter(m=>{const s=q.toLowerCase();return !q||m.name.toLowerCase().includes(s)||m.st.toLowerCase().includes(s)||m.mayor.toLowerCase().includes(s);});
  const save=async ()=>{
    if(!form.name||!form.st)return;
    const { data, error } = await supabase.from("municipalities").insert({
      tenant_id: user.tenant_id, name: form.name, state: form.st, ibge_code: form.ibge||null,
      mayor: form.mayor||null, email: form.email||null, phone: form.phone||null,
    }).select().single();
    if (error) { toast("Erro ao cadastrar: "+error.message, "error"); return; }
    MUNIS.push({id:data.id, name:data.name, st:data.state, mayor:data.mayor||"—", pop:0, ibge:data.ibge_code||"—", props:0, phone:data.phone||"—"});
    toast("Município cadastrado com sucesso!","success");setModal(false);setForm({name:"",st:"",mayor:"",ibge:"",email:"",phone:""});
  };
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Municípios</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Municípios clientes do escritório</p></div><Btn I={Plus} onClick={()=>setModal(true)}>Novo Município</Btn></div>
    <div style={{background:T.card,borderRadius:11,padding:"11px 15px",border:`1px solid ${T.border}`,marginBottom:16,display:"flex",gap:9,alignItems:"center"}}><div style={{flex:1,position:"relative"}}><Search size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.muted}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome, estado ou prefeito..." style={{width:"100%",padding:"8px 10px 8px 30px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12.5,color:T.text,background:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div><span style={{fontSize:11.5,color:T.muted}}>{fil.length} município{fil.length!==1?"s":""}</span></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))",gap:13}}>
      {fil.map(m=><div key={m.id} className="hcard" style={{background:T.card,borderRadius:13,padding:"18px",border:`1px solid ${T.border}`,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:11}}><div><div style={{fontWeight:900,fontSize:15.5,color:T.text}}>{m.name}</div><div style={{fontSize:12.5,color:T.sub,fontWeight:700,marginTop:2}}>{m.st}</div></div><span style={{background:`${T.violet}12`,color:T.violet,padding:"3px 9px",borderRadius:7,fontSize:11.5,fontWeight:700}}>{m.props} prop.</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <div style={{fontSize:12,color:T.text}}><span style={{color:T.sub,fontWeight:600}}>Prefeito: </span>{m.mayor}</div>
          <div style={{fontSize:12,color:T.sub}}>IBGE: {m.ibge} · {F.num(m.pop)} hab.</div>
          <div style={{fontSize:11.5,color:T.muted,display:"flex",alignItems:"center",gap:3,marginTop:3}}><Phone size={10}/>{m.phone}</div>
        </div>
      </div>)}
    </div>
    {modal&&<Modal title="Cadastrar Município" onClose={()=>setModal(false)} w={500}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:4}}>
        <div style={{gridColumn:"1/-1"}}><Inp label="Nome do Município" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Fortaleza" required/></div>
        <Sel label="Estado (UF)" value={form.st} onChange={e=>setForm({...form,st:e.target.value})} required options={UF.map(s=>({v:s,l:s}))} placeholder="Selecione..."/>
        <Inp label="Código IBGE" value={form.ibge} onChange={e=>setForm({...form,ibge:e.target.value})} placeholder="0000000"/>
        <div style={{gridColumn:"1/-1"}}><Inp label="Prefeito(a)" value={form.mayor} onChange={e=>setForm({...form,mayor:e.target.value})} placeholder="Nome completo"/></div>
        <Inp label="E-mail" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="prefeitura@municipio.gov.br"/>
        <Inp label="Telefone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(00) 0000-0000"/>
      </div>
      <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:14}}><Btn v="ghost" onClick={()=>setModal(false)}>Cancelar</Btn><Btn disabled={!form.name||!form.st} onClick={save}>Salvar</Btn></div>
    </Modal>}
  </div>;
}

// ═══════════════════════════════════════════════════════
// DILIGENCIES
// ═══════════════════════════════════════════════════════
function Diligencies() {
  const {toast}=useApp();
  const [tab,setTab]=useState("all"); const [rid,setRid]=useState(null); const [resp,setResp]=useState("");
  const tabs=[{v:"all",l:"Todas"},{v:"aberta",l:"Abertas"},{v:"em_andamento",l:"Em Andamento"},{v:"respondida",l:"Respondidas"}];
  const fil=tab==="all"?DILIG:DILIG.filter(d=>d.status===tab);
  const urg=DILIG.filter(d=>d.status==="aberta"&&d.prio==="urgente").length;
  const dv=d=>Math.ceil((new Date(d)-new Date())/86400000);
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Diligências</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Gerencie e responda as diligências</p></div>
      {urg>0&&<div style={{background:"#FFF0F0",border:"1px solid #FCA5A5",borderRadius:9,padding:"7px 13px",display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={12} color="#DC2626"/><span style={{fontSize:12,fontWeight:700,color:"#991B1B"}}>{urg} urgente{urg>1?"s":""}</span></div>}
    </div>
    <div style={{display:"flex",gap:3,background:T.card,borderRadius:9,padding:3,border:`1px solid ${T.border}`,marginBottom:16,width:"fit-content"}}>
      {tabs.map(t=><button key={t.v} onClick={()=>setTab(t.v)} style={{padding:"6px 13px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.v?T.violet:"transparent",color:tab===t.v?"#fff":T.sub,transition:"all .15s",fontFamily:"inherit"}}>{t.l}</button>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {fil.length===0?<div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`}}><Empty Icon={CheckCircle2} title="Nenhuma diligência"/></div>:
        [...fil].sort((a,b)=>({urgente:0,alta:1,media:2,baixa:3}[a.prio]-{urgente:0,alta:1,media:2,baixa:3}[b.prio])).map(d=>{const v=dv(d.due);const ov=v<0;const cl=v<=5&&v>=0;return(
          <div key={d.id} style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1.5px solid ${ov?"#FCA5A5":cl?"#FDE68A":T.border}`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:9,flexWrap:"wrap",gap:9}}>
              <div style={{flex:1,minWidth:180}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}><PBadge p={d.prio}/><SrcBadge s={d.src}/><span style={{fontSize:10.5,color:T.muted,fontWeight:700}}>#{d.pnum}</span></div><div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>{d.title}</div><div style={{fontSize:12,color:T.sub}}>{d.ptitle}</div></div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:11.5,color:ov?"#DC2626":cl?"#D97706":T.sub,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Clock size={10}/>{ov?`Atrasado ${Math.abs(v)}d`:cl?`Vence em ${v}d`:F.dt(d.due)}</span>
                {d.status!=="respondida"?<Btn I={Send} sz="sm" onClick={()=>setRid(d.id)}>Responder</Btn>:<span style={{fontSize:11.5,color:"#15803D",fontWeight:600,background:"#EDFFF5",padding:"3px 9px",borderRadius:6,display:"flex",alignItems:"center",gap:3}}><CheckCircle2 size={10}/>Respondida</span>}
              </div>
            </div>
            <p style={{fontSize:12.5,color:T.sub,lineHeight:1.65,background:T.bg,padding:"9px 12px",borderRadius:8}}>{d.desc}</p>
            <div style={{fontSize:11,color:T.muted,marginTop:7}}>Solicitado por: <strong style={{color:T.sub}}>{d.by}</strong></div>
          </div>
        );})}
    </div>
    {rid&&<Modal title="Responder Diligência" onClose={()=>setRid(null)} w={520}>{DILIG.find(d=>d.id===rid)&&<>
      <div style={{background:T.bg,borderRadius:9,padding:"12px 14px",marginBottom:13}}><div style={{fontSize:12.5,fontWeight:700,color:T.text,marginBottom:3}}>{DILIG.find(d=>d.id===rid).title}</div><div style={{fontSize:12,color:T.sub}}>{DILIG.find(d=>d.id===rid).desc}</div></div>
      <Inp label="Resposta *" value={resp} onChange={e=>setResp(e.target.value)} placeholder="Descreva as providências tomadas..." rows={5} required/>
      <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:16}}><Btn v="ghost" onClick={()=>setRid(null)}>Cancelar</Btn><Btn I={Send} disabled={!resp.trim()} onClick={async ()=>{
        const { error } = await supabase.from("diligencies").update({ response: resp, status: "respondida", responded_at: new Date().toISOString() }).eq("id", rid);
        if (error) { toast("Erro ao enviar resposta: "+error.message, "error"); return; }
        const idx = DILIG.findIndex(x=>x.id===rid); if (idx>-1) DILIG[idx].status="respondida";
        toast("Resposta enviada com sucesso!","success");setRid(null);setResp("");
      }}>Enviar</Btn></div>
    </>}</Modal>}
  </div>;
}

// ═══════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════
function Documents() {
  const {toast}=useApp();
  const [cat,setCat]=useState(""); const [drag,setDrag]=useState(false);
  const fil=cat?DOCS.filter(d=>d.cat===cat):DOCS;
  const cats=[...new Set(DOCS.map(d=>d.cat))];
  const ex=n=>n.split(".").pop().toLowerCase();
  const ec={pdf:"#DC2626",xlsx:"#166534",docx:"#1D4ED8"};
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Documentos</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Documentos vinculados às propostas</p></div><Btn I={Upload} onClick={()=>toast("Upload disponível em breve!","info")}>Upload</Btn></div>
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);toast("Arquivo recebido!","success");}} style={{background:drag?`${T.violet}07`:T.card,borderRadius:13,border:`2px dashed ${drag?T.violet:T.border}`,padding:"26px",textAlign:"center",marginBottom:16,transition:"all .2s",cursor:"pointer"}}>
      <Upload size={20} color={drag?T.violet:T.muted} style={{margin:"0 auto 8px"}}/><div style={{fontSize:13,fontWeight:600,color:drag?T.violet:T.text}}>Arraste arquivos aqui ou clique para selecionar</div><div style={{fontSize:11.5,color:T.muted,marginTop:3}}>PDF, DOCX, XLSX — máx. 50 MB</div>
    </div>
    <div style={{background:T.card,borderRadius:11,padding:"10px 14px",border:`1px solid ${T.border}`,marginBottom:16,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:11.5,color:T.sub,fontWeight:700}}>Filtrar:</span>
      {[{v:"",l:"Todos"},...cats.map(c=>({v:c,l:CAT_MAP[c]||c}))].map(o=><button key={o.v} onClick={()=>setCat(o.v)} style={{padding:"4px 12px",borderRadius:6,border:`1.5px solid ${cat===o.v?T.violet:T.border}`,cursor:"pointer",fontSize:11.5,fontWeight:600,background:cat===o.v?`${T.violet}12`:"transparent",color:cat===o.v?T.violet:T.sub,transition:"all .15s",fontFamily:"inherit"}}>{o.l}</button>)}
      <span style={{fontSize:11,color:T.muted,marginLeft:"auto"}}>{fil.length} arquivo{fil.length!==1?"s":""}</span>
    </div>
    <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      {fil.length===0?<Empty Icon={FolderOpen} title="Nenhum documento"/>:
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead style={{background:"#FAFAFE"}}><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Arquivo","Categoria","Proposta","Tamanho","Enviado por","Data",""].map(h=><th key={h} style={{textAlign:"left",padding:"9px 13px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".5px"}}>{h}</th>)}</tr></thead>
        <tbody>{fil.map(d=>{const e=ex(d.name);const pr=PROPS.find(p=>p.id===d.pid);return(
          <tr key={d.id} className="trow" style={{borderBottom:`1px solid ${T.border}`}}>
            <td style={{padding:"10px 13px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:7,background:`${ec[e]||T.violet}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:8.5,fontWeight:800,color:ec[e]||T.violet,textTransform:"uppercase"}}>{e}</div><span style={{fontSize:12,color:T.text,maxWidth:150,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>{d.name}</span></div></td>
            <td style={{padding:"10px 13px",fontSize:11.5,color:T.sub}}>{CAT_MAP[d.cat]||d.cat}</td>
            <td style={{padding:"10px 13px",fontSize:11.5,color:T.violet,fontWeight:700}}>{pr?.num||"—"}</td>
            <td style={{padding:"10px 13px",fontSize:11.5,color:T.sub}}>{d.sz}</td>
            <td style={{padding:"10px 13px",fontSize:11.5,color:T.sub}}>{d.by}</td>
            <td style={{padding:"10px 13px",fontSize:11.5,color:T.sub,whiteSpace:"nowrap"}}>{F.dt(d.at)}</td>
            <td style={{padding:"10px 13px"}}><div style={{display:"flex",gap:3}}><button onClick={()=>toast("Download iniciado!","success")} style={{background:"none",border:"none",cursor:"pointer",color:T.violet,padding:3,borderRadius:5,display:"flex"}}><Download size={12}/></button><button onClick={()=>toast("Arquivo removido.","info")} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",padding:3,borderRadius:5,display:"flex"}}><Trash2 size={12}/></button></div></td>
          </tr>
        );})}
        </tbody>
      </table>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// COMMUNICATIONS
// ═══════════════════════════════════════════════════════
function Communications() {
  const {toast}=useApp();
  const [sel,setSel]=useState(MSGS[0]); const [compose,setCompose]=useState(false);
  const [nm,setNm]=useState({subj:"",body:""});
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Comunicações</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>{MSGS.filter(m=>!m.read).length} mensagens não lidas</p></div><Btn I={Send} onClick={()=>setCompose(true)}>Nova Mensagem</Btn></div>
    <div style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:13,height:490}}>
      <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,background:"#FAFAFE"}}><span style={{fontSize:10.5,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:".5px"}}>Caixa de Entrada</span></div>
        <div style={{flex:1,overflowY:"auto"}}>{MSGS.map(m=><div key={m.id} onClick={()=>setSel(m)} style={{padding:"12px 13px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",background:sel?.id===m.id?`${T.violet}08`:m.read?"transparent":"#FAFAFE",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Av name={m.from} size={24}/><span style={{fontSize:12,fontWeight:m.read?500:700,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.from}</span><span style={{fontSize:10.5,color:T.muted}}>{F.dt(m.at)}</span></div>
          <div style={{fontSize:11.5,fontWeight:m.read?400:600,color:m.read?T.sub:T.text,marginLeft:31,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.subj}</div>
          {!m.read&&<div style={{position:"absolute",top:"50%",right:13,transform:"translateY(-50%)",width:6,height:6,borderRadius:"50%",background:T.violet}}/>}
        </div>)}</div>
      </div>
      <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
        {sel?<>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:9}}>{sel.subj}</div><div style={{display:"flex",alignItems:"center",gap:9}}><Av name={sel.from} size={28}/><div><span style={{fontSize:12.5,fontWeight:600,color:T.text}}>{sel.from}</span><span style={{fontSize:11.5,color:T.muted,marginLeft:7}}>{F.dt(sel.at)}</span></div></div></div>
          <div style={{flex:1,padding:"20px",overflowY:"auto"}}><p style={{fontSize:13.5,color:T.text,lineHeight:1.75}}>{sel.body}</p></div>
          <div style={{padding:"13px 20px",borderTop:`1px solid ${T.border}`}}><Btn v="outline" I={Send} sz="sm" onClick={()=>toast("Função de resposta em breve.","info")}>Responder</Btn></div>
        </>:<Empty Icon={MessageSquare} title="Selecione uma mensagem"/>}
      </div>
    </div>
    {compose&&<Modal title="Nova Mensagem" onClose={()=>setCompose(false)} w={500}>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <Inp label="Assunto *" value={nm.subj} onChange={e=>setNm({...nm,subj:e.target.value})} placeholder="Assunto" required/>
        <Inp label="Mensagem *" value={nm.body} onChange={e=>setNm({...nm,body:e.target.value})} placeholder="Digite sua mensagem..." rows={6} required/>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn v="ghost" onClick={()=>setCompose(false)}>Cancelar</Btn><Btn I={Send} disabled={!nm.subj||!nm.body} onClick={()=>{toast("Mensagem enviada!","success");setCompose(false);setNm({subj:"",body:""});}}>Enviar</Btn></div>
      </div>
    </Modal>}
  </div>;
}

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════
function Admin() {
  const {go}=useApp();
  const pd=[{name:"Profissional",value:2,color:T.violet},{name:"Básico",value:1,color:"#22C55E"}];
  return <div style={{padding:22}}>
    <div style={{marginBottom:20}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:5,background:`${T.gold}20`,border:`1px solid ${T.gold}40`,color:T.gold,padding:"3px 11px",borderRadius:6,fontSize:10.5,fontWeight:700,marginBottom:9}}>⚡ MODO ADMIN GERAL</div>
      <h1 style={{fontSize:21,fontWeight:900,color:T.text}}>Painel Administrativo</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Visão global da plataforma SOMMA.IO</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      <KPI title="Escritórios" value={TENANTS.length} sub="cadastrados" Icon={Building2} color={T.violet}/>
      <KPI title="Municípios" value={MUNIS.length} sub="atendidos" Icon={MapPin} color="#2563EB"/>
      <KPI title="Propostas" value={PROPS.length} sub="na plataforma" Icon={FileText} color="#059669"/>
      <KPI title="Volume Total" value="R$ 23,6M" sub="sob gestão" Icon={DollarSign} color="#D97706"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
      <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:13,display:"flex",justifyContent:"space-between"}}>Escritórios / OSCs<Btn v="ghost" sz="sm" onClick={()=>go("admin-tenants")}>Ver todos</Btn></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{TENANTS.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1px solid ${T.border}`,background:T.bg}}><Av name={t.name} size={34} bg={t.type==="osc"?"#059669":T.violet}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}</div><div style={{fontSize:11,color:T.sub}}>{t.city} — {t.st} · {t.props} prop.</div></div><PlBadge ps={t.ps}/></div>)}</div>
      </div>
      <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:13}}>Distribuição por Plano</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
          <ResponsiveContainer width={120} height={120}><PieChart><Pie data={pd} cx="50%" cy="50%" innerRadius={33} outerRadius={55} dataKey="value">{pd.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>{pd.map(p=><div key={p.name} style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:9,height:9,borderRadius:"50%",background:p.color}}/><span style={{fontSize:12.5,color:T.sub}}>{p.name}</span><span style={{fontWeight:800,color:T.text,marginLeft:3}}>{p.value}</span></div>)}</div>
        </div>
        <div style={{background:T.bg,borderRadius:9,padding:"12px 15px",marginTop:13,textAlign:"center"}}><div style={{fontSize:11.5,color:T.sub}}>Receita Mensal Estimada</div><div style={{fontSize:21,fontWeight:900,color:T.text,marginTop:3}}>R$ 2.890,00</div></div>
      </div>
    </div>
    <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <div style={{padding:"13px 18px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:13,color:T.text}}>Últimas Propostas</div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead style={{background:"#FAFAFE"}}><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Número","Título","Ministério","Valor","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 13px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".5px"}}>{h}</th>)}</tr></thead>
        <tbody>{PROPS.slice(0,6).map(p=><tr key={p.id} className="trow" style={{borderBottom:`1px solid ${T.border}`}}><td style={{padding:"9px 13px",fontSize:11.5,fontWeight:700,color:T.violet}}>{p.num}</td><td style={{padding:"9px 13px",fontSize:12,color:T.text,maxWidth:190,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</td><td style={{padding:"9px 13px",fontSize:11.5,color:T.sub,maxWidth:120,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.min}</td><td style={{padding:"9px 13px",fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>{F.cur(p.tv)}</td><td style={{padding:"9px 13px"}}><SBadge s={p.status}/></td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// ADMIN TENANTS
// ═══════════════════════════════════════════════════════
function AdminTenants() {
  const {toast}=useApp();
  return <div style={{padding:22}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Escritórios / OSCs</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>Gerencie todos os tenants</p></div><Btn I={Plus} onClick={()=>toast("Escritório criado!","success")}>Novo Escritório</Btn></div>
    <div style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead style={{background:"#FAFAFE"}}><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Escritório / OSC","CNPJ","Localização","Plano","Status","Props","Ações"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 13px",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".5px"}}>{h}</th>)}</tr></thead>
        <tbody>{TENANTS.map(t=><tr key={t.id} className="trow" style={{borderBottom:`1px solid ${T.border}`}}>
          <td style={{padding:"12px 13px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><Av name={t.name} size={32} bg={t.type==="osc"?"#059669":T.violet}/><div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{t.name}</div><div style={{fontSize:11,color:T.muted}}>{t.type==="osc"?"OSC":"Escritório"}</div></div></div></td>
          <td style={{padding:"12px 13px",fontSize:12,color:T.sub,fontFamily:"monospace"}}>{t.cnpj}</td>
          <td style={{padding:"12px 13px",fontSize:12,color:T.sub}}>{t.city} — {t.st}</td>
          <td style={{padding:"12px 13px",fontSize:12.5,fontWeight:600,color:T.text}}>{t.plan}</td>
          <td style={{padding:"12px 13px"}}><PlBadge ps={t.ps}/></td>
          <td style={{padding:"12px 13px",fontSize:12.5,fontWeight:700,color:T.text,textAlign:"center"}}>{t.props}</td>
          <td style={{padding:"12px 13px"}}><div style={{display:"flex",gap:3}}><button style={{background:"none",border:"none",cursor:"pointer",color:T.violet,padding:3,display:"flex"}}><Eye size={12}/></button><button style={{background:"none",border:"none",cursor:"pointer",color:T.sub,padding:3,display:"flex"}}><Edit size={12}/></button>{t.ps!=="suspended"&&<button onClick={()=>toast("Escritório suspenso.","error")} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",padding:3,display:"flex"}}><XCircle size={12}/></button>}</div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════
function Notifications() {
  const {toast,setNu}=useApp();
  const [ns,setNs]=useState(NOTIFS0);
  const NICONS={status_change:Activity,diligency_opened:AlertTriangle,deadline_approaching:Clock,new_message:MessageSquare,document_uploaded:FolderOpen,proposal_approved:CheckCircle2};
  const NCOLORS={status_change:T.violet,diligency_opened:"#D97706",deadline_approaching:"#DC2626",new_message:"#2563EB",document_uploaded:"#059669",proposal_approved:"#059669"};
  return <div style={{padding:22,maxWidth:640}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <div><h1 style={{fontSize:19,fontWeight:900,color:T.text}}>Notificações</h1><p style={{fontSize:12.5,color:T.sub,marginTop:2}}>{ns.filter(n=>!n.read).length} não lidas</p></div>
      <Btn v="outline" sz="sm" onClick={()=>{setNs(n=>n.map(x=>({...x,read:true})));setNu(0);toast("Todas lidas.","success");}}>Marcar todas como lidas</Btn>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {ns.map(n=>{const Icon=NICONS[n.type]||Bell;const color=NCOLORS[n.type]||T.violet;return(
        <div key={n.id} onClick={()=>setNs(x=>x.map(a=>a.id===n.id?{...a,read:true}:a))} style={{background:n.read?T.card:`${T.violet}06`,borderRadius:11,padding:"12px 16px",border:`1.5px solid ${n.read?T.border:`${T.violet}22`}`,cursor:"pointer",display:"flex",alignItems:"flex-start",gap:10,transition:"all .15s"}}>
          <div style={{width:36,height:36,borderRadius:9,background:`${color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={15} color={color}/></div>
          <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:13,fontWeight:n.read?600:700,color:T.text}}>{n.title}</span><span style={{fontSize:10.5,color:T.muted}}>{F.ago(n.at)}</span></div><div style={{fontSize:12,color:T.sub}}>{n.body}</div></div>
          {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:T.violet,flexShrink:0,marginTop:5}}/>}
        </div>
      );})}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════
function Profile() {
  const {user,setUser,go,toast,signOut}=useApp();
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:""});
  return <div style={{padding:22,maxWidth:500}}>
    <h1 style={{fontSize:19,fontWeight:900,color:T.text,marginBottom:16}}>Meu Perfil</h1>
    <div style={{background:T.card,borderRadius:13,padding:"24px",border:`1px solid ${T.border}`,marginBottom:13}}>
      <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}><Av name={user?.name} size={54} bg={T.violet}/><div><div style={{fontSize:17,fontWeight:900,color:T.text}}>{user?.name}</div><div style={{fontSize:12.5,color:T.sub,marginTop:2}}>{user?.role==="super_admin"?"Admin da Plataforma":user?.role==="tenant_admin"?"Admin do Escritório":"Membro"}</div><div style={{fontSize:11.5,color:T.muted,marginTop:2}}>{user?.tenant}</div></div></div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        <Inp label="Nome completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <Inp label="E-mail" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
        <Inp label="Telefone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(00) 00000-0000"/>
      </div>
      <div style={{display:"flex",gap:9}}><Btn I={CheckCircle2} onClick={()=>{setUser({...user,name:form.name});toast("Perfil atualizado!","success");}}>Salvar</Btn><Btn v="danger" I={LogOut} onClick={signOut}>Sair</Btn></div>
    </div>
    <div style={{background:T.card,borderRadius:13,padding:"16px 20px",border:`1px solid ${T.border}`}}>
      <div style={{fontSize:12.5,fontWeight:700,color:T.text,marginBottom:9}}>Sessão</div>
      {[["Último acesso","Hoje, 09:24"],["Plano atual","Profissional"],["Conta criada","01/01/2024"],["Nível",user?.role==="super_admin"?"Admin Geral":"Tenant Admin"]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12.5,color:T.sub}}>{l}</span><span style={{fontSize:12.5,fontWeight:600,color:T.text}}>{v}</span></div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// PROPOSAL FORM
// ═══════════════════════════════════════════════════════
function ProposalForm() {
  const {go,toast,user}=useApp();
  const [form,setForm]=useState({num:"",title:"",obj:"",min:"",parl:"",gv:"",tv:"",cv:"",mun:"",prio:"media",notes:""});
  const [err,setErr]=useState({});
  const mins=["Ministério das Cidades","Ministério da Educação","Ministério da Saúde","Min. Agricultura e Pecuária","Min. do Desenvolvimento Regional"].map(m=>({v:m,l:m}));
  const val=()=>{const e={};if(!form.title)e.title="Obrigatório";if(!form.mun)e.mun="Obrigatório";if(!form.min)e.min="Obrigatório";setErr(e);return !Object.keys(e).length;};
  const submit=async ()=>{
    if(!val())return;
    const { data, error } = await supabase.from("proposals").insert({
      tenant_id: user.tenant_id, municipality_id: form.mun, number: form.num||null, title: form.title,
      object: form.obj||null, ministry: form.min, parliamentarian: form.parl||null,
      global_value: Number(form.gv)||0, transfer_value: Number(form.tv)||0, counterpart_value: Number(form.cv)||0,
      status: "solicitado", priority: form.prio, notes: form.notes||null, created_by: user.id,
    }).select().single();
    if (error) { toast("Erro ao cadastrar proposta: "+error.message, "error"); return; }
    PROPS.unshift({id:data.id, mun:data.municipality_id, num:data.number||"—", title:data.title, min:data.ministry,
      parl:data.parliamentarian||"—", status:"Solicitado", gv:Number(data.global_value)||0, tv:Number(data.transfer_value)||0,
      cv:Number(data.counterpart_value)||0, s:data.start_date, e:data.end_date, prio:data.priority, ass:null});
    toast("Proposta cadastrada com sucesso!","success");go("proposals");
  };
  return <div style={{padding:22,maxWidth:680}}>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:16}}><button onClick={()=>go("proposals")} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",alignItems:"center",gap:3,fontSize:12.5,fontFamily:"inherit"}}><ArrowRight size={12} style={{transform:"rotate(180deg)"}}/>Propostas</button><ChevronRight size={11} color={T.muted}/><span style={{fontSize:12.5,fontWeight:600,color:T.text}}>Nova Proposta</span></div>
    <div style={{background:T.card,borderRadius:13,padding:"24px",border:`1px solid ${T.border}`}}>
      <div style={{fontWeight:900,fontSize:15,color:T.text,marginBottom:20,paddingBottom:13,borderBottom:`1px solid ${T.border}`}}>Cadastrar Nova Proposta</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
        <Inp label="Número da Proposta" value={form.num} onChange={e=>setForm({...form,num:e.target.value})} placeholder="Ex: PAC-2024-001234"/>
        <Sel label="Município *" value={form.mun} onChange={e=>setForm({...form,mun:e.target.value})} required options={MUNIS.map(m=>({v:m.id,l:`${m.name} — ${m.st}`}))} placeholder="Selecione..."/>
        <div style={{gridColumn:"1/-1"}}><Inp label="Título da Proposta *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Título completo" required error={err.title}/></div>
        <div style={{gridColumn:"1/-1"}}><Inp label="Objeto" value={form.obj} onChange={e=>setForm({...form,obj:e.target.value})} placeholder="Descreva o objeto..." rows={3}/></div>
        <Sel label="Ministério *" value={form.min} onChange={e=>setForm({...form,min:e.target.value})} required options={mins} placeholder="Selecione..."/>
        <Inp label="Parlamentar" value={form.parl} onChange={e=>setForm({...form,parl:e.target.value})} placeholder="Nome do parlamentar"/>
        <Inp label="Valor Global (R$)" value={form.gv} onChange={e=>setForm({...form,gv:e.target.value})} placeholder="0,00"/>
        <Inp label="Valor do Repasse (R$)" value={form.tv} onChange={e=>setForm({...form,tv:e.target.value})} placeholder="0,00"/>
        <Inp label="Contrapartida (R$)" value={form.cv} onChange={e=>setForm({...form,cv:e.target.value})} placeholder="0,00"/>
        <Sel label="Prioridade" value={form.prio} onChange={e=>setForm({...form,prio:e.target.value})} options={[{v:"baixa",l:"Baixa"},{v:"media",l:"Média"},{v:"alta",l:"Alta"},{v:"urgente",l:"Urgente"}]}/>
        <div style={{gridColumn:"1/-1"}}><Inp label="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Observações gerais..." rows={3}/></div>
      </div>
      <div style={{display:"flex",gap:9,marginTop:20,justifyContent:"flex-end",borderTop:`1px solid ${T.border}`,paddingTop:16}}><Btn v="ghost" onClick={()=>go("proposals")}>Cancelar</Btn><Btn I={CheckCircle2} onClick={submit}>Salvar Proposta</Btn></div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════
export default function Root() {
  const [user,setUser]=useState(null);
  const [pg,setPg]=useState("landing");
  const [params,setParams]=useState({});
  const [toasts,setToasts]=useState([]);
  const [nu,setNu]=useState(0);
  const [authLoading,setAuthLoading]=useState(true);
  const [dataVersion,setDataVersion]=useState(0); // força re-render após popular arrays mutáveis

  // ── Carrega dados reais do tenant logado ──────────────
  const loadTenantData = async (tenantId, userId, isAdmin) => {
    const [muniRes, propRes, diligRes, docRes, msgRes, notifRes, tenantsRes] = await Promise.all([
      supabase.from("municipalities").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
      supabase.from("proposals").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("diligencies").select("*, proposal:proposals(number,title)").eq("tenant_id", tenantId).order("due_date"),
      supabase.from("documents").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").or(`tenant_id.eq.${tenantId},to_tenant.eq.${tenantId}`).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      isAdmin ? supabase.from("tenants").select("*").order("name") : Promise.resolve({ data: [] }),
    ]);

    MUNIS.length = 0;
    (muniRes.data||[]).forEach(m=>MUNIS.push({id:m.id, name:m.name, st:m.state, mayor:m.mayor||"—", pop:m.population||0, ibge:m.ibge_code||"—", props:0, phone:m.phone||"—"}));

    PROPS.length = 0;
    (propRes.data||[]).forEach(p=>{
      const muni = MUNIS.find(m=>m.id===p.municipality_id);
      if (muni) muni.props++;
      PROPS.push({id:p.id, mun:p.municipality_id, num:p.number||"—", title:p.title, min:p.ministry, parl:p.parliamentarian||"—",
        status:STATUS_DB_TO_LABEL[p.status]||p.status, gv:Number(p.global_value)||0, tv:Number(p.transfer_value)||0, cv:Number(p.counterpart_value)||0,
        s:p.start_date, e:p.end_date, prio:p.priority, ass:null});
    });

    DILIG.length = 0;
    (diligRes.data||[]).forEach(d=>DILIG.push({id:d.id, pid:d.proposal_id, pnum:d.proposal?.number||"—", ptitle:d.proposal?.title||"—",
      title:d.title, desc:d.description||"", src:d.source, status:d.status, prio:d.priority, due:d.due_date, by:d.requested_by||"—"}));

    DOCS.length = 0;
    (docRes.data||[]).forEach(d=>DOCS.push({id:d.id, pid:d.proposal_id, name:d.name, cat:d.category,
      sz: d.size_bytes ? `${(d.size_bytes/1024/1024).toFixed(1)} MB` : "—", by:"—", at:d.created_at?.slice(0,10)}));

    MSGS.length = 0;
    (msgRes.data||[]).forEach(m=>MSGS.push({id:m.id, from:"Administração SOMMA", subj:m.subject, body:m.body, at:m.created_at?.slice(0,10), read:m.is_read}));

    NOTIFS0.length = 0;
    (notifRes.data||[]).forEach(n=>NOTIFS0.push({id:n.id, type:n.type, title:n.title, body:n.body||"", read:n.is_read, at:new Date(n.created_at)}));
    setNu(NOTIFS0.filter(n=>!n.read).length);

    if (isAdmin) {
      TENANTS.length = 0;
      (tenantsRes.data||[]).forEach(t=>TENANTS.push({id:t.id, name:t.name, type:t.type, cnpj:t.cnpj||"—", city:t.city||"—", st:t.state||"—",
        plan: t.plan==="profissional"?"Profissional":t.plan==="enterprise"?"Enterprise":"Básico", ps:t.plan_status, props:0, munis:0}));
    }

    setDataVersion(v=>v+1);
  };

  // ── Sessão e auth state ───────────────────────────────
  useEffect(()=>{
    let mounted = true;

    const bootstrap = async (session) => {
      if (!session) { setUser(null); setAuthLoading(false); return; }
      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      if (!mounted) return;
      if (!profile || !profile.tenant_id) {
        // Usuário autenticado mas sem tenant vinculado ainda
        setUser({ id: session.user.id, name: profile?.name || session.user.email, email: session.user.email, role: "tenant_member", tenant: "—", needsOnboarding: true });
        setAuthLoading(false);
        return;
      }
      const { data: tenant } = await supabase.from("tenants").select("name").eq("id", profile.tenant_id).single();
      const isAdmin = profile.role === "super_admin";
      await loadTenantData(profile.tenant_id, profile.id, isAdmin);
      setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role, tenant: tenant?.name || "—", tenant_id: profile.tenant_id });
      setPg(isAdmin ? "admin" : "dashboard");
      setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data:{ session } })=>bootstrap(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session)=>{
      bootstrap(session);
    });
    return ()=>{ mounted=false; subscription.unsubscribe(); };
  },[]);

  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body,#root{font-family:'Inter',system-ui,sans-serif!important;background:#F5F4FB;}
      .sli{transition:background .13s;} .sli:hover{background:rgba(255,255,255,.08)!important;}
      .trow:hover td{background:#F7F6FD;}
      .hcard:hover{box-shadow:0 8px 22px rgba(61,49,160,.12)!important;transform:translateY(-2px);transition:all .18s;}
      @keyframes si{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-thumb{background:#D0CCF0;border-radius:4px;}
      input,textarea,select,button{font-family:inherit;}
    `;
    document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  const go=(page,p={})=>{setPg(page);setParams(p);};
  const addToast=(msg,type="success")=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,msg,type}]);};
  const rmToast=id=>setToasts(t=>t.filter(x=>x.id!==id));
  const doSignOut=async()=>{ await supabase.auth.signOut(); setUser(null); setPg("landing"); };

  const ctx={user,setUser,pg,go,toast:addToast,nu,setNu,signOut:doSignOut,dataVersion};

  if (authLoading) {
    return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:10,background:T.violet,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontStyle:"italic",fontWeight:900,fontSize:18}}>∑</div>
        <div style={{fontSize:13,color:T.muted,fontWeight:500}}>Carregando SOMMA.IO...</div>
      </div>
    </div>;
  }

  const renderPage=()=>{
    if(!user||pg==="landing") return <Landing/>;
    const W=ch=><Layout>{ch}</Layout>;
    const isA=user.role==="super_admin";
    switch(pg){
      case"dashboard":       return W(<Dashboard/>);
      case"proposals":       return W(<Proposals/>);
      case"proposal-detail": return W(<ProposalDetail id={params.id}/>);
      case"proposal-form":   return W(<ProposalForm/>);
      case"municipalities":  return W(<Municipalities/>);
      case"diligencies":     return W(<Diligencies/>);
      case"documents":       return W(<Documents/>);
      case"communications":  return W(<Communications/>);
      case"admin":           return W(isA?<Admin/>:<Dashboard/>);
      case"admin-tenants":   return W(isA?<AdminTenants/>:<Dashboard/>);
      case"admin-plans":     return W(<div style={{padding:22}}><h1 style={{fontSize:19,fontWeight:900,color:T.text,marginBottom:18}}>Planos</h1><Empty Icon={CreditCard} title="Módulo de Planos" desc="Em desenvolvimento — disponível em breve."/></div>);
      case"notifications":   return W(<Notifications/>);
      case"profile":         return W(<Profile/>);
      default:               return <Landing/>;
    }
  };

  return <App.Provider value={ctx}>
    <div style={{minHeight:"100vh"}}>
      {renderPage()}
      <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
        {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>rmToast(t.id)}/>)}
      </div>
    </div>
  </App.Provider>;
}
