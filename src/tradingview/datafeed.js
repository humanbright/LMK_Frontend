/* eslint-disable no-unused-vars */

var latestBar;
const DATATYPE_LASTTRADE = parseInt("0xFF02", 16);

const resNames = {
  // minutes
  1: "1min",
  3: "3min",
  5: "5min",
  15: "15min",
  30: "30min",
  // hours
  60: "1h",
  120: "2h",
  240: "4h",
  360: "6h",
  720: "12h",
  // days
  "1D": "1day",
  "3D": "3day",
  "1W": "1week",
  "1M": "1month"
};

const resValues = {
  // minutes
  1: 1,
  3: 3,
  5: 5,
  15: 10,
  30: 30,
  // hours
  60: 60,
  120: 120,
  240: 240,
  360: 360,
  720: 720,
  // days
  "1D": 1440,
  "3D": 4320,
  "1W": 10080,
  "1M": 43200
};

function printDate(mm) {
  let date = new Date(mm);
  let tt =
    date.getFullYear() +
    "/" +
    (date.getMonth() + 1) +
    "/" +
    date.getDate() +
    " " +
    date.getHours() +
    ":" +
    date.getMinutes() +
    ":" +
    date.getSeconds();
  return tt;
}

function parseFullSymbol(fullSymbol) {
  // const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  const match = fullSymbol.match(/(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }

  return {
    // exchange: match[1],
    // fromSymbol: match[2],
    // toSymbol: match[3],
    symbol: match[1],
    exchange: match[2],
  };
}

export const configurationData = {
  supported_resolutions: [
    // minutes
    "1",
    "3",
    "5",
    "15",
    "30",
    // hours
    "60",
    "120",
    "240",
    "360",
    "720",
    // days
    "D",
    "W",
    "M",
  ],
};

function convertResolution(resolution) {
  var interval;
  if (resolution === "1") {
    interval = "1m";
  } else if (resolution === "5") {
    interval = "5m";
  } else if (resolution === "10") {
    interval = "10m";
  } else if (resolution === "15") {
    interval = "15m";
  } else if (resolution === "30") {
    interval = "30m";
  } else if (resolution === "45") {
    interval = "45m";
  } else if (resolution === "60") {
    interval = "1h";
  } else if (resolution === "120") {
    interval = "2h";
  } else if (resolution === "240") {
    interval = "4h";
  } else if (resolution === "1D") {
    interval = "24h";
  } else {
    interval = resolution;
  }
  return interval;
}

const INTERVAL_SECONDS = {
  "1m": 60,
  "5m": 300,
  "10m": 600,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "12h": 43200,
  "24h": 86400,
};

const channelToSubscription = new Map();

