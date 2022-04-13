export async function on(_window, response, url) {
  //  if (Math.random() < 0.5 ){
  //      response += "twitch-client-ad";
  //  }

  const channelCurrent = await global.currentChannel();

  //if ads find on main link called from twitch api player
  if (global.isAds(response)) {
    global.LogPrint("ads found");

    global.postMessage({
      type: "getQuality",
      value: null
    });

    const quality = global.quality;
    const StreamServerList = channelCurrent.hls.StreamServerList;

    global.LogPrint(quality);

    try {
      //try all hls sigs that have on StreamServerList from HLS
      if (StreamServerList.length > 0) {
        const proxy = StreamServerList.find((x) => x.server == "proxy");
        const url = proxy.urlList.find((a) => a.quality == quality)

        const returno2 = await global.realFetch(url.url);
        var returnoText = await returno2.text();

        if (global.isAds(returnoText)) {
          global.LogPrint("ads on proxy");
          throw new Error("No m3u8 valid url found on StreamServerList");
        }
        
        return channelCurrent.hls.addPlaylist(returnoText);
      }

      //gera erro se nao tiver link
      throw new Error("No m3u8 valid url found on StreamServerList");
    } catch (e) {
      //if nothing resolve, return 480p flow
      const pictureStream = StreamServerList.filter((x) => x.server == "picture")
        .map((x) => x.urlList.find((x) => x.quality.includes("480")))[0].url

      const returno = await (await global.realFetch(pictureStream)).text();

      global.LogPrint("480P");
      global.LogPrint(e);
      channelCurrent.hls.addPlaylist(returno);
      return true;
    }
  } else {
    channelCurrent.hls.addPlaylist(response);
    return true;
  }
}