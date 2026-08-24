#!/usr/bin/env node
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validateConfig, runConfig } = require('../runner/otto-runner.cjs');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGINS = new Set(['https://otto-qa-runner.vercel.app', 'http://localhost', 'http://127.0.0.1']);
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const runs = new Map();

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function send(res, status, body, origin) {
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'};
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}
function readBody(req) { return new Promise((resolve, reject) => { let data=''; req.on('data', chunk => { data += chunk; if (data.length > 1000000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(new Error('Invalid JSON body')); } }); req.on('error', reject); }); }
function safeConfig(input) { const config = JSON.parse(JSON.stringify(input)); delete config.password; delete config.api_key; delete config.token; delete config.credentials; return config; }

function persistRun(id, state) {
  const filepath = path.join(REPORTS_DIR, `${id}.json`);
  try {
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to persist run ${id}:`, err.message);
  }
}

function startRun(config) {
  const id = crypto.randomUUID();
  const state = {run_id:id, status:'running', started_at:new Date().toISOString(), progress:[], report:null, log:[], error:null};
  runs.set(id, state);
  persistRun(id, state);
  
  runConfig(config, {
    outputDir: path.join(process.cwd(), 'screenshots'), 
    onProgress: event => {
      state.progress.push({at:new Date().toISOString(), ...event});
      state.log.push(`[${new Date().toISOString()}] Profile ${event.profile_id}: ${event.status}`);
      persistRun(id, state);
    }
  })
    .then(report => { 
      state.status='completed'; 
      state.report=report; 
      state.completed_at=new Date().toISOString();
      state.log.push(`[${new Date().toISOString()}] Run completed`);
      persistRun(id, state);
    })
    .catch(error => { 
      state.status='failed'; 
      state.error=String(error.message || error); 
      state.completed_at=new Date().toISOString();
      state.log.push(`[${new Date().toISOString()}] Run failed: ${state.error}`);
      persistRun(id, state);
    });
  return id;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Vary':'Origin'}); return res.end(); }
  if (req.url === '/health' && req.method === 'GET') return send(res, 200, {ok:true, service:'otto-qa-companion', host:HOST, port:PORT}, origin);
  if (req.url === '/run' && req.method === 'POST') { try { const config=safeConfig(await readBody(req)); const errors=validateConfig(config); if(errors.length) return send(res,422,{ok:false,error:errors.join('; ')},origin); return send(res,202,{ok:true,run_id:startRun(config)},origin); } catch(e) { return send(res,400,{ok:false,error:e.message},origin); } }
  
  const matchRun = req.url.match(/^\/runs\/([a-f0-9-]+)$/);
  if (matchRun && req.method === 'GET') { 
    const id = matchRun[1];
    let state = runs.get(id);
    if (!state) {
      // Try to load from disk
      const filepath = path.join(REPORTS_DIR, `${id}.json`);
      if (fs.existsSync(filepath)) {
        try {
          state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          runs.set(id, state);
        } catch (err) {
          return send(res, 500, {ok:false, error:'Failed to load run state'}, origin);
        }
      }
    }
    return state ? send(res,200,state,origin) : send(res,404,{ok:false,error:'Run not found'},origin); 
  }
  
  const matchLog = req.url.match(/^\/runs\/([a-f0-9-]+)\/log$/);
  if (matchLog && req.method === 'GET') {
    const id = matchLog[1];
    let state = runs.get(id);
    if (!state) {
      const filepath = path.join(REPORTS_DIR, `${id}.json`);
      if (fs.existsSync(filepath)) {
        try {
          state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (err) {
          return send(res, 500, {ok:false, error:'Failed to load run log'}, origin);
        }
      }
    }
    return state ? send(res,200,{run_id:id, log:state.log || []},origin) : send(res,404,{ok:false,error:'Run not found'},origin);
  }
  
  return send(res,404,{ok:false,error:'Not found'},origin);
});
server.listen(PORT, HOST, () => console.log(`Otto QA companion listening on http://${HOST}:${PORT}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
module.exports = { server, validateConfig };
