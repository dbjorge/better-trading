import EmberRouter from '@ember/routing/router';
import config from 'better-trading/config/environment';

class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('root', {path: '/'});
  this.route('about');
});

export default Router;
