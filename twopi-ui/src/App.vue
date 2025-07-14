<template>
  <UApp>
    <header>
      <nav class="flex gap-4 p-4">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/signin">Sign in</RouterLink>
      </nav>
    </header>
    <div class="p-4">
      <RouterView />
    </div>
  </UApp>
</template>
