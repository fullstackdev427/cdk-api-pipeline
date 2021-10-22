import cdk = require('@aws-cdk/core');
import cognito = require('@aws-cdk/aws-cognito');
import { env } from 'process';
import s3assets = require('@aws-cdk/aws-s3-assets');
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';

export class OtherPartStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Cognito
        new cognito.UserPool(this, 'myuserpool', {
            userPoolName: 'picaroai-userpool',
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: 'Verify your email for our awesome app!',
                emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
                smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
            },
            signInAliases: {
                username: true,
                email: true
            },
        });

        // Construct an S3 asset from the ZIP located from directory up.
        new s3assets.Asset(this, 'MyS3', {
            path: `${__dirname}/../php.zip`,
        });
    
        // DynamoDB
        const table = new dynamodb.Table(this, 'Table', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
        });
        
        // API Gateway
        const api = new apigateway.RestApi(this, 'books-api');

        api.root.addMethod('ANY');

        const books = api.root.addResource('books');
        books.addMethod('GET');
        books.addMethod('POST');

        const book = books.addResource('{book_id}');
        book.addMethod('GET');
        book.addMethod('DELETE');

        // Configure log group for short retention
        const logGroup = new logs.LogGroup(api, 'LogGroup', {
            retention: logs.RetentionDays.ONE_WEEK,
        });

        // ALB 
        const vpc = new ec2.Vpc(this, 'vpc', {natGateways: 1});

        const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
        vpc,
        internetFacing: true,
        });

        // const listener = alb.addListener('Listener', {
        // port: 80,
        // open: true,
        // });
    }
}