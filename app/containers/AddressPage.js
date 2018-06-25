// @flow
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { ms } from '../styles/helpers';

import Addresses from '../components/Addresses';
import ActionPanel from '../components/ActionPanel';
import AddAddressModal from '../components/AddAddressModal';
import MessageBar from '../components/MessageBar';
import {
  clearAccountRefreshInterval,
  setActiveTab as setActiveAddAddressTab,
  generateAndUpdate,
  closeAddAddressModal,
  importAddress,
  updatePrivateKey,
  updatePublicKey,
  updateUsername,
  updatePassPhrase,
  confirmPassPhrase,
  passPhrase,
  slideCount,
  updateSeed,
  confirmSeedBackupStep,
  resetSeedBackupStep,
  updateActivationCode,
  selectDefaultAccountOrOpenModal
} from '../reducers/address.duck';

type Props = {
  activeTabAddAddressTab: string,
  addAddressModalIsOpen: boolean,
  setActiveAddAddressTab: Function,
  generateAndUpdate: Function,
  closeAddAddressModal: Function,
  importAddress: Function,
  seed: string,
  username: string,
  passPhrase: string,
  privateKey: string,
  publicKey: string,
  isAddAddressLoading: boolean,
  updatePrivateKey: Function,
  updatePublicKey: Function,
  updateUsername: Function,
  updatePassPhrase: Function,
  updateSeed: Function,
  updateActivationCode: Function,
  confirmPassPhrase: Function,
  selectedAccountHash: string,
  selectDefaultAccountOrOpenModal: Function,
  message: Object,
  slideCount: number,
  confirmSeedBackupStep: Function,
  resetSeedBackupStep: Function
};

const Container = styled.div`
  display: flex;
  padding: ${ms(6)} ${ms(4)} ${ms(3)} ${ms(4)};
`;

class AddressPage extends Component<Props> {
  props: Props;

  componentDidMount() {
    this.props.selectDefaultAccountOrOpenModal();
  }

  componentWillUnmount() {
    clearAccountRefreshInterval();
  }

  render() {
    const {
      activeTabAddAddressTab,
      addAddressModalIsOpen,
      setActiveAddAddressTab,
      generateAndUpdate,
      closeAddAddressModal,
      importAddress,
      seed,
      slideCount,
      activationCode,
      username,
      passPhrase,
      privateKey,
      publicKey,
      isAddAddressLoading,
      updatePrivateKey,
      updatePublicKey,
      updateUsername,
      updatePassPhrase,
      confirmPassPhrase,
      updateSeed,
      updateActivationCode,
      selectedAccountHash,
      message,
      confirmSeedBackupStep,
      resetSeedBackupStep
    } = this.props;

    return (
      <Container>
        <Addresses />
        <ActionPanel />
        <AddAddressModal
          open={addAddressModalIsOpen}
          setActiveTab={setActiveAddAddressTab}
          generateAndUpdate={generateAndUpdate}
          closeModal={closeAddAddressModal}
          activeTab={activeTabAddAddressTab}
          importAddress={importAddress}
          seed={seed}
          activationCode={activationCode}
          username={username}
          passPhrase={passPhrase}
          privateKey={privateKey}
          publicKey={publicKey}
          isLoading={isAddAddressLoading}
          updatePrivateKey={updatePrivateKey}
          updatePublicKey={updatePublicKey}
          updateUsername={updateUsername}
          updatePassPhrase={updatePassPhrase}
          confirmPassPhrase={confirmPassPhrase}
          updateSeed={updateSeed}
          updateActivationCode={updateActivationCode}
          selectedAccountHash={selectedAccountHash}
          slideCount={slideCount}
          confirmSeedBackupStep={confirmSeedBackupStep}
          resetSeedBackupStep={resetSeedBackupStep}
        />
        <MessageBar message={message} />
      </Container>
    );
  }
}

function mapStateToProps({ address, message }) {
  return {
    activeTabAddAddressTab: address.get('activeTab'),
    addAddressModalIsOpen: address.get('open'),
    message: message.get('message'),
    seed: address.get('seed'),
    slideCount: address.get('slideCount'),
    activationCode: address.get('activationCode'),
    username: address.get('username'),
    passPhrase: address.get('passPhrase'),
    privateKey: address.get('privateKey'),
    publicKey: address.get('publicKey'),
    isAddAddressLoading: address.get('isLoading'),
    selectedAccountHash: address.get('selectedAccountHash')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setActiveAddAddressTab,
      generateAndUpdate,
      closeAddAddressModal,
      importAddress,
      updatePrivateKey,
      updatePublicKey,
      updateUsername,
      updatePassPhrase,
      confirmPassPhrase,
      updateSeed,
      updateActivationCode,
      selectDefaultAccountOrOpenModal,
      confirmSeedBackupStep,
      resetSeedBackupStep
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(AddressPage);
