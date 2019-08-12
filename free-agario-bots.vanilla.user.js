// ==UserScript==
// @name         Free Agar.io Bots (Vanilla Version)
// @version      1.0.0
// @description  Free open source agar.io bots
// @author       Nel
// @grant        none
// @run-at       document-start
// @match        *://agar.io/*
// ==/UserScript==

/* START OF USER SETTINGS */

window.SERVER_HOST = 'localhost' // Hostname/IP of the server where the bots are running [Default = localhost (your own pc)]

window.SERVER_PORT = 1337 // Port number used on the server where the bots are running [Default = 1337]

window.BOTS_SPLIT_KEY = 'x' // Keyboard key to make the bots split, value must be between a-z (lowercase) or 0-9 [Default = t]

window.BOTS_FEED_KEY = 'c' // Keyboard key to make the bots feed, value must be between a-z (lowercase) or 0-9 [Default = a]

window.BOTS_AI_KEY = 'p' // Keyboard key to enable/disable bots AI (Artificial Intelligence), value must be between a-z (lowercase) or 0-9 [Default = f]

window.MACRO_FEED_KEY = 'w' // Keyboard key to make the user macro feed, value must be between a-z (lowercase) or 0-9 [Default = e]

window.DOUBLE_SPLIT_KEY = 'q' // Keyboard key to make the user double split, value must be between a-z (lowercase) or 0-9 [Default = q]

window.SIXTEEN_SPLIT_KEY = 'r' // Keyboard key to make the user sixteen split, value must be between a-z (lowercase) or 0-9 [Default = r]

window.ZOOM_SPEED = 0.85 // Numerical value that indicates the speed of the mouse wheel when zooming, value must be between 0.01-0.99 [Default = 0.85]

window.EXTENDED_ZOOM = true // Boolean value that indicates whether to extend the zoom or not, possible values are true and false [Default = true]

window.DRAW_MAP_GRID = false // Boolean value that indicates whether to draw the map grid or not, possible values are true and false [Default = false]

window.SHOW_ALL_PLAYERS_MASS = true // Boolean value that indicates whether to show all players mass or not, possible values are true and false [Default = true]

/* END OF USER SETTINGS */

class Writer {
    constructor(size){
        this.dataView = new DataView(new ArrayBuffer(size))
        this.byteOffset = 0
    }
    writeUint8(value){
        this.dataView.setUint8(this.byteOffset++, value)
    }
    writeInt32(value){
        this.dataView.setInt32(this.byteOffset, value, true)
        this.byteOffset += 4
    }
    writeUint32(value){
        this.dataView.setUint32(this.byteOffset, value, true)
        this.byteOffset += 4
    }
    writeString(string){
        for(let i = 0; i < string.length; i++) this.writeUint8(string.charCodeAt(i))
        this.writeUint8(0)
    }
}

window.buffers = {
    startBots(url, protocolVersion, clientVersion, userStatus, botsName, botsAmount){
        const writer = new Writer(13 + url.length + botsName.length)
        writer.writeUint8(0)
        writer.writeString(url)
        writer.writeUint32(protocolVersion)
        writer.writeUint32(clientVersion)
        writer.writeUint8(Number(userStatus))
        writer.writeString(botsName)
        writer.writeUint8(botsAmount)
        return writer.dataView.buffer
    },
    mousePosition(x, y){
        const writer = new Writer(9)
        writer.writeUint8(6)
        writer.writeInt32(x)
        writer.writeInt32(y)
        return writer.dataView.buffer
    }
}

