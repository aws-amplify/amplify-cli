/* Amplify Params - DO NOT EDIT
	API_FINANCETRACKER_GRAPHQLAPIIDOUTPUT
	API_FINANCETRACKER_TRANSACTIONTABLE_ARN
	API_FINANCETRACKER_TRANSACTIONTABLE_NAME
	BUDGET_ALERT_TOPIC_ARN
	MONTHLY_REPORT_TOPIC_ARN
	ENV
	REGION
Amplify Params - DO NOT EDIT */ const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});

/**
 * Calculates totals from an array of transactions.
 * Returns { totalIncome, totalExpenses, balance, savingsRate }.
 */
function calculateTotals(transactions) {
  const { totalIncome, totalExpenses } = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'INCOME') {
        acc.totalIncome += transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        acc.totalExpenses += transaction.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 },
  );

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? parseFloat(((balance / totalIncome) * 100).toFixed(2)) : 0;

  return { totalIncome, totalExpenses, balance, savingsRate };
}

/**
 * Returns the Transaction table name from the environment variable.
 * Throws if not configured.
 */
function getTableName() {
  const tableName = process.env.API_FINANCETRACKER_TRANSACTIONTABLE_NAME;
  if (!tableName || tableName.includes('NONE')) {
    throw new Error('Transaction table name is not configured. Check the API_FINANCETRACKER_TRANSACTIONTABLE_NAME environment variable.');
  }
  return tableName;
}

/**
 * AppSync GraphQL resolver for calculating financial summary and sending notifications
 * @type {import('@types/aws-lambda').AppSyncResolverHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event, null, 2)}`);

  const fieldName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || event.args || {};

  console.log('Field Name:', fieldName);

  try {
    switch (fieldName) {
      case 'calculateFinancialSummary':
        return await calculateSummaryFromDB();

      case 'sendMonthlyReport':
        return await sendMonthlyReport(args);

      case 'sendBudgetAlert':
        return await sendBudgetAlert(args);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error('Handler Error:', error);

    // For calculateFinancialSummary, return zeros instead of null to avoid GraphQL errors
    if (fieldName === 'calculateFinancialSummary') {
      return { totalIncome: 0, totalExpenses: 0, balance: 0, savingsRate: 0 };
    }

    return { success: false, message: `Error: ${error.message}` };
  }
};

async function calculateSummaryFromDB() {
  const tableName = getTableName();

  const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
  const transactions = result.Items || [];
  console.log('Found transactions:', transactions.length);

  const summary = calculateTotals(transactions);
  console.log('Calculated summary:', summary);
  return summary;
}

async function sendMonthlyReport(args) {
  const email = args.email;
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const topicArn = process.env.MONTHLY_REPORT_TOPIC_ARN;
    if (!topicArn || topicArn === 'NONE') {
      throw new Error('Monthly report topic ARN not configured');
    }

    const tableName = getTableName();

    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    const transactions = result.Items || [];
    const summary = calculateTotals(transactions);

    await sns.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: '📊 Your Monthly Financial Report',
        Message: `Hello,

Here is your monthly financial report:

💰 Total Income: ${summary.totalIncome.toFixed(2)}
💸 Total Expenses: ${summary.totalExpenses.toFixed(2)}
💵 Balance: ${summary.balance.toFixed(2)}
📈 Savings Rate: ${summary.savingsRate}%

Total Transactions: ${transactions.length}

This report was generated on ${new Date().toLocaleDateString()}.

Best regards,
Finance Tracker Team`,
        MessageAttributes: {
          email: { DataType: 'String', StringValue: email },
        },
      }),
    );

    return {
      success: true,
      message: `Monthly report sent! Check ${email} for a confirmation email from AWS SNS, then click the button again.`,
    };
  } catch (error) {
    console.error('Error sending monthly report:', error);
    return { success: false, message: `Failed to send report: ${error.message}` };
  }
}

async function sendBudgetAlert(args) {
  const { email, category, exceeded } = args;

  try {
    const topicArn = process.env.BUDGET_ALERT_TOPIC_ARN;
    if (!topicArn || topicArn === 'NONE') {
      throw new Error('Budget alert topic ARN not configured');
    }

    const tableName = getTableName();

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'category = :category AND #type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':category': category, ':type': 'EXPENSE' },
      }),
    );

    const categoryTransactions = result.Items || [];
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

    await sns.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: `⚠️ Budget Alert: ${category}`,
        Message: `Hello,

⚠️ BUDGET ALERT ⚠️

You have exceeded your budget for ${category} by ${exceeded.toFixed(2)}.

Category: ${category}
Total Spent: ${totalSpent.toFixed(2)}
Number of Transactions: ${categoryTransactions.length}

Consider reviewing your spending in this category.

Best regards,
Finance Tracker Team`,
        MessageAttributes: {
          email: { DataType: 'String', StringValue: email },
          category: { DataType: 'String', StringValue: category },
          exceeded: { DataType: 'Number', StringValue: exceeded.toString() },
        },
      }),
    );

    return { success: true, message: 'Budget alert sent successfully!' };
  } catch (error) {
    console.error('Error sending budget alert:', error);
    return { success: false, message: `Failed to send alert: ${error.message}` };
  }
}
