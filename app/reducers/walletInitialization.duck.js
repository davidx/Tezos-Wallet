import { fromJS } from 'immutable';
import { push } from 'react-router-redux';
import { get } from 'lodash';

import path from 'path';
import { TezosWallet } from 'conseiljs';

import { clearEntireAddressState } from './address.duck';
import { addMessage } from './message.duck';
import actionCreator from '../utils/reduxHelpers';
import CREATION_CONSTANTS from '../constants/CreationTypes';
import { displayError } from '../utils/formValidation';

const { createWallet, loadWallet, saveWallet } = TezosWallet;

const { DEFAULT, CREATE, IMPORT } = CREATION_CONSTANTS;

/* ~=~=~=~=~=~=~=~=~=~=~=~= Constants ~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= */
const CLEAR_WALLET_STATE = 'CLEAR_WALLET_STATE';
const SET_PASSWORD = 'SET_PASSWORD';
const SET_CONFIRMED_PASSWORD = 'SET_CONFIRMED_PASSWORD';
const SET_DISPLAY = 'SET_DISPLAY';
const SET_IS_LOADING = 'SET_IS_LOADING';
const SET_WALLET_FILENAME = 'SET_WALLET_FILENAME';
const SET_WALLET_LOCATION = 'SET_WALLET_LOCATION';
const SET_CURRENT_WALLET = 'SET_CURRENT_WALLET';

/* ~=~=~=~=~=~=~=~=~=~=~=~= Actions ~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= */
const clearWalletState = actionCreator(CLEAR_WALLET_STATE);
export const setPassword = actionCreator(SET_PASSWORD, 'password');
export const setConfirmedPassword = actionCreator(
  SET_CONFIRMED_PASSWORD,
  'password'
);
export const setDisplay = actionCreator(SET_DISPLAY, 'currentDisplay');
export const setIsLoading = actionCreator(SET_IS_LOADING, 'isLoading');
export const setWalletFileName = actionCreator(
  SET_WALLET_FILENAME,
  'walletFileName'
);
export const updateWalletLocation = actionCreator(
  SET_WALLET_LOCATION,
  'walletLocation'
);
const setCurrentWallet = actionCreator(SET_CURRENT_WALLET, 'wallet');

/* ~=~=~=~=~=~=~=~=~=~=~=~= Thunks ~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= */
export function goHomeAndClearState() {
  return dispatch => {
    dispatch(clearWalletState());
    dispatch(clearEntireAddressState());
    dispatch(push('/'));
  };
}

export function saveUpdatedWallet(identities) {
  return async (dispatch, state) => {
    try {
      dispatch(setIsLoading(true));
      const identities = state().address.get('identities').toJS();
      const walletLocation = state().walletInitialization.get('walletLocation');
      const walletFileName = state().walletInitialization.get('walletFileName');
      const walletIdentities = state().walletInitialization.getIn([
        'wallet',
        'identities'
      ]).toJS();

      const indices = walletIdentities.map( identity => identity.publicKeyHash );
      const password = state().walletInitialization.get('password');
      const completeWalletPath = path.join(walletLocation, walletFileName);


      /* making sure only unique identities are added */
      const newIdentities = identities
        .filter(({ publicKeyHash }) =>
          indices.indexOf(publicKeyHash) === -1
        )
        .map(({ publicKey, privateKey, publicKeyHash }) => {
          return { publicKey, privateKey, publicKeyHash };
        });

      
      await saveWallet(
        completeWalletPath,
        {
          identities: walletIdentities.concat(newIdentities)
        },
        password
      );

      dispatch(setIsLoading(false));
    } catch (e) {
      console.error(e);
      dispatch(addMessage(e.name, true));
      dispatch(setIsLoading(false));
    }
  };
}

export function submitAddress(submissionType: 'create' | 'import') {
  return async (dispatch, state) => {
    const walletLocation = state().walletInitialization.get('walletLocation');
    const walletFileName = state().walletInitialization.get('walletFileName');
    const password = state().walletInitialization.get('password');
    const confirmedPassword = state().walletInitialization.get(
      'confirmedPassword'
    );
    const completeWalletPath = path.join(walletLocation, walletFileName);
    let wallet = [];

    // TODO: clear out message bar
    dispatch(addMessage('', true));

    let validations = [
      { value: walletLocation, type: 'locationFilled'},
      { value: `${walletLocation}/${walletFileName}`, type: 'validJS'},
      { value: password, type: 'notEmpty', name: 'Password' },
      { value: password, type: 'minLength8', name: 'Password' }
    ]

    if (submissionType == 'create') {
      validations.push({
        value: [password, confirmedPassword],
        type: 'samePassPhrase',
        name: 'Passwords'
      })
    }

    const error = displayError(validations);
    if (error) {
      return dispatch(addMessage(error, true));
    }

    try {
      dispatch(setIsLoading(true));
      if (submissionType === CREATE) {
        wallet = await createWallet(completeWalletPath, password);
      } else if (submissionType === IMPORT) {
        wallet = await loadWallet(completeWalletPath, password)
        .catch((err) => { dispatch(addMessage("Invalid wallet/password combination.", true))});
      }

      dispatch(setCurrentWallet(fromJS(wallet)));
      dispatch(setDisplay(DEFAULT));
      dispatch(push('/addresses'));
      dispatch(setIsLoading(false));
    } catch (e) {
      console.error(e);
      dispatch(addMessage(e.name, true));
      dispatch(setIsLoading(false));
    }
  };
}

/* ~=~=~=~=~=~=~=~=~=~=~=~= Reducer ~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= */
const initState = fromJS({
  currentDisplay: DEFAULT,
  isLoading: false,
  password: '',
  confirmedPassword: '',
  walletFileName: '',
  walletLocation: '',
  network: 'zeronet',
  wallet: {}
});

export default function walletInitialization(state = initState, action) {
  switch (action.type) {
    case CLEAR_WALLET_STATE:
      return initState;
    case SET_CURRENT_WALLET:
      return state.set('wallet', action.wallet);
    case SET_DISPLAY:
      return state.set('currentDisplay', action.currentDisplay);
    case SET_IS_LOADING:
      return state.set('isLoading', action.isLoading);
    case SET_WALLET_FILENAME:
      return state.set('walletFileName', action.walletFileName);
    case SET_WALLET_LOCATION:
      return state.set('walletLocation', action.walletLocation);
    case SET_PASSWORD:
      return state.set('password', action.password);
    case SET_CONFIRMED_PASSWORD:
      return state.set('confirmedPassword', action.password);
    default:
      return state;
  }
}

/* ~=~=~=~=~=~=~=~=~=~=~=~= Helpers ~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= */
export const getWalletName = state => {
  const walletInitialization = get(state, 'walletInitialization');
  const fileName = walletInitialization.get('walletFileName')
  const walletName = fileName.split('.')
  return walletName[0]
}
