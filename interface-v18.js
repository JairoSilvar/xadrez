/* Xadrez 18 — interface responsiva. Motor, partidas e rede permanecem no núcleo. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text; return n; };
  const button = (text, action, cls='action-btn') => { const b=el('button',cls,text); b.type='button'; b.addEventListener('click',action); return b; };
  document.body.classList.add('xp-v18');

  // Entrada: jogar primeiro; preferências e perfil continuam disponíveis.
  const hero=document.querySelector('.hero-box');
  hero.querySelector('p').textContent='Seu próximo lance começa aqui.';
  hero.append(el('span','v18-version','v19.0.0 · Diamante'));
  document.querySelector('.menu-section-label').textContent='Vamos jogar?';
  const names=[['.mode-ia','♟ Jogar contra a IA','Escolha seu nível e comece'],['.mode-pvp','♟♟ Duas pessoas','Joguem no mesmo aparelho'],['.mode-online','◎ Jogar online','Encontre ou crie uma sala'],['.mode-bots','▷ Assistir aos bots','Observe e aprenda'],['.mode-tutorial','◇ Aprender xadrez','Regras, treino e análise']];
  names.forEach(([sel,title,sub])=>{document.querySelector(sel+' .mode-title').textContent=title;document.querySelector(sel+' .mode-sub').textContent=sub;});
  $('detailsTime').open=false;
  const right=document.querySelector('.menu-col-right'),left=document.querySelector('.menu-col-left');
  left.prepend(el('div','v18-eyebrow','SEU ESPAÇO'));
  const welcome=el('div','v18-welcome');
  welcome.append(el('span','v18-welcome-piece','♞'),el('h2','','Uma partida. Muitas possibilidades.'),el('p','','Pratique no seu ritmo, desafie alguém ou descubra um novo lance.'));
  right.insertBefore(welcome,right.firstChild);
  const aiSummary=$('detailsIa').querySelector('summary'); aiSummary.textContent='♟ Contra a IA · escolha cor e nível';
  const hint=el('p','v18-hint','Escolha sua cor e toque em um nível para iniciar a partida.');
  $('detailsIa').querySelector('.details-body').prepend(hint);
  // Keep time selection next to the chosen mode, without removing its controls.
  const detailsTime=$('detailsTime');
  const originalFocus=window.menuFocusSection;
  window.menuFocusSection=function(which){
    ['detailsIa','detailsOnline'].forEach(id=>{ $(id).open=id===(which==='ia'?'detailsIa':which==='online'?'detailsOnline':''); });
    originalFocus(which);
  };
  const settingsEntry=button('⚙ Aparência e som',()=>openSettingsModal(),'action-btn v18-home-settings');
  left.append(settingsEntry);
  const menuRadio=document.querySelector('.menu-radio-section');
  menuRadio.classList.add('v18-menu-radio');
  const browseRadio=button('♫ Escolher rádio',()=>toggleRadioSidebar(),'action-btn v18-browse-radio');
  menuRadio.prepend(browseRadio);
  $('radioSelectCompact').classList.add('v18-source-select');

  // Lateral: mantém os botões originais e seus handlers, acrescentando identificação.
  const labels={'Novo Jogo':'Novo jogo','Rádio':'Rádio','Desfazer Lance':'Desfazer','Sair do Jogo/Menu':'Início','Ocultar Menu':'Ocultar','Configurações / Menu Suspenso':'Opções'};
  document.querySelectorAll('.header-actions .icon-btn').forEach(b=>{
    const title=b.title, label=labels[title]||title;
    const icon=el('span','v18-tool-icon',b.textContent); b.replaceChildren(icon,el('span','v18-tool-label',label));
    b.setAttribute('aria-label',title);
  });
  $('radioSidebarBtn').setAttribute('aria-label','Abrir rádio');

  // Contexto da sala: somente cidade + tema; o identificador técnico fica no link.
  const roomTitle=$('room-status-title');
  const roomContext=el('div','v18-room-context');
  const roomState=el('span','v18-room-state','●');
  const roomName=el('span','v18-room-name','Xadrez');
  const roomMeta=el('span','v18-room-meta');
  const shareRoom=button('',()=>shareCurrentRoom(),'v18-room-share');
  shareRoom.append(el('span','v18-share-icon','↗'),el('span','v18-share-label','Compartilhar'));
  shareRoom.setAttribute('aria-label','Compartilhar sala');
  shareRoom.title='Compartilhar sala';
  roomTitle.replaceWith(roomContext);
  roomTitle.classList.add('v18-room-source');
  roomContext.append(roomState,roomName,roomMeta,roomTitle,shareRoom);
  roomTitle.hidden=true;
  function collectRoomMeta(){
    ['spectatorCountBadge','spectator-badge'].forEach(id=>{
      const item=$(id);if(item&&item.parentNode!==roomMeta)roomMeta.append(item);
    });
  }
  function syncRoomContext(){
    const online=typeof gameMode!=='undefined'&&gameMode==='network'&&typeof currentCityKey!=='undefined'&&!!currentCityKey;
    document.body.classList.toggle('v18-room-online',online);
    roomName.textContent=online?(roomTitle.textContent||'Sala'):'Xadrez';
    roomState.classList.toggle('offline',!online);
    collectRoomMeta();
  }
  new MutationObserver(syncRoomContext).observe(roomTitle,{childList:true,subtree:true,characterData:true});
  new MutationObserver(collectRoomMeta).observe($('brandTitleBox'),{childList:true,subtree:true});
  setInterval(syncRoomContext,1000);
  syncRoomContext();
  function roomInviteUrl(){
    const url=new URL(location.href);url.hash='';url.search='';
    const key=String(typeof currentCityKey!=='undefined'&&currentCityKey||'').replace(/^priv-/i,'');
    if(key)url.searchParams.set('sala',key);
    url.searchParams.set('convite','1');
    return url.toString();
  }
  function roomToast(message){
    let toast=$('v18RoomToast');if(!toast){toast=el('div','v18-room-toast');toast.id='v18RoomToast';document.body.append(toast);}
    toast.textContent=message;toast.classList.add('show');clearTimeout(roomToast.timer);roomToast.timer=setTimeout(()=>toast.classList.remove('show'),2600);
  }
  async function shareCurrentRoom(){
    if(!(typeof gameMode!=='undefined'&&gameMode==='network'&&currentCityKey)){roomToast('Entre em uma sala para compartilhar.');return;}
    const name=roomTitle.textContent||'Sala';const url=roomInviteUrl();
    const payload={title:'Xadrez · '+name,text:'Venha jogar comigo no Xadrez! Sala: '+name,url};
    try{
      if(navigator.share){await navigator.share(payload);return;}
      await navigator.clipboard.writeText(payload.text+'\n'+url);roomToast('Link da sala copiado!');
    }catch(error){
      if(error&&error.name==='AbortError')return;
      try{await navigator.clipboard.writeText(payload.text+'\n'+url);roomToast('Link da sala copiado!');}
      catch(copyError){prompt('Copie o convite da sala:',payload.text+'\n'+url);}
    }
  }
  const actions=document.querySelector('.game-actions-row');
  const actionTitle=el('div','v18-dropdown-heading','PARTIDA');
  $('headerDropdown').append(actionTitle);
  actions.querySelectorAll('button').forEach(b=>{
    b.classList.add('dropdown-item'); b.textContent=b.classList.contains('resign')?'🏳 Desistir da partida':'🤝 Propor empate';
    b.addEventListener('click',()=>closeActionDropdownSafe()); $('headerDropdown').append(b);
  });
  actions.remove();
  const optionsClose=button('✕',()=>closeActionDropdownSafe(),'v18-popover-close');
  optionsClose.setAttribute('aria-label','Fechar opções');
  $('headerDropdown').prepend(optionsClose);
  const reactionsClose=button('✕',()=>closeFloatPanels(),'v18-popover-close');
  reactionsClose.setAttribute('aria-label','Fechar reações');
  $('reactionsFloatPanel').prepend(reactionsClose);
  const tauntsClose=button('✕',()=>closeFloatPanels(),'v18-popover-close');
  tauntsClose.setAttribute('aria-label','Fechar frases rápidas');
  $('tauntsFloatPanel').prepend(tauntsClose);
  $('btnToggleReactions').textContent='😊 Reagir';
  $('btnToggleReactions').setAttribute('aria-label','Enviar uma reação');
  $('btnToggleTaunts').textContent='💬';
  $('btnToggleTaunts').setAttribute('aria-label','Abrir frases rápidas e stand-up');
  $('btnToggleTaunts').title='Frases rápidas e stand-up';
  document.querySelectorAll('.reaction-btn').forEach(b=>{if(b.title)b.setAttribute('aria-label',b.title);});

  // Chat compacto com expansão sob demanda, sem empurrar os cards.
  const chatBox=$('chat-box');
  const expandChat=button('Expandir ↗',()=>{
    const expanded=chatBox.classList.toggle('v18-chat-expanded');
    document.body.classList.toggle('v18-chat-open',expanded);
    expandChat.textContent=expanded?'Fechar ✕':'Expandir ↗';
  },'v18-chat-expand');
  chatBox.prepend(expandChat);

  // Firefox/Chrome móveis: mede a área realmente visível e mantém o jogo no topo.
  function syncVisibleViewport(){
    const height=Math.round(window.visualViewport?window.visualViewport.height:window.innerHeight);
    document.documentElement.style.setProperty('--xp-visible-height',height+'px');
    const gameVisible=getComputedStyle($('game-wrapper')).display!=='none';
    document.body.classList.toggle('v18-game-active',gameVisible);
    if(gameVisible&&!document.body.classList.contains('v18-chat-open'))window.scrollTo(0,0);
  }
  addEventListener('resize',syncVisibleViewport,{passive:true});
  if(window.visualViewport){visualViewport.addEventListener('resize',syncVisibleViewport,{passive:true});visualViewport.addEventListener('scroll',syncVisibleViewport,{passive:true});}
  new MutationObserver(syncVisibleViewport).observe($('game-wrapper'),{attributes:true,attributeFilter:['style','class']});
  syncVisibleViewport();

  // Convites abrem a cidade correta; se faltar nome, aguardam o preenchimento.
  const invitedRoom=new URLSearchParams(location.search).get('sala');
  let inviteConsumed=false;
  async function enterInvitedRoom(){
    if(!invitedRoom||inviteConsumed)return;
    if(!(typeof playerName!=='undefined'&&String(playerName||'').trim())){
      const input=$('playerNameInput');
      if(input){input.placeholder='Digite seu nome para entrar na sala';input.focus();}
      if($('detailsOnline'))$('detailsOnline').open=true;
      return;
    }
    inviteConsumed=true;
    const city=String(invitedRoom).toLowerCase();
    if(typeof cityDetails!=='undefined'&&cityDetails[city]){joinCityRoom(city);return;}
    const data=await xpRegistryRequest('GET');
    const room=data&&data.ok&&Array.isArray(data.rooms)?data.rooms.find(r=>String(r.slug||'').toLowerCase()===city):null;
    if(room)xpJoinDiscoveredRoom(room.slug,room.peerId,room.state==='playing');
    else {inviteConsumed=false;roomToast('A sala não está mais disponível.');}
  }
  if(invitedRoom){
    setTimeout(enterInvitedRoom,500);
    $('playerNameInput').addEventListener('change',()=>setTimeout(enterInvitedRoom,100));
  }

  // Configurações: um único scroll e a mesma prévia nas quatro abas visuais.
  const settings=document.querySelector('.settings-content');
  settings.classList.add('v18-dialog');
  settings.firstElementChild.classList.add('v18-dialog-header');
  settings.firstElementChild.querySelector('span').id='v18-settings-title';
  const footer=el('div','v18-dialog-footer');
  const apply=settings.lastElementChild;
  apply.textContent='✓ Aplicar e voltar'; footer.append(apply);
  const workspace=el('div','v18-settings-workspace'),choices=el('div','v18-settings-choices');
  settings.querySelectorAll('.tab-content').forEach(tab=>choices.append(tab));
  const preview=choices.querySelector('#settingsPreview'); workspace.append(preview,choices);
  settings.append(workspace,footer);
  preview.lastElementChild.innerHTML='<b>Seu tabuleiro</b><br><span>Prévia ao vivo das suas escolhas.</span><small>As alterações são salvas ao selecionar.</small>';
  $('settingsPreviewBoard').setAttribute('aria-label','Prévia das casas e das peças');
  window.refreshSettingsPreview=function(){
    const board=$('settingsPreviewBoard');if(!board)return;
    const colors=getComputedStyle(document.body);
    board.style.borderColor=colors.getPropertyValue('--board-border'); board.replaceChildren();
    const sample=['r','n','b','k',null,null,null,null,null,null,null,null,'K','B','N','R'];
    sample.forEach((p,i)=>{
      const cell=el('div','v18-preview-square');
      cell.style.background=colors.getPropertyValue((Math.floor(i/4)+i%4)%2?'--dark-square':'--light-square');
      if(p){const piece=el('div','piece '+(p===p.toUpperCase()?'white-piece':'black-piece'));piece.style.backgroundImage=`url('${pieceSvgs[p]}')`;cell.append(piece);}
      board.append(cell);
    });
    settings.querySelectorAll('button[onclick]').forEach(b=>{
      const match=b.getAttribute('onclick').match(/^(applyThemePreset|setBoardSkin|setPieceColors|setPieceStyle)\('([^']*)'\)/);
      if(!match)return;
      const cls=match[1]==='applyThemePreset'?'theme-'+match[2]:match[2];
      const chosen=cls?document.body.classList.contains(cls):!Array.from(document.body.classList).some(c=>c.startsWith('board-'));
      b.setAttribute('aria-pressed',String(chosen));
    });
  };
  const oldTab=window.switchSettingsTab;
  window.switchSettingsTab=function(event,id){oldTab(event,id);syncSettingsTab(id);};
  function syncSettingsTab(id){
    const visual=['tab-themes','tab-board','tab-piece-colors','tab-piece-styles'].includes(id);
    preview.hidden=!visual; workspace.classList.toggle('v18-with-preview',visual);
    document.querySelectorAll('.settings-tabs .tab-btn').forEach(b=>b.setAttribute('aria-selected',String(b.classList.contains('active'))));
    choices.scrollTop=0; refreshSettingsPreview();
  }
  settings.addEventListener('click',()=>queueMicrotask(()=>refreshSettingsPreview()));
  settings.addEventListener('change',()=>refreshSettingsPreview());
  syncSettingsTab('tab-themes');

  // Rádio: lista visível, seleção explícita e player fixo. Nenhum stream é alterado.
  const radio=$('radio-modal').firstElementChild;
  radio.classList.add('v18-dialog','v18-radio-dialog');
  const radioHeader=radio.firstElementChild;radioHeader.classList.add('v18-dialog-header');
  radioHeader.querySelector('span').textContent='♫ Sua trilha para jogar';radioHeader.querySelector('span').id='v18-radio-title';
  const oldRadioBody=radio.children[1];
  const source=$('radioSelectCompactPopup');source.classList.add('v18-source-select');
  const radioSearch=el('input','v18-radio-search');radioSearch.type='search';radioSearch.placeholder='Buscar rádio ou estilo';radioSearch.setAttribute('aria-label','Buscar rádio ou estilo');
  const list=el('div','v18-station-list');list.setAttribute('aria-label','Estações de rádio');
  const radioFooter=el('div','v18-radio-footer');
  const selected=el('strong','v18-selected-station','Escolha uma estação');
  const volume=el('label','v18-volume','Volume');volume.append($('radioVolumeSliderPopup'));
  const play=oldRadioBody.querySelector('button');play.id='v18-radio-play';
  radioFooter.append(selected,$('radioStatusPopup'),volume,play);
  radio.append(source,radioSearch,list,radioFooter);oldRadioBody.remove();
  let picked='';
  const stationButtons=[];
  Array.from($('radioSelectSettings').options).filter(o=>o.value).forEach(option=>{
    const b=button('',()=>{
      picked=option.value;
      // A selection is a draft until Play, so the existing playback remains coherent.
      refreshRadioUI();
    },'v18-station');
    b.dataset.station=option.value;
    b.append(el('span','v18-station-icon','♫'),el('span','v18-station-name',option.textContent.replace(/^\S+\s/,'')),el('span','v18-station-check','○'));
    list.append(b);stationButtons.push(b);
  });
  radioSearch.addEventListener('input',()=>{ const query=radioSearch.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();stationButtons.forEach(b=>{b.hidden=!b.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query);});empty.hidden=stationButtons.some(b=>!b.hidden); });
  const empty=el('p','v18-radio-empty','Nenhuma estação encontrada. Tente outro nome.');empty.hidden=true;list.append(empty);
  play.removeAttribute('onclick');
  play.addEventListener('click',()=>{
    if(radioPlaying&&picked===currentRadioChannelId){toggleRadioMenuPlayPopup();}
    else if(picked){syncRadioSelects(picked);playRadioChannel(picked);}
    refreshRadioUI();
  });
  function refreshRadioUI(){
    if(!picked)picked=source.value||currentRadioChannelId||'';
    const active=stationButtons.find(b=>b.dataset.station===picked);
    selected.textContent=active?active.querySelector('.v18-station-name').textContent:'Escolha uma estação';
    stationButtons.forEach(b=>{const chosen=b.dataset.station===picked;b.setAttribute('aria-pressed',String(chosen));b.querySelector('.v18-station-check').textContent=radioPlaying&&b.dataset.station===currentRadioChannelId?'▶':chosen?'✓':'○';});
    play.textContent=radioPlaying&&picked===currentRadioChannelId?'Ⅱ Pausar':'▶ Tocar';play.disabled=!picked;
  }
  const oldRadioToggle=window.toggleRadioSidebar;
  window.toggleRadioSidebar=function(){oldRadioToggle();if($('radio-modal').style.display==='flex'){picked=source.value||currentRadioChannelId||'';refreshRadioUI();}};
  new MutationObserver(refreshRadioUI).observe($('radioStatusPopup'),{childList:true,subtree:true,characterData:true});
  refreshRadioUI();

  // Diagnóstico: exportação em arquivo e compartilhamento nativo, mantendo os atalhos existentes.
  const logs=document.querySelector('.log-content');logs.classList.add('v18-dialog');logs.firstElementChild.classList.add('v18-dialog-header');
  logs.firstElementChild.querySelector('span').textContent='Diagnóstico do jogo';logs.firstElementChild.querySelector('span').id='v18-log-title';
  logs.querySelector('p').textContent='Registro da sessão para consultar ou compartilhar ao pedir ajuda.';
  $('logTextarea').setAttribute('aria-label','Registro de diagnóstico da sessão');
  const logActions=logs.lastElementChild;logActions.classList.add('v18-log-actions');
  const feedback=el('p','v18-share-feedback');feedback.setAttribute('role','status');
  function logFile(){return new File([$ ('logTextarea').value],'Xadrez_log_'+new Date().toISOString().replace(/[:.]/g,'-')+'.txt',{type:'text/plain;charset=utf-8'});}
  function downloadLog(){const file=logFile(),url=URL.createObjectURL(file),a=el('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);feedback.textContent='Arquivo TXT preparado para download.';}
  const download=button('↓ Baixar TXT',downloadLog);
  const share=button('↗ Compartilhar…',async()=>{
    const text=$('logTextarea').value;
    feedback.textContent='Abrindo as opções de compartilhamento…';
    try{
      if(!navigator.share)throw new Error('Web Share indisponível');
      const file=logFile();
      const payload={title:'Diagnóstico Xadrez',text:text.slice(0,12000)};
      if(navigator.canShare&&navigator.canShare({files:[file]}))payload.files=[file];
      await navigator.share(payload);
      feedback.textContent='Compartilhamento aberto.';
    }catch(error){
      if(error&&error.name==='AbortError'){feedback.textContent='Compartilhamento cancelado.';return;}
      try{
        await navigator.clipboard.writeText(text);
        feedback.textContent='O compartilhamento não abriu; o log foi copiado para você colar no aplicativo desejado.';
      }catch(copyError){
        downloadLog();
        feedback.textContent='O compartilhamento não abriu; o arquivo TXT foi baixado para você anexar.';
      }
    }
  });
  logActions.append(download,share);logs.append(feedback);

  // Modal keyboard behavior and focus stay within the visible dialog.
  const modalIds=['settings-modal','radio-modal','log-modal'];
  const titleIds=['v18-settings-title','v18-radio-title','v18-log-title'];
  const previousFocus=new Map();
  modalIds.forEach((id,i)=>{
    const modal=$(id);modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby',titleIds[i]);
    let wasOpen=false;
    new MutationObserver(()=>{
      const open=modal.style.display==='flex';
      if(open===wasOpen)return;wasOpen=open;
      if(open){previousFocus.set(id,document.activeElement);modal.querySelector('.close-modal-btn').focus();}
      else {const previous=previousFocus.get(id);if(previous&&previous.isConnected)previous.focus();}
      document.body.classList.toggle('v18-modal-open',modalIds.some(x=>$(x).style.display==='flex'));
    }).observe(modal,{attributes:true,attributeFilter:['style']});
  });
  document.addEventListener('keydown',event=>{
    const modal=modalIds.map($).reverse().find(m=>m.style.display==='flex');if(!modal)return;
    if(event.key==='Escape'){event.preventDefault();modal.querySelector('.close-modal-btn').click();return;}
    if(event.key!=='Tab')return;
    const focusable=Array.from(modal.querySelectorAll('button,input,select,textarea,[tabindex="0"]')).filter(n=>!n.disabled&&n.getClientRects().length);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
})();
