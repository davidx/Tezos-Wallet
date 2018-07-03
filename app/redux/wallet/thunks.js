import path from 'path';
import { push } from 'react-router-redux';
import { flatten, pick } from 'lodash';
import { TezosWallet, TezosConseilQuery, TezosOperations } from 'conseiljs';
import { push } from 'react-router-redux';
import { updateAddress } from '../../reducers/delegate.duck';
import { addMessage } from '../../reducers/message.duck';
import { CREATE, IMPORT } from '../../constants/CreationTypes';
import { FUNDRAISER, GENERATE_MNEMONIC } from '../../constants/AddAddressTypes';
import { addMessage } from '../../reducers/message.duck';
import { TEZOS, CONSEIL } from '../../constants/NodesTypes';

import {
  findAccount,
  findAccountIndex,
  getSyncAccount
} from '../../utils/account';

import {
  findIdentity,
  findIdentityIndex,
  createIdentity,
  getSyncIdentity
} from '../../utils/identity';

import {
  saveUpdatedWallet,
} from '../../utils/wallet';



import {
  logout,
  setWallet,
  setIsLoading
  setIdentities,
  setSelectedAccount,
  addNewIdentity,
  updateIdentity,
  addNewAccount
} from './actions';

const {
  unlockFundraiserIdentity,
  unlockIdentityWithMnemonic,
  createWallet,
  loadWallet
} = TezosWallet;

const {
  getAccount
} = TezosConseilQuery;

const {
  sendIdentityActivationOperation
} = TezosOperations;

import { getSelectedNode } from '../../utils/nodes';

export function goHomeAndClearState() {
  return dispatch => {
    dispatch(logout());
    dispatch(push('/'));
  };
}

let currentAccountRefreshInterval = null;
export function automaticAccountRefresh() {
  return (dispatch, state) => {
    const oneSecond = 1000; // milliseconds
    const oneMinute = 60 * oneSecond;
    const minutes = 1;
    const REFRESH_INTERVAL = minutes * oneMinute;

    if (currentAccountRefreshInterval) {
      clearInterval(currentAccountRefreshInterval);
    }

    currentAccountRefreshInterval = setInterval(() =>
        dispatch(syncWallet())
      ,
      REFRESH_INTERVAL
    );
  };
}

export function syncAccount(selectedAccountHash, selectedParentHash) {
  return async (dispatch, state) => {
    const nodes = state().nodes.toJS();
    const identities = state().wallet.get('identities').toJS();
    const identity = findIdentity(identities, selectedParentHash);
    const foundIndex = findAccountIndex( identity, selectedAccountHash );
    const account = identity.accounts[ foundIndex ];

    if ( foundIndex > -1 ) {
      identity.accounts[ foundIndex ] = await getSyncAccount(
        identities,
        account,
        nodes,
        selectedAccountHash,
        selectedParentHash
      ).catch( e => {
        console.log('-debug: Error in: syncAccount for:' + identity.publicKeyHash);
        console.error(e);
        return account;
      });
    }

    dispatch(updateIdentity(identity));
  };
}

export function syncIdentity(publicKeyHash) {
  return async (dispatch, state) => {
    const nodes = state().nodes.toJS();
    const identities = state().wallet.get('identities').toJS();
    const selectedAccountHash = state().wallet.get('selectedAccountHash');
    let identity = findIdentity(identities, publicKeyHash);

    identity = await getSyncIdentity(
      identities,
      identity,
      nodes,
      selectedAccountHash
    ).catch( e => {
      console.log('-debug: Error in: syncIdentity for:' + publicKeyHash);
      console.error(e);
      return identity;
    });

    dispatch(
      updateIdentity(identity)
    );
  };
}

export function syncWallet() {
  return async (dispatch, state) => {
    dispatch(setIsLoading(true));
    const nodes = state().nodes.toJS();
    let identities = state().wallet.get('identities').toJS();
    const selectedAccountHash = state().wallet.get('selectedAccountHash');

    identities = await Promise.all(
      ( identities || [])
        .map(async identity => {
          const { publicKeyHash } = identity;
          return await getSyncIdentity(identities, identity, nodes, selectedAccountHash).catch( e => {
            console.log('-debug: Error in: syncIdentity for: ' + publicKeyHash);
            console.error(e);
            return identity;
          });
        })
    );
    dispatch(setIdentities( identities ));
    dispatch(setIsLoading(false));
  }
}

export function setAccountDelegateAddress(selectedAccountHash, selectedParentHash) {
  return async (dispatch, state) => {
    if ( selectedAccountHash !== selectedParentHash ) {
      const identities = state().wallet.get('identities').toJS();
      const identity = findIdentity(identities, selectedParentHash);
      const account = findAccount(identity, selectedAccountHash);
      dispatch(updateAddress(account.delegateValue));
    }
  };
}

