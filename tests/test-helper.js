import Application from 'better-trading/app';
import config from 'better-trading/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import {mocha} from 'mocha';

// TODO: ember-qunit's start was suggested by ember-cli-update 3.28.2, need both?
// import { start } from 'ember-qunit';
import start from 'ember-exam/test-support/start';

chai.use(sinonChai);

mocha.setup({
  slow: 500,
  timeout: 2000,
});

setApplication(Application.create(config.APP));

setup(QUnit.assert);

start();
