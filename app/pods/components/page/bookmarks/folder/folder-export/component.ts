// Vendor
import {inject as service} from '@ember/service';
import Component from '@glimmer/component';
import {dropTask} from 'ember-concurrency';

// Types
import Bookmarks from 'better-trading/services/bookmarks';
import {BookmarksFolderStruct} from 'better-trading/types/bookmarks';
import {tracked} from '@glimmer/tracking';

// Constants
const PREVIEW_BASE_URL = 'https://exile.center/bookmarks-preview';
// const PREVIEW_URL_MAX_LENGTH = 7500;

interface Args {
  folder: Required<BookmarksFolderStruct>;
  onCancel: () => void;
}

export default class FolderExport extends Component<Args> {
  @service('bookmarks')
  bookmarks: Bookmarks;

  @tracked
  serializedFolder: string = '';

  get previewUrl() {
    return `${PREVIEW_BASE_URL}?b64=${this.serializedFolder}`;
  }

  get canPreview() {
    return false;

    // Feature disabled until the page actually exists
    // return this.previewUrl.length < PREVIEW_URL_MAX_LENGTH;
  }

  get embedCode() {
    const iframeAttributes = [
      `title="${this.args.folder.title}"`,
      'width="350"',
      'height="500"',
      `src="${this.previewUrl}"`,
    ];

    return `<iframe ${iframeAttributes.join(' ')}></iframe>`;
  }

  serializeFolderTask = dropTask(async () => {
    const folder = this.args.folder;
    const trades = await this.bookmarks.fetchTradesByFolderId(folder.id);

    this.serializedFolder = this.bookmarks.serializeFolder(folder, trades);
  });
}
