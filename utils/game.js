import Phaser from 'phaser'
let vue, rtc
let height, width
let percent2Px = function(num, isWidth) {
    if(isWidth) {
        return width*num/100
    } else {
        return height*num/100
    }
}
let playerPosition = [
    {x: 5, y: 45},
    {x: 45, y: 5},
    {x: 90, y: 45},
]

let timerPosition = [
    {x: 10, y: 45},     // 0号位置
    {x: 50, y: 5},      // 1号位置
    {x: 80, y: 45},     // 2号位置
    {x: 15, y: 60},     // 自己
]

let pokerPosition = [
    {x: 15, y: 35},     // 0号位置
    {x: 42, y: 17},      // 1号位置
    {x: 60, y: 35},     // 2号位置
    {x: 40, y: 35},     // 自己
]

let toolPosition = {
    size: 10,
    home: {y: 90},     // 声音
    share: {y: 80},      // 话筒
    mic: {y: 70},     // 分享
    sound: {y: 60},     // home
}

let backPoker = 54  // 背面牌

let isPhone = false

const fontSize = 22
const downFontSize = 21

function index2Pos(index) {
    if(index === vue.selfInfo.index) {
        return vue.players.length-1
    }
    let temp = index-vue.selfInfo.index + 1
    if(temp > 0) {
        temp -= (playerPosition.length+1)
    }
    if(temp < 0) {
        temp *= -1
    }
    return temp
}

function getAdjustPos(x, y) {
    if (!isPhone || screen.orientation.angle === 90 || screen.orientation.angle === -90) {
        return [x, y]
    } else {
        return [height-y, x]
    }
}

function getAdjustPosX(x, y) {
    let temp = getAdjustPos(x, y)
    return temp[0]
}

function adjustPos(child) {
    if (!isPhone || screen.orientation.angle === 90 || screen.orientation.angle === -90) {
        child.x = child.getData('x')
        child.y = child.getData('y')
        child.angle = 0
      } else {
        child.x = height - child.getData('y')
        child.y = child.getData('x')
        child.angle = 90
    }
}

