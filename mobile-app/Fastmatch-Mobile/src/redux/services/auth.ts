







//auth.ts


// Need to use the React-specific entry point to import createApi
import { emptySplitApi, header1, header2 } from ".";

import { Method } from "./apiMethods";
import { apiEndPoints } from "./apiEndpoint";

export const authApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    userSignIn: Method.POST(builder, apiEndPoints.userSignIn, header1),
    userSignUp: Method.POST(builder, apiEndPoints.userSignUp, header1),
    verifySignUpOtp: Method.POST(
      builder,
      apiEndPoints.verifySignUpOtp,
      header1,
    ),
    resendOtp: Method.POST(builder, apiEndPoints.resendOtp, header1),
    verifyOtp: Method.POST(builder, apiEndPoints.verifyOtp, header1),
    completeProfile: Method.POST(
      builder,
      apiEndPoints.completeProfile,
      header2,
    ), 
    forgotPassword: Method.POST(builder, apiEndPoints.forgotPassword, header1),
    resetPassword: Method.POST(builder, apiEndPoints.resetPassword, header1),
    matchHistory: builder.query({
      query: () => ({
        url: apiEndPoints.matchHistory,
        method: "GET",
        headers: header1,
      }),
    }),
    conversationHistory: builder.query({
      query: () => ({
        url: apiEndPoints.conversationHistory,
        method: "GET",
        headers: header1,
      }),
    }),
    chatHistory: builder.query({
      query: (userId: string) => ({
        url: `${apiEndPoints.chatHistory}/${userId}`,
        method: "GET",
        headers: header1,
      }),
    }),

    userReport: Method.POST(builder, apiEndPoints.videoCallReport, header1),
    userLogout : Method.POST(builder, apiEndPoints.userSignOut , header1),
    clearChat  : Method.POST(builder, apiEndPoints.clearChat , header1),
    blockUser : Method.POST(builder, apiEndPoints.blockUser , header1),
    unblockUser : Method.POST(builder, apiEndPoints.unblockUser , header1),
    blockCalls : Method.POST(builder, apiEndPoints.blockCalls , header1),
    unblockCalls : Method.POST(builder, apiEndPoints.unblockCalls , header1),
    deleteMessages : Method.POST(builder, apiEndPoints.deleteMessages , header1),
    editMessage : Method.POST(builder, apiEndPoints.editMessage , header1),
    rateMatch : Method.POST(builder, apiEndPoints.rateMatch , header1),
    reportBlock : Method.POST(builder, apiEndPoints.reportBlock , header1),
    buyCoinsMock : Method.POST(builder, apiEndPoints.buyCoinsMock , header1),
    upgradePremiumMock : Method.POST(builder, apiEndPoints.upgradePremiumMock , header1),
    sendFriendRequest: Method.POST(builder, apiEndPoints.sendFriendRequest, header1),
    acceptFriendRequest: Method.POST(builder, apiEndPoints.acceptFriendRequest, header1),
    myFriends: builder.query({
      query: () => ({
        url: apiEndPoints.myFriends,
        method: "GET",
        headers: header1,
      }),
    }),
    friendRequests: builder.query({
      query: () => ({
        url: apiEndPoints.friendRequests,
        method: "GET",
        headers: header1,
      }),
    }),
      

  }),
});

export const {
  useUserSignInMutation,
  useUserSignUpMutation,
  useVerifySignUpOtpMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
  useCompleteProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useMatchHistoryQuery,
  useConversationHistoryQuery,
  useChatHistoryQuery,
  useUserReportMutation,
  useUserLogoutMutation,
  useClearChatMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useBlockCallsMutation,
  useUnblockCallsMutation,
  useDeleteMessagesMutation,
  useEditMessageMutation,
  useReportBlockMutation,
  useRateMatchMutation,
  useBuyCoinsMockMutation,
  useUpgradePremiumMockMutation,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useMyFriendsQuery,
  useFriendRequestsQuery,
} = authApi;
