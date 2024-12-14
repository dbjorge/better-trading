// Vendor
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';
import {beforeEach, describe, it} from 'mocha';

// Fixtures
import fakeBookmarkFolder from 'better-trading/tests/fixtures/bookmark-folder';
import fakeBookmarkTrade from 'better-trading/tests/fixtures/bookmark-trade';

import exportv1 from 'better-trading/tests/fixtures/export-v1';
import exportv2 from 'better-trading/tests/fixtures/export-v2';
import exportv3 from 'better-trading/tests/fixtures/export-v3';
// Types
import BookmarksExport from 'better-trading/services/bookmarks/export';

describe('Unit | Services | Bookmarks | Export', () => {
  setupTest();

  let service: BookmarksExport;

  beforeEach(function () {
    service = this.owner.lookup('service:bookmarks/export');
  });

  describe('serialize/deserialize', () => {
    it('should be able to encode and decode back a folder and its trades', () => {
      const folder = fakeBookmarkFolder({
        title: 'Some folder 🗁',
      });

      const trade = fakeBookmarkTrade({
        title: 'Some trade 🚚',
      });

      const encoded = service.serialize(folder, [trade]);
      expect(encoded).to.be.a('string');

      const decoded = service.deserialize(encoded);
      expect(decoded).to.not.be.null;

      if (!decoded) return;
      const [decodedFolder, decodedTrades] = decoded;
      expect(decodedFolder.title).to.be.equal(folder.title);
      expect(decodedTrades[0].title).to.be.equal(trade.title);
      expect(decodedTrades[0].location.version).to.be.equal(trade.location.version);
    });
  });

  describe('deserialize', () => {
    it('should successfully deserialize a pinned v1 export string', () => {
      const decoded = service.deserialize(exportv1);

      expect(decoded).to.not.be.null;
      if (!decoded) return;
      const [decodedFolder, decodedTrades] = decoded;
      expect(decodedFolder.title).to.be.equal('test folder');
      expect(decodedTrades[0].title).to.be.equal('test trade');
      expect(decodedTrades[0].location.version).to.be.equal('1');
    });

    it('should successfully deserialize a pinned v2 export string with unicode emoji', () => {
      const decoded = service.deserialize(exportv2);

      expect(decoded).to.not.be.null;
      if (!decoded) return;
      const [decodedFolder, decodedTrades] = decoded;
      expect(decodedFolder.title).to.be.equal('test folder 🗁');
      expect(decodedTrades[0].title).to.be.equal('test trade 🚚');
      expect(decodedTrades[0].location.version).to.be.equal('1');
    });

    it('should successfully deserialize a pinned v3 export string with a mix of PoE 1 and 2 locations', () => {
      const decoded = service.deserialize(exportv3);

      expect(decoded).to.not.be.null;
      if (!decoded) return;
      const [decodedFolder, decodedTrades] = decoded;
      expect(decodedFolder.title).to.be.equal('test folder 🗁');
      expect(decodedTrades[0].title).to.be.equal('test PoE 1 trade 🚚');
      expect(decodedTrades[0].location.version).to.be.equal('1');
      expect(decodedTrades[1].title).to.be.equal('test PoE 2 trade 🚚');
      expect(decodedTrades[1].location.version).to.be.equal('2');
    });

    it('should return null for invalid input', () => {
      expect(service.deserialize('foobar')).to.be.null;
      expect(
        service.deserialize(
          btoa(
            JSON.stringify({
              title: 'incomplete payload',
            })
          )
        )
      ).to.be.null;
    });
  });
});