function addPoker(that, pokerGroup) {
    if(pokerGroup.children) {
        pokerGroup.clear(true, true)
    }
    for (let i=0;i<vue.pukeInfo.puke.length;i++) {
        let x = i*5+15
        let poker = that.add.image(percent2Px(x, true), percent2Px(70, false), 'pokers', vue.pukeInfo.puke[i])
        poker.setDisplaySize(percent2Px(10, true), percent2Px(25, false))
        poker.setInteractive()
        poker.setData('chosen', false)
        poker.setData('changed', false)
        poker.setData('value', vue.pukeInfo.puke[i])
        poker.setData('size', {w: 10, h: 25})
        poker.on("pointerdown", () => {
            if(vue.roomInfo.status === 3) {
                pokerGroup.getChildren().forEach(child=> {
                    child.setData('chosen', false)
                })
            }
            poker.setData('changed', true)
            poker.setData('chosen', !poker.getData('chosen'))
        })
        poker.on("pointermove", (pointer) => {
            if(vue.roomInfo.status !== 2) {
                return
            }
            if(pointer.isDown && !poker.getData('changed')) {
                poker.setData('changed', true)
                poker.setData('chosen', !poker.getData('chosen'))
            }
        })
        poker.on('changedata-chosen', (gameObject, value)=> {
            let step = 0
            if(value) {
                step -= 5
            }
            let isPortrait = (window.orientation === 0)
            if(isPortrait) {
                that.tweens.add({ targets: gameObject, x: getAdjustPosX(poker.getData('x'), poker.getData('y')) - percent2Px(step, false), duration: 150 })
            } else {
                that.tweens.add({ targets: gameObject, y: percent2Px(70 + step, false), duration: 150 })
            }
        })
        pokerGroup.add(poker)
    }
    that.input.on("pointerup", ()=> {
        let children = pokerGroup.getChildren()
        children.forEach(function(child){
            child.setData('changed', false)
        })
    })
    pokerGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function addButton(content, widthPercent, heightPercent, that) {
    let button = that.add.sprite(percent2Px(widthPercent, true), percent2Px(heightPercent, false), 'button').setFrame(0).setInteractive()
    let text = that.add.text(0, 0, content, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', fontSize: fontSize, fill: 'black' })
    button.setDisplaySize(text.width + 23, text.height + 13)
    text.setOrigin(0.5)
    text.setX(button.x)
    text.setY(button.y)
    button.on('pointerdown', ()=>{
        button.setFrame(1)
        text.setFontSize(downFontSize)
        button.setDisplaySize(text.width + 20, text.height + 10)
    })
    button.on('pointerup', ()=>{
        button.setFrame(0)
        text.setFontSize(fontSize)
        button.setDisplaySize(text.width + 23, text.height + 13)
    })
    button.on('pointerout', () => {
        button.setFrame(0)
        text.setFontSize(fontSize)
        button.setDisplaySize(text.width + 23, text.height + 13)
      });
    button.setInteractive()
    text.setData('content', content)
    return {button, text}
}

function renderPlayer(players, playerGroup, that) {
    console.log(playerGroup.children.size)
    playerGroup.clear(true, true)
    let index = that.add.text(percent2Px(80, true), percent2Px(10, false), '座位：'+vue.selfInfo.index+'号', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'white'})
    playerGroup.add(index)
    for(let i=0;i<players.length;i++) {
        if(players[i].id === vue.selfInfo.id) {
            continue
        }
        let index = index2Pos(i)
        let player = that.add.image(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y, false), 'player')
        player.setDisplaySize(percent2Px(7, true), percent2Px(7, true))
        let status = ''
        switch(players[i].status) {
            case 0:
                status = '未就绪'
                break 
            case 1:
                status = '已就绪'
                break
            case 2:
                status = '游戏中'
                break
            case 3:
                status = '明牌'
                break
            case 4:
                status = '走人'
                break
            case 5:
                status = '离线'
                break
        }
        let text = that.add.text(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y+5, false), status, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
        if(players[i].puke !== undefined) {
            let pokerNum = that.add.text(percent2Px(playerPosition[index].x-3, true), percent2Px(playerPosition[index].y+5, false), players[i].puke.length, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
            playerGroup.add(pokerNum)
        }
        if(players[i].group !== undefined) {
            if(players[i].group === 1) {
                let playerTeam = that.add.text(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y+7, false), '红十组', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'red'})
                playerGroup.add(playerTeam)
            } else if(players[i].group === 2) {
                let playerTeam = that.add.text(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y+7, false), '独十组', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'red'})
                playerGroup.add(playerTeam)
            }
        }
        playerGroup.add(player)
        playerGroup.add(text)
    }
    playerGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderPlayButton(buttonGroup, pokerButtonGroup, that) {
    buttonGroup.clear(true, true)
    pokerButtonGroup.clear(true, true)
    let temp
    let content = '准备'
    switch(vue.roomInfo.status) {
        case 0:
            if(vue.selfInfo.status === 1) {
                content = '取消准备'
            }
            temp = addButton(content, 40, 60, that)
            temp.button.on('pointerup', ()=> {
                vue.updateStatus()
            })
            buttonGroup.add(temp.button)
            buttonGroup.add(temp.text)
            break
        case 1:
            if(vue.selfInfo.status === 3) {
                return
            }
            temp = addButton('明牌', 40, 60, that)
            temp.button.on('pointerdown', ()=> {
                vue.updataSeen()
            })
            buttonGroup.add(temp.button)
            buttonGroup.add(temp.text)
            break
        case 2:
            break
    }
    buttonGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderScore(value, scoreGroup, that) {
    scoreGroup.clear(true, true)
    let startX = 30
    let startY = 20
    let scoreHeader = that.add.text(percent2Px(startX, true), percent2Px(startY-5, false), '座位\t队伍\t排名\t本局得分\t总得分', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'white'})
    scoreGroup.add(scoreHeader)
    for(let i=0;i<value.players.length;i++) {
        let temp = value.players[i]
        let playerScore = that.add.text(percent2Px(startX, true), percent2Px(startY + 5*i, false), vue.getIndexById(temp.id) + '号' + '\t' + temp.group + '\t' + temp.rank + '\t' + temp.single_score + '\t' + temp.score, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'yellow'})
        scoreGroup.add(playerScore)
    }
    let winGroup = that.add.text(percent2Px(startX, true), percent2Px(startY + 5*value.players.length, false), '胜方：'+value.result, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'yellow'})
    scoreGroup.add(winGroup)
    scoreGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderBack(backGroup, that) {
    backGroup.clear(true, true)
    let back = that.add.image(percent2Px(50, true), percent2Px(50, false), 'back')
    back.setDisplaySize(percent2Px(100, true), percent2Px(100, false))
    back.setPosition(width/2, height/2)

    // 添加返回至首页按钮
    let home = that.add.image(percent2Px(100, true)-percent2Px(toolPosition.size, false), percent2Px(toolPosition.home.y, false), 'home')
    home.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
    home.setInteractive()
    home.on('pointerdown', ()=> {
        vue.toCreateRoom()
    })
    backGroup.add(back)
    backGroup.add(home)
    backGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderShare(value, shareGroup, that) {
    shareGroup.clear(true, true)
    let url = that.add.text(percent2Px(80, true), percent2Px(5, false), vue.roomInfo.roomId, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
    url.setText(value)
    url.setInteractive()
    url.on('pointerdown', ()=> {
        let textarea = document.createElement('textarea');
        textarea.value = 'http://' + window.location.host + '/room/join?room_id=' + url.text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    })
    shareGroup.add(url)
    shareGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderTimer(value, timerGroup, pokerGroup, pokerButtonGroup, that) {
    timerGroup.clear(true, true)
    if(value.onTurnIndex === -1) {
        return
    }
    let pos = index2Pos(value.onTurnIndex)
    let restTime = that.add.text(percent2Px(timerPosition[pos].x + 2, true), percent2Px(timerPosition[pos].y, false), '', { fontSize: '24px', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
    let timer = that.add.image(percent2Px(timerPosition[pos].x, true), percent2Px(timerPosition[pos].y, false), 'timer')
    timer.setDisplaySize(percent2Px(4, true), percent2Px(4, true))
    restTime.setText(vue.playInfo.restTime)
    restTime.setOrigin(0.5)
    timerGroup.add(timer)
    timerGroup.add(restTime)
    timerGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
    if(value.onTurnIndex !== vue.selfInfo.index || vue.roomInfo.status!== 2) {
        return
    }
    pokerButtonGroup.clear(true, true)
    let cancelTemp = addButton('重选', 25, 60, that)
    let runTemp = addButton('出牌', 40, 60, that)
    cancelTemp.button.on('pointerdown', ()=> {
        pokerGroup.getChildren().forEach((poker)=> {
            poker.setData('chosen', false)
        })
    })
    runTemp.button.setInteractive()
    runTemp.button.on('pointerdown', ()=>{
        let chosenPokers = []
        pokerGroup.getChildren().forEach((poker)=> {
            if(poker.getData('chosen')) {
                chosenPokers.push(poker.getData('value'))
            }
            poker.setData('chosen', false)
        })
        vue.sendPoker(chosenPokers)
    })
    if(vue.lastPoker.action !== 'nextTurn' && vue.lastPoker.action !== 'break' && vue.lastPoker.action !== 'back') {
        let passTemp = addButton('过', 55, 60, that)
        passTemp.button.on('pointerdown', ()=> {
            vue.sendPass()
        })
        pokerButtonGroup.add(passTemp.button)
        pokerButtonGroup.add(passTemp.text)
    }
    
    pokerButtonGroup.add(cancelTemp.button)
    pokerButtonGroup.add(cancelTemp.text)
    pokerButtonGroup.add(runTemp.button)
    pokerButtonGroup.add(runTemp.text)

    pokerButtonGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderLastPoker(value, lastPokerGroup, that) {
    if(value.pokers.length === 0 && value.action !== 'nextTurn') {
        // 中间有人过，不能擦掉之前的lastPoker
        return
    }
    lastPokerGroup.clear(true, true)
    if(value.playerIndex === -1) {
        return
    }
    for(let i=0;i<value.pokers.length;i++) {
        let poker = that.add.image(i*percent2Px(3, true), percent2Px(1, false), 'pokers', value.pokers[i])
        poker.setDisplaySize(percent2Px(7, true), percent2Px(20, false))
        lastPokerGroup.add(poker)
    }
    let pos = index2Pos(value.playerIndex)
    lastPokerGroup.incXY(percent2Px(pokerPosition[pos].x, true), percent2Px(pokerPosition[pos].y, false))
    lastPokerGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderScoreTime(value, scoreTimeGroup, that) {
    scoreTimeGroup.clear(true, true)
    let scoreTime = that.add.text(percent2Px(80, true), percent2Px(15, false), value+'倍', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'white'})
    scoreTimeGroup.add(scoreTime)
    scoreTimeGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderExtraButton(value, extraGroup, that) {
    extraGroup.clear(true, true)
    if(value.break.able) {
        let breakTemp = addButton('叉', 70, 60, that)
        breakTemp.button.on('pointerdown', ()=> {
            vue.sendBreak()
        })
        extraGroup.add(breakTemp.button)
        extraGroup.add(breakTemp.text)
    } else if (value.back.able) {
        let backTemp = addButton('钩', 70, 60, that)
        backTemp.button.on('pointerdown', ()=> {
            vue.sendBack()
        })
        extraGroup.add(backTemp.button)
        extraGroup.add(backTemp.text)
    }
    extraGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderFail(value, failGroup, buttonGroup, that) {
    failGroup.clear(true, true)
    buttonGroup.clear(true, true)
    if(value) {
        let connectText = that.add.text(percent2Px(30, true), percent2Px(40, false), '重连失败，您可以返回首页重新进入', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
        let createTemp = addButton('重新进入', 50, 60, that)
        createTemp.button.on('pointerdown', ()=> {
            vue.toCreateRoom()
        })
        failGroup.add(connectText)
        failGroup.add(createTemp.button)
        failGroup.add(createTemp.text)
    }
    failGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderTributePoker(tributeGroup, that) {
    tributeGroup.clear(true, true)
    let y = 30
    for(let i=0;i<13;i++) {
        let x = i*5 + 15
        let poker = that.add.image(percent2Px(x, true), percent2Px(y, false), 'pokers', backPoker)
        poker.setDisplaySize(percent2Px(10, true), percent2Px(25, false))
        poker.setInteractive()
        poker.setData('chosen', false)
        poker.setData('type', 'backPoker')
        poker.setData('position', {x: x, y: y})
        poker.setData('size', {w: 10, h: 25})
        poker.setData('x', x)
        poker.setData('y', y)
        poker.on("pointerup", () => {
            let status = poker.getData('chosen')
            tributeGroup.getChildren().forEach(child=> {
                if(child.getData('type') === 'backPoker') {
                    child.setData('chosen', false)
                }
            })
            if(status) {
                vue.oneTributeChosen()
                tributeGroup.clear(true, true)
            } else {
                poker.setData('chosen', true)
            }
        })
        poker.on('changedata-chosen', (gameObject, value)=> {
            let step = 0
            if(value) {
                step -= 5
            }
            let isPortrait = (window.orientation === 0)
            if(isPortrait) {
                that.tweens.add({ targets: gameObject, x: getAdjustPosX(poker.getData('x'), poker.getData('y')) - percent2Px(step, false), duration: 150 })
            } else {
                that.tweens.add({ targets: gameObject, y: percent2Px(y + step, false), duration: 150 })
            }
        })
        tributeGroup.add(poker)
    }
    tributeGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderTributeButton(tributeGroup, pokerGroup, that) {
    tributeGroup.clear(true, true)
    let temp = addButton('回贡', 50, 60, that)
    temp.button.on('pointerdown', ()=> {
        let chosen = []
        pokerGroup.getChildren().forEach(child=> {
            if(child.getData('chosen')) {
                chosen.push(child.getData('value'))
            }
        })
        if(chosen.length === 0) {
            return
        }
        vue.oneTributeBack(chosen[0])
    })
    tributeGroup.add(temp.button)
    tributeGroup.add(temp.text)
    tributeGroup.children.entries.forEach(child=> {
        child.setData('x', child.x)
        child.setData('y', child.y)
        adjustPos(child)
    })
}

function renderTributeAni(value, that) {
    let index = index2Pos(value.fromIndex)
    let tempPos = getAdjustPos(percent2Px(timerPosition[index].x, true), percent2Px(timerPosition[index].y, false))
    let poker = that.add.image(tempPos[0], tempPos[1], 'pokers', value.poker)
    poker.setDisplaySize(percent2Px(7, true), percent2Px(17, false))
    poker.setData('x', poker.x)
    poker.setData('y', poker.y)
    adjustPos(poker)
    index = index2Pos(value.toIndex)
    tempPos = getAdjustPos(percent2Px(timerPosition[index].x, true), percent2Px(timerPosition[index].y, false))
    that.tweens.add({ 
        targets: poker, 
        x: tempPos[0], 
        y: tempPos[1], 
        duration: 150,
        onComplete: function () {
            // 延迟3秒后，让物体消失
            that.time.delayedCall(3000, function () {
                poker.setVisible(false);
            }, [], that);
        },
        callbackScope: that
    })
}


function changeGroupVisible(group, visible) {
    group.getChildren().forEach(child=> {
        child.visible = visible
    })
}

class BootScene extends Phaser.Scene {
    preload() {
      // 加载资源
    }
  
    create() {
        let phone = false
        let max = document.documentElement.clientWidth, min = document.documentElement.clientHeight
        if(document.documentElement.clientHeight > document.documentElement.clientWidth) {
            max = document.documentElement.clientHeight
            min = document.documentElement.clientWidth
            phone = true
        }
        width = max
        height = min
        isPhone = phone
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this))
        let isPortrait = (window.orientation === 0)
        if (isPortrait && isPhone) {
        this.scene.run('VerticalScene')
        } else {
        this.scene.run('LevelScene')
        }
    }
  
    handleOrientationChange() {
        let isPortrait = window.orientation === 0
        if (isPortrait && isPhone) {
            let scene = this.scene.get('LevelScene')
            if(scene && scene.scene.isActive()) {
                this.scene.stop('LevelScene')
            }
            this.scene.run('VerticalScene')
        } else {
            let scene = this.scene.get('VerticalScene')
            if(scene && scene.scene.isActive()) {
                this.scene.stop('VerticalScene')
            }
            this.scene.run('LevelScene')
        }
    }

    handleUnload(scenePlugin) {
        let scenes = scenePlugin.getScenes(false)
        console.log(scenes)
        // Remove all scenes
        scenes.forEach((scene) => {
        scenePlugin.remove(scene.scene.key)
        })
    }
}

class BaseScene extends Phaser.Scene {
    constructor(config) {
        super({key: config.key})
    }
    preload() {
        this.cameras.main.setBackgroundColor('#ccc')
        this.load.atlas('pokers', '/resource/pokers.png', '/resource/pokers.json');
        this.load.image('player', '/resource/player.png')
        this.load.image('timer', '/resource/timer.png')
        this.load.image('back', '/resource/back.jpg')
        this.load.spritesheet('button', '/resource/button.png', { frameWidth: 575, frameHeight: 235})
        this.load.image('mute', '/resource/mute.png')
        this.load.image('unmute', '/resource/unmute.png')
        this.load.image('sound', '/resource/sound.png')
        this.load.image('nosound', '/resource/nosound.png')
        this.load.image('home', '/resource/home.png')
        // this.load.spritesheet('button', 'http://8.130.97.117/red_ten/button.png', { frameWidth: 80, frameHeight: 20});
    }
    create() {
        let that = this
        this.pokerGroup = this.add.group()
        this.playerGroup = this.add.group()
        this.buttonGroup = this.add.group()
        this.timerGroup = this.add.group()
        this.pokerButtonGroup = this.add.group()
        this.lastPokerGroup = this.add.group()
        this.scoreGroup = this.add.group()
        this.extraGroup = this.add.group()
        this.backGroup = this.add.group()
        this.scoreTimeGroup = this.add.group()
        this.failGroup = this.add.group()
        this.shareGroup = this.add.group()
        this.tributeGroup = this.add.group()
        this.reconnectGroup = this.add.group()
        this.toolGroup = this.add.group()
        if(window.orientation === 0) {
            // 屏幕处于纵向视图
            that.scale.setGameSize(height, width)
        } else {
            that.scale.setGameSize(width, height)
        }
        // 渲染背景
        renderBack(this.backGroup, this)

        vue.$watch('roomInfo.status', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            if(value === 1) {
                //游戏开始，清屏
                that.pokerGroup.clear(true, true)
                that.timerGroup.clear(true, true)
                that.pokerButtonGroup.clear(true, true)
                that.lastPokerGroup.clear(true, true)
                that.scoreGroup.clear(true, true)
                that.extraGroup.clear(true, true)
            }
        })
        console.log(this.playerGroup)
        // 渲染玩家状态
        vue.$watch('players', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderPlayer(value, that.playerGroup, that)
        })
        renderPlayer(vue.players, this.playerGroup, that)

        // 渲染扑克
        vue.$watch('pukeInfo.puke', ()=> {
            if(!that.scene.isActive()) {
                return
            }
            addPoker(that, that.pokerGroup)
        })
        addPoker(that, this.pokerGroup)
        // 渲染分享链接
        vue.$watch('roomInfo.roomId', (value)=>{
            if(!that.scene.isActive()) {
                return
            }
            renderShare(value, that.shareGroup, that)
        })
        renderShare(vue.roomInfo.roomId, this.shareGroup, that)

        // 渲染游戏按钮
        vue.$watch('players', ()=>{
            if(!that.scene.isActive()) {
                return
            }
            that.failGroup.clear(true, true)
            renderPlayButton(that.buttonGroup, that.pokerButtonGroup, that)
        })
        renderPlayButton(this.buttonGroup, this.pokerButtonGroup, that)
        // 渲染计时器
        vue.$watch('playInfo', ()=> {
            if(!that.scene.isActive()) {
                return
            }
            let value = vue.playInfo
            renderTimer(value, that.timerGroup, that.pokerGroup, that.pokerButtonGroup, that)
        }, {
            deep: true
        })
        renderTimer(vue.playInfo, this.timerGroup, this.pokerGroup, this.pokerButtonGroup, that)
        // 渲染上一张牌
        vue.$watch('lastPoker', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderLastPoker(value, that.lastPokerGroup, that)
        })
        renderLastPoker(vue.lastPoker, this.lastPokerGroup, that)
        // 渲染倍数
        vue.$watch('roomInfo.scoreTime', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderScoreTime(value, that.scoreTimeGroup, that)
        })
        renderScoreTime(vue.roomInfo.scoreTime, this.scoreTimeGroup, that)
        // 渲染额外操作按钮
        vue.$watch('action', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderExtraButton(value, that.extraGroup, that)
        },{
            deep: true
        })
        renderExtraButton(vue.action, this.extraGroup, that)
        vue.$watch('scoreInfo', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            changeGroupVisible(that.buttonGroup, false)
            changeGroupVisible(that.extraGroup, false)
            changeGroupVisible(that.pokerButtonGroup, false)
            renderScore(value, that.scoreGroup, that)
        })
        vue.$watch('connectFailed', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderFail(value, that.failGroup, that.buttonGroup, that)
        })
        // 渲染收、交贡
        vue.$watch('tribute.status', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            if(!vue.tribute.lord) {
                return
            }
            switch(value) {
                case 0:
                    renderTributePoker(that.tributeGroup, that)
                    break
                case 1:
                    renderTributeButton(that.tributeGroup, that.pokerGroup, that)
                    break
                case 2:
                    that.tributeGroup.clear(true, true)
                    break
            }
        })
        if(vue.tribute.lord) {
            switch(vue.tribute.status) {
                case 0:
                    renderTributePoker(that.tributeGroup, that)
                    break
                case 1:
                    renderTributeButton(that.tributeGroup, that.pokerGroup, that)
                    break
                default:
                    that.tributeGroup.clear(true, true)
                    break
            }
        }
        
        // 渲染收、交贡结果
        vue.$watch('tributeRes', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            renderTributeAni(value, that)
        })
        // 渲染系统连接中
        let connectText = that.add.text(percent2Px(35, true), percent2Px(40, false), '连接中，请稍候', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
        this.reconnectGroup.add(connectText)
        this.reconnectGroup.getChildren().forEach(child => {
            child.visible = false
        })
        vue.$watch('reconnecting', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            that.reconnectGroup.getChildren().forEach(child => {
                child.visible = value
            })
        })
        this.reconnectGroup.children.entries.forEach(child=> {
            child.setData('x', child.x)
            child.setData('y', child.y)
            adjustPos(child)
        })
        let audio = that.add.image(percent2Px(100, true)-percent2Px(toolPosition.size, false), percent2Px(toolPosition.mic.y, false), 'mute')
        audio.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
        audio.setInteractive()
        audio.on('pointerdown', ()=> {
            rtc.changeMute()
        })
        rtc.$watch('mute', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            if(value) {
                audio.setTexture('mute')
                audio.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
            } else {
                audio.setTexture('unmute')
                audio.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
            }
        })
        let sound = that.add.image(percent2Px(100, true)-percent2Px(toolPosition.size, false), percent2Px(toolPosition.sound.y, false), 'nosound')
        sound.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
        sound.setInteractive()
        sound.on('pointerdown', ()=> {
            rtc.changeSound()
        })
        rtc.$watch('sound', (value)=> {
            if(!that.scene.isActive()) {
                return
            }
            if(value) {
                sound.setTexture('sound')
                sound.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
            } else {
                sound.setTexture('nosound')
                sound.setDisplaySize(percent2Px(toolPosition.size, false), percent2Px(toolPosition.size, false))
            }
        })
        this.toolGroup.add(audio)
        this.toolGroup.add(sound)
        this.toolGroup.children.entries.forEach(child=> {
            child.setData('x', child.x)
            child.setData('y', child.y)
            adjustPos(child)
        })
        vue.updatePhaserStatus()
    }
    update() {

    }
}
  

class VerticalScene extends BaseScene {
    constructor() {
        super({key: "VerticalScene"})
    }
}

class LevelScene extends BaseScene {
    constructor() {
        super({key: "LevelScene"})
    }
}

// 封装初始化游戏为函数
function initGame() {
    let game = new Phaser.Game({
        type: Phaser.AUTO,
        scale: {
          mode: Phaser.Scale.EXACT_FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          parent: 'swimmingPlay',
          width: '100%',
          height: '100%'
        },
        scene: [VerticalScene, LevelScene]
      })
    return game
}

export default {
    setVue: function(_vue) {
        vue = _vue
    },
    setWebRTC: function(_rtc) {
        rtc = _rtc
    },
    setWindow: function(_width, _height, phone) {
        width = _width
        height = _height
        isPhone = phone
        // reRender()
    },
    initGame,
    getScenes: function() {
        return [BootScene, VerticalScene, LevelScene]
    }
}