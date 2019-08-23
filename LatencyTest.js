#!/usr/bin/env node
/**
 * @fileoverview
 * This is the main file for latency test.
 */
'use strict';
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const testUrls = require('./resources/test_urls.json');
const networkProperties = require('./resources/NetworkProperties.json');
const googleSheetWriter = require('./GoogleSheetWriter');

const NUM_OF_ITERATIONS = 3;
let data = {};
const urls = testUrls.displayPages;

const debugOps = {
  port: 59646
};

/**
 * Default mobile is Nexus 5X.
 */
const CONFIG_SETTINGS = {
  wifi_Desktop: {
    debugOps,
    throttling: networkProperties.Wifi,
    disableDeviceEmulation: true,
  },
  wifi_Mobile: {
    debugOps,
    throttling: networkProperties.Wifi,
    disableDeviceEmulation: false,
  },
  LTE_Desktop: {
    DEFAULT_OPTIONS,
    throttling: networkProperties.LTE,
    disableDeviceEmulation: true,
  },
  LTE_Mobile: {
    debugOps,
    throttling: networkProperties.LTE,
    disableDeviceEmulation: false,
  },
  default_Desktop: {
    debugOps,
    throttlingMethod: 'provided',
    throttling: networkProperties.Default,
    disableDeviceEmulation: true,
  }
};

process.on('uncaughtException', function() {
  console.error('Error: Exception......!!!');
  debugger;
  process.exit(1);
});

process.on('unhandledRejection', function() {
  console.error('Error: UnhandledRejection......!!!');
  debugger;
  process.exit(1);
});

/**
 * This the entry point/main function for the latency Testing.
 * It saves the latency data on google sheets for the given urls.
 *
 */
async function main() {
  for (const url of urls) {
    console.log(url);
    for (const configName in CONFIG_SETTINGS) {
      console.log(configName.toString());

      let result = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < NUM_OF_ITERATIONS; i++) {
        console.log(`Iteration ${i + 1}`);
        try {
          await launchChromeAndRunLighthouse(url, CONFIG_SETTINGS[configName]);
        } catch (err) {
          console.log(err);
          console.log(data.lhr.audits);
          continue;
        }
        try {
          result[0] += await data.lhr.audits['first-meaningful-paint'].rawValue;
          result[1] += await data.lhr.audits['time-to-first-byte'].rawValue;
          result[3] += await data.lhr.audits['speed-index'].rawValue;
          result[2] += await data.lhr.audits['interactive']['rawValue'];
          result[4] += await data.lhr.audits['metrics']
                           .details.items[0]['observedTraceEnd'];
          result[5] += (await data.lhr.categories.performance.score * 100);
        } catch (err) {
          console.log(err);
          console.log(data.lhr);
          continue;
        }
        console.log('Result : ', result);
      }
      console.log(`Data for ---> ${url} on ${configName} is published`);
      result = result.map(
          (each_element) => (Math.round(each_element / NUM_OF_ITERATIONS)));
      console.log('Saved result: ', result);
      console.log('\n');
      await googleSheetWriter.populateData(url, configName.toString(), result);
    }
  }
  await googleSheetWriter.populateSheet();
}

/**
 * Launches chrome and runs lighthouse
 * @param {string} url
 * @param {!Object} opts
 * @param {?Object=} config
 */
async function launchChromeAndRunLighthouse(url, opts, config = null) {
  console.log('chrome launched');
  const chrome = await chromeLauncher.launch(opts.debugOps);
  opts.port = chrome.port;
  console.log('Lighthouse launched!!');
  data = await lighthouse(url, opts, config);
  console.log('Lighthouse exited');
  await chrome.kill();
  console.log('chrome exited');
}

main().catch(console.error);
