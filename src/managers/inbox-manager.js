import { refreshMessageInbox } from "./inbox-component-manager";
import { log } from "../utilities/log";
import { setKeyWithExpiryToLocalStore, getKeyFromLocalStore, clearKeyFromLocalStore } from '../utilities/local-storage';
import { logUserMessageView } from "../services/log-service";

const userTokenLocalStoreName = "gist.web.inboxMessages";

export async function setInboxMessagesForUser(messages) {
  log(`Storing ${messages.length} inbox messages to local storage.`);
  var expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 1);
  setKeyWithExpiryToLocalStore(userTokenLocalStoreName, messages, expiryDate);

  refreshMessageInbox();
}

export async function getInboxMessagesForUser() {
  var messages = getKeyFromLocalStore(userTokenLocalStoreName);
  if (messages === null) {
    messages = [];
  }
  log(`Fetched ${messages.length} inbox messages from local storage.`);
  return messages;
}

export async function clearInboxMessagesForUser() {
  clearKeyFromLocalStore(userTokenLocalStoreName);

  refreshMessageInbox();
}

export async function markInboxMessageAsRead(queueId) {
  await logUserMessageView(queueId);
  var messages = getKeyFromLocalStore(userTokenLocalStoreName);
  var filtered = messages.filter(function(el) { return el.queueId != queueId; });
  setInboxMessagesForUser(filtered);
}