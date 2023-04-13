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
import phaser from '../../utils/game'
let pokerPage = 54
let smallKing = 13*4
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
            game: phaser.initGame(),    // 初始化游戏时每次获取新的变量
            reconnecting: false,   // 是否正在重连
            connectFailed: true,   // 当前连接是否失败
            beatInterval: null,  // 心跳循环
            reconnectTime: 0,   // 重连次数
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
            this.$router.push({
                path: "/"
            });
        },
        toReconnect() {
            let that = this
            this.reconnecting = true
            this.reconnectTime++
            if(this.reconnectTime > 3) {
                this.$message.error('与服务器失去连接')
                return
            }
            if(!that.connectFailed) {
                return
            }
            that.onListen()
        },
        async onListen() {
            let that = this
            if(!this.reconnecting) {
                if(this.$route.params.type === 'add') {
                    let socketUrl = "wss:"+window.location.host+ "/api/room/add"
                    socketUrl = socketUrl.replace("https", "wss").replace("http", "wss")
                    if(process.env.NODE_ENV === 'development') {
                        socketUrl = socketUrl.replace("wss", "ws")
                    }
                    let websocket = new WebSocket(socketUrl)
                    this.$global.setWs(websocket)
                }else if (this.$route.params.type === 'join') {
                    let socketUrl = "wss:"+window.location.host+ "/api/room/join"
                    socketUrl = socketUrl.replace("https", "wss").replace("http", "wss")
                    if(process.env.NODE_ENV === 'development') {
                        socketUrl = socketUrl.replace("wss", "ws")
                    }
                    let websocket = new WebSocket(socketUrl)
                    this.$global.setWs(websocket)
                    await this.$global.send({room_id: this.roomId})
                } else {
                    return
                }
            } else {
                let _id = this.selfInfo.id
                if(_id === 0) {
                    _id = sessionStorage.getItem('id')
                }
                let temp = 0
                if(typeof _id === "string") {
                    temp = parseInt(_id)
                } else if(typeof _id === "number") {
                    temp = _id
                } else {
                    return
                }
                let socketUrl = "wss:"+window.location.host+ "/api/room/reconnect"
                socketUrl = socketUrl.replace("https", "wss").replace("http", "wss")
                if(process.env.NODE_ENV === 'development') {
                    socketUrl = socketUrl.replace("wss", "ws")
                }
                let websocket = new WebSocket(socketUrl)
                this.$global.setWs(websocket)
                await this.$global.send({id: temp})
            }
            this.connectFailed = false
            this.reconnecting = false
            this.$global.ws.onerror = function() {
                console.log('服务器连接出错')
                that.connectFailed = true
                that.toReconnect() // 重连
            }

            this.$global.ws.onclose = function() {
                console.log('服务器连接关闭')
                that.connectFailed = true
            }
            
            this.$global.ws.onmessage = mes => {
                let data = utils.decode(mes.data)
                that.reconnectTime = 0  //连接成功，重置重连次数
                let temp
                switch(data.info_type) {
                    case 'wait':
                        that.roomInfo.status = -1
                        that.roomInfo.status = 0
                        that.roomInfo.roomId = data.room_id
                        that.roomInfo.roomMaster = data.room_master
                        that.selfInfo.id = data.self_id
                        window.sessionStorage.setItem('id', that.selfInfo.id)
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
        },
        setWindowInfo() {
            let max = document.documentElement.clientWidth, min = document.documentElement.clientHeight
            if(document.documentElement.clientHeight > document.documentElement.clientWidth) {
                max = document.documentElement.clientHeight
                min = document.documentElement.clientWidth
            }
            phaser.setWindow(max, min)
        },

        // 封装心跳机制函数
        beat() {
            localStorage.setItem('last-login', new Date().getTime())
            this.$global.send({info_type: 'test', data: null})
        }
    },
    mounted() {
        phaser.setVue(this)
        this.setWindowInfo()
        this.roomId = this.$route.query.room_id
        this.initialize = true
        this.beatInterval && clearInterval(this.beatInterval)
        let sessionId = sessionStorage.getItem('id')
        if(sessionId != null && sessionId > 0) {
            this.reconnecting = true
        } else {
            this.reconnecting = false
        }

        // 当用户长时间不使用该应用，但在此进入依然是/room/add时，可自动跳转至首页
        let lastLogin = localStorage.getItem('last-login')
        let nowDate = new Date().getTime()
        if(nowDate-lastLogin > 15000) {
            this.toCreateRoom()
        }
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
    beforeDestroy() {
        // 用户手动退出，关闭websocket连接
        if(this.$global.ws) {
            this.$global.ws.close(1000, "正常关闭")
        }
        this.$global.setWs(null)
        // 设置game为null，再次加载时获取新的game变量，解决BUG[再次进入/room界面空白]
        this.game = null
        this.beatInterval && clearInterval(this.beatInterval)
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
        // todo 细究这个心跳机制
        'connectFailed': {
            handler(val) {
                this.beatInterval && clearInterval(this.beatInterval)
                if(val || this.reconnecting) {
                    // 与服务器失去连接|正在重连，停止发送心跳
                    return
                }
                let that = this
                this.beatInterval = setInterval(()=> {
                    that.beat()
                }, 10000)
            }
        }
    }
}
</script>
<style scoped>
    .home {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
        background-color: wheat;
    }
</style>