<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TAMVA Trust Network — relationship &amp; risk-signal graph</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/css/inter@latest/latin-400-normal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/css/inter@latest/latin-600-normal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/css/inter@latest/latin-700-normal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/css/jetbrains-mono@latest/latin-400-normal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/css/jetbrains-mono@latest/latin-600-normal.css">
<style>
:root{
  --bg:#06120c; --bg2:#081a11; --panel:#0b1d14f2; --panel2:#0e2419; --panel3:#123021;
  --border:#1a3a29; --border2:#14301f;
  --text:#e7f6ee; --dim:#9db8a9; --mute:#6d8b7b;
  --accent:#2dd4a0; --accent-soft:rgba(45,212,160,.13);
  --red:#f4586c; --red-soft:rgba(244,88,108,.13);
  --amber:#f5b544; --amber-soft:rgba(245,181,68,.13);
  --blue:#5ea3f7; --blue-soft:rgba(94,163,247,.13);
  --shadow:0 22px 54px rgba(0,0,0,.5);
}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased;
 background-image:radial-gradient(1100px 480px at 80% -10%,rgba(45,212,160,.08),transparent 60%),linear-gradient(rgba(45,212,160,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,160,.035) 1px,transparent 1px);background-size:auto,46px 46px,46px 46px}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
