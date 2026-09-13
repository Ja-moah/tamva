<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TAMVA Ledger — canonical financial history layer</title>
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
  --violet:#b18cf5; --violet-soft:rgba(177,140,245,.13);
  --shadow:0 22px 54px rgba(0,0,0,.5);
}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased;
 background-image:radial-gradient(1200px 500px at 85% -10%,rgba(45,212,160,.07),transparent 60%),linear-gradient(rgba(45,212,160,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,160,.035) 1px,transparent 1px);background-size:auto,46px 46px,46px 46px}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
button,input,select,textarea{font:inherit;color:inherit}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px}::-webkit-scrollbar-track{background:transparent}
.app{display:flex;min-height:100vh}
.side{width:236px;flex:0 0 auto;border-right:1px solid var(--border);background:linear-gradient(180deg,var(--bg2),var(--bg));display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.logo{display:flex;align-items:center;gap:10px;padding:18px 18px 6px}
.logo .mk{width:34px;height:34px;border-radius:10px;background:linear-gradient(140deg,var(--accent),#0d9488);display:grid;place-items:center;color:#04140c;font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(45,212,160,.3)}
.logo h1{margin:0;font-size:16px;letter-spacing:.06em;font-weight:700}
.logo p{margin:1px 0 0;font-size:9.5px;color:var(--mute);letter-spacing:.04em}
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
.pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border:1px solid var(--border);border-radius:999px;background:var(--panel2);font-size:11px;color:var(--dim);white-space:nowrap}
.pill .dt{width:7px;height:7px;border-radius:50%;background:var(--accent)}
.spacer{flex:1}
.btn{border:1px solid var(--border);background:var(--panel2);color:var(--text);padding:7px 13px;border-radius:9px;cursor:pointer;font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:7px;transition:.15s;white-space:nowrap}
.btn:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--border));transform:translateY(-1px)}
.btn.primary{background:linear-gradient(140deg,var(--accent),#0d9488);border-color:transparent;color:#04140c}
.btn.danger{border-color:color-mix(in srgb,var(--red) 45%,var(--border));color:var(--red)}
.btn.ghost{background:transparent}
.btn.sm{padding:4px 9px;font-size:11.5px;border-radius:7px}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.head{padding:20px 22px 4px}
.head h2{margin:0;font-size:22px;letter-spacing:-.01em}
.head p{margin:4px 0 0;color:var(--dim);font-size:12.5px;max-width:880px}
.tabs{display:flex;gap:4px;padding:14px 22px 0;border-bottom:1px solid var(--border);flex-wrap:wrap}
.tab{border:0;background:transparent;padding:9px 15px;border-radius:10px 10px 0 0;cursor:pointer;color:var(--dim);font-size:12.5px;font-weight:600;border-bottom:2px solid transparent}
.tab:hover{color:var(--text);background:var(--panel2)}
.tab.on{color:var(--accent);border-bottom-color:var(--accent);background:var(--accent-soft)}
.content{padding:16px 22px 30px;display:flex;flex-direction:column;gap:14px}
.panel{display:none;flex-direction:column;gap:14px}.panel.on{display:flex}
.card{border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:var(--shadow)}
.card>h3{margin:0;padding:11px 14px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--border2);display:flex;align-items:center;gap:8px;font-weight:700;flex-wrap:wrap}
.card>h3 .spacer{flex:1}
.card .body{padding:13px 14px}
.grid2{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:14px}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.stat{border:1px solid var(--border2);border-radius:12px;padding:11px 13px;background:var(--panel2)}
.stat .k{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700}
.stat .v{font-size:19px;font-weight:700;margin-top:3px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.stat .s{font-size:10.5px;color:var(--dim);margin-top:2px}
table{width:100%;border-collapse:collapse}
thead th{position:sticky;top:0;z-index:2;background:var(--panel2);text-align:left;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--mute);font-weight:700;padding:9px 11px;border-bottom:1px solid var(--border)}
tbody td{padding:8px 11px;border-bottom:1px solid var(--border2);font-size:12.5px;vertical-align:middle}
tbody tr.jrow{cursor:pointer;transition:.13s}
tbody tr.jrow:hover{background:var(--panel2)}
tbody tr.jrow.open{background:var(--accent-soft)}
.tnum{text-align:right;font-variant-numeric:tabular-nums}
.badge{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.b-income{background:var(--accent-soft);color:var(--accent)}.b-expense{background:var(--red-soft);color:var(--red)}
.b-transfer{background:var(--blue-soft);color:var(--blue)}.b-saving{background:var(--violet-soft);color:var(--violet)}
.b-debt{background:var(--amber-soft);color:var(--amber)}.b-investment{background:var(--blue-soft);color:#8ec5ff}
.b-fee{background:var(--amber-soft);color:#ffd479}.b-other{background:var(--panel3);color:var(--dim)}
.b-ok{background:var(--accent-soft);color:var(--accent)}.b-warn{background:var(--amber-soft);color:var(--amber)}.b-err{background:var(--red-soft);color:var(--red)}
.dir{font-weight:700;font-size:10.5px}.dir.IN{color:var(--accent)}.dir.OUT{color:var(--red)}
.hashpill{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);background:var(--panel3);border:1px solid var(--border2);border-radius:6px;padding:2px 6px;cursor:copy}
.hashpill:hover{color:var(--accent)}
.hashpill.bad{color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,transparent);background:var(--red-soft)}
.conf{display:inline-flex;align-items:center;gap:6px}
.conf .cbar{width:44px;height:5px;border-radius:3px;background:var(--panel3);overflow:hidden}
.conf .cbar i{display:block;height:100%;border-radius:3px}
.toolbar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:11px 13px}
.search{position:relative;flex:1;min-width:180px}
.search input{width:100%;padding:8px 12px 8px 31px;border-radius:9px;border:1px solid var(--border);background:var(--panel2);outline:none;font-size:12.5px}
.search input:focus{border-color:var(--accent);box-shadow:0 0 0 1px rgba(45,212,160,.3)}
.search svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);opacity:.5}
.chips{display:flex;gap:5px;flex-wrap:wrap}
.chip{padding:5px 11px;border-radius:999px;border:1px solid var(--border);background:var(--panel2);font-size:11px;font-weight:600;color:var(--dim);cursor:pointer}
.chip.on{background:var(--accent-soft);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
select.sel{padding:7px 10px;border-radius:9px;border:1px solid var(--border);background:var(--panel2);font-size:12px;outline:none}
.detail td{padding:0;background:var(--panel2)}
.dwrap{padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}
.pipe{display:flex;flex-direction:column;gap:0}
.step{display:flex;gap:11px;position:relative;padding-bottom:14px}
.step:last-child{padding-bottom:0}
.step::before{content:'';position:absolute;left:10px;top:22px;bottom:0;width:1px;background:var(--border)}
.step:last-child::before{display:none}
.step .ic{width:21px;height:21px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;font-size:10px;font-weight:700;background:var(--panel3);color:var(--mute);border:1px solid var(--border);z-index:1}
.step.done .ic{background:var(--accent-soft);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.step.fail .ic{background:var(--red-soft);color:var(--red);border-color:color-mix(in srgb,var(--red) 40%,transparent)}
.step .tx{font-size:12px;font-weight:600}
.step .ds{font-size:11px;color:var(--mute);margin-top:1px}
.step .ds .mono{font-size:10px;color:var(--dim)}
.rules{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.rules li{display:flex;gap:9px;font-size:12px;color:var(--dim);line-height:1.55}
.rules li b{color:var(--text)}
.rules li::before{content:'•';color:var(--accent);font-weight:700}
.prov{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.prov span{font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--dim);background:var(--panel3);border:1px solid var(--border2);padding:2px 7px;border-radius:6px}
.barlist{display:flex;flex-direction:column;gap:9px}
.baritem .t{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px}
.bar{height:7px;border-radius:4px;background:var(--panel3);overflow:hidden}
.bar i{display:block;height:100%;border-radius:4px}
.check{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-bottom:1px solid var(--border2);font-size:12.5px}
.check:last-child{border-bottom:0}
.ico{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;font-size:10.5px;font-weight:700;margin-top:1px}
.ico.ok{background:var(--accent-soft);color:var(--accent)}.ico.bad{background:var(--red-soft);color:var(--red)}.ico.warn{background:var(--amber-soft);color:var(--amber)}
.chain{display:flex;gap:9px;overflow-x:auto;padding:14px}
.block{flex:0 0 176px;border:1px solid var(--border);border-radius:11px;background:var(--panel2);padding:10px 11px;font-size:10.5px;position:relative}
.block+.block::before{content:'';position:absolute;left:-9px;top:50%;width:9px;height:1px;background:var(--border)}
.block.broken{border-color:var(--red);background:var(--red-soft)}
.block .ix{font-size:9px;letter-spacing:.1em;color:var(--mute);text-transform:uppercase;font-weight:700}
.block .rf{font-weight:600;font-size:11.5px;margin:3px 0 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.block .hh{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--dim);word-break:break-all;line-height:1.5}
.log{max-height:280px;overflow:auto;font-family:'JetBrains Mono',monospace;font-size:10.5px}
.log .li{display:flex;gap:9px;padding:5px 14px;border-bottom:1px solid var(--border2)}
.log time{color:var(--mute);flex:0 0 auto}
.log .kd{flex:0 0 96px;font-weight:600}
.kd.ok{color:var(--accent)}.kd.err{color:var(--red)}.kd.warn{color:var(--amber)}.kd.info{color:var(--blue)}
.backdrop{position:fixed;inset:0;z-index:80;background:rgba(2,8,5,.76);backdrop-filter:blur(5px);display:none;align-items:flex-start;justify-content:center;padding:34px 16px;overflow:auto}
.backdrop.on{display:flex}
.modal{width:min(720px,100%);border:1px solid var(--border);border-radius:16px;background:var(--panel2);box-shadow:var(--shadow);animation:pop .18s ease}
@keyframes pop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.modal header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:11px}
.modal header h2{margin:0;font-size:15px}
.modal header p{margin:2px 0 0;font-size:11px;color:var(--mute)}
.modal .content2{padding:16px 18px;display:flex;flex-direction:column;gap:13px}
.modal footer{padding:12px 18px;border-top:1px solid var(--border);display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:11px}
label.f{display:flex;flex-direction:column;gap:5px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);font-weight:700}
label.f input,label.f select{padding:8px 10px;border-radius:9px;border:1px solid var(--border);background:var(--panel3);outline:none;font-size:12.5px;text-transform:none;letter-spacing:0;color:var(--text)}
label.f input:focus,label.f select:focus{border-color:var(--accent)}
.xbtn{border:1px solid var(--border);background:var(--panel3);border-radius:8px;height:30px;width:30px;cursor:pointer;color:var(--mute)}
.xbtn:hover{color:var(--red)}
.err{display:flex;gap:8px;align-items:center;font-size:12px;color:var(--red);background:var(--red-soft);padding:7px 11px;border-radius:9px}
#toasts{position:fixed;right:16px;bottom:16px;z-index:120;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.toast{border:1px solid var(--border);background:var(--panel2);border-radius:11px;padding:10px 14px;font-size:12.5px;box-shadow:var(--shadow);display:flex;gap:9px;align-items:center;animation:sl .2s ease;max-width:380px}
@keyframes sl{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.toast.ok{border-left:3px solid var(--accent)}.toast.err{border-left:3px solid var(--red)}.toast.info{border-left:3px solid var(--blue)}.toast.warn{border-left:3px solid var(--amber)}
.foot{display:flex;gap:16px;align-items:center;padding:10px 22px;border-top:1px solid var(--border);font-size:11px;color:var(--mute);flex-wrap:wrap;background:var(--bg2)}
.empty{padding:40px 18px;text-align:center;color:var(--mute);font-size:12.5px}
.hide{display:none!important}
@media(max-width:1000px){.grid2{grid-template-columns:1fr}.dwrap{grid-template-columns:1fr}.app{flex-direction:column}.side{width:100%;height:auto;position:static}.sidefoot{display:none}.nav{flex-direction:row;flex-wrap:wrap}}
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
      <button class="nv on">≣ Ledger <span class="own">this drop</span></button>
      <button class="nv dis" title="Separate drop — see tamva-graph.html">⌬ Network <span class="own">graph drop</span></button>
      <button class="nv dis" title="Owned by analytics squad">∿ Analytics</button>
      <button class="nv dis" title="Owned by platform squad">⚙ Settings</button>
    </nav>
    <div class="sidefoot">
      <div class="tag">A MORE INCLUSIVE<br>FINANCIAL FUTURE<br>FOR AFRICA.</div><div class="bar"></div>
      <div class="logo" style="padding:0"><div class="mk" style="width:22px;height:22px;border-radius:7px;font-size:11px">T</div><b style="font-size:12px">TAMVA</b></div>
      <div class="cp">© 2026 TAMVA<br>All rights reserved.<br><span class="mono" style="font-size:9px">ledger module v1 · branch feature/ledger-graph</span></div>
    </div>
  </aside>

  <div class="main">
    <div class="top">
      <span class="pill"><span class="dt"></span>Production</span>
      <span class="pill">🏛 Partner Bank · Institution Portal</span>
      <div class="spacer"></div>
      <span class="pill mono" id="envClock">—</span>
      <button class="btn primary" id="btnIngest">＋ Ingest normalized transaction</button>
    </div>

    <div class="head">
      <h2>TAMVA Ledger</h2>
      <p>The canonical financial history layer — TAMVA's normalized representation of financial activity, not a bank settlement ledger. Its job is to make fragmented activity analyzable without inventing economic events. Immutable source facts · corrections through compensating entries · idempotent ingestion · reconciliation and daily integrity checks.</p>
    </div>

    <div class="tabs" id="tabs">
      <button class="tab on" data-tab="journal">Journal</button>
      <button class="tab" data-tab="pipeline">Processing &amp; Classification</button>
      <button class="tab" data-tab="aggregates">Aggregates &amp; Features</button>
      <button class="tab" data-tab="integrity">Integrity &amp; Audit</button>
    </div>

    <div class="content">
      <!-- ===== JOURNAL ===== -->
      <section class="panel on" id="panel-journal">
        <div class="card">
          <div class="toolbar">
            <div class="search"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04-1.06 1.06ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z"/></svg>
              <input id="jq" placeholder="Search tx id, source event, counterparty, narration, masked account…  ( / )"></div>
            <div class="chips" id="catChips"></div>
            <select class="sel" id="dirSel"><option value="all">IN + OUT</option><option value="IN">IN only</option><option value="OUT">OUT only</option></select>
            <select class="sel" id="acctSel"><option value="all">All accounts</option></select>
            <div class="spacer"></div>
            <span id="jCount" style="font-size:11px;color:var(--mute)"></span>
            <button class="btn sm" id="btnJson">⤓ ledger.json</button>
            <button class="btn sm" id="btnCsv">⤓ journal.csv</button>
          </div>
          <div style="overflow:auto;max-height:calc(100vh - 320px)">
            <table>
              <thead><tr><th style="width:112px">Timestamp</th><th style="width:104px">Transaction</th><th style="width:104px">Account</th><th style="width:42px">Dir</th><th class="tnum" style="width:104px">Source amt</th><th style="width:168px">Counterparty</th><th style="width:148px">Classification</th><th class="tnum" style="width:110px">Balance after</th><th style="width:92px">Status</th></tr></thead>
              <tbody id="jBody"></tbody>
            </table>
            <div id="jEmpty"></div>
          </div>
        </div>
      </section>

      <!-- ===== PIPELINE ===== -->
      <section class="panel" id="panel-pipeline">
        <div class="grid2">
          <div class="card">
            <h3>Ledger processing pipeline <span class="spacer"></span><button class="btn sm primary" id="btnIngest2">Run pipeline</button></h3>
            <div class="body"><div class="pipe" id="pipeStatic"></div></div>
          </div>
          <div class="card">
            <h3>Classification rules</h3>
            <div class="body"><ul class="rules" id="rulesList"></ul></div>
          </div>
        </div>
        <div class="card">
          <h3>Category taxonomy <span class="spacer"></span><span style="font-size:10px;color:var(--mute);letter-spacing:0;text-transform:none">uncertain classifications carry confidence + provenance, never false precision · classifications are point-in-time</span></h3>
          <div class="body"><div class="chips" id="taxChips" style="gap:7px"></div></div>
        </div>
      </section>

      <!-- ===== AGGREGATES ===== -->
      <section class="panel" id="panel-aggregates">
        <div class="grid3" id="cfCards"></div>
        <div class="grid2">
          <div class="card"><h3>Classified flow by category (net, corrections applied)</h3><div class="body"><div class="barlist" id="catBars"></div></div></div>
          <div class="card"><h3>Transfer neutralization (rule L-2)</h3><div class="body" id="neutralBox"></div></div>
        </div>
        <div class="card">
          <h3>Derived features <span class="spacer"></span><span style="font-size:10px;color:var(--mute);letter-spacing:0;text-transform:none">emitted via profile.feature.refresh · versioned, never overwritten in place</span></h3>
          <div style="overflow:auto"><table>
            <thead><tr><th>Subject</th><th>feature_name</th><th class="tnum">value</th><th>window</th><th class="tnum">version</th><th>computed_at</th><th>provenance</th></tr></thead>
            <tbody id="featBody"></tbody></table></div>
        </div>
      </section>

      <!-- ===== INTEGRITY ===== -->
      <section class="panel" id="panel-integrity">
        <div class="card">
          <h3>Integrity controls
            <span class="spacer"></span>
            <button class="btn sm" id="btnDaily">▶ Run daily integrity job</button>
            <button class="btn sm danger" id="btnTamper">Simulate silent mutation</button>
            <button class="btn sm" id="btnRestore">Restore source fact</button>
          </h3>
          <div class="body" style="display:flex;flex-direction:column;gap:12px">
            <div class="grid3" id="intStats"></div>
            <div id="checksList" style="border:1px solid var(--border2);border-radius:11px;overflow:hidden"></div>
          </div>
        </div>
        <div class="grid2">
          <div class="card"><h3>Anomaly report</h3><div id="anomalyList"></div></div>
          <div class="card"><h3>Reconciliation vs source balances</h3><div id="reconBox" class="body"></div></div>
        </div>
        <div class="card"><h3>audit_event hash chain <span class="spacer"></span><span style="font-size:10px;color:var(--mute);letter-spacing:0;text-transform:none">actor · action · object · timestamp · hash</span></h3><div class="chain" id="auditChain"></div></div>
        <div class="card"><h3>Session event log <span class="spacer"></span><button class="btn sm ghost" id="btnClearLog">clear</button></h3><div class="log" id="logList"></div></div>
      </section>
    </div>

    <div class="foot">
      <span>Trust opens doors.</span><span class="spacer" style="flex:1"></span>
      <span>🔒 Secure. Compliant. Built for Africa.</span><span class="spacer" style="flex:1"></span>
      <span>Help &amp; Support</span><span>Terms</span><span>Privacy</span>
    </div>
  </div>
</div>

<!-- ===== INGEST MODAL ===== -->
<div class="backdrop" id="backdrop"><div class="modal">
  <header><div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(140deg,var(--accent),#0d9488);display:grid;place-items:center;color:#04140c;font-weight:700">＋</div>
    <div style="flex:1"><h2>Ingest normalized transaction</h2><p>Runs the full pipeline: validate → classify → resolve ownership → ledger entry → aggregates → feature refresh</p></div>
    <button class="xbtn" id="iClose">✕</button></header>
  <div class="content2">
    <div class="fgrid">
      <label class="f">source_event_id (immutable)<input id="iSource" class="mono"></label>
      <label class="f">Timestamp<input id="iTs" type="datetime-local"></label>
      <label class="f">Account<select id="iAccount"></select></label>
      <label class="f">Direction<select id="iDir"><option value="IN">IN (inflow)</option><option value="OUT">OUT (outflow)</option></select></label>
      <label class="f">Amount (GHS)<input id="iAmount" class="mono" inputmode="decimal" placeholder="0.00"></label>
      <label class="f">Counterparty<input id="iCounter" placeholder="e.g. Ministry of Education Payroll"></label>
      <label class="f">Counterparty account (internal, optional)<select id="iCounterAcct"><option value="">— none / external —</option></select></label>
    </div>
    <label class="f">Narration (source fact — never edited)<input id="iNarr" placeholder="Original narration as received"></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn sm ghost" id="iReplay"> Replay duplicate source_event_id</button>
      <button class="btn sm ghost" id="iFillSalary">sample: salary inflow</button>
      <button class="btn sm ghost" id="iFillSave">sample: savings transfer</button>
      <button class="btn sm ghost" id="iFillBig">sample: large one-off inflow</button>
    </div>
    <div class="pipe" id="stepsHost"></div>
    <div id="iErrs" style="display:flex;flex-direction:column;gap:6px"></div>
  </div>
  <footer><span style="font-size:11px;color:var(--mute)" id="iHint">UUIDs externally · internal keys never exposed via public APIs</span>
    <div class="spacer"></div><button class="btn ghost" id="iCancel">Cancel</button><button class="btn primary" id="iSubmit">Run pipeline</button></footer>
</div></div>

<!-- ===== CORRECT MODAL ===== -->
<div class="backdrop" id="cBackdrop"><div class="modal" style="width:min(500px,100%)">
  <header><div style="flex:1"><h2>Correct via compensating entry</h2><p>Source facts stay immutable — the error is reversed and re-stated at ledger-entry level, never mutated</p></div><button class="xbtn" id="cClose">✕</button></header>
  <div class="content2">
    <div id="cInfo" style="font-size:12px;color:var(--dim)"></div>
    <label class="f">Corrected amount (GHS)<input id="cAmount" class="mono" inputmode="decimal"></label>
    <label class="f">Reason (audit trail)<input id="cReason" placeholder="e.g. source feed decimal shift"></label>
  </div>
  <footer><div class="spacer"></div><button class="btn ghost" id="cCancel">Cancel</button><button class="btn primary" id="cSubmit">Post compensating entries</button></footer>
</div></div>

<div id="toasts"></div>

<script>
(()=>{ 'use strict';
/* ================= UTIL ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);}));
const short=u=>String(u).slice(0,8);
const fmt=new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'});
const money=c=>fmt.format((Number(c)||0)/100);
function compact(c){const v=Math.abs(c)/100,s=c<0?'-':'';if(v>=1e6)return s+'GH₵'+(v/1e6).toFixed(2)+'M';if(v>=1e4)return s+'GH₵'+(v/1e3).toFixed(1)+'k';return s+'GH₵'+v.toFixed(2);}
const dtShort=ts=>new Date(ts).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function toLocalInput(ts){const d=new Date(ts);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);}
async function sha256(str){try{if(globalThis.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}}catch(e){}
  let out='';for(let s=1;s<=4;s++)out+=fnv(str,s);return out;}
function fnv(str,seed){let h1=(0x811c9dc5^seed)>>>0,h2=(0x01000193^(seed*7919))>>>0;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=Math.imul(h2+c+i,2654435761)>>>0;}return h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0');}
function toast(msg,kind='info',ms=3400){const el=document.createElement('div');el.className='toast '+kind;el.innerHTML='<span>'+(kind==='ok'?'✓':kind==='err'?'✕':kind==='warn'?'⚠':'ℹ')+'</span><span>'+esc(msg)+'</span>';$('#toasts').appendChild(el);setTimeout(()=>{el.style.transition='opacity .25s,transform .25s';el.style.opacity='0';el.style.transform='translateX(12px)';setTimeout(()=>el.remove(),260);},ms);}
function download(name,text,mime='application/json'){const b=new Blob([text],{type:mime+';charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
async function copy(t,l){try{await navigator.clipboard.writeText(t);toast(l+' copied','ok');}catch(e){toast('clipboard unavailable','err');}}

/* ================= DOMAIN (Section 4 entity model — ledger-relevant slice) ================= */
const D=24*3600e3,now=Date.now();
const at=(d,h=10,m=0)=>{const x=new Date(now-d*D);x.setHours(h,m,0,0);return x.getTime();};
const CUSTOMERS=[
  {ref:'CUS-0243-****-4583',status:'active',created_at:at(210)},
  {ref:'CUS-0718-****-9921',status:'active',created_at:at(160)},
  {ref:'CUS-1150-****-3367',status:'active',created_at:at(95)}];
const INSTITUTIONS=[
  {id:'INS-01',name:'Partner Bank',type:'bank'},{id:'INS-02',name:'Mobile Money',type:'mno'},
  {id:'INS-03',name:'Savings & Loans',type:'savings'},{id:'INS-04',name:'Accra Brokerage',type:'fintech'},
  {id:'INS-05',name:'Ghana Credit Co',type:'lender'}];
const ACCOUNTS=[
  {id:uuid(),customer:CUSTOMERS[0].ref,institution:'INS-01',account_type:'bank',masked_identifier:'**** 4583',currency:'GHS'},
  {id:uuid(),customer:CUSTOMERS[0].ref,institution:'INS-02',account_type:'wallet',masked_identifier:'**** 7710',currency:'GHS'},
  {id:uuid(),customer:CUSTOMERS[0].ref,institution:'INS-03',account_type:'savings',masked_identifier:'**** 3300',currency:'GHS'},
  {id:uuid(),customer:CUSTOMERS[1].ref,institution:'INS-01',account_type:'bank',masked_identifier:'**** 9921',currency:'GHS'},
  {id:uuid(),customer:CUSTOMERS[1].ref,institution:'INS-02',account_type:'wallet',masked_identifier:'**** 1180',currency:'GHS'},
  {id:uuid(),customer:CUSTOMERS[2].ref,institution:'INS-02',account_type:'wallet',masked_identifier:'**** 3367',currency:'GHS'}];
const ACC={A1:ACCOUNTS[0],A2:ACCOUNTS[1],A3:ACCOUNTS[2],A4:ACCOUNTS[3],A5:ACCOUNTS[4],A6:ACCOUNTS[5]};
const acctLabel=a=>a.masked_identifier+' · '+INSTITUTIONS.find(i=>i.id===a.institution).name;
const CATS=['INCOME','EXPENSE','TRANSFER','SAVING','DEBT','INVESTMENT','FEE','OTHER'];
const CAT_COLOR={INCOME:'var(--accent)',EXPENSE:'var(--red)',TRANSFER:'var(--blue)',SAVING:'var(--violet)',DEBT:'var(--amber)',INVESTMENT:'#8ec5ff',FEE:'#ffd479',OTHER:'var(--dim)'};

/* ================= STATE ================= */
const state={txs:[],entries:[],audits:[],features:[],sourceBalances:new Map(),checks:null,recon:null,log:[],seq:0,tampered:null,
  filters:{q:'',cat:'all',dir:'all',acct:'all'},open:new Set()};
const agg={perAcct:null,perCat:null,grossIn:0,grossOut:0,netIn:0,netOut:0,corrNet:0,neutralLegs:0,neutralAmount:0,netNeutral:0};

/* ================= AUDIT (actor, action, object, timestamp, hash) ================= */
async function audit(actor,action,object){
  const prev=state.audits.length?state.audits[state.audits.length-1].hash:'0'.repeat(64);
  const ts=Date.now();
  const hash=await sha256(prev+'|'+actor+'|'+action+'|'+object+'|'+ts);
  state.audits.push({id:uuid(),actor,action,object,timestamp:ts,hash,prev});
  const kind=(/reject|fail|mutation/.test(action))?'err':(/warn|uncertain/.test(action))?'warn':(/integrity|compensat|restore/.test(action))?'ok':'info';
  state.log.unshift({ts,kind,msg:actor+' '+action+' '+object});
  if(state.log.length>240)state.log.pop();
}

/* ================= IMMUTABLE SOURCE-FACT HASH CHAIN ================= */
const srcCanonical=t=>JSON.stringify({s:t.source_event_id,a:t.account_id,d:t.direction,v:t.amount,c:t.currency,t:t.timestamp,p:t.counterparty,n:t.narration});
async function sealSourceFacts(from=0){
  let prev=from===0?'0'.repeat(64):state.txs[from-1].source_hash;
  for(let i=from;i<state.txs.length;i++){const t=state.txs[i];t.source_prev=prev;t.source_hash=await sha256(prev+srcCanonical(t));prev=t.source_hash;}
}

/* ================= CLASSIFICATION ENGINE (Section 8 rules L-1…L-5) ================= */
function median(arr){if(!arr.length)return 0;const s=arr.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}
function isoWeek(ts){const d=new Date(ts);const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day+3);const f=new Date(Date.UTC(d.getUTCFullYear(),0,4));return d.getUTCFullYear()+'-W'+(1+Math.round(((d-f)/86400000-3+((f.getUTCDay()+6)%7))/7));}
function classify(tx,history){
  const prov=[],ev=[];let cat='OTHER',conf=.3;
  const acct=ACCOUNTS.find(a=>a.id===tx.account_id);
  if(tx.counterparty_account){
    const other=ACCOUNTS.find(a=>a.id===tx.counterparty_account);
    if(other&&other.customer===acct.customer){cat='TRANSFER';conf=.99;prov.push('L-2 ownership graph');ev.push('both endpoints owned by '+acct.customer);return fin();}
  }
  const narr=(tx.narration||'').toLowerCase(),cp=(tx.counterparty||'').toLowerCase();
  const savingsDest=tx.direction==='OUT'&&(acct.account_type==='savings'||/savings|sacco|susu/.test(cp)||/auto-?save|savings/.test(narr));
  if(savingsDest){
    const reps=history.filter(h=>h.direction==='OUT'&&h.counterparty===tx.counterparty&&h.account_id===tx.account_id).length;
    cat='SAVING';
    if(reps>=1){conf=.85;prov.push('L-4 destination relationship','L-4 repeated behaviour (n='+(reps+1)+')');}
    else{conf=.6;prov.push('L-4 destination relationship only');ev.push('single occurrence — repetition not yet established');}
    return fin();
  }
  if(/loan|repay|installment|credit co|lender|disbursement/.test(cp+' '+narr)){cat='DEBT';conf=.82;prov.push('L-3 debt modelled separately from expenses');return fin();}
  if(/fee|charge|commission|levy/.test(cp+' '+narr)){cat='FEE';conf=.9;prov.push('F-1 fee narrative + institution origin');return fin();}
  if(/broker|treasury|bond|fund|investment/.test(cp+' '+narr)){cat='INVESTMENT';conf=.8;prov.push('I-1 investment destination');return fin();}
  if(tx.direction==='IN'){
    const prior=history.filter(h=>h.direction==='IN'&&h.counterparty===tx.counterparty);
    const weeks=new Set(prior.map(h=>isoWeek(h.timestamp)));weeks.add(isoWeek(tx.timestamp));
    if(prior.length>=1&&weeks.size>=2){cat='INCOME';conf=Math.min(.95,.62+.11*prior.length);prov.push('L-1 temporal evidence','n='+(prior.length+1)+' inflows over '+weeks.size+' weeks');return fin();}
    const ins=history.filter(h=>h.direction==='IN').map(h=>h.amount);
    if(ins.length&&tx.amount>3*median(ins)){cat='OTHER';conf=.35;prov.push('L-1 single large inflow — income unconfirmed');ev.push('requires corroboration over time before income re-class');return fin();}
    cat='OTHER';conf=.45;prov.push('L-1 insufficient temporal evidence');ev.push('re-evaluate on next inflow from same counterparty');return fin();
  }
  cat='EXPENSE';conf=.7;prov.push('L-5 residual outflow');return fin();
  function fin(){return{category:cat,confidence:conf,provenance:prov,evidence:ev};}
}

/* ================= LEDGER ENTRIES (entry_type, amount, currency, balance_after) ================= */
function lastBalance(accountId){for(let i=state.entries.length-1;i>=0;i--){if(state.entries[i].account_id===accountId)return state.entries[i].balance_after;}return 0;}
function createEntry(tx,entryType,signedAmount,opts={}){
  const e={entry_id:uuid(),seq:++state.seq,tx_id:tx?tx.id:null,account_id:tx?tx.account_id:opts.account_id,
    entry_type:entryType,cat:opts.cat!==undefined?opts.cat:(tx?tx.classification.category:null),
    amount:signedAmount,currency:'GHS',balance_after:lastBalance(tx?tx.account_id:opts.account_id)+signedAmount,
    version:opts.version||1,created_at:opts.created_at||Date.now(),compensates:opts.compensates||null,note:opts.note||''};
  state.entries.push(e);return e;
}
const signedOf=t=>(t.direction==='IN'?1:-1)*t.amount;
const entriesOfTx=id=>state.entries.filter(e=>e.tx_id===id).sort((a,b)=>a.seq-b.seq);
const effectiveOf=id=>entriesOfTx(id).filter(e=>e.entry_type!=='OPENING').reduce((s,e)=>s+e.amount,0);

/* ================= PIPELINE INGEST ================= */
async function ingest(input,animate){
  const step=(i,ok,ds)=>{if(animate)animate(i,ok,ds);};
  if(state.txs.some(t=>t.source_event_id===input.source_event_id)){
    await audit('ingestion','ingest.rejected_duplicate','source_event_id='+input.source_event_id);
    step(0,false,'duplicate source_event_id — idempotent ingestion rejected the replay');
    return{ok:false,reason:'duplicate source_event_id (idempotent ingestion)'};
  }
  const acct=ACCOUNTS.find(a=>a.id===input.account_id);
  if(!acct||input.currency!=='GHS'||!(input.amount>0)){step(0,false,'validation failed: currency / amount / account');return{ok:false,reason:'validation failed (currency/amount/account)'};}
  step(0,true,'currency GHS · amount '+money(input.amount)+' · account '+acct.masked_identifier+' resolved');
  const history=state.txs.filter(t=>t.timestamp<input.timestamp).sort((a,b)=>a.timestamp-b.timestamp);
  const cls=classify(input,history);
  step(1,true,cls.category+' @ '+Math.round(cls.confidence*100)+'% · '+cls.provenance.join(' ; '));
  step(2,true,'ownership → '+acct.customer+' via account '+acct.masked_identifier);
  const tx=Object.assign({},input,{id:uuid(),classification:cls,status:'posted'});
  state.txs.push(tx);state.txs.sort((a,b)=>a.timestamp-b.timestamp);
  await sealSourceFacts(state.txs.indexOf(tx));
  const entry=createEntry(tx,cls.category,signedOf(tx),{created_at:tx.timestamp});
  step(3,true,'ledger_entry '+short(entry.entry_id)+' · '+entry.entry_type+' · balance_after '+money(entry.balance_after));
  computeAggregates();syncSource();
  step(4,true,'balance/flow aggregates refreshed · transfers neutralized per L-2');
  refreshFeatures(acct.customer);
  step(5,true,'profile.feature.refresh emitted for '+acct.customer);
  await audit('ingestion','ingest.accepted','tx='+short(tx.id)+' src='+short(tx.source_event_id));
  await audit('classifier','classification.assign',short(tx.id)+' → '+cls.category+' conf='+cls.confidence.toFixed(2));
  return{ok:true,tx,entry};
}
/* correction = compensating entries; source fact NEVER mutated */
async function correctEntry(txId,newAmount,reason){
  const tx=state.txs.find(t=>t.id===txId);if(!tx||tx.status==='corrected')return null;
  const orig=entriesOfTx(txId).filter(e=>e.entry_type!=='CORRECTION_REVERSAL'&&e.entry_type!=='CORRECTION');
  const last=orig[orig.length-1];
  const rev=createEntry(tx,'CORRECTION_REVERSAL',-last.amount,{compensates:last.entry_id,cat:last.cat,note:'reversal: '+reason});
  const cor=createEntry(tx,'CORRECTION',signedOf(Object.assign({},tx,{amount:newAmount})),{compensates:last.entry_id,cat:last.cat,note:'re-statement: '+reason});
  tx.status='corrected';tx.correction={reason,correctedAmount:newAmount,entries:[rev.entry_id,cor.entry_id]};
  computeAggregates();syncSource();refreshFeatures(ACCOUNTS.find(a=>a.id===tx.account_id).customer);
  await audit('ledger','compensating_entry.posted','tx='+short(tx.id)+' rev='+short(rev.entry_id)+' new='+short(cor.entry_id));
  return tx;
}

/* ================= AGGREGATES / FEATURES / RECON ================= */
function computeAggregates(){
  const perAcct=new Map(ACCOUNTS.map(a=>[a.id,{in:0,out:0,tIn:0,tOut:0}]));
  const perCat={};CATS.forEach(c=>perCat[c]=0);
  let grossIn=0,grossOut=0,netIn=0,netOut=0,corrNet=0,legs=0,neutral=0;
  for(const e of state.entries.slice().sort((a,b)=>a.seq-b.seq)){
    if(e.entry_type==='OPENING'||!e.cat)continue;
    const r=perAcct.get(e.account_id);if(!r)continue;
    if(e.entry_type==='CORRECTION_REVERSAL'||e.entry_type==='CORRECTION'){corrNet+=e.amount;perCat[e.cat]+=e.amount;continue;}
    perCat[e.cat]+=e.amount;
    if(e.cat==='TRANSFER'){legs++;neutral+=Math.abs(e.amount);if(e.amount>0){r.tIn+=e.amount;}else{r.tOut+=Math.abs(e.amount);}grossIn+=Math.max(0,e.amount);grossOut+=Math.max(0,-e.amount);}
    else{if(e.amount>0){r.in+=e.amount;grossIn+=e.amount;netIn+=e.amount;}else{r.out+=-e.amount;grossOut+=-e.amount;netOut+=-e.amount;}}
  }
  Object.assign(agg,{perAcct,perCat,grossIn,grossOut,netIn,netOut,corrNet,neutralLegs:legs,neutralAmount:neutral,netNeutral:netIn-netOut+corrNet});
}
function replayRun(){const run=new Map(ACCOUNTS.map(a=>[a.id,0]));
  for(const e of state.entries.slice().sort((a,b)=>a.seq-b.seq))run.set(e.account_id,(run.get(e.account_id)||0)+e.amount);return run;}
function syncSource(){state.sourceBalances=replayRun();}
function refreshFeatures(customerRef){
  const ts=Date.now(),cut30=ts-30*D,cut90=ts-90*D;
  const txs=state.txs.filter(t=>{const a=ACCOUNTS.find(x=>x.id===t.account_id);return a&&a.customer===customerRef;});
  const flow=id=>entriesOfTx(id).filter(e=>e.entry_type!=='OPENING'&&e.cat&&e.cat!=='TRANSFER').reduce((s,e)=>s+e.amount,0);
  const in30=txs.filter(t=>t.timestamp>=cut30).reduce((s,t)=>s+Math.max(0,flow(t.id)),0);
  const out30=txs.filter(t=>t.timestamp>=cut30).reduce((s,t)=>s+Math.max(0,-flow(t.id)),0);
  const inc90=txs.filter(t=>t.timestamp>=cut90&&t.classification.category==='INCOME');
  const incConf=inc90.length?Math.max.apply(null,inc90.map(t=>t.classification.confidence)):0;
  const sav90=txs.filter(t=>t.timestamp>=cut90&&t.classification.category==='SAVING').reduce((s,t)=>s+t.amount,0);
  const tr30=txs.filter(t=>t.timestamp>=cut30&&t.classification.category==='TRANSFER').length;
  const defs=[
    {feature_name:'cashflow_net_30d',value:Math.round((in30-out30)/100),window:'30d',prov:'neutralized transfers excluded (L-2)'},
    {feature_name:'income_recurring_90d',value:inc90.length,window:'90d',prov:'confidence '+incConf.toFixed(2)+' · L-1 temporal evidence'},
    {feature_name:'saving_rate_90d',value:in30?+(sav90/Math.max(1,in30)).toFixed(3):0,window:'90d',prov:'L-4 destination + repetition'},
    {feature_name:'transfers_neutralized_30d',value:tr30,window:'30d',prov:'linked own-account transfers (L-2)'}];
  for(const d of defs){
    const ex=state.features.find(f=>f.subject===customerRef&&f.feature_name===d.feature_name);
    if(ex){ex.value=d.value;ex.version++;ex.computed_at=ts;ex.provenance=d.prov;}
    else state.features.push({id:uuid(),subject:customerRef,feature_name:d.feature_name,value:d.value,window:d.window,version:1,computed_at:ts,provenance:d.prov});
  }
}

/* ================= INTEGRITY ================= */
async function runIntegrity(){
  const checks=[],anomalies=[];
  let prev='0'.repeat(64),brokenSrc=-1;
  for(let i=0;i<state.txs.length;i++){const t=state.txs[i];const h=await sha256(prev+srcCanonical(t));
    if(h!==t.source_hash||t.source_prev!==prev){if(brokenSrc<0)brokenSrc=i;}prev=t.source_hash;}
  checks.push({ok:brokenSrc<0,title:'Immutable transaction source facts',detail:brokenSrc<0?state.txs.length+' source facts re-hashed, chain intact':'source-fact hash chain broken at tx #'+(brokenSrc+1)+' — silent mutation detected'});
  if(brokenSrc>=0)anomalies.push({sev:'err',msg:'Source fact mutated out-of-band at height '+(brokenSrc+1)+' ('+state.txs[brokenSrc].counterparty+') — no compensating entry, no re-hash'});
  const run=new Map(ACCOUNTS.map(a=>[a.id,0]));let chainOk=true,badAt=null;
  for(const e of state.entries.slice().sort((a,b)=>a.seq-b.seq)){const b=(run.get(e.account_id)||0)+e.amount;run.set(e.account_id,b);
    if(b!==e.balance_after){chainOk=false;badAt=badAt||e.entry_id;}}
  checks.push({ok:chainOk,title:'balance_after continuity',detail:chainOk?state.entries.length+' ledger entries replay cleanly per account':'recomputed balance_after diverges at entry '+short(badAt||'')});
  if(!chainOk)anomalies.push({sev:'err',msg:'balance_after chain divergence at entry '+short(badAt||'')});
  let consistOk=true;
  for(const t of state.txs){const o=entriesOfTx(t.id).find(e=>e.entry_type!=='OPENING'&&e.entry_type!=='CORRECTION_REVERSAL'&&e.entry_type!=='CORRECTION');
    if(!o||o.amount!==signedOf(t)){consistOk=false;anomalies.push({sev:'err',msg:'Source ↔ entry mismatch on tx '+short(t.id)+' (source '+money(t.amount)+' vs first entry '+money(o?o.amount:0)+')'});}}
  checks.push({ok:consistOk,title:'Source ↔ first-entry consistency',detail:consistOk?'every first ledger entry equals its immutable source fact':'source facts diverge from posted entries'});
  const seen=new Set();let dup=0;for(const t of state.txs){if(seen.has(t.source_event_id))dup++;seen.add(t.source_event_id);}
  checks.push({ok:dup===0,title:'Idempotent ingestion',detail:dup===0?seen.size+' unique source_event_ids, zero replays accepted':dup+' duplicate source_event_ids present'});
  const recon=[];let reconOk=true;
  for(const a of ACCOUNTS){const computed=run.get(a.id)||0;const src=state.sourceBalances.has(a.id)?state.sourceBalances.get(a.id):computed;
    const diff=computed-src;if(diff!==0)reconOk=false;recon.push({acct:a,computed,source:src,diff});}
  state.recon=recon;
  checks.push({ok:reconOk,title:'Reconciliation vs source balances',detail:reconOk?'all accounts agree with institution source balances (last sync)':recon.filter(r=>r.diff).map(r=>r.acct.masked_identifier+' Δ'+money(r.diff)).join(', ')});
  if(!reconOk)recon.filter(r=>r.diff).forEach(r=>anomalies.push({sev:'err',msg:'Recon difference on '+r.acct.masked_identifier+': ledger '+money(r.computed)+' vs source '+money(r.source)}));
  const uncertain=state.txs.filter(t=>t.classification.confidence<.5);
  checks.push({ok:true,warn:uncertain.length>0,title:'Uncertain classifications carry confidence + provenance',detail:uncertain.length?uncertain.length+' classification(s) below 50% confidence, each carries provenance (no false precision): '+uncertain.map(t=>t.classification.category+'@'+Math.round(t.classification.confidence*100)+'%').join(', '):'no sub-threshold classifications'});
  uncertain.forEach(t=>anomalies.push({sev:'warn',msg:'Uncertain classification '+t.classification.category+' ('+Math.round(t.classification.confidence*100)+'%) on tx '+short(t.id)+' — '+t.classification.provenance.join('; ')}));
  const corrected=state.txs.filter(t=>t.status==='corrected');
  const pairOk=corrected.every(t=>state.entries.some(e=>e.tx_id===t.id&&e.entry_type==='CORRECTION_REVERSAL')&&state.entries.some(e=>e.tx_id===t.id&&e.entry_type==='CORRECTION'));
  checks.push({ok:pairOk,title:'Corrections via compensating entries',detail:corrected.length?corrected.length+' corrected tx(s), each with reversal + re-statement pair, source facts untouched':'no corrections this period — mutation-free policy holds'});
  state.checks={list:checks,anomalies,ok:checks.every(c=>c.ok),brokenSrc};
  return state.checks;
}

/* ================= SEED ================= */
function mkTx(account,direction,amountGhs,counterparty,narration,ts,counterparty_account){
  return{source_event_id:uuid(),account_id:account.id,direction,amount:Math.round(amountGhs*100),currency:'GHS',timestamp:ts,counterparty,narration,counterparty_account:counterparty_account||null};
}
async function boot(){
  [[ACC.A1,15000],[ACC.A2,4000],[ACC.A3,1200],[ACC.A4,9000],[ACC.A5,2500],[ACC.A6,800]].forEach(([a,v])=>{
    state.entries.push({entry_id:uuid(),seq:++state.seq,tx_id:null,account_id:a.id,entry_type:'OPENING',cat:null,amount:v*100,currency:'GHS',balance_after:v*100,version:1,created_at:at(120,0),compensates:null,note:'opening balance'});});
  const S=[
    mkTx(ACC.A1,'IN',4200,'Ministry of Education Payroll','Monthly salary credit',at(84,9)),
    mkTx(ACC.A4,'IN',3100,'Ministry of Education Payroll','Monthly salary credit',at(61,9)),
    mkTx(ACC.A1,'IN',4200,'Ministry of Education Payroll','Monthly salary credit',at(54,9)),
    mkTx(ACC.A4,'IN',3100,'Ministry of Education Payroll','Monthly salary credit',at(31,9)),
    mkTx(ACC.A1,'OUT',500,'Savings & Loans **** 3300','Auto-save transfer',at(70,6),ACC.A3.id),
    mkTx(ACC.A3,'IN',500,'Own account **** 4583','Auto-save transfer',at(70,6),ACC.A1.id),
    mkTx(ACC.A1,'OUT',500,'Savings & Loans **** 3300','Auto-save transfer',at(40,6),ACC.A3.id),
    mkTx(ACC.A3,'IN',500,'Own account **** 4583','Auto-save transfer',at(40,6),ACC.A1.id),
    mkTx(ACC.A2,'OUT',850,'Ghana Credit Co','Loan installment 3/12',at(45,14)),
    mkTx(ACC.A1,'IN',4350,'Ministry of Education Payroll','Monthly salary credit',at(24,9)),
    mkTx(ACC.A1,'OUT',2600,'Urban Stores','POS purchase Makola',at(16,17)),
    mkTx(ACC.A2,'OUT',1.5,'Mobile Money','Withdrawal fee',at(18,12)),
    mkTx(ACC.A4,'OUT',120,'Makola Market','Market purchase',at(19,10)),
    mkTx(ACC.A1,'OUT',340.5,'Urban Stores','POS purchase',at(20,18)),
    mkTx(ACC.A1,'OUT',2000,'Accra Brokerage','Treasury bill purchase',at(12,11)),
    mkTx(ACC.A2,'OUT',850,'Ghana Credit Co','Loan installment 4/12',at(15,14)),
    mkTx(ACC.A2,'IN',25000,'Unknown P2P — wallet origin','Wallet credit',at(9,23)),
    mkTx(ACC.A1,'OUT',3000,'Own wallet **** 7710','Own account top-up',at(8,8),ACC.A2.id),
    mkTx(ACC.A2,'IN',3000,'Own account **** 4583','Own account top-up',at(8,8),ACC.A1.id),
    mkTx(ACC.A1,'OUT',600,'Savings & Loans **** 3300','Auto-save transfer',at(10,6),ACC.A3.id),
    mkTx(ACC.A3,'IN',600,'Own account **** 4583','Auto-save transfer',at(10,6),ACC.A1.id),
    mkTx(ACC.A4,'OUT',260,'Urban Stores','POS purchase',at(5,17)),
    mkTx(ACC.A5,'OUT',600,'Kofi Mensah (new beneficiary)','P2P send',at(3,20))];
  S.sort((a,b)=>a.timestamp-b.timestamp);
  for(const input of S){
    const cls=classify(input,state.txs.slice());
    const tx=Object.assign({},input,{id:uuid(),classification:cls,status:'posted'});
    state.txs.push(tx);
    createEntry(tx,cls.category,signedOf(tx),{created_at:tx.timestamp});
  }
  await sealSourceFacts(0);
  const wrong=state.txs.find(t=>t.counterparty==='Urban Stores'&&t.amount===260000);
  if(wrong)await correctEntry(wrong.id,26000,'source feed decimal shift — corrected via compensating entries, source fact preserved');
  computeAggregates();syncSource();
  CUSTOMERS.forEach(c=>refreshFeatures(c.ref));
  await audit('system','ledger.boot','seeded '+state.txs.length+' normalized transactions');
  await runIntegrity();
  await audit('integrity','integrity.daily_check',state.checks.anomalies.length+' anomalies reported');
  renderAll();
}

/* ================= RENDER ================= */
function renderAll(){renderClock();renderJournal();renderPipeline();renderAggregates();renderIntegrity();}
function renderClock(){$('#envClock').textContent=new Date().toLocaleString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
const catChip=c=>'<span class="badge b-'+c.toLowerCase()+'">'+c+'</span>';
const confBar=c=>{const p=Math.round(c*100),col=c>=.75?'var(--accent)':c>=.5?'var(--amber)':'var(--red)';
  return'<span class="conf"><span class="cbar"><i style="width:'+p+'%;background:'+col+'"></i></span><span class="mono" style="font-size:10px;color:var(--dim)">'+p+'%</span></span>';};
function txMatches(t){const f=state.filters;
  if(f.cat!=='all'&&t.classification.category!==f.cat)return false;
  if(f.dir!=='all'&&t.direction!==f.dir)return false;
  if(f.acct!=='all'&&t.account_id!==f.acct)return false;
  if(f.q){const a=ACCOUNTS.find(x=>x.id===t.account_id);
    const hay=[t.id,t.source_event_id,t.counterparty,t.narration,a?a.masked_identifier:'',a?acctLabel(a):'',t.classification.category,t.status].join(' ').toLowerCase();
    if(!hay.includes(f.q))return false;}
  return true;}
function renderJournal(){
  $('#catChips').innerHTML=['all'].concat(CATS).map(c=>'<button class="chip '+(state.filters.cat===c?'on':'')+'" data-cat="'+c+'">'+(c==='all'?'All':c)+'</button>').join('');
  $('#acctSel').innerHTML='<option value="all">All accounts</option>'+ACCOUNTS.map(a=>'<option value="'+a.id+'" '+(state.filters.acct===a.id?'selected':'')+'>'+esc(acctLabel(a))+'</option>').join('');
  const rows=state.txs.slice().sort((a,b)=>b.timestamp-a.timestamp).filter(txMatches);
  $('#jCount').textContent=rows.length+' of '+state.txs.length+' transactions';
  if(!rows.length){$('#jBody').innerHTML='';$('#jEmpty').innerHTML='<div class="empty">No transactions match this view.</div>';return;}
  $('#jEmpty').innerHTML='';
  const broken=state.checks&&state.checks.brokenSrc>=0;
  $('#jBody').innerHTML=rows.map(t=>{
    const a=ACCOUNTS.find(x=>x.id===t.account_id);
    const es=entriesOfTx(t.id);const lastE=es[es.length-1];
    const open=state.open.has(t.id);
    return'<tr class="jrow '+(open?'open':'')+'" data-id="'+t.id+'">'+
      '<td><div>'+dtShort(t.timestamp)+'</div><div style="font-size:10px;color:var(--mute)">'+new Date(t.timestamp).toLocaleDateString('en-GB')+'</div></td>'+
      '<td class="mono" style="font-size:10.5px;color:var(--dim)">'+short(t.id)+'…</td>'+
      '<td class="mono" style="font-size:11px">'+esc(a.masked_identifier)+'</td>'+
      '<td><span class="dir '+t.direction+'">'+t.direction+'</span></td>'+
      '<td class="tnum" style="font-weight:600">'+money(t.amount)+(t.status==='corrected'?'<div style="font-size:10px;color:var(--amber)">eff '+money(effectiveOf(t.id))+'</div>':'')+'</td>'+
      '<td><div style="max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(t.counterparty)+'</div><div style="font-size:10px;color:var(--mute);max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(t.narration)+'</div></td>'+
      '<td>'+catChip(t.classification.category)+'<div style="margin-top:3px">'+confBar(t.classification.confidence)+'</div></td>'+
      '<td class="tnum mono" style="font-size:11px">'+(lastE?money(lastE.balance_after):'—')+'</td>'+
      '<td><span class="badge '+(t.status==='corrected'?'b-warn':'b-ok')+'">'+t.status+'</span></td></tr>'+
      (open?detailRow(t,broken):'');}).join('');
}
function detailRow(t,broken){
  const a=ACCOUNTS.find(x=>x.id===t.account_id);
  const es=entriesOfTx(t.id);
  const steps=[
    ['Normalized transaction','source_event_id <span class="mono">'+t.source_event_id+'</span>'],
    ['Validate currency / amount / account','GHS · '+money(t.amount)+' · '+esc(acctLabel(a))],
    ['Classify',t.classification.category+' @ '+Math.round(t.classification.confidence*100)+'%'],
    ['Resolve ownership relationship',esc(a.customer)],
    ['Create ledger entry',es.map(e=>'<span class="mono">'+short(e.entry_id)+' '+e.entry_type+' '+money(Math.abs(e.amount))+' → bal '+money(e.balance_after)+'</span>').join('<br>')],
    ['Update balance/flow aggregates','aggregates refreshed · transfers neutralized per L-2'],
    ['Emit profile.feature.refresh','features versioned for '+esc(a.customer)]];
  return'<tr class="detail"><td colspan="9"><div class="dwrap"><div>'+
    '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin-bottom:9px">Pipeline trace</div>'+
    '<div class="pipe">'+steps.map((s,i)=>'<div class="step done"><div class="ic">'+(i+1)+'</div><div><div class="tx">'+s[0]+'</div><div class="ds">'+s[1]+'</div></div></div>').join('')+'</div>'+
    '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700;margin:13px 0 2px">Provenance</div>'+
    '<div class="prov">'+t.classification.provenance.map(p=>'<span>'+esc(p)+'</span>').join('')+t.classification.evidence.map(p=>'<span style="color:var(--amber)">'+esc(p)+'</span>').join('')+'</div>'+
    '</div><div style="display:flex;flex-direction:column;gap:8px;font-size:11.5px;color:var(--dim)">'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>tx id (UUID)</span><b class="mono" style="font-size:10px">'+t.id+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>source_event_id</span><b class="mono" style="font-size:10px">'+t.source_event_id+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>source hash</span><b><span class="hashpill '+(broken?'bad':'')+'" data-hash="'+t.source_hash+'">'+t.source_hash.slice(0,14)+'…</span></b></div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>ownership</span><b class="mono" style="font-size:10px">'+esc(a.customer)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>source amount</span><b class="mono">'+money(t.amount)+' <span style="color:var(--mute)">(immutable)</span></b></div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--border2);padding-bottom:6px"><span>effective ledger</span><b class="mono" style="color:var(--accent)">'+money(effectiveOf(t.id))+'</b></div>'+
    (t.correction?'<div style="border:1px solid var(--amber);background:var(--amber-soft);border-radius:9px;padding:7px 9px;font-size:10.5px;color:var(--amber);line-height:1.5">⚠ Corrected: '+esc(t.correction.reason)+' → re-stated '+money(t.correction.correctedAmount)+' via compensating entries</div>':'')+
    (t.status==='posted'?'<button class="btn sm danger" data-correct="'+t.id+'">Correct via compensating entry</button>':'')+
    '<button class="btn sm ghost" data-copytx="'+t.id+'">Copy transaction JSON</button>'+
    '</div></div></td></tr>';
}
function renderPipeline(){
  const steps=[['Normalized transaction','ingested from connection sync / partner feed with immutable source_event_id'],
    ['Validate currency / amount / account','GHS only · positive integer pesewas · account resolves to an active consented connection'],
    ['Classify: INCOME | EXPENSE | TRANSFER | SAVING | DEBT | INVESTMENT | FEE | OTHER','rule-based with confidence + provenance; uncertain ≠ forced'],
    ['Resolve ownership relationship','account → customer via ownership graph; counterparty accounts linked for transfers'],
    ['Create ledger entry','entry_type, amount, currency, balance_after — append-only'],
    ['Update balance/flow aggregates','per-account balances, category flows, transfer neutralization'],
    ['Emit profile.feature.refresh','versioned features recomputed for subject customer/account']];
  $('#pipeStatic').innerHTML=steps.map((s,i)=>'<div class="step done"><div class="ic">'+(i+1)+'</div><div><div class="tx">'+s[0]+'</div><div class="ds">'+s[1]+'</div></div></div>').join('');
  $('#rulesList').innerHTML=[
    '<span><b>L-1</b> Income classification requires evidence over time; a single large inflow is not automatically salary/business income.</span>',
    '<span><b>L-2</b> Transfers between connected accounts owned by the same customer are linked and neutralized in aggregate cash-flow calculations.</span>',
    '<span><b>L-3</b> Debt repayments and disbursements are modelled separately from ordinary expenses.</span>',
    '<span><b>L-4</b> Savings are inferred from destination/account relationships and repeated behaviour, not only transaction narration.</span>',
    '<span><b>L-5</b> Uncertain classifications carry confidence and provenance instead of false precision.</span>'].map(r=>'<li>'+r+'</li>').join('');
  $('#taxChips').innerHTML=CATS.map(c=>'<span class="badge b-'+c.toLowerCase()+'" style="font-size:11px;padding:5px 12px">'+c+'</span>').join('')+
    '<span class="badge b-other" style="font-size:11px;padding:5px 12px">+ system: OPENING · CORRECTION_REVERSAL · CORRECTION</span>';
}
function renderAggregates(){
  $('#cfCards').innerHTML=[
    ['Gross inflow (raw)',agg.grossIn,'includes own-account transfers','var(--accent)'],
    ['Gross outflow (raw)',agg.grossOut,'includes own-account transfers','var(--red)'],
    ['Corrections net',agg.corrNet,'compensating entries only','var(--amber)'],
    ['Net cash-flow (neutralized)',agg.netNeutral,'L-2 transfers excluded','var(--blue)'],
    ['Neutralized transfer legs',agg.neutralAmount,agg.neutralLegs+' legs linked','var(--violet)']]
    .map(k=>'<div class="stat"><div class="k">'+k[0]+'</div><div class="v" style="color:'+k[3]+'">'+compact(k[1])+'</div><div class="s">'+k[2]+'</div></div>').join('');
  const max=Math.max(1,Math.max.apply(null,CATS.map(c=>Math.abs(agg.perCat[c]))));
  $('#catBars').innerHTML=CATS.map(c=>'<div class="baritem"><div class="t"><span>'+catChip(c)+'</span><b class="mono">'+compact(agg.perCat[c])+'</b></div><div class="bar"><i style="width:'+(Math.abs(agg.perCat[c])/max*100).toFixed(1)+'%;background:'+CAT_COLOR[c]+'"></i></div></div>').join('');
  const pairs=state.txs.filter(t=>t.classification.category==='TRANSFER'&&t.direction==='OUT');
  $('#neutralBox').innerHTML='<p style="margin:0 0 10px;font-size:12px;color:var(--dim)">Linked own-account transfer pairs are excluded from cash-flow features. Raw net would be <b class="mono">'+compact(agg.grossIn-agg.grossOut)+'</b>; neutralized net (with corrections) is <b class="mono" style="color:var(--accent)">'+compact(agg.netNeutral)+'</b>.</p>'+
    (pairs.length?pairs.map(p=>{const o=state.txs.find(x=>x.classification.category==='TRANSFER'&&x.direction==='IN'&&x.counterparty_account===p.account_id&&Math.abs(x.timestamp-p.timestamp)<3600e3);
      const a1=ACCOUNTS.find(a=>a.id===p.account_id),a2=o?ACCOUNTS.find(a=>a.id===o.account_id):null;
      return'<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;padding:6px 0;border-bottom:1px dashed var(--border2)"><span class="mono" style="color:var(--mute)">'+esc(a1.masked_identifier)+'</span>⇄<span class="mono" style="color:var(--mute)">'+esc(a2?a2.masked_identifier:'?')+'</span><span class="spacer" style="flex:1"></span><b class="mono">'+money(p.amount)+'</b><span class="badge b-transfer">neutralized</span></div>';}).join(''):'<div class="empty">No linked transfers.</div>');
  $('#featBody').innerHTML=state.features.slice().sort((a,b)=>a.subject.localeCompare(b.subject)||a.feature_name.localeCompare(b.feature_name)).map(f=>
    '<tr><td class="mono" style="font-size:10.5px">'+esc(f.subject)+'</td><td class="mono" style="font-size:11px;color:var(--accent)">'+f.feature_name+'</td><td class="tnum mono">'+f.value+'</td><td>'+f.window+'</td><td class="tnum mono">v'+f.version+'</td><td style="font-size:11px;color:var(--dim)">'+dtShort(f.computed_at)+'</td><td style="font-size:10.5px;color:var(--mute)">'+esc(f.provenance)+'</td></tr>').join('');
}
function renderIntegrity(){
  const c=state.checks;if(!c)return;
  const errs=c.anomalies.filter(a=>a.sev==='err').length;
  $('#intStats').innerHTML=[
    ['Source facts sealed',state.txs.length,'hash-chained, immutable'],
    ['Ledger entries',state.entries.length,'append-only'],
    ['Audit events',state.audits.length,'actor·action·object·hash'],
    ['Anomalies',c.anomalies.length,errs?errs+' error(s)':'warnings only']]
    .map((k,i)=>'<div class="stat"><div class="k">'+k[0]+'</div><div class="v" style="color:'+(i===3&&errs?'var(--red)':i===3&&c.anomalies.length?'var(--amber)':'var(--text)')+'">'+k[1]+'</div><div class="s">'+k[2]+'</div></div>').join('');
  $('#checksList').innerHTML=c.list.map(k=>'<div class="check"><span class="ico '+(k.ok?(k.warn?'warn':'ok'):'bad')+'">'+(k.ok?(k.warn?'!':'✓'):'✕')+'</span><div style="flex:1;min-width:0"><b style="display:block;font-weight:600">'+esc(k.title)+'</b><span style="color:var(--mute);font-size:11.5px">'+esc(k.detail)+'</span></div></div>').join('');
  $('#anomalyList').innerHTML=c.anomalies.length?c.anomalies.map(a=>'<div class="check"><span class="ico '+(a.sev==='err'?'bad':'warn')+'">'+(a.sev==='err'?'✕':'!')+'</span><div style="flex:1;font-size:12px">'+esc(a.msg)+'</div></div>').join(''):'<div class="empty">No anomalies — daily integrity job clean.</div>';
  $('#reconBox').innerHTML=(state.recon||[]).map(r=>'<div style="display:flex;align-items:center;gap:9px;font-size:11.5px;padding:6px 0;border-bottom:1px dashed var(--border2)"><span class="mono" style="width:76px">'+esc(r.acct.masked_identifier)+'</span><span style="flex:1;color:var(--mute)">'+esc(INSTITUTIONS.find(i=>i.id===r.acct.institution).name)+'</span><span class="mono">ledger '+money(r.computed)+'</span><span class="mono" style="color:var(--dim)">src '+money(r.source)+'</span><span class="badge '+(r.diff?'b-err':'b-ok')+'">'+(r.diff?'Δ '+money(r.diff):'match')+'</span></div>').join('');
  $('#auditChain').innerHTML='<div class="block" style="border-style:dashed"><div class="ix">genesis</div><div class="rf">ledger v1</div><div class="hh">'+'0'.repeat(24)+'…</div></div>'+
    state.audits.map((a,i)=>'<div class="block"><div class="ix">#'+(i+1)+' · '+esc(a.actor)+'</div><div class="rf">'+esc(a.action)+'</div><div class="hh">obj '+esc(String(a.object).slice(0,26))+'<br><span style="color:var(--accent)">hash '+a.hash.slice(0,16)+'…</span></div></div>').join('');
  $('#logList').innerHTML=state.log.length?state.log.map(l=>'<div class="li"><time>'+new Date(l.ts).toLocaleTimeString('en-GB')+'</time><span class="kd '+l.kind+'">'+l.kind.toUpperCase()+'</span><span style="flex:1">'+esc(l.msg)+'</span></div>').join(''):'<div class="empty">No events.</div>';
}

/* ================= INGEST MODAL ================= */
const STEP_LABELS=['Validate currency / amount / account','Classify (rules L-1…L-5)','Resolve ownership relationship','Create ledger entry','Update balance/flow aggregates','Emit profile.feature.refresh'];
let stepState=[];
function renderSteps(){$('#stepsHost').innerHTML=STEP_LABELS.map((s,i)=>{const st=stepState[i];
  return'<div class="step '+(st?(st.ok?'done':'fail'):'')+'"><div class="ic">'+(st?(st.ok?'✓':'✕'):(i+1))+'</div><div><div class="tx">'+s+'</div><div class="ds mono">'+(st?esc(st.ds):'pending')+'</div></div></div>';}).join('');}
function openIngest(){
  stepState=[];renderSteps();$('#iErrs').innerHTML='';
  $('#iSource').value=uuid();$('#iTs').value=toLocalInput(Date.now());
  $('#iAccount').innerHTML=ACCOUNTS.map(a=>'<option value="'+a.id+'">'+esc(acctLabel(a))+' · '+esc(a.customer)+'</option>').join('');
  $('#iCounterAcct').innerHTML='<option value="">— none / external —</option>'+ACCOUNTS.map(a=>'<option value="'+a.id+'">'+esc(acctLabel(a))+'</option>').join('');
  $('#iAmount').value='';$('#iCounter').value='';$('#iNarr').value='';$('#iDir').value='IN';
  $('#backdrop').classList.add('on');
}
function readForm(){return{source_event_id:$('#iSource').value.trim()||uuid(),account_id:$('#iAccount').value,direction:$('#iDir').value,
  amount:Math.round((parseFloat($('#iAmount').value.replace(/[^0-9.\-]/g,''))||0)*100),currency:'GHS',
  timestamp:new Date($('#iTs').value).getTime()||Date.now(),counterparty:$('#iCounter').value.trim()||'Unclassified counterparty',
  narration:$('#iNarr').value.trim()||'—',counterparty_account:$('#iCounterAcct').value||null};}
async function submitIngest(){
  stepState=[];renderSteps();$('#iErrs').innerHTML='';
  const res=await ingest(readForm(),(i,ok,ds)=>{stepState[i]={ok,ds};renderSteps();});
  if(!res.ok){$('#iErrs').innerHTML='<div class="err">✕ Pipeline rejected: '+esc(res.reason)+'</div>';toast('Ingestion rejected — '+res.reason,'err');await runIntegrity();renderIntegrity();return;}
  await runIntegrity();renderAll();
  setTimeout(()=>{$('#backdrop').classList.remove('on');switchTab('journal');state.open.add(res.tx.id);renderJournal();toast('Transaction ingested → '+res.tx.classification.category+' ('+Math.round(res.tx.classification.confidence*100)+'%)','ok');},700);
}

/* ================= EXPORTS ================= */
function exportJson(){download('tamva-ledger.json',JSON.stringify({schema:'tamva.ledger/v1',branch:'feature/ledger-graph',exportedAt:new Date().toISOString(),currency:'GHS',minorUnits:true,
  customers:CUSTOMERS,institutions:INSTITUTIONS,accounts:ACCOUNTS,transactions:state.txs,ledger_entries:state.entries,features:state.features,audit_events:state.audits,integrity:state.checks},null,2));
  audit('analyst','export.json','tamva-ledger.json');toast('tamva-ledger.json exported','ok');}
function exportCsv(){
  const head=['entry_seq','entry_id','entry_type','category','tx_id','source_event_id','timestamp','account_masked','customer','direction_source','source_amount_minor','entry_amount_minor','currency','balance_after','compensates','note'];
  const lines=[head.join(',')];
  for(const e of state.entries.slice().sort((a,b)=>a.seq-b.seq)){
    const t=e.tx_id?state.txs.find(x=>x.id===e.tx_id):null;const a=ACCOUNTS.find(x=>x.id===e.account_id);
    lines.push([e.seq,e.entry_id,e.entry_type,e.cat||'',e.tx_id||'',t?t.source_event_id:'',t?new Date(t.timestamp).toISOString():'',a?a.masked_identifier:'',a?a.customer:'',t?t.direction:'',t?t.amount:'',e.amount,e.currency,e.balance_after,e.compensates||'',('"'+(e.note||'').replace(/"/g,'""')+'"')].join(','));}
  download('tamva-journal.csv',lines.join('\n'),'text/csv');toast('tamva-journal.csv exported ('+(lines.length-1)+' entry rows)','ok');}

/* ================= EVENTS ================= */
function switchTab(t){$$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));$$('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+t));}
function wire(){
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)switchTab(b.dataset.tab);});
  $('#btnIngest').addEventListener('click',openIngest);$('#btnIngest2').addEventListener('click',openIngest);
  $('#iClose').addEventListener('click',()=>$('#backdrop').classList.remove('on'));
  $('#iCancel').addEventListener('click',()=>$('#backdrop').classList.remove('on'));
  $('#iSubmit').addEventListener('click',submitIngest);
  $('#iReplay').addEventListener('click',()=>{if(state.txs.length){$('#iSource').value=state.txs[0].source_event_id;toast('source_event_id set to an existing one — pipeline will reject the replay','warn');}});
  $('#iFillSalary').addEventListener('click',()=>{$('#iDir').value='IN';$('#iAmount').value='4300.00';$('#iCounter').value='Ministry of Education Payroll';$('#iNarr').value='Monthly salary credit';$('#iCounterAcct').value='';});
  $('#iFillSave').addEventListener('click',()=>{$('#iDir').value='OUT';$('#iAccount').value=ACC.A1.id;$('#iAmount').value='600.00';$('#iCounter').value='Savings & Loans **** 3300';$('#iNarr').value='Auto-save transfer';$('#iCounterAcct').value=ACC.A3.id;});
  $('#iFillBig').addEventListener('click',()=>{$('#iDir').value='IN';$('#iAmount').value='48000.00';$('#iCounter').value='Unknown P2P — wallet origin';$('#iNarr').value='Wallet credit';$('#iCounterAcct').value='';});
  $('#jq').addEventListener('input',e=>{state.filters.q=e.target.value.trim().toLowerCase();renderJournal();});
  $('#catChips').addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;state.filters.cat=c.dataset.cat;renderJournal();});
  $('#dirSel').addEventListener('change',e=>{state.filters.dir=e.target.value;renderJournal();});
  $('#acctSel').addEventListener('change',e=>{state.filters.acct=e.target.value;renderJournal();});
  $('#btnJson').addEventListener('click',exportJson);
  $('#btnCsv').addEventListener('click',exportCsv);
  $('#jBody').addEventListener('click',async e=>{
    const hp=e.target.closest('.hashpill');if(hp){copy(hp.dataset.hash,'Source hash');return;}
    const cb=e.target.closest('[data-copytx]');if(cb){const t=state.txs.find(x=>x.id===cb.dataset.copytx);copy(JSON.stringify(t,null,2),'Transaction JSON');return;}
    const cr=e.target.closest('[data-correct]');if(cr){openCorrect(state.txs.find(x=>x.id===cr.dataset.correct));return;}
    const row=e.target.closest('tr.jrow');if(row){const id=row.dataset.id;if(state.open.has(id))state.open.delete(id);else state.open.add(id);renderJournal();}});
  let corrTarget=null;
  function openCorrect(t){if(!t)return;corrTarget=t;
    $('#cInfo').innerHTML='tx <span class="mono">'+short(t.id)+'</span> · '+esc(t.counterparty)+' · immutable source amount '+money(t.amount)+' ('+t.classification.category+')';
    $('#cAmount').value=(t.amount/100).toFixed(2);$('#cReason').value='';$('#cBackdrop').classList.add('on');}
  $('#cClose').addEventListener('click',()=>$('#cBackdrop').classList.remove('on'));
  $('#cCancel').addEventListener('click',()=>$('#cBackdrop').classList.remove('on'));
  $('#cSubmit').addEventListener('click',async()=>{
    if(!corrTarget)return;
    const v=Math.round((parseFloat($('#cAmount').value)||0)*100);const reason=$('#cReason').value.trim()||'unspecified correction';
    if(v<=0){toast('Corrected amount must be positive','err');return;}
    $('#cBackdrop').classList.remove('on');
    await correctEntry(corrTarget.id,v,reason);
    await runIntegrity();renderAll();state.open.add(corrTarget.id);renderJournal();
    toast('Correction posted via compensating entries — source facts untouched','ok');});
  $('#btnDaily').addEventListener('click',async()=>{await runIntegrity();await audit('integrity','integrity.daily_check',state.checks.anomalies.length+' anomalies reported');renderIntegrity();toast(state.checks.ok?'Daily integrity job complete':'Daily integrity job found issues',state.checks.ok?'ok':'warn');});
  $('#btnTamper').addEventListener('click',async()=>{
    if(state.tampered){toast('Already tampered — restore first','err');return;}
    const t=state.txs[Math.floor(state.txs.length/2)];
    state.tampered={id:t.id,orig:t.amount};t.amount+=13700;
    await audit('attacker','integrity.warn.silent_mutation','tx='+short(t.id)+' amount +137.00 GHS out-of-band');
    await runIntegrity();renderAll();switchTab('integrity');
    toast('Silent mutation injected — detection should fire','err',4200);});
  $('#btnRestore').addEventListener('click',async()=>{
    if(!state.tampered){toast('Nothing to restore','info');return;}
    const t=state.txs.find(x=>x.id===state.tampered.id);t.amount=state.tampered.orig;state.tampered=null;
    await audit('ledger','integrity.restore','tx='+short(t.id)+' source fact restored from replica (no re-hash needed)');
    await runIntegrity();renderAll();toast('Source fact restored — original hashes validate again','ok');});
  $('#btnClearLog').addEventListener('click',()=>{state.log=[];renderIntegrity();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){$('#backdrop').classList.remove('on');$('#cBackdrop').classList.remove('on');return;}
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?document.activeElement.tagName:'');
    if(e.key==='/'&&!typing){e.preventDefault();switchTab('journal');$('#jq').focus();}});
  setInterval(renderClock,1000);
}
wire();boot();
})();
</script>
</body>
</html>


