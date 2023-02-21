import Application from 'better-trading/app';
import config from 'better-trading/config/environment';
import {setApplication} from '@ember/test-helpers';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import {mocha} from 'mocha';
import start from 'ember-exam/test-support/start';

chai.use(sinonChai);

mocha.setup({
  slow: 500,
  timeout: 2000,
});

setApplication(Application.create(config.APP));

start();
