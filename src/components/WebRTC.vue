<template>
    <div class="video-box" ref="video-box" id="audios">
    </div>
</template>

<script>
import phaser from '../../utils/game'
// eslint-disable-next-line
import adapter from 'webrtc-adapter'
export default {
    name: 'WebRTC',
    data() {
        return {
            sessionId: 0,
            webRTC: false,
            localStream: null,
            peerList: new Map,   // 与其他用户的RTC连接对象
            sentOffer: false,
            mute: true,
            sound: false,
            joined: null,
            newPlayer: -1,
        }
    },
    methods: {
        getPeerConnection(v) {
            let that = this
            let videoBox = this.$refs['video-box'] // 用于向 box 中添加新加入的成员视频
            let iceServer = { // stun 服务，如果要做到 NAT 穿透，还需要 turn 服务
                "iceServers": [
                    {
                        "urls": "stun:stun.chat.bilibili.com:3478"
                    },
                    {
                        "urls": "turn:redten.fun:3478",
                        "username": "skc",
                        "credential": "skcskcskc",
                    },
                ],
                "iceTransportPolicy": "all",
            }
            // let PeerConnection = (window.RTCPeerConnection ||
            //         window.webkitRTCPeerConnection ||
            //         window.mozRTCPeerConnection)
            // 创建 peer 实例
            let peer = new RTCPeerConnection(iceServer)
            //向PeerConnection中加入需要发送的流
            this.localStream.getTracks().forEach(track => {
                peer.addTrack(track, this.localStream)
            })

            // 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
            // v.account 就是上面提到的 A-B
            peer.onaddstream = function(event){
                let audio = document.querySelector('#audio' + v.account)
                if (audio) { // 如果页面上有这个标识的播放器，就直接赋值 src
                    audio.srcObject = event.stream;
                } else {
                    audio = document.createElement('audio')
                    audio.controls = true
                    audio.autoplay = 'autoplay'
                    audio.playsinline = true
                    audio.hidden = true
                    audio.srcObject = event.stream
                    audio.id = 'audio'+v.account
                    // video加上对应标识，这样在对应客户端断开连接后，可以移除相应的video
                    videoBox.append(audio)
                }
                audio.pause()
            }
            // 发送ICE候选到其他客户端
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    // 间隔500ms发送，防止ios上他在offer之前发送
                    setTimeout(()=> {
                        that.$global.ws.send(JSON.stringify({
                        info_type: 'RTCMessage', 
                        data: {
                            type: that.$global.ice,
                            sender: Number(that.sessionId),
                            recver: Number(v.account),
                            candidate: event.candidate
                        }
                    }))
                    }, 500)
                }
            }
            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === 'connected') {
                    // 连接已建立完成
                    console.log('conected')
                } else if (peer.iceConnectionState === 'disconnected') {
                    // 连接断开
                    console.log('disconnected')
                }
            }
            this.peerList.set(v.account, peer)
        },
        createOffer(key, peer) {
            let that = this
            //发送offer，发送本地session描述
            peer.createOffer({
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 0
            }).then((offer)=> {
                peer.setLocalDescription(offer).then(()=>{
                    let data = JSON.stringify({
                        info_type: 'RTCMessage', 
                        data: {
                            type: that.$global.offer,
                            sender: Number(that.sessionId),
                            recver: Number(key),
                            sdp: peer.localDescription
                        }
                    })
                    that.$global.ws.send(data)
                })
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
            if(!this.peerList.get(data.sender)) {
                let obj = {}
                obj.account = data.sender
                this.getPeerConnection(obj)
            }
            this.peerList.get(data.sender).setRemoteDescription(data.sdp).then(()=>{
                that.peerList.get(data.sender).createAnswer().then((desc) => {
                    that.peerList.get(data.sender).setLocalDescription(desc).then(() => {
                        let temp = JSON.stringify({
                            info_type: 'RTCMessage', 
                            data: {
                                type: that.$global.answer,
                                sender: Number(that.sessionId),
                                recver: Number(data.sender),
                                sdp: that.peerList.get(data.sender).localDescription
                            }
                        })
                        that.$global.ws.send(temp)
                    }).catch(err=> {
                        console.error(err)
                    })
                }).catch(err => {
                    console.log(err)
                })
            })
            
        },
        oneAnswered(data) {
            if(!this.peerList.get(data.sender)) {
                let obj = {}
                obj.account = data.sender
                this.getPeerConnection(obj)
            }
            this.peerList.get(data.sender).setRemoteDescription(data.sdp, function(){
            }, (err) => {
                console.log(err)
            })
        },
        oneIced(data) {
            if (data.candidate) {
                if(!this.peerList.get(data.sender)) {
                    let obj = {}
                    obj.account = data.sender
                    this.getPeerConnection(obj)
                }
                this.peerList.get(data.sender).addIceCandidate(data.candidate).catch((e) => {
                    console.log('err', e)
                })
            }
        },
        oneLeaved(sessionId) {
            if(this.peerList.get(sessionId)) {
                this.peerList.set(sessionId, null)
                let dom = document.querySelector('#audio' + sessionId)
                if (dom) {
                    dom.remove()
                }
            }
        },
        changeMute() {
            this.mute = !this.mute
            let tracks = this.localStream.getTracks()
            tracks.forEach(track=> {
                track.enabled = !this.mute
            })
        },
        changeSound() {
            this.sound = !this.sound
            var audios = document.getElementsByTagName("audio")
            for(var i=0; i<audios.length; i++) {
                if(this.sound) {
                    audios[i].play()
                } else {
                    audios[i].pause()
                }
                
            }
        }
    },
    mounted() {
        let that = this
        phaser.setWebRTC(this)
        if(!navigator.mediaDevices) {
            this.$emit('update-able')
        } else {
            navigator
            .mediaDevices
            .getUserMedia({ audio: true, video: false })
            .then(stream => {
                that.localStream = stream
                stream.getTracks().forEach(track=> {
                    track.enabled = !that.mute
                })
                
                that.webRTC = true
            }).catch((err) => {
                alert(err)
                that.webRTC = false
            }).finally(()=> {
                that.$emit('update-able')
            })
        }
    },
    beforeDestroy() {
        if(this.localStream) {
            this.localStream.getTracks().forEach(track=> {
                track.stop()
            })
        }
        let dom = document.querySelector('#audios')
        if (dom) {
            dom.remove()
        }
    }

}
</script>

<style>

</style>