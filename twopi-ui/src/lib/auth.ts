import { defineMutation, defineQuery, useMutation, useQuery, useQueryCache } from "@pinia/colada";
import { ref } from "vue";
import { apiClient } from "./openapi";
import { USER_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useAuthUser = defineQuery(() => {
  const { state, ...rest } = useQuery({
    key: USER_QUERY_KEYS.root,
    query: async () => {
      const { data, error, response } = await apiClient.GET("/twopi-api/api/user");
      if (data) {
        return { user: data };
      } else {
        console.log("Auth User Query", { data, error, response });
        return {
          authenticated: false,
        };
      }
    },
  });
  console.log("Auth User Query State", state.value);
  return {
    ...rest,
    session: state,
  };
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
