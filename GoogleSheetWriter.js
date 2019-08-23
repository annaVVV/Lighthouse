#!/usr/bin/env node
/**
 * @fileoverview
 * This file writes results to google sheets
 */
'use strict';
const {google} = require('googleapis');
const privatekey = require('./credentials/privatekey.json');

const SPREADSHEET_ID = 'xxxxxxx';
const SHEET_NAME = 'test!A2:1000';
const VALUE_INPUT_OPTION = 'USER_ENTERED';
const sheets = google.sheets('v4');
let values = [];

// configure a JWT auth client
const jwtClient = new google.auth.JWT(
    privatekey.client_email, /*keypath = */ null, privatekey.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']);

// authenticate request
jwtClient.authorize(function(err, tokens) {
  if (err) {
    throw new Error(`Authorization to googleapi failed: ${err}`);
  } else {
    console.log('Successfully connected to googleApi!');
  }
});

/**
 * Populates data in values variable
 * @param {string} url
 * @param {!Array<string>} configName
 * @param {!Array<number>} data
 */
module.exports.populateData =
    async function populateData(url, configName, data) {
  const row = [url, configName, ...data];
  values.push(row);
};

/**
 * Populates Google sheet with latency data from lighthouse
 * Link -
 * https://docs.google.com/spreadsheets/d/xxxxxxx
 */
module.exports.populateSheet = async function() {
  await sheets.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
        valueInputOption: VALUE_INPUT_OPTION,
        resource: {values},
        requests: [{}],
      },
      function(err) {
        if (err) {
          throw new Error(`Error in saving to google sheet: ${err}`);
        } else {
          console.log('Printing to sheet');
          console.log('Done');
          process.exit();
        }
      });
};
