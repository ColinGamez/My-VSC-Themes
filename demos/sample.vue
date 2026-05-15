<script setup lang="ts">
import { computed, ref } from "vue";

const active = ref("ember");
const swatches = {
  ember: "#ff7a18",
  citrus: "#ffbc42",
  peach: "#ffd9a8"
} as const;

const activeColor = computed(() => swatches[active.value as keyof typeof swatches]);
</script>

<template>
  <section class="palette-preview">
    <h2>All Orange</h2>
    <button type="button" @click="active = 'citrus'">Citrus</button>
    <output>{{ activeColor }}</output>
  </section>
</template>

<style scoped>
.palette-preview {
  border-color: v-bind(activeColor);
  background: #160804;
  color: #ffd9a8;
}
</style>
