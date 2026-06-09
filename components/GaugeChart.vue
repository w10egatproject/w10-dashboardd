<script setup lang="ts">
const props = defineProps<{
  value: number;
  label: string;
}>();

// Map value to angle (-135 to 135 degrees for full arc)
// Assuming range -3 to 3
const min = -3;
const max = 3;
const clampedValue = Math.max(min, Math.min(max, props.value));
const percentage = (clampedValue - min) / (max - min);
const angle = -135 + (percentage * 270);
</script>

<template>
  <div class="flex flex-col items-center w-20">
    <svg viewBox="0 0 100 60" class="w-full">
      <!-- Arc Background -->
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round" />
      <!-- Arc Colored -->
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" 
            :stroke-dasharray="`${percentage * 125} 125`" class="text-sky-500" />
      <!-- Needle -->
      <line x1="50" y1="50" x2="50" y2="20" stroke="#1e293b" stroke-width="4" stroke-linecap="round" 
            :transform="`rotate(${angle} 50 50)`" />
    </svg>
    <p class="text-[10px] font-black text-slate-700 mt-1 truncate w-full text-center">{{ label }}</p>
    <p class="text-sm font-black text-slate-900">{{ value }}</p>
  </div>
</template>
