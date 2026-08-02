import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider, createMutation, createQuery, useQueryClient } from '@tanstack/solid-query'
import { createPersistentCache } from './data/client'
import { connectOrkiaEvents, orkiaApi, type FeedEntry, type InboxItem, type Profile, type RepositoryChangeSetDetection, type RepositoryOperations, type Viewer } from './data/orkia'
import './styles.css'
import './sidebar-fix.css'
import './operations.css'
import './home-dashboard.css'
import './profile.css'
import './auth.css'
import GhosttyCommunity from './GhosttyCommunity'

type ViewId = 'home' | 'profile' | 'inbox' | 'pull-requests' | 'repos' | 'project-operations' | 'runtime' | 'live-sessions' | 'analytics' | 'cto-analytics'
type RepoId = string
type TabId = ViewId | `repo:${RepoId}`
type IconName = 'home' | 'user' | 'inbox' | 'pull' | 'repos' | 'runtime' | 'sessions' | 'analytics' | 'cto' | 'chevron' | 'search' | 'plus' | 'close' | 'moon' | 'sun' | 'filter' | 'settings' | 'bell' | 'help'
type ViewDefinition = { id: ViewId; title: string; icon: IconName }
type Tab = { id: TabId; view: ViewId; title: string; icon: IconName; repoId?: RepoId }
type Repo = { id: RepoId; owner: string; name: string; label: string; visibility: 'Public' | 'Private'; mark: string; publicPath?: string }

const icons: Record<IconName, string> = {
  home:'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0', inbox:'M3 5.5h18v12H3zM3 13h5l2 2h4l2-2h5', pull:'M7 4v5a5 5 0 0 0 10 0V7M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', repos:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', runtime:'M3 12h4l2.5-6 4 12L16 12h5', sessions:'M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0M12 12h.01', analytics:'M4 20V10m6 10V4m6 16v-7', cto:'M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z', chevron:'m7 10 5 5 5-5', search:'m20 20-4.2-4.2M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z', plus:'M12 5v14M5 12h14', close:'m6 6 12 12M18 6 6 18', moon:'M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 0 1 0 20 15.5Z', sun:'M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', filter:'M4 5h16M7 10h10m-7 5h4', settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-9v2m0 8v2m-6-8h2m8 0h2', bell:'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', help:'M9.1 9a3 3 0 1 1 5.6 1.5c-.8 1.6-2.7 1.8-2.7 3.5M12 18h.01'
}
function Icon(p: { name: IconName; size?: number }) { return <svg class="icon" width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d={icons[p.name]} /></svg> }

const views: Record<ViewId, ViewDefinition> = {
  home:{id:'home',title:'Home',icon:'home'}, profile:{id:'profile',title:'killix',icon:'user'}, inbox:{id:'inbox',title:'Inbox',icon:'inbox'}, 'pull-requests':{id:'pull-requests',title:'Pull Requests',icon:'pull'}, repos:{id:'repos',title:'Repos',icon:'repos'}, 'project-operations':{id:'project-operations',title:'Project Ops',icon:'runtime'}, runtime:{id:'runtime',title:'Runtime',icon:'runtime'}, 'live-sessions':{id:'live-sessions',title:'Live Sessions',icon:'sessions'}, analytics:{id:'analytics',title:'Analytics',icon:'analytics'}, 'cto-analytics':{id:'cto-analytics',title:'CTO Analytics',icon:'cto'},
}
const fallbackRepos: Repo[] = [
  {id:'ghostty',owner:'ghostty-org',name:'ghostty',label:'Ghostty',visibility:'Public',mark:'◒',publicPath:'/ghostty-community'},
  {id:'orkia',owner:'orkia',name:'orkia',label:'Orkia',visibility:'Private',mark:'O'},
  {id:'agent-runtime',owner:'orkia',name:'agent-runtime',label:'Agent Runtime',visibility:'Private',mark:'A'},
]
const groups: Array<[string, ViewId[]]> = [['Operations',['runtime','live-sessions']],['Insights',['analytics','cto-analytics']]]
const viewTab=(id:ViewId):Tab=>({...views[id],view:id})
const repoTab=(id:RepoId, repositories:Repo[]=fallbackRepos):Tab=>{const repo=repositories.find(item=>item.id===id||item.name===id)??repositories[0]??fallbackRepos[0];return{id:`repo:${repo.id}`,view:'project-operations',title:repo.name,icon:'repos',repoId:repo.id}}

function useWorkspace(repoSource:()=>Repo[]) {
  const available=()=>repoSource().length?repoSource():fallbackRepos
  const cache = createPersistentCache('orkia-workspace')
  const persisted = cache.read<{ tabs: Array<Partial<Tab>&{id:string}>; active: string; theme: 'light' | 'dark'; repo?: RepoId } | null>('session', null)
  const persistedRepo:RepoId=available().some(item=>item.id===persisted?.repo)?persisted!.repo!:available()[0].id
  const normalizeTab=(tab:Partial<Tab>&{id:string}):Tab|null=>{if(tab.id==='project-operations')return repoTab(persistedRepo,available());if(tab.id.startsWith('repo:')){const id=tab.id.slice(5) as RepoId;return available().some(item=>item.id===id)?repoTab(id,available()):null}return tab.id in views?viewTab(tab.id as ViewId):null}
  const savedTabs = (persisted?.tabs ?? []).map(normalizeTab).filter((tab):tab is Tab=>Boolean(tab)).filter((tab,index,all)=>all.findIndex(item=>item.id===tab.id)===index)
  const initialActive=()=>{const id=persisted?.active;if(id==='project-operations')return `repo:${persistedRepo}` as TabId;if(id?.startsWith('repo:')&&available().some(item=>`repo:${item.id}`===id))return id as TabId;if(id&&id in views)return id as ViewId;return(savedTabs[0]??viewTab('home')).id}
  const [tabs,setTabs] = createSignal<Tab[]>(savedTabs.length ? savedTabs : [viewTab('home')])
  const [active,setActive] = createSignal<TabId>(initialActive())
  const [theme,setTheme] = createSignal<'light'|'dark'>(persisted?.theme ?? 'light')
  const [lastRepo,setLastRepo] = createSignal<RepoId>(persistedRepo)
  createEffect(() => cache.write('session',{tabs:tabs(),active:active(),theme:theme(),repo:lastRepo()}))
  const openRepo = (id: RepoId) => { const tab=repoTab(id,available());setLastRepo(tab.repoId!);if(!tabs().some(item=>item.id===tab.id))setTabs([...tabs(),tab]);setActive(tab.id) }
  const open = (id: ViewId) => { if(id==='project-operations'){openRepo(lastRepo());return}if (!tabs().some(tab => tab.id === id)) setTabs([...tabs(),viewTab(id)]); setActive(id) }
  const activate=(id:TabId)=>{const tab=tabs().find(item=>item.id===id);if(tab?.repoId)setLastRepo(tab.repoId);if(tab)setActive(id)}
  const close = (id: TabId) => { if (tabs().length === 1) return; const index=tabs().findIndex(tab=>tab.id===id); const next=tabs().filter(tab=>tab.id!==id); setTabs(next); if(active()===id)setActive(next[Math.max(0,index-1)].id) }
  return {tabs,active,theme,setTheme,open,openRepo,activate,close}
}

