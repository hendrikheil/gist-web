import EventEmitter from "./utilities/event-emitter";
import { log } from "./utilities/log";
import { startQueueListener, checkMessageQueue } from "./managers/queue-manager";
import { setUserToken, clearUserToken, useGuestSession } from "./managers/user-manager";
import { showMessage, embedMessage, hideMessage, removePersistentMessage } from "./managers/message-manager";
import { embedMessageInboxContainer, refreshMessageInbox, showMessageInbox, hideMessageInbox } from "./managers/inbox-component-manager";
import { markInboxMessageAsRead, getInboxMessageByQueueId } from "./managers/inbox-manager";

export default class {
  static async setup(config) {
    this.events = new EventEmitter();
    this.config = {
      useGuestSession: config.useGuestSession === undefined ? false : config.useGuestSession,
      siteId: config.siteId,
      dataCenter: config.dataCenter,
      env: config.env === undefined ? "prod" : config.env,
      logging: config.logging === undefined ? false : config.logging,
      experiments: config.experiments === undefined ? false : config.experiments,
      inboxElementId: config.inboxElementId === undefined ? "gist-inbox-component" : config.inboxElementId
    }
    this.currentMessages = [];
    this.overlayInstanceId = null;
    this.currentRoute = null;
    this.isDocumentVisible = true;
    this.isInboxOpen = false;
    
    log(`Setup complete on ${this.config.env} environment.`);

    if (this.config.useGuestSession) {
      useGuestSession();
    }
    await startQueueListener();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.isDocumentVisible = false;
      } else  {
        this.isDocumentVisible = true;
        checkMessageQueue();
      }
    }, false);

    embedMessageInboxContainer();
    await refreshMessageInbox();
    
    document.getElementById(this.config.inboxElementId).addEventListener("click", Gist.showMessageInboxOnElement);
  }

  static async setCurrentRoute(route) {
    this.currentRoute = route;
    log(`Current route set to: ${route}`);
    checkMessageQueue();
  }

  static async setUserToken(userToken, expiryDate) {
    setUserToken(userToken, expiryDate);
    await startQueueListener();
  }

  static async clearUserToken() {
    clearUserToken();
    if (this.config.useGuestSession) {
      useGuestSession();
    }
    await startQueueListener();
  }

  static dismissMessage(instanceId) {
    removePersistentMessage(instanceId);
    hideMessage(instanceId);
    checkMessageQueue();
  }

  static async embedMessage(message, elementId) {
    var messageResponse = await embedMessage(message, elementId);
    return messageResponse.instanceId;
  }

  static async showMessage(message) {
    var messageResponse = await showMessage(message);
    return messageResponse ? messageResponse.instanceId : null;
  }

  // Actions

  static messageShown(message) {
    log(`Message shown: ${message.messageId}`);
    this.events.dispatch('messageShown', message);
  }

  static messageDismissed(message) {
    if (message !== null) {
      log(`Message dismissed: ${message.messageId}`);
      this.events.dispatch('messageDismissed', message);
    }
  }

  static messageError(message) {
    log(`Message error: ${message.messageId}`);
    this.events.dispatch('messageError', message);
  }

  static messageAction(message, action, name) {
    log(`Message action: ${message.currentRoute}, ${action} with name ${name} on ${message.instanceId}`);
    this.events.dispatch('messageAction', {message: message, action: action, name: name});
  }

  // Gist Message Inbox Methods

  static showMessageInboxOnElement() {
    showMessageInbox();
    var element = document.getElementById(Gist.config.inboxElementId);
    var elemRect = element.getBoundingClientRect(); 
    var bodyRect = document.body.getBoundingClientRect();
    var inboxDiv = document.getElementById("gist-inbox-message-list");
    var offset = elemRect.top - bodyRect.top;
    var left = elemRect.left;
    if ((elemRect.left + inboxDiv.offsetWidth + 340) > window.innerWidth) {
      left = window.innerWidth - 340;
    }

    if ((offset + inboxDiv.clientHeight) > window.innerHeight) {
      inboxDiv.style.bottom = "20px";
      inboxDiv.style.top = "";
    } else {
      inboxDiv.style.bottom = "";
      inboxDiv.style.top = (offset + elemRect.height + 10)+"px";
    }
    inboxDiv.style.left = left+"px";
  }

  static hideMessageInboxComponent() {
    hideMessageInbox();
  }

  static markInboxMessageAsRead(queueId) {
    log(`Marking message with queueId ${queueId} as read.`);
    var message = getInboxMessageByQueueId(queueId);
    markInboxMessageAsRead(queueId);
    Gist.messageAction(message, "gist://close", "Remove");
    Gist.messageDismissed(message);
  }

  static performInboxMessageAction(queueId, action) {
    if (action === "") { return; }
    log(`Performing CTA action: ${action}.`);
    var message = getInboxMessageByQueueId(queueId);
    Gist.messageAction(message, action, "CTA");
    window.location.href = action;
  }

}