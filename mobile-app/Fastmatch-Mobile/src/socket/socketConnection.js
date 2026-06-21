import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHasUnread, setIncomingMatchRequest, clearIncomingMatchRequest } from "../redux/slices/globalSlice";

import UseInternetConnectivity from "./useInternetConnectivity";
import { socket } from "./socket";
import { AppView } from "../types";
import { IMAGE_URL } from "../config/env";
import { ShowAlertMessage, popTypes } from "../helpers/commonFunctions";

const SocketConnection = ({ setView }) => {
  const { token } = useSelector((state) => state.persist);
  const isConnected = UseInternetConnectivity();
  const dispatch = useDispatch();

  // Keep latest setView function in a ref so socket listeners never reset/disconnect on navigation
  const setViewRef = useRef(setView);
  useEffect(() => {
    setViewRef.current = setView;
  }, [setView]);

  useEffect(() => {
    if (token) {
      console.log(token, "Establishing socket connection...");

      socket.io.opts.extraHeaders = {
        ...socket.io.opts.extraHeaders,
        authorization: `Bearer ${token}`,
      };

      socket.auth = { token: `Bearer ${token}` };

      socket.disconnect().connect();

      // Event listeners for socket connection
      socket.on("connect", () => {
        console.log(token, "Socket connected");
      });

      socket.on("new-message-notification", (payload) => {
        console.log("🔔 [Global] new-message-notification received, turning on red dot!");
        dispatch(setHasUnread(true));
      });

      // Global match request events
      socket.on("incoming-match-request", (payload) => {
        console.log("🔔 [Global] incoming-match-request received:", payload);
        dispatch(setIncomingMatchRequest(payload));
      });

      socket.on("incoming-match-canceled", () => {
        console.log("🔔 [Global] incoming-match-canceled, clearing popup");
        dispatch(clearIncomingMatchRequest());
      });

      socket.on("match-declined", () => {
        console.log("🔔 [Global] match-declined received");
        dispatch(clearIncomingMatchRequest());
        ShowAlertMessage("Match/Call request was declined.", popTypes.info);
      });

      socket.on("match-error", (err) => {
        console.error("🔔 [Global] match-error received:", err);
        ShowAlertMessage(err?.message || "Match request failed", popTypes.error);
      });

      socket.on("call-start", (data) => {
        console.log("🔔 [Global] call-start received:", data);
        dispatch(clearIncomingMatchRequest());

        if (data && setViewRef.current) {
          const user = data?.remoteUser;
          const participantName = user?.displayName || user?.fullName || "Partner";
          let participantImage = user?.profilePicture || "";
          const IMAGE_BASE_URL = IMAGE_URL;
          if (participantImage && !participantImage.includes("http")) {
            participantImage = `${IMAGE_BASE_URL}${participantImage}`;
          }

          setViewRef.current(AppView.VIDEO_CHAT, {
            callId: data?.match?._id || data?.matchId,
            role: data?.role,
            matchId: data?.match?._id || data?.matchId,
            participantName,
            participantImage,
            matchData: data?.match,
            streamToken: data?.streamToken,
            remoteUserId: user?._id || user?.id,
          });
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("error", (err) => console.log(err, "error"));
    } else {
      console.log("Token not available. Cannot establish socket connection.");
    }

    // Clean up event listeners and disconnect the socket when component unmounts
    return () => {
      console.log(token, "Cleaning up socket connection...");
      socket.off("connect_error");
      socket.off("connect");
      socket.off("new-message-notification");
      socket.off("incoming-match-request");
      socket.off("incoming-match-canceled");
      socket.off("match-declined");
      socket.off("call-start");
      socket.off("error");
      socket.disconnect();
    };
  }, [token, isConnected]);

  return null;
};

export default SocketConnection;
