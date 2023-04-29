<?php
$transactions = $_POST['transactions'];

// Write the transactions to a CSV file
$file = fopen("transactions.csv", "w");
fwrite($file, "Date,Bank,Place,Amount\n");
foreach ($transactions as $transaction) {
  $line = implode(",", $transaction) . "\n";
  fwrite($file, $line);
}
fclose($file);

// Return a response to indicate success
$response = array('status' => 'success');
echo json_encode($response);
?>