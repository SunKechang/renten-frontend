<template>
    <div class="home">
        <div>
            <ion-phaser 
                v-bind:game.prop="game"
                v-bind:initialize.prop="initialize"
            />
        </div>
      <!-- <div v-if="roomInfo.roomId !== 0">房间信息：
        <div>房间id：{{roomInfo.roomId}}</div>
        <div>邀请好友：{{roomInfo.roomId}}</div>
      </div>
      <div v-for="(player) in players" :key="player.id" style="margin-top: 30px;">
        <div v-if="player.id === roomInfo.roomMaster">房主</div>
        <div v-if="player.id === selfInfo.id"><mark>玩家id：{{player.id}}</mark></div>
        <div v-else>玩家id：{{player.id}}</div>
        <div>玩家状态：</div>
        <div v-if="player.status == 0">未就绪</div>
        <div v-else-if="player.status == 1">已就绪</div>
        <div v-else-if="player.status == 2">游戏中</div>
        <div v-else-if="player.status == 3">明牌</div>
        <div v-else-if="player.status == 4">走了</div>
        <button v-if="player.id === selfInfo.id" @click="updateStatus(player.status)">{{ player.status == 0 ? '准备' : '取消准备'}}</button>
      </div>
      <div v-show="roomInfo.status >= 1">
        牌区
        <div style="display: flex; flex-direction: row;">
            <div v-for="(puke, index) in pukeInfo.puke" :key="index">
                <div>
                    <div v-if="puke.value <= 10">
                        {{puke.value}}
                    </div>
                    <div v-else-if="puke.value === 11">
                        J
                    </div>
                    <div v-else-if="puke.value === 12">
                        Q
                    </div>
                    <div v-else-if="puke.value === 13">
                        K
                    </div>
                    <div v-else>王</div>
                </div>
                <div>
                    <div v-if="puke.color === $global.color.spade">
                        黑桃
                    </div>
                    <div v-else-if="puke.color === $global.color.heart">
                        红桃
                    </div>
                    <div v-else-if="puke.color === $global.color.club">
                        梅花
                    </div>
                    <div v-else>方片</div>
                </div>
            </div>
        </div>
      </div>
      <div>
        状态栏
        <div v-show="roomInfo.restTime >= 0">
            剩余时间：{{ roomInfo.restTime }}
        </div>
        <div>操作：
            <button @click="showPoker">明牌</button>
        </div>
      </div> -->
      
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
    pokerGroup.incXY(percent2Px(20, true), percent2Px(70, false))
}

