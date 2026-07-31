import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { createPersistentCache } from './data/client'
import './styles.css'
import './sidebar-fix.css'

type ViewId = 'inbox' | 'pull-requests' | 'repos' | 'runtime' | 'live-sessions' | 'analytics' | 'cto-analytics'
type IconName = 'inbox' | 'pull' | 'repos' | 'runtime' | 'sessions' | 'analytics' | 'cto' | 'chevron' | 'search' | 'plus' | 'close' | 'moon' | 'sun' | 'filter' | 'settings' | 'bell' | 'help'
type Tab = { id: ViewId; title: string; icon: IconName }

const icons: Record<IconName, string> = {
  inbox:'M3 5.5h18v12H3zM3 13h5l2 2h4l2-2h5', pull:'M7 4v5a5 5 0 0 0 10 0V7M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', repos:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', runtime:'M3 12h4l2.5-6 4 12L16 12h5', sessions:'M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0M12 12h.01', analytics:'M4 20V10m6 10V4m6 16v-7', cto:'M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z', chevron:'m7 10 5 5 5-5', search:'m20 20-4.2-4.2M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z', plus:'M12 5v14M5 12h14', close:'m6 6 12 12M18 6 6 18', moon:'M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 0 1 0 20 15.5Z', sun:'M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', filter:'M4 5h16M7 10h10m-7 5h4', settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-9v2m0 8v2m-6-8h2m8 0h2', bell:'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', help:'M9.1 9a3 3 0 1 1 5.6 1.5c-.8 1.6-2.7 1.8-2.7 3.5M12 18h.01'
}
function Icon(p: { name: IconName; size?: number }) { return <svg class="icon" width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d={icons[p.name]} /></svg> }

const views: Record<ViewId, Tab> = {
  inbox:{id:'inbox',title:'Inbox',icon:'inbox'}, 'pull-requests':{id:'pull-requests',title:'Pull Requests',icon:'pull'}, repos:{id:'repos',title:'Repos',icon:'repos'}, runtime:{id:'runtime',title:'Runtime',icon:'runtime'}, 'live-sessions':{id:'live-sessions',title:'Live Sessions',icon:'sessions'}, analytics:{id:'analytics',title:'Analytics',icon:'analytics'}, 'cto-analytics':{id:'cto-analytics',title:'CTO Analytics',icon:'cto'},
}
const groups: Array<[string | null, ViewId[]]> = [[null,['inbox','pull-requests','repos']],['Operations',['runtime','live-sessions']],['Insights',['analytics','cto-analytics']]]

function useWorkspace() {
  const cache = createPersistentCache('riftr-linear')
  const persisted = cache.read<{ tabs: Tab[]; active: ViewId; theme: 'light' | 'dark' } | null>('session', null)
  const savedTabs = (persisted?.tabs ?? []).filter(tab => tab.id in views)
  const [tabs,setTabs] = createSignal<Tab[]>(savedTabs.length ? savedTabs : [views['pull-requests']])
  const [active,setActive] = createSignal<ViewId>(persisted && persisted.active in views ? persisted.active : tabs()[0].id)
  const [theme,setTheme] = createSignal<'light'|'dark'>(persisted?.theme ?? 'light')
  createEffect(() => cache.write('session',{tabs:tabs(),active:active(),theme:theme()}))
  const open = (id: ViewId) => { if (!tabs().some(tab => tab.id === id)) setTabs([...tabs(),views[id]]); setActive(id) }
  const close = (id: ViewId) => { if (tabs().length === 1) return; const index=tabs().findIndex(tab=>tab.id===id); const next=tabs().filter(tab=>tab.id!==id); setTabs(next); if(active()===id)setActive(next[Math.max(0,index-1)].id) }
  return {tabs,active,theme,setTheme,open,close}
}