function AccountMenu(p:{close:()=>void;openProfile:()=>void;viewer:Viewer;logout:()=>void;signingOut:()=>boolean}) { const profile=()=>{p.openProfile();p.close()};return <div class="workspace-menu account-menu" role="menu"><header><img src={p.viewer.avatarUrl??`https://github.com/${p.viewer.login}.png?size=64`} alt=""/><span><b>{p.viewer.displayName??p.viewer.login}</b><small>@{p.viewer.login}</small></span></header><button onClick={profile}>Your profile</button><button onClick={p.close}>Your organizations <span>›</span></button><i/><button onClick={p.close}>Account settings <kbd>G then ,</kbd></button><button onClick={p.close}>Appearance <span>System ›</span></button><i/><button onClick={p.logout} disabled={p.signingOut()}>{p.signingOut()?'Signing out…':'Sign out'} <kbd>⌥ ⇧ Q</kbd></button></div> }
function Sidebar(p:{active:()=>TabId;open:(id:ViewId)=>void;selectRepo:(id:RepoId)=>void;repositories:()=>Repo[];inboxCount:()=>number;theme:()=>string;toggle:()=>void;help:()=>void;viewer:Viewer;logout:()=>void;signingOut:()=>boolean}) {
  const [menu,setMenu]=createSignal(false)
  const [collapsed,setCollapsed]=createSignal<Record<string,boolean>>({})
  const isCollapsed=(section:string)=>Boolean(collapsed()[section])
  const toggleSection=(section:string)=>setCollapsed({...collapsed(),[section]:!isCollapsed(section)})
  const organizations=()=>[...new Set(p.repositories().map(repo=>repo.owner))].map(owner=>({owner,repos:p.repositories().filter(repo=>repo.owner===owner)}))
  return <aside class="sidebar">
    <div class="workspace-trigger"><div class="profile-row"><div class="account-control" classList={{active:p.active()==='profile',expanded:menu()}}><button class="profile" onClick={()=>p.open('profile')}><img src={p.viewer.avatarUrl??`https://github.com/${p.viewer.login}.png?size=64`} alt=""/><strong>{p.viewer.login}</strong></button><button class="profile-menu-toggle" aria-label="Account menu" aria-expanded={menu()} onClick={()=>setMenu(!menu())}><Icon name="chevron" size={13}/></button></div><span class="profile-actions"><Icon name="search"/><em><Icon name="plus"/></em></span></div><Show when={menu()}><AccountMenu close={()=>setMenu(false)} openProfile={()=>p.open('profile')} viewer={p.viewer} logout={p.logout} signingOut={p.signingOut}/></Show></div>
    <nav class="primary-nav"><For each={['home','inbox','pull-requests'] as ViewId[]}>{id=><button classList={{active:p.active()===id}} onClick={()=>p.open(id)}><Icon name={views[id].icon}/><span>{views[id].title}</span><Show when={id==='inbox'&&p.inboxCount()>0}><small>{p.inboxCount()}</small></Show></button>}</For></nav>
    <button class="nav-label" classList={{collapsed:isCollapsed('Repos')}} aria-expanded={!isCollapsed('Repos')} onClick={()=>toggleSection('Repos')}><span>Repos</span><Icon name="chevron" size={11}/></button>
    <Show when={!isCollapsed('Repos')}><nav class="repo-nav">
      <button class="all-repos" classList={{active:p.active()==='repos'}} onClick={()=>p.open('repos')}><Icon name="repos"/><span>All repositories</span><small>{p.repositories().length}</small></button>
      <For each={organizations()}>{organization=>{const section=`org:${organization.owner}`;return <section class="repo-organization">
        <button class="repo-org" classList={{collapsed:isCollapsed(section)}} aria-expanded={!isCollapsed(section)} onClick={()=>toggleSection(section)}><i>{organization.owner.slice(0,1).toUpperCase()}</i><span>{organization.owner}</span><small>{organization.repos.length}</small><Icon name="chevron" size={10}/></button>
        <Show when={!isCollapsed(section)}><div class="repo-children"><For each={organization.repos}>{repo=><button class="repo-entry" classList={{active:p.active()===`repo:${repo.id}`}} aria-label={`${repo.owner}/${repo.name} · ${repo.visibility}`} onClick={()=>p.selectRepo(repo.id)}><i class="repo-mark">{repo.mark}</i><span><b>{repo.name}</b><small>{repo.visibility}</small></span><em classList={{private:repo.visibility==='Private'}} title={repo.visibility}>{repo.visibility==='Private'?'⌑':'●'}</em></button>}</For></div></Show>
      </section>}}</For>
    </nav></Show>
    <For each={groups}>{([label,items]) => { const section=label; return <><button class="nav-label" classList={{collapsed:isCollapsed(section)}} aria-expanded={!isCollapsed(section)} onClick={()=>toggleSection(section)}><span>{label}</span><Icon name="chevron" size={11}/></button><Show when={!isCollapsed(section)}><nav><For each={items}>{id=><button classList={{active:p.active()===id}} onClick={()=>p.open(id)}><Icon name={views[id].icon}/><span>{views[id].title}</span></button>}</For></nav></Show></>}}</For>
    <div class="sidebar-footer"><button onClick={p.toggle}><Icon name={p.theme()==='light'?'moon':'sun'}/>{p.theme()==='light'?'Dark mode':'Light mode'}</button><button aria-label="Keyboard shortcuts" onClick={p.help}><Icon name="help"/></button></div>
  </aside>
}
function EmptyView(p:{id:()=>ViewId; compose:()=>void; inbox:()=>InboxItem[]}) { const view=()=>views[p.id()]; return <section class="page"><Show when={p.id()==='inbox'} fallback={<><header><p>Workspace</p><h1>{view().title}</h1><button class="primary" onClick={p.compose}>Create new issue</button></header><div class="filters"><button class="chosen">All</button><button>Open</button><button>Updated recently</button><button class="push"><Icon name="filter"/></button></div><For each={['Create resilient webhook delivery pipeline','Support organisation-level installations','Add review summaries to the pull request timeline']}>{(title,index)=><article class="row"><i classList={{purple:index()===2,gray:index()===1}}></i><div><strong>{title}</strong><small>RIF-{248-index()*7} · {index()===0?'Platform':'GitHub'}</small></div><span>{index()===0?'In progress':index()===1?'Todo':'In review'}</span></article>}</For></>}><Show when={p.inbox().length} fallback={<section class="inbox-empty"><div class="orbit"></div><h2>No action needs you</h2><button class="primary" onClick={p.compose}>Create new issue</button></section>}><header><p>Workspace</p><h1>Inbox</h1></header><For each={p.inbox()}>{item=><article class="row"><i classList={{purple:item.kind==='sync_conflict'}}></i><div><strong>{item.title}</strong><small>{item.summary??item.kind}</small></div><span>{item.state}</span></article>}</For></Show></Show></section> }
function Help(p:{close:()=>void}) { const rows=[['G then H','Home'],['G then Y','Your profile'],['G then I','Inbox'],['G then P','Pull Requests'],['G then R','Repos'],['G then O','Project Ops'],['G then U','Runtime'],['G then S','Live Sessions'],['Q','Create new issue'],['⌥ ← / →','Change tab'],['?','Keyboard shortcuts'],['Esc','Close overlay']]; return <div class="overlay" onClick={p.close}><section class="shortcut" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><header><div><p>Orkia workspace</p><h2>Keyboard shortcuts</h2></div><button onClick={p.close}><Icon name="close"/></button></header><For each={rows}>{row=><div><strong>{row[1]}</strong><kbd>{row[0]}</kbd></div>}</For></section></div> }
function Composer(p:{close:()=>void}) { return <div class="overlay" onClick={p.close}><section class="composer" role="dialog" onClick={e=>e.stopPropagation()}><div><span>Orkia</span><button onClick={p.close}><Icon name="close"/></button></div><input autofocus placeholder="Issue title"/><footer><small>Press ⌘ ↵ to create</small><button class="primary" onClick={p.close}>Create issue</button></footer></section></div> }

