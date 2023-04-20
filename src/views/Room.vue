<template>
    <div class="home">
        <ion-phaser 
            v-bind:game.prop="game"
            v-bind:initialize.prop="initialize"
        />
        <WebRTC :sessionId="selfInfo.id" ref="webRTC" @update-able="updateRTCstatux"></WebRTC>
    </div>
</template>
  
<script>
import WebRTC from '@/components/WebRTC.vue'
import utils from '../../utils/decode'
import phaser from '../../utils/game'
let pokerPage = 54
let smallKing = 13*4
export default {
    components: { WebRTC },
    name: 'RoomView',
    data() {
        return {
            players: Array,
            roomInfo: {
                roomId: 0,
                roomMaster: 0,
                status: 0,  //0 等待 1 开始 2 出牌 3 交贡
                scoreTime: 1,
            },
            selfInfo: {
                id: 0,
                userRole: -1, //-1 游客 0 被邀请者 1 房主
                index: 0,
                status: 0, // 当前玩家状态 0 未就绪 1 就绪 2 游戏中 3 明牌 4 走人 5 离线
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
            tribute: {
                status: -1,
                lord: false,
            },  // 该玩家的收、交贡情况
            tributeRes: null,   // 交贡结果
            able: {
                webRTCAble: false,
                mainAble: false,
                phaserAble: false,
            }
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
            let res = this.idMap.get(id)
            if(!res) {
                // 不存在就返回0
                res = 0
            }
            return res
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
                that.reconnecting = false
                return
            }
            if(!that.connectFailed) {
                that.reconnecting = false
                return
            }
            that.onListen()
        },
        // 检查额外操作：勾，叉是否成立
        checkExtra(temp) {
            this.action.back.able = false
            this.action.break.able = false
            if(temp.playerIndex !== this.selfInfo.index) {
                if(temp.pokers.length == 1) {
                    let ablePuke = []
                    for(let i=0;i<this.numPuke.length;i++) {
                        if(this.numPuke[i] === this.numPokerMap[temp.pokers[0]]) {
                            ablePuke.push(this.pukeInfo.puke[i])
                            if(ablePuke.length >= 2) {
                                let tempAction = {
                                    able: true,
                                    puke: ablePuke
                                }
                                this.action.break = tempAction
                                break
                            }
                        }
                    }
                }
                if(temp.action === 'break') {
                    for(let i=0;i<this.numPuke.length;i++) {
                        if(this.numPuke[i] === this.numPokerMap[temp.pokers[0]]) {
                            let tempAction = {
                                able: true,
                                puke: [this.pukeInfo.puke[i]]
                            }
                            this.action.back = tempAction
                            break
                        }
                    }
                }
            }
        },
        drawOne(poker) {
            this.pukeInfo.puke = this.pukeInfo.puke.filter(item=> item !== poker)
        },
        addOne(poker) {
            let index = 0
            for(let i=0;i<this.pukeInfo.puke.length;i++) {
                if(this.pukeInfo.puke[i] >= poker) {
                    index = i
                    break
                }
            }
            this.pukeInfo.puke.splice(index, 0, poker)
        },
        resetData() {
            this.tribute.status = -1
            this.roomInfo.status = 0
            this.action.back.able = false
            this.action.break.able = false
        },
        updateRTCstatux() {
            this.able.webRTCAble = true
        },
        updatePhaserStatus() {
            this.able.phaserAble = true
        },
        updateMainStatus() {
            this.able.mainAble = true
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
                localStorage.setItem('last-pong', new Date().getTime())
                if(mes.data === 'pong') {
                    return
                }
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
                        temp = {
                            onTurnIndex: that.getIndexById(data.on_turn),
                            restTime: data.rest_time,
                        }
                        that.playInfo = temp
                        break
                    case 'poker':
                        that.pukeInfo.puke = data.puke.sort(this.compare)
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

                        // 重置一局的数据
                        that.resetData()
                        break
                    case 'reconnect':
                        if(!data.success) {
                            that.connectFailed = true
                        } else {
                            that.pukeInfo.puke = data.poker.sort(this.compare)
                            if(data.last_poker.poker && data.last_poker.poker.length !== 0) {
                                temp = data.last_poker
                                temp.playerIndex = that.getIndexById(data.player_id)
                                that.lastPoker = temp
                            }
                            that.players = data.room_info.players
                            that.roomInfo.roomId = data.room_info.room_id
                            that.selfInfo.id = data.room_info.self_id
                            for(let i=0;i<that.players.length;i++) {
                                that.idMap.set(that.players[i].id, i)
                            }
                            that.tribute.lord = data.tribute_lord
                        }
                        break
                    case 'tributeStart':
                        that.roomInfo.status = 3
                        that.tribute.lord = data.tribute_lord
                        that.tribute.status = -1
                        that.tribute.status = 0
                        break
                    case 'tributeProc':
                        that.roomInfo.status = 3
                        // 补丁程序，服务端会定期发送当前收、交贡情况
                        if(that.tribute.status !== data.tribute_proc) {
                            that.tribute.status = data.tribute_proc
                        }
                        break
                    case 'tribute':
                        if(data.from === that.selfInfo.id) {
                            that.drawOne(data.poker)
                            that.tribute.status = 2
                            console.log(data.from, that.selfInfo.id)
                        } else if (data.to === that.selfInfo.id) {
                            that.addOne(data.poker)
                        }
                        temp = data
                        temp.fromIndex = that.getIndexById(temp.from)
                        temp.toIndex = that.getIndexById(temp.to)
                        that.tributeRes = temp
                        console.log(that.tributeRes)
                        break
                    case 'RTCJoin':
                        that.$refs.webRTC.oneJoined(data.players, data.session_id, data.player_id)
                        break
                    case 'RTCMessage':
                        console.log(data)
                        if(!that.$refs.webRTC.webRTC) {
                            console.error('设备不支持语音通话')
                            return
                        }
                        switch(data.data.type) {
                            case that.$global.offer:
                                that.$refs.webRTC.oneOffered(data.data)
                                break
                            case that.$global.answer:
                                that.$refs.webRTC.oneAnswered(data.data)
                                break
                            case that.$global.ice:
                                that.$refs.webRTC.oneIced(data.data)
                                break
                        }
                        break
                    case 'RTCLeave':
                        that.$refs.oneLeaved(data.session_id)
                        break
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
            let lastPong = localStorage.getItem('last-pong')
            let nowDate = new Date().getTime()
            if(nowDate-lastPong > 19000) {
                // 19秒收不到pong就重连
                if(!this.reconnecting) {
                    this.connectFailed = true
                    this.toReconnect()
                }
            }
            this.$global.send('ping')
        },
        // 发起收贡请求
        oneTributeChosen() {
            this.$global.send({info_type: 'getTribute', data: null})
        },
        oneTributeBack(poker) {
            this.$global.send({info_type: 'backTribute', data: poker})
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
            this.selfInfo.id = sessionId
        } else {
            this.reconnecting = false
        }

        // 当用户长时间不使用该应用，但在此进入依然是/room/add时，可自动跳转至首页
        let lastLogin = localStorage.getItem('last-pong')
        let nowDate = new Date().getTime()
        if(nowDate-lastLogin > 60000) {
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
        this.updateMainStatus()
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
        this.able.webRTCAble = false
        this.able.mainAble = false
        this.able.phaserAble = false
    },
    watch: {
        'pukeInfo.puke': {
            handler(val) {
                this.numPuke = []
                let that = this
                val.forEach(num=> {
                    that.numPuke.push(this.numPokerMap[num])                    
                })
                this.checkExtra(this.lastPoker)
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
                }, 5000)
            }
        },
        'lastPoker': {
            handler(val) {
                this.checkExtra(val)
            }
        },
        'able': {
            handler: function() {
                if(this.able.webRTCAble && this.able.mainAble && this.able.phaserAble) {
                    this.onListen()
                }
            },
            deep: true
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