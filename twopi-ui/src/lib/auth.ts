import { defineMutation, defineQuery, useMutation, useQueryCache } from "@pinia/colada";
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
      console.log("Auth User Query", { data, error });
      return { error };
    }
  },
});

export const useSignIn = defineMutation(() => {
  const signInError = ref<string | null>(null);
  const { mutate: signIn, ...mutation } = useMutation({
    mutation: async (data: { email: string; password: string }) => {
      const { error } = await apiClient.POST("/twopi-api/api/signin", {
        body: data,
      });
      if (error) {
        signInError.value = error;
        return { success: false, error: error };
      } else {
        signInError.value = null;
        return { success: true };
      }
    },
    onSettled: () => {
      if (!signInError.value) {
        queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
      }
    },
  });
  return {
    signInError,
    mutation,
    signIn,
  };
});

export const useSignUp = defineMutation(() => {
  const signUpError = ref<string | null>(null);
  const { mutate: signUp, ...mutation } = useMutation({
    mutation: async (data: { name: string; email: string; password: string }) => {
      const { error } = await apiClient.POST("/twopi-api/api/signup", {
        body: data,
      });
      if (error) {
        signUpError.value = error;
        return { success: false, error: error };
      } else {
        signUpError.value = null;
        return { success: true };
      }
    },
    onSettled: () => {
      if (!signUpError.value) {
        queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
      }
    },
  });
  return {
    signUpError,
    mutation,
    signUp,
  };
});

export const useSignOut = defineMutation(() => {
  const { mutate: signOut, ...mutation } = useMutation({
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
  return {
    mutation,
    signOut,
  };
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
