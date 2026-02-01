export async function setLiveParticipant(call, userId) {
  await call.updateCustomData({
    liveUserId: userId,
  });
}
