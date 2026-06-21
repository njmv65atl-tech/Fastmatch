import { API_URL } from "../config/env";

import { io } from "socket.io-client";
import store from "../redux/store";

export const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  transports: ["websocket"],
  path: "/socket.io",
  query: {
    version: "v4",
  },
  auth: {
    token: "", // set before connecting
  },
});
