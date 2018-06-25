import React from 'react';
import { TextField } from 'material-ui';
import Button from './Button';

function setupSeedColumns() {
  const seedWords = seed.split(" ");
  let wordsPerColumn = Math.ceil(seedWords.length / 3);
  let seedColumns = [];

  if (seedWords.length) {
    let seedColumn = [];

    for (var i = 0; i < seedWords.length; i++) {

      seedColumn.push(seedWords[i]);

      if ((i+1) % wordsPerColumn == 0) {
        seedColumns.push(seedColumn);
        seedColumn = [];
      }
    }

    if (seedColumn.length != 0) {
      seedColumns.push(seedColumn);
    }
  }

  return seedColumns;
}

export function CreateAccountSlideBody(props) {

  const {
    seed,
    styles,
    slideCount,
    confirmSeedBackupStep,
    resetSeedBackupStep
  } = props;

  let count = 0;
  switch (slideCount) {
    case 0:
      return (
        <div>
          <div className={styles.prompt}>Write down the seed phrase and keep it secure. You will need it to import your account in case you ever reimport your wallet file.</div>
          {seed.length && <div className={styles.seedContainer}>
            {setupSeedColumns(seed).map(function(seedColumn) {
              return (<div>
                {seedColumn.map(function(seed) {
                  count++;
                  return <div><span className="label">{count}</span>{seed}</div>
                })}
              </div>) })}
          </div>}
        </div>
      ); 
    case 1:
      return (
        <div>
          <a href="javascript:;" onClick={resetSeedBackupStep}>Back to Seed Phrase</a>
          <div>In order to make sure that you properly backed up your seed phrase please type in the 7th word.</div>
          <TextField
            floatingLabelText="7th word"
            style={{ width: '100%' }}
            value={''}
            onChange={(_, seedWord) => confirmSeedBackupStep(seedWord)}
          />
        </div>
      )
  }
}

export function CreateAccountSlideFooter(props) {

  const {
    styles,
    confirmSeedBackupStep,
    isLoading,
    generateAndUpdate
  } = props;

  return (<div>
    <Button
      buttonTheme="primary"
      className={styles.nextButton}
      onClick={confirmSeedBackupStep}
      disabled={isLoading}
      small
    >
      Next
    </Button>
    <a href="javascript:;" className={styles.generate} onClick={generateAndUpdate}>Generate Another Seed Phrase</a>
  </div>)
}