button,input,select{font:inherit;color:inherit}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px}
.app{display:flex;min-height:100vh}
.side{width:236px;flex:0 0 auto;border-right:1px solid var(--border);background:linear-gradient(180deg,var(--bg2),var(--bg));display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.logo{display:flex;align-items:center;gap:10px;padding:18px 18px 6px}
.logo .mk{width:34px;height:34px;border-radius:10px;background:linear-gradient(140deg,var(--accent),#0d9488);display:grid;place-items:center;color:#04140c;font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(45,212,160,.3)}
.logo h1{margin:0;font-size:16px;letter-spacing:.06em;font-weight:700}
.logo p{margin:1px 0 0;font-size:9.5px;color:var(--mute)}
.nav{padding:14px 10px;display:flex;flex-direction:column;gap:2px}
.nv{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;color:var(--dim);font-size:12.5px;font-weight:600;cursor:pointer;border:0;background:transparent;text-align:left;transition:.15s}
.nv:hover{background:var(--panel2);color:var(--text)}
.nv.on{background:var(--accent-soft);color:var(--accent);box-shadow:inset 2px 0 0 var(--accent)}
.nv.dis{opacity:.42;cursor:not-allowed}
.nv .bdg{margin-left:auto;background:var(--red);color:#fff;border-radius:999px;font-size:9.5px;padding:1px 6px;font-weight:700}
.nv .own{margin-left:auto;font-size:8.5px;letter-spacing:.08em;color:var(--mute);text-transform:uppercase}
.sidefoot{margin-top:auto;padding:16px 18px;border-top:1px solid var(--border2)}
.sidefoot .tag{font-size:9.5px;letter-spacing:.16em;color:var(--dim);font-weight:700;line-height:1.7}
.sidefoot .bar{width:34px;height:3px;background:var(--amber);border-radius:2px;margin:10px 0}
.sidefoot .cp{font-size:9.5px;color:var(--mute);margin-top:8px;line-height:1.6}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:12px;padding:12px 22px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(14px)}
.search{position:relative;flex:1;max-width:460px}
.search input{width:100%;padding:8px 12px 8px 31px;border-radius:9px;border:1px solid var(--border);background:var(--panel2);outline:none;font-size:12.5px}
.search input:focus{border-color:var(--accent)}
.search svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);opacity:.5}
.pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border:1px solid var(--border);border-radius:999px;background:var(--panel2);font-size:11px;color:var(--dim);white-space:nowrap}
.pill .dt{width:7px;height:7px;border-radius:50%;background:var(--accent)}
.spacer{flex:1}
.btn{border:1px solid var(--border);background:var(--panel2);color:var(--text);padding:7px 13px;border-radius:9px;cursor:pointer;font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:7px;transition:.15s;white-space:nowrap}
.btn:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--border));transform:translateY(-1px)}
.btn.primary{background:linear-gradient(140deg,var(--accent),#0d9488);border-color:transparent;color:#04140c}
.btn.ghost{background:transparent}
.btn.sm{padding:4px 9px;font-size:11.5px;border-radius:7px}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn.on{background:var(--accent-soft);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.head{padding:20px 22px 4px;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
.head h2{margin:0;font-size:23px;letter-spacing:-.01em}
.head p{margin:4px 0 0;color:var(--dim);font-size:12.5px;max-width:760px}
.head .quote{margin-left:auto;font-size:11.5px;color:var(--dim);font-style:italic;text-align:right;border-left:2px solid var(--amber);padding-left:10px}
.tabs{display:flex;gap:4px;padding:14px 22px 0;border-bottom:1px solid var(--border);flex-wrap:wrap}
.tab{border:0;background:transparent;padding:9px 15px;border-radius:10px 10px 0 0;cursor:pointer;color:var(--dim);font-size:12.5px;font-weight:600;border-bottom:2px solid transparent}
.tab:hover{color:var(--text);background:var(--panel2)}
.tab.on{color:var(--accent);border-bottom-color:var(--accent);background:var(--accent-soft)}
.content{padding:16px 22px 26px;display:flex;flex-direction:column;gap:14px}
.panel{display:none;flex-direction:column;gap:14px}.panel.on{display:flex}
.card{border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:var(--shadow)}
.card>h3{margin:0;padding:11px 14px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--border2);display:flex;align-items:center;gap:8px;font-weight:700;flex-wrap:wrap}
.card>h3 .spacer{flex:1}
.card .body{padding:13px 14px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px}
.kpi{border:1px solid var(--border);border-radius:13px;background:linear-gradient(160deg,var(--panel2),var(--panel));padding:13px 15px;display:flex;gap:12px;align-items:center}
.kpi .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:16px;flex:0 0 auto}
.kpi .k{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);font-weight:700}
.kpi .v{font-size:21px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi .s{font-size:10.5px;color:var(--dim)}
.grid3{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;align-items:start}
.gwrap{position:relative;height:calc(100vh - 330px);min-height:470px;overflow:hidden;border-radius:0 0 14px 14px}
#cv{display:block;width:100%;height:100%;cursor:grab;touch-action:none}
#cv.grab{cursor:grabbing}
.ov{position:absolute;inset:0;pointer-events:none}
.ctl{position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:7px;pointer-events:auto}
.ctl .row{display:flex;gap:6px;flex-wrap:wrap}
.legend{position:absolute;bottom:12px;left:12px;pointer-events:auto;border:1px solid var(--border);border-radius:11px;background:color-mix(in srgb,var(--panel) 93%,transparent);backdrop-filter:blur(8px);padding:10px 12px;font-size:11px;color:var(--dim);max-width:270px}
.legend h5{margin:0 0 7px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.legend .li{display:flex;align-items:center;gap:7px;margin:3px 0}
.legend .note{margin-top:8px;padding-top:8px;border-top:1px solid var(--border2);font-size:10px;color:var(--mute);line-height:1.55}
.insp{position:absolute;top:12px;right:12px;width:280px;pointer-events:auto;border:1px solid var(--border);border-radius:12px;background:color-mix(in srgb,var(--panel) 95%,transparent);backdrop-filter:blur(10px);overflow:hidden;max-height:calc(100% - 24px);display:flex;flex-direction:column}
.insp .ih{padding:11px 13px;border-bottom:1px solid var(--border2);display:flex;align-items:center;gap:9px}
.insp .ib{padding:11px 13px;overflow:auto;font-size:12px}
.tip{position:absolute;pointer-events:none;z-index:20;padding:7px 10px;border-radius:9px;border:1px solid var(--border);background:var(--panel2);font-size:11.5px;box-shadow:var(--shadow);opacity:0;transition:opacity .12s;max-width:260px}
.tip.on{opacity:1}
.badge{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.b-high{background:var(--red-soft);color:var(--red)}.b-medium{background:var(--amber-soft);color:var(--amber)}.b-low{background:var(--accent-soft);color:var(--accent)}
.b-obs{background:var(--accent-soft);color:var(--accent)}.b-inf{background:var(--blue-soft);color:var(--blue)}
table{width:100%;border-collapse:collapse}
thead th{background:var(--panel2);text-align:left;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--mute);font-weight:700;padding:9px 11px;border-bottom:1px solid var(--border)}
tbody td{padding:8px 11px;border-bottom:1px solid var(--border2);font-size:12.5px;vertical-align:middle}
.rowlist{display:flex;flex-direction:column}
.rl{display:flex;gap:10px;align-items:flex-start;padding:9px 14px;border-bottom:1px solid var(--border2)}
.rl:last-child{border-bottom:0}
.rl .ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex:0 0 auto;font-size:12px}
.rl .t{font-size:12px;font-weight:600}
.rl .s{font-size:10.5px;color:var(--mute)}
.gov{display:flex;flex-direction:column;gap:8px}
.gov .g{display:flex;align-items:center;gap:9px;font-size:11.5px;padding:7px 10px;border:1px solid var(--border2);border-radius:9px;background:var(--panel2)}
.gov .g .st{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--accent)}
.gov .g .st i{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.rules{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.rules li{display:flex;gap:9px;font-size:11.5px;color:var(--dim);line-height:1.55}
.rules li::before{content:'•';color:var(--accent);font-weight:700}
.bar{height:7px;border-radius:4px;background:var(--panel3);overflow:hidden}
.bar i{display:block;height:100%;border-radius:4px}
.backdrop{position:fixed;inset:0;z-index:80;background:rgba(2,8,5,.76);backdrop-filter:blur(5px);display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow:auto}
.backdrop.on{display:flex}
.modal{width:min(560px,100%);border:1px solid var(--border);border-radius:16px;background:var(--panel2);box-shadow:var(--shadow)}
.modal header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:11px}
.modal header h2{margin:0;font-size:15px}
.modal .body{padding:16px 18px}
.xbtn{border:1px solid var(--border);background:var(--panel3);border-radius:8px;height:30px;width:30px;cursor:pointer;color:var(--mute)}
.xbtn:hover{color:var(--red)}
#toasts{position:fixed;right:16px;bottom:16px;z-index:120;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.toast{border:1px solid var(--border);background:var(--panel2);border-radius:11px;padding:10px 14px;font-size:12.5px;box-shadow:var(--shadow);display:flex;gap:9px;align-items:center;max-width:360px}
.toast.ok{border-left:3px solid var(--accent)}.toast.err{border-left:3px solid var(--red)}.toast.info{border-left:3px solid var(--blue)}.toast.warn{border-left:3px solid var(--amber)}
.foot{display:flex;gap:16px;align-items:center;padding:10px 22px;border-top:1px solid var(--border);font-size:11px;color:var(--mute);flex-wrap:wrap;background:var(--bg2)}
.empty{padding:34px 16px;text-align:center;color:var(--mute);font-size:12.5px}
.hide{display:none!important}
svg.chart{display:block;width:100%;height:170px}
@media(max-width:1100px){.grid3{grid-template-columns:1fr}.siggrid{grid-template-columns:1fr!important}.app{flex-direction:column}.side{width:100%;height:auto;position:static}.sidefoot{display:none}.nav{flex-direction:row;flex-wrap:wrap}}
</style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="logo"><div class="mk">T</div><div><h1>TAMVA</h1><p>People. Data. Trust. Opportunity.</p></div></div>
    <nav class="nav">
      <button class="nv dis" title="Owned by platform squad — not in this drop">⌂ Overview</button>
      <button class="nv dis" title="Owned by risk squad">⚠ Risk Events <span class="bdg">12</span></button>
      <button class="nv dis" title="Owned by risk squad">▤ Cases <span class="bdg">3</span></button>
      <button class="nv dis" title="Owned by onboarding squad">☺ Customers</button>
      <button class="nv on">⌬ Network <span class="own">this drop</span></button>
      <button class="nv dis" title="Separate drop — see tamva-ledger.html">≣ Ledger <span class="own">ledger drop</span></button>
      <button class="nv dis" title="Owned by analytics squad">∿ Analytics</button>
      <button class="nv dis" title="Owned by platform squad">⚙ Settings</button>
    </nav>
    <div class="sidefoot">
      <div class="tag">A MORE INCLUSIVE<br>FINANCIAL FUTURE<br>FOR AFRICA.</div><div class="bar"></div>
      <div class="logo" style="padding:0"><div class="mk" style="width:22px;height:22px;border-radius:7px;font-size:11px">T</div><b style="font-size:12px">TAMVA</b></div>
      <div class="cp">© 2026 TAMVA<br>All rights reserved.<br><span class="mono" style="font-size:9px">trust-graph module v1 · branch feature/ledger-graph</span></div>
    </div>
  </aside>

  <div class="main">
    <div class="top">
      <div class="search"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04-1.06 1.06ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z"/></svg>
        <input id="q" placeholder="Search customers, accounts, devices, beneficiaries, merchants, transactions… (Enter)"></div>
      <span class="pill"><span class="dt"></span>Production</span>
      <span class="pill">🏛 Partner Bank · Institution Portal</span>
      <div class="spacer"></div>
      <span class="pill">RK · Risk Team · Analyst</span>
    </div>

    <div class="head">
      <div><h2>TAMVA Trust Network</h2>
      <p>Understand relationships. Detect coordinated risk. Protect the ecosystem. The network layer models relationships between people, accounts, devices, beneficiaries, merchants, transactions and institutions — risk intelligence without becoming a general-purpose surveillance system.</p></div>
      <div class="quote">“Stronger institutions.<br>Safer communities.”</div>
    </div>

    <div class="content">
      <div class="kpis" id="kpis"></div>

      <div class="tabs" id="tabs">
        <button class="tab on" data-tab="network">Network Graph</button>
        <button class="tab" data-tab="entities">Entity View</button>
        <button class="tab" data-tab="clusters">Cluster Analysis</button>
        <button class="tab" data-tab="geo">Geographic View</button>
        <button class="tab" data-tab="time">Time Analysis</button>
      </div>

      <!-- ============ NETWORK ============ -->
      <section class="panel on" id="panel-network">
        <div class="grid3">
          <div class="card">
            <h3>Financial Trust Network
              <span class="spacer"></span>
              <span class="badge b-obs">● observed</span>
              <span class="badge b-inf">◌ inferred</span>
              <button class="btn sm on" id="fObs">Observed</button>
              <button class="btn sm on" id="fInf">Inferred</button>
              <button class="btn sm on" id="fDecay">Time decay</button>
              <button class="btn sm on" id="fLabels">Labels</button>
              <select id="scope" style="padding:4px 8px;border-radius:7px;border:1px solid var(--border);background:var(--panel2);font-size:11px"></select>
            </h3>
            <div class="gwrap" id="gwrap">
              <canvas id="cv"></canvas>
              <div class="ov">
                <div class="ctl">
                  <div class="row"><button class="btn sm" id="zIn">＋</button><button class="btn sm" id="zOut">－</button><button class="btn sm" id="zFit">⤢ Fit</button><span class="pill mono" id="zLbl" style="cursor:default">100%</span></div>
                  <div class="row"><button class="btn sm" id="pathMode">⇢ Explain path</button><button class="btn sm" id="reheat">↻ Re-layout</button></div>
                  <div class="row"><span class="pill" id="pathHint" style="display:none">click source node, then target node · Esc cancels</span></div>
                </div>
                <div class="legend">
                  <h5>Node types &amp; governance</h5>
                  <div id="legendBody"></div>
                  <div class="note">Schema edges: <b>owns · uses · sends · seen_with · receives</b>. Inferred edges are risk signals, <b>not guilt</b>. Width ∝ confidence × time-decay (30-day half-life).</div>
                </div>
                <div class="insp hide" id="insp">
                  <div class="ih"><span id="insDot" style="width:9px;height:9px;border-radius:50%"></span>
                    <div style="flex:1;min-width:0"><div id="insName" style="font-weight:600;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
                    <div class="mono" id="insSub" style="font-size:9.5px;color:var(--mute)"></div></div>
                    <button class="xbtn" id="insClose">✕</button></div>
                  <div class="ib" id="insBody"></div>
                </div>
                <div class="tip" id="tip"></div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="card"><h3>Cluster Intelligence <span class="spacer"></span><span class="mono" style="font-size:9.5px;color:var(--mute)" id="clId">—</span></h3><div class="body" id="clBody"><div class="empty">Select a node or cluster in the graph.</div></div></div>
            <div class="card"><h3>Privacy &amp; Governance</h3>
              <div class="body"><div class="gov">
                <div class="g">✓ Consent-based data usage<span class="st"><i></i>Active</span></div>
                <div class="g">✓ Purpose limitation<span class="st"><i></i>Enforced</span></div>
                <div class="g">✓ Data minimization<span class="st"><i></i>Compliant</span></div>
                <div class="g">✓ Access audit logging<span class="st"><i></i>Enabled</span></div>
                <div class="g">✓ Retention controls<span class="st"><i></i>Enforced</span></div>
              </div>
              <div style="margin-top:10px;display:flex;gap:9px;align-items:flex-start;border:1px solid var(--border2);border-radius:10px;padding:9px 11px;background:var(--panel2)">
                <span style="color:var(--accent)">🛡</span><div style="font-size:10.5px;color:var(--dim);line-height:1.55"><b style="color:var(--text)">Privacy-preserving intelligence.</b> Only authorized signals are used. Customer data remains secure and under institutional control.</div>
              </div></div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="siggrid">
          <div class="card"><h3>Network Signals</h3><div class="rowlist" id="sigList"></div></div>
          <div class="card"><h3>Recent Cluster Alerts</h3><div class="rowlist" id="alertList"></div></div>
        </div>
      </section>

      <!-- ============ ENTITIES ============ -->
      <section class="panel" id="panel-entities">
        <div class="card"><h3>Entity registry <span class="spacer"></span><span style="font-size:10px;color:var(--mute);letter-spacing:0;text-transform:none">tokenized / masked references only — raw identifiers never rendered</span></h3>
          <div style="overflow:auto"><table>
            <thead><tr><th>Type</th><th>Masked reference</th><th>Governance note</th><th class="tnum">Degree</th><th class="tnum">Risk weight</th><th>Cluster</th><th>First / last seen</th></tr></thead>
            <tbody id="entBody"></tbody></table></div>
        </div>
      </section>

      <!-- ============ CLUSTERS ============ -->
      <section class="panel" id="panel-clusters">
        <div class="card"><h3>Graph risk rules (govern every signal on this page)</h3>
          <div class="body"><ul class="rules">
            <li>Use confidence-weighted edges and time decay.</li>
            <li>Distinguish observed facts from inferred relationships.</li>
            <li>Never label a person fraudulent solely because of a graph association.</li>
            <li>Require independent corroboration for high-impact decisions.</li>
            <li>Maintain explainable paths for every network-derived signal.</li>
          </ul></div>
        </div>
        <div id="clusterCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px"></div>
      </section>

      <!-- ============ GEO ============ -->
      <section class="panel" id="panel-geo">
        <div class="card"><h3>Geographic risk distribution (region of activity)</h3>
          <div class="body" id="geoBody"></div>
        </div>
      </section>

      <!-- ============ TIME ============ -->
      <section class="panel" id="panel-time">
        <div class="card"><h3>Relationship formation over time <span class="spacer"></span><span style="font-size:10px;color:var(--mute);letter-spacing:0;text-transform:none">observed facts vs inferred signals, 90-day window</span></h3>
          <div class="body" id="timeBody"></div>
        </div>
      </section>
    </div>

    <div class="foot">
      <span>Trust opens doors.</span><span class="spacer" style="flex:1"></span>
      <span>TAMVA provides risk intelligence and relationship signals. Institutions retain control of final decisions.</span>
      <span class="spacer" style="flex:1"></span><span>🔒 Secure. Compliant. Built for Africa.</span>
      <span>Help &amp; Support</span><span>Terms</span><span>Privacy</span>
    </div>
  </div>
</div>

<!-- ============ EVIDENCE MODAL ============ -->
<div class="backdrop" id="eBack"><div class="modal">
  <header><div style="flex:1"><h2>Authorized evidence view</h2><p id="eSub" class="mono" style="font-size:10px;color:var(--mute);margin:2px 0 0"></p></div><button class="xbtn" id="eClose">✕</button></header>
  <div class="body" id="eBody"></div>
</div></div>
<div id="toasts"></div>

<script>
(()=>{ 'use strict';
/* ================= UTIL ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const D=24*3600e3,now=Date.now();
const at=(d,h=10,m=0)=>{const x=new Date(now-d*D);x.setHours(h,m,0,0);return x.getTime();};
const dtS=ts=>new Date(ts).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function toast(m,k='info',ms=3400){const el=document.createElement('div');el.className='toast '+k;el.innerHTML='<span>'+(k==='ok'?'✓':k==='err'?'✕':k==='warn'?'⚠':'ℹ')+'</span><span>'+esc(m)+'</span>';$('#toasts').appendChild(el);setTimeout(()=>{el.style.transition='opacity .25s';el.style.opacity='0';setTimeout(()=>el.remove(),260);},ms);}

/* ================= NODE TYPES (Section 13 governance table) ================= */
const TYPES={
  customer:{label:'Customer',color:'#34d399',gov:'Highly sensitive',glyph:'CU'},
  account:{label:'Account',color:'#14b8a6',gov:'Tokenize identifiers',glyph:'AC'},
  device:{label:'Device',color:'#8aa0b4',gov:'Strict purpose limitation',glyph:'DV'},
  beneficiary:{label:'Beneficiary',color:'#f59e0b',gov:'Risk signal, not guilt',glyph:'BN'},
  merchant:{label:'Merchant',color:'#eab308',gov:'Business entity',glyph:'ME'},
  transaction:{label:'Transaction',color:'#22d3ee',gov:'Event-level evidence',glyph:'TX'},
  institution:{label:'Institution',color:'#60a5fa',gov:'Partner metadata',glyph:'IN'}};

/* ================= ENTITIES (masked / tokenized references) ================= */
const NODES=[
  {id:'CUS-0243-****-4583',type:'customer',label:'Customer',sub:'Elijah Dery',risk:'low',first:at(210),last:at(0,8)},
  {id:'CUS-0718-****-9921',type:'customer',label:'Customer',sub:'Ama Serwaa',risk:'low',first:at(160),last:at(1)},
  {id:'CUS-1150-****-3367',type:'customer',label:'Customer',sub:'K. Mensah (cust.)',risk:'medium',first:at(95),last:at(2)},
  {id:'AC-****-4583',type:'account',label:'Account',sub:'GHC 12,400 · bank',risk:'low',first:at(210),last:at(0,8)},
  {id:'AC-****-7710',type:'account',label:'Account',sub:'GHC 3,150 · wallet',risk:'low',first:at(200),last:at(1)},
  {id:'AC-****-9921',type:'account',label:'Account',sub:'GHC 8,500 · bank',risk:'low',first:at(160),last:at(2)},
  {id:'AC-****-3367',type:'account',label:'Account',sub:'GHC 940 · wallet',risk:'medium',first:at(95),last:at(2)},
  {id:'DV-A3F9…D2C1',type:'device',label:'Device',sub:'iPhone 13',risk:'high',first:at(120),last:at(0,7)},
  {id:'DV-7E4B…91D2',type:'device',label:'Device',sub:'Android (Infinix)',risk:'medium',first:at(150),last:at(1)},
  {id:'DV-C51A…08F3',type:'device',label:'Device',sub:'Android (Tecno)',risk:'medium',first:at(90),last:at(2)},
  {id:'BEN-5562-7710',type:'beneficiary',label:'Beneficiary',sub:'Kofi Mensah · new',risk:'high',first:at(9),last:at(0,10)},
  {id:'BEN-8823-1140',type:'beneficiary',label:'Beneficiary',sub:'R. Owusu · known',risk:'low',first:at(140),last:at(20)},
  {id:'MCH-7721-004',type:'merchant',label:'Merchant',sub:'Urban Stores',risk:'medium',first:at(180),last:at(1)},
  {id:'MCH-3310-556',type:'merchant',label:'Merchant',sub:'Makola Market',risk:'low',first:at(170),last:at(6)},
  {id:'TXN-2609-1024',type:'transaction',label:'Transaction',sub:'GHC 25,000 · 14 Sep',risk:'high',first:at(0,10),last:at(0,10)},
  {id:'TXN-2609-0988',type:'transaction',label:'Transaction',sub:'GHC 6,200 · 12 Sep',risk:'medium',first:at(2,18),last:at(2,18)},
  {id:'TXN-2609-0912',type:'transaction',label:'Transaction',sub:'GHC 340 · 10 Sep',risk:'low',first:at(4,17),last:at(4,17)},
  {id:'TXN-2608-8871',type:'transaction',label:'Transaction',sub:'GHC 1,150 · 28 Aug',risk:'low',first:at(17,12),last:at(17,12)},
  {id:'INS-PartnerBank',type:'institution',label:'Institution',sub:'Partner Bank (channel)',risk:'low',first:at(400),last:at(0)},
  {id:'INS-MobileMoney',type:'institution',label:'Institution',sub:'Mobile Money (MNO)',risk:'low',first:at(400),last:at(0)}];

/* ================= EDGES — observed facts vs inferred relationships ================= */
const EDGES=[
  {s:'CUS-0243-****-4583',t:'AC-****-4583',type:'owns',kind:'observed',conf:.99,first:at(210),last:at(0,8)},
  {s:'CUS-0243-****-4583',t:'AC-****-7710',type:'owns',kind:'observed',conf:.99,first:at(200),last:at(1)},
  {s:'CUS-0718-****-9921',t:'AC-****-9921',type:'owns',kind:'observed',conf:.99,first:at(160),last:at(2)},
  {s:'CUS-1150-****-3367',t:'AC-****-3367',type:'owns',kind:'observed',conf:.99,first:at(95),last:at(2)},
  {s:'CUS-0243-****-4583',t:'DV-A3F9…D2C1',type:'uses',kind:'observed',conf:.95,first:at(120),last:at(0,7)},
  {s:'CUS-0718-****-9921',t:'DV-A3F9…D2C1',type:'uses',kind:'observed',conf:.90,first:at(38),last:at(0,7)},
  {s:'CUS-0718-****-9921',t:'DV-7E4B…91D2',type:'uses',kind:'observed',conf:.95,first:at(150),last:at(1)},
  {s:'CUS-1150-****-3367',t:'DV-C51A…08F3',type:'uses',kind:'observed',conf:.93,first:at(90),last:at(2)},
  {s:'CUS-1150-****-3367',t:'DV-A3F9…D2C1',type:'uses',kind:'observed',conf:.72,first:at(12),last:at(3)},
  {s:'AC-****-4583',t:'BEN-8823-1140',type:'sends',kind:'observed',conf:.97,first:at(140),last:at(20)},
  {s:'AC-****-9921',t:'BEN-5562-7710',type:'sends',kind:'observed',conf:.97,first:at(9),last:at(0,10)},
  {s:'AC-****-7710',t:'MCH-7721-004',type:'sends',kind:'observed',conf:.96,first:at(60),last:at(1)},
  {s:'DV-A3F9…D2C1',t:'TXN-2609-1024',type:'seen_with',kind:'observed',conf:.94,first:at(0,10),last:at(0,10)},
  {s:'DV-A3F9…D2C1',t:'TXN-2609-0988',type:'seen_with',kind:'observed',conf:.90,first:at(2,18),last:at(2,18)},
  {s:'DV-7E4B…91D2',t:'TXN-2609-0912',type:'seen_with',kind:'observed',conf:.92,first:at(4,17),last:at(4,17)},
  {s:'DV-C51A…08F3',t:'TXN-2608-8871',type:'seen_with',kind:'observed',conf:.88,first:at(17,12),last:at(17,12)},
  {s:'BEN-5562-7710',t:'TXN-2609-1024',type:'receives',kind:'observed',conf:.98,first:at(0,10),last:at(0,10)},
  {s:'BEN-5562-7710',t:'TXN-2609-0988',type:'receives',kind:'observed',conf:.95,first:at(2,18),last:at(2,18)},
  {s:'MCH-7721-004',t:'TXN-2609-0912',type:'receives',kind:'observed',conf:.96,first:at(4,17),last:at(4,17)},
  {s:'MCH-3310-556',t:'TXN-2608-8871',type:'receives',kind:'observed',conf:.94,first:at(17,12),last:at(17,12)},
  {s:'TXN-2609-1024',t:'INS-PartnerBank',type:'settled_via',kind:'observed',conf:.99,first:at(0,10),last:at(0,10)},
  {s:'TXN-2609-0988',t:'INS-MobileMoney',type:'settled_via',kind:'observed',conf:.99,first:at(2,18),last:at(2,18)},
  {s:'MCH-7721-004',t:'INS-PartnerBank',type:'settled_by',kind:'observed',conf:.97,first:at(180),last:at(1)},
  /* inferred risk relationships (signals, not guilt) */
  {s:'CUS-0243-****-4583',t:'CUS-0718-****-9921',type:'shared_device',kind:'inferred',conf:.86,first:at(38),last:at(0,7),label:'Shared Device',why:'both customers observed on DV-A3F9…D2C1 within 30d'},
  {s:'CUS-0718-****-9921',t:'CUS-1150-****-3367',type:'shared_device',kind:'inferred',conf:.74,first:at(12),last:at(3),label:'Shared Device',why:'both customers observed on DV-A3F9…D2C1'},
  {s:'BEN-5562-7710',t:'TXN-2609-1024',type:'unusual_tx_link',kind:'inferred',conf:.78,first:at(0,10),last:at(0,10),label:'Unusual Transaction Link',why:'new beneficiary, no prior history, high-value inbound'},
  {s:'AC-****-9921',t:'BEN-5562-7710',type:'unusual_amount',kind:'inferred',conf:.68,first:at(0,10),last:at(0,10),label:'Unusual Amount Pattern',why:'25,000 GHS vs account median 410 GHS (61×)'},
  {s:'BEN-5562-7710',t:'MCH-7721-004',type:'merchant_link',kind:'inferred',conf:.61,first:at(1),last:at(1),label:'Flagged Merchant Link',why:'beneficiary device co-occurs with flagged merchant category'}];

/* ================= CLUSTERS / SIGNALS / ALERTS / GEO ================= */
const CLUSTERS=[
  {id:'CL-2026-0184',level:'high',conf:.92,
   members:['CUS-0243-****-4583','CUS-0718-****-9921','DV-A3F9…D2C1','DV-7E4B…91D2','BEN-5562-7710','MCH-7721-004','TXN-2609-1024','TXN-2609-0988','AC-****-9921','AC-****-4583'],
   why:['Multiple customers linked via shared device','New beneficiary with high-value inbound transfers','Transactions across different channels in short time','Behaviour deviates from typical patterns','Links to flagged merchant'],
   signals:['shared_device','unusual_tx_link','unusual_amount','merchant_link'],first:at(12),last:at(0,10)},
  {id:'CL-2026-0179',level:'medium',conf:.71,
   members:['CUS-1150-****-3367','DV-C51A…08F3','AC-****-3367'],
   why:['Shared device across multiple accounts','Recent ownership change on wallet'],
   signals:['shared_device'],first:at(12),last:at(2)},
  {id:'CL-2026-0168',level:'medium',conf:.64,
   members:['MCH-7721-004','AC-****-7710'],
   why:['Cluster risk score increased week-over-week','Ticket-size migration upward'],
   signals:['merchant_link'],first:at(30),last:at(1)},
  {id:'CL-2026-0152',level:'low',conf:.42,
   members:['BEN-8823-1140','AC-****-4583'],
   why:['Multiple accounts with similar behaviour (benign pattern match)'],
   signals:[],first:at(60),last:at(20)}];
const SIGNALS=[
  {t:'Shared device detected across 3 customers',lvl:'high',ts:at(0,10)},
  {t:'New beneficiary with no prior history',lvl:'high',ts:at(0,9)},
  {t:'Unusual transaction pattern (structuring)',lvl:'medium',ts:at(0,8)},
  {t:'Link to high-risk merchant category',lvl:'medium',ts:at(1,15)},
  {t:'Multiple accounts with similar behaviour',lvl:'low',ts:at(2,2)}];
let ALERTS=[
  {t:'High-risk cluster detected',id:'CL-2026-0184',lvl:'high',ts:at(0,10)},
  {t:'New entity linked to existing cluster',id:'CL-2026-0184',lvl:'medium',ts:at(0,9)},
  {t:'Unusual transaction link identified',id:'CL-2026-0179',lvl:'high',ts:at(1,4)},
  {t:'Shared device across multiple accounts',id:'CL-2026-0179',lvl:'medium',ts:at(1,11)},
  {t:'Cluster risk score increased',id:'CL-2026-0168',lvl:'high',ts:at(2,9)}];
const GEO=[['Greater Accra',34],['Ashanti',22],['Western',12],['Eastern',8],['Central',7]];

/* ================= GRAPH STATE ================= */
const G={nodes:[],edges:[],byId:new Map(),alpha:1,tr:{x:0,y:0,k:1},hover:null,hoverEdge:null,sel:null,drag:null,pan:null,
  showInf:true,showObs:true,decay:true,labels:true,scope:'all',pathMode:false,pathSrc:null,path:null,w:0,h:0,dpr:1,fit:true};
const HALF_LIFE=30*D;
const decayOf=e=>G.decay?Math.pow(2,-(now-e.last)/HALF_LIFE):1;
const weightOf=e=>e.conf*decayOf(e);
const clusterOf=id=>CLUSTERS.find(c=>c.members.includes(id))||null;

function buildGraph(){
  const prev=new Map(G.nodes.map(n=>[n.id,n]));
  G.nodes=NODES.map((n,i)=>{
    const old=prev.get(n.id);const ang=i/NODES.length*Math.PI*2;
    const deg=EDGES.filter(e=>e.s===n.id||e.t===n.id).length;
    const rw=EDGES.filter(e=>(e.s===n.id||e.t===n.id)&&e.kind==='inferred').reduce((s,e)=>s+e.conf,0);
    return Object.assign({},n,{x:old?old.x:Math.cos(ang)*230,y:old?old.y:Math.sin(ang)*230,vx:0,vy:0,deg:deg,rw:rw,
      r:13+Math.min(11,deg*1.5)+(clusterOf(n.id)&&clusterOf(n.id).level==='high'?4:0)});});
  G.byId=new Map(G.nodes.map(n=>[n.id,n]));
  G.edges=EDGES.map(e=>Object.assign({},e,{source:G.byId.get(e.s),target:G.byId.get(e.t)}));
  const maxW=Math.max.apply(null,G.edges.map(weightOf));
  G.edges.forEach(e=>{e.w=1+3.4*Math.pow(weightOf(e)/maxW,.5);e.len=e.kind==='inferred'?150:105;});
}
function tick(){
  if(G.alpha<.004&&!G.drag)return;
  const a=G.alpha,n=G.nodes;
  for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j++){
    const A=n[i],B=n[j];let dx=B.x-A.x,dy=B.y-A.y,d2=dx*dx+dy*dy;if(d2<1){dx=.5;dy=.5;d2=1;}
    const d=Math.sqrt(d2),f=Math.min(30000/d2,26)*a,fx=dx/d*f,fy=dy/d*f;
    A.vx-=fx;A.vy-=fy;B.vx+=fx;B.vy+=fy;
    const min=A.r+B.r+10;if(d<min){const p=(min-d)/d*.5;A.vx-=dx*p;A.vy-=dy*p;B.vx+=dx*p;B.vy+=dy*p;}}
  for(const e of G.edges){const dx=e.target.x-e.source.x,dy=e.target.y-e.source.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-e.len)*.02*a;
    e.source.vx+=dx/d*f;e.source.vy+=dy/d*f;e.target.vx-=dx/d*f;e.target.vy-=dy/d*f;}
  for(const p of n){p.vx-=p.x*.01*a;p.vy-=p.y*.01*a;
    if(G.drag&&G.drag.node===p){p.x=G.drag.wx;p.y=G.drag.wy;p.vx=p.vy=0;continue;}
    p.vx=clamp(p.vx*.85,-24,24);p.vy=clamp(p.vy*.85,-24,24);p.x+=p.vx;p.y+=p.vy;}
  G.alpha*=.988;
}
function resize(){const r=$('#gwrap').getBoundingClientRect();G.dpr=Math.min(2,window.devicePixelRatio||1);G.w=r.width;G.h=r.height;
  const cv=$('#cv');cv.width=Math.max(1,G.w*G.dpr);cv.height=Math.max(1,G.h*G.dpr);cv.style.width=G.w+'px';cv.style.height=G.h+'px';
  if(G.fit){G.tr={x:G.w/2,y:G.h/2,k:.95};G.fit=false;zl();}}
function fit(){if(!G.nodes.length)return;let a=1e9,b=1e9,c=-1e9,d=-1e9;
  G.nodes.forEach(n=>{a=Math.min(a,n.x-n.r);c=Math.max(c,n.x+n.r);b=Math.min(b,n.y-n.r);d=Math.max(d,n.y+n.r);});
  const k=clamp(Math.min(G.w/(c-a+140),G.h/(d-b+140)),.3,2.2);G.tr.k=k;G.tr.x=G.w/2-(a+c)/2*k;G.tr.y=G.h/2-(b+d)/2*k;zl();}
function zl(){$('#zLbl').textContent=Math.round(G.tr.k*100)+'%';}
const s2w=(x,y)=>({x:(x-G.tr.x)/G.tr.k,y:(y-G.tr.y)/G.tr.k});
const visibleNodes=()=>G.nodes.filter(n=>G.scope==='all'||n.type===G.scope);
function visibleEdges(){const vn=new Set(visibleNodes().map(n=>n.id));
  return G.edges.filter(e=>{if(e.kind==='inferred'&&!G.showInf)return false;if(e.kind==='observed'&&!G.showObs)return false;return vn.has(e.s)&&vn.has(e.t);});}
function nodeAt(sx,sy){const p=s2w(sx,sy);const vn=visibleNodes();
  for(let i=vn.length-1;i>=0;i--){const n=vn[i];if(Math.hypot(p.x-n.x,p.y-n.y)<=n.r+4)return n;}return null;}
function edgeAt(sx,sy){const p=s2w(sx,sy),tol=6/G.tr.k;
  for(const e of visibleEdges()){const ax=e.source.x,ay=e.source.y,bx=e.target.x,by=e.target.y,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1;
    const t=clamp(((p.x-ax)*dx+(p.y-ay)*dy)/L,0,1);if(Math.hypot(p.x-(ax+dx*t),p.y-(ay+dy*t))<=tol+e.w/2)return e;}return null;}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function draw(tms){
  const cv=$('#cv');if(!cv)return;const ctx=cv.getContext('2d');
  ctx.setTransform(G.dpr,0,0,G.dpr,0,0);ctx.clearRect(0,0,G.w,G.h);
  ctx.save();ctx.translate(G.tr.x,G.tr.y);ctx.scale(G.tr.k,G.tr.k);
  const vn=visibleNodes(),ve=visibleEdges();
  const focus=G.hover||G.sel;const conn=new Set();
  if(focus){conn.add(focus.id);ve.forEach(e=>{if(e.source===focus||e.target===focus){conn.add(e.s);conn.add(e.t);}});}
  for(const e of ve){
    const hi=focus&&(e.source===focus||e.target===focus);
    const inPath=G.path&&G.path.edges.indexOf(e)>=0;
    ctx.globalAlpha=focus?(hi?.9:.14):(inPath?1:.5);
    ctx.strokeStyle=inPath?'#ffffff':e.kind==='inferred'?'#f4586c':(e.type==='owns'||e.type==='uses'?'#2dd4a0':'#14b8a6');
    ctx.lineWidth=inPath?e.w+1.4:e.w;ctx.setLineDash(e.kind==='inferred'?[6,5]:[]);
    ctx.beginPath();ctx.moveTo(e.source.x,e.source.y);ctx.lineTo(e.target.x,e.target.y);ctx.stroke();ctx.setLineDash([]);
    const ang=Math.atan2(e.target.y-e.source.y,e.target.x-e.source.x);
    const ax=e.target.x-Math.cos(ang)*(e.target.r+4),ay=e.target.y-Math.sin(ang)*(e.target.r+4),s=4+e.w;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-Math.cos(ang-.42)*s,ay-Math.sin(ang-.42)*s);ctx.lineTo(ax-Math.cos(ang+.42)*s,ay-Math.sin(ang+.42)*s);ctx.closePath();
    ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha*=.9;ctx.fill();
    if(e.label&&(G.labels||hi||inPath)){
      const mx=(e.source.x+e.target.x)/2,my=(e.source.y+e.target.y)/2;
      ctx.globalAlpha=focus?(hi?1:.2):.95;
      ctx.font='600 9.5px Inter, sans-serif';const tw=ctx.measureText(e.label).width;
      ctx.fillStyle='rgba(20,8,12,.85)';ctx.strokeStyle='#f4586c';ctx.lineWidth=1;
      roundRect(ctx,mx-tw/2-7,my-9,tw+14,17,5);ctx.fill();ctx.stroke();
      ctx.fillStyle='#ff8fa0';ctx.textAlign='center';ctx.fillText(e.label,mx,my+3);ctx.textAlign='left';
    }else if(G.hoverEdge===e){
      const mx=(e.source.x+e.target.x)/2,my=(e.source.y+e.target.y)/2;
      ctx.globalAlpha=1;ctx.font='600 9.5px "JetBrains Mono", monospace';ctx.fillStyle='#9db8a9';
      ctx.fillText(e.type+' · conf '+e.conf.toFixed(2)+' · w '+weightOf(e).toFixed(2),mx+8,my-6);}
  }
  for(const n of vn){
    const cl=clusterOf(n.id);const on=!focus||conn.has(n.id);
    const col=n.risk==='high'?'#f4586c':TYPES[n.type].color;
    ctx.globalAlpha=on?1:.2;
    if(cl&&cl.level==='high'){const pr=n.r+8+Math.sin(tms/300)*2.4;
      ctx.strokeStyle='rgba(244,88,108,.55)';ctx.lineWidth=1.4;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(n.x,n.y,pr,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(G.sel===n){ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(n.x,n.y,n.r+5,0,Math.PI*2);ctx.stroke();}
    ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    ctx.fillStyle='#0b1d14';ctx.fill();ctx.lineWidth=G.hover===n?2.6:1.9;ctx.strokeStyle=col;ctx.stroke();
    ctx.fillStyle=col;ctx.font='700 '+(n.r*.72)+'px "JetBrains Mono", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(TYPES[n.type].glyph,n.x,n.y+1);ctx.textAlign='left';ctx.textBaseline='alphabetic';
    if(G.labels||G.hover===n||G.sel===n){
      ctx.font='600 10px Inter, sans-serif';const l1=n.id,l2=n.sub;
      const tw=Math.max(ctx.measureText(l1).width,ctx.measureText(l2).width);
      ctx.globalAlpha=(on?1:.2)*.8;ctx.fillStyle='rgba(6,18,12,.82)';ctx.fillRect(n.x-tw/2-5,n.y+n.r+5,tw+10,26);
      ctx.globalAlpha=on?1:.2;ctx.fillStyle='#e7f6ee';ctx.textAlign='center';ctx.fillText(l1,n.x,n.y+n.r+16);
      ctx.fillStyle='#9db8a9';ctx.font='400 9px Inter, sans-serif';ctx.fillText(l2,n.x,n.y+n.r+26);ctx.textAlign='left';}
  }
  ctx.globalAlpha=1;ctx.restore();
}
function loop(t){if($('#panel-network').classList.contains('on')){
  const r=$('#gwrap').getBoundingClientRect();if(Math.abs(r.width-G.w)>1||Math.abs(r.height-G.h)>1)resize();
  tick();draw(t);}requestAnimationFrame(loop);}

/* ================= EXPLAINABLE PATHS (rule G-5) ================= */
function shortestPath(a,b){
  const adj=new Map();visibleEdges().forEach(e=>{
    if(!adj.has(e.s))adj.set(e.s,[]);if(!adj.has(e.t))adj.set(e.t,[]);
    adj.get(e.s).push({to:e.t,e:e});adj.get(e.t).push({to:e.s,e:e});});
  const q=[a.id],seen=new Set([a.id]),par=new Map();
  while(q.length){const cur=q.shift();if(cur===b.id)break;
    for(const nb of(adj.get(cur)||[])){if(seen.has(nb.to))continue;seen.add(nb.to);par.set(nb.to,{from:cur,e:nb.e});q.push(nb.to);}}
  if(a.id!==b.id&&!par.has(b.id))return null;
  const edges=[],nodes=[b.id];let cur=b.id;
  while(cur!==a.id){const p=par.get(cur);if(!p)return null;edges.unshift(p.e);nodes.unshift(p.from);cur=p.from;}
  return{nodes:nodes,edges:edges};
}
function renderPath(){
  const rows=G.path.edges.map(e=>{const dec=decayOf(e);
    return'<div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed var(--border2);font-size:11px">'+
      '<span class="badge '+(e.kind==='observed'?'b-obs':'b-inf')+'">'+e.kind+'</span>'+
      '<div style="flex:1"><b>'+esc(e.source.id)+'</b> —<span class="mono" style="color:var(--accent)"> '+e.type+' </span>→ <b>'+esc(e.target.id)+'</b>'+
      (e.why?'<div style="color:var(--amber);font-size:10px;margin-top:2px">'+esc(e.why)+'</div>':'')+
      '<div style="color:var(--mute);font-size:9.5px;margin-top:2px">confidence '+e.conf.toFixed(2)+' × decay '+dec.toFixed(2)+' = weight '+(e.conf*dec).toFixed(2)+' · first seen '+dtS(e.first)+'</div></div></div>';}).join('');
  $('#insBody').innerHTML='<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin-bottom:6px">Explainable path</div>'+rows+
    '<div style="margin-top:9px;border:1px solid var(--amber);background:var(--amber-soft);border-radius:9px;padding:8px 10px;font-size:10.5px;color:var(--amber);line-height:1.5">⚠ Governance: association ≠ guilt. This path is a risk signal only — high-impact decisions require independent corroboration (rule G-4).</div>'+
    '<button class="btn sm" style="width:100%;margin-top:9px;justify-content:center" id="pathClear">Clear path</button>';
  $('#insp').classList.remove('hide');$('#insDot').style.background='#fff';
  $('#insName').textContent='Path: '+G.path.edges.length+' hop(s)';
  $('#insSub').textContent=G.path.nodes[0]+' → '+G.path.nodes[G.path.nodes.length-1];
  const pc=$('#pathClear');if(pc)pc.onclick=()=>{G.path=null;G.pathSrc=null;renderInspector();};
}
/* ================= INSPECTOR + CLUSTER INTELLIGENCE ================= */
function renderInspector(){
  const box=$('#insp');
  if(G.path){renderPath();return;}
  if(!G.sel){box.classList.add('hide');return;}
  const n=G.sel,cl=clusterOf(n.id);
  box.classList.remove('hide');
  $('#insDot').style.background=n.risk==='high'?'#f4586c':TYPES[n.type].color;
  $('#insName').textContent=n.id;$('#insSub').textContent=TYPES[n.type].label+' · '+n.sub;
  const es=G.edges.filter(e=>e.s===n.id||e.t===n.id);
  $('#insBody').innerHTML=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px">'+
    '<div class="pill" style="justify-content:center">degree <b>'+n.deg+'</b></div>'+
    '<div class="pill" style="justify-content:center">risk wt <b>'+n.rw.toFixed(2)+'</b></div></div>'+
    '<div style="font-size:10.5px;color:var(--mute);margin-bottom:8px">Governance: <b style="color:var(--dim)">'+TYPES[n.type].gov+'</b></div>'+
    es.map(e=>{const o=e.s===n.id?e.target:e.source;
      return'<div style="display:flex;gap:7px;align-items:center;padding:4px 0;border-bottom:1px dashed var(--border2);font-size:10.5px">'+
      '<span class="badge '+(e.kind==='observed'?'b-obs':'b-inf')+'">'+e.type+'</span>'+
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(o.id)+'</span>'+
      '<span class="mono" style="color:var(--dim)">w '+(e.conf*decayOf(e)).toFixed(2)+'</span></div>';}).join('')+
    '<div style="display:flex;flex-direction:column;gap:7px;margin-top:11px">'+
    '<button class="btn sm" id="insEv" style="justify-content:center">View authorized evidence</button>'+
    '<button class="btn sm" id="insPath" style="justify-content:center">Explain paths from here</button></div>';
  $('#insEv').onclick=()=>openEvidence(n);
  $('#insPath').onclick=()=>{G.pathMode=true;G.pathSrc=n;$('#pathMode').classList.add('on');$('#pathHint').style.display='';toast('Source set — now click a target node','info');};
  renderCluster(cl,n);
}
function renderCluster(cl,node){
  $('#clId').textContent=cl?cl.id:'—';
  if(!cl){$('#clBody').innerHTML='<div class="empty">Select a node or cluster in the graph.</div>';return;}
  const corr=new Set(cl.signals).size,canOpen=corr>=2;
  $('#clBody').innerHTML=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px">'+
    '<div style="border:1px solid var(--red);background:var(--red-soft);border-radius:10px;padding:8px 10px"><div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);font-weight:700">Risk level</div><div style="font-weight:700;color:var(--red);font-size:15px">'+cl.level.toUpperCase()+'</div></div>'+
    '<div style="border:1px solid var(--border2);border-radius:10px;padding:8px 10px"><div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);font-weight:700">Confidence</div><div style="font-weight:700;font-size:15px">'+Math.round(cl.conf*100)+'%</div></div></div>'+
    '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin-bottom:5px">Why this cluster is risky</div>'+
    cl.why.map(w=>'<div style="display:flex;gap:7px;font-size:11px;color:var(--dim);padding:2px 0"><span style="color:var(--red)">•</span>'+esc(w)+'</div>').join('')+
    '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin:10px 0 5px">Affected entities ('+cl.members.length+')</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:5px">'+cl.members.map(m=>'<span class="mono" style="font-size:9.5px;background:var(--panel3);border:1px solid var(--border2);border-radius:6px;padding:2px 6px">'+esc(m)+'</span>').join('')+'</div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--mute);margin-top:10px"><span>First seen</span><b style="color:var(--dim)">'+dtS(cl.first)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--mute)"><span>Last activity</span><b style="color:var(--dim)">'+dtS(cl.last)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--mute);margin-bottom:10px"><span>Independent signals</span><b style="color:'+(canOpen?'var(--accent)':'var(--amber)')+'">'+corr+'</b></div>'+
    '<button class="btn primary" style="width:100%;justify-content:center" id="clOpen" '+(canOpen?'':'disabled')+'>🔎 Open Investigation →</button>'+
    (canOpen?'':'<div style="font-size:10px;color:var(--amber);margin-top:6px;text-align:center">Blocked: rule G-4 requires ≥2 independent corroborating signals</div>')+
    '<button class="btn" style="width:100%;justify-content:center;margin-top:7px" id="clEv">🛡 View Authorized Evidence</button>';
  const bo=$('#clOpen');if(bo&&canOpen)bo.onclick=()=>{ALERTS.unshift({t:'Investigation opened on '+cl.id,id:cl.id,lvl:cl.level,ts:Date.now()});renderAlerts();toast('Investigation case created for '+cl.id+' — handed to Cases squad','ok');};
  const be=$('#clEv');if(be)be.onclick=()=>openEvidence(node||G.byId.get(cl.members[0]));
}
/* ================= AUTHORIZED EVIDENCE (purpose limitation) ================= */
function openEvidence(n){
  if(!n)return;
  $('#eSub').textContent=n.id+' · '+TYPES[n.type].label;
  const map={
    customer:[['tokenized_ref',n.id,1],['identity_name','REDACTED — no consent scope "identity"',0],['consent_scopes','transactions · network_signals',1],['status','active',1]],
    account:[['masked_identifier',n.id.replace('AC-',''),1],['full_pan','REDACTED — purpose limitation',0],['balance_band',n.sub,1]],
    device:[['fingerprint_prefix',n.id.replace('DV-',''),1],['raw_fingerprint','REDACTED — strict purpose limitation',0],['model',n.sub,1]],
    beneficiary:[['reference',n.id,1],['national_id','REDACTED',0],['history_depth',n.sub,1]],
    merchant:[['merchant_ref',n.id,1],['settlement_account','REDACTED',0],['category',n.sub,1]],
    transaction:[['tx_ref',n.id,1],['amount',n.sub,1],['counterparty_name','REDACTED — event-level evidence only',0]],
    institution:[['partner',n.sub,1],['contract_terms','REDACTED — partner metadata',0]]};
  const rows=map[n.type]||[];
  $('#eBody').innerHTML='<div style="display:flex;flex-direction:column;gap:7px">'+rows.map(r=>
    '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:7px 10px;border:1px solid var(--border2);border-radius:9px;background:var(--panel)">'+
    '<span style="color:var(--mute)">'+r[0]+'</span><b class="mono" style="font-size:11px;color:'+(r[2]?'var(--text)':'var(--red)')+'">'+esc(r[1])+'</b></div>').join('')+
    '<div style="margin-top:6px;font-size:10.5px;color:var(--mute);line-height:1.55">Access logged to audit_event. Fields outside the active purpose are withheld — data minimization enforced.</div></div>';
  $('#eBack').classList.add('on');
  toast('Evidence access logged (actor: risk-team/analyst)','info');
}
/* ================= PANEL RENDERERS ================= */
function renderKpis(){
  const inf=EDGES.filter(e=>e.kind==='inferred').length;
  $('#kpis').innerHTML=[
    ['👥','Active Network Entities',String(NODES.length),'people, accounts, devices, merchants +','var(--accent-soft)','var(--accent)'],
    ['⚠','High-Risk Clusters',String(CLUSTERS.filter(c=>c.level==='high').length),'vs. previous month','var(--red-soft)','var(--red)'],
    ['⌬','Shared Risk Signals',String(inf),'cross-institution intelligence','var(--accent-soft)','var(--accent)'],
    ['🏛','Institutions Connected',String(NODES.filter(n=>n.type==='institution').length),'banks, MNOs, fintechs +','var(--blue-soft)','var(--blue)']]
    .map(k=>'<div class="kpi"><div class="ic" style="background:'+k[4]+';color:'+k[5]+'">'+k[0]+'</div><div><div class="k">'+k[1]+'</div><div class="v">'+k[2]+'</div><div class="s">'+k[3]+'</div></div></div>').join('');
}
function renderLegend(){
  $('#legendBody').innerHTML=Object.keys(TYPES).map(k=>'<div class="li"><span style="width:9px;height:9px;border-radius:50%;background:'+TYPES[k].color+'"></span>'+TYPES[k].label+' <span style="color:var(--mute)">· '+TYPES[k].gov+'</span></div>').join('');
}
function renderSignals(){
  $('#sigList').innerHTML=SIGNALS.map(s=>'<div class="rl"><div class="ic" style="background:'+(s.lvl==='high'?'var(--red-soft)':s.lvl==='medium'?'var(--amber-soft)':'var(--accent-soft)')+';color:'+(s.lvl==='high'?'var(--red)':s.lvl==='medium'?'var(--amber)':'var(--accent)')+'">⌁</div><div style="flex:1"><div class="t">'+esc(s.t)+'</div><div class="s">'+dtS(s.ts)+'</div></div><span class="badge b-'+s.lvl+'">'+s.lvl+'</span></div>').join('');
}
function renderAlerts(){
  $('#alertList').innerHTML=ALERTS.slice(0,6).map(a=>'<div class="rl"><div class="ic" style="background:'+(a.lvl==='high'?'var(--red-soft)':'var(--amber-soft)')+';color:'+(a.lvl==='high'?'var(--red)':'var(--amber)')+'">⚠</div><div style="flex:1"><div class="t">'+esc(a.t)+'</div><div class="s mono">'+esc(a.id)+' · '+dtS(a.ts)+'</div></div></div>').join('');
}
function renderEntities(){
  $('#entBody').innerHTML=G.nodes.map(n=>{const cl=clusterOf(n.id);
    return'<tr><td><span style="color:'+TYPES[n.type].color+';font-weight:600">'+TYPES[n.type].label+'</span></td>'+
    '<td class="mono" style="font-size:11px">'+esc(n.id)+'</td><td style="color:var(--dim)">'+TYPES[n.type].gov+'</td>'+
    '<td class="tnum mono">'+n.deg+'</td><td class="tnum mono">'+n.rw.toFixed(2)+'</td>'+
    '<td>'+(cl?'<span class="badge b-'+cl.level+'">'+cl.id+'</span>':'<span style="color:var(--mute)">—</span>')+'</td>'+
    '<td style="font-size:11px;color:var(--dim)">'+dtS(n.first)+' → '+dtS(n.last)+'</td></tr>';}).join('');
}
function renderClusters(){
  $('#clusterCards').innerHTML=CLUSTERS.map(c=>{
    const corr=new Set(c.signals).size;
    return'<div class="card"><h3><span class="badge b-'+c.level+'">'+c.level+'</span>'+c.id+'<span class="spacer"></span><span class="mono" style="font-size:10px;color:var(--dim)">conf '+Math.round(c.conf*100)+'%</span></h3>'+
    '<div class="body"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin-bottom:5px">Why risky</div>'+
    c.why.map(w=>'<div style="display:flex;gap:7px;font-size:11.5px;color:var(--dim);padding:2px 0"><span style="color:var(--red)">•</span>'+esc(w)+'</div>').join('')+
    '<div style="margin:10px 0 5px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700">Members ('+c.members.length+')</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:5px">'+c.members.map(m=>'<span class="mono" style="font-size:9.5px;background:var(--panel3);border:1px solid var(--border2);border-radius:6px;padding:2px 6px">'+esc(m)+'</span>').join('')+'</div>'+
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn sm primary cl-focus" data-cl="'+c.id+'" style="flex:1;justify-content:center">Focus in graph</button>'+
    '<button class="btn sm cl-open" data-cl="'+c.id+'" style="flex:1;justify-content:center" '+(corr>=2?'':'disabled')+'>Open investigation</button></div>'+
    (corr<2?'<div style="font-size:10px;color:var(--amber);margin-top:6px">Blocked by rule G-4 (corroboration)</div>':'')+
    '</div></div>';}).join('');
  $$('.cl-focus').forEach(b=>b.onclick=()=>{const c=CLUSTERS.find(x=>x.id===b.dataset.cl);
    G.sel=G.byId.get(c.members[0]);G.path=null;switchTab('network');G.alpha=Math.max(G.alpha,.4);renderInspector();});
  $$('.cl-open').forEach(b=>b.onclick=()=>{ALERTS.unshift({t:'Investigation opened on '+b.dataset.cl,id:b.dataset.cl,lvl:'high',ts:Date.now()});renderAlerts();toast('Case created for '+b.dataset.cl,'ok');});
}
function renderGeo(){
  const max=Math.max.apply(null,GEO.map(g=>g[1]));
  $('#geoBody').innerHTML='<div style="display:flex;flex-direction:column;gap:10px">'+GEO.map((g,i)=>{
    const col=g[1]>25?'#f4586c':(g[1]>10?'#f5b544':'#2dd4a0');
    return'<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>'+(i+1)+'. '+g[0]+'</span><b class="mono">'+g[1]+'%</b></div>'+
    '<div class="bar"><i style="width:'+(g[1]/max*100).toFixed(1)+'%;background:linear-gradient(90deg,'+col+',transparent)"></i></div></div>';}).join('')+'</div>'+
    '<div style="margin-top:10px;font-size:10.5px;color:var(--mute)">Region derived from transaction activity only — never from identity data.</div>';
}
function renderTime(){
  const w=760,h=170,pad={l:64,r:12,t:14,b:24},t0=now-90*D;
  const X=ts=>pad.l+(Math.max(t0,ts)-t0)/(now-t0)*(w-pad.l-pad.r);
  let dots='';
  EDGES.forEach(e=>{const y=e.kind==='observed'?60:110,x=X(e.first);
    const c=e.kind==='observed'?'#2dd4a0':'#f4586c';
    dots+='<circle cx="'+x.toFixed(1)+'" cy="'+y+'" r="'+(3+e.conf*4).toFixed(1)+'" fill="'+c+'" opacity=".8"><title>'+e.type+' · '+e.s+' → '+e.t+' · conf '+e.conf+'</title></circle>';});
  $('#timeBody').innerHTML='<svg class="chart" viewBox="0 0 '+w+' '+h+'">'+
    '<line x1="'+pad.l+'" x2="'+(w-pad.r)+'" y1="60" y2="60" stroke="var(--border2)"/>'+
    '<line x1="'+pad.l+'" x2="'+(w-pad.r)+'" y1="110" y2="110" stroke="var(--border2)"/>'+
    '<text x="8" y="63" font-size="9.5" fill="#2dd4a0" font-family="JetBrains Mono">observed</text>'+
    '<text x="8" y="113" font-size="9.5" fill="#f4586c" font-family="JetBrains Mono">inferred</text>'+
    '<text x="'+pad.l+'" y="'+(h-6)+'" font-size="9.5" fill="var(--mute)" font-family="JetBrains Mono">'+dtS(t0)+'</text>'+
    '<text x="'+(w-pad.r)+'" y="'+(h-6)+'" text-anchor="end" font-size="9.5" fill="var(--mute)" font-family="JetBrains Mono">'+dtS(now)+'</text>'+
    dots+'</svg><div style="font-size:10.5px;color:var(--mute);margin-top:6px">Bubble size ∝ confidence. Inferred signals appear later in the lifecycle — they are derived, never ingested as facts.</div>';
}
/* ================= TABS + WIRING ================= */
function switchTab(t){$$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));$$('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+t));
  if(t==='network')requestAnimationFrame(()=>{resize();G.alpha=Math.max(G.alpha,.35);});}
function wire(){
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)switchTab(b.dataset.tab);});
  $('#scope').innerHTML='<option value="all">All entity types</option>'+Object.keys(TYPES).map(k=>'<option value="'+k+'">'+TYPES[k].label+' only</option>').join('');
  $('#scope').addEventListener('change',e=>{G.scope=e.target.value;G.sel=null;G.path=null;renderInspector();});
  $('#fObs').addEventListener('click',e=>{G.showObs=!G.showObs;e.currentTarget.classList.toggle('on',G.showObs);});
  $('#fInf').addEventListener('click',e=>{G.showInf=!G.showInf;e.currentTarget.classList.toggle('on',G.showInf);});
  $('#fDecay').addEventListener('click',e=>{G.decay=!G.decay;e.currentTarget.classList.toggle('on',G.decay);buildGraph();toast('Time decay '+(G.decay?'enabled (30-day half-life)':'disabled — raw confidence'),'info');});
  $('#fLabels').addEventListener('click',e=>{G.labels=!G.labels;e.currentTarget.classList.toggle('on',G.labels);});
  $('#zIn').addEventListener('click',()=>{G.tr.k=clamp(G.tr.k*1.2,.3,3.2);zl();});
  $('#zOut').addEventListener('click',()=>{G.tr.k=clamp(G.tr.k/1.2,.3,3.2);zl();});
  $('#zFit').addEventListener('click',fit);
  $('#reheat').addEventListener('click',()=>{G.nodes.forEach(n=>{n.vx+=(Math.random()-.5)*6;n.vy+=(Math.random()-.5)*6;});G.alpha=1;});
  $('#pathMode').addEventListener('click',e=>{G.pathMode=!G.pathMode;G.pathSrc=null;G.path=null;
    e.currentTarget.classList.toggle('on',G.pathMode);$('#pathHint').style.display=G.pathMode?'':'none';renderInspector();});
  $('#insClose').addEventListener('click',()=>{G.sel=null;G.path=null;renderInspector();renderCluster(null,null);});
  $('#eClose').addEventListener('click',()=>$('#eBack').classList.remove('on'));
  $('#q').addEventListener('keydown',e=>{if(e.key!=='Enter')return;
    const q=e.target.value.trim().toLowerCase();if(!q)return;
    const n=G.nodes.find(x=>(x.id+' '+x.sub).toLowerCase().includes(q));
    if(n){G.sel=n;G.path=null;switchTab('network');renderInspector();toast('Focused '+n.id,'info');}
    else toast('No entity matches "'+e.target.value.trim()+'"','warn');});
  const cv=$('#cv'),tip=$('#tip');
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();
    const sx=e.clientX-r.left,sy=e.clientY-r.top,f=e.deltaY<0?1.12:1/1.12,k2=clamp(G.tr.k*f,.3,3.2);
    G.tr.x=sx-(sx-G.tr.x)*(k2/G.tr.k);G.tr.y=sy-(sy-G.tr.y)*(k2/G.tr.k);G.tr.k=k2;zl();},{passive:false});
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect();
    const sx=e.clientX-r.left,sy=e.clientY-r.top,n=nodeAt(sx,sy),p=s2w(sx,sy);
    if(n)G.drag={node:n,wx:n.x,wy:n.y,sx:sx,sy:sy,moved:0};
    else{G.pan={sx:sx,sy:sy,tx:G.tr.x,ty:G.tr.y};cv.classList.add('grab');}});
  cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
    if(G.drag){const p=s2w(sx,sy);G.drag.wx=p.x;G.drag.wy=p.y;G.drag.moved+=Math.abs(sx-G.drag.sx)+Math.abs(sy-G.drag.sy);G.drag.sx=sx;G.drag.sy=sy;G.alpha=Math.max(G.alpha,.3);return;}
    if(G.pan){G.tr.x=G.pan.tx+(sx-G.pan.sx);G.tr.y=G.pan.ty+(sy-G.pan.sy);return;}
    const n=nodeAt(sx,sy);G.hover=n;G.hoverEdge=n?null:edgeAt(sx,sy);cv.style.cursor=n?'pointer':'grab';
    if(n){tip.innerHTML='<b>'+esc(n.id)+'</b><br><span style="color:var(--mute)">'+TYPES[n.type].label+' · '+esc(n.sub)+'</span><br>degree '+n.deg+' · risk wt '+n.rw.toFixed(2)+'<br><span style="color:var(--mute);font-size:10px">'+TYPES[n.type].gov+'</span>';
      tip.style.left=Math.min(G.w-230,sx+16)+'px';tip.style.top=Math.max(8,sy-12)+'px';tip.classList.add('on');}
    else if(G.hoverEdge){const e2=G.hoverEdge;
      tip.innerHTML='<b>'+e2.type+'</b> <span class="badge '+(e2.kind==='observed'?'b-obs':'b-inf')+'">'+e2.kind+'</span><br>'+esc(e2.s)+' → '+esc(e2.t)+'<br>conf '+e2.conf.toFixed(2)+' · decay '+decayOf(e2).toFixed(2)+' · w '+weightOf(e2).toFixed(2)+(e2.why?'<br><span style="color:var(--amber);font-size:10px">'+esc(e2.why)+'</span>':'');
      tip.style.left=Math.min(G.w-230,sx+16)+'px';tip.style.top=Math.max(8,sy-12)+'px';tip.classList.add('on');}
    else tip.classList.remove('on');});
  const up=()=>{
    if(G.drag){
      if(G.drag.moved<5){const n=G.drag.node;
        if(G.pathMode){
          if(!G.pathSrc){G.pathSrc=n;toast('Source set: '+n.id+' — now click target','info');}
          else if(G.pathSrc===n){G.pathSrc=null;toast('Source cleared — click a source node','info');}
          else{const p=shortestPath(G.pathSrc,n);
            if(p){G.path=p;G.pathMode=false;$('#pathMode').classList.remove('on');$('#pathHint').style.display='none';toast('Explainable path found: '+p.edges.length+' hop(s)','ok');renderInspector();}
            else toast('No path within current filters','warn');}}
        else{G.sel=(G.sel===n)?null:n;G.path=null;renderInspector();if(!G.sel)renderCluster(null,null);}}
      G.drag=null;}
    if(G.pan){G.pan=null;cv.classList.remove('grab');}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',()=>{tip.classList.remove('on');G.hover=null;G.hoverEdge=null;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){G.pathMode=false;G.pathSrc=null;G.path=null;$('#pathMode').classList.remove('on');$('#pathHint').style.display='none';$('#eBack').classList.remove('on');renderInspector();}});
  window.addEventListener('resize',()=>{if($('#panel-network').classList.contains('on'))resize();});
}
/* ================= BOOT ================= */
buildGraph();
renderKpis();renderLegend();renderSignals();renderAlerts();renderEntities();renderClusters();renderGeo();renderTime();
renderCluster(CLUSTERS[0],null);
wire();
requestAnimationFrame(()=>{resize();fit();});
requestAnimationFrame(loop);
toast('Trust network loaded — '+NODES.length+' entities, '+EDGES.length+' relationships','ok');
})();
</script>
</body>
</html>
