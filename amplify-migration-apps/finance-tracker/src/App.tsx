import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, getCurrentUser, signUp, confirmSignUp } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import amplifyconfig from './amplifyconfiguration.json';
import './App.css';

Amplify.configure(amplifyconfig);
const client = generateClient();

// GraphQL queries and mutations
const listTransactions = /* GraphQL */ `
  query ListTransactions {
    listTransactions {
      items {
        id
        description
        amount
        type
        category
        date
        receiptUrl
      }
    }
  }
`;

const createTransaction = /* GraphQL */ `
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      description
      amount
      type
      category
      date
      receiptUrl
    }
  }
`;

const calculateFinancialSummaryQuery = /* GraphQL */ `
  query CalculateFinancialSummary {
    calculateFinancialSummary {
      totalIncome
      totalExpenses
      balance
      savingsRate
    }
  }
`;

const sendMonthlyReportMutation = /* GraphQL */ `
  mutation SendMonthlyReport($email: String!) {
    sendMonthlyReport(email: $email) {
      success
      message
    }
  }
`;

const sendBudgetAlertMutation = /* GraphQL */ `
  mutation SendBudgetAlert($email: String!, $category: String!, $exceeded: Float!) {
    sendBudgetAlert(email: $email, category: $category, exceeded: $exceeded) {
      success
      message
    }
  }
`;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  receiptUrl?: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      calculateSummary();
    }
  }, [transactions]);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.log('Not signed in');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      setNeedsConfirmation(true);
      alert('Sign up successful! Check your email for confirmation code.');
    } catch (error: any) {
      console.error('Error signing up:', error);
      alert(`Sign up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      alert('Email confirmed! You can now sign in.');
      setNeedsConfirmation(false);
      setAuthMode('signin');
    } catch (error: any) {
      console.error('Error confirming sign up:', error);
      alert(`Confirmation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signIn({ username: email, password });
      await checkUser();
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(`Sign in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setTransactions([]);
      setSummary(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const result: any = await client.graphql({ query: listTransactions });
      setTransactions(result.data.listTransactions.items);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!description || !amount || !category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      let receiptUrl = '';

      // Upload receipt to S3 if file is selected
      if (receiptFile) {
        const fileName = `receipts/${Date.now()}-${receiptFile.name}`;
        await uploadData({
          path: fileName,
          data: receiptFile,
        }).result;

        // Get the URL for the uploaded file
        const urlResult = await getUrl({ path: fileName });
        receiptUrl = urlResult.url.toString();
      }

      const input = {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date().toISOString(),
        receiptUrl: receiptUrl || undefined,
      };

      await client.graphql({
        query: createTransaction,
        variables: { input },
      });

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setReceiptFile(null);

      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = async () => {
    try {
      // Call Lambda function via GraphQL query (Lambda reads from DynamoDB)
      const result: any = await client.graphql({
        query: calculateFinancialSummaryQuery,
      });
      setSummary(result.data.calculateFinancialSummary);
    } catch (error) {
      console.error('Error calculating summary via Lambda:', error);
      // Don't use fallback - show error to user
      alert('Failed to calculate summary from Lambda. Check console for details.');
    }
  };

  const handleSendMonthlyReport = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userEmail = user.signInDetails?.loginId || email;

      console.log('Sending monthly report to:', userEmail);

      const result: any = await client.graphql({
        query: sendMonthlyReportMutation,
        variables: { email: userEmail },
      });

      console.log('Monthly report result:', result);

      if (result.data.sendMonthlyReport.success) {
        alert('✅ Monthly report sent to your email!');
      } else {
        alert('❌ ' + result.data.sendMonthlyReport.message);
      }
    } catch (error: any) {
      console.error('Error sending monthly report:', error);
      console.error('Error details:', error.errors || error.message);
      alert('Failed to send monthly report: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendBudgetAlert = async () => {
    if (!user) return;

    const alertCategory = prompt('Enter the budget category (e.g., Food, Entertainment):');
    if (!alertCategory) return;

    const exceededStr = prompt('How much did you exceed the budget by?');
    if (!exceededStr) return;

    const exceeded = parseFloat(exceededStr);
    if (isNaN(exceeded)) {
      alert('Please enter a valid number.');
      return;
    }

    try {
      setLoading(true);
      const userEmail = user.signInDetails?.loginId || email;

      const result: any = await client.graphql({
        query: sendBudgetAlertMutation,
        variables: { email: userEmail, category: alertCategory, exceeded },
      });

      if (result.data.sendBudgetAlert.success) {
        alert('✅ Budget alert sent to your email!');
      } else {
        alert('❌ ' + result.data.sendBudgetAlert.message);
      }
    } catch (error: any) {
      console.error('Error sending budget alert:', error);
      alert('Failed to send budget alert: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    if (needsConfirmation) {
      return (
        <div className="app-container">
          <h1>💰 Finance Tracker</h1>
          <div className="auth-container">
            <h2>Confirm Your Email</h2>
            <form onSubmit={handleConfirmSignUp}>
              <div className="form-group">
                <label>Confirmation Code</label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter code from email"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Email'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="app-container">
        <h1>💰 Finance Tracker</h1>
        <div className="auth-container">
          <div className="auth-tabs">
            <button className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>
              Sign In
            </button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
              Sign Up
            </button>
          </div>

          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
          )}

          <p className="demo-note">Demo: Uses Amplify Auth, API (GraphQL), Storage (S3), and Lambda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💰 Finance Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={handleSignOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      {summary && (
        <div className="summary-cards">
          <div className="card income">
            <h3>Total Income</h3>
            <p className="amount">${summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="card expense">
            <h3>Total Expenses</h3>
            <p className="amount">${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="card balance">
            <h3>Balance</h3>
            <p className="amount">${summary.balance.toFixed(2)}</p>
          </div>
          <div className="card savings">
            <h3>Savings Rate</h3>
            <p className="amount">{summary.savingsRate}%</p>
          </div>
        </div>
      )}

      <div className="email-actions">
        <button onClick={handleSendMonthlyReport} className="btn-email" disabled={loading}>
          📧 Email Monthly Report
        </button>
        <button onClick={handleSendBudgetAlert} className="btn-email" disabled={loading}>
          ⚠️ Send Budget Alert
        </button>
      </div>

      <div className="main-content">
        <div className="form-section">
          <h2>Add Transaction</h2>
          <form onSubmit={handleAddTransaction}>
            <div className="form-group">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Grocery shopping"
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Food, Salary, Entertainment"
              />
            </div>

            <div className="form-group">
              <label>Receipt (Optional - S3 Storage)</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </form>
        </div>

        <div className="transactions-section">
          <h2>Recent Transactions</h2>
          {loading && <p>Loading...</p>}
          {transactions.length === 0 && !loading && <p className="empty-state">No transactions yet. Add your first one!</p>}
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className={`transaction-item ${transaction.type.toLowerCase()}`}>
                <div className="transaction-info">
                  <h4>{transaction.description}</h4>
                  <p className="category">{transaction.category}</p>
                  <p className="date">{new Date(transaction.date).toLocaleDateString()}</p>
                  {transaction.receiptUrl && (
                    <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link">
                      📎 View Receipt
                    </a>
                  )}
                </div>
                <div className="transaction-amount">
                  <span className={transaction.type === 'INCOME' ? 'positive' : 'negative'}>
                    {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>🔧 Powered by: Amplify Auth • GraphQL API • S3 Storage • Lambda Functions • Custom Resources</p>
      </footer>
    </div>
  );
}

export default App;
