/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import AddressPage from './containers/AddressPage';
import TopBar from './components/TopBar';

export default () => (
  <App>
    <TopBar />
    <Switch>
      <Route path="/addresses" component={AddressPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
