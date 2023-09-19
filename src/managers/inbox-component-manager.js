import { log } from "../utilities/log";

export async function embedMessageInboxContainer() {
    document.body.insertAdjacentHTML('beforeend', "<div id='gist-message-inbox'></div>");
}

export async function addMessageInbox(messages) {
    var element = safelyFetchElement("gist-message-inbox");
    if (element) {
        element.innerHTML = getInboxComponent(messages);
    } else {
        log(`Message inbox could not be embedded, elementId not found.`);
    }
}

export async function showMessageInbox() {
    document.getElementById("gist-inbox-message-list").style.display = "block";
}

export async function hideMessageInbox() {
    document.getElementById("gist-inbox-message-list").style.display = "none";
}

function getInboxComponent(messages) {
    var template = require("html-loader!../templates/inbox.html");
    var renderedMessages = formatMessage(messages);
    template = template.replace("${messages}", renderedMessages.join(""));
    console.log(renderedMessages);
    return template;
}

function formatMessage(messages) {
    var count = 0;
    var renderedMessages = [];

    var orderedMessages = messages.slice(0);
    orderedMessages.sort(function(a,b) {
        return a.priority - b.priority;
    });

    orderedMessages.forEach(message => {
        if (count !== 0) {
            renderedMessages.push("<div class='spacer'></div>");
        }
        if (message.media) {
            if (message.media.indexOf("youtube.com/") > -1) {
                var template = require("html-loader!../templates/inbox-message-youtube.html");
                template = fillRequired(message, template);
                template = template.replace("${media}", message.media);
                renderedMessages.push(template);
            } else {
                var template = require("html-loader!../templates/inbox-message-image.html");
                template = fillRequired(message, template);
                template = template.replace("${media}", message.media);
                renderedMessages.push(template);
            }
        } else {
            var template = require("html-loader!../templates/inbox-message.html");
            template = fillRequired(message, template);
            renderedMessages.push(template);
        }
        count++;
    });
    return renderedMessages;
}

function fillRequired(message, template) {
    template = template.replace("${queueId}", message.queueId);
    template = template.replace("${text}", message.text);
    if (message.cta) {
        template = template.replace("${cta}", message.cta);    
    } else {
        template = template.replace("${cta}", "#");
    }
    return template;
}

// To Refactor
function safelyFetchElement(elementId) {
    try {
      var element = document.querySelector(`#${elementId}`);
      if (element) {
        return element;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }