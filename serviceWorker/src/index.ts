//this line gonna import the content from compile worker as string
//@ts-expect-error
import txt from "../dist/app.worker.js?raw";

const logger = (...args: any[]) => console.log("[Purple]:", ...args);

let ok = false;
(function () {
  let mainWorkers: any[] = [];
  let mainWorker: any;

  window.Worker = class WorkerInjector extends Worker {
    constructor(url: string | URL) {
      console.log("[Purple]: init " + url.toString());

      const xhr = new XMLHttpRequest();
      xhr.open("GET", url.toString(), false);
      xhr.send();

      const script = xhr.responseText;

      if (typeof script !== "string") {
        super(url);
        return;
      }

      const newBlobStr = `${txt}
      ${script}`;

      const newBlob = URL.createObjectURL(new Blob([newBlobStr], { type: "text/javascript" }));
      super(newBlob);

      mainWorkers.push(this);

      if (!ok) {
        mainWorker = this;
        mainWorker.declareEventWorker();
        mainWorker.declareEventWindow();
        mainWorker.integrity();
        ok = true;
      }

    }

    async integrity() {
      global.request = fetch
      global.fetch = async (url: any, options: any) => {
        const response = await global.request(url, options);
        const body = await response.text();

        if (url == "https://gql.twitch.tv/integrity") {
          mainWorker.postMessage({ funcName: "setIntegrity", value: body });
        }

        return new Response(body, response);
      };
    }


    declareEventWorker() {
      this.addEventListener("message", (event) => {

        switch (event?.data?.type) {
          case "getSettings": {
            window.postMessage({ type: "getSettings", value: null });
            break;
          }
          case "PlayerQualityChanged": {
            mainWorker.postMessage({ funcName: "setQuality", value: event.data.arg.name });
            break;
          }
          case "pause": {
            mainWorker.postMessage({ funcName: "pause", args: undefined, id: 1 });
            break;
          }
          case "play": {
            mainWorker.postMessage({ funcName: "play", args: undefined, id: 1 });
            break;
          }
          default: {
            break;
          }
        }

        switch (event?.data?.arg?.key) {
          case "quality": {
            if (!event.data.arg.value.name) break;
            console.log("Changed quality by player: " + event.data.arg.value.name);
            mainWorker.postMessage({ funcName: "setQuality", value: event.data.arg.value.name });
            break;
          }
          case "state": {
            mainWorker.postMessage({ funcName: event.data.arg.value });
          }
          default: {
            break;
          }
        }

        switch (event?.data?.arg?.name) {
          case "pause": {
            break;
          }
          case "play": {
            break;
          }
          default: {
            break;
          }
        }
      });
    }

    declareEventWindow() {
      //Event listener from window and extension.
      window.addEventListener("message", (event) => {
        switch (event.data.type) {
          case "setSettings": {
            //send settings to worker
            mainWorker.postMessage({ funcName: "setSettings", value: event.data.value });
          }
        }
      });
    }
  };
})();
