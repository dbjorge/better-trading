// Vendor
import templateOnly from '@ember/component/template-only';

// Types
import {BookmarksTradeStruct} from 'better-trading/types/bookmarks';

interface Args {
  trade: BookmarksTradeStruct;
  onCancel: () => void;
  submitTask: any;
}

const TradeDeletion = templateOnly<Args>();

export default TradeDeletion;