function WorkspaceMenu(p:{close:()=>void}) { return <div class="workspace-menu" role="menu"><button onClick={p.close}>Settings <kbd>G then ,</kbd></button><button onClick={p.close}>Invite and manage members</button><i/><button onClick={p.close}>Download desktop app</button><i/><button onClick={p.close}>Switch workspace <span><kbd>O then W</kbd> ›</span></button><button onClick={p.close}>Log out <kbd>⌥ ⇧ Q</kbd></button></div> }
function Sidebar(p:{active:()=>ViewId;open:(id:ViewId)=>void;theme:()=>string;toggle:()=>void;help:()=>void}) {
  const [menu,setMenu]=createSignal(false)
  const [collapsed,setCollapsed]=createSignal<Record<string,boolean>>({})
  return <aside class="sidebar"><div class="workspace-trigger"><button class="profile" onClick={()=>setMenu(!menu())} aria-expanded={menu()}><b>R</b><strong>riftr</strong><Icon name="chevron" size={13}/><span><Icon name="search"/><em><Icon name="plus"/></em></span></button><Show when={menu()}><WorkspaceMenu close={()=>setMenu(false)}/></Show></div><For each={groups}>{([label,items]) => { const section = label ?? ''; const isCollapsed = () => Boolean(label && collapsed()[section]); return <><Show when={label}><button class="nav-label" classList={{collapsed:isCollapsed()}} aria-expanded={!isCollapsed()} onClick={()=>setCollapsed({...collapsed(),[section]:!isCollapsed()})}><span>{label}</span><Icon name="chevron" size={11}/></button></Show><Show when={!isCollapsed()}><nav><For each={items}>{id=><button classList={{active:p.active()===id}} onClick={()=>p.open(id)}><Icon name={views[id].icon}/><span>{views[id].title}</span><Show when={id==='inbox'}><small>3</small></Show></button>}</For></nav></Show></>}}</For><div class="sidebar-footer"><button onClick={p.toggle}><Icon name={p.theme()==='light'?'moon':'sun'}/>{p.theme()==='light'?'Dark mode':'Light mode'}</button><button aria-label="Keyboard shortcuts" onClick={p.help}><Icon name="help"/></button></div></aside>
}
function EmptyView(p:{id:()=>ViewId; compose:()=>void}) { const view=()=>views[p.id()]; return <section class="page"><Show when={p.id()==='inbox'} fallback={<><header><p>Workspace</p><h1>{view().title}</h1><button class="primary" onClick={p.compose}>Create new issue</button></header><div class="filters"><button class="chosen">All</button><button>Open</button><button>Updated recently</button><button class="push"><Icon name="filter"/></button></div><For each={['Create resilient webhook delivery pipeline','Support organisation-level installations','Add review summaries to the pull request timeline']}>{(title,index)=><article class="row"><i classList={{purple:index()===2,gray:index()===1}}></i><div><strong>{title}</strong><small>RIF-{248-index()*7} · {index()===0?'Platform':'GitHub'}</small></div><span>{index()===0?'In progress':index()===1?'Todo':'In review'}</span></article>}</For></>}><section class="inbox-empty"><div class="orbit"></div><h2>No issues assigned to you</h2><button class="primary" onClick={p.compose}>Create new issue</button></section></Show></section> }
function Help(p:{close:()=>void}) { const rows=[['G then I','Inbox'],['G then P','Pull Requests'],['G then R','Repos'],['G then U','Runtime'],['G then S','Live Sessions'],['Q','Create new issue'],['⌥ ← / →','Change tab'],['?','Keyboard shortcuts'],['Esc','Close overlay']]; return <div class="overlay" onClick={p.close}><section class="shortcut" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><header><div><p>Riftr workspace</p><h2>Keyboard shortcuts</h2></div><button onClick={p.close}><Icon name="close"/></button></header><For each={rows}>{row=><div><strong>{row[1]}</strong><kbd>{row[0]}</kbd></div>}</For></section></div> }
function Composer(p:{close:()=>void}) { return <div class="overlay" onClick={p.close}><section class="composer" role="dialog" onClick={e=>e.stopPropagation()}><div><span>Riftr</span><button onClick={p.close}><Icon name="close"/></button></div><input autofocus placeholder="Issue title"/><footer><small>Press ⌘ ↵ to create</small><button class="primary" onClick={p.close}>Create issue</button></footer></section></div> }

function App() {
  const app=useWorkspace(); const [help,setHelp]=createSignal(false); const [composer,setComposer]=createSignal(false)
  createEffect(()=>document.documentElement.dataset.theme=app.theme())
  onMount(()=>{let waiting=false;let timer:number|undefined;const clear=()=>{waiting=false;if(timer)clearTimeout(timer)};const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea'))return;if(e.key==='Escape'){setHelp(false);setComposer(false);clear();return}if(e.key==='? '||e.key==='?'){e.preventDefault();setHelp(true);return}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setHelp(true);return}if(e.key.toLowerCase()==='q'){setComposer(true);return}if(waiting){const next=({i:'inbox',p:'pull-requests',r:'repos',u:'runtime',s:'live-sessions',a:'analytics',c:'cto-analytics'} as Record<string,ViewId>)[e.key.toLowerCase()];clear();if(next)app.open(next);return}if(e.key.toLowerCase()==='g'){waiting=true;timer=window.setTimeout(clear,900);return}if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){const all=app.tabs();const at=all.findIndex(t=>t.id===app.active());app.open(all[e.key==='ArrowLeft'?(at-1+all.length)%all.length:(at+1)%all.length].id)}};document.addEventListener('keydown',key);onCleanup(()=>document.removeEventListener('keydown',key))})
  return <><main class="app"><Sidebar active={app.active} open={app.open} theme={app.theme} toggle={()=>app.setTheme(app.theme()==='light'?'dark':'light')} help={()=>setHelp(true)}/><section class="content"><div class="tabs"><For each={app.tabs()}>{tab=><button classList={{active:app.active()===tab.id}} onClick={()=>app.open(tab.id)}><Icon name={tab.icon}/>{tab.title}<i onClick={e=>{e.stopPropagation();app.close(tab.id)}}><Icon name="close" size={13}/></i></button>}</For><button class="add" onClick={()=>app.open('pull-requests')}><Icon name="plus"/></button><span><Icon name="search"/><Icon name="bell"/></span></div><EmptyView id={app.active} compose={()=>setComposer(true)}/></section></main><Show when={help()}><Help close={()=>setHelp(false)}/></Show><Show when={composer()}><Composer close={()=>setComposer(false)}/></Show></>
}
render(()=> <App/>,document.getElementById('root')!)
