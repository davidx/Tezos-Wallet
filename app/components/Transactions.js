import React from 'react';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui';

import tezosLogo from '../../resources/tezosLogo.png';
import styles from './Transactions.css';

export default function Transactions({ transactions }) {
  function renderTableHeader() {
    return (
      <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
        <TableRow>
          <TableHeaderColumn>Amount</TableHeaderColumn>
          <TableHeaderColumn>Address</TableHeaderColumn>
          <TableHeaderColumn></TableHeaderColumn>
        </TableRow>
      </TableHeader>
    );
  }

  function renderTableRow(row, index) {
    const rowArray = Object.values(row);

    return (
      <TableRow key={index}>
        {
          rowArray.map((elem, rowArrIndex) => {
            return (
              <TableRowColumn key={`${elem}-${rowArrIndex}`}>
                <div className={styles.tableRowElement}>
                  {elem}
                  { rowArrIndex === 0 &&
                    <img
                      src={tezosLogo}
                      className={styles.tezosSymbol}
                    />
                  }
                </div>
              </TableRowColumn>
            );
          })
        }
        <TableRowColumn>
          <div className={styles.details}>Details</div>
        </TableRowColumn>
      </TableRow>
    );
  }

  return (
    <div className={styles.transactionsContainer}>
      <Table>
        {renderTableHeader()}
        <TableBody displayRowCheckbox={false}>
          {transactions.map(renderTableRow)}
        </TableBody>
      </Table>
    </div>
  );
}