const homeNeeds:Array<{repoId:RepoId;kind:string;repo:string;title:string;detail:string;person:string;tone:string}> = [
  {repoId:'orkia',kind:'Decision',repo:'orkia / orkia',title:'Choose the default contribution gate',detail:'12 replies · evidence verified · waiting since yesterday',person:'MC',tone:'violet'},
  {repoId:'ghostty',kind:'Review',repo:'ghostty-org / ghostty',title:'Scrollback regression test',detail:'18 lines · all checks passed · Avery requested you',person:'AS',tone:'blue'},
  {repoId:'agent-runtime',kind:'Attestation',repo:'orkia / agent-runtime',title:'macOS secure input state',detail:'Agent-assisted · 6 files · human review required',person:'AI',tone:'indigo'},
]
const homeRecent:Array<{repoId:RepoId;repo:string;summary:string;branch:string;status:string}> = [
  {repoId:'ghostty',repo:'ghostty-org / ghostty',summary:'Terminal core and community review',branch:'main',status:'2 conversations open'},
  {repoId:'orkia',repo:'orkia / orkia',summary:'Product direction and gate policy',branch:'product/gates',status:'Decision ready'},
  {repoId:'agent-runtime',repo:'orkia / agent-runtime',summary:'Agent execution and provenance',branch:'runtime/v2',status:'3 records pending'},
]

function HomeDashboard(p:{openRepo:(id:RepoId)=>void;compose:()=>void;feed:()=>FeedEntry[]}) {
  return <section class="page home-page">
    <header class="home-header"><div><p>Friday, July 31</p><h1>Good afternoon, Issam</h1><span>Move the work that needs your judgment.</span></div><button class="home-new" onClick={p.compose}><Icon name="plus" size={13}/> New issue</button></header>
    <button class="home-command" onClick={p.compose}><Icon name="search" size={17}/><span><b>Search, ask, or act</b><small>across your organizations and repositories</small></span><kbd>⌘ K</kbd></button>
    <div class="home-layout"><main>
      <section class="home-panel attention-panel"><header><div><small>YOUR WORK</small><h2>Needs you</h2></div><span>3 items</span></header><For each={homeNeeds}>{item=><button class="attention-row" onClick={()=>p.openRepo(item.repoId)}><i class={`home-person ${item.tone}`}>{item.person}</i><div><small>{item.kind} · {item.repo}</small><b>{item.title}</b><span>{item.detail}</span></div><em>Open <b>→</b></em></button>}</For></section>
      <section class="home-section"><header><div><small>CONTEXT</small><h2>Pick up where you left off</h2></div><button>View all repositories</button></header><div class="recent-grid"><For each={homeRecent}>{item=><button class="recent-card" onClick={()=>p.openRepo(item.repoId)}><span><Icon name="repos" size={14}/>{item.repo}</span><b>{item.summary}</b><small><i>⑂</i> {item.branch}</small><em>{item.status}</em></button>}</For></div></section>
      <section class="home-panel signal-feed"><header><div><small>FEED</small><h2>Worth knowing</h2></div><nav aria-label="Feed filters"><button class="active">Relevant</button><button>Following</button><button>Discover</button></nav></header>
        <Show when={p.feed().length}><For each={p.feed()}>{entry=><article><div class="feed-source"><i>{entry.kind.slice(0,1).toUpperCase()}</i><span><b>{entry.kind}</b><small>{new Date(entry.occurredAt).toLocaleString()}</small></span><em>From Orkia</em></div><h3>{entry.title}</h3><p>{entry.summary??'Activity persisted by the project.'}</p></article>}</For></Show>
        <Show when={!p.feed().length}>
        <article><div class="feed-source"><i class="commutifi">C</i><span><b>Commutifi / helpers</b><small>3 releases grouped · 39 min ago</small></span><em>Work you follow</em></div><h3>Release train v55 reached a stable candidate</h3><p>One production error fix, one new draft state, and a breaking export change were published across three releases.</p><div class="feed-changes"><span><b>Fix</b> Safer production 5xx messages</span><span><b>Breaking</b> Iframe exports moved</span></div><footer><button>Open release</button><button>Show fewer release trains</button></footer></article>
        <article><div class="feed-source"><i class="gitbutler">G</i><span><b>gitbutlerapp / gitbutler</b><small>Release 0.22.0 · yesterday</small></span><em>Related to your workflow</em></div><h3>Native GitHub stacked pull requests shipped</h3><p>GitButler now creates native stacked pull requests for enrolled repositories, with a compatibility fallback elsewhere.</p><footer><button>Read the release</button><button>Not relevant</button></footer></article>
        <article class="feed-human"><div class="feed-source"><AvatarLike letters="SY"/><span><b>Seckin Yasar</b><small>Community · 5 days ago</small></span><em>New connection</em></div><h3>Started following your work</h3><p>A contributor working across developer tooling and open source discovered your projects.</p><footer><button>View profile</button><button>Follow back</button></footer></article>
        </Show>
        <div class="feed-end"><span>✓</span><div><b>You’re caught up on relevant activity</b><small>23 repetitive events and automated releases were condensed.</small></div><button>Tune feed</button></div>
      </section>
      <section class="home-panel community-panel"><header><div><small>COMMUNITY</small><h2>People moving your projects forward</h2></div><button>See all activity</button></header><article><AvatarLike letters="AS"/><div><b>Avery Singh</b><span>attached a verified reproduction to <strong>Scrollback regression</strong></span><small>ghostty-org / ghostty · 34 min ago</small></div><button onClick={()=>p.openRepo('ghostty')}>View</button></article><article><AvatarLike letters="MC"/><div><b>Mira Chen</b><span>summarized the design trade-offs in <strong>Contribution gates</strong></span><small>orkia / orkia · 2h ago</small></div><button onClick={()=>p.openRepo('orkia')}>Reply</button></article><article><AvatarLike letters="JB"/><div><b>Jonas Beck</b><span>opened Friday office hours for new documentation contributors</span><small>ghostty-org / ghostty · yesterday</small></div><button onClick={()=>p.openRepo('ghostty')}>Join</button></article></section>
    </main><aside class="home-rail">
      <section class="rail-card focus-card"><header><small>TODAY</small><h2>Your focus</h2></header><p><span>1</span><b>Make the gate decision</b><small>Orkia · before 3 PM</small></p><p><span>2</span><b>Review Avery’s test</b><small>Ghostty · 18 lines</small></p><p><span>3</span><b>Attest agent work</b><small>Agent Runtime · 6 files</small></p><footer>Everything else can wait.</footer></section>
      <section class="rail-card agent-card"><header><small>AGENTS</small><h2>Waiting for a human</h2></header><button onClick={()=>p.openRepo('agent-runtime')}><span>AI</span><div><b>2 completed records</b><small>Checks passed · ownership unresolved</small></div><i>→</i></button><p>Agents can prepare work. Only people move it forward.</p></section>
      <section class="rail-card digest-card"><header><small>FROM YOUR ORGANIZATIONS</small><h2>What changed</h2></header><article><i class="green">●</i><div><b>Ghostty docs are unblocked</b><small>Three first-time contributors can proceed</small></div></article><article><i class="purple">●</i><div><b>Orkia gate policy reached v4</b><small>Two rules changed · owner review required</small></div></article><button>Open weekly digest →</button></section>
    </aside></div>
  </section>
}

