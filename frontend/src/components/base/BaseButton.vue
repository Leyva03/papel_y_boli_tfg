<template>
    <button
      class="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition"
      @click="$emit('click')"
    >
      <slot />
    </button>
  </template>