import createClient from "openapi-fetch";
import type { paths } from "./openapi.gen";

export const apiClient = createClient<paths>({
  baseUrl: process.env.TWOPI_API_URL ?? "http://localhost:8000",
});
