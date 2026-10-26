import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
 const target=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.stat(target,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');fs.createReadStream(target).pipe(res);});
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is already in use. Open http://127.0.0.1:${port}`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}`;console.log(`Banyan AI Marble Run\nOpen ${url}\nKeep this window open. Press Ctrl+C to stop.\nAll assets and participant processing stay local.`);
 if(process.argv.includes('--open')&&process.platform==='win32')spawn('explorer.exe',[url],{windowsHide:true,detached:true,stdio:'ignore'}).unref();
});
