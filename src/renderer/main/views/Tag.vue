<template>
    <div class="home">
        <div class="hint">
            <img src="../assets/img/coding.svg" class="hint-img" />
            <h1>标签功能正在开发中</h1>
        </div>
    </div>
</template>

<script>
// @ is an alias to /src
// import TitleBar from '@/components/TitleBar.vue'

export default {
  name: 'Home',
  components: {
    // TitleBar
  }
}
</script>
<style>
.hint {
    color: rgba(38, 130, 230, 1);
    margin: 20% 0;
}

.hint-img {
    width: 30%; 
    height: 30%;
    max-height:600px;
    max-width:600px;
}
</style>