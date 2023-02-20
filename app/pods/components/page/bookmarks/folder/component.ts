// Vendor
import Component from '@glimmer/component';
import {tracked} from '@glimmer/tracking';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {dropTask} from 'ember-concurrency';

// Utilities
import {copyToClipboard} from 'better-trading/utilities/copy-to-clipboard';

// Types
import {BookmarksFolderStruct, BookmarksTradeStruct} from 'better-trading/types/bookmarks';
import TradeLocation from 'better-trading/services/trade-location';
import Bookmarks from 'better-trading/services/bookmarks';
import SearchPanel from 'better-trading/services/search-panel';
import {TradeLocationChangeEvent} from 'better-trading/types/trade-location';
import FlashMessages from 'ember-cli-flash/services/flash-messages';
import IntlService from 'ember-intl/services/intl';

interface Args {
  folder: Required<BookmarksFolderStruct>;
  dragHandle: any;
  expandedFolderIds: string[];
  onEdit: () => void;
  onDelete: () => void;
  onExpansionToggle: () => void;
  onArchiveToggle: () => void;
}

export default class BookmarksFolder extends Component<Args> {
  @service('trade-location')
  tradeLocation: TradeLocation;

  @service('bookmarks')
  bookmarks: Bookmarks;

  @service('search-panel')
  searchPanel: SearchPanel;

  @service('flash-messages')
  flashMessages: FlashMessages;

  @service('intl')
  intl: IntlService;

  @tracked
  currentLeague: string | null = null;

  @tracked
  stagedTrade: BookmarksTradeStruct | null;

  @tracked
  stagedDeletingTrade: BookmarksTradeStruct | null;

  @tracked
  isReorderingTrades: boolean = false;

  @tracked
  trades: BookmarksTradeStruct[] | null = null;

  @tracked
  isExporting: boolean = false;

  get folderId() {
    return this.args.folder.id;
  }

  get isExpanded() {
    return !this.isArchived && this.args.expandedFolderIds.includes(this.args.folder.id);
  }

  get isArchived() {
    return Boolean(this.args.folder.archivedAt);
  }

  constructor(owner: unknown, args: Args) {
    super(owner, args);
    this.currentLeague = this.tradeLocation.league;
  }

  initialLoadTradesTask = dropTask(async() => {
    this.trades = await this.bookmarks.fetchTradesByFolderId(this.args.folder.id);
  });

  deleteTradeTask = dropTask(async (deletingTrade: BookmarksTradeStruct) => {
    try {
      await this.bookmarks.deleteTrade(deletingTrade, this.folderId);
      this.trades = await this.bookmarks.fetchTradesByFolderId(this.args.folder.id);

      this.flashMessages.success(
        this.intl.t('page.bookmarks.folder.delete-trade-success-flash', {title: deletingTrade.title})
      );
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    } finally {
      this.stagedDeletingTrade = null;
    }
  });

  reorderTradesTask = dropTask(async (reorderedTrades: BookmarksTradeStruct[]) => {
    this.trades = reorderedTrades;

    await this.bookmarks.persistTrades(this.trades, this.folderId);
  });

  persistTradeTask = dropTask(async (trade: BookmarksTradeStruct) => {
    try {
      const isNewlyCreated = !trade.id;
      await this.bookmarks.persistTrade(trade, this.folderId);
      this.trades = await this.bookmarks.fetchTradesByFolderId(this.args.folder.id);

      const successTranslationKey = isNewlyCreated
        ? 'page.bookmarks.folder.create-trade-success-flash'
        : 'page.bookmarks.folder.update-trade-success-flash';
      this.flashMessages.success(this.intl.t(successTranslationKey, {title: trade.title}));
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    } finally {
      this.stagedTrade = null;
    }
  });

  updateTradeLocationTask = dropTask(async (trade: BookmarksTradeStruct) => {
    if (!this.tradeLocation.slug || !this.tradeLocation.type) return;

    try {
      await this.bookmarks.persistTrade(
        {
          ...trade,
          location: {
            slug: this.tradeLocation.slug,
            type: this.tradeLocation.type,
            version: this.tradeLocation.version,
          },
        },
        this.folderId
      );

      this.trades = await this.bookmarks.fetchTradesByFolderId(this.args.folder.id);

      this.flashMessages.success(
        this.intl.t('page.bookmarks.folder.persist-trade-location-success-flash', {title: trade.title})
      );
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    } finally {
      this.stagedTrade = null;
    }
  });

  toggleTradeCompletionTask = dropTask(async (trade: BookmarksTradeStruct) => {
    await this.bookmarks.toggleTradeCompletion(trade, this.folderId);
    this.trades = await this.bookmarks.fetchTradesByFolderId(this.args.folder.id);
  });

  @action
  unstageTrade() {
    this.stagedTrade = null;
  }

  @action
  createTrade() {
    if (!this.tradeLocation.slug || !this.tradeLocation.type) return;

    const initializedTrade = this.bookmarks.initializeTradeStructFrom({
      slug: this.tradeLocation.slug,
      type: this.tradeLocation.type,
      version: this.tradeLocation.version,
    });

    this.stagedTrade = {
      ...initializedTrade,
      title: this.searchPanel.recommendTitle(),
    };
  }

  @action
  editTrade(trade: BookmarksTradeStruct) {
    this.stagedTrade = trade;
  }

  @action
  deleteTrade(trade: BookmarksTradeStruct) {
    this.stagedDeletingTrade = trade;
  }

  @action
  cancelTradeDeletion() {
    this.stagedDeletingTrade = null;
  }

  @action
  editFolder() {
    this.args.onEdit();
  }

  @action
  startTradesReordering() {
    this.isReorderingTrades = true;
  }

  @action
  stopTradesReordering() {
    this.isReorderingTrades = false;
  }

  @action
  exportFolder() {
    this.isExporting = true;
  }

  @action
  cancelExportFolder() {
    this.isExporting = false;
  }

  @action
  watchLeagueChange() {
    this.tradeLocation.on('change', this, this.handleTradeLocationChange);
  }

  @action
  teardownLeagueChange() {
    this.tradeLocation.off('change', this, this.handleTradeLocationChange);
  }

  @action
  copyToClipboard(trade: BookmarksTradeStruct) {
    if (!this.currentLeague) return;

    const tradeUrl = this.tradeLocation.getTradeUrl(
      trade.location.version,
      trade.location.type,
      trade.location.slug,
      this.currentLeague
    );
    copyToClipboard(tradeUrl);

    this.flashMessages.success(
      this.intl.t('page.bookmarks.folder.copy-trade-to-clipboard-success-flash', {title: trade.title})
    );
  }

  handleTradeLocationChange({newTradeLocation}: TradeLocationChangeEvent) {
    if (!newTradeLocation.league) return;
    if (newTradeLocation.league === this.currentLeague) return;

    this.currentLeague = newTradeLocation.league;
  }
}
