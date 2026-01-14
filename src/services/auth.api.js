import api from "./api";

export function login(payload) {
  return api.post("/users/login", payload);
}