function getNextDailyBarTime(barTime) {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

// Chart Methods
const datafeed = (tokenId) => {
  let websocket = null;

  return {
    onReady: (callback) => {
      setTimeout(() => callback(configurationData));
    },
    searchSymbols: async () => {
      // Code here...
    },
    resolveSymbol: async (
      symbolName,
      onSymbolResolvedCallback,
      onResolveErrorCallback
    ) => {
      let symbolInfo = {
        name: symbolName,
        has_intraday: true,
        visible_plots_set: false,
        session: "24x7",
        timezone: "Europe/Athens",
        exchange: "",
        minmov: 0.00000000001,
        pricescale: 100000000,
        has_weekly_and_monthly: true,
        volume_precision: 2,
        data_status: "streaming",
        supported_resolutions: configurationData.supported_resolutions,
      };

      setTimeout(() => {
        onSymbolResolvedCallback(symbolInfo);
      }, 0);
    },

    getBars: async (
      symbolInfo,
      resolution,
      periodParams,
      onHistoryCallback,
      onErrorCallback
      // firstDataRequest
    ) => {
      // const resName = resNames[resolution];
      const resVal = resValues[resolution];
      let { from, to, firstDataRequest } = periodParams;
      if (firstDataRequest) {
        const now = Math.floor(Date.now() / 1000);
        from = now - 10 * 24 * 60 * 60; // 10 days back
        to = now;
      }
      try {
        // let url = `https://api.twelvedata.com/time_series?symbol=${symbolInfo.name}&outputsize=1000&interval=${resName}&apikey=${API_KEY}`;
        // console.log("from === ", from, ", to === ", to)
        let url = `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/token/get_feed_data?tokenId=${tokenId}&from=${from}&to=${to}&interval=${resVal}`;

        const response = await fetch(url);
        if (response.status !== 200) {
          onHistoryCallback([], { noData: false });
          return;
        }
        const data = await response.json();

        if (!data.length) {
          onHistoryCallback([], { noData: true });
        }

        let bars = data.map((el) => {
          let dd = new Date(el.startTimestampSeconds * 1000);
          return {
            time: dd.getTime(), //TradingView requires bar time in ms
            low: el.low,
            high: el.high,
            open: el.open,
            close: el.close,
            volume: el.volumeUsd,
          };
        });
        bars = bars.sort(function (a, b) {
          if (a.time < b.time) return -1;
          else if (a.time > b.time) return 1;
          return 0;
        });

        latestBar = bars[bars.length - 1];
        window.delta = 0;

        onHistoryCallback(bars, { noData: false });
      } catch (error) {
        onErrorCallback(error);
      }
    },
    subscribeBars: (
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback,
      lastDailyBar
    ) => {
      const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
      const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.symbol}`;
      const handler = {
        id: subscribeUID,
        callback: onRealtimeCallback,
      };
      let subscriptionItem = channelToSubscription.get(channelString);
      if (subscriptionItem) {
        // Already subscribed to the channel, use the existing subscription
        subscriptionItem.handlers.push(handler);
        return;
      }
      subscriptionItem = {
        subscribeUID,
        resolution,
        lastDailyBar: lastDailyBar || latestBar,
        handlers: [handler],
      };

      channelToSubscription.set(channelString, subscriptionItem);
      websocket = new WebSocket(import.meta.env.VITE_PUBLIC_SOCKET_URL);

      websocket.onopen = () => {
        // console.log("socket connected");
      }

      

      websocket.onmessage = (event) => {
        // console.log('Received:', event.data);
        try {
          const data = JSON.parse(atob(event.data)).message;
          // console.log("websocket data: ", data, ", DATATYPE_LASTTRADE :: ", DATATYPE_LASTTRADE)
          if (data.type === DATATYPE_LASTTRADE) {
            if (data.data.mintAddr !== tokenId) return;

            const {
              exchange,
              ticker,
              price,
              timestamp,
            } = data.data;
            const channelString = `0~${exchange}~${ticker}`;
            const subscriptionItem = channelToSubscription.get(channelString);
            if (subscriptionItem === undefined) {
              return;
            }
            const lastDailyBar = subscriptionItem.lastDailyBar;
            const resValInMin = resValues[subscriptionItem.resolution];
            const resPeriod = resValInMin * 60 * 1000;
            const nextIntervalTime = lastDailyBar.time + resPeriod;
            let bar;
            if (timestamp >= nextIntervalTime) {
              bar = {
                time: nextIntervalTime + Math.floor((timestamp - nextIntervalTime) / resPeriod) * resPeriod,
                open: lastDailyBar.close,
                high: Math.max(lastDailyBar.close, price),
                low: Math.min(lastDailyBar.close, price),
                close: price,
              };
              // console.log("[socket] Generate new bar", bar);
            } else {
              bar = {
                ...lastDailyBar,
                high: Math.max(lastDailyBar.high, price),
                low: Math.min(lastDailyBar.low, price),
                close: price,
              };
              // console.log("[socket] Update the latest bar by price", price);
            }
            // console.log("latestBar: ", latestBar)
            if (latestBar != undefined) {
              if (latestBar.time < bar.time) bar.open = latestBar.close;
              else bar.open = latestBar.open;
            }
            latestBar = bar;
            // console.log("subscriptionItem.lastDailyBar: start: ", subscriptionItem.lastDailyBar)
            subscriptionItem.lastDailyBar = bar;
            // console.log("subscriptionItem.lastDailyBar: end: ", subscriptionItem.lastDailyBar)
          
            // Send data to every subscriber of that symbol
            subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
          }
        } catch (err) {
          console.error("Error parsing WebSocket message", err);
        }
      };


      // const resName = sendResolutions[resolution];
      // const symbolName = symbolInfo.name;
      // console.log('[rec]', symbolInfo.name, resolution, resName)

      // try {
      //   let ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${API_KEY}`);
      //   ws.onopen = (e) => {
      //     window.delta = 0;
      //     console.log('[ws onopen]');
      //     let sendData = {
      //       "action": "subscribe",
      //       "params": {
      //         "symbols": [{
      //           "symbol": symbolName,
      //           "exchange": "NASDAQ",
      //           "price": true
      //         }],
      //         "event": "price"
      //       }
      //     }
      //     ws.send(JSON.stringify(sendData));
      //   }

      //   ws.onmessage = e => {
      //     let transaction = JSON.parse(e.data);

      //     console.log('[onmsg]', transaction);
      //     if (transaction.event == 'price') {
      //       const seconds = INTERVAL_SECONDS[convertResolution(resolution)]

      //       var txTime = Math.floor(transaction.timestamp / seconds) * seconds * 1000 - (1440 + 30) * 60 * 1000
      //       console.log('[input_time]', printDate(latestBar.time), printDate(txTime));

      //       var current = new Date();
      //       // var d_time = (current.getDate() * 86400 + current.getHours() * 3600 + current.getMinutes() * 60) - (current.getUTCDate() * 86400 + current.getUTCHours() * 3600 + current.getUTCMinutes() * 60) + 73800;
      //       var d_time = (16 * 60 + 30) * 60 * 1000;

      //       if(window.delta == 0) {
      //         window.delta = latestBar.time - txTime;
      //       }

      //       txTime += window.delta;

      //       console.log("[delta time]", printDate(latestBar.time), printDate(txTime));

      //       if (latestBar && txTime == latestBar.time) {
      //         latestBar.close = transaction.price
      //         if (transaction.price > latestBar.high) {
      //           latestBar.high = transaction.price
      //         }

      //         if (transaction.price < latestBar.low) {
      //           latestBar.low = transaction.price
      //         }

      //         latestBar.volume += transaction.day_volume
      //         console.log('[update bar]', printDate(latestBar.time));
      //         onRealtimeCallback(latestBar)
      //       } else if (latestBar && txTime > latestBar.time) {
      //         const newBar = {
      //           low: transaction.price,
      //           high: transaction.price,
      //           open: transaction.price,
      //           close: transaction.price,
      //           volume: transaction.day_volume,
      //           time: txTime
      //         }
      //         latestBar = newBar
      //         console.log('[new Bar]', printDate(newBar.time))
      //         onRealtimeCallback(newBar)
      //       }

      //       // lastBar.time
      //     }

      //   }

      //   ws.onclose = function () {
      //     console.log('[onclose]');
      //   }

      // } catch (err) {
      //   console.log(err);
      // }

      // // Code here...
      // window.resetCacheNeededCallback = onResetCacheNeededCallback;
    },
    unsubscribeBars: (subscriberUID) => {
      if (websocket) {
        websocket.close();
        websocket = null;
        // console.log("socket closed");
      }
      // Code here...
    },
  };
};

export default datafeed;
