import createClient from "openapi-fetch";
import type { paths } from "./openapi.gen";

export const apiClient = createClient<paths>({});
