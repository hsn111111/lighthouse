/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/**
 * @fileoverview
 * Audit that .
 */

'use strict';

const Audit = require('./audit.js');
const i18n = require('./../lib/i18n/i18n.js');
const FontDisplay = require('./../audits/font-display.js');
const PASSING_FONT_DISPLAY_REGEX = /^(optional)$/;
const NetworkRecords = require('../computed/network-records.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  title: 'new audit',
  /** Title of a Lighthouse audit that provides detail on whether . This descriptive title is shown to users when */
  failureTitle: 'fail new audit',
  /** Description of a Lighthouse audit that tells the user why they should include . This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'new audit description',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class UsesRelPreloadAndFontDisplayAudit extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'uses-rel-preload-and-font-display',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['devtoolsLogs', 'URL', 'CSSUsage'],
    };
  }


  /**
   * Finds which font URLs were attempted to be preloaded,
   * ignoring those that failed to be reused and were requested again.
   * @param {LH.Gatherer.Simulation.GraphNode} graph
   * @return {Set<string>}
   */
  /**
  static getURLsAttemptedToPreload(graph) {
    /** @type {Array<LH.Artifacts.NetworkRequest>}
    const requests = [];
    graph.traverse(node => node.type === 'network' && requests.push(node.record));

    const preloadRequests = requests
      .filter(req => req.isLinkPreload)
      .filter(req => req.resourceType === 'Font');

    return new Set(preloadRequests.map(req => req.url));
  }
  */

  /**
   * Finds which font URLs were attempted to be preloaded,
   * ignoring those that failed to be reused and were requested again.
   * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
   * @return {Set<string>}
   */
  static getURLsAttemptedToPreload(networkRecords) {
    /** const attemptedStylesheetURLs = networkRecords
      .filter(req => req.resourceType === 'Stylesheet')
      .filter(req => req.isLinkPreload)
      .map(req => req.url);

    let fontURLsFromPreloadedStylesheets = [];
    const stylesheets = artifacts.CSSUsage.stylesheets;
    for (const url of attemptedStylesheetURLs) {
      const stylesheet = stylesheets.find(sheet => sheet.header.sourceURL === url);
      if (!stylesheet) continue;
      artifacts.CSSUsage.stylesheets = [stylesheet];
      const {passingURLs, failingURLs} =
        FontDisplay.findFontDisplayDeclarations(artifacts, PASSING_FONT_DISPLAY_REGEX);
      fontURLsFromPreloadedStylesheets =
        fontURLsFromPreloadedStylesheets.concat([...passingURLs, ...failingURLs]);
      console.log(fontURLsFromPreloadedStylesheets);
    }*/
    const attemptedURLs = networkRecords
      .filter(req => req.resourceType === 'Font')
      .filter(req => req.isLinkPreload)
      .map(req => req.url);

    return new Set(attemptedURLs);
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    const devtoolsLog = artifacts.devtoolsLogs[this.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);

    // Gets the URLs of fonts where font-display: optional.
    const passingURLs =
      FontDisplay.findFontDisplayDeclarations(artifacts, PASSING_FONT_DISPLAY_REGEX).passingURLs;
    console.log('URLs of fonts where font-display: optional');
    console.log(passingURLs);

    // Gets the URLs attempted to be preloaded, ignoring those that failed to be reused and were requested again.
    const attemptedURLs =
      UsesRelPreloadAndFontDisplayAudit.getURLsAttemptedToPreload(networkRecords);
    console.log('URLs of fonts attempted to be preloaded');
    console.log(attemptedURLs);

    const results = Array.from(passingURLs)
      .filter(url => !attemptedURLs.has(url))
      .map(url => {
        return {url: url};
      });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', itemType: 'url', text: str_(i18n.UIStrings.columnURL)},
      // TODO: show the CLS that could have been saved if font was preloaded
    ];

    return {
      score: results.length > 0 ? 0 : 1,
      details: Audit.makeTableDetails(headings, results),
      notApplicable: results.length === 0,
    };
  }
}

module.exports = UsesRelPreloadAndFontDisplayAudit;
module.exports.UIStrings = UIStrings;
