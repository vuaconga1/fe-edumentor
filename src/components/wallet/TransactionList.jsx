import React from 'react';
import TransactionItem from './TransactionItem';

/**
 * TransactionList - Displays transaction history
 * Props:
 * - transactions: array - list of transaction objects
 */
const TransactionList = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <p className="text-lg">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
        Transaction History
      </h3>
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

export default TransactionList;
