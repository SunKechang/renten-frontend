<template>
    <div class="home">
        <ion-phaser 
            v-bind:game.prop="game"
            v-bind:initialize.prop="initialize"
        />
    </div>
  </template>
  
<script>
import utils from '../../utils/decode'
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
    {x: 30, y: 60},     // 自己
]

let pokerPosition = [
    {x: 15, y: 35},     // 0号位置
    {x: 42, y: 17},      // 1号位置
    {x: 60, y: 35},     // 2号位置
    {x: 40, y: 35},     // 自己
]

let pokerPage = 54
let smallKing = 13*4

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
    for (let i=0;i<vue.pukeInfo.puke.length;i++) {
        let poker = that.add.image(i*percent2Px(5, true), percent2Px(1, false), 'pokers', vue.pukeInfo.puke[i])
        poker.setDisplaySize(percent2Px(10, true), percent2Px(25, false))
        poker.setInteractive()
        poker.setData('chosen', false)
        poker.setData('changed', false)
        poker.setData('value', vue.pukeInfo.puke[i])
        poker.on("pointerdown", () => {
            poker.setData('changed', true)
            poker.setData('chosen', !poker.getData('chosen'))
        })
        poker.on("pointermove", (pointer) => {
            if(pointer.isDown && !poker.getData('changed')) {
                poker.setData('changed', true)
                poker.setData('chosen', !poker.getData('chosen'))
            }
        })
        poker.on('changedata-chosen', (gameObject, value)=> {
            let step = 0
            if(value) {
                step -= 50
            }
            that.tweens.add({ targets: gameObject, y: percent2Px(71, false) + step, duration: 150 });
        })
        pokerGroup.add(poker)
    }
    that.input.on("pointerup", ()=> {
        let children = pokerGroup.getChildren();
        children.forEach(function(child){
            child.setData('changed', false)
        })
    })
    pokerGroup.incXY(percent2Px(15, true), percent2Px(70, false))
}

