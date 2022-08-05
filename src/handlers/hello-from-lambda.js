
const AWS = require('aws-sdk')
AWS.config.update({region:'ap-northeast-2'})
const s3 = new AWS.S3({apiVersion: '2006-03-01'})
const sharp = require('sharp')

exports.helloFromLambdaHandler = async (event, context) => {

    const Bucket= encodeURIComponent(event.Records[0].s3.bucket.name);
    const key =  encodeURIComponent(event.Records[0].s3.object.key);
    const dstBucketName = 'photo-dst-han';
    const snsRegion = {
      region: event.Records[0].awsRegion
    }
    const sns = new AWS.SNS(snsRegion);
    const topicArn = 'arn:aws:sns:ap-northeast-2:365730553675:mytest'
    

    const s3Object = await s3.getObject({
      Bucket: Bucket,
      Key: key
    }).promise()
    

    const data = await sharp(s3Object.Body)
      .resize(200)
      .jpeg({ mozjpeg: true })
      .toBuffer()
    
    const result = await s3.putObject({
      Bucket: dstBucketName, 
      Key: key,
      ContentType: 'image/jpeg',
      Body: data,
      ACL: 'public-read'
     }).promise()


    const messageData = {
          Message: "↓↓ 링크 ↓↓ \n\n" +
          `https://${dstBucketName}.s3.ap-northeast-2.amazonaws.com/${key}`,
          Subject: "테스트",
          TopicArn: topicArn
        }
        try {
          await sns.publish(messageData).promise();
        } catch (e) {
          console.log(e);
        }

      
}

