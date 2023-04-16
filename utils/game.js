
import Phaser from 'phaser'
let vue
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

let backPoker = 54  // 背面牌

let pokerGroup
let playerGroup
let buttonGroup
let timerGroup
let pokerButtonGroup
let lastPokerGroup
let scoreGroup
let extraGroup
let backGroup
let scoreTimeGroup
let failGroup
let shareGroup
let tributeGroup

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

function addPoker(that, pokerGroup) {
    pokerGroup.clear(true, true)
    for (let i=0;i<vue.pukeInfo.puke.length;i++) {
        let x = i*5+15
        let poker = that.add.image(percent2Px(x, true), percent2Px(70, false), 'pokers', vue.pukeInfo.puke[i])
        poker.setDisplaySize(percent2Px(10, true), percent2Px(25, false))
        poker.setInteractive()
        poker.setData('chosen', false)
        poker.setData('changed', false)
        poker.setData('value', vue.pukeInfo.puke[i])
        poker.setData('position', {x: x, y: 70})
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
            that.tweens.add({ targets: gameObject, y: percent2Px(70 + step, false), duration: 150 });
        })
        pokerGroup.add(poker)
    }
    that.input.on("pointerup", ()=> {
        let children = pokerGroup.getChildren();
        children.forEach(function(child){
            child.setData('changed', false)
        })
    })
}

