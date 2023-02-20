// Vendor
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import Component from '@glimmer/component';
import {tracked} from '@glimmer/tracking';
import {dropTask, restartableTask} from 'ember-concurrency';

// Types
import Bookmarks from 'better-trading/services/bookmarks';
import {BookmarksFolderStruct, BookmarksTradeStruct} from 'better-trading/types/bookmarks';
import FlashMessages from 'ember-cli-flash/services/flash-messages';
import IntlService from 'ember-intl/services/intl';
import TradeLocation from 'better-trading/services/trade-location';

// Constants
const FOLDERS_WARNING_THRESHOLD = 10;

export default class PageBookmarks extends Component {
  @service('bookmarks')
  bookmarks: Bookmarks;

  @service('flash-messages')
  flashMessages: FlashMessages;

  @service('intl')
  intl: IntlService;

  @service('trade-location')
  tradeLocation: TradeLocation;

  @tracked
  stagedFolder: BookmarksFolderStruct | null;

  // Includes folders for other PoE versions
  @tracked
  folders: BookmarksFolderStruct[] = [];

  @tracked
  newFolderId: number | null = null;

  @tracked
  expandedFolderIds: string[] = [];

  @tracked
  isImportingFolder: boolean = false;

  @tracked
  isShowingArchivedFolders: boolean = false;

  get applicableFolders() {
    return this.folders.filter(({version}) => version === this.tradeLocation.version);
  }

  get olderVersionFolders() {
    return this.folders.filter(({version}) => version < this.tradeLocation.version);
  }

  get newerVersionFolders() {
    return this.folders.filter(({version}) => version > this.tradeLocation.version);
  }

  get displayedFolders() {
    return this.isShowingArchivedFolders ? this.archivedFolders : this.activeFolders;
  }

  get activeFolders() {
    return this.applicableFolders.filter(({archivedAt}) => !Boolean(archivedAt));
  }

  get archivedFolders() {
    return this.applicableFolders.filter(({archivedAt}) => Boolean(archivedAt));
  }

  get hasArchivedFolders() {
    return this.applicableFolders.some(({archivedAt}) => Boolean(archivedAt));
  }

  get hasActiveFolders() {
    return this.applicableFolders.some(({archivedAt}) => !Boolean(archivedAt));
  }

  get foldersWarningIsVisible() {
    if (this.isShowingArchivedFolders) return false;
    return this.displayedFolders.length >= FOLDERS_WARNING_THRESHOLD;
  }

  constructor(owner: unknown, args: {}) {
    super(owner, args);
    this.expandedFolderIds = this.bookmarks.getExpandedFolderIds();
  }

  initialFetchFoldersTask = dropTask(async () => {
    this.folders = await this.bookmarks.fetchFolders();
  });

  refetchFoldersTask = restartableTask(async () => {
    this.folders = await this.bookmarks.fetchFolders();
  });

  deleteFolderTask = dropTask(async (deletingFolder: BookmarksFolderStruct) => {
    try {
      await this.bookmarks.deleteFolder(deletingFolder);
      this.folders = await this.bookmarks.fetchFolders();

      this.flashMessages.success(
        this.intl.t('page.bookmarks.delete-folder-success-flash', {title: deletingFolder.title})
      );
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    }
  });

  toggleFolderArchiveTask = dropTask(async (folder: BookmarksFolderStruct) => {
    await this.bookmarks.toggleFolderArchive(folder);
    this.folders = await this.bookmarks.fetchFolders();

    this.isShowingArchivedFolders = this.isShowingArchivedFolders && this.hasArchivedFolders;
  });

  reorderFoldersTask = dropTask(async (reorderedDisplayedFolders: BookmarksFolderStruct[]) => {
    this.folders = this.bookmarks.partiallyReorderFolders(this.folders, reorderedDisplayedFolders);
    await this.bookmarks.persistFolders(this.folders);
  });

  persistFolderTask = dropTask(async (folder: BookmarksFolderStruct) => {
    try {
      const isNewlyCreated = !folder.id;

      const folderId = await this.bookmarks.persistFolder(folder);
      if (isNewlyCreated) this.toggleFolderExpansion(folderId);
      this.folders = await this.bookmarks.fetchFolders();

      const successTranslationKey = isNewlyCreated
        ? 'page.bookmarks.create-folder-success-flash'
        : 'page.bookmarks.update-folder-success-flash';
      this.flashMessages.success(this.intl.t(successTranslationKey, {title: folder.title}));
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    } finally {
      this.stagedFolder = null;
    }
  });

  persistImportedFolderTask = dropTask(async ({folder, trades}: {folder: BookmarksFolderStruct; trades: BookmarksTradeStruct[]}) => {
    try {
      const folderId = await this.bookmarks.persistFolder(folder);
      await this.bookmarks.persistTrades(trades, folderId);

      this.toggleFolderExpansion(folderId);
      this.folders = await this.bookmarks.fetchFolders();

      this.flashMessages.success(this.intl.t('page.bookmarks.import-folder-success-flash', {title: folder.title}));
    } catch (_error) {
      this.flashMessages.alert(this.intl.t('general.generic-alert-flash'));
    } finally {
      this.isImportingFolder = false;
    }
  });

  @action
  toggleArchiveDisplay() {
    this.isShowingArchivedFolders = !this.isShowingArchivedFolders;
  }

  @action
  createFolder() {
    this.stagedFolder = this.bookmarks.initializeFolderStruct(this.tradeLocation.version);
  }

  @action
  stageFolder(folder: BookmarksFolderStruct) {
    this.stagedFolder = folder;
  }

  @action
  unstageFolder() {
    this.stagedFolder = null;
  }

  @action
  toggleFolderExpansion(folderId: string) {
    this.expandedFolderIds = this.bookmarks.toggleFolderExpansion(this.expandedFolderIds, folderId);
  }

  @action
  collapseAllFolders() {
    this.expandedFolderIds = this.bookmarks.collapseAllFolders();
  }

  @action
  importFolder() {
    this.isImportingFolder = true;
  }

  @action
  cancelImportFolder() {
    this.isImportingFolder = false;
  }
}
