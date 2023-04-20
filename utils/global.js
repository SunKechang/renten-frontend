export default {
    ws: null,
    setWs: function(newWs) {
        this.ws = newWs
    },
    send: function(data) {
        console.error("send")
        console.error(data)
        if(!this.ws || this.ws === undefined || this.ws === null) {
            return
        }
        let that = this
        let temp
        if(data !== 'ping') {
            temp = JSON.stringify(data)
        } else {
            temp = 'ping'
        }
        if(this.ws.readyState === 1) {
            console.error('sending')
            this.ws.send(temp)
        } else if(this.ws.readyState === 0) {   // 当连接处于出错状态时拒绝发送
            this.ws.onopen = () => {
                console.error('sending')
                that.ws.send(temp)
            }
        }
    },
    color: {
        spade: 0,   //黑桃
        heart: 1,   //红桃
        club: 2,    //花子
        diamond: 3  //方片
    },
    offer: 'offer',
    answer: 'answer',
    ice: '__ice_candidate',
}