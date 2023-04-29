// Set today's date as the default date
document.getElementById("date").valueAsDate = new Date();

// Get the form and transaction list elements
const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");

 
// Load transactions from local storage
let savedTransactions = [];
try {
  const parsedTransactions = JSON.parse(localStorage.getItem("transactions")) || [];
  savedTransactions = parsedTransactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date)
  }));
} catch (error) {
  console.error("Error parsing transactions from local storage:", error);
}

// Display saved transactions
savedTransactions.forEach(transaction => addTransactionToList(transaction));


// Handle form submission
transactionForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Add this line to prevent the form from refreshing the page

  const place = document.getElementById("place").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const date = new Date(document.getElementById("date").value);
  const bank = document.getElementById("bank").value;

  const transaction = { date, bank, place, amount };
  savedTransactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(savedTransactions));

  addTransactionToList(transaction);

  // Clear the form fields
  transactionForm.reset();
  document.getElementById("date").valueAsDate = new Date();
});


// Helper function to format the date as MM/DD/YYYY
function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
}

// Helper function to add a transaction to the list
function addTransactionToList(transaction) {
    const div = document.createElement("div");
    div.classList.add("transaction-item");
    div.innerHTML = `
      ${formatDate(transaction.date)}, ${transaction.bank}, ${transaction.place}, ${transaction.amount.toFixed(2) < 0 ? "-" : ""}$${Math.abs(transaction.amount).toFixed(2)}
    `;
    transactionList.appendChild(div);
}

const apiKey = "AIzaSyDFK2ykRW9hXo5tYiokjASx940M73Kvwo4";
const spreadsheetId = "1IqP7oPwXjP17xDWIJtHmt_f1NW8mgZS4sQ5aed4PQtk";

const exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", () => {
  exportTransactionsToGoogleSheets();
});

async function exportTransactionsToGoogleSheets() {
  const sheetTitle = `Transactions-${new Date().toISOString()}`;

  const createSheetRequest = {
    requests: [
      {
        addSheet: {
          properties: {
            title: sheetTitle,
          },
        },
      },
    ],
  };

  const createSheetResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createSheetRequest),
    }
  );

  const createSheetData = await createSheetResponse.json();
  const addSheetReply = createSheetData.replies?.[0]?.addSheet;
  const newSheetId = addSheetReply?.properties?.sheetId || addSheetReply?.properties?.gridProperties?.sheetId;

  const headers = ["Date", "Bank", "Place", "Amount"];
  const data = savedTransactions.map((transaction) => [
    formatDate(transaction.date),
    transaction.bank,
    transaction.place,
    transaction.amount.toFixed(2),
  ]);

  const updateCellsRequest = {
    requests: [
      {
        updateCells: {
          range: {
            sheetId: newSheetId,
            startRowIndex: 0,
            endRowIndex: data.length + 1,
            startColumnIndex: 0,
            endColumnIndex: headers.length,
          },
          rows: [
            {
              values: headers.map((header) => ({ userEnteredValue: { stringValue: header } })),
            },
            ...data.map((row) => ({
              values: row.map((value) => ({ userEnteredValue: { stringValue: value } })),
            })),
          ],
          fields: "userEnteredValue",
        },
      },
    ],
  };

  const updateCellsResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateCellsRequest),
    }
  );

  const updateCellsData = await updateCellsResponse.json();
  if (updateCellsData.replies) {
    alert("Transactions successfully exported to Google Sheets!");
  } else {
    alert("There was an error exporting transactions to Google Sheets.");
  }
}
