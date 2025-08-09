(function(){
  const CSS = `
  .adfk-bubble{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:50%;box-shadow:0 8px 24px rgba(0,0,0,.18);background:#1e88e5;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99999}
  .adfk-panel{position:fixed;right:18px;bottom:86px;width:360px;max-width:92vw;height:560px;max-height:72vh;background:#fff;border-radius:16px;box-shadow:0 12px 28px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,Roboto}
  .adfk-header{padding:12px 14px;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center}
  .adfk-title{font-weight:600}
  .adfk-body{padding:12px;flex:1;overflow:auto}
  .adfk-msg{margin:8px 0;padding:10px 12px;border-radius:12px;line-height:1.35}
  .adfk-user{background:#e3f2fd;margin-left:20%}
  .adfk-bot{background:#f5f5f5;margin-right:20%}
  .adfk-foot{display:flex;gap:8px;padding:12px;border-top:1px solid #eee}
  .adfk-input{flex:1;padding:10px;border:1px solid #ddd;border-radius:10px}
  .adfk-send{padding:10px 14px;border:0;border-radius:10px;background:#1e88e5;color:#fff}
  .adfk-note{font-size:12px;color:#666;padding:0 12px 10px}
  .adfk-handoff{display:flex;gap:6px;align-items:center;padding:8px 12px}
  .adfk-email{flex:1;padding:8px;border:1px solid #ddd;border-radius:8px}
  .adfk-emailbtn{padding:8px 10px;border:0;border-radius:8px;background:#1e88e5;color:#fff}
  `;

  const style=document.createElement('style'); style.innerHTML=CSS; document.head.appendChild(style);

  const bubble=document.createElement('button'); bubble.className='adfk-bubble'; bubble.setAttribute('aria-label','Open chat'); bubble.innerHTML='💬';
  const panel=document.createElement('div'); panel.className='adfk-panel'; panel.innerHTML=`
    <div class="adfk-header"><div class="adfk-title">AT Devices for Kids</div><div style="margin-left:auto;display:flex;gap:6px">
      <button id="adfk-lang" aria-label="Switch language" title="Switch language">EN</button>
      <button id="adfk-close" aria-label="Close">✕</button>
    </div></div>
    <div class="adfk-body" id="adfk-body"></div>
    <div class="adfk-note">Please avoid sharing medical details. We cannot provide medical/legal advice or fundraising promises. We can email the team if we can’t answer.</div>
    <div class="adfk-handoff"><input id="adfk-email" class="adfk-email" placeholder="Email (optional for follow-up)"/><button id="adfk-emailbtn" class="adfk-emailbtn">OK</button></div>
    <div class="adfk-foot"><input id="adfk-input" class="adfk-input" placeholder="Ask about eligibility, how to apply, donations…"/><button class="adfk-send" id="adfk-send">Send</button></div>
  `;

  document.body.appendChild(bubble); document.body.appendChild(panel);
  const body=panel.querySelector('#adfk-body'); const input=panel.querySelector('#adfk-input');
  let lang='en'; let userEmail='';

  function add(role, text){
    const div=document.createElement('div'); div.className='adfk-msg '+(role==='user'?'adfk-user':'adfk-bot');
    div.textContent=text; body.appendChild(div); body.scrollTop=body.scrollHeight
  }

  async function send(){
    const q=input.value.trim(); if(!q) return; add('user', q); input.value='';
    add('bot', lang==='es' ? 'Pensando…' : 'Thinking…');
    const resp=await fetch('/api/chat',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages:[{role:'user', content:q}], lang, emailOptIn:{ email: userEmail } })
    }).then(r=>r.json()).catch(e=>({error:e.message}))
    body.lastChild.textContent = resp.error ? ( (lang==='es'?'Error: ':'Error: ')+resp.error) : resp.answer
  }

  bubble.onclick=()=>{ panel.style.display = panel.style.display==='flex' ? 'none' : 'flex' ; if(panel.style.display==='flex' && body.childElementCount===0){ add('bot', lang==='es' ? '¿Interesado en C.A.T.S.? ¡Dime en qué puedo ayudarte!' : 'Interested in C.A.T.S., let me know how I can help!') } }
  panel.querySelector('#adfk-close').onclick=()=>{ panel.style.display='none' }
  panel.querySelector('#adfk-lang').onclick=()=>{ lang = lang==='en' ? 'es' : 'en'; panel.querySelector('#adfk-lang').textContent = lang.toUpperCase() }
  panel.querySelector('#adfk-send').onclick=send; input.addEventListener('keydown',e=>{ if(e.key==='Enter') send() })
  document.getElementById('adfk-emailbtn').onclick=()=>{ userEmail = document.getElementById('adfk-email').value.trim(); if(userEmail){ add('bot', (lang==='es'?'Gracias, te contactaremos si es necesario.':'Thanks, we\'ll reach out if needed.')) } }
})();