const profileOrganizations = ['orkiaHQ','riftrHQ','Commutifi','MonkeyDLabs','siftr-sh','openbackendHQ']
const profileRhythm = Array.from({length:91},(_,index)=>[0,0,1,2,1,3,0,2,1,4,2,0,1][(index*5+Math.floor(index/7))%13])

function LegacyProfilePage(p:{openRepo:(id:RepoId)=>void}) {
  return <section class="page profile-page">
    <nav class="profile-tabs" aria-label="Profile sections"><button class="active">Overview</button><button>Projects</button><button>Activity</button><button>Stars <span>59</span></button></nav>
    <header class="profile-hero"><img src="https://github.com/Killix.png?size=240" alt="Issam Hakimi"/><div class="profile-identity"><small>PUBLIC PROFILE</small><h1>Issam Hakimi</h1><b>@killix</b><p>Building Orkia — a human-first forge for the agent era.</p><span>⌖ Montreal · Paris · Tunis</span><a href="http://www.iss.am">iss.am ↗</a></div><div class="profile-social"><p><b>36</b><span>followers</span></p><p><b>12</b><span>following</span></p><button>Edit profile</button><button>Share</button></div></header>
    <div class="profile-layout"><main>
      <section class="profile-note profile-card"><header><div><small>PROFILE NOTE · WRITTEN BY ISSAM</small><h2>Building infrastructure where humans keep authorship</h2></div><button>Edit note</button></header><p>I’m exploring how software collaboration changes when agents can research, write, test, and propose code. The interesting problem is not making agents look human — it is designing projects where their work stays legible, attributable, and governed by people.</p><p>Right now I’m focused on Orkia, project-local trust, and contribution systems that give maintainers better control without closing the door on newcomers.</p></section>
      <section class="profile-section"><header><div><small>SELECTED WORK</small><h2>What I’m building now</h2></div><button>View all projects</button></header><div class="profile-projects"><button onClick={()=>p.openRepo('orkia')}><span><i>O</i><em>orkiaHQ / orkia</em><b>Private preview</b></span><h3>A forge designed around humans and agents</h3><p>Community spaces, explainable contribution gates, and project operations in one system.</p><footer><small>Product · Architecture</small><strong>Open project →</strong></footer></button><button onClick={()=>p.openRepo('agent-runtime')}><span><i>R</i><em>riftrHQ / riftr-runtime</em><b>Active</b></span><h3>Execution records that remain inspectable</h3><p>Captures what coding agents changed, ran, cost, and produced across a session.</p><footer><small>Rust · Agent infrastructure</small><strong>Open project →</strong></footer></button><button onClick={()=>p.openRepo('ghostty')}><span><i>G</i><em>Ghostty community study</em><b>Design study</b></span><h3>Open source contribution beyond the file tree</h3><p>A product exploration around project voice, human context, and progressive trust.</p><footer><small>Research · Product design</small><strong>Open study →</strong></footer></button></div></section>
      <section class="profile-card roles-card"><header><div><small>PROJECT-LOCAL ROLES</small><h2>Responsibility, with its source</h2></div><span>No global score</span></header><article><i>O</i><div><b>orkiaHQ / orkia</b><small>Owner · product direction and contribution policy</small></div><em>Granted by project owners</em><button onClick={()=>p.openRepo('orkia')}>View</button></article><article><i>R</i><div><b>riftrHQ / riftr-runtime</b><small>Maintainer · runtime architecture and provenance</small></div><em>Earned through 18 accepted changes</em><button onClick={()=>p.openRepo('agent-runtime')}>View</button></article><article><i>C</i><div><b>Commutifi / api-analytic-rs</b><small>Contributor · Rust APIs and reliability</small></div><em>Verified by repository history</em><button>View</button></article><footer>Roles are scoped to a project, explainable, and revocable by that community.</footer></section>
      <section class="profile-card activity-card"><header><div><small>RECENT ACTIVITY</small><h2>Work with clear authorship</h2></div><button>See full activity</button></header><article><span class="human">IH</span><div><small>HUMAN-AUTHORED · ORKIAHQ / ORKIA</small><b>Defined contribution gate policy v4</b><p>Wrote the decision model and incorporated feedback from 12 community replies.</p></div><time>Today</time></article><article><span class="agent">AI</span><div><small>AGENT-ASSISTED · RIFTRHQ / RIFTR-RUNTIME</small><b>Added session provenance records</b><p>Codex prepared implementation and tests · 6 files · reviewed and attested by Issam.</p></div><time>Yesterday</time></article><article><span class="human">IH</span><div><small>HUMAN-DIRECTED · DESIGN STUDY</small><b>Reframed the open source repository homepage</b><p>Research, synthesis, and product direction remain attributed separately from generated artifacts.</p></div><time>Jul 30</time></article></section>
    </main><aside class="profile-rail">
      <section class="profile-card now-card"><header><small>NOW</small><h2>Current focus</h2></header><p><b>Orkia product direction</b><span>Designing the authenticated home and public project surfaces.</span></p><p><b>Agent provenance</b><span>Making assisted work inspectable without reducing people to a score.</span></p><footer><i></i> Active this week</footer></section>
      <section class="profile-card rhythm-card"><header><small>CONTRIBUTION RHYTHM</small><h2>Showing up across the work</h2></header><div><For each={profileRhythm}>{level=><i class={`level-${level}`}></i>}</For></div><p>Includes code, reviews, discussions, and project decisions — not just commits.</p></section>
      <section class="profile-card collaboration-card"><header><small>COLLABORATION</small><h2>Works well with me</h2></header><p><span>✓</span><b>Start with context</b><small>Explain the user or project need before the solution.</small></p><p><span>✓</span><b>Bring evidence</b><small>Reproductions and trade-offs move decisions faster.</small></p><p><span>✓</span><b>Async first</b><small>Written proposals before meetings.</small></p></section>
      <section class="profile-card disclosure-card"><header><small>AGENT DISCLOSURE</small><h2>Assistance stays visible</h2></header><p>Agent-assisted changes disclose the tool, scope, checks, and human attestation on each record.</p><button>View assisted work →</button></section>
      <section class="profile-card organizations-card"><header><small>ORGANIZATIONS</small><h2>Communities</h2></header><div><For each={profileOrganizations}>{(organization,index)=><button><i>{organization.slice(0,1)}</i><span>{organization}</span><Show when={index()===0||index()===1}><em>Core</em></Show></button>}</For></div><footer>+ 7 more organizations</footer></section>
    </aside></div>
  </section>
}