function addButton(content, widthPercent, heightPercent, that) { 
    let button = that.add.sprite(percent2Px(widthPercent, true), percent2Px(heightPercent, false), 'button')
    let text = that.add.text(0, 0, content, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', fontSize: '32px', fill: 'black' })
    button.setDisplaySize(text.width + 20, text.height + 20)
    text.setOrigin(0.5)
    text.setX(button.x)
    text.setY(button.y)
    button.setInteractive()
    button.on('pointerdown', ()=>{
        button.setFrame(1, true, true)
    })
    button.on('pointerup', ()=>{
        button.setFrame(0, true, true)
    })
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



let game = {
    width: "100%",
    height: "100%",
    type: Phaser.AUTO,
    scene: {
        preload: function() {
            this.cameras.main.setBackgroundColor('#24252A')
            this.load.atlas('pokers', 'http://8.130.97.117/red_ten/pokers.png', 'http://8.130.97.117/red_ten/pokers.json');
            this.load.image('player', 'http://8.130.97.117/red_ten/player.png')
            this.load.image('timer', 'http://8.130.97.117/red_ten/timer.png')
            this.load.image('car_back', 'http://8.130.97.117/red_ten/car_back.jpg')
            this.load.image('button', 'http://8.130.97.117/red_ten/button.png')
            // this.load.spritesheet('button', 'http://8.130.97.117/red_ten/button.png', { frameWidth: 80, frameHeight: 20});
        },
        create: function() {
            let that = this
            let pokerGroup = this.add.group()
            let playerGroup = this.add.group()
            let buttonGroup = this.add.group()
            let timerGroup = this.add.group()
            let pokerButtonGroup = this.add.group()
            let lastPokerGroup = this.add.group()
            let scoreGroup = this.add.group()
            let extraGroup = this.add.group()
            let backGroup = this.add.group()
            let scoreTimeGroup = this.add.group()
            let back = this.add.image(percent2Px(50, true), percent2Px(50, false), 'car_back')
            back.setDisplaySize(percent2Px(100, true), percent2Px(100, false))
            backGroup.add(back)
            // this.cameras.main.centerOn(percent2Px(50, true), percent2Px(50, false))
            // 清屏
            vue.$watch('roomInfo.status', (value)=> {
                if(value === 1) {
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
                pokerGroup.clear(true, true)
                addPoker(that, pokerGroup)
            })

            // 渲染分享链接
            let url = this.add.text(percent2Px(80, true), percent2Px(5, false), vue.roomInfo.roomId, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
            vue.$watch('roomInfo.roomId', (value)=>{
                url.setText(value)
            })
            url.setInteractive()
            url.on('pointerdown', ()=> {
                let textarea = document.createElement('textarea');
                textarea.value = 'http://' + window.location.host + '/room/join?room_id=' + url.text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            })

            // 渲染游戏按钮
            vue.$watch('players', ()=>{
                renderPlayButton(buttonGroup, pokerButtonGroup, that)
            })
            
            // 渲染计时器
            vue.$watch('playInfo', ()=> {
                let value = vue.playInfo
                timerGroup.clear(true, true)
                if(value.onTurnIndex === -1) {
                    return
                }
                let pos = index2Pos(value.onTurnIndex)
                let restTime = this.add.text(percent2Px(timerPosition[pos].x + 2, true), percent2Px(timerPosition[pos].y, false), '', { fontSize: '24px', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
                let timer = this.add.image(percent2Px(timerPosition[pos].x, true), percent2Px(timerPosition[pos].y, false), 'timer')
                timer.setDisplaySize(percent2Px(4, true), percent2Px(4, true))
                restTime.setText(vue.playInfo.restTime)
                restTime.setOrigin(0.5)
                timerGroup.add(timer)
                timerGroup.add(restTime)

                if(value.onTurnIndex !== vue.selfInfo.index || vue.roomInfo.status!== 2) {
                    return
                }
                pokerButtonGroup.clear(true, true)
                let cancelTemp = addButton('重选', 40, 60, that)
                let runTemp = addButton('出牌', 50, 60, that)
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
                if(vue.lastPoker.action !== 'nextTurn') {
                    let passTemp = addButton('过', 60, 60, that)
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
                
            }, {
                deep: true
            })

            vue.$watch('lastPoker', (value)=> {
                lastPokerGroup.clear(true, true)
                for(let i=0;i<value.pokers.length;i++) {
                    let poker = that.add.image(i*percent2Px(3, true), percent2Px(1, false), 'pokers', value.pokers[i])
                    poker.setDisplaySize(percent2Px(7, true), percent2Px(20, false))
                    lastPokerGroup.add(poker)
                }
                let pos = index2Pos(value.playerIndex)
                lastPokerGroup.incXY(percent2Px(pokerPosition[pos].x, true), percent2Px(pokerPosition[pos].y))
            })
            vue.$watch('roomInfo.scoreTime', (value)=> {
                scoreTimeGroup.clear(true, true)
                let scoreTime = that.add.text(percent2Px(80, true), percent2Px(15, false), value+'倍', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif', color: 'white'})
                scoreTimeGroup.add(scoreTime)
            })
            vue.$watch('action', (value)=> {
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
                console.log(value)
            },{
                deep: true
            })
            vue.$watch('scoreInfo', (value)=> {
                renderScore(value, scoreGroup, that)
            })
            vue.$watch('connectFailed', (value)=> {
                if(value) {
                    that.add.text(percent2Px(50, true), percent2Px(50, false), '重连失败，您可以点击按钮创建房间', { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'})
                    let createTemp = addButton('创建房间', 50, 60, that)
                    createTemp.button.setInteractive()
                    createTemp.button.on('pointerdown', ()=> {
                        vue.toCreateRoom()
                    })
                }
            })
            vue.onListen()
        },
        update: function() {
        },
    }
}
export default {
    name: 'RoomView',
    data() {
        return {
            players: Object,
            roomInfo: {
                roomId: 0,
                roomMaster: 0,
                status: 0,  //0 等待 1 开始 2 出牌
                scoreTime: 1,
            },
            selfInfo: {
                id: 0,
                userRole: -1, //-1 游客 0 被邀请者 1 房主
                index: 0,
                status: 0, // 当前玩家状态
            },
            pukeInfo: {
                puke: [],
            },
            numPuke: [],
            playInfo: {
                onTurnIndex: 0,
                restTime: 15,
            },
            lastPoker: {
                action: String,
                pokers: Array,
                playerIndex: 0,
            },
            scoreInfo: {
                players: [],
                result: '',
            },
            action: {
                back: {
                    able: false,
                    puke: [],
                },
                break: {
                    able: false,
                    puke: []
                },
            },
            idMap: new Map,
            numPokerMap: Array,
            initialize: false,
            game: game,
            reconnect: false,
            connectFailed: false,
            heartBeat: false,
        }
    },
    methods: {
        updateStatus() {
            if(this.selfInfo.status === 1) {
                this.$global.ws.send(JSON.stringify({info_type: 'status', data: 0}))
            } else {
                this.$global.ws.send(JSON.stringify({info_type: 'status', data: 1}))
            }
        },
        updataSeen() {
            this.$global.ws.send(JSON.stringify({info_type: 'play', data: {action: 'seenCard', pokers: []}}))
        },
        num2Puke(num) {
            return {
                value: Math.floor(num/4) + 1,
                color: num%4
            }
        },
        sendPoker(pokers) {
            this.$global.ws.send(JSON.stringify({info_type: 'play', data: {action: 'follow', pokers: pokers}}))
        },
        sendPass() {
            this.$global.ws.send(JSON.stringify({info_type: 'play', data: {action: 'pass', pokers: []}}))
        },
        sendBreak() {
            this.$global.ws.send(JSON.stringify({info_type: 'play', data: {action: 'break', pokers: this.action.break.puke}}))
            this.action.break.able = false
        }, 
        sendBack() {
            this.$global.ws.send(JSON.stringify({info_type: 'play', data: {action: 'back', pokers: this.action.back.puke}}))
            this.action.back.able = false
        }, 
        getIndexById(id) {
            return this.idMap.get(id)
        },
        compare(a, b) {
            return this.numPokerMap[a] - this.numPokerMap[b]
        },
        toCreateRoom() {
            this.$router.replace(window.location.host + '/room/add?reconnect=false')
        },
        async onListen() {
            let that = this
            if(!this.reconnect) {
                if(this.$route.params.type === 'add') {
                    let socketUrl = "ws:"+window.location.host+ "/api/room/add"
                    socketUrl = socketUrl.replace("https", "ws").replace("http", "ws")
                    let websocket = new WebSocket(socketUrl)
                    this.$global.setWs(websocket)
                }else if (this.$route.params.type === 'join') {
                    let socketUrl = "ws:"+window.location.host+ "/api/room/join"
                    socketUrl = socketUrl.replace("https", "ws").replace("http", "ws")
                    let websocket = new WebSocket(socketUrl)
                    this.$global.setWs(websocket)
                    await this.$global.send({room_id: this.roomId})
                } else {
                    return
                }
            } else {
                let socketUrl = "ws:"+window.location.host+ "/api/room/reconnect"
                socketUrl = socketUrl.replace("https", "ws").replace("http", "ws")
                let websocket = new WebSocket(socketUrl)
                this.$global.setWs(websocket)
                await this.$global.send({id: localStorage.getItem('id')})
            }
            
            this.$global.ws.onmessage = mes => {
                let data = utils.decode(mes.data)
                let temp
                switch(data.info_type) {
                    case 'wait':
                        that.roomInfo.status = -1
                        that.roomInfo.status = 0
                        that.roomInfo.roomId = data.room_id
                        that.roomInfo.roomMaster = data.room_master
                        that.selfInfo.id = data.self_id
                        window.localStorage.setItem('id', that.selfInfo.id)
                        window.localStorage.setItem('lastOnline', new Date().getTime()/1000)
                        for(let i=0;i<data.players.length;i++) {
                            if(data.players[i].id === that.selfInfo.id) {
                                that.selfInfo.index = i
                                that.selfInfo.status = data.players[i].status
                                break
                            }
                        }
                        that.players = data.players
                        break
                    case 'start':
                        that.pukeInfo.puke = data.puke.sort(this.compare)
                        that.roomInfo.status = 1
                        for(let i=0;i<that.players.length;i++) {
                            that.idMap.set(that.players[i].id, i)
                        }
                        break
                    case 'player':
                        that.roomInfo.status = 2
                        temp = {
                            onTurnIndex: that.getIndexById(data.on_turn),
                            restTime: 15,
                        }
                        temp.restTime = data.rest_time
                        that.playInfo = temp
                        that.players = data.players
                        that.selfInfo.status = data.players[that.getIndexById(that.selfInfo.id)].status
                        break
                    case 'card':
                        if (data.max_action.pokers.length === 0) {
                            return
                        }
                        that.roomInfo.scoreTime = data.score_times
                        temp = {
                            action: data.max_action.action,
                            pokers: data.max_action.pokers,
                            playerIndex: 0,
                        }
                        temp.playerIndex = that.getIndexById(data.max_player)
                        that.lastPoker = temp
                        that.action.back.able = false
                        that.action.break.able = false
                        if(temp.playerIndex !== this.selfInfo.index) {
                            if(temp.pokers.length == 1) {
                                let ablePuke = []
                                for(let i=0;i<that.numPuke.length;i++) {
                                    if(that.numPuke[i] === that.numPokerMap[temp.pokers[0]]) {
                                        ablePuke.push(that.pukeInfo.puke[i])
                                        if(ablePuke.length >= 2) {
                                            let tempAction = {
                                                able: true,
                                                puke: ablePuke
                                            }
                                            that.action.break = tempAction
                                            break
                                        }
                                    }
                                }
                            }
                            if(temp.action === 'break') {
                                for(let i=0;i<that.numPuke.length;i++) {
                                    if(that.numPuke[i] === that.numPokerMap[temp.pokers[0]]) {
                                        let tempAction = {
                                            able: true,
                                            puke: [that.pukeInfo.puke[i]]
                                        }
                                        that.action.back = tempAction
                                        break
                                    }
                                }
                            }
                        }
                        break
                    case 'poker':
                        that.pukeInfo.puke = data.puke.sort(this.compare)
                        console.log('sorted')
                        console.log(that.pukeInfo.puke)
                        console.log(data.puke)
                        break
                    case 'useless':
                        alert('无效牌')
                        break
                    case 'nextTurn':
                        temp = {
                            action: "nextTurn",
                            pokers: [],
                            playerIndex: 0,
                        },
                        that.lastPoker = temp
                        break
                    case 'score':
                        that.roomInfo.scoreTime = 1
                        that.playInfo.onTurnIndex = -1
                        temp =  {
                            players: data.players,
                            result: data.result,
                        }
                        that.scoreInfo = temp
                        break
                    case 'reconnect':
                        if(!data.success) {
                            that.connectFailed = true
                        }
                }
            }
        }
    },
    async mounted() {
        this.roomId = this.$route.query.room_id
        height = document.documentElement.clientHeight
        width = document.documentElement.clientWidth
        vue = this

        this.initialize = true
        // let reconnect = this.$route.query.reconnect
        // if(reconnect != undefined && !reconnect) {
        //     this.reconnect = false
        // } else {
        //     // 三分钟内离线可重连
        //     let lastTime = localStorage.getItem('lastOnline')
        //     let nowTime = new Date().getTime() / 1000
        //     if(lastTime != undefined && nowTime-lastTime < 180) {
        //         this.reconnect = true
        //     }
        // }
        
        
        // 创建数字到牌点数的map
        let map = new Array(pokerPage)
        for (let i = 0; i < map.length; i++) {
            let temp = 0
            if (i > 51) {
                if (i == smallKing) {
                    temp = 14
                } else {
                    temp = 15
                }
            } else {
                temp = Math.floor(i / 4) - 1
                if (temp <= 0) {
                    temp += 13
                }
            }
            map[i] = temp
        }
        this.numPokerMap = map
    },
    watch: {
        'pukeInfo.puke': {
            handler(val) {
                this.numPuke = []
                let that = this
                val.forEach(num=> {
                    that.numPuke.push(this.numPokerMap[num])                    
                })
            }
        },
        'roomInfo.status': {
            handler(val) {
                let that = this
                let interval
                if(val < 1) {
                    if(!this.heartBeat) {
                        interval = setInterval(()=> {
                            that.$global.ws.send(JSON.stringify({info_type: 'test', data: null}))
                            console.log('sent')
                        }, 10000)
                        this.heartBeat = true
                    }
                } else {
                    if(this.heartBeat) {
                        clearInterval(interval)
                        this.heartBeat = false
                    }
                }
            },
            deep: true
        }
    }
}
</script>
<style scoped>
    .home {
        padding: 0;
        margin: 0;
        border: 0;
        background-color: blue;
    }
</style>