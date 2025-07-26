import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import { apiClient } from "./openapi";
import { USER_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useAuthUser = defineQuery({
  key: USER_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/api/user");
    if (data) {
      return { user: data };
    } else {
      if (!error) {
        return { user: null };
      }
      throw new Error(`Auth User Query Error: ${error}`);
    }
  },
});

export const useSignIn = defineMutation({
  mutation: async (data: { email: string; password: string }) => {
    const { error } = await apiClient.POST("/twopi-api/api/signin", {
      body: data,
    });
    if (error) {
      throw new Error(`Sign In Error: ${error}`);
    }
  },
  onSettled: (_data, error) => {
    if (!error) {
      queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
    }
  },
});

export const useSignUp = defineMutation({
  mutation: async (data: { name: string; email: string; password: string }) => {
    const { error } = await apiClient.POST("/twopi-api/api/signup", {
      body: data,
    });
    if (error) {
      throw new Error(`Sign Up Error: ${error}`);
    }
  },
  onSettled: (_data, error) => {
    if (!error) {
      queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
    }
  },
});

export const useSignOut = defineMutation({
  mutation: async () => {
    const { error } = await apiClient.POST("/twopi-api/api/signout");
    if (error) {
      console.error("Sign Out Error", error);
      return { success: false, error: error };
    } else {
      return { success: true };
    }
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
  },
});

export const useResetAccount = defineMutation({
  mutation: async () => {
    const { error } = await apiClient.POST("/twopi-api/api/reset-account");
    if (error) {
      throw new Error(`Reset Account Error: ${error}`);
    } else {
      return { success: true };
    }
  },
});
