<template>
    <div class="home">
      <div v-if="roomInfo.roomId !== 0">房间信息：
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
      </div>
    </div>
  </template>
  
<script>
import utils from '../../utils/decode'
export default {
    name: 'RoomView',
    data() {
        return {
            players: Object,
            roomInfo: {
                roomId: 0,
                roomMaster: 0,
                status: 0,  //0 等待 1 明牌阶段 2 出牌
                restTime: -1,
            },
            selfInfo: {
                id: 0,
                userRole: -1, //-1 游客 0 被邀请者 1 房主
            },
            pukeInfo: {
                puke: [],
            }
        }
    },
    methods: {
        async updateStatus(status) {
            if(status === 1) {
                this.$global.ws.send(JSON.stringify({info_type: 'status', data: 0}))
                // this.$global.send({info_type: 'status', data: 0})
            } else {
                // this.$global.send({info_type: 'status', data: 1})
                this.$global.ws.send(JSON.stringify({info_type: 'status', data: 1}))
            }
        },
        num2Puke(num) {
            return {
                value: Math.floor(num/4) + 1,
                color: num%4
            }
        },
        showPoker() {
            this.$global.ws.send(JSON.stringify({info_type: 'seenCard', data: null}))
        }
    },
    async mounted() {
        let that = this
        this.roomId = this.$route.query.room_id
        if (!this.$global.ws) {
            let socketUrl = "ws:"+location.host+ "/api/room/join"
            socketUrl = socketUrl.replace("https", "ws").replace("http", "ws")
            let websocket = new WebSocket(socketUrl)
            this.$global.setWs(websocket)
            await this.$global.send({room_id: this.roomId})
        }
        
        this.$global.ws.onmessage = mes => {
            let data = utils.decode(mes.data)
            switch(data.info_type) {
                case 'wait': 
                    that.players = data.players
                    that.roomInfo.roomId = data.room_id
                    that.roomInfo.roomMaster = data.room_master
                    that.selfInfo.id = data.self_id
                    break
                case 'start':
                    for (let i =0;i<data.puke.length;i++) {
                        that.pukeInfo.puke.push(that.num2Puke(data.puke[i]))
                    }
                    this.roomInfo.status = 1
                    break
                case 'seen':
                    that.players = data.players
                    that.roomInfo.restTime = data.rest_time
                    break
                default: 
                alert("invalid message")
            }
        }

        setTimeout(function(){
            that.updateStatus(0)
        }, 500)
        
    }
}
</script>