function profilePayloadField(payload:unknown,key:string) {
  return payload && typeof payload==='object' && key in payload ? String((payload as Record<string,unknown>)[key]??'') : ''
}

function contributionLevel(total:number) {
  if(total===0)return 0
  if(total===1)return 1
  if(total<=3)return 2
  if(total<=7)return 3
  return 4
}

function contributionSource(day:{orkia:number;github:number}) {
  if(day.orkia>0&&day.github>0)return 'mixed'
  if(day.orkia>0)return 'orkia'
  if(day.github>0)return 'github'
  return 'empty'
}

function ProfilePage(p:{openRepo:(id:RepoId)=>void;profile:()=>Profile|undefined;loading:()=>boolean;error:()=>Error|null}) {
  const queryClient=useQueryClient(); const [editing,setEditing]=createSignal(false)
  const update=createMutation(()=>({mutationFn:orkiaApi.updateProfile,onSuccess:value=>{queryClient.setQueryData(['profile'],value);setEditing(false)}}))
  const save=(event:SubmitEvent)=>{event.preventDefault();const values=new FormData(event.currentTarget as HTMLFormElement);update.mutate({displayName:String(values.get('displayName')??''),headline:String(values.get('headline')??''),bio:String(values.get('bio')??''),location:String(values.get('location')??''),website:String(values.get('website')??''),noteTitle:String(values.get('noteTitle')??''),noteBody:String(values.get('noteBody')??'')})}
  const share=()=>{const url=window.location.href;if(navigator.share)void navigator.share({title:p.profile()?.displayName??p.profile()?.login,url});else void navigator.clipboard.writeText(url)}
  return <Show when={p.profile()} fallback={<section class="page profile-page profile-state"><div class="profile-card"><h2>{p.loading()?'Loading your profile…':'Profile unavailable'}</h2><p>{p.loading()?'Reading your identity, projects, roles, and activity from Orkia.':p.error()?.message??'Sign in with GitHub to load your Orkia profile.'}</p><Show when={!p.loading()}><a href="/auth/github/start?return_to=%2F">Sign in with GitHub</a></Show></div></section>}>{profile=>{
    const noteParagraphs=()=>profile().note.body?.split(/\n\s*\n/).filter(Boolean)??[]
    return <section class="page profile-page">
      <nav class="profile-tabs" aria-label="Profile sections"><button class="active">Overview</button><button>Projects</button><button>Activity</button><button>Stars <span>{profile().stars}</span></button></nav>
      <header class="profile-hero"><img src={profile().avatarUrl??`https://github.com/${profile().login}.png?size=240`} alt={profile().displayName??profile().login}/><div class="profile-identity"><small>PUBLIC PROFILE</small><h1>{profile().displayName??profile().login}</h1><b>@{profile().login}</b><Show when={profile().headline}><p>{profile().headline}</p></Show><Show when={profile().location}><span>⌖ {profile().location}</span></Show><Show when={profile().website}><a href={profile().website??'#'}>{profile().website} ↗</a></Show></div><div class="profile-social"><p><b>{profile().followers}</b><span>followers</span></p><p><b>{profile().following}</b><span>following</span></p><button onClick={()=>setEditing(true)}>Edit profile</button><button onClick={share}>Share</button></div></header>
      <div class="profile-layout"><main>
        <section class="profile-note profile-card"><header><div><small>PROFILE NOTE · WRITTEN BY {profile().displayName?.toUpperCase()??profile().login.toUpperCase()}</small><h2>{profile().note.title??profile().headline??'About my work'}</h2></div><button onClick={()=>setEditing(true)}>Edit note</button></header><Show when={noteParagraphs().length} fallback={<Show when={profile().bio}><p>{profile().bio}</p></Show>}><For each={noteParagraphs()}>{paragraph=><p>{paragraph}</p>}</For></Show></section>
        <section class="profile-section"><header><div><small>SELECTED WORK</small><h2>What I’m building now</h2></div><button>View all projects</button></header><div class="profile-projects"><For each={profile().projects.slice(0,6)}>{project=><button onClick={()=>p.openRepo(project.id)}><span><i>{project.slug.slice(0,1).toUpperCase()}</i><em>{project.namespace} / {project.slug}</em><b>{project.visibility}</b></span><h3>{project.displayName}</h3><p>{project.description??'No project description yet.'}</p><footer><small>{project.role} · {project.syncState}</small><strong>Open project →</strong></footer></button>}</For></div></section>
        <section class="profile-card roles-card"><header><div><small>PROJECT-LOCAL ROLES</small><h2>Responsibility, with its source</h2></div><span>No global score</span></header><Show when={profile().roles.length} fallback={<footer>No project-local role has been recorded yet.</footer>}><For each={profile().roles}>{role=><article><i>{role.repository.slice(0,1).toUpperCase()}</i><div><b>{role.namespace} / {role.repository}</b><small>{role.role}{role.description?` · ${role.description}`:''}</small></div><em>{role.source.replaceAll('_',' ')}</em><button onClick={()=>p.openRepo(role.repositoryId)}>View</button></article>}</For></Show><footer>Roles are scoped to a project, explainable, and revocable by that community.</footer></section>
        <section class="profile-card activity-card"><header><div><small>RECENT ACTIVITY</small><h2>Work with clear authorship</h2></div><button>See full activity</button></header><Show when={profile().activity.length} fallback={<div class="profile-empty">No authored activity recorded yet.</div>}><For each={profile().activity.slice(0,8)}>{activity=><article><span class="human">{profile().displayName?.split(' ').map(part=>part[0]).join('').slice(0,2)??profile().login.slice(0,2).toUpperCase()}</span><div><small>{activity.kind.replaceAll('.',' ').toUpperCase()} · {activity.entityType.toUpperCase()}</small><b>{profilePayloadField(activity.payload,'title')||activity.kind.replaceAll('.',' ')}</b><p>{profilePayloadField(activity.payload,'body')||profilePayloadField(activity.payload,'summary')||`Canonical Orkia ${activity.entityType} revision recorded.`}</p></div><time>{new Date(activity.occurredAt).toLocaleDateString()}</time></article>}</For></Show></section>
      </main><aside class="profile-rail">
        <section class="profile-card now-card"><header><small>NOW</small><h2>Current focus</h2></header><Show when={profile().focus.length} fallback={<p><b>No public focus set</b><span>Edit the profile to tell collaborators what currently matters.</span></p>}><For each={profile().focus}>{item=><p><b>{item.title}</b><span>{item.description}</span></p>}</For></Show><footer><i></i> Active this week</footer></section>
        <section class="profile-card rhythm-card"><header><small>CONTRIBUTION RHYTHM</small><h2>Showing up across the work</h2></header><div class="rhythm-grid" aria-label="Contributions over the last 91 days"><For each={profile().contributionRhythm}>{day=>{const total=()=>day.orkia+day.github;return <i class={`level-${contributionLevel(total())} source-${contributionSource(day)}`} title={`${day.date} · Orkia ${day.orkia} · GitHub ${day.github}`}></i>}}</For></div><div class="rhythm-legend"><span><i class="source-orkia"></i>Orkia <b>{profile().contributionRhythm.reduce((total,day)=>total+day.orkia,0)}</b></span><span><i class="source-github"></i>GitHub <b>{profile().contributionRhythm.reduce((total,day)=>total+day.github,0)}</b></span><span><i class="source-mixed"></i>Both</span></div><p>Orkia and imported GitHub activity, attributed by source and deduplicated by contribution.</p></section>
        <section class="profile-card collaboration-card"><header><small>COLLABORATION</small><h2>Works well with me</h2></header><Show when={profile().collaboration.length} fallback={<p><span>✓</span><b>Preferences not set</b><small>This person has not published collaboration preferences.</small></p>}><For each={profile().collaboration}>{item=><p><span>✓</span><b>{item.title}</b><small>{item.description}</small></p>}</For></Show></section>
        <section class="profile-card disclosure-card"><header><small>AGENT DISCLOSURE</small><h2>Assistance stays visible</h2></header><p>Agent-assisted changes disclose the tool, scope, checks, and human attestation on each record.</p><button>View assisted work →</button></section>
        <section class="profile-card organizations-card"><header><small>ORGANIZATIONS</small><h2>Communities</h2></header><div><For each={profile().organizations}>{organization=><button><i>{organization.slug.slice(0,1).toUpperCase()}</i><span>{organization.displayName}</span><em>{organization.role}</em></button>}</For></div><Show when={!profile().organizations.length}><footer>No organization membership imported yet.</footer></Show></section>
      </aside></div>
      <Show when={editing()}><div class="profile-editor-backdrop" onClick={()=>setEditing(false)}><form class="profile-editor" onSubmit={save} onClick={event=>event.stopPropagation()}><header><div><small>PUBLIC PROFILE</small><h2>Edit your profile</h2></div><button type="button" onClick={()=>setEditing(false)}>×</button></header><label>Display name<input name="displayName" value={profile().displayName??''}/></label><label>Headline<input name="headline" value={profile().headline??''}/></label><label>Bio<textarea name="bio">{profile().bio??''}</textarea></label><div><label>Location<input name="location" value={profile().location??''}/></label><label>Website<input name="website" value={profile().website??''}/></label></div><label>Profile note title<input name="noteTitle" value={profile().note.title??''}/></label><label>Profile note<textarea name="noteBody">{profile().note.body??''}</textarea></label><Show when={update.error}><p class="profile-editor-error">{update.error?.message}</p></Show><footer><button type="button" onClick={()=>setEditing(false)}>Cancel</button><button type="submit" disabled={update.isPending}>{update.isPending?'Saving…':'Save profile'}</button></footer></form></div></Show>
    </section>
  }}</Show>
}

