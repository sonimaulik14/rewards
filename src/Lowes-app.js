import React, { useState, useEffect } from "react";
import fetch from './api/dataService';
import ReactTable from 'react-table';
import "./Lowes-app.css";
import _ from 'lodash';

function calResults(comingUseData) {
  // Calculate points per transaction

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pointsPerTrans = comingUseData.map(trans=> {
    let points = 0;
    let over100 = trans.amount - 100;
    
    if (over100 > 0) {     
      points += (over100 * 2);
    }    
    if (trans.amount > 50) {
      points += 50;      
    }
    const month = new Date(trans.TransDate).getMonth();
    return {...trans, points, month};
  });
               
  let byCustomer = {};
  let totalPointsByCust = {};
  pointsPerTrans.forEach(pointsPerTrans => {
    let {CustomerId, CustomerName, month, points} = pointsPerTrans;   
    if (!byCustomer[CustomerId]) {
      byCustomer[CustomerId] = [];      
    }    
    if (!totalPointsByCust[CustomerId]) {
      totalPointsByCust[CustomerName] = 0;
    }
    totalPointsByCust[CustomerName] += points;
    if (byCustomer[CustomerId][month]) {
      byCustomer[CustomerId][month].points += points;
      byCustomer[CustomerId][month].monthNumber = month;
      byCustomer[CustomerId][month].numTransactions++;      
    }
    else {
      
      byCustomer[CustomerId][month] = {
        CustomerId,
        CustomerName,
        monthNumber:month,
        month: months[month],
        numTransactions: 1,        
        points
      }
    }    
  });
  let tot = [];
  for (var custKey in byCustomer) {    
    byCustomer[custKey].forEach(cRow=> {
      tot.push(cRow);
    });    
  }
  let totByCustomer = [];
  for (custKey in totalPointsByCust) {    
    totByCustomer.push({
      CustomerName: custKey,
      points: totalPointsByCust[custKey]
    });    
  }
  return {
    summaryByCustomer: tot,
    pointsPerTrans,
    totalPointsByCustomer:totByCustomer
  };
}

function App() {
  const [transactionData, setTransactionData] = useState(null);
  
  const columns = [
    {
      Header:'Customer',
      accessor: 'CustomerName'      
    },    
    {
      Header:'Month',
      accessor: 'month'
    },
    {
      Header: "# of Transactions",
      accessor: 'numTransactions'
    },
    {
      Header:'Reward Points',
      accessor: 'points'
    }
  ];
  const totalsByColumns = [
    {
      Header:'Customer',
      accessor: 'CustomerName'      
    },    
    {
      Header:'Points',
      accessor: 'points'
    }
  ]

  function getIndividualTransactions(row) {
    let byCustMonth = _.filter(transactionData.pointsPerTrans, (tRow)=>{    
      return row.original.CustomerId === tRow.CustomerId && row.original.monthNumber === tRow.month;
    });
    return byCustMonth;
  }

  useEffect(() => { 
    fetch().then((data)=> {             
      const results = calResults(data);      
      setTransactionData(results);
    });
  },[]);


  if (transactionData == null) {
    return <div>Loading...</div>;   
  }

  return transactionData == null ?
    <div>Loading...</div> 
      :    
    <div>      
      
      <div className="container">
        <div className="row">
          <div className="col-10">
            <h2>Rewards by Customer Months</h2>
          </div>
        </div>
        <div className="row">
          <div className="col-8">
            <ReactTable
              data={transactionData.summaryByCustomer}
              defaultPageSize={5}
              columns={columns}
              SubComponent={row => {
                return (
                  <div>
                    
                      {getIndividualTransactions(row).map(tran=>{
                        return <div className="container">
                          <div className="row">
                            <div className="col-8">
                              <strong>Transaction Date:</strong> {tran.TransDate} - <strong>$</strong>{tran.amount} - <strong>Points: </strong>{tran.points}
                            </div>
                          </div>
                        </div>
                      })}                                    

                  </div>
                )
              }}
              />             
            </div>
          </div>
        </div>
        
        <div className="container">    
          <div className="row">
            <div className="col-10">
              <h2>Rewards Total by Customer Months</h2>
            </div>
          </div>      
          <div className="row">
            <div className="col-8">
              <ReactTable
                data={transactionData.totalPointsByCustomer}
                columns={totalsByColumns}
                defaultPageSize={5}                
              />
            </div>
          </div>
        </div>      
    </div>
  ;
}

export default App;
