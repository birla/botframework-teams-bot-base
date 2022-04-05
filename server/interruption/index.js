const { InputHints } = require("botbuilder");
const { ComponentDialog, DialogTurnStatus } = require("botbuilder-dialogs");
const { dialogConst } = require("../constants/dialogConstants");
const { WelcomeCardConstants } = require("../constants/buttonConstants");

class RootInterruption extends ComponentDialog {
  async onContinueDialog(innerDc) {
    const result = await this.interrupt(innerDc);
    if (result) {
      return result;
    }
    return await super.onContinueDialog(innerDc);
  }

  async interrupt(innerDc) {
    innerDc.context.activity.value
      ? (innerDc.context.activity.text = innerDc.context.activity.value.action
          ? innerDc.context.activity.value.action
          : innerDc.context.activity.text)
      : (innerDc.context.activity.text = innerDc.context.activity.text);
    console.log("Inside Root Interrupt");
    if (innerDc.context.activity.text) {
      const text = innerDc.context.activity.text.toLowerCase();
      console.log("Text: ", text);
      switch (text) {
        case "hi":
        case "hello":
        case "hey":
          await innerDc.cancelAllDialogs();
          return await innerDc.beginDialog(dialogConst.rootDialog);
        case "#rm":
        case "rm":
          await innerDc.cancelAllDialogs();
          return await innerDc.beginDialog(dialogConst.RMDispatcher);
        case "#agent":
        case "agent":
          await innerDc.cancelAllDialogs();
          return await innerDc.beginDialog(dialogConst.AgentDispatcher);
      }
    }
  }
}

module.exports.RootInterruption = RootInterruption;