const opsReviews = [
  ['Document the OpenGL fallback','Jonas · Docs · 42 lines','Review Friday','blue'],
  ['Scrollback regression test','Avery · Tests · 18 lines','Reviewing','green'],
  ['Clarify configuration errors','Mira · UX · 67 lines','Design review Thu','purple'],
]
const opsProposals = [
  ['Multiline prompt paste','12 replies · evidence attached','Needs direction'],
  ['Windows PTY compliance','9 replies · reproduction verified','Ready to accept'],
  ['Default color palette','8 replies · screenshots attached','Needs design owner'],
]

type ChangeSetDetectionRow = { id:string; title:string; confidence:string; memberCount:number; computedAt:string|null }

function normalizeChangeSetDetections(value:RepositoryChangeSetDetection):ChangeSetDetectionRow[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const row=item as Record<string, unknown>
    return [{
      id:typeof row.id==='string'?row.id:'unknown',
      title:typeof row.title==='string'?row.title:'Untitled change set',
      confidence:typeof row.confidence==='string'?row.confidence:'unknown',
      memberCount:Array.isArray(row.members)?row.members.length:0,
      computedAt:typeof row.computed_at==='string'?row.computed_at:null,
    }]
  })
}

function ChangeSetDetectionCard(p:{rows:()=>ChangeSetDetectionRow[]}) {
  return <section class="ops-card ops-wide change-detection-card"><header><div><small>CHANGE SET DETECTION</small><h2>Related work observed by the backend</h2></div><span class="detection-badge">evidence projection</span></header><Show when={p.rows().length} fallback={<p class="ops-empty">No related multi-repository work has been detected for this repository yet.</p>}><For each={p.rows()}>{row=><div class="ops-row"><span class="ops-dot"></span><div><b>{row.title}</b><small>{row.id} · {row.memberCount} member{row.memberCount===1?'':'s'}</small></div><em>{row.confidence} confidence</em><i>→</i></div>}</For></Show><footer>Detection is an evidence projection; the canonical multi-repository ChangeSet remains signed by Orkia.</footer></section>
}