export function selectAccount(selectedAccountHash, selectedParentHash) {
  return async (dispatch, state) => {
    try{
      dispatch(setIsLoading(true));
      dispatch(setSelectedAccount(
        selectedAccountHash,
        selectedParentHash
      ));
      dispatch(setAccountDelegateAddress(selectedAccountHash, selectedParentHash));
      if (selectedAccountHash === selectedParentHash ) {
        await dispatch(syncIdentity(selectedAccountHash));
      } else {
        await dispatch(syncAccount(selectedAccountHash, selectedParentHash));
      }
    } catch (e) {
      console.log('-debug: Error in: selectAccount for:' + selectedAccountHash, selectedParentHash);
      console.error(e);
      dispatch(addMessage(e.name, true));
      dispatch(setIsLoading(false));
    }
    dispatch(setIsLoading(false));
  };
}



export function importAddress(activeTab, seed, pkh, activationCode, username, passPhrase) {
  return async (dispatch, state) => {
    const nodes = state().nodes.toJS();
    const wallet = state().wallet;
    let identities = wallet.get('identities');
    const walletLocation = wallet.get('walletLocation');
    const walletFileName = wallet.get('walletFileName');
    const password = wallet.get('password');

    // TODO: clear out message bar
    dispatch(addMessage('', true));
    dispatch(setIsLoading(true));
    try {
      let identity = null;
      switch (activeTab) {
        case GENERATE_MNEMONIC:
          identity = await unlockIdentityWithMnemonic(seed, passPhrase);
          break;
        case FUNDRAISER:
          identity = await unlockFundraiserIdentity(seed, username, passPhrase, pkh);
          const conseilNode = getSelectedNode(nodes, CONSEIL);

          const account = await getAccount(
            conseilNode.url,
            identity.publicKeyHash,
            conseilNode.apiKey
          ).catch( () => false );

          if ( !account ) {
            const tezosNode = getSelectedNode(nodes, TEZOS);
            const activating = await sendIdentityActivationOperation(
              tezosNode.url,
              identity,
              activationCode
            )
              .catch((err) => {
                err.name = err.message;
                throw err;
              });
            dispatch(addMessage(
              `Successfully sent activation operation ${activating.operationGroupID}.`,
              false
            ));
          }
          break;
      }

      if ( identity ) {
        const { publicKeyHash } = identity;
        if ( findIdentityIndex(identities.toJS(), publicKeyHash) === -1 ) {
          identity = createIdentity(identity);
          dispatch(addNewIdentity(identity));
          identities = wallet.get('identities');
          await saveUpdatedWallet(identities, walletLocation, walletFileName, password);
          await dispatch(selectAccount(publicKeyHash, publicKeyHash));
        } else {
          dispatch(addMessage('Identity already exist', true));
        }
      }
    } catch (e) {
      console.log('-debug: Error in: importAddress for:' + activeTab);
      console.error(e);
      dispatch(addMessage(e.name, true));
      return false;
    }

    dispatch(setIsLoading(false));
    return true;
  };
}


// todo: 1 check why when importing new identity and going to settings then back - we are going to import identity screen again
// todo: 3 on create account success add that account to file - incase someone closed wallet before ready was finish.
export function selectDefaultAccountOrOpenModal() {
  return async (dispatch, state) => {
    dispatch(automaticAccountRefresh());
    try {
      let identities = state().wallet.get('identities').toJS();
      if ( identities.length === 0 ) {
        return dispatch(openAddAddressModal());
      }
      dispatch(setIsLoading(true));
      identities = identities
        .map( identity =>
          createIdentity(identity)
        );
      dispatch( setIdentities( identities ) );

      const { publicKeyHash } = identities[0];
      dispatch(setSelectedAccount(publicKeyHash, publicKeyHash));
    } catch( e ) {
      console.log('e', e);
    }


    dispatch(setIsLoading(false));
  };
}

export function login(loginType, walletLocation, walletFileName, password) {
  return async (dispatch, state) => {
    dispatch(setIsLoading(true));
    const completeWalletPath = path.join(walletLocation, walletFileName);
    dispatch(addMessage('', true));
    try {
      let wallet = {};
      if (loginType === CREATE) {
        wallet = await createWallet(completeWalletPath, password);
      } else if (loginType === IMPORT) {
        wallet = await loadWallet(completeWalletPath, password).catch((err) => {
          err.name = 'Invalid wallet/password combination.';
          throw err;
        });
      }

      const identities = wallet.identities
        .map( identity => createIdentity(identity) );
      
      dispatch(
        setWallet({
          identities,
          walletLocation,
          walletFileName,
          password
        }, 'wallet')
      );

      if ( identities.length ) {
        const { publicKeyHash } = identities[0];
        dispatch(setSelectedAccount(publicKeyHash, publicKeyHash));
      }

      dispatch(automaticAccountRefresh());
      await dispatch(syncWallet());

    } catch (e) {
      dispatch(addMessage(e.name, true));
      return false;
    }
    dispatch(setIsLoading(false));
    return true;
  };
}