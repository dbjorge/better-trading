/* global require */

import ApplicationInstance from '@ember/application/instance';
import {ItemResultsEnhancerService} from 'better-trading/types/item-results';

export const initialize = (appInstance: ApplicationInstance): void => {
  const itemResultsEnhanceService = appInstance.lookup('service:item-results/enhance');

  // @ts-expect-error: TS2339 because ember's build incorrectly uses NodeJS typings for require
  // instead of browser typings
  Object.keys(require.entries)
    .filter((moduleName) => moduleName.startsWith('better-trading/services/item-results/enhancers/'))
    .map((moduleName) => moduleName.replace('better-trading/services/', ''))
    .forEach((moduleName) => {
      itemResultsEnhanceService.registerEnhancerService(
        appInstance.lookup(`service:${moduleName}`) as unknown as ItemResultsEnhancerService
      );
    });
};

export default {
  initialize,
};
