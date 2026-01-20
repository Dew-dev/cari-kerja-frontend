import api from "./api";

export function login(payload) {
  const username = "testing123";
  const pass = "testing123";
  const basicHeader =
    username && pass ? `Basic ${btoa(`${username}:${pass}`)}` : undefined;
  // api.defaults.headers.common["Authorization"] = basicHeader;

  return api.post("/users/login", payload, {
    headers: {
      authorization: basicHeader,
    },
  });
}

export function refreshToken(refreshToken) {
  return api.post("/users/refresh-token", {
    refreshToken,
  });
}

export function register(payload) {
  return api.post("/users/register", payload);
}
