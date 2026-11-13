<script setup lang="ts">
// El cambio de contraseña está en Mi perfil > Seguridad de la cuenta. Esta
// ruta solo redirige, para que los enlaces y marcadores antiguos sigan
// funcionando; ya no aparece en el menú.
definePageMeta({ redirect: { path: '/perfil', hash: '#seguridad' } })
</script>

<template>
  <div />
</template>
