// Vendor
import Helper from '@ember/component/helper';
import {inject as service} from '@ember/service';

// Services
import TradeLocation from 'better-trading/services/trade-location';

// Types
import type {TradeSiteVersion} from 'better-trading/types/trade-location';

type HelperProps = {
  Args: {
    Positional: [{version: TradeSiteVersion; slug: string; type: string}],
    Named: {
      suffix?: string;
      league: string; // in non-PC realms, should be of form "realm/LeagueName", eg "xbox/Legion"
    }
  };
  Return: string;
}

export default class TradeUrl extends Helper<HelperProps> {
  @service('trade-location')
  tradeLocation: TradeLocation;

  compute(
    [{version, type, slug}]: HelperProps['Args']['Positional'],
    {suffix, league}: HelperProps['Args']['Named']
  ): string {
    const tradeUrl = this.tradeLocation.getTradeUrl(version, type, slug, league);

    if (!suffix) return tradeUrl;

    return tradeUrl + suffix;
  }
}
