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
        <div>玩家状态：{{player.status == 1 ? '已就绪' : '未就绪'}}</div>
        <button v-if="player.id === selfInfo.id" @click="updateStatus(player.status)">{{ player.status == 0 ? '准备' : '取消准备'}}</button>
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
            },
            selfInfo: {
                id: 0,
                userRole: -1, //-1 游客 0 被邀请者 1 房主
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
            console.log("recv data")
            console.log(data)
            switch(data.info_type) {
                case 'wait': 
                    that.players = data.players
                    that.roomInfo.roomId = data.room_id
                    that.roomInfo.roomMaster = data.room_master
                    that.selfInfo.id = data.self_id
                    break
                default: 
                alert("invalid message")
            }
            
            
        }
    }
}
</script>
