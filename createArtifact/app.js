/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict'

const uuid4 = require("uuid4");
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;
const suffix_start = 1; 
const suffix_end = 10;



// Main Lambda entry point
exports.handler = async  (event) => {
  return await createArtifact(event);
};

const createArtifact = async function (event) {
  console.log("EVENT: ", JSON.stringify(event));
  const records = event["Records"];

  for(let record of records) {
    console.log("RECORD: ", record);
    let s3Params = {
      Bucket: record["s3"]["bucket"]["name"],
      Key: record["s3"]["object"]["key"]
    };
    console.log("PARAMS: ", JSON.stringify(s3Params));
    let metaData = await s3.headObject(s3Params).promise();
    console.log("metaData: ", JSON.stringify(metaData));

    // Store in a variable called partition a random integer between suffix_start and suffix_end
    let partition = Math.floor(Math.random() * (suffix_end - suffix_start + 1)) + suffix_start;
    
    let filename = metaData["Metadata"]['original_name'].split("/");
    
    filename = filename[filename.length-1];


    let item = {
      shardId: {S: `${metaData["Metadata"]['tenantid']}-${partition}`},
      artifactId: {S: uuid4()},
      data_type: {S: metaData["Metadata"]['data_type']},
      name: filename,
      username: {S: metaData["Metadata"]['username']},
      original_name: {S: metaData["Metadata"]['original_name']},
      path: {S: s3Params.Key},
      size: {N: `${metaData["ContentLength"]}`},
    };
    console.log("ITEM: ", item);
    let params = {
      TableName: `Artifact-${metaData["Metadata"]['tenantid']}`,
      Item: item
    };
    let response = await ddb.putItem(params).promise();
    console.log("RESPONSE: ", response);
    
    
    let messageJson = {
      "s3Name": s3Params.Bucket,
      "downloadKey" : s3Params.Key,
      "uploadPrefix" : `digests/${metaData["Metadata"]['tenantid']}/`,
      "outgoingMetadata" : {
            "tenant-id":  `${metaData["Metadata"]['tenantid']}`,
            "username": `${metaData["Metadata"]['username']}`
      }
    };
     
    const responseSNS = await publishToSNSTopic(messageJson);
    console.log("RESPONSE SNS: ", responseSNS);
    
  }
  
  return records;
};

const publishToSNSTopic = async function(messageJson){
    const sns = await new AWS.SNS();
    
    var params = {
        Message: JSON.stringify(messageJson), 
        TopicArn: "arn:aws:sns:eu-west-1:918199069718:development-binary-uploaded"
    };
    const response = await sns.publish(params).promise();
    return response;
  };