function addButton(content, widthPercent, heightPercent, that) { 
    let button = that.add.sprite(percent2Px(widthPercent, true), percent2Px(heightPercent, false), 'button')
    let text = that.add.text(0, 0, content, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', fontSize: '24px', fill: 'black' })
    button.setDisplaySize(text.width + 20, text.height + 10)
    text.setOrigin(0.5)
    text.setX(button.x)
    text.setY(button.y)
    button.setInteractive()
    button.on('pointerdown', ()=>{
        // button.setFrame(1, true, true)
    })
    button.on('pointerup', ()=>{
        // button.setFrame(0, true, true)
    })
    button.setData('position', {x: widthPercent, y: heightPercent})
    text.setData('position', {x: button.x, y: button.y})
    text.setData('content', content)
    return {button, text}
}

function renderPlayer(players, playerGroup, that) {
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
            temp.button.on('pointerdown', ()=> {
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
}

function renderBack(backGroup, that) {
    backGroup.clear(true, true)
    let back = that.add.image(percent2Px(50, true), percent2Px(50, false), 'car_back')
    back.setDisplaySize(percent2Px(100, true), percent2Px(100, false))
    back.setPosition(width/2, height/2)

    // 添加返回至首页按钮
    let temp = addButton('首页', 70, 10, that)
    temp.button.on('pointerdown', ()=> {
        vue.toCreateRoom()
    })
    backGroup.add(back)
    backGroup.add(temp.button)
    backGroup.add(temp.text)
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
}

function renderTimer(value, timerGroup, pokerGroup, pokerButtonGroup, that) {
    timerGroup.clear(true, true)
    if(value.onTurnIndex === -1) {
        return
    }
    let time1 = new Date().getTime()
    let pos = index2Pos(value.onTurnIndex)
    let restTime = that.add.text(percent2Px(timerPosition[pos].x + 2, true), percent2Px(timerPosition[pos].y, false), '', { fontSize: '24px', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
    let timer = that.add.image(percent2Px(timerPosition[pos].x, true), percent2Px(timerPosition[pos].y, false), 'timer')
    timer.setDisplaySize(percent2Px(4, true), percent2Px(4, true))
    restTime.setText(vue.playInfo.restTime)
    restTime.setOrigin(0.5)
    timerGroup.add(timer)
    timerGroup.add(restTime)

    if(value.onTurnIndex !== vue.selfInfo.index || vue.roomInfo.status!== 2) {
        return
    }
    pokerButtonGroup.clear(true, true)
    let cancelTemp = addButton('重选', 25, 60, that)
    let runTemp = addButton('出牌', 40, 60, that)
    cancelTemp.button.setInteractive()
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
    let time2 = new Date().getTime()
    console.log(time2-time1)
    if(vue.lastPoker.action !== 'nextTurn') {
        let passTemp = addButton('过', 55, 60, that)
        passTemp.button.setInteractive()
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
}

function renderLastPoker(value, lastPokerGroup, that) {
    lastPokerGroup.clear(true, true)
    console.log("rendering")
    console.log(value)
    for(let i=0;i<value.pokers.length;i++) {
        let poker = that.add.image(i*percent2Px(3, true), percent2Px(1, false), 'pokers', value.pokers[i])
        poker.setDisplaySize(percent2Px(7, true), percent2Px(20, false))
        lastPokerGroup.add(poker)
    }
    let pos = index2Pos(value.playerIndex)
    lastPokerGroup.incXY(percent2Px(pokerPosition[pos].x, true), percent2Px(pokerPosition[pos].y))
}

function renderScoreTime(value, scoreTimeGroup, that) {
    scoreTimeGroup.clear(true, true)
    let scoreTime = that.add.text(percent2Px(80, true), percent2Px(15, false), value+'倍', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'white'})
    scoreTimeGroup.add(scoreTime)
}

function renderExtraButton(value, extraGroup, that) {
    extraGroup.clear(true, true)
    if(value.break.able) {
        let breakTemp = addButton('叉', 70, 60, that)
        breakTemp.button.setInteractive()
        breakTemp.button.on('pointerdown', ()=> {
            vue.sendBreak()
        })
        extraGroup.add(breakTemp.button)
        extraGroup.add(breakTemp.text)
    } else if (value.back.able) {
        let backTemp = addButton('钩', 70, 60, that)
        backTemp.button.setInteractive()
        backTemp.button.on('pointerdown', ()=> {
            vue.sendBack()
        })
        extraGroup.add(backTemp.button)
        extraGroup.add(backTemp.text)
    }
}

function renderFail(value, failGroup, buttonGroup, that) {
    failGroup.clear(true, true)
    buttonGroup.clear(true, true)
    if(value) {
        let connectText = that.add.text(percent2Px(30, true), percent2Px(40, false), '重连失败，您可以返回首页重新进入', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
        let createTemp = addButton('重新进入', 50, 60, that)
        createTemp.button.setInteractive()
        createTemp.button.on('pointerdown', ()=> {
            vue.toCreateRoom()
        })
        failGroup.add(connectText)
        failGroup.add(createTemp.button)
        failGroup.add(createTemp.text)
    }
}

function renderTributePoker(tributeGroup, that) {
    tributeGroup.clear(true, true)
    let y = 30
    console.log("rendering")
    for(let i=0;i<13;i++) {
        let x = i*5 + 15
        let poker = that.add.image(percent2Px(x, true), percent2Px(y, false), 'pokers', backPoker)
        poker.setDisplaySize(percent2Px(10, true), percent2Px(25, false))
        poker.setInteractive()
        poker.setData('chosen', false)
        poker.setData('type', 'backPoker')
        poker.setData('position', {x: x, y: y})
        poker.setData('size', {w: 10, h: 25})
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
            that.tweens.add({ targets: gameObject, y: percent2Px(y + step, false), duration: 150 });
        })
        tributeGroup.add(poker)
    }
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
}

function renderTributeAni(value, that) {
    let index = index2Pos(value.fromIndex)
    let poker = that.add.image(percent2Px(timerPosition[index].x, true), percent2Px(timerPosition[index].y, false), 'pokers', value.poker)
    poker.setDisplaySize(percent2Px(7, true), percent2Px(17, false))
    index = index2Pos(value.toIndex)
    that.tweens.add({ 
        targets: poker, 
        x: percent2Px(timerPosition[index].x, true), 
        y: percent2Px(timerPosition[index].y, false), 
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

// 重新渲染整个页面
// function reRender() {
//     if(backGroup && backGroup.children) {
//         backGroup.children.iterate(function(child) {
//             child.setPosition(width/2, height/2)
//             child.setDisplaySize(percent2Px(100, true), percent2Px(100, false))
//         })
//     }
//     if(buttonGroup && buttonGroup.children) {
//         buttonGroup.children.iterate(function(child) {
//             let pos = child.getData('position')
//             child.setPosition(percent2Px(pos.x, true), percent2Px(pos.y, false))
//             if(child.getData('content')) {
//                 child.setText(child.getData('content'))
//             }
//         })
//     }
// }

function changeGroupVisible(group, visible) {
    group.getChildren().forEach(child=> {
        child.visible = visible
    })
}


// 封装初始化游戏为函数
function initGame() {
    let game = {
        width: "100%",
        height: "100%",
        type: Phaser.AUTO,
        scene: {
            preload: function() {
                this.cameras.main.setBackgroundColor('#24252A')
                if(process.env.NODE_ENV === 'development') {
                    this.load.atlas('pokers', 'http://8.130.97.117:88/pokers.png', 'http://8.130.97.117:88/pokers.json');
                    this.load.image('player', 'http://8.130.97.117:88/player.png')
                    this.load.image('timer', 'http://8.130.97.117:88/timer.png')
                    this.load.image('car_back', 'http://8.130.97.117:88/car_back.jpg')
                    this.load.image('button', 'http://8.130.97.117:88/button.png')
                } else {
                    this.load.atlas('pokers', '/resource/pokers.png', '/resource/pokers.json');
                    this.load.image('player', '/resource/player.png')
                    this.load.image('timer', '/resource/timer.png')
                    this.load.image('car_back', '/resource/car_back.jpg')
                    this.load.image('button', '/resource/button.png')
                }
                
                // this.load.spritesheet('button', 'http://8.130.97.117/red_ten/button.png', { frameWidth: 80, frameHeight: 20});
            },
            create: function() {
                let that = this
                this.scale.resize(width, height)
                pokerGroup = this.add.group()
                playerGroup = this.add.group()
                buttonGroup = this.add.group()
                timerGroup = this.add.group()
                pokerButtonGroup = this.add.group()
                lastPokerGroup = this.add.group()
                scoreGroup = this.add.group()
                extraGroup = this.add.group()
                backGroup = this.add.group()
                scoreTimeGroup = this.add.group()
                failGroup = this.add.group()
                shareGroup = this.add.group()
                tributeGroup = this.add.group()
                let reconnectGroup = this.add.group()
                // 渲染背景
                renderBack(backGroup, this)
                console.log("loaded back")
    
                vue.$watch('roomInfo.status', (value)=> {
                    if(value === 1) {
                        //游戏开始，清屏
                        pokerGroup.clear(true, true)
                        timerGroup.clear(true, true)
                        pokerButtonGroup.clear(true, true)
                        lastPokerGroup.clear(true, true)
                        scoreGroup.clear(true, true)
                        extraGroup.clear(true, true)
                    }
                })
                // 渲染玩家状态
                vue.$watch('players', (value)=> {
                    renderPlayer(value, playerGroup, that)
                })
    
                // 渲染扑克
                vue.$watch('pukeInfo.puke', ()=> {
                    addPoker(that, pokerGroup)
                })
    
                // 渲染分享链接
                vue.$watch('roomInfo.roomId', (value)=>{
                    renderShare(value, shareGroup, that)
                })
                
    
                // 渲染游戏按钮
                vue.$watch('players', ()=>{
                    failGroup.clear(true, true)
                    renderPlayButton(buttonGroup, pokerButtonGroup, that)
                })
                
                // 渲染计时器
                vue.$watch('playInfo', ()=> {
                    let value = vue.playInfo
                    renderTimer(value, timerGroup, pokerGroup, pokerButtonGroup, that)
                }, {
                    deep: true
                })
    
                // 渲染上一张牌
                vue.$watch('lastPoker', (value)=> {
                    renderLastPoker(value, lastPokerGroup, that)
                })
    
                // 渲染倍数
                vue.$watch('roomInfo.scoreTime', (value)=> {
                    renderScoreTime(value, scoreTimeGroup, that)
                })
    
                // 渲染额外操作按钮
                vue.$watch('action', (value)=> {
                    renderExtraButton(value, extraGroup, that)
                },{
                    deep: true
                })
                vue.$watch('scoreInfo', (value)=> {
                    changeGroupVisible(buttonGroup, false)
                    changeGroupVisible(extraGroup, false)
                    renderScore(value, scoreGroup, that)
                })
                vue.$watch('connectFailed', (value)=> {
                    renderFail(value, failGroup, buttonGroup, that)
                })
                // 渲染收、交贡
                vue.$watch('tribute.status', (value)=> {
                    if(!vue.tribute.lord) {
                        return
                    }
                    switch(value) {
                        case 0:
                            renderTributePoker(tributeGroup, that)
                            break
                        case 1:
                            renderTributeButton(tributeGroup, pokerGroup, that)
                            break
                        case 2:
                            tributeGroup.clear(true, true)
                            break
                    }
                })

                // 渲染收、交贡结果
                vue.$watch('tributeRes', (value)=> {
                    renderTributeAni(value, that)
                })
                // 渲染系统连接中
                let connectText = that.add.text(percent2Px(35, true), percent2Px(40, false), '连接中，请稍候', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
                reconnectGroup.add(connectText)
                reconnectGroup.getChildren().forEach(child => {
                    child.visible = false
                })
                vue.$watch('reconnecting', (value)=> {
                    console.log('watch reconnecting', value)
                    reconnectGroup.getChildren().forEach(child => {
                        child.visible = value
                    })
                })
                vue.onListen()
            },
            update: function() {
            },
        }
    }
    return game
}

export default {
    setVue: function(_vue) {
        vue = _vue
    },
    setWindow: function(_width, _height) {
        width = _width
        height = _height
        // reRender()
    },
    initGame,
}