<template>
  <div class="home">
    <div style="display: flex; flex-direction: row;">
      <div v-if="userRole != 0">
        <button @click="addRoom">创建房间</button>
      </div>
      <div style="margin-left: 20px;" v-if="userRole != 1">
        <form action="room/join">
          房间号: <input type="text" name="room_id" />
          <input type="submit" value="加入房间" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      userRole: -1, //-1 游客 0 被邀请者 1 房主
    }
  },
  methods: {
    async addRoom() {
      this.isMaster = 1
      if (typeof WebSocket === "undefined") {
        alert("您的浏览器不支持WebSocket");
        return;
      } else {
        this.$router.push({
          path: "/room/add"
        });
      }
    },
  }
}
</script>