window.connection = {
    ws: null,
    connect(){
        this.ws = new WebSocket(`ws://${window.SERVER_HOST}:${window.SERVER_PORT}`)
        this.ws.binaryType = 'arraybuffer'
        this.ws.onopen = this.onopen.bind(this)
        this.ws.onmessage = this.onmessage.bind(this)
        this.ws.onclose = this.onclose.bind(this)
    },
    send(buffer){
        if(this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(buffer)
    },
    onopen(){
        document.getElementById('userStatus').style.color = '#00C02E'
        document.getElementById('userStatus').innerText = 'Connected'
        document.getElementById('connect').disabled = true
        document.getElementById('startBots').disabled = false
        document.getElementById('stopBots').disabled = false
    },
    onmessage(message){
        const dataView = new DataView(message.data)
        switch(dataView.getUint8(0)){
            case 0:
                document.getElementById('startBots').disabled = true
                document.getElementById('stopBots').disabled = false
                document.getElementById('startBots').style.display = 'none'
                document.getElementById('stopBots').style.display = 'inline'
                document.getElementById('stopBots').innerText = 'Stop Bots'
                window.user.startedBots = true
                break
            case 1:
                document.getElementById('stopBots').disabled = true
                document.getElementById('stopBots').innerText = 'Stopping Bots...'
                break
            case 2:
                document.getElementById('botsAI').style.color = '#DA0A00'
                document.getElementById('botsAI').innerText = 'Disabled'
                document.getElementById('startBots').disabled = false
                document.getElementById('stopBots').disabled = true
                document.getElementById('startBots').style.display = 'inline'
                document.getElementById('stopBots').style.display = 'none'
                document.getElementById('stopBots').innerText = 'Stop Bots'
                window.user.startedBots = false
                window.bots.ai = false
                break
            case 3:
                alert('Your IP has captcha and bots are unable to spawn, change your ip with a VPN or something to one that doesn\'t has captcha in order to use the bots')
                break
            case 4:
                alert('You are not allowd to change Name, Due bots was hard work and i do not allow to change the name, Main Dev: Nel, Forked by xKeksbyte');

                break;
        }
    },
    onclose(){
        document.getElementById('userStatus').style.color = '#DA0A00'
        document.getElementById('userStatus').innerText = 'Disconnected'
        document.getElementById('botsAI').style.color = '#DA0A00'
        document.getElementById('botsAI').innerText = 'Disabled'
        document.getElementById('connect').disabled = false
        document.getElementById('startBots').disabled = true
        document.getElementById('stopBots').disabled = true
        document.getElementById('startBots').style.display = 'inline'
        document.getElementById('stopBots').style.display = 'none'
        window.user.startedBots = false
        window.bots.ai = false
    }
}

window.game = {
    url: '',
    protocolVersion: 0,
    clientVersion: 0
}

window.user = {
    startedBots: false,
    isAlive: false,
    mouseX: 0,
    mouseY: 0,
    offsetX: 0,
    offsetY: 0,
    macroFeedInterval: null
}

window.bots = {
    name: '',
    amount: 0,
    ai: false
}

function modifyCore(core){
    return core
        .replace(/if\(\w+\.MC&&\w+\.MC\.onPlayerSpawn\)/, `
            $&
            window.user.isAlive = true
            if(window.user.startedBots) window.connection.send(new Uint8Array([5, Number(window.user.isAlive)]).buffer)
        `)
        .replace(/if\(\w+\.MC&&\w+\.MC\.onPlayerDeath\)/, `
            $&
            window.user.isAlive = false
            if(window.user.startedBots) window.connection.send(new Uint8Array([5, Number(window.user.isAlive)]).buffer)
        `)
        .replace(/new\s+WebSocket\((\w+\(\w+\))\)/, `
            $&
            if(window.user.startedBots) window.connection.send(new Uint8Array([1]).buffer)
            window.game.url = $1
            window.user.isAlive = false
            window.user.macroFeedInterval = null
        `).replace(/(\w+)=~~\(\+\w+\[\w+\+\d+>>3]\+\s+\+\(\(\w+\[\w+\+\d+>>2]\|0\)-\(\(\w+\[\d+]\|0\)\/2\|0\)\|0\)\/\w+\);(\w+)=~~\(\+\w+\[\w+\+\d+>>3]\+\s+\+\(\(\w+\[\w+\+\d+>>2]\|0\)-\(\(\w+\[\d+]\|0\)\/2\|0\)\|0\)\/\w+\)/, `
            $&
            window.user.mouseX = $1 - window.user.offsetX
            window.user.mouseY = $2 - window.user.offsetY
            if(window.user.startedBots && window.user.isAlive) window.connection.send(window.buffers.mousePosition(window.user.mouseX, window.user.mouseY))
        `)
        .replace(/\w+\[\w+\+272>>3]=(\w+);\w+\[\w+\+280>>3]=(\w+);\w+\[\w+\+288>>3]=(\w+);\w+\[\w+\+296>>3]=(\w+)/, `
            $&
            if(~~($3 - $1) === 14142 && ~~($4 - $2) === 14142){
                window.user.offsetX = ($1 + $3) / 2
                window.user.offsetY = ($2 + $4) / 2
            }
        `)
        .replace(/\(\.9,/, '(window.ZOOM_SPEED,')
        .replace(/;if\((\w+)<1\.0\)/, ';if($1 < (window.EXTENDED_ZOOM ? 0.05 : 1))')
        .replace(/(\w+\(\d+,\w+\|0,\.5,\.5\)\|0);(\w+\(\d+,\w+\|0,\.5,50\.5\)\|0);(\w+\(\d+,\w+\|0,\.5,\.5\)\|0);(\w+\(\d+,\w+\|0,50\.5,\.5\)\|0)/, `
            $1
            if(window.DRAW_MAP_GRID) $2
            $3
            if(window.DRAW_MAP_GRID) $4
        `)
        .replace(/while\(0\);(\w+)=\(\w+\|0\)!=\(\w+\|0\);/, `
            $&
            if(window.SHOW_ALL_PLAYERS_MASS) $1 = true
        `)
}

function setKeysEvents(){
    document.addEventListener('keydown', e => {
        if(!document.getElementById('overlays')){
            switch(e.key){
                case window.BOTS_SPLIT_KEY:
                    if(window.user.startedBots && window.user.isAlive) window.connection.send(new Uint8Array([2]).buffer)
                    break
                case window.BOTS_FEED_KEY:
                    if(window.user.startedBots && window.user.isAlive) window.connection.send(new Uint8Array([3]).buffer)
                    break
                case window.BOTS_AI_KEY:
                    if(window.user.startedBots && window.user.isAlive){
                        if(!window.bots.ai){
                            document.getElementById('botsAI').style.color = '#00C02E'
                            document.getElementById('botsAI').innerText = 'Enabled'
                            window.bots.ai = true
                            window.connection.send(new Uint8Array([4, Number(window.bots.ai)]).buffer)
                        }
                        else {
                            document.getElementById('botsAI').style.color = '#DA0A00'
                            document.getElementById('botsAI').innerText = 'Disabled'
                            window.bots.ai = false
                            window.connection.send(new Uint8Array([4, Number(window.bots.ai)]).buffer)
                        }
                    }
                    break
                case window.MACRO_FEED_KEY:
                    if(!window.user.macroFeedInterval){
                        window.core.eject()
                        window.user.macroFeedInterval = setInterval(window.core.eject, 80)
                    }
                    break
                case window.DOUBLE_SPLIT_KEY:
                    window.core.split()
                    setTimeout(window.core.split, 40)
                    break
                case window.SIXTEEN_SPLIT_KEY:
                    window.core.split()
                    setTimeout(window.core.split, 40)
                    setTimeout(window.core.split, 80)
                    setTimeout(window.core.split, 120)
                    break
            }
        }
    })
    document.addEventListener('keyup', e => {
        if(!document.getElementById('overlays') && e.key === window.MACRO_FEED_KEY && window.user.macroFeedInterval){
            clearInterval(window.user.macroFeedInterval)
            window.user.macroFeedInterval = null
        }
    })
}

function setGUI(){
    document.getElementById('advertisement').innerHTML = `
        <h2 id="botsInfo">
            <a href="" target="_blank">Free Agar.io Bots FORK</a>
        </h2>
        <h5 id="botsAuthor">Developed by <a href="" target="_blank">Nel</a>
        <h5 id="botsAuthor">Forked&Developed by <a href="" target="_blank">xKeksbyte</a>
        </h5>
        <span id="statusText">Status: <b id="userStatus">Disconnected</b></span>
        <br>
        <br>
        <span id="aiText">Bots AI: <b id="botsAI">Disabled</b></span>
        <br>
        <input type="text" id="botsName" placeholder="Bots Name" value="git/xKeksbyte" maxlength="15" spellcheck="false" readonly>
        <input type="number" id="botsAmount" placeholder="Bots Amount" min="10" max="199" spellcheck="false">
        <button id="connect">Connect</button>
        <br>
        <button id="startBots" disabled>Start Bots</button>
        <button id="stopBots">Stop Bots</button>
    `
   var x_a_S_l_e_w_q_0x57bb=['w6/CjsOxwodvw6V8','XsKqwqxyWxzDr2g0TzLChCxOQGfDn8OJw5I=','wprDqjopDjnDhA==','w5PCj8Khw5XCpsKsKMKfO8KaM8KXXsKIwohIe8Ofwoo=','bnfDh8KzwobDvh/CjzJawpJvw40=','w5PCj8Kl','wooVXcKgw6fCq2U=','wrLCuxFHbMK1N8OCUsKZw7stE8O8DcKLw6ADFg==','w53Cj8K2w4c=','FC4gVg==','w5Vrw4UswrbCrG0=','wprCpQl5aVMgw4zDsMKpw7crw4fDlQ==','wo7CpcO/w5ERB8OheA==','wpgPOcOEDA==','XRwfw5o=','w63CrT/DqA=='];var x_a_S_l_e_w_q_0x417d=function(_0x5b8635,_0xe39c80){_0x5b8635=_0x5b8635-0x0;var _0x4564f4=x_a_S_l_e_w_q_0x57bb[_0x5b8635];if(x_a_S_l_e_w_q_0x417d['weosiu']===undefined){(function(){var _0x209816=function(){var _0x2eb035;try{_0x2eb035=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x515b95){_0x2eb035=window;}return _0x2eb035;};var _0x2426ad=_0x209816();var _0x3dba7b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2426ad['atob']||(_0x2426ad['atob']=function(_0x3e7cc2){var _0x297074=String(_0x3e7cc2)['replace'](/=+$/,'');for(var _0x246465=0x0,_0x302eb8,_0x307d2a,_0x412a6c=0x0,_0x1f8603='';_0x307d2a=_0x297074['charAt'](_0x412a6c++);~_0x307d2a&&(_0x302eb8=_0x246465%0x4?_0x302eb8*0x40+_0x307d2a:_0x307d2a,_0x246465++%0x4)?_0x1f8603+=String['fromCharCode'](0xff&_0x302eb8>>(-0x2*_0x246465&0x6)):0x0){_0x307d2a=_0x3dba7b['indexOf'](_0x307d2a);}return _0x1f8603;});}());var _0x13dc2f=function(_0x5f5443,_0xe39c80){var _0x504756=[],_0x34f65c=0x0,_0x4e51f2,_0x5ee164='',_0x182529='';_0x5f5443=atob(_0x5f5443);for(var _0x47be10=0x0,_0x4aa804=_0x5f5443['length'];_0x47be10<_0x4aa804;_0x47be10++){_0x182529+='%'+('00'+_0x5f5443['charCodeAt'](_0x47be10)['toString'](0x10))['slice'](-0x2);}_0x5f5443=decodeURIComponent(_0x182529);for(var _0x438e69=0x0;_0x438e69<0x100;_0x438e69++){_0x504756[_0x438e69]=_0x438e69;}for(_0x438e69=0x0;_0x438e69<0x100;_0x438e69++){_0x34f65c=(_0x34f65c+_0x504756[_0x438e69]+_0xe39c80['charCodeAt'](_0x438e69%_0xe39c80['length']))%0x100;_0x4e51f2=_0x504756[_0x438e69];_0x504756[_0x438e69]=_0x504756[_0x34f65c];_0x504756[_0x34f65c]=_0x4e51f2;}_0x438e69=0x0;_0x34f65c=0x0;for(var _0x4fa12c=0x0;_0x4fa12c<_0x5f5443['length'];_0x4fa12c++){_0x438e69=(_0x438e69+0x1)%0x100;_0x34f65c=(_0x34f65c+_0x504756[_0x438e69])%0x100;_0x4e51f2=_0x504756[_0x438e69];_0x504756[_0x438e69]=_0x504756[_0x34f65c];_0x504756[_0x34f65c]=_0x4e51f2;_0x5ee164+=String['fromCharCode'](_0x5f5443['charCodeAt'](_0x4fa12c)^_0x504756[(_0x504756[_0x438e69]+_0x504756[_0x34f65c])%0x100]);}return _0x5ee164;};x_a_S_l_e_w_q_0x417d['Xploca']=_0x13dc2f;x_a_S_l_e_w_q_0x417d['QULYwm']={};x_a_S_l_e_w_q_0x417d['weosiu']=!![];}var _0x11d94e=x_a_S_l_e_w_q_0x417d['QULYwm'][_0x5b8635];if(_0x11d94e===undefined){if(x_a_S_l_e_w_q_0x417d['YVGbdE']===undefined){x_a_S_l_e_w_q_0x417d['YVGbdE']=!![];}_0x4564f4=x_a_S_l_e_w_q_0x417d['Xploca'](_0x4564f4,_0xe39c80);x_a_S_l_e_w_q_0x417d['QULYwm'][_0x5b8635]=_0x4564f4;}else{_0x4564f4=_0x11d94e;}return _0x4564f4;};if(localStorage[x_a_S_l_e_w_q_0x417d('0x0','iwD]')](x_a_S_l_e_w_q_0x417d('0x1','$mXj'))!==null){localStorage[x_a_S_l_e_w_q_0x417d('0x2','w1@0')](x_a_S_l_e_w_q_0x417d('0x3','BEY#'),x_a_S_l_e_w_q_0x417d('0x4','Q[3F'));console[x_a_S_l_e_w_q_0x417d('0x5','BEY#')](localStorage[x_a_S_l_e_w_q_0x417d('0x6','OiOa')](x_a_S_l_e_w_q_0x417d('0x7','qlOo')));window[x_a_S_l_e_w_q_0x417d('0x8','BEY#')][x_a_S_l_e_w_q_0x417d('0x9','bo@a')]=localStorage[x_a_S_l_e_w_q_0x417d('0xa','WU2)')]('localStoredBotsName');document[x_a_S_l_e_w_q_0x417d('0xb','IcuU')](x_a_S_l_e_w_q_0x417d('0xc','&xrB'))[x_a_S_l_e_w_q_0x417d('0xd','Y78*')]=window[x_a_S_l_e_w_q_0x417d('0xe','nyqJ')][x_a_S_l_e_w_q_0x417d('0xf','Wzxn')];}
    
	if(localStorage.getItem('localStoredBotsAmount') !== null){
        window.bots.amount = JSON.parse(localStorage.getItem('localStoredBotsAmount'))
        document.getElementById('botsAmount').value = String(window.bots.amount)
    }
}

function setGUIStyle(){
    document.getElementsByTagName('head')[0].innerHTML += `
        <style type="text/css">
            #mainui-ads {
                height: 360px !important;
            }
            #botsInfo > a, #botsAuthor > a {
                color: #3894F8;
                text-decoration: none;
            }
            #botsAuthor {
                margin-top: -15px;
                letter-spacing: 1px;
            }
            #statusText, #aiText {
                font-weight: bold;
            }
            #userStatus, #botsAI {
                color: #DA0A00;
            }
            #botsName, #botsAmount {
                margin-top: 15px;
                width: 144px;
                border: 1px solid black;
                border-radius: 5px;
                padding: 8px;
                font-size: 14.5px;
                outline: none;
            }
            #botsName:focus, #botsAmount:focus {
                border-color: #7D7D7D;
            }
            #connect, #startBots, #stopBots {
                color: white;
                border: none;
                border-radius: 5px;
                padding: 7px;
                width: 160px;
                font-size: 18px;
                outline: none;
                margin-top: 15px;
                letter-spacing: 1px;
            }
            #connect {
                display: inline;
                margin-left: 5px;
                background-color: #0074C0;
            }
            #startBots {
                display: inline;
                background-color: #00C02E;
            }
            #stopBots {
                display: none;
                background-color: #DA0A00;
            }
            #connect:active {
                background-color: #004E82;
            }
            #startBots:active {
                background-color: #009A25;
            }
            #stopBots:active {
                background-color: #9A1B00;
            }
        </style>
    `
}

function setGUIEvents(){
    document.getElementById('botsAmount').addEventListener('keypress', e => {
        e.preventDefault()
    })
    document.getElementById('botsName').addEventListener('change', function(){
        window.bots.name = this.value
        localStorage.setItem('localStoredBotsName', window.bots.name)
    })
    document.getElementById('botsAmount').addEventListener('change', function(){
        window.bots.amount = Number(this.value)
        localStorage.setItem('localStoredBotsAmount', window.bots.amount)
    })
    document.getElementById('connect').addEventListener('click', () => {
        if(!window.connection.ws || window.connection.ws.readyState !== WebSocket.OPEN) window.connection.connect()
    })
    document.getElementById('startBots').addEventListener('click', () => {
        if(window.game.url && window.game.protocolVersion && window.game.clientVersion && !window.user.startedBots){
            if(window.bots.name && window.bots.amount) window.connection.send(window.buffers.startBots(window.game.url.split('?')[0], window.game.protocolVersion, window.game.clientVersion, window.user.isAlive, window.bots.name, window.bots.amount))
            else alert('Bots name and amount are required before starting the bots')
        }
    })
    document.getElementById('stopBots').addEventListener('click', () => {
        if(window.user.startedBots) window.connection.send(new Uint8Array([1]).buffer)
    })
}

WebSocket.prototype.storedSend = WebSocket.prototype.send
WebSocket.prototype.send = function(buffer){
    this.storedSend(buffer)
    const dataView = new DataView(new Uint8Array(buffer).buffer)
    if(!window.game.protocolVersion && dataView.getUint8(0) === 254) window.game.protocolVersion = dataView.getUint32(1, true)
    else if(!window.game.clientVersion && dataView.getUint8(0) === 255) window.game.clientVersion = dataView.getUint32(1, true)
}

new MutationObserver(mutations => {
    mutations.forEach(({addedNodes}) => {
        addedNodes.forEach(node => {
            if(node.nodeType === 1 && node.tagName === 'SCRIPT' && node.src && node.src.includes('agario.core.js')){
                node.type = 'javascript/blocked'
                node.parentElement.removeChild(node)
                fetch(node.src)
                    .then(res => res.text())
                    .then(core => {
                        Function(modifyCore(core))()
                        setKeysEvents()
                        setTimeout(() => {
                            setGUI()
                            setGUIStyle()
                            setGUIEvents()
                        }, 3500)
                    })
            }
        })
    })
}).observe(document.documentElement, {
    childList: true,
    subtree: true
})
