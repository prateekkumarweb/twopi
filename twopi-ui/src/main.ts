import "./app.css";

import ui from "@nuxt/ui/vue-plugin";
import { PiniaColada } from "@pinia/colada";
import { PiniaColadaRetry } from "@pinia/colada-plugin-retry";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(PiniaColada, {
  plugins: [
    PiniaColadaRetry({
      retry: 3,
      delay: 1000,
    }),
  ],
});
app.use(router);
app.use(ui);

app.mount("#app");