function ProjectOperations(p:{repo:()=>Repo;operations:()=>RepositoryOperations|undefined;changeSets:()=>RepositoryChangeSetDetection}) {
  const project= p.repo
  const detectionRows=()=>normalizeChangeSetDetections(p.changeSets())
  return <section class="page ops-page"><header class="ops-header"><div><p>Authenticated workspace · {project().visibility} repository · Maintainer access</p><h1>{project().label} operations</h1></div><Show when={project().publicPath}><a href={project().publicPath}>Open public project ↗</a></Show></header><div class="ops-summary"><article><small>Needs a decision</small><b>{p.operations()?.openConflicts??3} conflicts</b><span>Concurrent versions require a human</span></article><article><small>Human review</small><b>{p.operations()?.pendingReviews??3} changes</b><span>{p.operations()?.openPullRequests??0} open pull requests</span></article><article><small>Policy health</small><b>v{p.operations()?.activePolicy?.version??4} active</b><span>{p.operations()?.pendingGates??0} gates pending</span></article><article><small>GitHub sync</small><b>{p.operations()?.pendingSync??2} pending</b><span>{p.operations()?.failedSync??0} failed operations</span></article></div><ChangeSetDetectionCard rows={detectionRows}/><div class="ops-grid"><section class="ops-card ops-wide"><header><div><small>TRIAGE</small><h2>Proposals needing a project decision</h2></div><button>View all</button></header><For each={opsProposals}>{item=><button class="ops-row"><span class="ops-dot"></span><div><b>{item[0]}</b><small>{item[1]}</small></div><em>{item[2]}</em><i>→</i></button>}</For></section><section class="ops-card"><header><div><small>CAPACITY</small><h2>Maintainers and mentors</h2></div><button>Schedule</button></header><div class="ops-people"><p><AvatarLike letters="MC"/><span><b>Mira Chen</b><small>Design · reviews Thursday</small></span><i class="free">●</i></p><p><AvatarLike letters="LM"/><span><b>Lea Martin</b><small>Terminal core · paused until Aug 12</small></span><i>●</i></p><p><AvatarLike letters="JB"/><span><b>Jonas Beck</b><small>Docs · office hours Friday</small></span><i class="free">●</i></p><p><AvatarLike letters="AS"/><span><b>Avery Singh</b><small>Windows · reproductions welcome</small></span><i class="free">●</i></p></div></section><section class="ops-card ops-wide"><header><div><small>REVIEW QUEUE</small><h2>Changes waiting for human judgment</h2></div><button>Assign reviews</button></header><For each={opsReviews}>{item=><button class="ops-row"><span class={`ops-avatar ${item[3]}`}>{item[0].slice(0,1)}</span><div><b>{item[0]}</b><small>{item[1]}</small></div><em>{item[2]}</em><i>→</i></button>}</For></section><section class="ops-card"><header><div><small>CONTRIBUTION POLICY</small><h2>{project().label} policy v4</h2></div><button>Configure</button></header><div class="ops-policy"><p><span>1</span><b>Proposal accepted</b><small>Required for code</small></p><p><span>2</span><b>Evidence record</b><small>Always available</small></p><p><span>3</span><b>Checks by code area</b><small>18 required</small></p><p><span>4</span><b>Qualified owner review</b><small>Human decision</small></p></div><footer>No vouch is mandatory. Sponsorship can accelerate routing, never replace checks.</footer></section><section class="ops-card ops-wide"><header><div><small>PROVENANCE</small><h2>Agent-assisted work awaiting attestation</h2></div><button>View records</button></header><div class="ops-provenance"><article><span>AI</span><div><b>macOS secure input state</b><small>Claude Code · implementation and tests · 6 files</small></div><p><b>18/18 checks</b><small>Human review pending</small></p><button>Review record</button></article><article><span>AI</span><div><b>Configuration reload documentation</b><small>Codex · research and draft · 2 files</small></div><p><b>6/6 checks</b><small>Jonas attested</small></p><button>Open change</button></article></div></section><section class="ops-card"><header><div><small>PROJECT ACCESS</small><h2>Progressive permissions</h2></div><button>Manage</button></header><div class="ops-access"><p><b>18</b><span>Evidence contributors</span></p><p><b>7</b><span>Code contributors</span></p><p><b>4</b><span>Qualified reviewers</span></p><p><b>2</b><span>Project owners</span></p></div><footer>Permissions are project-local, scoped, explainable, and revocable.</footer></section></div></section>
}

function AvatarLike(p:{letters:string}) { return <span class="ops-avatar">{p.letters}</span> }

function GithubMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>
}

function LoginPage(p:{checking:boolean}) {
  return <main class="login-page"><div class="login-backdrop"><i></i><i></i><i></i></div><section class="login-shell"><header><span class="login-brand">O</span><b>Orkia</b></header><div class="login-card"><small>WELCOME TO ORKIA</small><h1>Your projects, with the humans still in control.</h1><p>Sign in with GitHub to bring your repositories, contribution history, and project responsibilities into one workspace.</p><a class="github-login" href="/auth/github/start?return_to=%2F"><GithubMark/><span>Continue with GitHub</span><strong>→</strong></a><div class="login-trust"><span><b>GitHub stays connected</b><small>Orkia synchronizes metadata without moving your source code.</small></span><span><b>You stay in control</b><small>Access follows the repositories and organizations you authorize.</small></span></div><Show when={p.checking}><em>Checking your session…</em></Show></div><footer>By continuing, you authorize Orkia to use your GitHub identity for this workspace.</footer></section></main>
}

