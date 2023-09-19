import EventEmitter from "./utilities/event-emitter";
import { log } from "./utilities/log";
import { startQueueListener, checkMessageQueue } from "./managers/queue-manager";
import { setUserToken, clearUserToken, useGuestSession } from "./managers/user-manager";
import { showMessage, embedMessage, hideMessage, removePersistentMessage } from "./managers/message-manager";
import { embedMessageInboxContainer, addMessageInbox, showMessageInbox, hideMessageInbox } from "./managers/inbox-component-manager";

export default class {
  static async setup(config) {
    this.events = new EventEmitter();
    this.config = {
      useGuestSession: config.useGuestSession === undefined ? false : config.useGuestSession,
      siteId: config.siteId,
      dataCenter: config.dataCenter,
      env: config.env === undefined ? "prod" : config.env,
      logging: config.logging === undefined ? false : config.logging,
      experiments: config.experiments === undefined ? false : config.experiments
    }
    this.currentMessages = [];
    this.overlayInstanceId = null;
    this.currentRoute = null;
    this.isDocumentVisible = true;

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

    addEventListener('click', (t) => {
      Gist.hideMessageInboxComponent();
    }, true); 

    embedMessageInboxContainer();

    var messages = [
      {
        queueId: "a9a3dfb2-c9d3-4c85-a1b3-6f2f9f86811e",
        priority: 2,
        media: "https://customer.io/docs/images/release-notes/in-app-drag-and-drop.gif",
        text: "We’ve made it even easier to build in-app messages. You can now can drag-and-and drop components within the in-app message editor.",
        cta: "https://customer.io/docs/release-notes/#2023-09-11-in-app-drag-and-drop"
      },
      {
          queueId: "fbbfb0c8-3b37-4881-a28c-15a1bf341015",
          priority: 1,
          media: "https://www.youtube.com/embed/eLgW_lAwOC8",
          text: "Check out our new workshop to reduce spam rates & grow engagement using Kickbox.",
      },
      {
          queueId: "ac6b1375-2140-4846-b9f2-a6282abf4654",
          priority: 3,
          text: "You can now view unsubscribe rates for subscription center topics when viewing Performance & Delivery Metrics or Message Metrics for campaigns and API-triggered broadcasts within the Metrics tab.",
          cta: "https://customer.io/docs/journeys/subscription-center/#metrics-for-subscription-preferences"
      }
    ];
    addMessageInbox(messages);
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

  static showMessageInboxComponent() {
    showMessageInbox();
  }

  static hideMessageInboxComponent() {
    hideMessageInbox();
  }

  static markMessageAsRead(queueId) {
    log(`Marking message with queueId ${queueId} as read.`);
  }

}