function addButton(content, widthPercent, heightPercent, that) {
    let button = that.add.sprite(percent2Px(widthPercent, true), percent2Px(heightPercent, false), 'button', 0)
    let text = that.add.text(0, 0, content, { fontSize: '32px', fill: '#ffffff' })
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
    for(let i=0;i<players.length;i++) {
        if(players[i].id === vue.selfInfo.id) {
            continue
        }
        let index = index2Pos(i)
        console.log(i, index)
        console.log(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y, false))
        let player = that.add.image(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y, false), 'player')
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
        console.log(status)
        let text = that.add.text(percent2Px(playerPosition[index].x, true), percent2Px(playerPosition[index].y+5, false), status, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
        if(players[i].puke !== undefined) {
            let pokerNum = that.add.text(percent2Px(playerPosition[index].x-5, true), percent2Px(playerPosition[index].y+5, false), players[i].puke.length, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
            playerGroup.add(pokerNum)
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
            this.load.spritesheet('button', 'http://8.130.97.117/red_ten/button.png', { frameWidth: 80, frameHeight: 20});
        },
        create: function() {
            let that = this
            let pokerGroup = this.add.group()
            let playerGroup = this.add.group()
            let buttonGroup = this.add.group()
            let timerGroup = this.add.group()
            let pokerButtonGroup = this.add.group()
            let lastPokerGroup = this.add.group()
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
            let url = this.add.text(percent2Px(70, true), percent2Px(5, false), vue.roomInfo.roomId, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
            vue.$watch('roomInfo.roomId', (value)=>{
                url.setText(value)
            })
            url.setInteractive()
            url.on('pointerdown', ()=> {
                let textarea = document.createElement('textarea');
                textarea.value = url.text;
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
                let pos = index2Pos(value.onTurnIndex)
                let restTime = this.add.text(percent2Px(timerPosition[pos].x + 4, true), percent2Px(timerPosition[pos].y, false), '', { fontSize: '24px', fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
                let timer = this.add.image(percent2Px(timerPosition[pos].x, true), percent2Px(timerPosition[pos].y, false), 'timer')
                timer.setDisplaySize(percent2Px(5, true), percent2Px(5, true))
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
                let passTemp = addButton('过', 60, 60, that)
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
                    console.log('chosenPokers')
                    console.log(chosenPokers)
                    vue.sendPoker(chosenPokers)
                })
                passTemp.button.setInteractive()
                passTemp.button.on('pointerdown', ()=> {
                    vue.sendPass()
                })
                pokerButtonGroup.add(cancelTemp.button)
                pokerButtonGroup.add(cancelTemp.text)
                pokerButtonGroup.add(runTemp.button)
                pokerButtonGroup.add(runTemp.text)
                pokerButtonGroup.add(passTemp.button)
                pokerButtonGroup.add(passTemp.text)
                if(vue.selfInfo.id !== 12) {
                    vue.sendPass()
                }
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
                lastPokerGroup.incXY(percent2Px(40, true), percent2Px(45, false))

                if(vue.playInfo.onTurnIndex !== vue.selfInfo.index) {
                    // let breakButton = addButton('叉', 50, 60, that)
                    // let backButton = addButton('勾', 50, 60, that)
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
                status: 0,  //0 等待 1 明牌阶段 2 出牌
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
            playInfo: {
                onTurnIndex: 0,
                restTime: 15,
            },
            lastPoker: {
                action: String,
                pokers: Array,
                playerIndex: 0,
            },
            idMap: new Map,
            initialize: false,
            game: game
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
        getIndexById(id) {
            return this.idMap.get(id)
        },
        onListen() {
            let that = this
            this.$global.ws.onmessage = mes => {
                let data = utils.decode(mes.data)
                let temp
                switch(data.info_type) {
                    case 'wait':
                        console.log('wait')
                        that.roomInfo.roomId = data.room_id
                        that.roomInfo.roomMaster = data.room_master
                        that.selfInfo.id = data.self_id
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
                        that.pukeInfo.puke = data.puke
                        that.roomInfo.status = 1
                        for(let i=0;i<that.players.length;i++) {
                            that.idMap.set(that.players[i].id, i)
                        }
                        break
                    case 'seen':
                        that.players = data.players
                        that.roomInfo.status = 1
                        that.playInfo.restTime = data.rest_time
                        that.playInfo.onTurnIndex = that.selfInfo.index
                        break
                    case 'player':
                        that.roomInfo.status = 2
                        temp = {
                            onTurnIndex: 0,
                            restTime: 15,
                        }
                        temp.onTurnIndex = that.getIndexById(data.on_turn)
                        temp.restTime = data.rest_time
                        that.playInfo = temp
                        that.players = data.players
                        that.selfInfo.status = data.players[that.getIndexById(that.selfInfo.id)].status
                        break
                    case 'card':
                        if (data.max_action.pokers.length === 0) {
                            return
                        }
                        temp = {
                            action: data.max_action.action,
                            pokers: data.max_action.pokers,
                            playerIndex: 0,
                        }
                        temp.playerIndex = that.getIndexById(data.max_player)
                        that.lastPoker = temp
                        break
                    case 'poker':
                        that.pukeInfo.puke = data.puke
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
                }
            }
        }
    },
    async mounted() {
        let that = this
        this.roomId = this.$route.query.room_id
        height = document.documentElement.clientHeight
        width = document.documentElement.clientWidth
        if (!this.$global.ws) {
            let socketUrl = "ws:"+location.host+ "/api/room/join"
            socketUrl = socketUrl.replace("https", "ws").replace("http", "ws")
            let websocket = new WebSocket(socketUrl)
            this.$global.setWs(websocket)
            await this.$global.send({room_id: this.roomId})
        }
        vue = this
        this.initialize = true
        setTimeout(()=> {
            that.updateStatus()
        }, 1000)
    }
}
</script>
