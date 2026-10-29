import React, { useState, useEffect, useMemo, useRef, useContext, useCallback, createContext, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, NavLink, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';

const KU = 'https://karunya.edu/img/homepage/';
const LOGO = 'https://www.karunya.edu/themes/porto/img/KU_logo_web.png';
const photo = n => `${KU}Slides/slide${n}.jpg`;
const DEPTS = ['ECE', 'Mechanical', 'Civil', 'CSE', 'EIE', 'MBA', 'M.Tech', 'Ph.D'];
const ROW1 = [1, 2, 4, 6, 8, 10, 11], ROW2 = [12, 13, 14, 15, 16, 18, 5];
const GALLERY = [1, 2, 4, 5, 6, 8, 10, 11, 12, 13, 14, 15, 16, 18];

const Connected = createContext(); // Context: ids of alumni I have connected with

const api = async (url, method, body) => {
  const r = await fetch('/api/' + url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
};

// ---------- small components (props) ----------
// real photo, falling back to initials if it fails to load
const Avatar = ({ a, size = 72 }) => {
  const [bad, setBad] = useState(!a.photo);
  return bad
    ? <div className="avatar" style={{ width: size, height: size, fontSize: size / 2.6 }}>{a.name.replace(/^(Dr|Mr|Ms)\.? /, '').split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
    : <img className="avatar" style={{ width: size, height: size }} src={a.photo} alt={a.name} onError={() => setBad(true)} />;
};

const Head = ({ title, sub }) => <div className="head fade-up"><h2>{title}</h2>{sub && <p className="muted mt-3 mb-0">{sub}</p>}</div>;
const Page = ({ title, sub, children }) => <main className="container py-5 fade-up">{title && <Head title={title} sub={sub} />}{children}</main>;

// endlessly sliding strip (CSS animation on a duplicated track)
const Marquee = ({ children, rev, speed = 50 }) => (
  <div className="marquee"><div className={'track' + (rev ? ' rev' : '')} style={{ animationDuration: speed + 's' }}>{children}{children}</div></div>
);

// memo: a card re-renders only when its own data changes
const AlumCard = memo(({ a, done, onConnect }) => (
  <div className="col-md-6 col-lg-4 fade-up">
    <div className="card-box card-alum h-100">
      <div className="d-flex gap-3 align-items-center">
        <Avatar a={a} />
        <div>
          <Link to={`/alumni/${a._id}`} className="stretched"><h5 className="mb-1 fs-6">{a.name}</h5></Link>
          <small className="d-block">{a.role}</small>
          <small className="fw-medium text-primary">{a.company}</small>
        </div>
      </div>
      <ul className="chips"><li>{a.dept}</li><li>Batch {a.batch}</li>{a.location && <li>📍 {a.location}</li>}</ul>
      <div className="d-flex justify-content-between align-items-center">
        <small>{a.connections} connections</small>
        <button className={'btn btn-blue btn-sm' + (done ? ' done' : '')} disabled={done} onClick={() => onConnect(a._id)}>{done ? 'Connected ✓' : 'Connect'}</button>
      </div>
    </div>
  </div>
));

// custom hook: connect with an alumnus, update the list in place, remember it
const useConnect = setList => {
  const { add } = useContext(Connected);
  return useCallback(async id => {
    const u = await api(`alumni/${id}/connect`, 'PATCH');
    setList(l => (Array.isArray(l) ? l.map(a => (a._id === id ? { ...a, connections: u.connections } : a)) : l));
    add(id);
    toast('Connection request sent');
  }, [setList, add]);
};

// ---------- layout ----------
function Header() {
  return (
    <>
      <div className="topstrip"><div className="container">
        {[['Karunya University', 'https://www.karunya.edu/'], ['Students', 'https://www.karunya.edu/'], ['Faculty', 'https://www.karunya.edu/'], ['Alumni Association', 'https://kitsaa.org/']].map(([t, h]) => <a key={t} href={h} target="_blank" rel="noreferrer">{t}</a>)}
      </div></div>
      <div className="brandbar"><div className="container d-flex align-items-center">
        <Link to="/"><img src={LOGO} alt="Karunya Deemed University" /></Link>
        <div className="tag d-none d-sm-block"><div className="slab fs-5">Alumni Portal</div><small>Where Karunyans Grow to Change the World</small></div>
        <Link to="/join" className="btn btn-red ms-auto px-4">Register Now</Link>
      </div></div>
      <nav className="navbar navbar-expand-md">
        <div className="container">
          <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu"><span className="navbar-toggler-icon" /></button>
          <div className="collapse navbar-collapse" id="menu">
            <ul className="navbar-nav">
              {[['/', 'Home'], ['/alumni', 'Alumni Directory'], ['/speak', 'Alumni Speak'], ['/campus', 'Campus & Events'], ['/join', 'Join Network']].map(([to, t]) => (
                <li className="nav-item" key={to}><NavLink end={to === '/'} className="nav-link" to={to}>{t}</NavLink></li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

// ---------- alumni videos (from the Karunya alumni YouTube channel) ----------
const videos = [
  ['zbbHXoBpzfM', 'Karunya Alumni Speaks – Life After Karunya University'],
  ['PFFJpCPrUiU', 'Hear from Karunya’s Silver Jubilee Alumni Ruling the World'],
  ['BqS_jEst47s', 'Silver Jubilee Reunion 2026 – Class of 2001 EIE Returns to Karunya'],
  ['qMwpkB5wfKc', 'Silver Jubilee Reunion Celebration – 1996–2000 Batch'],
  ['BGwR53nWDbc', 'London, Australia Back to Karunya – Silver Jubilee Alumni Share Memories'],
];

function Videos() {
  const [i, setI] = useState(0);
  const [id, title] = videos[i];
  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="ratio ratio-16x9"><iframe key={id} title={title} src={`https://www.youtube.com/embed/${id}?rel=0`} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>
        <h5 className="mt-3 fs-6">{title}</h5>
      </div>
      <div className="col-lg-4 vlist">
        {videos.map(([vid, t], k) => (
          <button key={vid} className={'vitem' + (k === i ? ' on' : '')} onClick={() => setI(k)}>
            <img src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`} alt="" /><span>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- pages ----------
const news = [
  ['26 Feb 2026', 'Dr. Ben John (Ph.D 2016) appointed Chief Technology Officer at Digital Turbine', 'https://kitsaa.org/newsroom/news/Dr-Ben-John-Vice-President-Engineering-at-Microsoft-AI-New-York-City-PhD-2016-is-a-proud-Karunya-Alumnus.dz'],
  ['27 Apr 2026', 'Times Higher Education Asia Rankings 2026 places Karunya in the 401–500 band', 'https://kitsaa.org/newsroom/news/Times-Higher-Education-THE-Asia-Rankings-2026-places-Karunya-in-the-401500-band.dz'],
  ['25 Feb 2026', 'Karunya Alumni Get-Together, Hong Kong', 'https://kitsaa.org/newsroom/news/Karunya-Alumni-Get-Together-Hong-Kong.dz'],
];
const recognitions = ['Accreditations/NAAC%20A++.png', 'Accreditations/NBA.png', 'Accreditations/Category%201%20UGC.png', 'Approvals/AICTE.png', 'India-Rating/QS%20I%20Gauge%20Platinum.png', 'India-Ranking/NIRF%20Ranking.png', 'Accreditations/ICAR.png'];

function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  useEffect(() => { api('alumni/stats').then(setStats); api('alumni?limit=30').then(setTop); }, []);
  useEffect(() => { stats && countUp('.count'); }, [stats]);

  const numbers = [[39, '', 'Years & counting'], [720, '+', 'Acres of campus'], [50000, '+', 'Alumni across the globe'], [2163, '+', 'Placement offers 2025'], [stats ? stats.alumni : 0, '', 'Distinguished alumni listed']];
  return (
    <>
      <section className="hero">
        <Marquee speed={70}>{ROW1.map(n => <img key={n} src={photo(n)} alt="Karunya campus life" />)}</Marquee>
        <div className="container text-center py-5 fade-up">
          <span className="eyebrow">KARUNYA ALUMNI NETWORK</span>
          <h1 className="my-3">Where Karunyans Grow to <span>Change the World</span></h1>
          <p className="muted fs-5 mx-auto" style={{ maxWidth: 640 }}>Reconnect with batchmates, discover alumni leading across industries and give back to the community that shaped you.</p>
          <form className="search-card d-flex gap-2 mx-auto mt-4" onSubmit={e => { e.preventDefault(); nav('/alumni?q=' + encodeURIComponent(q)); }}>
            <input className="form-control" placeholder="Search alumni by name, company or role…" value={q} onChange={e => setQ(e.target.value)} />
            <button className="btn btn-blue px-4">Search</button>
          </form>
        </div>
        <Marquee rev speed={80}>{ROW2.map(n => <img key={n} src={photo(n)} alt="Karunya campus life" />)}</Marquee>
      </section>

      <section className="stats"><div className="container"><div className="row g-4 justify-content-center">
        {numbers.map(([n, plus, l]) => <div className="col-6 col-md" key={l}><b><span className="count" data-to={n}>{stats ? 0 : n}</span>{plus}</b><small>{l}</small></div>)}
      </div></div></section>

      <section className="py-5"><div className="container">
        <Head title="Distinguished Alumni" sub="Karunyans leading at Microsoft, Reliance Jio, ISRO, Bank of America and beyond" />
      </div>
      {top.length > 0 && <Marquee speed={top.length * 4}>{top.map(a => (
        <div className="slide-card card-box" key={a._id}>
          <Avatar a={a} size={104} />
          <h6 className="mt-3 mb-1"><Link to={`/alumni/${a._id}`} className="stretched">{a.name}</Link></h6>
          <small className="d-block">{a.role}</small>
          <small className="text-primary fw-medium">{a.company}</small>
          <div><span className="pill">{a.dept} · {a.batch}</span></div>
        </div>
      ))}</Marquee>}
      <div className="text-center mt-4"><Link to="/alumni" className="btn btn-ghost">View all alumni →</Link></div>
      </section>

      <section className="bg-white py-5"><div className="container">
        <Head title="Alumni Speak" sub="Hear it from Karunyans themselves" />
        <Videos />
      </div></section>

      <Page title="Alumni Newsroom" sub="Latest from the Karunya alumni community">
        <div className="row g-4">
          {news.map(([d, t, h]) => (
            <div className="col-md-4" key={t}><a className="card-box news d-block h-100 text-decoration-none" href={h} target="_blank" rel="noreferrer"><small className="text-danger fw-medium">{d}</small><h5 className="fs-6 mt-2 mb-3">{t}</h5><small className="text-primary">Read more →</small></a></div>
          ))}
        </div>
      </Page>

      <section className="bg-white py-5"><div className="container text-center">
        <Head title="Accreditations & recognitions" sub="NAAC A++ accredited · Category 1 UGC" />
        <Marquee speed={30}>{recognitions.map(r => <img className="logo" key={r} src={KU + r} alt="Accreditation" />)}</Marquee>
      </div></section>
    </>
  );
}

function Directory() {
  const [params] = useSearchParams();
  const [f, setF] = useState({ q: params.get('q') || '', batch: '', dept: '' });
  const [list, setList] = useState(null);
  const { mine } = useContext(Connected);
  const search = useRef();
  const connect = useConnect(setList);
  const years = useMemo(() => [1990, 1993, 1995, 1998, 2000, 2002, 2005], []);

  useEffect(() => search.current.focus(), []);
  useEffect(() => { // debounced query to MongoDB
    let live = true;
    const t = setTimeout(() => api('alumni?' + new URLSearchParams(f)).then(d => live && setList(d)), 250);
    return () => { live = false; clearTimeout(t); };
  }, [f]);

  return (
    <Page title="Alumni Directory" sub="Search, filter and connect with fellow Karunyans">
      <div className="row g-3 mb-3">
        <div className="col-md-8"><input ref={search} className="form-control" placeholder="Search name, company or role…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></div>
        <div className="col-md-4">
          <select className="form-select" value={f.batch} onChange={e => setF({ ...f, batch: e.target.value })}>
            <option value="">Any batch</option>{years.map(y => <option key={y} value={y}>Batch {y} and later</option>)}
          </select>
        </div>
      </div>
      <ul className="chips filters mb-4">
        {DEPTS.map(s => <li key={s} className={f.dept === s ? 'on' : ''} onClick={() => setF({ ...f, dept: f.dept === s ? '' : s })}>{s}</li>)}
      </ul>
      {list === null ? <div className="text-center"><div className="spinner-border text-primary" /></div>
        : list.length === 0 ? <p className="text-center muted">No alumni match your search.</p>
        : <div className="row g-4">{list.map(a => <AlumCard key={a._id} a={a} done={mine.includes(a._id)} onConnect={connect} />)}</div>}
    </Page>
  );
}

function Profile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { mine, add } = useContext(Connected);
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('alumni/' + id).then(setA).catch(e => setErr(e.message)); }, [id]);

  if (err) return <Page><p className="text-danger text-center">{err}</p></Page>;
  if (!a) return <Page><div className="text-center"><div className="spinner-border text-primary" /></div></Page>;

  const connect = async () => { const u = await api(`alumni/${id}/connect`, 'PATCH'); setA({ ...a, connections: u.connections }); add(id); toast('Connection request sent'); };
  const remove = async () => { if (confirm('Delete this profile?')) { await api('alumni/' + id, 'DELETE'); toast('Profile deleted'); nav('/alumni'); } };

  return (
    <Page>
      <div className="card-box mx-auto" style={{ maxWidth: 760 }}>
        <div className="d-flex gap-4 align-items-center flex-wrap">
          <Avatar a={a} size={140} />
          <div>
            <h2 className="mb-1 fs-3">{a.name}</h2>
            <p className="mb-1">{a.role}</p>
            <p className="mb-2 text-primary fw-medium">{a.company}</p>
            <ul className="chips m-0"><li>{a.dept}</li><li>Batch {a.batch}</li>{a.location && <li>📍 {a.location}</li>}</ul>
          </div>
        </div>
        <p className="mt-4">{a.bio}</p>
        <p><small>{a.email && `✉️ ${a.email} · `}{a.connections} connections</small></p>
        <div className="d-flex gap-2">
          <button className={'btn btn-blue' + (mine.includes(id) ? ' done' : '')} disabled={mine.includes(id)} onClick={connect}>{mine.includes(id) ? 'Connected ✓' : 'Connect'}</button>
          <Link to="/alumni" className="btn btn-ghost">Back</Link>
          <button className="btn btn-ghost ms-auto" onClick={remove}>Delete</button>
        </div>
      </div>
    </Page>
  );
}

// form validation rules: each returns true or an error message
const rules = {
  name: v => v.trim().length >= 3 || 'At least 3 characters',
  email: v => /^\S+@\S+\.\S+$/.test(v) || 'Enter a valid email',
  batch: v => (v >= 1987 && v <= 2030) || 'Year must be 1987 – 2030',
  dept: v => !!v || 'Select a department',
  role: v => !!v.trim() || 'Required',
  company: v => !!v.trim() || 'Required',
};
const fields = [['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['batch', 'Graduation year', 'number'], ['dept', 'Department'], ['role', 'Job title', 'text'], ['company', 'Company', 'text'], ['location', 'City / Country', 'text']];

function Join() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', batch: '', dept: '', role: '', company: '', location: '', bio: '' });
  const [tried, setTried] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const errors = Object.fromEntries(Object.entries(rules).map(([k, r]) => [k, r(form[k])]).filter(([, r]) => r !== true));

  const submit = async e => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) return;
    try {
      const a = await api('alumni', 'POST', form);
      toast(`Welcome to the network, ${a.name}!`);
      nav('/alumni/' + a._id);
    } catch (err) { setServerErr(err.message); }
  };

  return (
    <Page title="Join the Alumni Network" sub="Create your Karunya alumni profile in a minute">
      <form noValidate onSubmit={submit} className="card-box mx-auto" style={{ maxWidth: 640 }}>
        <div className="row g-3">
          {fields.map(([k, label, type]) => (
            <div className="col-md-6" key={k}>
              <label className="form-label small">{label}</label>
              {type ? <input type={type} className={'form-control' + (tried && errors[k] ? ' is-invalid' : '')} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
                : <select className={'form-select' + (tried && errors[k] ? ' is-invalid' : '')} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}><option value="">Select…</option>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>}
              <div className="invalid-feedback">{errors[k]}</div>
            </div>
          ))}
          <div className="col-12"><label className="form-label small">Short bio</label><textarea rows="3" className="form-control" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
        </div>
        {serverErr && <p className="text-danger mt-3 mb-0">{serverErr}</p>}
        <button className="btn btn-blue w-100 mt-4">Create profile</button>
      </form>
    </Page>
  );
}

const events = [['19 Sep 2026', 'Karunya Bangalore Alumni Chapter Meet'], ['05 Sep 2026', 'Silver Jubilee Reunion – Civil 2001 Batch'], ['01 Jun 2026', 'Silver Jubilee Reunion – 2001 EIE Batch'], ['28 Dec 2025', 'Silver Jubilee Reunion – 2000 Batch'], ['06 Oct 2025', 'The Karunya University Alumni Meet 2025'], ['Jul 2025', 'Reunion of the 1988 Batch, Chennai']];

function Campus() {
  const [open, setOpen] = useState(null);
  return (
    <Page title="Campus & Events" sub="720+ acres of serene, nature-rich campus in the foothills of the Western Ghats">
      <div className="row g-3 gallery mb-5">
        {GALLERY.map(n => <div className="col-6 col-md-4 col-lg-3" key={n}><div onClick={() => setOpen(n)}><img src={photo(n)} alt="Karunya campus" /></div></div>)}
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <h5>Reunions & alumni meets</h5>
          <table className="table align-middle">
            <thead><tr><th>Date</th><th>Event</th></tr></thead>
            <tbody>{events.map(([d, e]) => <tr key={e}><td className="text-nowrap">{d}</td><td>{e}</td></tr>)}</tbody>
          </table>
          <h5 className="mt-4">Visit the campus</h5>
          <p className="muted mb-1">Alumni Affairs Office, Karunya Nagar, Coimbatore – 641 114</p>
          <ol className="muted"><li>Email <a href="mailto:alumni@karunya.edu">alumni@karunya.edu</a></li><li>Call 0422-2614315</li><li>Plan your visit via the <a href="https://kitsaa.org/" target="_blank" rel="noreferrer">alumni association</a></li></ol>
        </div>
        <div className="col-lg-6"><iframe title="Karunya campus map" height="360" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=76.72%2C10.92%2C76.76%2C10.95&layer=mapnik" /></div>
      </div>
      {open && <div className="lightbox" onClick={() => setOpen(null)}><img src={photo(open)} alt="Karunya campus" /></div>}
    </Page>
  );
}

function App() {
  const [mine, setMine] = useState(() => JSON.parse(localStorage.getItem('mine') || '[]'));
  const add = useCallback(id => setMine(m => (m.includes(id) ? m : [...m, id])), []);
  useEffect(() => localStorage.setItem('mine', JSON.stringify(mine)), [mine]);
  return (
    <Connected.Provider value={{ mine, add }}>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alumni" element={<Directory />} />
          <Route path="/alumni/:id" element={<Profile />} />
          <Route path="/speak" element={<Page title="Alumni Speak" sub="Stories and reunions from the Karunya alumni channel"><Videos /></Page>} />
          <Route path="/join" element={<Join />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="*" element={<Page title="404" sub="Page not found" />} />
        </Routes>
      </HashRouter>
    </Connected.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
