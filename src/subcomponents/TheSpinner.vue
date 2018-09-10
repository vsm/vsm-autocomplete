<template>
  <transition name="fade">
    <div class="spinner"/>
  </transition>
</template>


<script>
// Note: we use `<template>`, not `<template functional>`, otherwise the
// CSS fade-transitions would not work.

export default {
  name: 'TheSpinner'

};
</script>


<style scoped>
  .spinner {
    position: absolute;
    z-index: 3;
    display: block;
    width: 9px;
    height: 9px;
    margin: 9px 0 0 0;
    pointer-events: none;
    border: 2px solid;
    border-color: #ccc transparent #ccc transparent;
    border-radius: 50%;
    animation: spinning 1.2s linear infinite;
  }
  .spinner.list-closed {
    margin-top: 6px;
  }
  .fade-enter-active {
    transition: opacity 0.5s;
    transition-delay: 10ms;
  }
  .fade-enter,
  .fade-leave,  /* -> This sets it to 0 immediately at 'leave'-start */
  .fade-leave-to {
    opacity: 0;
  }
  @keyframes spinning {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
