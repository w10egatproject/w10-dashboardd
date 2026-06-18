<template>
  <div
    ref="chartContainer"
    class="w-full"
    :style="{ minHeight: `${minHeight}px` }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Highcharts from 'highcharts';

const props = withDefaults(defineProps<{
  options: Highcharts.Options;
  minHeight?: number;
}>(), {
  minHeight: 250,
});

const chartContainer = ref<HTMLElement | null>(null);
let chart: Highcharts.Chart | null = null;

function initChart() {
  if (chartContainer.value && props.options) {
    // Ensure we destroy any existing chart instance before creating a new one
    if (chart) {
      chart.destroy();
      chart = null;
    }
    chart = Highcharts.chart(chartContainer.value, props.options);
  }
}

onMounted(() => {
  // Use setTimeout to ensure DOM is fully ready and rendered
  setTimeout(initChart, 100);
});

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});

watch(() => props.options, () => {
  initChart();
}, { deep: true });
</script>
