import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CheckCircle2, CirclePlus, ClipboardList, Clock3, LogOut, Search, Trash2, Pencil, X, ListTodo } from "lucide-react";
import api from "./api.js";

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode === "login" ? "login" : "register"}`, form);
      onAuth(data);
    } catch (err) { setError(err.response?.data?.message || "Could not connect to the server."); }
    finally { setBusy(false); }
  };
  return <main className="auth-shell">
    <section className="auth-brand"><div className="brand-mark"><ListTodo size={28}/></div><p className="eyebrow">PLAN • FOCUS • FINISH</p><h1>Your work,<br/><span>under control.</span></h1><p className="muted">A clear space for your tasks, deadlines, and next big wins.</p><div className="auth-art"><div className="art-line"></div><div className="art-card"><CheckCircle2/><div><b>Make progress visible</b><small>One task at a time.</small></div></div><div className="art-card second"><Clock3/><div><b>Stay ahead of deadlines</b><small>Keep your day in focus.</small></div></div></div></section>
    <section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand"><ListTodo/> TaskFlow</div><p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p><h2>{mode === "login" ? "Sign in to TaskFlow" : "Create your account"}</h2><p className="muted">{mode === "login" ? "Pick up where you left off." : "Your productive days start here."}</p>
      <form onSubmit={submit} className="form-stack">
        {mode === "register" && <label>Full name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></label>
        {error && <div className="alert">{error}</div>}
        <button className="primary full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form><p className="switch-auth">{mode === "login" ? "New to TaskFlow?" : "Already have an account?"} <button className="text-button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>{mode==="login"?"Create an account":"Sign in"}</button></p>
    </div><p className="auth-footer">Built for better focus · TaskFlow</p></section>
  </main>;
}

function TaskModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || { title:"", description:"", status:"Pending", priority:"Medium", dueDate:"" });
  const [error, setError] = useState("");
  const submit = async (e) => { e.preventDefault(); if (!form.title.trim()) return setError("Please enter a task title."); try { await onSave({...form, dueDate: form.dueDate || null}); onClose(); } catch (err) { setError(err.response?.data?.message || "Unable to save task."); } };
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal"><div className="modal-head"><div><p className="eyebrow">{initial ? "UPDATE TASK" : "NEW TASK"}</p><h2>{initial ? "Edit task" : "Create a task"}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></div><form onSubmit={submit} className="form-stack">
    <label>Task title<input autoFocus required maxLength="120" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="What needs to get done?"/></label>
    <label>Description<textarea rows="3" maxLength="2000" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Add a few details…"/></label>
    <div className="form-grid"><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
    <label>Deadline<input type="date" value={form.dueDate ? String(form.dueDate).slice(0,10) : ""} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label>
    {error && <div className="alert">{error}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">{initial ? "Save changes" : "Add task"}</button></div>
  </form></section></div>;
}

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All tasks");
  const [priority, setPriority] = useState("All priorities");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const loadTasks = async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (status !== "All tasks") params.status = status;
      if (priority !== "All priorities") params.priority = priority;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/tasks", { params }); setTasks(data.tasks);
    } catch (err) {
      if (err.response?.status === 401) { onLogout(); navigate("/"); return; }
      setError(err.response?.data?.message || "Could not load tasks.");
    } finally { setLoading(false); }
  };
  useEffect(()=>{ const timer=setTimeout(loadTasks, 220); return ()=>clearTimeout(timer); }, [status,priority,search]);
  const stats = useMemo(()=>({
    total: tasks.length, completed: tasks.filter(t=>t.status==="Completed").length,
    progress: tasks.filter(t=>t.status==="In Progress").length,
    pending: tasks.filter(t=>t.status==="Pending").length
  }),[tasks]);
  const saveTask = async (form) => {
    if (modal?.task) await api.put(`/tasks/${modal.task._id}`, form);
    else await api.post("/tasks", form);
    setNotice(modal?.task ? "Task updated successfully." : "Task created successfully.");
    await loadTasks();
  };
  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try { await api.delete(`/tasks/${task._id}`); setNotice("Task deleted."); await loadTasks(); }
    catch (err) { setError(err.response?.data?.message || "Could not delete task."); }
  };
  const updateStatus = async (task, next) => {
    try { await api.put(`/tasks/${task._id}`, {status:next}); await loadTasks(); }
    catch (err) { setError(err.response?.data?.message || "Could not update status."); }
  };
  const today = new Date().toISOString().slice(0,10);
  return <div className="app-shell"><aside className="sidebar"><div className="logo"><div className="brand-mark small"><ListTodo/></div><span>TaskFlow</span></div><div className="side-label">WORKSPACE</div><div className="nav-item active"><ClipboardList size={18}/> My tasks <span className="nav-count">{stats.total}</span></div><div className="sidebar-bottom"><div className="avatar">{user.name?.charAt(0).toUpperCase()}</div><div className="user-info"><b>{user.name}</b><small>{user.email}</small></div><button className="icon-btn logout" onClick={onLogout} title="Sign out"><LogOut size={17}/></button></div></aside>
    <main className="main-area"><header className="topbar"><div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p><h1>Good to see you, {user.name.split(" ")[0]} <span className="wave">✦</span></h1><p className="muted">Small steps every day lead to big results.</p></div><button className="primary" onClick={()=>setModal({task:null})}><CirclePlus size={18}/> New task</button></header>
      <section className="stats-grid"><Stat title="Tasks shown" value={stats.total} icon={<ClipboardList/>} tone="blue"/><Stat title="In progress" value={stats.progress} icon={<Clock3/>} tone="orange"/><Stat title="Completed" value={stats.completed} icon={<CheckCircle2/>} tone="green"/><Stat title="Pending" value={stats.pending} icon={<ListTodo/>} tone="purple"/></section>
      <section className="tasks-section"><div className="section-heading"><div><h2>My tasks</h2><p className="muted">Keep track of what matters today.</p></div><span className="task-count">{tasks.length} {tasks.length===1?"task":"tasks"}</span></div>
        <div className="filters"><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…"/></div><select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filter by status"><option>All tasks</option><option>Pending</option><option>In Progress</option><option>Completed</option></select><select value={priority} onChange={e=>setPriority(e.target.value)} aria-label="Filter by priority"><option>All priorities</option><option>Low</option><option>Medium</option><option>High</option></select></div>
        {notice && <div className="notice">{notice}<button onClick={()=>setNotice("")}>Dismiss</button></div>}{error && <div className="alert">{error}</div>}
        {loading ? <div className="empty-state">Loading your tasks…</div> : tasks.length===0 ? <div className="empty-state"><div className="empty-icon"><CheckCircle2/></div><h3>No tasks found</h3><p>{search || status!=="All tasks" || priority!=="All priorities" ? "Try changing your filters." : "Add your first task and get your day moving."}</p>{!search && status==="All tasks" && <button className="primary" onClick={()=>setModal({task:null})}><CirclePlus size={17}/> Create your first task</button>}</div> :
        <div className="task-list">{tasks.map(task=>{const due=task.dueDate?String(task.dueDate).slice(0,10):""; const overdue=due && due<today && task.status!=="Completed"; return <article className="task-card" key={task._id}><button className={`complete-toggle ${task.status==="Completed"?"is-done":""}`} title="Mark completed" onClick={()=>updateStatus(task,task.status==="Completed"?"Pending":"Completed")}><CheckCircle2/></button><div className="task-content"><div className="task-title-row"><h3 className={task.status==="Completed"?"done-title":""}>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>{task.description && <p className="task-description">{task.description}</p>}<div className="task-meta"><span className={`status-dot ${task.status.toLowerCase().replace(" ","-")}`}>{task.status}</span>{due && <span className={overdue?"overdue":"due-date"}><Clock3 size={13}/>{overdue?"Overdue · ":"Due "}{new Date(`${due}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span>}</div></div><div className="task-actions"><button className="icon-btn" title="Edit task" onClick={()=>setModal({task})}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete task" onClick={()=>deleteTask(task)}><Trash2 size={16}/></button></div></article>})}</div>}
      </section><footer className="page-footer">TaskFlow <span>·</span> Make room for what matters.</footer>
    </main>{modal && <TaskModal initial={modal.task ? {...modal.task,dueDate:modal.task.dueDate?String(modal.task.dueDate).slice(0,10):""} : null} onClose={()=>setModal(null)} onSave={saveTask}/>}
  </div>;
}

function Stat({title,value,icon,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{title}</p><strong>{value}</strong></div></div>; }

export default function App() {
  const [session,setSession] = useState(()=> {
    const token=localStorage.getItem("taskflow_token");
    const raw=localStorage.getItem("taskflow_user");
    return token && raw ? {token,user:JSON.parse(raw)} : null;
  });
  const navigate=useNavigate();
  const onAuth=(data)=>{localStorage.setItem("taskflow_token",data.token);localStorage.setItem("taskflow_user",JSON.stringify(data.user));setSession(data);navigate("/dashboard");};
  const onLogout=()=>{localStorage.removeItem("taskflow_token");localStorage.removeItem("taskflow_user");setSession(null);navigate("/");};
  return <Routes><Route path="/" element={session?<Navigate to="/dashboard" replace/>:<AuthPage onAuth={onAuth}/>}/><Route path="/dashboard" element={session?<Dashboard user={session.user} onLogout={onLogout}/>:<Navigate to="/" replace/>}/><Route path="*" element={<Navigate to={session?"/dashboard":"/"} replace/>}/></Routes>;
}
