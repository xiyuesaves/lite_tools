export function checkChatType(peer) {
  if (!peer) {
    return false;
  }
  return [1, 2, 100].includes(peer?.chatType);
}