function App(p:{viewer:Viewer}) {
  const queryClient=useQueryClient()
  const [signingOut,setSigningOut]=createSignal(false)
  const logout=async()=>{if(signingOut())return;setSigningOut(true);try{await orkiaApi.logout();queryClient.clear();window.location.assign('/login')}catch{setSigningOut(false)}}
  const repositoryQuery=createQuery(()=>({queryKey:['repositories'],queryFn:orkiaApi.repositories,retry:false}))
  const inboxQuery=createQuery(()=>({queryKey:['inbox'],queryFn:()=>orkiaApi.inbox(),retry:false}))
  const feedQuery=createQuery(()=>({queryKey:['feed'],queryFn:orkiaApi.feed,retry:false}))
  const profileQuery=createQuery(()=>({queryKey:['profile'],queryFn:orkiaApi.profile,retry:false}))
  const githubImport=createMutation(()=>({mutationFn:orkiaApi.importGithubRepositories,onSuccess:repositories=>{queryClient.setQueryData(['repositories'],repositories);void queryClient.invalidateQueries({queryKey:['profile']})}}))
  let githubImportStarted=false
  createEffect(()=>{if(profileQuery.data&&repositoryQuery.isSuccess&&repositoryQuery.data?.length===0&&!githubImportStarted){githubImportStarted=true;githubImport.mutate()}})
  const liveRepos=():Repo[]=>(repositoryQuery.data??[]).map(repo=>({id:repo.id,owner:repo.namespace,name:repo.slug,label:repo.displayName,visibility:repo.visibility==='private'?'Private':'Public',mark:repo.slug.slice(0,1).toUpperCase(),publicPath:repo.visibility==='public'?`/${repo.slug}-community`:undefined}))
  const availableRepos=()=>liveRepos().length?liveRepos():fallbackRepos
  const app=useWorkspace(availableRepos); const [help,setHelp]=createSignal(false); const [composer,setComposer]=createSignal(false)
  const currentTab=()=>app.tabs().find(tab=>tab.id===app.active())??app.tabs()[0]
  const currentRepo=()=>availableRepos().find(repo=>repo.id===currentTab().repoId)??availableRepos()[0]
  const operationsQuery=createQuery(()=>({queryKey:['operations',currentRepo().id],queryFn:()=>orkiaApi.operations(currentRepo().id),enabled:currentTab().view==='project-operations'&&liveRepos().length>0,retry:false}))
  const changeSetsQuery=createQuery(()=>({queryKey:['changeSets',currentRepo().id],queryFn:()=>orkiaApi.repositoryChangeSets(currentRepo().id),enabled:currentTab().view==='project-operations'&&liveRepos().length>0,retry:false}))
  createEffect(()=>document.documentElement.dataset.theme=app.theme())
  onMount(()=>connectOrkiaEvents(()=>{void queryClient.invalidateQueries({queryKey:['repositories']});void queryClient.invalidateQueries({queryKey:['inbox']});void queryClient.invalidateQueries({queryKey:['feed']});void queryClient.invalidateQueries({queryKey:['profile']})}))
  onMount(()=>{let waiting=false;let timer:number|undefined;const clear=()=>{waiting=false;if(timer)clearTimeout(timer)};const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea,select'))return;if(e.altKey&&e.shiftKey&&e.key.toLowerCase()==='q'){e.preventDefault();void logout();return}if(e.key==='Escape'){setHelp(false);setComposer(false);clear();return}if(e.key==='? '||e.key==='?'){e.preventDefault();setHelp(true);return}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setHelp(true);return}if(e.key.toLowerCase()==='q'){setComposer(true);return}if(waiting){const next=({h:'home',y:'profile',i:'inbox',p:'pull-requests',r:'repos',o:'project-operations',u:'runtime',s:'live-sessions',a:'analytics',c:'cto-analytics'} as Record<string,ViewId>)[e.key.toLowerCase()];clear();if(next)app.open(next);return}if(e.key.toLowerCase()==='g'){waiting=true;timer=window.setTimeout(clear,900);return}if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){const all=app.tabs();const at=all.findIndex(t=>t.id===app.active());app.activate(all[e.key==='ArrowLeft'?(at-1+all.length)%all.length:(at+1)%all.length].id)}};document.addEventListener('keydown',key);onCleanup(()=>document.removeEventListener('keydown',key))})
  return <><main class="app"><Sidebar active={app.active} open={app.open} selectRepo={app.openRepo} repositories={availableRepos} inboxCount={()=>inboxQuery.data?.filter(item=>!['done','archived'].includes(item.state)).length??0} theme={app.theme} toggle={()=>app.setTheme(app.theme()==='light'?'dark':'light')} help={()=>setHelp(true)} viewer={p.viewer} logout={()=>void logout()} signingOut={signingOut}/><section class="content"><div class="tabs"><For each={app.tabs()}>{tab=><button classList={{active:app.active()===tab.id}} onClick={()=>app.activate(tab.id)}><Icon name={tab.icon}/>{tab.title}<i onClick={e=>{e.stopPropagation();app.close(tab.id)}}><Icon name="close" size={13}/></i></button>}</For><button class="add" onClick={()=>app.open('pull-requests')}><Icon name="plus"/></button><span><Icon name="search"/><Icon name="bell"/></span></div><Show when={currentTab().view==='home'} fallback={<Show when={currentTab().view==='profile'} fallback={<Show when={currentTab().view==='project-operations'} fallback={<EmptyView id={()=>currentTab().view} compose={()=>setComposer(true)} inbox={()=>inboxQuery.data??[]}/>}><ProjectOperations repo={currentRepo} operations={()=>operationsQuery.data} changeSets={()=>changeSetsQuery.data??[]}/></Show>}><ProfilePage openRepo={app.openRepo} profile={()=>profileQuery.data} loading={()=>profileQuery.isPending} error={()=>profileQuery.error}/></Show>}><HomeDashboard openRepo={app.openRepo} compose={()=>setComposer(true)} feed={()=>feedQuery.data??[]}/></Show></section></main><Show when={help()}><Help close={()=>setHelp(false)}/></Show><Show when={composer()}><Composer close={()=>setComposer(false)}/></Show></>
}

function AuthenticatedRoot() {
  const viewerQuery=createQuery(()=>({queryKey:['viewer'],queryFn:orkiaApi.me,retry:false,staleTime:60_000}))
  createEffect(()=>{if(viewerQuery.data&&window.location.pathname==='/login')window.history.replaceState(null,'','/')})
  return <Show when={viewerQuery.data} fallback={<LoginPage checking={viewerQuery.isPending}/>} >{viewer=><App viewer={viewer()}/>}</Show>
}
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:15_000,refetchOnWindowFocus:true}}})
render(()=> window.location.pathname === '/ghostty-community' ? <GhosttyCommunity/> : <QueryClientProvider client={queryClient}><AuthenticatedRoot/></QueryClientProvider>,document.getElementById('root')!)
