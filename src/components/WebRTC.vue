<template>
    <div class="video-box" ref="video-box" id="videos">
        <video class="video-mine" autoplay controls ref="video-mine"></video>
    </div>
</template>

<script>

export default {
    name: 'WebRTC',
    data() {
        return {
            sessionId: 0,
            webRTC: false,
            localStream: null,
            peerList: new Map,   // 与其他用户的RTC连接对象
        }
    },
    methods: {
        getPeerConnection(v) {
            let that = this
            let videoBox = this.$refs['video-box'] // 用于向 box 中添加新加入的成员视频
            let iceServer = { // stun 服务，如果要做到 NAT 穿透，还需要 turn 服务
                "iceServers": [
                    {
                        "url": "stun:stun.l.google.com:19302"
                    }
                ]
            };
            let PeerConnection = (window.RTCPeerConnection ||
                    window.webkitRTCPeerConnection ||
                    window.mozRTCPeerConnection)
            // 创建 peer 实例
            let peer = new PeerConnection(iceServer)
            //向PeerConnection中加入需要发送的流
            peer.addStream(this.localStream)

            // 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
            // v.account 就是上面提到的 A-B
            peer.onaddstream = function(event){
                let videos = document.querySelector('#video' + v.account)
                if (videos) { // 如果页面上有这个标识的播放器，就直接赋值 src
                    videos.srcObject = event.stream;
                } else {
                    let video = document.createElement('video')
                    video.controls = true
                    video.autoplay = 'autoplay'
                    video.srcObject = event.stream
                    video.id = 'video'+v.account
                    // video加上对应标识，这样在对应客户端断开连接后，可以移除相应的video
                    videoBox.append(video)
                }
            }
            // 发送ICE候选到其他客户端
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    // ··· 发送 ICE
                    this.$global.ws.send(JSON.stringify({
                        info_type: 'RTCMessage', 
                        data: {
                            type: that.$global.ice,
                            sender: that.sessionId,
                            recver: v.account,
                            candidate: event.candidate
                        }
                    }))
                }
            }
            this.peerList.set(v.account, peer)
        },
        createOffer(key, peer) {
            let that = this
            //发送offer，发送本地session描述
            peer.createOffer({
                offerToReceiveAudio: 0,
                offerToReceiveVideo: 1
            }).then((desc) => {
                peer.setLocalDescription(desc, () => {
                    let data = JSON.stringify({
                        info_type: 'RTCMessage', 
                        data: {
                            type: that.$global.offer,
                            sender: that.sessionId,
                            recver: key,
                            sdp: peer.localDescription
                        }
                    })
                    that.$global.ws.send(data)
                }).catch(err=> {
                    console.log(err)
                })
            }).catch(err=> {
                console.log(err)
            })
        },
        oneJoined(data, sessionId, mineId) {
            if (this.sessionId === 0) {
                let session = window.sessionStorage.getItem('id')
                if(session && session !== 0) {
                    this.sessionId = session
                } else {
                    this.sessionId = mineId
                }
            }
            if (data.length > 1) {
                data.forEach(account => {
                    let obj = {}
                    obj.account = account
                    if (!this.peerList.get(account) && String(account) !== String(this.sessionId)) {
                        this.getPeerConnection(obj)
                    }
                })
                if (String(sessionId) === String(this.sessionId)) {
                    for (var [k, peer] of this.peerList) {
                        this.createOffer(k, peer)
                    }
                }
            }
        },
        oneOffered(data) {
            let that = this
            this.peerList.get(data.sender).setRemoteDescription(new RTCSessionDescription(data.sdp))
            this.peerList.get(data.sender).createAnswer().then((desc) => {
                    that.peerList.get(data.sender).setLocalDescription(desc, () => {
                        let temp = JSON.stringify({
                            info_type: 'RTCMessage', 
                            data: {
                                type: that.$global.answer,
                                sender: that.sessionId,
                                recver: data.sender,
                                sdp: that.peerList.get(data.sender).localDescription
                            }
                        })
                        that.$global.ws.send(temp)
                    })
                }, (err) => {
                    console.log(err)
                })
        },
        oneAnswered(data) {
            let that = this
            if(!this.peerList.get(data.sender)) {
                setTimeout(()=>{
                    that.peerList.get(data.sender).setRemoteDescription(data.sdp, function(){
                    }, (err) => {
                        console.log(err)
                    })        
                }, 500)
            } else {
                this.peerList.get(data.sender).setRemoteDescription(data.sdp, function(){
                }, (err) => {
                    console.log(err)
                })
            }
        },
        oneIced(data) {
            if (data.candidate) {
                this.peerList.get(data.sender).addIceCandidate(data.candidate).catch((e) => {
                    console.log('err', e)
                })
            }
        },
        oneLeaved(sessionId) {
            if(this.peerList.get(sessionId)) {
                let dom = document.querySelector('#video' + sessionId)
                if (dom) {
                    dom.remove()
                }
            }
        }
    },
    mounted() {
        let that = this
        let myVideo = this.$refs['video-mine']
        navigator
            .mediaDevices
            .getUserMedia({ audio: false, video: true })
            .then(stream => { 
            myVideo.srcObject = stream   
            that.localStream = stream
            that.webRTC = true
            }).catch(error => { 
            console.error('Error accessing media devices.', error); 
            that.webRTC = false
            })
    },
    beforeDestroy() {
        let dom = document.querySelector('#videos')
        if (dom) {
            dom.remove()
        }
    }

}
</script>

<style>

</style>