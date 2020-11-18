import React, { useRef } from "react";
import AWS from 'aws-sdk'
import * as XLSX from 'xlsx';
import DataTable from 'react-data-table-component';
import { useState } from 'react';

function Upload() {

  const [columns, setColumns] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState([]);
  const processData = dataString => {
   
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
    
    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
      if (headers && row.length == headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            var letters = /^[a-zA-Z]+$/;
            if(d.match(letters))
            {
            //alert('Valid Numbers');
            }
            else
            {
              console.log("invalid");
              setErrorMsg('Invalid Application Id');
            }
            console.log(d);
            if (d[0] == '"')
              d = d.substring(1, d.length - 1);
            if (d[d.length - 1] == '"')
              d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }
 
        // remove the blank rows
        if (Object.values(obj).filter(x => x).length > 0) {
          list.push(obj);
        }
      }
    }
 
   
    // prepare columns list from headers
    const columns = headers.map(c => ({
      name: c,
      selector: c,
    }));
 
    setData(list);
    setColumns(columns);
  }
 
  const handleFileUpload = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });
      processData(data);
    };
    reader.readAsBinaryString(file);
  }

  const fileInput = useRef();
  const handleClick = (event) => {
    event.preventDefault();
    let file = fileInput.current.files[0];
    let newFileName = fileInput.current.files[0].name.replace(/\..+$/, "");
    AWS.config.update({
      accessKeyId: 'AKIAZSE2BSIWWF7I2Z4T',
      secretAccessKey: 'qUofFIsj+73ZTQoVUFt9Uad/sEPHg4Iwu+5hVYBn',
    })
    const myBucket = new AWS.S3({
      params: { Bucket: 'testsubha/test'},
      region: 'us-east-1',
    })
    const params = {
        ACL: 'public-read',
        Key: newFileName,
        ContentType: file.type,
        Body: file,
      }
    myBucket.putObject(params)
        .on('httpUploadProgress', (evt) => {
          // that's how you can keep track of your upload progress
          this.setState({
            progress: Math.round((evt.loaded / evt.total) * 100),
          })
        })
        .send((err) => {
           if (err) {
             // handle the error here
           }
        });
  };
  return (
    <>
      <form className='upload-steps' onSubmit={handleClick}>
        <label>
          Upload file:
          <input type="file"
        accept=".csv" type='file' ref={fileInput} onChange={handleFileUpload}
      />
        </label>
        <DataTable
        pagination
        highlightOnHover
        columns={columns}
        data={data}
      />
        <br />
        <div style={{fontSize:12,color:"red"}}>{errorMsg}</div>
        <button type='submit'>Upload</button>
      </form>
      
    </>
  );
}

export default Upload;
