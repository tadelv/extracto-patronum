<script>
  let { label = '', disabled = false, onclick = () => {} } = $props()
</script>

<button
  class="w-full py-4 gradient-cta text-on-primary-fixed font-label font-bold uppercase tracking-widest rounded-sm tactile-sink transition-opacity"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
  {disabled}
  {onclick}
>
  {label}
</button>
